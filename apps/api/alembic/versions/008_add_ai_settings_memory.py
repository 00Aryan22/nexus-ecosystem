"""create user_ai_settings table with ai/memory configuration

Revision ID: 008_ai_settings_memory
Revises: 007_knowledge_documents
Create Date: 2026-07-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "008_ai_settings_memory"
down_revision: str | None = "007_knowledge_documents"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_ai_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("default_provider", sa.String(30), nullable=False, server_default=sa.text("'gemini'")),
        sa.Column("default_model", sa.String(100), nullable=False, server_default=sa.text("'gemini-1.5-pro'")),
        sa.Column("temperature", sa.Float(), nullable=False, server_default=sa.text("0.7")),
        sa.Column("top_p", sa.Float(), nullable=False, server_default=sa.text("1.0")),
        sa.Column("max_tokens", sa.Integer(), nullable=False, server_default=sa.text("4096")),
        sa.Column("streaming_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("memory_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("max_retrieved_docs", sa.Integer(), nullable=False, server_default=sa.text("5")),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("idx_user_ai_settings_user", "user_ai_settings", ["user_id"], if_not_exists=True)


def downgrade() -> None:
    op.drop_index("idx_user_ai_settings_user", table_name="user_ai_settings", if_exists=True)
    op.drop_table("user_ai_settings")
