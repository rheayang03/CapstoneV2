from __future__ import annotations

import json
from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.db.models import Count, F, Sum, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncDay, TruncMonth
from django.http import JsonResponse
from django.utils import timezone as dj_tz
from django.views.decorators.http import require_http_methods

from .models import (
    AnalyticsEvent,
    AnalyticsSnapshot,
    AttendanceRecord,
    Employee,
    InventoryItem,
    Order,
    OrderItem,
    PaymentTransaction,
    ScheduleEntry,
)
from .views_common import _actor_from_request, _has_permission


ANALYTICS_PERMISSIONS = {
    "sales": "reports.sales.view",
    "inventory": "reports.inventory.view",
    "orders": "reports.orders.view",
    "attendance": "reports.staff.view",
    "customers": "reports.customer.view",
}


def _parse_range(value: str | None) -> tuple[datetime, datetime]:
    now = dj_tz.now()
    if not value:
        return now - timedelta(days=30), now
    s = str(value).strip().lower()
    if s.endswith("h") and s[:-1].isdigit():
        hours = int(s[:-1])
        return now - timedelta(hours=hours), now
    if s.endswith("d") and s[:-1].isdigit():
        days = int(s[:-1])
        return now - timedelta(days=days), now
    if s.endswith("w") and s[:-1].isdigit():
        weeks = int(s[:-1])
        return now - timedelta(weeks=weeks), now
    try:
        start_s, end_s = s.split("..", 1)
        start = datetime.fromisoformat(start_s)
        end = datetime.fromisoformat(end_s)
        if dj_tz.is_naive(start):
            start = dj_tz.make_aware(start, dj_tz.get_current_timezone())
        if dj_tz.is_naive(end):
            end = dj_tz.make_aware(end, dj_tz.get_current_timezone())
        if start > end:
            start, end = end, start
        return start, end
    except Exception:
        return now - timedelta(days=30), now


def _persist_snapshot(category: str, data: dict, actor, start: datetime, end: datetime, label: str = "") -> None:
    try:
        AnalyticsSnapshot.objects.update_or_create(
            category=category,
            range_start=start,
            range_end=end,
            defaults={
                "label": label or category.title(),
                "data": data,
                "generated_by": actor,
            },
        )
    except Exception:
        # Snapshot persistence should never break the API response
        pass


def _record_event(actor, category: str, action: str, payload: dict | None = None) -> None:
    try:
        AnalyticsEvent.objects.create(
            category=category,
            action=action,
            actor=actor,
            payload=payload or {},
        )
    except Exception:
        pass


def _decimal_to_float(value: Decimal | int | float | None) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _hours_between(start_time, end_time) -> float:
    if not start_time or not end_time:
        return 0.0
    start_dt = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)
    diff = (end_dt - start_dt).total_seconds() / 3600.0
    if diff < 0:
        diff += 24
    return round(diff, 2)


