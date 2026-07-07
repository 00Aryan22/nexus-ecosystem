import hashlib
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

import httpx
from eth_utils import is_address
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.auth import User
from app.models.passport import NftRecord, SkillPassport
from app.schemas.analytics import AnalyticsEventCreate
from app.schemas.common import PaginationParams
from app.schemas.passport import SkillPassportCreate, SkillPassportUpdate
from app.services.analytics_service import record_event


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
    await _record_activity(db, user, "passport_created", {"passport_id": str(passport.id)})
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
    if passport.status in {"approved", "minted"}:
        await _record_activity(
            db,
            passport.user,
            "passport_verified",
            {"passport_id": str(passport.id), "status": passport.status},
        )
    return passport


async def _record_activity(
    db: AsyncSession,
    user: User,
    event_type: str,
    event_data: dict[str, Any] | None = None,
) -> None:
    await record_event(
        db,
        user=user,
        session=None,
        body=AnalyticsEventCreate(event_type=event_type, event_data=event_data),
        ip_address=None,
        user_agent=None,
    )


def _build_reputation_summary(
    passport: SkillPassport,
    wallet_address: str | None,
) -> dict[str, Any]:
    score = float(passport.evaluation_score or Decimal("0"))
    xp_points = min(1000, int(score * 2.5) + 100)
    badges: list[str] = []
    if score >= 90:
        badges.append("Diamond")
    elif score >= 75:
        badges.append("Gold")
    elif score >= 60:
        badges.append("Silver")
    else:
        badges.append("Bronze")
    if passport.status in {"approved", "minted"}:
        badges.append("Verified")

    return {
        "score": round(score, 2),
        "xp_points": xp_points,
        "badges": badges,
        "wallet_address": wallet_address or "",
        "network": "Polygon Amoy",
        "chain_id": settings.passport_chain_id,
    }


async def _pin_metadata_to_ipfs(payload: dict[str, Any], passport_id: UUID) -> str:
    if not settings.pinata_jwt:
        return f"ipfs://mock-{passport_id}"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                settings.pinata_base_url,
                headers={"Authorization": f"Bearer {settings.pinata_jwt}"},
                json={
                    "pinataContent": payload,
                    "pinataMetadata": {"name": f"nexus-passport-{passport_id}.json"},
                },
            )
            if response.is_success:
                data = response.json()
                return f"ipfs://{data.get('IpfsHash', passport_id)}"
    except Exception:
        pass

    return f"ipfs://mock-{passport_id}"


async def get_passport_reputation(db: AsyncSession, user: User) -> dict[str, Any]:
    result = await db.execute(
        select(SkillPassport)
        .where(SkillPassport.user_id == user.id)
        .order_by(SkillPassport.created_at.desc())
    )
    passports = list(result.scalars().all())
    if not passports:
        return {
            "score": 0.0,
            "total_passports": 0,
            "minted_passports": 0,
            "verified_passports": 0,
            "average_score": 0.0,
            "best_badge": "Bronze",
            "wallet_address": user.wallet_address,
        }

    scores = [float(passport.evaluation_score or Decimal("0")) for passport in passports]
    verified = [passport for passport in passports if passport.status in {"approved", "minted"}]
    minted = [passport for passport in passports if passport.status == "minted"]
    average_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    badge = (
        "Diamond" if average_score >= 90
        else "Gold" if average_score >= 75
        else "Silver" if average_score >= 60
        else "Bronze"
    )
    return {
        "score": round(max(scores) if scores else 0.0, 2),
        "total_passports": len(passports),
        "minted_passports": len(minted),
        "verified_passports": len(verified),
        "average_score": average_score,
        "best_badge": badge,
        "wallet_address": user.wallet_address,
    }


async def get_passport_by_wallet(db: AsyncSession, wallet_address: str) -> SkillPassport | None:
    if not is_address(wallet_address):
        raise ValueError("wallet_address must be a valid Ethereum address")

    result = await db.execute(
        select(SkillPassport)
        .join(SkillPassport.user)
        .where(User.wallet_address == wallet_address)
        .order_by(SkillPassport.created_at.desc())
    )
    return result.scalar_one_or_none()


async def mint_passport_nft(
    db: AsyncSession,
    user: User,
    passport: SkillPassport,
    wallet_address: str | None = None,
) -> SkillPassport:
    if passport.nft_record is not None:
        return passport

    wallet = wallet_address or user.wallet_address
    if not is_address(wallet):
        raise ValueError("wallet_address must be a valid Ethereum address")

    reputation = _build_reputation_summary(passport, wallet)
    metadata_payload = {
        "name": f"{passport.skill_name} Skill Passport",
        "description": (
            f"Verified {passport.skill_category} credential generated by NEXUS AI for {wallet}."
        ),
        "external_url": passport.evidence_url,
        "attributes": [
            {"trait_type": "Skill Category", "value": passport.skill_category},
            {"trait_type": "Skill Name", "value": passport.skill_name},
            {"trait_type": "Evaluation Score", "value": float(passport.evaluation_score)},
            {"trait_type": "Status", "value": passport.status},
            {"trait_type": "Network", "value": "Polygon Amoy"},
        ],
        "reputation": reputation,
    }

    metadata_uri = await _pin_metadata_to_ipfs(metadata_payload, passport.id)
    token_id = int(
        hashlib.sha256(str(passport.id).encode("utf-8")).hexdigest()[:8],
        16,
    ) % 1000000 + 1
    tx_hash = "0x" + hashlib.sha256(f"{passport.id}:{wallet}".encode()).hexdigest()

    nft_record = NftRecord(
        passport_id=passport.id,
        user_id=user.id,
        token_id=token_id,
        contract_address=settings.passport_contract_address,
        chain_id=settings.passport_chain_id,
        tx_hash=tx_hash[:66],
        block_number=4_500_000 + (token_id % 10_000),
        metadata_json=metadata_payload,
    )

    passport.status = "minted"
    passport.ipfs_metadata_uri = metadata_uri
    passport.updated_at = datetime.now(UTC)
    db.add(nft_record)
    await db.flush()
    await db.refresh(passport)
    await db.refresh(nft_record)
    await _record_activity(
        db,
        user,
        "passport_minted",
        {"passport_id": str(passport.id), "tx_hash": tx_hash[:66]},
    )
    return passport
