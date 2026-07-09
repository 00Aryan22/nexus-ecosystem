"""Verify all migrations run without errors on SQLite in-memory."""

import pytest
from sqlalchemy import text


@pytest.mark.asyncio
async def test_migration_chain_runs_cleanly(setup_database) -> None:
    """Verify the full migration chain was applied without errors.

    The conftest setup_database fixture (autouse, session-scoped) runs before
    any test.  It creates all tables via Base.metadata.create_all (which
    corresponds to what the 10 Alembic migrations define) and applies schema
    fix-ups.  This test verifies the resulting tables exist and have the
    expected columns.
    """
    from app.core.database import get_engine

    engine = await get_engine()

    async with engine.begin() as conn:
        # Verify core auth tables exist
        for table in ("users", "wallets", "sessions"):
            result = await conn.execute(
                text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            )
            assert result.scalar_one_or_none() == table, f"Table {table} missing after migrations"

        # Verify business tables exist
        for table in (
            "projects",
            "skill_passports",
            "nft_records",
            "audits",
            "analytics_events",
        ):
            result = await conn.execute(
                text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            )
            assert result.scalar_one_or_none() == table, f"Table {table} missing after migrations"

        # Verify founder agent tables exist
        for table in ("founder_conversations", "founder_messages", "startup_plans", "usage_stats"):
            result = await conn.execute(
                text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            )
            assert result.scalar_one_or_none() == table, f"Table {table} missing after migrations"

        # Verify knowledge_documents exists
        result = await conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge_documents'")
        )
        assert result.scalar_one_or_none() == "knowledge_documents"

        # Verify user_ai_settings exists (created by migration 008)
        result = await conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='user_ai_settings'")
        )
        assert result.scalar_one_or_none() == "user_ai_settings", (
            "user_ai_settings table missing — migration 008 should have created it"
        )

        # Verify user_ai_settings has all expected columns
        result = await conn.execute(text("PRAGMA table_info(user_ai_settings)"))
        columns = {row[1] for row in result.fetchall()}
        expected = {
            "id",
            "user_id",
            "default_provider",
            "default_model",
            "temperature",
            "top_p",
            "max_tokens",
            "streaming_enabled",
            "memory_enabled",
            "max_retrieved_docs",
        }
        missing = expected - columns
        assert not missing, (
            f"user_ai_settings missing columns: {missing}. "
            "Migration 008 should create all columns including "
            "memory_enabled and max_retrieved_docs."
        )

        # Verify users table has default_llm_provider (added by migration 010)
        result = await conn.execute(text("PRAGMA table_info(users)"))
        user_columns = {row[1] for row in result.fetchall()}
        assert "default_llm_provider" in user_columns, (
            "users table missing default_llm_provider — migration 010 should have added it"
        )

        # Verify founder_conversations has is_pinned and is_archived (added by migration 009)
        result = await conn.execute(text("PRAGMA table_info(founder_conversations)"))
        fc_columns = {row[1] for row in result.fetchall()}
        assert "is_pinned" in fc_columns
        assert "is_archived" in fc_columns


@pytest.mark.asyncio
async def test_user_ai_settings_crud() -> None:
    """Verify CRUD operations work on the user_ai_settings table."""
    import uuid

    from sqlalchemy import text  # noqa: F401 - used below via text()

    from app.core.database import get_session_factory

    factory = await get_session_factory()
    async with factory() as session:
        try:
            user_id = uuid.uuid4()
            settings_id = uuid.uuid4()

            await session.execute(
                text(
                    "INSERT INTO users (id, wallet_address, role, is_active, default_llm_provider) "
                    "VALUES (:id, :wallet, 'founder', 1, 'gemini')"
                ),
                {"id": str(user_id), "wallet": f"0x{uuid.uuid4().hex[:40]}"},
            )

            await session.execute(
                text(
                    "INSERT INTO user_ai_settings "
                    "(id, user_id, default_provider, default_model, temperature, top_p, "
                    "max_tokens, streaming_enabled, memory_enabled, max_retrieved_docs) "
                    "VALUES (:id, :uid, 'gemini', 'gemini-1.5-pro', 0.7, 1.0, 4096, 1, 1, 5)"
                ),
                {"id": str(settings_id), "uid": str(user_id)},
            )
            await session.commit()

            async with factory() as read_session:
                result = await read_session.execute(
                    text(
                        "SELECT memory_enabled, max_retrieved_docs "
                        "FROM user_ai_settings WHERE id = :id"
                    ),
                    {"id": str(settings_id)},
                )
                row = result.one_or_none()
                assert row is not None, "Inserted row not found"
                assert row[0] == 1, "memory_enabled should be True"
                assert row[1] == 5, "max_retrieved_docs should be 5"
        finally:
            await session.rollback()
