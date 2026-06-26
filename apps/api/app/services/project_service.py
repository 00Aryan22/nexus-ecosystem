import hashlib
import math
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.models.project import Project
from app.schemas.common import PaginationMeta, PaginationParams
from app.schemas.project import ProjectCreate, ProjectUpdate


def pagination_meta(total: int, params: PaginationParams) -> PaginationMeta:
    total_pages = max(1, math.ceil(total / params.page_size)) if total else 0
    return PaginationMeta(
        page=params.page,
        page_size=params.page_size,
        total=total,
        total_pages=total_pages,
    )


async def create_project(db: AsyncSession, user: User, body: ProjectCreate) -> Project:
    project = Project(
        user_id=user.id,
        name=body.name,
        industry=body.industry,
        problem_statement=body.problem_statement,
        usp=body.usp,
        stage=body.stage.value,
        is_public=body.is_public,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


async def list_projects(
    db: AsyncSession, user: User, params: PaginationParams
) -> tuple[list[Project], int]:
    base = select(Project).where(Project.user_id == user.id)
    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar_one()

    offset = (params.page - 1) * params.page_size
    result = await db.execute(
        base.order_by(Project.created_at.desc()).offset(offset).limit(params.page_size)
    )
    return list(result.scalars().all()), total


async def get_project(db: AsyncSession, project_id: UUID) -> Project | None:
    result = await db.execute(select(Project).where(Project.id == project_id))
    return result.scalar_one_or_none()


async def update_project(db: AsyncSession, project: Project, body: ProjectUpdate) -> Project:
    data = body.model_dump(exclude_unset=True)
    if "stage" in data and data["stage"] is not None:
        data["stage"] = data["stage"].value
    for key, value in data.items():
        setattr(project, key, value)
    await db.flush()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project: Project) -> None:
    await db.delete(project)


def hash_source_code(source_code: str) -> str:
    return hashlib.sha256(source_code.encode("utf-8")).hexdigest()
