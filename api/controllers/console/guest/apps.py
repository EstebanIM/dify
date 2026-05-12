"""Guest-scoped app endpoints.

A guest user (``TenantAccountRole.GUEST``) has access only to apps that an
owner/admin has explicitly assigned to them. These endpoints power the
``/home`` page in the frontend.

The actual chat UX is reused from ``/explore/installed/<installed_app_id>``.
To bridge the two worlds, ``replace_assignments_for_account`` ensures an
``InstalledApp`` row exists for every assigned app, and we expose the
``installed_app_id`` alongside each app summary so the frontend can navigate
straight into the chat view.
"""

import logging
from typing import Any

from flask_restx import Resource
from sqlalchemy import select

from controllers.console import console_ns
from controllers.console.guest.wraps import guest_role_required
from controllers.console.wraps import account_initialization_required, setup_required
from extensions.ext_database import db
from libs.login import current_account_with_tenant, login_required
from models import InstalledApp
from services.guest_assignment_service import GuestAssignmentService

logger = logging.getLogger(__name__)


def _app_card(app, installed_app_id: str | None) -> dict[str, Any]:
    """Serialize an App into the card payload consumed by /home."""
    return {
        "id": str(app.id),
        "installed_app_id": str(installed_app_id) if installed_app_id else None,
        "name": app.name,
        "mode": app.mode,
        "icon_type": app.icon_type,
        "icon": app.icon,
        "icon_background": app.icon_background,
        "description": app.description,
        "updated_at": app.updated_at.isoformat() if getattr(app, "updated_at", None) else None,
    }


@console_ns.route("/guest/apps")
class GuestAppsApi(Resource):
    """List all apps assigned to the current guest user.

    Returns the cards rendered on ``/home``. Each card carries the
    ``installed_app_id`` so the frontend can route the user straight into the
    existing chat surface at ``/explore/installed/<installed_app_id>`` when
    they click on it.
    """

    @setup_required
    @login_required
    @account_initialization_required
    @guest_role_required
    def get(self):
        current_user, current_tenant_id = current_account_with_tenant()
        apps = GuestAssignmentService.list_apps_for_account(current_user.id, current_tenant_id)
        if not apps:
            return {"apps": []}, 200

        app_ids = [a.id for a in apps]
        installed_rows = db.session.scalars(
            select(InstalledApp).where(
                InstalledApp.tenant_id == current_tenant_id,
                InstalledApp.app_id.in_(app_ids),
            )
        ).all()
        installed_map = {row.app_id: row.id for row in installed_rows}

        return {
            "apps": [_app_card(a, installed_map.get(a.id)) for a in apps],
        }, 200
