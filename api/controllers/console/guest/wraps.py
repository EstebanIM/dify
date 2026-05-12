"""Decorators for guest-scoped controllers.

These decorators run AFTER ``@login_required``/``@account_initialization_required``
and assume the user is already authenticated and initialized.
"""

from collections.abc import Callable
from functools import wraps


def guest_role_required[**P, R](f: Callable[P, R]) -> Callable[P, R]:
    """Allow only guest accounts to reach this endpoint.

    Returns 403 for any other role (including owner/admin). Used to scope the
    ``/console/api/guest/*`` namespace to its intended audience.
    """

    @wraps(f)
    def decorated_function(*args: P.args, **kwargs: P.kwargs):
        from werkzeug.exceptions import Forbidden

        from libs.login import current_user
        from models import Account

        user = current_user._get_current_object()  # type: ignore
        if not isinstance(user, Account) or not user.is_guest:
            raise Forbidden("Only guest accounts may access this endpoint.")
        return f(*args, **kwargs)

    return decorated_function


def guest_can_access_app[**P, R](f: Callable[P, R]) -> Callable[P, R]:
    """Verify the current guest has an active assignment for ``app_id`` kwarg.

    The wrapped view MUST receive ``app_id`` as a keyword argument (the Flask
    route should declare ``<string:app_id>``). Returns 403 when the assignment
    is missing — the frontend interprets that as "access revoked" and sends the
    user back to ``/home``.
    """

    @wraps(f)
    def decorated_function(*args: P.args, **kwargs: P.kwargs):
        from werkzeug.exceptions import Forbidden

        from libs.login import current_user
        from models import Account
        from services.guest_assignment_service import GuestAssignmentService

        user = current_user._get_current_object()  # type: ignore
        if not isinstance(user, Account) or not user.is_guest:
            raise Forbidden("Only guest accounts may access this endpoint.")

        app_id = kwargs.get("app_id")
        if not app_id:
            raise Forbidden("Missing app_id in route.")

        if not GuestAssignmentService.account_can_access_app(user.id, str(app_id)):
            raise Forbidden("Access to this app has been revoked.")

        return f(*args, **kwargs)

    return decorated_function
