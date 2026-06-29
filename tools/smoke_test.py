import asyncio
import os
import httpx
from httpx import ASGITransport
from app.main import app as fastapi_app
from datetime import UTC, datetime, timedelta

from app.core.database import get_session_factory
from app.core.security import create_access_token, new_jti
from app.models.auth import Session, User

API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000/api/v1")

async def create_token():
    factory = await get_session_factory()
    async with factory() as db:
        wallet = "0xfeedface00000000000000000000000000000000"
        from sqlalchemy import delete as sq_delete
        await db.execute(sq_delete(Session).where(Session.wallet_address == wallet))
        await db.execute(sq_delete(User).where(User.wallet_address == wallet))
        await db.commit()

        user = User(wallet_address=wallet, role="founder", is_active=True)
        db.add(user)
        await db.flush()

        jti = new_jti()
        expires_at = datetime.now(UTC) + timedelta(hours=1)
        session = Session(
            user_id=user.id,
            jwt_jti=jti,
            wallet_address=user.wallet_address,
            expires_at=expires_at,
            revoked=False,
        )
        db.add(session)
        await db.commit()

        token = create_access_token(user_id=str(user.id), wallet=user.wallet_address, jti=jti)
        return token

async def run():
    token = await create_token()
    cookies = {"nexus_access_token": token}
    transport = ASGITransport(app=fastapi_app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Create project
        resp = await client.post(f"{API_BASE}/projects", json={
            "name": "Smoke Test Project",
            "industry": "Web3",
            "problem_statement": "End-to-end smoke test project",
            "stage": "idea",
            "is_public": False,
        }, cookies=cookies, timeout=10.0)
        print("create project", resp.status_code, resp.json())

        proj_id = resp.json()["data"]["id"]

        # Get project
        resp = await client.get(f"{API_BASE}/projects/{proj_id}", cookies=cookies, timeout=10.0)
        print("get project", resp.status_code, resp.json())

        # Update project
        resp = await client.put(f"{API_BASE}/projects/{proj_id}", json={"stage": "building", "name": "Smoke Test Project v2"}, cookies=cookies, timeout=10.0)
        print("update project", resp.status_code, resp.json())

        # Delete project
        resp = await client.delete(f"{API_BASE}/projects/{proj_id}", cookies=cookies, timeout=10.0)
        print("delete project", resp.status_code, resp.json())

        # Create passport
        resp = await client.post(f"{API_BASE}/passports", json={
            "skill_category": "Engineering",
            "skill_name": "Smart Contracts",
            "evidence_url": "https://example.com/repo",
            "evidence_description": "Smoke test evidence",
        }, cookies=cookies, timeout=10.0)
        print("create passport", resp.status_code, resp.json())
        passport_id = resp.json()["data"]["id"]

        # Mint passport
        resp = await client.post(f"{API_BASE}/passports/{passport_id}/mint", cookies=cookies, timeout=10.0)
        print("mint passport", resp.status_code, resp.json())

        # Dashboard
        resp = await client.get(f"{API_BASE}/analytics/dashboard", cookies=cookies, timeout=10.0)
        print("dashboard", resp.status_code, resp.json())

if __name__ == "__main__":
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-py")
    os.environ.setdefault("PYTHONPATH", os.path.join(os.getcwd(), "apps/api"))
    asyncio.run(run())
