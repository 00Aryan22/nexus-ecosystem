from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_token_from_request
from app.api.pagination import pagination_params
from app.core.database import get_db
from app.core.rate_limit import check_rate_limit
from app.core.security import TokenError, decode_access_token
from app.models.auth import User
from app.schemas.analytics import AnalyticsEventCreate, AnalyticsEventPublic, DashboardSummary
from app.schemas.common import ApiResponse, PaginationParams
from app.services.analytics_service import (
    get_dashboard,
    get_session_by_jti,
    list_events,
    record_event,
)
from app.services.project_service import pagination_meta

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    responses={401: {"description": "Authentication required"}},
)


@router.get(
    "/dashboard",
    response_model=ApiResponse[DashboardSummary],
    summary="Analytics dashboard summary",
    description="Aggregated counts and recent events for the authenticated user.",
)
async def analytics_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[DashboardSummary]:
    summary = await get_dashboard(db, user)
    return ApiResponse(data=summary)


@router.post(
    "/events",
    response_model=ApiResponse[AnalyticsEventPublic],
    summary="Record analytics event",
    description="Ingest a product analytics event scoped to the authenticated user session.",
)
async def create_analytics_event(
    body: AnalyticsEventCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[AnalyticsEventPublic]:
    await check_rate_limit(request, bucket="analytics:events", limit=100, window_seconds=60)

    session = None
    token = await get_token_from_request(request)
    if token:
        try:
            payload = decode_access_token(token)
            jti = payload.get("jti")
            if jti:
                session = await get_session_by_jti(db, jti)
        except TokenError:
            pass

    event = await record_event(
        db,
        user=user,
        session=session,
        body=body,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return ApiResponse(data=AnalyticsEventPublic.model_validate(event))


@router.get(
    "/events",
    response_model=ApiResponse[list[AnalyticsEventPublic]],
    summary="List analytics events",
    description="Paginated analytics events for the authenticated user.",
)
async def list_analytics_events(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> ApiResponse[list[AnalyticsEventPublic]]:
    items, total = await list_events(db, user, params)
    return ApiResponse(
        data=[AnalyticsEventPublic.model_validate(e) for e in items],
        meta=pagination_meta(total, params).model_dump(),
    )
