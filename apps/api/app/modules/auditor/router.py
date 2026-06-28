"""AI Smart Contract Auditor — API router (Phase 7)."""

import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.rate_limit import check_rate_limit
from app.models.auth import User
from app.schemas.audit import AuditDetail, AuditPublic, AuditSubmit
from app.schemas.common import ApiResponse, PaginationMeta, PaginationParams
from app.services.auditor.service import (
    create_audit,
    delete_audit,
    get_audit_for_user,
    list_user_audits,
    stream_audit_analysis,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auditor",
    tags=["auditor"],
    responses={401: {"description": "Authentication required"}},
)

_MAX_SOURCE_SIZE = 200_000  # characters


# ─── Submit + immediately analyze (SSE streaming) ─────────────────────────

@router.post(
    "/analyze",
    summary="Submit contract and stream AI analysis via SSE",
    description=(
        "Submits a Solidity contract and streams the AI security analysis back as "
        "Server-Sent Events. Each event is a JSON object with an `event` field "
        "('progress' | 'complete' | 'error')."
    ),
)
async def analyze_contract(
    body: AuditSubmit,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_rate_limit(request, bucket="auditor:analyze", limit=5, window_seconds=60)

    if len(body.source_code) > _MAX_SOURCE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Source code exceeds {_MAX_SOURCE_SIZE} character limit.",
        )

    audit = await create_audit(db, user, body)
    audit_id = audit.id

    async def sse_generator():
        try:
            async for chunk in stream_audit_analysis(
                db, audit_id, body.source_code, body.contract_name
            ):
                yield f"data: {chunk}\n\n"
        except Exception as exc:
            logger.exception("Auditor SSE stream failed")
            yield f"data: {json.dumps({'event': 'error', 'text': str(exc)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "X-Audit-Id": str(audit_id),
        },
    )


# ─── List user's audits ───────────────────────────────────────────────────

@router.get(
    "/history",
    response_model=ApiResponse[list[AuditPublic]],
    summary="List audit history for the authenticated user",
)
async def list_audits(
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    params = PaginationParams(page=page, page_size=page_size)
    items, total = await list_user_audits(db, user.id, params.page, params.page_size)
    total_pages = max(1, (total + params.page_size - 1) // params.page_size)
    meta = PaginationMeta(
        page=params.page,
        page_size=params.page_size,
        total=total,
        total_pages=total_pages,
    )
    return ApiResponse(
        data=[AuditPublic.model_validate(a) for a in items],
        meta=meta.model_dump(),
    )


# ─── Get single audit ─────────────────────────────────────────────────────

@router.get(
    "/{audit_id}",
    response_model=ApiResponse[AuditDetail],
    summary="Get full audit report by ID",
)
async def get_audit(
    audit_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    audit = await get_audit_for_user(db, audit_id, user.id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return ApiResponse(data=AuditDetail.model_validate(audit))


# ─── Get report (alias) ───────────────────────────────────────────────────

@router.get(
    "/report/{audit_id}",
    response_model=ApiResponse[AuditDetail],
    summary="Get audit report (alias for GET /auditor/{id})",
)
async def get_audit_report(
    audit_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_audit(audit_id, user, db)


# ─── Delete audit ────────────────────────────────────────────────────────

@router.delete(
    "/{audit_id}",
    response_model=ApiResponse[dict[str, bool]],
    summary="Delete an audit record",
)
async def remove_audit(
    audit_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_audit(db, audit_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Audit not found")
    return ApiResponse(data={"deleted": True})
