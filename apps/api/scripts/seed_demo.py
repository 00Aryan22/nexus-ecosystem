"""Seed demo data for hackathon demos. Run from repo root:

cd apps/api && python -m scripts.seed_demo
"""

from __future__ import annotations

import asyncio
import sys
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.analytics import AnalyticsEvent
from app.models.audit import Audit
from app.models.auth import User
from app.models.passport import SkillPassport
from app.models.project import Project
from app.services.project_service import hash_source_code

DEMO_WALLET = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
SAMPLE_CONTRACT = """
pragma solidity ^0.8.20;
contract DemoToken {
    mapping(address => uint256) public balances;
    function mint(address to, uint256 amount) external { balances[to] += amount; }
}
"""


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.wallet_address == DEMO_WALLET))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(wallet_address=DEMO_WALLET, role="founder", username="demo_founder")
            db.add(user)
            await db.flush()
            print(f"Created demo user {user.id}")
        else:
            print(f"Using existing demo user {user.id}")

        projects = [
            Project(
                user_id=user.id,
                name="Nexus AI Startup OS",
                industry="Web3 / AI",
                problem_statement="Founders need AI copilots for planning, skills, and audits.",
                usp="Wallet-native startup operating system with soulbound skill NFTs.",
                stage="building",
                is_public=True,
            ),
            Project(
                user_id=user.id,
                name="Polygon DeFi Analytics",
                industry="DeFi",
                problem_statement="Retail users cannot assess smart contract risk quickly.",
                stage="validated",
            ),
        ]
        for project in projects:
            db.add(project)

        passport = SkillPassport(
            user_id=user.id,
            skill_category="Product",
            skill_name="Web3 Product Strategy",
            evidence_url="https://example.com/portfolio",
            evidence_description="Led 2 hackathon-winning teams.",
            evaluation_score=Decimal("87.5"),
            status="approved",
        )
        db.add(passport)

        audit = Audit(
            user_id=user.id,
            contract_name="DemoToken",
            source_code=SAMPLE_CONTRACT,
            source_hash=hash_source_code(SAMPLE_CONTRACT),
            status="complete",
            critical_count=0,
            high_count=1,
            medium_count=2,
            low_count=3,
            info_count=1,
            overall_risk="medium",
            report_summary="Reentrancy risk low; access control on mint needs review.",
            report_json={"findings": [{"severity": "high", "title": "Unrestricted mint"}]},
            completed_at=datetime.now(UTC),
        )
        db.add(audit)

        db.add(
            AnalyticsEvent(
                user_id=user.id,
                event_type="demo_seed",
                event_data={"source": "seed_demo.py"},
                wallet_address=DEMO_WALLET,
            )
        )
        db.add(
            AnalyticsEvent(
                user_id=user.id,
                event_type="dashboard_view",
                event_data={"page": "/dashboard"},
                wallet_address=DEMO_WALLET,
                created_at=datetime.now(UTC) - timedelta(hours=1),
            )
        )

        await db.commit()
        print("Demo seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