@require_http_methods(["GET"])
def analytics_sales(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, ANALYTICS_PERMISSIONS["sales"]):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    range_param = request.GET.get("range", "30d")
    start, end = _parse_range(range_param)

    try:
        transactions = PaymentTransaction.objects.filter(
            status=PaymentTransaction.STATUS_COMPLETED,
            created_at__gte=start,
            created_at__lte=end,
        )
        total_revenue = transactions.aggregate(total=Sum("amount")).get("total") or Decimal("0")
        total_orders = Order.objects.filter(created_at__gte=start, created_at__lte=end).count()
        avg_order_value = float(total_revenue / total_orders) if total_orders else 0.0

        daily_rows = (
            transactions.annotate(day=TruncDay("created_at"))
            .values("day")
            .annotate(revenue=Sum("amount"), orders=Count("id"))
            .order_by("day")
        )
        daily = [
            {
                "date": row["day"].date().isoformat() if row["day"] else None,
                "revenue": _decimal_to_float(row.get("revenue")),
                "orders": row.get("orders", 0) or 0,
            }
            for row in daily_rows
            if row.get("day")
        ]

        monthly_rows = (
            transactions.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(revenue=Sum("amount"))
            .order_by("month")
        )
        monthly = [
            {
                "month": row["month"].strftime("%Y-%m") if row["month"] else None,
                "revenue": _decimal_to_float(row.get("revenue")),
            }
            for row in monthly_rows
            if row.get("month")
        ]

        items = (
            OrderItem.objects.filter(order__created_at__gte=start, order__created_at__lte=end)
            .annotate(
                item_revenue=ExpressionWrapper(
                    F("price") * F("quantity"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
            .values("item_name")
            .annotate(
                quantity=Sum("quantity"),
                revenue=Sum("item_revenue"),
            )
            .order_by("-quantity")[:10]
        )
        top_items = [
            {
                "name": row.get("item_name") or "Uncategorized",
                "quantity": int(row.get("quantity") or 0),
                "revenue": _decimal_to_float(row.get("revenue")),
            }
            for row in items
        ]

        summary = {
            "totalRevenue": _decimal_to_float(total_revenue),
            "totalOrders": total_orders,
            "averageOrderValue": round(avg_order_value, 2),
            "topItems": top_items,
            "daily": daily,
            "monthly": monthly,
            "range": {"from": start.isoformat(), "to": end.isoformat()},
        }

        _persist_snapshot("sales", summary, actor, start, end, label="Sales Summary")
        _record_event(actor, "sales", "view_summary", {"range": range_param})

        return JsonResponse({"success": True, "data": summary})
    except Exception as exc:
        return JsonResponse(
            {
                "success": False,
                "message": "Unable to compute sales analytics",
                "details": str(exc),
            },
            status=500,
        )


@require_http_methods(["GET"])
def analytics_inventory(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, ANALYTICS_PERMISSIONS["inventory"]):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    try:
        items_qs = InventoryItem.objects.all().order_by("name")
        now = dj_tz.now().date()
        threshold = now + timedelta(days=7)
        items = []
        low_stock_count = 0
        expiring = []

        for item in items_qs:
            quantity = _decimal_to_float(item.quantity)
            min_stock = _decimal_to_float(item.min_stock)
            item_data = {
                "id": str(item.id),
                "name": item.name,
                "category": item.category,
                "quantity": quantity,
                "unit": item.unit,
                "minStock": min_stock,
                "supplier": item.supplier,
                "lastRestocked": item.last_restocked.isoformat() if item.last_restocked else None,
                "expiryDate": item.expiry_date.isoformat() if item.expiry_date else None,
            }
            items.append(item_data)

            if quantity <= min_stock:
                low_stock_count += 1
            if item.expiry_date and now <= item.expiry_date <= threshold:
                days_left = (item.expiry_date - now).days
                expiring.append({
                    "id": str(item.id),
                    "name": item.name,
                    "quantity": quantity,
                    "unit": item.unit,
                    "expiryDate": item.expiry_date.isoformat(),
                    "daysToExpiry": days_left,
                })

        expiring.sort(key=lambda x: x["daysToExpiry"])
        ok_stock = max(len(items) - low_stock_count, 0)

        result = {
            "items": items,
            "lowStockCount": low_stock_count,
            "okStockCount": ok_stock,
            "expiringSoon": expiring,
            "totals": {
                "itemCount": len(items),
                "lowStockPercent": round((low_stock_count / len(items) * 100) if items else 0, 2),
            },
            "generatedAt": dj_tz.now().isoformat(),
        }

        _persist_snapshot("inventory", result, actor, dj_tz.now() - timedelta(hours=1), dj_tz.now())
        _record_event(actor, "inventory", "view_summary", {})

        return JsonResponse({"success": True, "data": result})
    except Exception as exc:
        return JsonResponse(
            {
                "success": False,
                "message": "Unable to compute inventory analytics",
                "details": str(exc),
            },
            status=500,
        )


@require_http_methods(["GET"])
def analytics_orders(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, ANALYTICS_PERMISSIONS["orders"]):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    range_param = request.GET.get("range", "30d")
    start, end = _parse_range(range_param)

    try:
        orders_qs = Order.objects.filter(created_at__gte=start, created_at__lte=end)
        orders_by_day = (
            orders_qs.annotate(day=TruncDay("created_at"))
            .values("day")
            .annotate(order_count=Count("id"), revenue=Sum("total_amount"))
            .order_by("day")
        )
        orders_vs_revenue = [
            {
                "date": row["day"].date().isoformat() if row["day"] else None,
                "orders": row.get("order_count", 0) or 0,
                "revenue": _decimal_to_float(row.get("revenue")),
            }
            for row in orders_by_day
            if row.get("day")
        ]

        status_rows = orders_qs.values("status").annotate(count=Count("id"))
        status_breakdown = {row["status"]: row["count"] for row in status_rows}

        transactions = PaymentTransaction.objects.filter(
            created_at__gte=start,
            created_at__lte=end,
            status=PaymentTransaction.STATUS_COMPLETED,
        )
        method_rows = transactions.values("method").annotate(total=Sum("amount"))
        payments_by_method = [
            {"method": row["method"], "amount": _decimal_to_float(row.get("total"))}
            for row in method_rows
        ]

        recent_transactions = [
            {
                "id": str(tx.id),
                "orderId": tx.order_id,
                "amount": _decimal_to_float(tx.amount),
                "method": tx.method,
                "timestamp": tx.created_at.isoformat() if tx.created_at else None,
                "status": tx.status,
            }
            for tx in transactions.order_by("-created_at")[:25]
        ]

        result = {
            "ordersVsRevenue": orders_vs_revenue,
            "statusBreakdown": status_breakdown,
            "paymentsByMethod": payments_by_method,
            "recentTransactions": recent_transactions,
            "range": {"from": start.isoformat(), "to": end.isoformat()},
        }

        _persist_snapshot("orders", result, actor, start, end, label="Orders & Transactions")
        _record_event(actor, "orders", "view_summary", {"range": range_param})

        return JsonResponse({"success": True, "data": result})
    except Exception as exc:
        return JsonResponse(
            {
                "success": False,
                "message": "Unable to compute order analytics",
                "details": str(exc),
            },
            status=500,
        )


@require_http_methods(["GET"])
def analytics_attendance(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, ANALYTICS_PERMISSIONS["attendance"]):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    range_param = request.GET.get("range", "30d")
    start, end = _parse_range(range_param)

    try:
        records = AttendanceRecord.objects.filter(date__gte=start.date(), date__lte=end.date())
        status_counts = defaultdict(int)
        for rec in records:
            status_counts[rec.status] += 1

        schedule_entries = ScheduleEntry.objects.select_related("employee")
        hours_map: dict[str, float] = defaultdict(float)
        for entry in schedule_entries:
            hours_map[str(entry.employee_id)] += _hours_between(entry.start_time, entry.end_time)

        scheduled_hours = []
        for emp in Employee.objects.all():
            emp_id = str(emp.id)
            scheduled_hours.append(
                {
                    "employeeId": emp_id,
                    "name": emp.name,
                    "hours": round(hours_map.get(emp_id, 0.0), 2),
                }
            )

        roster = [
            {
                "id": str(emp.id),
                "name": emp.name,
                "position": emp.position,
                "hourlyRate": _decimal_to_float(emp.hourly_rate),
            }
            for emp in Employee.objects.all().order_by("name")
        ]

        result = {
            "statusCounts": dict(status_counts),
            "scheduledHours": scheduled_hours,
            "roster": roster,
            "range": {"from": start.isoformat(), "to": end.isoformat()},
        }

        _persist_snapshot("attendance", result, actor, start, end, label="Attendance")
        _record_event(actor, "attendance", "view_summary", {"range": range_param})

        return JsonResponse({"success": True, "data": result})
    except Exception as exc:
        return JsonResponse(
            {
                "success": False,
                "message": "Unable to compute attendance analytics",
                "details": str(exc),
            },
            status=500,
        )


@require_http_methods(["GET"])
def analytics_customers(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, ANALYTICS_PERMISSIONS["customers"]):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    range_param = request.GET.get("range", "30d")
    start, end = _parse_range(range_param)

    try:
        transactions = PaymentTransaction.objects.filter(
            created_at__gte=start,
            created_at__lte=end,
            status=PaymentTransaction.STATUS_COMPLETED,
        )
        daily_rows = (
            transactions.annotate(day=TruncDay("created_at"))
            .values("day")
            .annotate(total=Sum("amount"))
            .order_by("day")
        )
        daily_totals = [
            {
                "date": row["day"].date().isoformat() if row["day"] else None,
                "total": _decimal_to_float(row.get("total")),
            }
            for row in daily_rows
            if row.get("day")
        ]

        recent = [
            {
                "id": str(tx.id),
                "orderId": tx.order_id,
                "customer": tx.customer or "-",
                "method": tx.method,
                "amount": _decimal_to_float(tx.amount),
                "timestamp": tx.created_at.isoformat() if tx.created_at else None,
            }
            for tx in transactions.order_by("-created_at")[:25]
        ]

        top_customers_rows = (
            transactions.exclude(customer="")
            .values("customer")
            .annotate(total=Sum("amount"), orders=Count("id"))
            .order_by("-total")[:10]
        )
        top_customers = [
            {
                "customer": row["customer"],
                "total": _decimal_to_float(row.get("total")),
                "orders": row.get("orders", 0) or 0,
            }
            for row in top_customers_rows
        ]

        result = {
            "dailyTotals": daily_totals,
            "recentPurchases": recent,
            "topCustomers": top_customers,
            "range": {"from": start.isoformat(), "to": end.isoformat()},
        }

        _persist_snapshot("customers", result, actor, start, end, label="Customer History")
        _record_event(actor, "customers", "view_summary", {"range": range_param})

        return JsonResponse({"success": True, "data": result})
    except Exception as exc:
        return JsonResponse(
            {
                "success": False,
                "message": "Unable to compute customer analytics",
                "details": str(exc),
            },
            status=500,
        )


@require_http_methods(["GET", "POST"])
def analytics_events(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, ANALYTICS_PERMISSIONS["sales"]):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    if request.method == "POST":
        try:
            payload = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "message": "Invalid JSON body"}, status=400)

        category = str(payload.get("category") or "general")[:64]
        action = str(payload.get("action") or "event")[:128]
        event_payload = payload.get("payload") or {}
        meta = payload.get("meta") or {}
        event = AnalyticsEvent.objects.create(
            category=category,
            action=action,
            actor=actor,
            payload=event_payload,
            meta=meta,
        )
        return JsonResponse(
            {
                "success": True,
                "data": {
                    "id": str(event.id),
                    "category": event.category,
                    "action": event.action,
                    "payload": event.payload,
                    "meta": event.meta,
                    "occurredAt": event.occurred_at.isoformat(),
                },
            },
            status=201,
        )

    limit = min(int(request.GET.get("limit", "50") or 50), 200)
    events = [
        {
            "id": str(evt.id),
            "category": evt.category,
            "action": evt.action,
            "payload": evt.payload,
            "meta": evt.meta,
            "actor": evt.actor.email if evt.actor else None,
            "occurredAt": evt.occurred_at.isoformat(),
        }
        for evt in AnalyticsEvent.objects.order_by("-occurred_at")[:limit]
    ]
    return JsonResponse({"success": True, "data": events})


@require_http_methods(["GET"])
def analytics_snapshots(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, ANALYTICS_PERMISSIONS["sales"]):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    category = request.GET.get("category")
    limit = min(int(request.GET.get("limit", "20") or 20), 100)
    qs = AnalyticsSnapshot.objects.all().order_by("-updated_at")
    if category:
        qs = qs.filter(category=category)
    snapshots = [
        {
            "id": str(snap.id),
            "category": snap.category,
            "label": snap.label,
            "range": {
                "from": snap.range_start.isoformat() if snap.range_start else None,
                "to": snap.range_end.isoformat() if snap.range_end else None,
            },
            "data": snap.data,
            "generatedBy": snap.generated_by.email if snap.generated_by else None,
            "updatedAt": snap.updated_at.isoformat(),
        }
        for snap in qs[:limit]
    ]
    return JsonResponse({"success": True, "data": snapshots})


__all__ = [
    "analytics_sales",
    "analytics_inventory",
    "analytics_orders",
    "analytics_attendance",
    "analytics_customers",
    "analytics_events",
    "analytics_snapshots",
]
