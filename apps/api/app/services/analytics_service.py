import hashlib

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import AnalyticsEvent
from app.models.audit import Audit
from app.models.auth import Session, User
from app.models.passport import SkillPassport
from app.models.project import Project
from app.schemas.analytics import (
    AnalyticsEventCreate,
    AnalyticsEventPublic,
    DashboardSummary,
)
from app.schemas.common import PaginationParams


async def record_event(
    db: AsyncSession,
    *,
    user: User | None,
    session: Session | None,
    body: AnalyticsEventCreate,
    ip_address: str | None,
    user_agent: str | None,
) -> AnalyticsEvent:
    ip_hash = hashlib.sha256(ip_address.encode()).hexdigest() if ip_address else None
    event = AnalyticsEvent(
        user_id=user.id if user else None,
        session_id=session.id if session else None,
        event_type=body.event_type,
        event_data=body.event_data,
        wallet_address=body.wallet_address or (user.wallet_address if user else None),
        ip_hash=ip_hash,
        user_agent=user_agent,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


async def list_events(
    db: AsyncSession, user: User, params: PaginationParams
) -> tuple[list[AnalyticsEvent], int]:
    base = select(AnalyticsEvent).where(AnalyticsEvent.user_id == user.id)
    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar_one()

    offset = (params.page - 1) * params.page_size
    result = await db.execute(
        base.order_by(AnalyticsEvent.created_at.desc()).offset(offset).limit(params.page_size)
    )
    return list(result.scalars().all()), total


async def get_dashboard(db: AsyncSession, user: User) -> DashboardSummary:
    projects_count = await db.scalar(
        select(func.count()).select_from(Project).where(Project.user_id == user.id)
    )
    passports_count = await db.scalar(
        select(func.count()).select_from(SkillPassport).where(SkillPassport.user_id == user.id)
    )
    audits_count = await db.scalar(
        select(func.count()).select_from(Audit).where(Audit.user_id == user.id)
    )
    completed_audits = await db.scalar(
        select(func.count())
        .select_from(Audit)
        .where(Audit.user_id == user.id, Audit.status == "complete")
    )
    minted_passports = await db.scalar(
        select(func.count())
        .select_from(SkillPassport)
        .where(SkillPassport.user_id == user.id, SkillPassport.status == "minted")
    )

    recent_result = await db.execute(
        select(AnalyticsEvent)
        .where(AnalyticsEvent.user_id == user.id)
        .order_by(AnalyticsEvent.created_at.desc())
        .limit(10)
    )
    recent = [AnalyticsEventPublic.model_validate(row) for row in recent_result.scalars().all()]

    return DashboardSummary(
        total_projects=projects_count or 0,
        total_passports=passports_count or 0,
        total_audits=audits_count or 0,
        completed_audits=completed_audits or 0,
        minted_passports=minted_passports or 0,
        recent_events=recent,
    )


async def get_session_by_jti(db: AsyncSession, jti: str) -> Session | None:
    result = await db.execute(select(Session).where(Session.jwt_jti == jti))
    return result.scalar_one_or_none()
