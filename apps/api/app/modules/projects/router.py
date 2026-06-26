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
from app.schemas.project import ProjectCreate, ProjectPublic, ProjectUpdate
from app.services.project_service import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    pagination_meta,
    update_project,
)

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={401: {"description": "Authentication required"}},
)


@router.post(
    "",
    response_model=ApiResponse[ProjectPublic],
    status_code=status.HTTP_201_CREATED,
    summary="Create a startup project",
    description="Create a new startup project owned by the authenticated user.",
)
async def create_project_endpoint(
    body: ProjectCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ProjectPublic]:
    await check_rate_limit(request, bucket="projects:create", limit=100, window_seconds=60)
    project = await create_project(db, user, body)
    return ApiResponse(data=ProjectPublic.model_validate(project))


@router.get(
    "",
    response_model=ApiResponse[list[ProjectPublic]],
    summary="List my projects",
    description="Paginated list of projects owned by the authenticated user.",
)
async def list_projects_endpoint(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> ApiResponse[list[ProjectPublic]]:
    await check_rate_limit(request, bucket="projects:list", limit=100, window_seconds=60)
    items, total = await list_projects(db, user, params)
    return ApiResponse(
        data=[ProjectPublic.model_validate(p) for p in items],
        meta=pagination_meta(total, params).model_dump(),
    )


@router.get(
    "/{project_id}",
    response_model=ApiResponse[ProjectPublic],
    summary="Get project by ID",
    description="Returns a project if owned by the authenticated user.",
)
async def get_project_endpoint(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ProjectPublic]:
    project = await get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    ensure_owner(project.user_id, user)
    return ApiResponse(data=ProjectPublic.model_validate(project))


@router.put(
    "/{project_id}",
    response_model=ApiResponse[ProjectPublic],
    summary="Update project",
    description="Update fields on a project owned by the authenticated user.",
)
async def update_project_endpoint(
    project_id: UUID,
    body: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[ProjectPublic]:
    project = await get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    ensure_owner(project.user_id, user)
    updated = await update_project(db, project, body)
    return ApiResponse(data=ProjectPublic.model_validate(updated))


@router.delete(
    "/{project_id}",
    response_model=ApiResponse[dict],
    summary="Delete project",
    description="Permanently delete a project owned by the authenticated user.",
)
async def delete_project_endpoint(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[dict]:
    project = await get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    ensure_owner(project.user_id, user)
    await delete_project(db, project)
    return ApiResponse(data={"deleted": True, "id": str(project_id)})
