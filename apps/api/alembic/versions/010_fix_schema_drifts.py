"""fix schema drifts: create user_ai_settings, add default_llm_provider to users

- Creates user_ai_settings table if missing (with all columns including memory)
- Adds default_llm_provider column to users table if missing

Revision ID: 010_fix_schema_drifts
Revises: 009_founder_conversations_pin_archive
Create Date: 2026-07-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "010_fix_schema_drifts"
down_revision: str | None = "009_founder_conversations_pin_archive"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_ai_settings (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            default_provider VARCHAR(30) NOT NULL DEFAULT 'gemini',
            default_model VARCHAR(100) NOT NULL DEFAULT 'gemini-1.5-pro',
            temperature FLOAT NOT NULL DEFAULT 0.7,
            top_p FLOAT NOT NULL DEFAULT 1.0,
            max_tokens INTEGER NOT NULL DEFAULT 4096,
            streaming_enabled BOOLEAN NOT NULL DEFAULT true,
            memory_enabled BOOLEAN NOT NULL DEFAULT true,
            max_retrieved_docs INTEGER NOT NULL DEFAULT 5,
            UNIQUE(user_id)
        )
        """
    )
    op.create_index("idx_user_ai_settings_user", "user_ai_settings", ["user_id"], if_not_exists=True)

    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS default_llm_provider "
        "VARCHAR(30) NOT NULL DEFAULT 'gemini'"
    )


def downgrade() -> None:
    op.drop_column("users", "default_llm_provider")
    op.drop_index("idx_user_ai_settings_user", table_name="user_ai_settings", if_exists=True)
    op.drop_table("user_ai_settings")
