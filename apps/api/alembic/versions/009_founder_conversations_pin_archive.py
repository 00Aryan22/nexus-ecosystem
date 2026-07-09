"""add is_pinned and is_archived to founder_conversations

Revision ID: 009_founder_conversations_pin_archive
Revises: 008_ai_settings_memory
Create Date: 2026-07-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "009_founder_conversations_pin_archive"
down_revision: str | None = "008_ai_settings_memory"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "founder_conversations",
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "founder_conversations",
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("founder_conversations", "is_archived")
    op.drop_column("founder_conversations", "is_pinned")
