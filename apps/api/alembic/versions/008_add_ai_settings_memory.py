"""add memory_enabled and max_retrieved_docs to user_ai_settings

Revision ID: 008_ai_settings_memory
Revises: 007_knowledge_documents
Create Date: 2026-07-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "008_ai_settings_memory"
down_revision: str | None = "007_knowledge_documents"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "user_ai_settings",
        sa.Column("memory_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "user_ai_settings",
        sa.Column("max_retrieved_docs", sa.Integer(), nullable=False, server_default=sa.text("5")),
    )


def downgrade() -> None:
    op.drop_column("user_ai_settings", "max_retrieved_docs")
    op.drop_column("user_ai_settings", "memory_enabled")
