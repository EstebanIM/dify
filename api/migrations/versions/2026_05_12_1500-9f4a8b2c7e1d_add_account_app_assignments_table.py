"""Add account_app_assignments table for guest role.

Revision ID: 9f4a8b2c7e1d
Revises: 227822d22895
Create Date: 2026-05-12 15:00:00.000000

Notes:
- The new ``guest`` value of ``TenantAccountRole`` does NOT require a schema
  migration because the role column uses ``EnumText`` (VARCHAR with Python-side
  validation), not a PostgreSQL native enum type.
- This migration only creates the ``account_app_assignments`` table used by
  the GuestAssignmentService.
"""

import sqlalchemy as sa
from alembic import op

import models as models

# revision identifiers, used by Alembic.
revision = "9f4a8b2c7e1d"
down_revision = "227822d22895"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "account_app_assignments",
        sa.Column("id", models.types.StringUUID(), nullable=False),
        sa.Column("account_id", models.types.StringUUID(), nullable=False),
        sa.Column("app_id", models.types.StringUUID(), nullable=False),
        sa.Column("tenant_id", models.types.StringUUID(), nullable=False),
        sa.Column("assigned_by", models.types.StringUUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("account_app_assignment_pkey")),
        sa.UniqueConstraint("account_id", "app_id", name="unique_account_app_assignment"),
    )
    with op.batch_alter_table("account_app_assignments", schema=None) as batch_op:
        batch_op.create_index("account_app_assignment_account_id_idx", ["account_id"], unique=False)
        batch_op.create_index("account_app_assignment_app_id_idx", ["app_id"], unique=False)
        batch_op.create_index("account_app_assignment_tenant_id_idx", ["tenant_id"], unique=False)


def downgrade():
    with op.batch_alter_table("account_app_assignments", schema=None) as batch_op:
        batch_op.drop_index("account_app_assignment_tenant_id_idx")
        batch_op.drop_index("account_app_assignment_app_id_idx")
        batch_op.drop_index("account_app_assignment_account_id_idx")
    op.drop_table("account_app_assignments")
