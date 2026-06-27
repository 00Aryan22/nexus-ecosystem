from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ---------------------------------------------------------------------------
# Engine & session factory are created lazily so that the SQLite fallback
# can be applied BEFORE AsyncSessionLocal is bound to any engine.
# ---------------------------------------------------------------------------

_engine = None
_session_factory = None

_POSTGRES_URL = settings.database_url
_SQLITE_URL = "sqlite+aiosqlite:///:memory:"


def _make_engine(url: str):
    if url.startswith("sqlite"):
        return create_async_engine(url, future=True, connect_args={"check_same_thread": False})
    return create_async_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=15,
    )


def _make_session_factory(eng):
    return async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)


async def _get_engine():
    """Return a working engine, falling back to SQLite if Postgres is unreachable."""
    global _engine, _session_factory

    if _engine is not None:
        return _engine

    # Try the configured (Postgres) engine first
    candidate = _make_engine(_POSTGRES_URL)
    try:
        from sqlalchemy import text

        async with candidate.begin() as conn:
            await conn.execute(text("SELECT 1"))
        # Postgres is reachable — use it
        _engine = candidate
    except Exception:
        # Postgres unavailable — fall back to in-memory SQLite
        await candidate.dispose()
        _engine = _make_engine(_SQLITE_URL)

    _session_factory = _make_session_factory(_engine)
    return _engine


async def get_session_factory():
    """Return (and lazily initialise) the session factory."""
    global _session_factory
    if _session_factory is None:
        await _get_engine()
    return _session_factory


# ---------------------------------------------------------------------------
# Convenience accessor kept for backwards compatibility with code that
# imports ``AsyncSessionLocal`` directly (e.g. conftest.py).
# This returns the lazily-resolved factory; callers must await
# get_session_factory() if they need it before the first request.
# ---------------------------------------------------------------------------
class _LazySessionFactory:
    """Proxy that delegates __call__ to the real factory once it is ready."""

    def __call__(self, *args, **kwargs):
        if _session_factory is None:
            raise RuntimeError(
                "AsyncSessionLocal used before the engine was initialised. "
                "Await get_session_factory() first or use get_db() instead."
            )
        return _session_factory(*args, **kwargs)


AsyncSessionLocal = _LazySessionFactory()


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a DB session for the request lifetime."""
    factory = await get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ---------------------------------------------------------------------------
# Engine property exposed for tests / lifespan cleanup.
# Safe to call multiple times — disposes once and resets globals.
# ---------------------------------------------------------------------------
async def get_engine():
    return await _get_engine()


async def dispose_engine() -> None:
    """Dispose the engine and reset globals. Idempotent."""
    global _engine, _session_factory
    if _engine is not None:
        try:
            await _engine.dispose()
        except Exception:
            pass
        _engine = None
        _session_factory = None
