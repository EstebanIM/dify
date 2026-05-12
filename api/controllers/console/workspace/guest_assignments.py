"""Admin endpoints to manage guest accounts and their app assignments.

Three pivots are exposed:

1. **By guest (account_id)** — list/replace the apps a guest can access.
2. **By app (app_id)** — list/replace the guests that can access an app.
3. **Invite guest** — create a new guest account AND assign the initial set
   of apps in a single request (separate flow from the classic invite-email
   which is reserved for non-guest roles).

All endpoints require ``owner`` or ``admin`` in the current tenant.
"""

from urllib import parse

from flask import abort
from flask_restx import Resource
from pydantic import BaseModel, Field

from configs import dify_config
from controllers.console import console_ns
from controllers.console.wraps import (
    account_initialization_required,
    is_admin_or_owner_required,
    setup_required,
)
from extensions.ext_database import db
from libs.login import current_account_with_tenant, login_required
from models import Account, TenantAccountJoin, TenantAccountRole
from services.account_service import RegisterService, TenantService
from services.errors.account import AccountAlreadyInTenantError
from services.guest_assignment_service import (
    AccountNotGuestError,
    AppNotInTenantError,
    GuestAssignmentService,
)

DEFAULT_REF_TEMPLATE_SWAGGER_2_0 = "#/definitions/{model}"


class GuestAppsPayload(BaseModel):
    app_ids: list[str] = Field(default_factory=list)


class AppGuestsPayload(BaseModel):
    account_ids: list[str] = Field(default_factory=list)


class InviteGuestPayload(BaseModel):
    email: str
    app_ids: list[str] = Field(default_factory=list)
    language: str | None = None


def _reg(cls: type[BaseModel]):
    console_ns.schema_model(cls.__name__, cls.model_json_schema(ref_template=DEFAULT_REF_TEMPLATE_SWAGGER_2_0))


_reg(GuestAppsPayload)
_reg(AppGuestsPayload)
_reg(InviteGuestPayload)


def _app_summary(app) -> dict:
    return {
        "id": str(app.id),
        "name": app.name,
        "mode": app.mode,
        "icon_type": app.icon_type,
        "icon": app.icon,
        "icon_background": app.icon_background,
        "description": app.description,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None,
    }


def _account_summary(account) -> dict:
    return {
        "id": str(account.id),
        "name": account.name,
        "email": account.email,
        "avatar_url": account.avatar,
    }


@console_ns.route("/workspaces/current/guests")
class GuestListApi(Resource):
    """List all guest accounts in the current tenant."""

    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def get(self):
        current_user, current_tenant_id = current_account_with_tenant()
        if not current_user.current_tenant:
            raise ValueError("No current tenant")

        from sqlalchemy import select

        stmt = (
            select(Account)
            .join(TenantAccountJoin, TenantAccountJoin.account_id == Account.id)
            .where(
                TenantAccountJoin.tenant_id == current_tenant_id,
                TenantAccountJoin.role == TenantAccountRole.GUEST,
            )
            .order_by(Account.name.asc())
        )
        accounts = list(db.session.scalars(stmt).all())
        accounts_with_count = []
        for acc in accounts:
            app_ids = GuestAssignmentService.list_app_ids_for_account(acc.id, current_tenant_id)
            accounts_with_count.append({**_account_summary(acc), "assigned_app_count": len(app_ids)})
        return {"guests": accounts_with_count}, 200


@console_ns.route("/workspaces/current/guests/<uuid:account_id>/apps")
class GuestAppsApi(Resource):
    """List or replace the apps assigned to a given guest account."""

    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def get(self, account_id):
        _, current_tenant_id = current_account_with_tenant()
        apps = GuestAssignmentService.list_apps_for_account(str(account_id), current_tenant_id)
        return {"apps": [_app_summary(a) for a in apps]}, 200

    @console_ns.expect(console_ns.models[GuestAppsPayload.__name__])
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def put(self, account_id):
        payload = console_ns.payload or {}
        args = GuestAppsPayload.model_validate(payload)
        current_user, current_tenant_id = current_account_with_tenant()

        try:
            apps = GuestAssignmentService.replace_assignments_for_account(
                account_id=str(account_id),
                tenant_id=current_tenant_id,
                app_ids=args.app_ids,
                operator_account_id=current_user.id,
            )
        except AccountNotGuestError as e:
            return {"code": "account-not-guest", "message": str(e)}, 400
        except AppNotInTenantError as e:
            return {"code": "app-not-in-tenant", "message": str(e)}, 400

        return {"apps": [_app_summary(a) for a in apps]}, 200


