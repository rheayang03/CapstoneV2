"""Dashboard summary endpoints that expose live operational metrics."""

from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import DecimalField, ExpressionWrapper, F, Sum, Value
from django.db.models.functions import Coalesce, TruncHour
from django.http import JsonResponse
from django.utils import timezone as dj_tz
from django.views.decorators.http import require_http_methods

from .models import Order, OrderItem, PaymentTransaction
from .views_common import _actor_from_request, _has_permission


def _decimal_to_float(value: Decimal | int | float | None) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _range_bounds(range_param: str | None) -> tuple[datetime, datetime, str]:
    """Return (start, end, normalized_label) for the supplied range value."""
    now = dj_tz.now()
    local_now = dj_tz.localtime(now)
    today_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)

    normalized = "today"
    start = today_start
    if range_param:
        key = range_param.strip().lower()
        if key in {"week", "7d"}:
            normalized = "week"
            start = today_start - timedelta(days=6)
        elif key in {"month", "30d"}:
            normalized = "month"
            start = today_start.replace(day=1)
        elif key in {"day", "1d", "24h"}:
            normalized = "today"
        else:
            # fallback: accept custom numeric days like "14d"
            if key.endswith("d") and key[:-1].isdigit():
                days = int(key[:-1])
                normalized = f"{days}d"
                start = today_start - timedelta(days=max(0, days - 1))
            else:
                normalized = "today"
    start = start.astimezone(dj_tz.get_current_timezone())
    return start, now, normalized


def _ensure_permission(actor) -> JsonResponse | None:
    """Gate dashboard access to users with order or payment viewing capability."""
    if _has_permission(actor, "order.history.view") or _has_permission(actor, "payment.records.view"):
        return None
    return JsonResponse({"success": False, "message": "Forbidden"}, status=403)


def _serialize_hour(bucket: datetime) -> str:
    local = dj_tz.localtime(bucket)
    return local.strftime("%H:%M")


