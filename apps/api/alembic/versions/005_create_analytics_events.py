"""create analytics_events table

Revision ID: 005_analytics
Revises: 004_audits
Create Date: 2026-06-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "005_analytics"
down_revision: str | None = "004_audits"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sessions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("event_data", postgresql.JSONB(), nullable=True),
        sa.Column("wallet_address", sa.String(42), nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "idx_events_user_type",
        "analytics_events",
        ["user_id", "event_type", sa.text("created_at DESC")],
    )
    op.create_index(
        "idx_events_type_date",
        "analytics_events",
        ["event_type", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_index("idx_events_type_date", table_name="analytics_events")
    op.drop_index("idx_events_user_type", table_name="analytics_events")
    op.drop_table("analytics_events")