@console_ns.route("/apps/<uuid:app_id>/guests")
class AppGuestsApi(Resource):
    """List or replace the guest accounts that can access a given app."""

    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def get(self, app_id):
        _, current_tenant_id = current_account_with_tenant()
        accounts = GuestAssignmentService.list_accounts_for_app(str(app_id), current_tenant_id)
        return {"guests": [_account_summary(a) for a in accounts]}, 200

    @console_ns.expect(console_ns.models[AppGuestsPayload.__name__])
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def put(self, app_id):
        payload = console_ns.payload or {}
        args = AppGuestsPayload.model_validate(payload)
        current_user, current_tenant_id = current_account_with_tenant()

        try:
            accounts = GuestAssignmentService.replace_assignments_for_app(
                app_id=str(app_id),
                tenant_id=current_tenant_id,
                account_ids=args.account_ids,
                operator_account_id=current_user.id,
            )
        except AppNotInTenantError as e:
            return {"code": "app-not-in-tenant", "message": str(e)}, 400
        except AccountNotGuestError as e:
            return {"code": "account-not-guest", "message": str(e)}, 400

        return {"guests": [_account_summary(a) for a in accounts]}, 200


@console_ns.route("/workspaces/current/members/invite-guest")
class MemberInviteGuestApi(Resource):
    """Invite a new guest member and assign their initial set of apps."""

    @console_ns.expect(console_ns.models[InviteGuestPayload.__name__])
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def post(self):
        payload = console_ns.payload or {}
        args = InviteGuestPayload.model_validate(payload)

        invitee_email = args.email.strip().lower()
        if not invitee_email:
            return {"code": "invalid-email", "message": "Email is required."}, 400

        current_user, current_tenant_id = current_account_with_tenant()
        inviter = current_user
        if not inviter.current_tenant:
            raise ValueError("No current tenant")

        console_web_url = dify_config.CONSOLE_WEB_URL
        try:
            token = RegisterService.invite_new_member(
                tenant=inviter.current_tenant,
                email=invitee_email,
                language=args.language,
                role=TenantAccountRole.GUEST.value,
                inviter=inviter,
            )
            encoded_email = parse.quote(invitee_email)
            invite_url = f"{console_web_url}/activate?email={encoded_email}&token={token}"
            already_in_tenant = False
        except AccountAlreadyInTenantError:
            invite_url = f"{console_web_url}/signin"
            already_in_tenant = True

        # Resolve the account so we can assign apps
        from sqlalchemy import select

        invitee = db.session.scalar(select(Account).where(Account.email == invitee_email))
        if not invitee:
            return {"code": "account-not-found", "message": "Invited account could not be located."}, 500

        # Ensure the invitee is registered as guest in this tenant. ``invite_new_member`` already
        # creates/updates the TenantAccountJoin, but defensively re-check.
        join = db.session.scalar(
            select(TenantAccountJoin).where(
                TenantAccountJoin.account_id == invitee.id,
                TenantAccountJoin.tenant_id == current_tenant_id,
            )
        )
        if join is None:
            TenantService.create_tenant_member(inviter.current_tenant, invitee, TenantAccountRole.GUEST.value)
            db.session.commit()
        elif join.role != TenantAccountRole.GUEST:
            # If the user already exists with another role we refuse the assignment to avoid silent privilege changes.
            return {
                "code": "existing-member-different-role",
                "message": "This email already belongs to a non-guest member of the workspace.",
            }, 409

        try:
            apps = GuestAssignmentService.replace_assignments_for_account(
                account_id=invitee.id,
                tenant_id=current_tenant_id,
                app_ids=args.app_ids,
                operator_account_id=inviter.id,
            )
        except AppNotInTenantError as e:
            return {"code": "app-not-in-tenant", "message": str(e)}, 400

        return {
            "result": "success",
            "email": invitee_email,
            "url": invite_url,
            "already_in_tenant": already_in_tenant,
            "apps": [_app_summary(a) for a in apps],
        }, 201

    def abort_unused(self):  # pragma: no cover - retained for static checkers
        abort(404)
