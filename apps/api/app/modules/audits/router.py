from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.ownership import ensure_owner
from app.api.pagination import pagination_params
from app.core.database import get_db
from app.core.rate_limit import check_rate_limit
from app.models.auth import User
from app.schemas.audit import AuditDetail, AuditPublic, AuditSubmit
from app.schemas.common import ApiResponse, PaginationParams
from app.services.audit_service import get_audit, list_audits, submit_audit
from app.services.project_service import pagination_meta

router = APIRouter(
    prefix="/audits",
    tags=["audits"],
    responses={401: {"description": "Authentication required"}},
)


@router.post(
    "/submit",
    response_model=ApiResponse[AuditPublic],
    status_code=status.HTTP_201_CREATED,
    summary="Submit contract for audit",
    description=(
        "Queue a Solidity contract for AI + static analysis (processing in Phase 7). "
        "Max 200k characters."
    ),
)
async def submit_audit_endpoint(
    body: AuditSubmit,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[AuditPublic]:
    await check_rate_limit(request, bucket="audits:submit", limit=10, window_seconds=60)
    audit = await submit_audit(db, user, body)
    return ApiResponse(data=AuditPublic.model_validate(audit))


@router.get(
    "",
    response_model=ApiResponse[list[AuditPublic]],
    summary="List my audits",
    description="Paginated audit history for the authenticated user.",
)
async def list_audits_endpoint(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> ApiResponse[list[AuditPublic]]:
    items, total = await list_audits(db, user, params)
    return ApiResponse(
        data=[AuditPublic.model_validate(a) for a in items],
        meta=pagination_meta(total, params).model_dump(),
    )


@router.get(
    "/{audit_id}",
    response_model=ApiResponse[AuditDetail],
    summary="Get audit report",
    description="Returns audit metadata and report JSON if owned by the authenticated user.",
)
async def get_audit_endpoint(
    audit_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[AuditDetail]:
    audit = await get_audit(db, audit_id)
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")
    ensure_owner(audit.user_id, user)
    return ApiResponse(data=AuditDetail.model_validate(audit))


@router.get(
    "/{audit_id}/report",
    response_model=ApiResponse[AuditDetail],
    summary="Get audit report (alias)",
    description="Alias for GET /audits/{id} matching API strategy document.",
)
async def get_audit_report_endpoint(
    audit_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[AuditDetail]:
    return await get_audit_endpoint(audit_id, user, db)
