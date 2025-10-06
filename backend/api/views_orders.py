"""Order endpoints: place order, detail, queue/history, status updates.

Permissions mapping (from views_common.DEFAULT_ROLE_PERMISSIONS):
- Staff/Manager/Admin can place orders (order.place), view status (order.status.view),
  handle queue (order.queue.handle), update status (order.status.update), and bulk track (order.bulk.track).
"""

from __future__ import annotations

import json
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.utils import timezone as dj_tz

from .views_common import _actor_from_request, _has_permission, rate_limit


ORDER_STATES = [
    ("pending", "Pending"),
    ("in_queue", "In Queue"),
    ("in_progress", "In Progress"),
    ("ready", "Ready"),
    ("completed", "Completed"),
    ("cancelled", "Cancelled"),
    ("refunded", "Refunded"),
]

ALLOWED_TRANSITIONS = {
    "pending": {"in_queue", "cancelled"},
    "in_queue": {"in_progress", "cancelled"},
    "in_progress": {"ready", "cancelled"},
    "ready": {"completed", "cancelled"},
    "completed": {"refunded"},
    "cancelled": set(),
    "refunded": set(),
}


def _parse_uuid(val):
    try:
        if not val:
            return None
        _ = UUID(str(val))
        return str(val)
    except Exception:
        return None


def _safe_item(i):
    return {
        "id": str(i.id),
        "menuItemId": str(i.menu_item_id) if i.menu_item_id else None,
        "name": i.item_name,
        "price": float(i.price or 0),
        "quantity": int(i.quantity or 0),
        "total": float((i.price or 0) * (i.quantity or 0)),
        "createdAt": i.created_at.isoformat() if i.created_at else None,
        "updatedAt": i.updated_at.isoformat() if i.updated_at else None,
    }


def _safe_order(o, with_items=True):
    data = {
        "id": str(o.id),
        "orderNumber": o.order_number,
        "status": o.status,
        "type": o.order_type or "walk-in",
        "customerName": o.customer_name or "",
        "subtotal": float(o.subtotal or 0),
        "discount": float(o.discount or 0),
        "total": float(o.total_amount or 0),
        "paymentMethod": o.payment_method or None,
        "timeReceived": o.created_at.isoformat() if o.created_at else None,
        "timeCompleted": o.completed_at.isoformat() if o.completed_at else None,
        "createdAt": o.created_at.isoformat() if o.created_at else None,
        "updatedAt": o.updated_at.isoformat() if o.updated_at else None,
    }
    if with_items:
        try:
            items = list(o.items.all())
            data["items"] = [_safe_item(x) for x in items]
        except Exception:
            data["items"] = []
    return data


