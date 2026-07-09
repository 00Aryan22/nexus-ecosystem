from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.passport import NftRecord, SkillPassport
from app.services.passport_service import (
    get_passport_by_wallet,
    get_passport_reputation,
    mint_passport_nft,
)


@pytest.mark.asyncio
async def test_get_passport_reputation_empty(db_session: AsyncSession, test_user) -> None:
    result = await get_passport_reputation(db_session, test_user)
    assert result["score"] == 0.0
    assert result["total_passports"] == 0
    assert result["minted_passports"] == 0
    assert result["verified_passports"] == 0
    assert result["average_score"] == 0.0
    assert result["best_badge"] == "Bronze"
    assert result["wallet_address"] == test_user.wallet_address


@pytest.mark.asyncio
async def test_get_passport_reputation_with_mixed_passports(
    db_session: AsyncSession, test_user,
) -> None:
    for score, status in [(85.0, "pending"), (92.0, "approved"), (70.0, "minted")]:
        p = SkillPassport(
            user_id=test_user.id,
            skill_category="Engineering",
            skill_name=f"Skill {score}",
            evidence_url="https://example.com",
            evaluation_score=Decimal(str(score)),
            status=status,
        )
        db_session.add(p)
    await db_session.flush()

    result = await get_passport_reputation(db_session, test_user)
    assert result["total_passports"] == 3
    assert result["minted_passports"] == 1
    assert result["verified_passports"] == 2
    assert result["score"] == 92.0
    assert result["average_score"] == pytest.approx(82.33, abs=0.01)
    assert result["best_badge"] == "Gold"


@pytest.mark.asyncio
async def test_get_passport_by_wallet_invalid_address() -> None:
    with pytest.raises(ValueError, match="wallet_address must be a valid Ethereum address"):
        await get_passport_by_wallet(None, "not-a-valid-address")


@pytest.mark.asyncio
async def test_get_passport_by_wallet_not_found(
    db_session: AsyncSession, test_user,
) -> None:
    result = await get_passport_by_wallet(
        db_session, "0x0000000000000000000000000000000000000001"
    )
    assert result is None


@pytest.mark.asyncio
async def test_get_passport_by_wallet_found(
    db_session: AsyncSession, test_user,
) -> None:
    passport = SkillPassport(
        user_id=test_user.id,
        skill_category="Engineering",
        skill_name="Solidity",
        evidence_url="https://example.com",
        evidence_description="Test",
        evaluation_score=Decimal("85"),
        status="approved",
    )
    db_session.add(passport)
    await db_session.flush()

    result = await get_passport_by_wallet(db_session, test_user.wallet_address)
    assert result is not None
    assert result.id == passport.id
    assert result.skill_name == "Solidity"


@pytest.mark.asyncio
async def test_mint_passport_nft_duplicate_mint_returns_existing(
    db_session: AsyncSession, test_user,
) -> None:
    passport = SkillPassport(
        user_id=test_user.id,
        skill_category="Engineering",
        skill_name="Solidity",
        evidence_url="https://example.com",
        evaluation_score=Decimal("95"),
        status="minted",
        ipfs_metadata_uri="ipfs://existing",
        updated_at=datetime.now(UTC),
    )
    db_session.add(passport)
    await db_session.flush()

    nft = NftRecord(
        passport_id=passport.id,
        user_id=test_user.id,
        token_id=1,
        contract_address="0x0000000000000000000000000000000000000000",
        chain_id=80002,
        tx_hash="0xexisting",
        block_number=4_500_001,
        metadata_json={},
    )
    db_session.add(nft)
    await db_session.flush()

    passport.nft_record = nft

    result = await mint_passport_nft(db_session, test_user, passport)
    assert result.status == "minted"
    assert result.ipfs_metadata_uri == "ipfs://existing"
