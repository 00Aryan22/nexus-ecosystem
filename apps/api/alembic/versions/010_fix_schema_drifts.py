"""add default_llm_provider to users table

Revision ID: 010_fix_schema_drifts
Revises: 009_founder_conversations_pin_archive
Create Date: 2026-07-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "010_fix_schema_drifts"
down_revision: str | None = "009_founder_conversations_pin_archive"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS default_llm_provider "
        "VARCHAR(30) NOT NULL DEFAULT 'gemini'"
    )


def downgrade() -> None:
    op.drop_column("users", "default_llm_provider")
