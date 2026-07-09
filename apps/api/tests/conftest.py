import os

# Force SQLite in-memory BEFORE any engine/settings imports
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest-only-not-production")

from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

# Ensure all models are registered with Base.metadata before create_all
import app.models  # noqa: F401  (side-effect: registers all ORM models)
from app.core.security import create_access_token, new_jti
from app.main import app
from app.models.auth import Session, User


# ---------------------------------------------------------------------------
# Engine / table setup — runs once for the entire session before any test.
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Initialise the engine (SQLite fallback when Postgres is unavailable)
    and create all tables so tests can run without a real database."""

    from sqlalchemy import text  # noqa: E402

    from app.core.database import Base, get_engine

    # Force engine initialisation
    engine = await get_engine()

    # For SQLite we need to create tables; Postgres tables already exist via
    # Alembic in CI, but creating them again is harmless (checkfirst=True).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure new columns exist on existing tables (PostgreSQL)
        try:
            await conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS default_llm_provider "
                    "VARCHAR(30) NOT NULL DEFAULT 'gemini'"
                )
            )
        except Exception as e:
            print(f"Warning: Could not add default_llm_provider column: {e}")
        try:
            await conn.execute(
                text(
                    "ALTER TABLE founder_conversations ADD COLUMN IF NOT EXISTS is_pinned "
                    "BOOLEAN NOT NULL DEFAULT false"
                )
            )
        except Exception as e:
            print(f"Warning: Could not add is_pinned column: {e}")
        try:
            await conn.execute(
                text(
                    "ALTER TABLE founder_conversations ADD COLUMN IF NOT EXISTS is_archived "
                    "BOOLEAN NOT NULL DEFAULT false"
                )
            )
        except Exception as e:
            print(f"Warning: Could not add is_archived column: {e}")
        try:
            await conn.execute(
                text(
                    "ALTER TABLE user_ai_settings ADD COLUMN IF NOT EXISTS memory_enabled "
                    "BOOLEAN NOT NULL DEFAULT true"
                )
            )
        except Exception as e:
            print(f"Warning: Could not add memory_enabled column: {e}")
        try:
            await conn.execute(
                text(
                    "ALTER TABLE user_ai_settings ADD COLUMN IF NOT EXISTS max_retrieved_docs "
                    "INTEGER NOT NULL DEFAULT 5"
                )
            )
        except Exception as e:
            print(f"Warning: Could not add max_retrieved_docs column: {e}")

    # Clear any existing data so test sessions start from a clean state.
    # Skip clearing on SQLite (in-memory), always clear on PostgreSQL
    try:
        db_url = str(engine.url)
        if "postgresql" in db_url:
            async with engine.begin() as conn:
                # Disable and re-enable foreign key constraints for PostgreSQL
                await conn.execute(text("SET session_replication_role = 'replica'"))
                for table in reversed(Base.metadata.sorted_tables):
                    stmt = delete(table)
                    await conn.execute(stmt)
                await conn.execute(text("SET session_replication_role = 'origin'"))
    except Exception as e:
        print(f"Warning: Could not clear tables: {e}")

    yield

    # Tear down
    from app.core.database import dispose_engine

    await dispose_engine()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def _jwt_secret() -> None:
    os.environ["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "test-secret-key")


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    from app.core.database import get_session_factory

    factory = await get_session_factory()
    async with factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    import hashlib
    import uuid
    # Generate deterministic but unique wallet addresses that fit VARCHAR(42)
    wallet = f"0x{hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()[:40]}"
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
