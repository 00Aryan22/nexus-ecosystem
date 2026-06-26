import os
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token, new_jti
from app.main import app
from app.models.auth import Session, User

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest-only-not-production")

import asyncio


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def cleanup_engine():
    yield
    from app.core.database import engine

    await engine.dispose()


@pytest.fixture(autouse=True)
def _jwt_secret() -> None:
    os.environ["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "test-secret-key")


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    wallet = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    from sqlalchemy import delete

    await db_session.execute(delete(User).where(User.wallet_address == wallet))
    await db_session.commit()
    user = User(wallet_address=wallet, role="founder", is_active=True)
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture
async def auth_token(db_session: AsyncSession, test_user: User) -> str:
    jti = new_jti()
    expires_at = datetime.now(UTC) + timedelta(hours=1)
    session = Session(
        user_id=test_user.id,
        jwt_jti=jti,
        wallet_address=test_user.wallet_address,
        expires_at=expires_at,
        revoked=False,
    )
    db_session.add(session)
    await db_session.commit()
    return create_access_token(
        user_id=str(test_user.id),
        wallet=test_user.wallet_address,
        jti=jti,
    )


@pytest.fixture
async def auth_headers(auth_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
async def client(auth_headers: dict[str, str]) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers=auth_headers,
    ) as ac:
        yield ac


@pytest.fixture
async def other_user(db_session: AsyncSession) -> User:
    wallet = "0x1111111111111111111111111111111111111111"
    from sqlalchemy import delete

    await db_session.execute(delete(User).where(User.wallet_address == wallet))
    await db_session.commit()
    user = User(wallet_address=wallet, role="founder", is_active=True)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user
