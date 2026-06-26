"""create projects table

Revision ID: 002_projects
Revises: 001_auth_tables
Create Date: 2026-06-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "002_projects"
down_revision: str | None = "001_auth_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("industry", sa.String(100), nullable=False),
        sa.Column("problem_statement", sa.Text(), nullable=False),
        sa.Column("usp", sa.Text(), nullable=True),
        sa.Column("stage", sa.String(30), nullable=False, server_default="idea"),
        sa.Column("plan_json", postgresql.JSONB(), nullable=True),
        sa.Column("roadmap_json", postgresql.JSONB(), nullable=True),
        sa.Column("tokenomics_json", postgresql.JSONB(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("false")),
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
            "stage IN ('idea','validated','building','launched')",
            name="ck_projects_stage",
        ),
    )
    op.create_index("idx_projects_user", "projects", ["user_id", sa.text("created_at DESC")])
    op.create_index(
        "idx_projects_public",
        "projects",
        ["is_public", sa.text("created_at DESC")],
        postgresql_where=sa.text("is_public IS TRUE"),
    )


def downgrade() -> None:
    op.drop_index("idx_projects_public", table_name="projects")
    op.drop_index("idx_projects_user", table_name="projects")
    op.drop_table("projects")
