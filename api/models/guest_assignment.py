"""Guest assignments model.

This module defines the ``AccountAppAssignment`` table which maps a guest
account to a specific app inside a tenant (workspace). It is the storage
layer for the "guest role with assigned apps" feature: a guest user only
sees and can use the apps explicitly assigned to them by an owner/admin.

The table is intentionally simple (no role/permission columns) — the
existence of a row means "this account has access to this app". Cascade
deletion when an app is removed is enforced from the service layer.
"""

from datetime import datetime
from uuid import uuid4

import sqlalchemy as sa
from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import TypeBase
from .types import StringUUID


class AccountAppAssignment(TypeBase):
    __tablename__ = "account_app_assignments"
    __table_args__ = (
        sa.PrimaryKeyConstraint("id", name="account_app_assignment_pkey"),
        sa.UniqueConstraint("account_id", "app_id", name="unique_account_app_assignment"),
        sa.Index("account_app_assignment_account_id_idx", "account_id"),
        sa.Index("account_app_assignment_app_id_idx", "app_id"),
        sa.Index("account_app_assignment_tenant_id_idx", "tenant_id"),
    )

    id: Mapped[str] = mapped_column(
        StringUUID,
        insert_default=lambda: str(uuid4()),
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        init=False,
    )
    account_id: Mapped[str] = mapped_column(StringUUID, nullable=False)
    app_id: Mapped[str] = mapped_column(StringUUID, nullable=False)
    tenant_id: Mapped[str] = mapped_column(StringUUID, nullable=False)
    assigned_by: Mapped[str | None] = mapped_column(StringUUID, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp(), init=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        init=False,
        onupdate=func.current_timestamp(),
    )
