"""create skill_passports and nft_records

Revision ID: 003_passports
Revises: 002_projects
Create Date: 2026-06-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "003_passports"
down_revision: str | None = "002_projects"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "skill_passports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("skill_category", sa.String(100), nullable=False),
        sa.Column("skill_name", sa.String(255), nullable=False),
        sa.Column("evidence_url", sa.Text(), nullable=False),
        sa.Column("evidence_description", sa.Text(), nullable=True),
        sa.Column("evaluation_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("evaluation_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("ipfs_metadata_uri", sa.Text(), nullable=True),
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
        sa.CheckConstraint(
            "evaluation_score >= 0 AND evaluation_score <= 100",
            name="ck_passports_score",
        ),
        sa.CheckConstraint(
            "status IN ('pending','evaluating','approved','rejected','minting','minted')",
            name="ck_passports_status",
        ),
    )
    op.create_index("idx_passports_user_status", "skill_passports", ["user_id", "status"])
    op.create_index(
        "idx_passports_category",
        "skill_passports",
        [sa.text("skill_category"), sa.text("evaluation_score DESC")],
    )

    op.create_table(
        "nft_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "passport_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("skill_passports.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_id", sa.BigInteger(), nullable=False, unique=True),
        sa.Column("contract_address", sa.String(42), nullable=False),
        sa.Column("chain_id", sa.Integer(), nullable=False, server_default="80002"),
        sa.Column("tx_hash", sa.String(66), nullable=False, unique=True),
        sa.Column("block_number", sa.BigInteger(), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=False),
        sa.Column(
            "minted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("idx_nft_token", "nft_records", ["token_id", "contract_address"])
    op.create_index(
        "idx_nft_user",
        "nft_records",
        ["user_id", sa.text("minted_at DESC")],
    )


def downgrade() -> None:
    op.drop_index("idx_nft_user", table_name="nft_records")
    op.drop_index("idx_nft_token", table_name="nft_records")
    op.drop_table("nft_records")
    op.drop_index("idx_passports_category", table_name="skill_passports")
    op.drop_index("idx_passports_user_status", table_name="skill_passports")
    op.drop_table("skill_passports")
