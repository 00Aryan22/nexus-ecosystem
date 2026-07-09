from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.ownership import ensure_owner
from app.api.pagination import pagination_params
from app.core.database import get_db
from app.core.rate_limit import check_rate_limit
from app.models.auth import User
from app.schemas.common import ApiResponse, PaginationParams
from app.schemas.passport import (
    PassportMintRequest,
    PassportReputationSummary,
    PassportVerifyRequest,
    SkillPassportCreate,
    SkillPassportPublic,
    SkillPassportUpdate,
)
from app.services.passport_service import (
    create_passport,
    get_passport,
    get_passport_by_wallet,
    get_passport_reputation,
    list_passports,
    mint_passport_nft,
    update_passport,
)
from app.services.project_service import pagination_meta

router = APIRouter(
    prefix="/passports",
    tags=["skill-passports"],
    responses={401: {"description": "Authentication required"}},
)


@router.post(
    "",
    response_model=ApiResponse[SkillPassportPublic],
    status_code=status.HTTP_201_CREATED,
    summary="Submit skill passport request",
    description=(
        "Create a skill passport entry with evidence URL for AI evaluation (Phase 5) "
        "and NFT mint (Phase 6)."
    ),
)
async def create_passport_endpoint(
    body: SkillPassportCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[SkillPassportPublic]:
    await check_rate_limit(request, bucket="passports:create", limit=100, window_seconds=60)
    passport = await create_passport(db, user, body)
    return ApiResponse(data=SkillPassportPublic.model_validate(passport))


@router.get(
    "",
    response_model=ApiResponse[list[SkillPassportPublic]],
    summary="List my skill passports",
    description=(
        "Paginated list of skill passports for the authenticated user, "
        "including linked NFT records when minted."
    ),
)
async def list_passports_endpoint(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> ApiResponse[list[SkillPassportPublic]]:
    items, total = await list_passports(db, user, params)
    return ApiResponse(
        data=[SkillPassportPublic.model_validate(p) for p in items],
        meta=pagination_meta(total, params).model_dump(),
    )


@router.get(
    "/history",
    response_model=ApiResponse[list[SkillPassportPublic]],
    summary="List passport history",
    description="Returns the authenticated user's passport history, including minted NFTs.",
)
async def history_passports_endpoint(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> ApiResponse[list[SkillPassportPublic]]:
    items, total = await list_passports(db, user, params)
    return ApiResponse(
        data=[SkillPassportPublic.model_validate(p) for p in items],
        meta=pagination_meta(total, params).model_dump(),
    )


@router.get(
    "/reputation",
    response_model=ApiResponse[PassportReputationSummary],
    summary="Get passport reputation summary",
    description="Returns aggregated reputation metrics for the authenticated user.",
)
async def reputation_passports_endpoint(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[PassportReputationSummary]:
    summary = await get_passport_reputation(db, user)
    return ApiResponse(data=PassportReputationSummary.model_validate(summary))


@router.get(
    "/wallet/{wallet_address}",
    response_model=ApiResponse[SkillPassportPublic],
    summary="Get latest passport for a wallet",
    description="Returns the latest skill passport associated with the provided wallet address.",
)
async def wallet_passport_endpoint(
    wallet_address: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[SkillPassportPublic]:
    passport = await get_passport_by_wallet(db, wallet_address)
    if passport is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Passport not found")
    ensure_owner(passport.user_id, user)
    return ApiResponse(data=SkillPassportPublic.model_validate(passport))


@router.post(
    "/verify",
    response_model=ApiResponse[SkillPassportPublic],
    summary="Verify a submitted passport",
    description="Updates evaluation metadata and status for an existing passport.",
)
async def verify_passport_endpoint(
    body: PassportVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[SkillPassportPublic]:
    passport = await get_passport(db, body.passport_id)
    if passport is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Passport not found")
    ensure_owner(passport.user_id, user)
    update_payload = SkillPassportUpdate(
        evaluation_score=body.evaluation_score,
        evaluation_notes=body.evaluation_notes,
        status=body.status,
    )
    updated = await update_passport(db, passport, update_payload)
    refreshed = await get_passport(db, updated.id)
    return ApiResponse(data=SkillPassportPublic.model_validate(refreshed))


@router.get(
    "/{passport_id}",
    response_model=ApiResponse[SkillPassportPublic],
    summary="Get skill passport by ID",
    description="Returns passport details if owned by the authenticated user.",
)
async def get_passport_endpoint(
    passport_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[SkillPassportPublic]:
    passport = await get_passport(db, passport_id)
    if passport is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Passport not found")
    ensure_owner(passport.user_id, user)
    return ApiResponse(data=SkillPassportPublic.model_validate(passport))


@router.post(
    "/{passport_id}/mint",
    response_model=ApiResponse[SkillPassportPublic],
    summary="Mint a soulbound skill passport NFT",
    description="Generates IPFS metadata and records a minted NFT receipt for the passport.",
)
async def mint_passport_endpoint(
    passport_id: UUID,
    request: Request,
    body: PassportMintRequest | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[SkillPassportPublic]:
    await check_rate_limit(
        request,
        bucket=f"passports:mint:{passport_id}",
        limit=20,
        window_seconds=60,
    )
    passport = await get_passport(db, passport_id)
    if passport is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Passport not found")
    ensure_owner(passport.user_id, user)
    minted = await mint_passport_nft(
        db,
        user,
        passport,
        wallet_address=body.wallet_address if body else None,
    )
    refreshed = await get_passport(db, minted.id)
    return ApiResponse(data=SkillPassportPublic.model_validate(refreshed))


@router.put(
    "/{passport_id}",
    response_model=ApiResponse[SkillPassportPublic],
    summary="Update skill passport",
    description="Update passport fields (e.g. evaluation results from admin/agent).",
)
async def update_passport_endpoint(
    passport_id: UUID,
    body: SkillPassportUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[SkillPassportPublic]:
    passport = await get_passport(db, passport_id)
    if passport is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Passport not found")
    ensure_owner(passport.user_id, user)
    updated = await update_passport(db, passport, body)
    refreshed = await get_passport(db, updated.id)
    return ApiResponse(data=SkillPassportPublic.model_validate(refreshed))
