"""Module catalog endpoints mapping catering features to permissions."""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .views_common import (
    DEFAULT_ROLE_PERMISSIONS,
    _actor_from_request,
    _effective_permissions,
    _effective_permissions_from_role,
)


MODULE_DEFINITIONS = [
    {
        "code": "account",
        "label": "Account Management",
        "description": "Account access, profile, and biometric login",
        "features": [
            {"code": "login", "label": "Login / Logout", "permissions": ["account.login", "account.logout"]},
            {"code": "password", "label": "Edit Password", "permissions": ["account.password.edit"]},
            {"code": "profile", "label": "Edit Information", "permissions": ["account.info.edit"]},
            {"code": "biometric", "label": "Biometric Login (Face Scan)", "permissions": ["account.biometric"]},
        ],
    },
    {
        "code": "inventory",
        "label": "Inventory Management",
        "description": "Stock visibility, adjustments, and restocking controls",
        "features": [
            {"code": "view", "label": "View Stock Levels", "permissions": ["inventory.view"]},
            {"code": "update", "label": "Update Stock Levels", "permissions": ["inventory.update"]},
            {"code": "expiry", "label": "Track Expiry Dates", "permissions": ["inventory.expiry.track"]},
            {"code": "menu", "label": "Manage Menu Items", "permissions": ["inventory.menu.manage", "menu.manage"]},
            {"code": "alerts", "label": "Send Low Stock Alerts", "permissions": ["inventory.lowstock.alerts"]},
            {"code": "restock", "label": "Manage Restocking Schedule", "permissions": ["inventory.restock.manage"]},
        ],
    },
    {
        "code": "catering",
        "label": "Catering",
        "description": "Plan catering events, menus, and schedules",
        "features": [
            {"code": "view", "label": "View Catering Events", "permissions": ["catering.events.view"]},
            {"code": "manage", "label": "Create & Update Catering Events", "permissions": ["catering.events.manage"]},
            {"code": "menu", "label": "Configure Catering Menus", "permissions": ["catering.menu.manage"]},
            {"code": "cancel", "label": "Cancel Catering Events", "permissions": ["catering.events.cancel"]},
        ],
    },
    {
        "code": "orders",
        "label": "Order Handling",
        "description": "Order intake, queue management, and status tracking",
        "features": [
            {"code": "place", "label": "Place Order", "permissions": ["order.place"]},
            {"code": "status", "label": "View Order Status", "permissions": ["order.status.view"]},
            {"code": "queue", "label": "Handle Order Queue", "permissions": ["order.queue.handle"]},
            {"code": "update", "label": "Update Order Status", "permissions": ["order.status.update"]},
            {"code": "bulk", "label": "Track Bulk Order Progress", "permissions": ["order.bulk.track"]},
        ],
    },
    {
        "code": "payments",
        "label": "Payment and Transactions",
        "description": "Cashier operations and transaction oversight",
        "features": [
            {"code": "process", "label": "Process Cash / Online Payment", "permissions": ["payment.process"]},
            {"code": "history", "label": "View Order History", "permissions": ["order.history.view"]},
            {"code": "records", "label": "View Payment Records", "permissions": ["payment.records.view"]},
            {"code": "refunds", "label": "Process Refunds", "permissions": ["payment.refund"]},
        ],
    },
    {
        "code": "scheduling",
        "label": "Staff and Work Scheduling",
        "description": "Shift planning, attendance, and leave management",
        "features": [
            {"code": "profile", "label": "View Profile and Assigned Roles", "permissions": ["profile.view_roles"]},
            {"code": "schedule", "label": "View and Edit Shift Schedule", "permissions": ["schedule.view_edit"]},
            {"code": "attendance", "label": "Manage Attendance Records", "permissions": ["attendance.manage"]},
            {"code": "leave", "label": "Manage Leave Records", "permissions": ["leave.manage"]},
        ],
    },
    {
        "code": "reports",
        "label": "Reports and Analytics",
        "description": "Sales, inventory, and workforce intelligence",
        "features": [
            {"code": "sales", "label": "View Sales Reports (Daily / Monthly)", "permissions": ["reports.sales.view"]},
            {"code": "inventory", "label": "View Inventory Reports", "permissions": ["reports.inventory.view"]},
            {"code": "orders", "label": "View Order and Transaction Reports", "permissions": ["reports.orders.view"]},
            {"code": "staff", "label": "View Staff Attendance Reports", "permissions": ["reports.staff.view"]},
            {"code": "customers", "label": "View Customer Purchase History", "permissions": ["reports.customer.view"]},
        ],
    },
    {
        "code": "notifications",
        "label": "Notifications",
        "description": "Operational messaging and alerts",
        "features": [
            {"code": "send", "label": "Send Updates / Notifications", "permissions": ["notification.send"]},
            {"code": "receive", "label": "Receive Notifications", "permissions": ["notification.receive"]},
            {"code": "view", "label": "View Notifications", "permissions": ["notification.view"]},
        ],
    },
]


def _serialize_modules(perms: set[str] | None):
    modules = []
    wildcard = bool(perms and "all" in perms)
    for module in MODULE_DEFINITIONS:
        features = []
        for feature in module["features"]:
            required = feature["permissions"]
            entry = {
                "code": feature["code"],
                "label": feature["label"],
                "permissions": required,
            }
            if perms is not None:
                entry["granted"] = wildcard or all(req in perms for req in required)
            features.append(entry)
        modules.append(
            {
                "code": module["code"],
                "label": module["label"],
                "description": module["description"],
                "features": features,
            }
        )
    return modules


@require_http_methods(["GET"])
def modules_catalog(_request):
    return JsonResponse({"success": True, "data": _serialize_modules(perms=None)})


@require_http_methods(["GET"])
def modules_for_role(_request, role: str):
    role_key = (role or "").lower()
    if role_key not in DEFAULT_ROLE_PERMISSIONS and role_key != "admin":
        return JsonResponse({"success": False, "message": "Role not found"}, status=404)
    perms = _effective_permissions_from_role(role_key)
    modules = _serialize_modules(perms)
    payload = {
        "role": role_key,
        "permissions": sorted(list(perms)) if "all" not in perms else ["all"],
        "modules": modules,
    }
    return JsonResponse({"success": True, "data": payload})


@require_http_methods(["GET"])
def modules_for_me(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    perms = _effective_permissions(actor)
    modules = _serialize_modules(perms)
    role = None
    if hasattr(actor, "role"):
        role = getattr(actor, "role", None)
    elif isinstance(actor, dict):
        role = actor.get("role")
    payload = {
        "role": (role or "").lower(),
        "permissions": sorted(list(perms)) if "all" not in perms else ["all"],
        "modules": modules,
    }
    return JsonResponse({"success": True, "data": payload})


_all_ = [
    "modules_catalog",
    "modules_for_role",
    "modules_for_me",
]