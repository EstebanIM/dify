"""GuestAssignmentService.

Manages the mapping between guest accounts and the apps they have access to.

The guest role (``TenantAccountRole.GUEST``) restricts a user to consuming
only the apps explicitly assigned to them by an owner/admin. This service
encapsulates all read/write operations against the
``account_app_assignments`` table.

Permissions are enforced at the controller layer via dedicated decorators
(see ``controllers/console/wraps.py`` and ``controllers/console/guest/wraps.py``).
This service assumes the caller is already authorized to perform the action.
"""

import logging
from collections.abc import Iterable
import sqlalchemy as sa
from sqlalchemy import select

from extensions.ext_database import db
from libs.datetime_utils import naive_utc_now
from models import Account, AccountAppAssignment, InstalledApp, TenantAccountJoin, TenantAccountRole
from models.model import App

logger = logging.getLogger(__name__)


class GuestAssignmentError(Exception):
    """Base error for guest assignment operations."""


class AppNotInTenantError(GuestAssignmentError):
    """Raised when attempting to assign an app that does not belong to the tenant."""


class AccountNotGuestError(GuestAssignmentError):
    """Raised when attempting to assign apps to an account that is not a guest of the tenant."""


class GuestAssignmentService:
    @staticmethod
    def list_apps_for_account(account_id: str, tenant_id: str) -> list[App]:
        """Return all apps assigned to ``account_id`` within ``tenant_id``.

        Filters out apps that may have been soft-deleted or moved between tenants.
        """
        stmt = (
            select(App)
            .join(AccountAppAssignment, AccountAppAssignment.app_id == App.id)
            .where(
                AccountAppAssignment.account_id == account_id,
                AccountAppAssignment.tenant_id == tenant_id,
                App.tenant_id == tenant_id,
                App.status == "normal",
            )
            .order_by(App.created_at.desc())
        )
        return list(db.session.scalars(stmt).all())

    @staticmethod
    def list_accounts_for_app(app_id: str, tenant_id: str) -> list[Account]:
        """Return all guest accounts that have access to ``app_id``."""
        stmt = (
            select(Account)
            .join(AccountAppAssignment, AccountAppAssignment.account_id == Account.id)
            .where(
                AccountAppAssignment.app_id == app_id,
                AccountAppAssignment.tenant_id == tenant_id,
            )
            .order_by(Account.name.asc())
        )
        return list(db.session.scalars(stmt).all())

    @staticmethod
    def list_app_ids_for_account(account_id: str, tenant_id: str) -> set[str]:
        """Return only the set of app IDs assigned to ``account_id`` (efficient check)."""
        stmt = select(AccountAppAssignment.app_id).where(
            AccountAppAssignment.account_id == account_id,
            AccountAppAssignment.tenant_id == tenant_id,
        )
        return set(db.session.scalars(stmt).all())

    @staticmethod
    def account_can_access_app(account_id: str, app_id: str) -> bool:
        """Return True if there is an active assignment row for ``account_id`` → ``app_id``."""
        stmt = select(sa.literal(1)).where(
            AccountAppAssignment.account_id == account_id,
            AccountAppAssignment.app_id == app_id,
        )
        return db.session.scalar(stmt) is not None

    @staticmethod
    def _is_guest_in_tenant(account_id: str, tenant_id: str) -> bool:
        """Return True if the account is registered as guest in this tenant."""
        stmt = select(TenantAccountJoin.role).where(
            TenantAccountJoin.account_id == account_id,
            TenantAccountJoin.tenant_id == tenant_id,
        )
        role_value = db.session.scalar(stmt)
        if role_value is None:
            return False
        return TenantAccountRole(role_value) == TenantAccountRole.GUEST

    @staticmethod
    def replace_assignments_for_account(
        account_id: str,
        tenant_id: str,
        app_ids: Iterable[str],
        operator_account_id: str,
    ) -> list[App]:
        """Replace the set of apps assigned to ``account_id`` with ``app_ids``.

        - Validates the target account is a guest in this tenant.
        - Validates every app belongs to ``tenant_id``.
        - Inserts missing rows, deletes rows no longer in the desired set, and
          leaves untouched rows alone (preserves ``created_at``).
        Returns the resulting list of assigned apps.
        """
        desired = {str(a) for a in app_ids if a}
        if not GuestAssignmentService._is_guest_in_tenant(account_id, tenant_id):
            raise AccountNotGuestError(
                f"Account {account_id} is not a guest of tenant {tenant_id}; cannot assign apps."
            )

        if desired:
            valid_app_ids = set(
                db.session.scalars(
                    select(App.id).where(App.id.in_(desired), App.tenant_id == tenant_id, App.status == "normal")
                ).all()
            )
            invalid = desired - valid_app_ids
            if invalid:
                raise AppNotInTenantError(
                    f"App(s) {sorted(invalid)} do not belong to tenant {tenant_id} or are not active."
                )

        existing = GuestAssignmentService.list_app_ids_for_account(account_id, tenant_id)
        to_add = desired - existing
        to_remove = existing - desired

        if to_remove:
            db.session.execute(
                sa.delete(AccountAppAssignment).where(
                    AccountAppAssignment.account_id == account_id,
                    AccountAppAssignment.tenant_id == tenant_id,
                    AccountAppAssignment.app_id.in_(to_remove),
                )
            )

        for app_id in to_add:
            db.session.add(
                AccountAppAssignment(
                    account_id=account_id,
                    app_id=app_id,
                    tenant_id=tenant_id,
                    assigned_by=operator_account_id,
                )
            )

        db.session.commit()

        # Ensure each assigned app has a matching InstalledApp row at the tenant
        # level so the existing /explore/installed/<id> chat surface can be
        # reused by the guest. InstalledApp rows are tenant-scoped (not user-
        # scoped) and are not removed when a single assignment is revoked.
        GuestAssignmentService._ensure_installed_apps(tenant_id, desired)

        return GuestAssignmentService.list_apps_for_account(account_id, tenant_id)

    @staticmethod
    def _ensure_installed_apps(tenant_id: str, app_ids: Iterable[str]) -> None:
        """Create an InstalledApp row for any (tenant, app) pair that lacks one."""
        wanted = {str(a) for a in app_ids if a}
        if not wanted:
            return

        existing = set(
            db.session.scalars(
                select(InstalledApp.app_id).where(
                    InstalledApp.tenant_id == tenant_id,
                    InstalledApp.app_id.in_(wanted),
                )
            ).all()
        )
        missing = wanted - existing
        if not missing:
            return

        # Resolve the owner tenant for each app — required by InstalledApp.
        owner_map = {
            row[0]: row[1]
            for row in db.session.execute(
                select(App.id, App.tenant_id).where(App.id.in_(missing))
            ).all()
        }
        now = naive_utc_now()
        for app_id in missing:
            owner_tenant_id = owner_map.get(app_id)
            if not owner_tenant_id:
                continue
            db.session.add(
                InstalledApp(
                    app_id=app_id,
                    tenant_id=tenant_id,
                    app_owner_tenant_id=owner_tenant_id,
                    is_pinned=False,
                    last_used_at=now,
                )
            )
        db.session.commit()

    @staticmethod
    def replace_assignments_for_app(
        app_id: str,
        tenant_id: str,
        account_ids: Iterable[str],
        operator_account_id: str,
    ) -> list[Account]:
        """Replace the set of guests with access to ``app_id``.

        Mirrors ``replace_assignments_for_account`` but the pivot is the app.
        Only accounts already registered as guests in ``tenant_id`` are accepted.
        """
        desired = {str(a) for a in account_ids if a}

        # Ensure the app belongs to the tenant
        app_owner_tenant = db.session.scalar(select(App.tenant_id).where(App.id == app_id))
        if app_owner_tenant != tenant_id:
            raise AppNotInTenantError(f"App {app_id} does not belong to tenant {tenant_id}.")

        if desired:
            valid_account_ids = set(
                db.session.scalars(
                    select(TenantAccountJoin.account_id).where(
                        TenantAccountJoin.account_id.in_(desired),
                        TenantAccountJoin.tenant_id == tenant_id,
                        TenantAccountJoin.role == TenantAccountRole.GUEST,
                    )
                ).all()
            )
            invalid = desired - valid_account_ids
            if invalid:
                raise AccountNotGuestError(
                    f"Account(s) {sorted(invalid)} are not guests of tenant {tenant_id}."
                )

        existing = set(
            db.session.scalars(
                select(AccountAppAssignment.account_id).where(
                    AccountAppAssignment.app_id == app_id,
                    AccountAppAssignment.tenant_id == tenant_id,
                )
            ).all()
        )
        to_add = desired - existing
        to_remove = existing - desired

        if to_remove:
            db.session.execute(
                sa.delete(AccountAppAssignment).where(
                    AccountAppAssignment.app_id == app_id,
                    AccountAppAssignment.tenant_id == tenant_id,
                    AccountAppAssignment.account_id.in_(to_remove),
                )
            )

        for account_id in to_add:
            db.session.add(
                AccountAppAssignment(
                    account_id=account_id,
                    app_id=app_id,
                    tenant_id=tenant_id,
                    assigned_by=operator_account_id,
                )
            )

        db.session.commit()
        # Ensure InstalledApp exists for this (tenant, app) pair.
        GuestAssignmentService._ensure_installed_apps(tenant_id, [app_id])
        return GuestAssignmentService.list_accounts_for_app(app_id, tenant_id)

    @staticmethod
    def cascade_delete_for_app(app_id: str) -> int:
        """Delete every assignment row for ``app_id``.

        Called from ``AppService.delete_app`` so that removing an app also
        cleans up all guest assignments to it. Returns the row count deleted.
        """
        result = db.session.execute(
            sa.delete(AccountAppAssignment).where(AccountAppAssignment.app_id == app_id)
        )
        db.session.commit()
        return int(result.rowcount or 0)

    @staticmethod
    def cascade_delete_for_account(account_id: str, tenant_id: str | None = None) -> int:
        """Delete every assignment row for ``account_id``.

        Used when a guest account is removed from the tenant. If ``tenant_id``
        is provided, only that tenant's assignments are removed (useful when a
        guest belongs to multiple workspaces — though this is uncommon).
        Returns the row count deleted.
        """
        stmt = sa.delete(AccountAppAssignment).where(AccountAppAssignment.account_id == account_id)
        if tenant_id is not None:
            stmt = stmt.where(AccountAppAssignment.tenant_id == tenant_id)
        result = db.session.execute(stmt)
        db.session.commit()
        return int(result.rowcount or 0)
