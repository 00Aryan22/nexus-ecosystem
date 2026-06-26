"""create audits table

Revision ID: 004_audits
Revises: 003_passports
Create Date: 2026-06-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "004_audits"
down_revision: str | None = "003_passports"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "audits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("contract_name", sa.String(255), nullable=True),
        sa.Column("source_code", sa.Text(), nullable=False),
        sa.Column("source_hash", sa.String(64), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="queued"),
        sa.Column("critical_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("high_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("medium_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("low_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("info_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("overall_risk", sa.String(20), nullable=True),
        sa.Column("report_json", postgresql.JSONB(), nullable=True),
        sa.Column("report_summary", sa.Text(), nullable=True),
        sa.Column("ai_model_used", sa.String(100), nullable=False, server_default="gemini-1.5-pro"),
        sa.Column("processing_ms", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('queued','processing','complete','failed')",
            name="ck_audits_status",
        ),
    )
    op.create_index("idx_audits_user", "audits", ["user_id", sa.text("created_at DESC")])
    op.create_index(
        "idx_audits_status",
        "audits",
        ["status"],
        postgresql_where=sa.text("status IN ('queued', 'processing')"),
    )
    op.create_index("idx_audits_hash", "audits", ["source_hash"])


def downgrade() -> None:
    op.drop_index("idx_audits_hash", table_name="audits")
    op.drop_index("idx_audits_status", table_name="audits")
    op.drop_index("idx_audits_user", table_name="audits")
    op.drop_table("audits")
