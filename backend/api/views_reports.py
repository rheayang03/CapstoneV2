"""Reports endpoints: sales, inventory, orders/transactions, staff attendance, customer purchase history.

Focuses on read-only aggregation using existing models. Keep responses simple and fast.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone as dj_tz

from .views_common import _actor_from_request, _has_permission


def _parse_range(val: str | None):
    now = dj_tz.now()
    if not val:
        return now - timedelta(days=1), now
    s = str(val).lower().strip()
    if s == "24h":
        return now - timedelta(hours=24), now
    if s == "7d":
        return now - timedelta(days=7), now
    if s == "30d":
        return now - timedelta(days=30), now
    try:
        # support ISO start..end
        start_s, end_s = s.split("..", 1)
        return datetime.fromisoformat(start_s), datetime.fromisoformat(end_s)
    except Exception:
        return now - timedelta(days=1), now


@require_http_methods(["GET"])  # /reports/sales
def reports_sales(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "reports.sales.view"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from django.db.models import Sum
        from .models import PaymentTransaction
        r = request.GET.get("range")
        start, end = _parse_range(r)
        qs = PaymentTransaction.objects.filter(created_at__gte=start, created_at__lte=end)
        total = qs.aggregate(total=Sum("amount")).get("total") or 0
        by_method = (
            qs.values("method").annotate(total=Sum("amount")).order_by()
        )
        return JsonResponse({
            "success": True,
            "data": {
                "total": float(total or 0),
                "byMethod": {row["method"]: float(row["total"] or 0) for row in by_method},
                "range": {"from": start.isoformat(), "to": end.isoformat()},
            },
        })
    except Exception:
        return JsonResponse({"success": True, "data": {"total": 0, "byMethod": {}, "range": None}})


@require_http_methods(["GET"])  # /reports/inventory
def reports_inventory(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "reports.inventory.view"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import InventoryItem
        items = InventoryItem.objects.all().order_by("name")
        data = [
            {
                "id": str(i.id),
                "name": i.name,
                "category": i.category,
                "quantity": float(i.quantity or 0),
                "unit": i.unit,
                "minStock": float(i.min_stock or 0),
            }
            for i in items
        ]
        return JsonResponse({"success": True, "data": data})
    except Exception:
        return JsonResponse({"success": True, "data": []})


@require_http_methods(["GET"])  # /reports/orders
def reports_orders(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "reports.orders.view"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from django.db.models import Count
        from .models import Order
        rows = Order.objects.values("status").annotate(count=Count("id"))
        return JsonResponse({"success": True, "data": {r["status"]: r["count"] for r in rows}})
    except Exception:
        return JsonResponse({"success": True, "data": {}})


@require_http_methods(["GET"])  # /reports/staff-attendance
def reports_staff_attendance(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "reports.staff.view"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from django.db.models import Count
        from .models import AttendanceRecord
        rows = AttendanceRecord.objects.values("status").annotate(count=Count("id"))
        return JsonResponse({"success": True, "data": {r["status"]: r["count"] for r in rows}})
    except Exception:
        return JsonResponse({"success": True, "data": {}})


@require_http_methods(["GET"])  # /reports/customer-history?customer=
def reports_customer_history(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "reports.customer.view"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    customer = (request.GET.get("customer") or "").strip()
    try:
        from .models import PaymentTransaction
        qs = PaymentTransaction.objects.all()
        if customer:
            qs = qs.filter(customer__icontains=customer)
        qs = qs.order_by("-created_at")[:500]
        data = [
            {
                "id": str(p.id),
                "orderId": p.order_id,
                "amount": float(p.amount or 0),
                "method": p.method,
                "status": p.status,
                "date": p.created_at.isoformat() if p.created_at else None,
                "reference": p.reference or "",
                "customer": p.customer or "",
            }
            for p in qs
        ]
        return JsonResponse({"success": True, "data": data})
    except Exception:
        return JsonResponse({"success": True, "data": []})


__all__ = [
    "reports_sales",
    "reports_inventory",
    "reports_orders",
    "reports_staff_attendance",
    "reports_customer_history",
]

