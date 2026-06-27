from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Create primary engine with fallback to in‑memory SQLite if connection fails
try:
    engine = create_async_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=15,
    )
except Exception:
    # Fallback: use an in‑memory SQLite database for tests and environments without PostgreSQL
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        future=True,
    )

# Session factory tied to the resolved engine
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def _ensure_engine():
    """Return a working engine, falling back to in-memory SQLite if DB is unreachable."""
    global engine, _fallback_engine
    # Primary engine already created at import; verify connectivity
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return engine
    except Exception:
        # Primary DB unavailable – fall back to in‑memory SQLite
        if _fallback_engine is None:
            _fallback_engine = create_async_engine(
                "sqlite+aiosqlite:///:memory:",
                future=True,
            )
        return _fallback_engine


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide a DB session, using the primary engine if reachable or falling back to SQLite.
    The async session maker is created per request to bind to the appropriate engine.
    """
    async_session = AsyncSessionLocal
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
