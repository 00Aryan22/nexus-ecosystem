"""create founder agent tables

Revision ID: 006_founder_agent
Revises: 005_analytics
Create Date: 2026-06-27

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "006_founder_agent"
down_revision: str | None = "005_analytics"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "founder_conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("idx_founder_conversations_user", "founder_conversations", ["user_id"])

    op.create_table(
        "founder_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.String(36),
            sa.ForeignKey("founder_conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sender", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("idx_founder_messages_conversation", "founder_messages", ["conversation_id"])

    op.create_table(
        "startup_plans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.String(36),
            sa.ForeignKey("founder_conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("plan_type", sa.String(50), nullable=False),
        sa.Column("content_json", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("idx_startup_plans_user", "startup_plans", ["user_id"])
    op.create_index("idx_startup_plans_conversation", "startup_plans", ["conversation_id"])

    op.create_table(
        "ai_outputs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.String(36),
            sa.ForeignKey("founder_conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("output_type", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False, server_default="unknown"),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("idx_ai_outputs_user", "ai_outputs", ["user_id"])

    op.create_table(
        "usage_stats",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("feature", sa.String(50), nullable=False, server_default="founder_agent"),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("tokens_input", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_output", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("idx_usage_stats_user_feature", "usage_stats", ["user_id", "feature"])


def downgrade() -> None:
    op.drop_index("idx_usage_stats_user_feature", table_name="usage_stats")
    op.drop_table("usage_stats")
    op.drop_index("idx_ai_outputs_user", table_name="ai_outputs")
    op.drop_table("ai_outputs")
    op.drop_index("idx_startup_plans_conversation", table_name="startup_plans")
    op.drop_index("idx_startup_plans_user", table_name="startup_plans")
    op.drop_table("startup_plans")
    op.drop_index("idx_founder_messages_conversation", table_name="founder_messages")
    op.drop_table("founder_messages")
    op.drop_index("idx_founder_conversations_user", table_name="founder_conversations")
    op.drop_table("founder_conversations")
