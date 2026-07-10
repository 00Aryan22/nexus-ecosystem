"""Verify all migrations run without errors — works on both SQLite and PostgreSQL."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import text


async def _table_exists(conn, table: str) -> bool:
    """Check if a table exists — compatible with SQLite and PostgreSQL."""
    try:
        # Try information_schema (PostgreSQL, MySQL)
        result = await conn.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = :t"
            ),
            {"t": table},
        )
        if result.scalar_one_or_none() is not None:
            return True
    except Exception:
        pass

    try:
        # Fallback: SQLite
        result = await conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:t"),
            {"t": table},
        )
        if result.scalar_one_or_none() is not None:
            return True
    except Exception:
        pass

    # Universal fallback: just try to query the table
    try:
        await conn.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
        return True
    except Exception:
        return False


async def _get_columns(conn, table: str) -> set[str]:
    """Return column names for a table — compatible with SQLite and PostgreSQL."""
    # Try information_schema (PostgreSQL)
    try:
        result = await conn.execute(
            text("SELECT column_name FROM information_schema.columns WHERE table_name = :t"),
            {"t": table},
        )
        cols = {row[0] for row in result.fetchall()}
        if cols:
            return cols
    except Exception:
        pass

    # Fallback: SQLite PRAGMA
    try:
        result = await conn.execute(text(f"PRAGMA table_info({table})"))
        return {row[1] for row in result.fetchall()}
    except Exception:
        return set()


@pytest.mark.asyncio
async def test_migration_chain_runs_cleanly(setup_database) -> None:  # noqa: ANN001
    """Verify all expected tables exist after setup_database fixture runs."""
    from app.core.database import get_engine

    engine = await get_engine()

    all_tables = [
        # Auth
        "users",
        "wallets",
        "sessions",
        # Business
        "projects",
        "skill_passports",
        "nft_records",
        "audits",
        "analytics_events",
        # Founder agent
        "founder_conversations",
        "founder_messages",
        "startup_plans",
        "usage_stats",
        # Phase 6+
        "knowledge_documents",
        "user_ai_settings",
    ]

    async with engine.begin() as conn:
        for table in all_tables:
            assert await _table_exists(conn, table), (
                f"Table '{table}' missing after setup_database fixture"
            )

        # Verify user_ai_settings has the memory columns (migration 008)
        cols = await _get_columns(conn, "user_ai_settings")
        for expected_col in ("memory_enabled", "max_retrieved_docs"):
            assert expected_col in cols, f"user_ai_settings missing column '{expected_col}'"

        # Verify users table has default_llm_provider (migration 010)
        user_cols = await _get_columns(conn, "users")
        assert "default_llm_provider" in user_cols, (
            "users table missing 'default_llm_provider' (migration 010)"
        )

        # Verify founder_conversations has is_pinned, is_archived (migration 009)
        fc_cols = await _get_columns(conn, "founder_conversations")
        assert "is_pinned" in fc_cols, "founder_conversations missing 'is_pinned' (migration 009)"
        assert "is_archived" in fc_cols, (
            "founder_conversations missing 'is_archived' (migration 009)"
        )


@pytest.mark.asyncio
async def test_user_ai_settings_crud() -> None:
    """Verify CRUD operations work on the user_ai_settings table."""
    from app.core.database import get_session_factory

    factory = await get_session_factory()
    user_id = uuid.uuid4()
    settings_id = uuid.uuid4()

    async with factory() as session:
        try:
            await session.execute(
                text(
                    "INSERT INTO users "
                    "(id, wallet_address, role, is_active, default_llm_provider) "
                    "VALUES (:id, :wallet, 'founder', true, 'gemini')"
                ),
                {"id": str(user_id), "wallet": f"0x{uuid.uuid4().hex[:40]}"},
            )
            await session.execute(
                text(
                    "INSERT INTO user_ai_settings "
                    "(id, user_id, default_provider, default_model, temperature, top_p, "
                    "max_tokens, streaming_enabled, memory_enabled, max_retrieved_docs) "
                    "VALUES (:id, :uid, 'gemini', 'gemini-1.5-pro', 0.7, 1.0, 4096, true, true, 5)"
                ),
                {"id": str(settings_id), "uid": str(user_id)},
            )
            await session.commit()
        except Exception:
            await session.rollback()
            raise

    async with factory() as read_session:
        result = await read_session.execute(
            text("SELECT memory_enabled, max_retrieved_docs FROM user_ai_settings WHERE id = :id"),
            {"id": str(settings_id)},
        )
        row = result.one_or_none()
        assert row is not None, "Inserted row not found"
        assert row[0] in (1, True), "memory_enabled should be True"
        assert row[1] == 5, "max_retrieved_docs should be 5"
