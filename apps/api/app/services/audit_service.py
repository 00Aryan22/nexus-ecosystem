from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import Audit
from app.models.auth import User
from app.schemas.audit import AuditSubmit
from app.schemas.common import PaginationParams
from app.services.project_service import hash_source_code


async def submit_audit(db: AsyncSession, user: User, body: AuditSubmit) -> Audit:
    audit = Audit(
        user_id=user.id,
        contract_name=body.contract_name,
        source_code=body.source_code,
        source_hash=hash_source_code(body.source_code),
        status="queued",
    )
    db.add(audit)
    await db.flush()
    await db.refresh(audit)
    return audit


async def list_audits(
    db: AsyncSession, user: User, params: PaginationParams
) -> tuple[list[Audit], int]:
    base = select(Audit).where(Audit.user_id == user.id)
    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar_one()

    offset = (params.page - 1) * params.page_size
    result = await db.execute(
        base.order_by(Audit.created_at.desc()).offset(offset).limit(params.page_size)
    )
    return list(result.scalars().all()), total


async def get_audit(db: AsyncSession, audit_id: UUID) -> Audit | None:
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    return result.scalar_one_or_none()
