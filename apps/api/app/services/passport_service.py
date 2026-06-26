from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.auth import User
from app.models.passport import SkillPassport
from app.schemas.common import PaginationParams
from app.schemas.passport import SkillPassportCreate, SkillPassportUpdate


async def create_passport(db: AsyncSession, user: User, body: SkillPassportCreate) -> SkillPassport:
    passport = SkillPassport(
        user_id=user.id,
        skill_category=body.skill_category,
        skill_name=body.skill_name,
        evidence_url=str(body.evidence_url),
        evidence_description=body.evidence_description,
        evaluation_score=Decimal("0"),
        status="pending",
    )
    db.add(passport)
    await db.flush()
    await db.refresh(passport)
    return passport


async def list_passports(
    db: AsyncSession, user: User, params: PaginationParams
) -> tuple[list[SkillPassport], int]:
    base = select(SkillPassport).where(SkillPassport.user_id == user.id)
    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar_one()

    offset = (params.page - 1) * params.page_size
    result = await db.execute(
        base.options(selectinload(SkillPassport.nft_record))
        .order_by(SkillPassport.created_at.desc())
        .offset(offset)
        .limit(params.page_size)
    )
    return list(result.scalars().all()), total


async def get_passport(db: AsyncSession, passport_id: UUID) -> SkillPassport | None:
    result = await db.execute(
        select(SkillPassport)
        .options(selectinload(SkillPassport.nft_record))
        .where(SkillPassport.id == passport_id)
    )
    return result.scalar_one_or_none()


async def update_passport(
    db: AsyncSession, passport: SkillPassport, body: SkillPassportUpdate
) -> SkillPassport:
    data = body.model_dump(exclude_unset=True)
    if "evidence_url" in data and data["evidence_url"] is not None:
        data["evidence_url"] = str(data["evidence_url"])
    if "status" in data and data["status"] is not None:
        data["status"] = data["status"].value
    for key, value in data.items():
        setattr(passport, key, value)
    await db.flush()
    await db.refresh(passport)
    return passport