@require_http_methods(["GET"])
def dashboard_stats(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    perm_err = _ensure_permission(actor)
    if perm_err:
        return perm_err

    range_param = request.GET.get("range")
    range_start, range_end, resolved_range = _range_bounds(range_param)

    local_now = dj_tz.localtime(range_end)
    today_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today_start.replace(day=1)

    completed_payments = PaymentTransaction.objects.filter(status=PaymentTransaction.STATUS_COMPLETED)

    daily_sales = completed_payments.filter(created_at__gte=today_start).aggregate(total=Sum("amount"))["total"]
    monthly_sales = completed_payments.filter(created_at__gte=month_start).aggregate(total=Sum("amount"))["total"]

    prev_day_start = today_start - timedelta(days=1)
    prev_day_end = today_start
    prev_month_end = month_start
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

    prev_daily_sales = (
        completed_payments.filter(created_at__gte=prev_day_start, created_at__lt=prev_day_end).aggregate(total=Sum("amount"))[
            "total"
        ]
    )
    prev_monthly_sales = (
        completed_payments.filter(created_at__gte=prev_month_start, created_at__lt=prev_month_end).aggregate(total=Sum("amount"))[
            "total"
        ]
    )

    range_payments = completed_payments.filter(created_at__gte=range_start, created_at__lte=range_end)

    hourly_rows = (
        range_payments.annotate(hour_bucket=TruncHour("created_at"))
        .values("hour_bucket")
        .annotate(amount=Sum("amount"))
        .order_by("hour_bucket")
    )
    sales_by_time = [
        {
            "time": _serialize_hour(row["hour_bucket"]),
            "amount": _decimal_to_float(row["amount"]),
        }
        for row in hourly_rows
        if row.get("hour_bucket") is not None
    ]

    line_total = ExpressionWrapper(F("price") * F("quantity"), output_field=DecimalField(max_digits=14, decimal_places=2))
    category_rows = (
        OrderItem.objects.filter(order__created_at__gte=range_start, order__created_at__lte=range_end)
        .annotate(category=Coalesce("menu_item__category", Value("Uncategorized")))
        .values("category")
        .annotate(amount=Sum(line_total))
        .order_by("-amount")
    )
    sales_by_category = [
        {
            "category": row["category"] or "Uncategorized",
            "amount": _decimal_to_float(row["amount"]),
        }
        for row in category_rows
    ]

    popular_rows = (
        OrderItem.objects.filter(order__created_at__gte=range_start, order__created_at__lte=range_end)
        .annotate(label=Coalesce("menu_item__name", "item_name"))
        .values("label")
        .annotate(count=Sum("quantity"))
        .order_by("-count")[:8]
    )
    popular_items = [
        {
            "name": row["label"] or "Unknown Item",
            "count": int(row["count"] or 0),
        }
        for row in popular_rows
    ]

    orders_qs = Order.objects.filter(created_at__gte=range_start, created_at__lte=range_end)
    order_count = orders_qs.count()
    prev_order_count = (
        Order.objects.filter(created_at__gte=prev_day_start, created_at__lt=prev_day_end).count()
    )
    customer_count = (
        orders_qs.exclude(customer_name__isnull=True)
        .exclude(customer_name__exact="")
        .values("customer_name")
        .distinct()
        .count()
    )

    recent_sales = []
    payment_qs = list(
        PaymentTransaction.objects.filter(status=PaymentTransaction.STATUS_COMPLETED)
        .order_by("-created_at")[:10]
    )
    if payment_qs:
        order_numbers = [p.order_id for p in payment_qs if p.order_id]
        related_orders = {
            o.order_number: o
            for o in Order.objects.filter(order_number__in=order_numbers).only(
                "id", "order_number", "status", "created_at", "total_amount", "payment_method"
            )
        }
        for payment in payment_qs:
            order = related_orders.get(payment.order_id)
            recent_sales.append(
                {
                    "id": str(order.id) if order else payment.order_id,
                    "orderNumber": order.order_number if order else payment.order_id,
                    "total": _decimal_to_float(payment.amount),
                    "paymentMethod": payment.method,
                    "date": payment.created_at.isoformat() if payment.created_at else None,
                    "status": order.status if order else None,
                }
            )
    if len(recent_sales) < 10:
        remaining = 10 - len(recent_sales)
        fallback_orders = (
            Order.objects.filter(status__in=[Order.STATUS_COMPLETED, Order.STATUS_READY])
            .exclude(order_number__in={sale["orderNumber"] for sale in recent_sales if sale.get("orderNumber")})
            .order_by("-created_at")
            .only("id", "order_number", "total_amount", "payment_method", "created_at", "status")[:remaining]
        )
        for order in fallback_orders:
            recent_sales.append(
                {
                    "id": str(order.id),
                    "orderNumber": order.order_number,
                    "total": _decimal_to_float(order.total_amount),
                    "paymentMethod": order.payment_method or "",
                    "date": order.created_at.isoformat() if order.created_at else None,
                    "status": order.status,
                }
            )

    payload = {
        "dailySales": _decimal_to_float(daily_sales),
        "monthlySales": _decimal_to_float(monthly_sales),
        "orderCount": int(order_count),
        "previousDailySales": _decimal_to_float(prev_daily_sales),
        "previousMonthlySales": _decimal_to_float(prev_monthly_sales),
        "previousOrderCount": int(prev_order_count),
        "customerCount": int(customer_count or 0),
        "salesByTime": sales_by_time,
        "salesByCategory": sales_by_category,
        "popularItems": popular_items,
        "recentSales": recent_sales,
        "range": {
            "label": resolved_range,
            "from": range_start.isoformat(),
            "to": range_end.isoformat(),
        },
    }
    return JsonResponse({"success": True, "data": payload})


__all__ = ["dashboard_stats"]