@require_http_methods(["GET", "POST"])  # list or create
@rate_limit(limit=20, window_seconds=60)
def orders(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    # GET list with basic filters
    if request.method == "GET":
        try:
            from .models import Order
            status = (request.GET.get("status") or "").lower().strip()
            search = (request.GET.get("search") or "").strip().lower()
            try:
                page = int(request.GET.get("page") or 1)
            except Exception:
                page = 1
            try:
                limit = int(request.GET.get("limit") or 50)
            except Exception:
                limit = 50
            page = max(1, page)
            limit = max(1, min(200, limit))
            qs = Order.objects.all()
            if status:
                qs = qs.filter(status=status)
            if search:
                qs = qs.filter(order_number__icontains=search)
            qs = qs.order_by("-created_at")
            total = qs.count()
            start = (page - 1) * limit
            end = start + limit
            rows = list(qs[start:end])
            data = [_safe_order(x) for x in rows]
            return JsonResponse({
                "success": True,
                "data": data,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "totalPages": max(1, (total + limit - 1) // limit),
                },
            })
        except Exception:
            return JsonResponse({"success": True, "data": [], "pagination": {"page": 1, "limit": 50, "total": 0, "totalPages": 1}})

    # POST create (place order)
    if not _has_permission(actor, "order.place"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        payload = {}
    items = payload.get("items") or []
    order_type = (payload.get("type") or "walk-in").lower()
    customer_name = (payload.get("customerName") or "").strip()
    discount = Decimal(str(payload.get("discount") or 0))
    if not isinstance(items, list) or not items:
        return JsonResponse({"success": False, "message": "items is required"}, status=400)

    try:
        from .models import Order, OrderItem, MenuItem
        with transaction.atomic():
            # Build subtotal from authoritative menu prices
            subtotal = Decimal("0")
            line_items: list[tuple[MenuItem, int]] = []
            for it in items:
                mid = it.get("menuItemId") or it.get("id")
                qty = int(it.get("quantity") or it.get("qty") or 0)
                if not mid or qty <= 0:
                    continue
                mi = MenuItem.objects.filter(id=mid, available=True).first()
                if not mi:
                    continue
                subtotal += (mi.price or 0) * qty
                line_items.append((mi, qty))
            if not line_items:
                return JsonResponse({"success": False, "message": "No valid items"}, status=400)

            total = max(Decimal("0"), subtotal - max(Decimal("0"), discount))
            # Generate a simple order number
            ts = dj_tz.now()
            num = f"W-{ts.strftime('%H%M%S')}{str(ts.microsecond)[:3]}"
            o = Order.objects.create(
                order_number=num,
                status="pending",
                order_type=order_type,
                customer_name=customer_name,
                subtotal=subtotal,
                discount=discount,
                total_amount=total,
                payment_method=("cash" if order_type == "walk-in" else ""),
                placed_by=actor if hasattr(actor, "id") else None,
            )
            for mi, qty in line_items:
                OrderItem.objects.create(
                    order=o,
                    menu_item=mi,
                    item_name=mi.name,
                    price=mi.price or 0,
                    quantity=qty,
                )
            # Auto enqueue
            o.status = "in_queue"
            o.save(update_fields=["status", "updated_at"])
        return JsonResponse({"success": True, "data": _safe_order(o)})
    except Exception:
        return JsonResponse({"success": False, "message": "Failed to create order"}, status=500)


@require_http_methods(["GET"])  # queue
@rate_limit(limit=60, window_seconds=60)
def order_queue(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "order.queue.handle"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import Order
        qs = Order.objects.filter(status__in=["pending", "in_queue", "in_progress", "ready"]).order_by("created_at")
        return JsonResponse({"success": True, "data": [_safe_order(x) for x in qs]})
    except Exception:
        return JsonResponse({"success": True, "data": []})


@require_http_methods(["GET"])  # history
@rate_limit(limit=30, window_seconds=60)
def order_history(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import Order
        qs = Order.objects.filter(status__in=["completed", "cancelled", "refunded"]).order_by("-created_at")
        return JsonResponse({"success": True, "data": [_safe_order(x) for x in qs]})
    except Exception:
        return JsonResponse({"success": True, "data": []})


@require_http_methods(["GET"])  # bulk progress by IDs
@rate_limit(limit=120, window_seconds=60)
def order_bulk_progress(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "order.bulk.track"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    ids_param = request.GET.get("order_ids") or request.GET.get("ids") or ""
    ids = [s for s in [x.strip() for x in ids_param.split(",")] if s]
    uuids = []
    for s in ids:
        u = _parse_uuid(s)
        if u:
            uuids.append(u)
    try:
        from .models import Order
        qs = Order.objects.filter(id__in=uuids)
        data = [{"id": str(x.id), "status": x.status, "updatedAt": x.updated_at.isoformat() if x.updated_at else None} for x in qs]
        return JsonResponse({"success": True, "data": data})
    except Exception:
        return JsonResponse({"success": True, "data": []})


@require_http_methods(["GET"])  # detail
@rate_limit(limit=60, window_seconds=60)
def order_detail(request, oid):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import Order
        o = Order.objects.filter(id=oid).first()
        if not o:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        return JsonResponse({"success": True, "data": _safe_order(o)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


@require_http_methods(["PATCH"])  # status update
@rate_limit(limit=30, window_seconds=60)
def order_status(request, oid):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "order.status.update"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import Order
        o = Order.objects.filter(id=oid).first()
        if not o:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}
        new_status = (payload.get("status") or "").lower()
        if new_status not in {s for s, _ in ORDER_STATES}:
            return JsonResponse({"success": False, "message": "Invalid status"}, status=400)
        allowed = ALLOWED_TRANSITIONS.get(o.status, set())
        if new_status not in allowed:
            return JsonResponse({"success": False, "message": f"Illegal transition from {o.status} to {new_status}"}, status=400)
        o.status = new_status
        if new_status == "completed":
            o.completed_at = dj_tz.now()
        o.save(update_fields=["status", "completed_at", "updated_at"])
        # Optional: decrement inventory on completion using simple recipe from MenuItem.ingredients
        if new_status == "completed":
            try:
                from .models import InventoryItem
                from .inventory_services import consume_for_order
                # Build components = [(InventoryItem, qty)]
                comp_map: dict[str, int] = {}
                for li in o.items.select_related("menu_item").all():
                    mi = li.menu_item
                    if not mi:
                        continue
                    ings = mi.ingredients or []
                    for inv_id in ings:
                        try:
                            # treat ingredient as inventory item id; 1 unit per line-item quantity
                            iid = str(inv_id)
                            comp_map[iid] = comp_map.get(iid, 0) + int(li.quantity or 0)
                        except Exception:
                            continue
                if comp_map:
                    # Load items present in comp_map
                    invs = {str(x.id): x for x in InventoryItem.objects.filter(id__in=list(comp_map.keys()))}
                    components = [(invs[k], comp_map[k]) for k in comp_map.keys() if k in invs]
                    if components:
                        # Use MAIN location by default
                        from .models import Location
                        loc = Location.objects.filter(code="MAIN").first() or Location.objects.create(code="MAIN", name="Main")
                        consume_for_order(order_id=str(o.id), components=components, location=loc, actor=actor if hasattr(actor, "id") else None)
            except Exception:
                pass
        # Optional: audit log
        try:
            from .utils_audit import record_audit
            record_audit(
                request,
                user=actor if hasattr(actor, "id") else None,
                type="action",
                action="Order status update",
                details=f"order={o.order_number} status={new_status}",
                severity="info",
                meta={"orderId": str(o.id), "status": new_status},
            )
        except Exception:
            pass
        return JsonResponse({"success": True, "data": _safe_order(o)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


__all__ = [
    "orders",
    "order_queue",
    "order_history",
    "order_bulk_progress",
    "order_detail",
    "order_status",
]
