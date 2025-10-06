"""Inventory endpoints: items CRUD, stock adjustments, low stock, activities."""

import json
from datetime import datetime
from decimal import Decimal, InvalidOperation
from uuid import UUID
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.db.models import Q
from django.utils import timezone as dj_timezone

from .views_common import _actor_from_request, _has_permission, _paginate, rate_limit
from .inventory_services import (
    get_current_stock,
    record_receipt,
    adjust_stock,
    get_low_stock as svc_get_low_stock,
    get_expiring_batches,
    consume_for_order,
    transfer_stock,
    get_recent_activity,
    trigger_low_stock_notifications,
)


def _safe_item(i, stock_qty: float | None = None):
    return {
        "id": str(i.id),
        "name": i.name,
        "category": i.category,
        "quantity": float(stock_qty if stock_qty is not None else (i.quantity or 0)),
        "unit": i.unit,
        "minStock": float(i.min_stock or 0),
        "supplier": i.supplier,
        "lastRestocked": i.last_restocked.isoformat() if i.last_restocked else None,
        "expiryDate": i.expiry_date.isoformat() if i.expiry_date else None,
        "createdAt": i.created_at.isoformat() if i.created_at else None,
        "updatedAt": i.updated_at.isoformat() if i.updated_at else None,
    }


def _safe_activity(a):
    return {
        "id": str(a.id),
        "itemId": str(a.item_id),
        "itemName": getattr(a.item, "name", ""),
        "action": a.action,
        "quantityChange": float(a.quantity_change or 0),
        "previousQuantity": float(a.previous_quantity or 0),
        "newQuantity": float(a.new_quantity or 0),
        "reason": a.reason,
        "performedBy": a.performed_by or (getattr(a.actor, "email", "") or ""),
        "timestamp": a.created_at.isoformat() if a.created_at else None,
    }


def _safe_reorder_setting(rs):
    return {
        "id": str(rs.id),
        "itemId": str(rs.item_id),
        "itemName": getattr(rs.item, "name", ""),
        "locationId": str(rs.location_id),
        "locationCode": getattr(rs.location, "code", ""),
        "reorderPoint": float(rs.reorder_point or 0),
        "reorderQty": float(rs.reorder_qty or 0),
        "leadTimeDays": int(getattr(rs, "lead_time_days", 0) or 0),
        "lowStockThreshold": float(getattr(rs, "low_stock_threshold", 0) or 0),
        "createdAt": rs.created_at.isoformat() if rs.created_at else None,
        "updatedAt": rs.updated_at.isoformat() if rs.updated_at else None,
    }


@require_http_methods(["GET", "POST"]) 
@rate_limit(limit=60, window_seconds=60)
def inventory_items(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if request.method == "GET":
        try:
            from .models import InventoryItem
            search = (request.GET.get("search") or "").strip().lower()
            category = (request.GET.get("category") or "").strip()
            try:
                page = int(request.GET.get("page", 1) or 1)
            except Exception:
                page = 1
            try:
                limit = int(request.GET.get("limit", 50) or 50)
            except Exception:
                limit = 50
            page = max(1, page)
            limit = max(1, min(200, limit))
            qs = InventoryItem.objects.all()
            if search:
                qs = qs.filter(Q(name__icontains=search) | Q(category__icontains=search) | Q(supplier__icontains=search))
            if category:
                qs = qs.filter(category=category)
            qs = qs.order_by("name")
            total = qs.count()
            start = (page - 1) * limit
            end = start + limit
            page_items = list(qs[start:end])
            ids = [str(i.id) for i in page_items]
            stock_map = get_current_stock(ids, location_id=None, as_of=None)
            items = [_safe_item(i, float(stock_map.get(str(i.id), 0))) for i in page_items]
            pagination = {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": max(1, (total + limit - 1) // limit),
            }
            return JsonResponse({"success": True, "data": items, "pagination": pagination})
        except Exception:
            return JsonResponse({"success": True, "data": [], "pagination": {"page": 1, "limit": 50, "total": 0, "totalPages": 1}})

    # POST: Manager/Admin required (or explicit inventory.menu.manage)
    if not (_has_permission(actor, "inventory.menu.manage") or _has_permission(actor, "inventory.update") or getattr(actor, "role", "").lower() in {"admin", "manager"}):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import InventoryItem, Location
        data = json.loads(request.body.decode("utf-8") or "{}")
        name = (data.get("name") or "").strip()
        if not name:
            return JsonResponse({"success": False, "message": "Name is required"}, status=400)
        qty = float(data.get("quantity") or 0)
        min_stock = float(data.get("minStock") or data.get("min_stock") or 0)
        expiry_date = data.get("expiryDate") or data.get("expiry_date") or None
        if expiry_date:
            try:
                expiry_date = datetime.fromisoformat(str(expiry_date)).date()
            except Exception:
                expiry_date = None
        item = InventoryItem.objects.create(
            name=name,
            category=(data.get("category") or "").strip(),
            quantity=qty,
            unit=(data.get("unit") or "").strip(),
            min_stock=min_stock,
            supplier=(data.get("supplier") or "").strip(),
            last_restocked=dj_timezone.now() if qty > 0 else None,
            expiry_date=expiry_date,
        )
        # If initial quantity provided, mirror it into the ledger as a receipt
        try:
            if qty > 0:
                loc = Location.objects.filter(code="MAIN").first() or Location.objects.create(code="MAIN", name="Main")
                record_receipt(item=item, qty=qty, location=loc, actor=actor if hasattr(actor, "id") else None, reference_type="opening_balance")
        except Exception:
            pass
        # Return with authoritative quantity from ledger
        stock_map = get_current_stock([str(item.id)], location_id=None, as_of=None)
        return JsonResponse({"success": True, "data": _safe_item(item, float(stock_map.get(str(item.id), 0)))})
    except Exception:
        return JsonResponse({"success": False, "message": "Failed to create item"}, status=500)


@require_http_methods(["GET", "PUT", "DELETE"]) 
@rate_limit(limit=60, window_seconds=60)
def inventory_item_detail(request, iid):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import InventoryItem
        item = InventoryItem.objects.filter(id=iid).first()
        if not item:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        if request.method == "GET":
            stock_map = get_current_stock([str(item.id)], location_id=None, as_of=None)
            return JsonResponse({"success": True, "data": _safe_item(item, float(stock_map.get(str(item.id), 0)))})
        # Update/delete require Manager/Admin or inventory.update
        if not (_has_permission(actor, "inventory.update") or getattr(actor, "role", "").lower() in {"admin", "manager"}):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        if request.method == "DELETE":
            item.delete()
            return JsonResponse({"success": True, "message": "Deleted"})
        data = json.loads(request.body.decode("utf-8") or "{}")
        fields = ["name", "category", "unit", "supplier"]
        changed = False
        changes = {}
        for f in fields:
            if f in data and data[f] is not None:
                old = getattr(item, f)
                new = data[f]
                if old != new:
                    changes[f] = {"old": old, "new": new}
                    setattr(item, f, new)
                    changed = True
        if "quantity" in data and data["quantity"] is not None:
            try:
                item.quantity = float(data["quantity"]) or 0
                changed = True
            except Exception:
                pass
        if "minStock" in data or "min_stock" in data:
            try:
                new_min = float(data.get("minStock") or data.get("min_stock") or 0)
                if float(item.min_stock or 0) != new_min:
                    changes["min_stock"] = {"old": float(item.min_stock or 0), "new": new_min}
                    item.min_stock = new_min
                changed = True
            except Exception:
                pass
        if "expiryDate" in data or "expiry_date" in data:
            exp = data.get("expiryDate") or data.get("expiry_date") or None
            if exp:
                try:
                    new_exp = datetime.fromisoformat(str(exp)).date()
                    if item.expiry_date != new_exp:
                        changes["expiry_date"] = {"old": item.expiry_date.isoformat() if item.expiry_date else None, "new": new_exp.isoformat()}
                        item.expiry_date = new_exp
                    changed = True
                except Exception:
                    pass
        if changed:
            item.save()
            try:
                from .models import InventoryActivity
                InventoryActivity.objects.create(
                    item=item,
                    action="update",
                    quantity_change=0,
                    previous_quantity=0,
                    new_quantity=0,
                    reason="Item updated",
                    performed_by=(getattr(actor, "email", None) or (actor.get("email") if isinstance(actor, dict) else "") or ""),
                    actor=actor if hasattr(actor, "id") else None,
                    meta={"changed": changes},
                )
            except Exception:
                pass
        # Return item with authoritative quantity
        stock_map = get_current_stock([str(item.id)], location_id=None, as_of=None)
        return JsonResponse({"success": True, "data": _safe_item(item, float(stock_map.get(str(item.id), 0)))})
    except Exception:
        return JsonResponse({"success": False, "message": "Error"}, status=500)


@require_http_methods(["PATCH"]) 
@rate_limit(limit=60, window_seconds=60)
def inventory_item_stock(request, iid):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not (_has_permission(actor, "inventory.update") or getattr(actor, "role", "").lower() in {"admin", "manager", "staff"}):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from django.db import connection
        from .models import InventoryItem, InventoryActivity, Location
        data = json.loads(request.body.decode("utf-8") or "{}")
        try:
            qty = float(data.get("quantity") or 0)
        except Exception:
            return JsonResponse({"success": False, "message": "quantity must be a number"}, status=400)
        op = (data.get("operation") or "set").lower()
        reason = (data.get("reason") or "").strip()
        if op not in {"add", "subtract", "sub", "set"}:
            return JsonResponse({"success": False, "message": "Invalid operation"}, status=400)
        if op in {"add", "subtract", "sub"} and qty < 0:
            return JsonResponse({"success": False, "message": "quantity must be non-negative"}, status=400)

        with transaction.atomic():
            qs = InventoryItem.objects.filter(id=iid)
            # Only use SELECT FOR UPDATE on backends that support it
            try:
                if connection.features.has_select_for_update:
                    qs = qs.select_for_update()
            except Exception:
                # Be safe on SQLite and other limited backends
                pass
            item = qs.first()
            if not item:
                return JsonResponse({"success": False, "message": "Not found"}, status=404)

            # previous from ledger
            prev_map = get_current_stock([str(item.id)], location_id=None, as_of=None)
            prev = float(prev_map.get(str(item.id), 0))
            loc = Location.objects.filter(code="MAIN").first() or Location.objects.create(code="MAIN", name="Main")
            try:
                if op == "add":
                    if qty == 0:
                        # No-op add; just return current
                        new_q = prev
                    else:
                        record_receipt(item=item, qty=qty, location=loc, actor=actor if hasattr(actor, "id") else None)
                        new_q = float(get_current_stock([str(item.id)], location_id=None, as_of=None).get(str(item.id), 0))
                elif op in {"subtract", "sub"}:
                    if qty == 0:
                        new_q = prev
                    else:
                        adjust_stock(item=item, delta_qty=-qty, location=loc, reason=reason, actor=actor if hasattr(actor, "id") else None)
                        new_q = float(get_current_stock([str(item.id)], location_id=None, as_of=None).get(str(item.id), 0))
                else:  # set
                    delta = qty - prev
                    if delta != 0:
                        adjust_stock(item=item, delta_qty=delta, location=loc, reason=reason, actor=actor if hasattr(actor, "id") else None)
                        new_q = float(get_current_stock([str(item.id)], location_id=None, as_of=None).get(str(item.id), 0))
                    else:
                        new_q = prev
            except ValueError as ve:
                # Business-rule errors from services -> 400
                return JsonResponse({"success": False, "message": str(ve)}, status=400)

            # Non-authoritative activity log for UI
            try:
                InventoryActivity.objects.create(
                    item=item,
                    action=("restock" if op == "add" else ("usage" if op in {"subtract", "sub"} else "set")),
                    quantity_change=(new_q - prev),
                    previous_quantity=prev,
                    new_quantity=new_q,
                    reason=reason,
                    performed_by=(getattr(actor, "email", None) or (actor.get("email") if isinstance(actor, dict) else "") or ""),
                    actor=actor if hasattr(actor, "id") else None,
                )
            except Exception:
                # Do not fail the request if activity logging fails
                pass

        return JsonResponse({"success": True, "data": _safe_item(item, new_q)})
    except Exception:
        return JsonResponse({"success": False, "message": "Failed to update stock"}, status=500)


@require_http_methods(["GET"]) 
@rate_limit(limit=120, window_seconds=60)
def inventory_low_stock(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        # Use authoritative service-based low stock
        low = svc_get_low_stock()
        data = [_safe_item(item, float(qty)) for (item, qty) in low]
        return JsonResponse({"success": True, "data": data})
    except Exception:
        return JsonResponse({"success": True, "data": []})


@require_http_methods(["POST"])
@rate_limit(limit=30, window_seconds=60)
def inventory_low_stock_notify(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "inventory.lowstock.alerts"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        payload = {}
    items = payload.get("itemIds") or payload.get("item_ids") or payload.get("items")
    item_ids: list[str] = []
    if isinstance(items, str):
        item_ids = [s for s in (x.strip() for x in items.split(",")) if s]
    elif isinstance(items, list):
        item_ids = [str(x) for x in items if x]
    notified = trigger_low_stock_notifications(item_ids or None)
    return JsonResponse({
        "success": True,
        "data": {
            "count": len(notified),
            "notifiedItems": notified,
        },
    })


@require_http_methods(["GET"]) 
@rate_limit(limit=120, window_seconds=60)
def inventory_activities(request):
    # Deprecated stub: return authoritative recent activity below for compatibility
    return inventory_recent_activity(request)


from .utils_dbtime import db_now


@require_http_methods(["GET"]) 
@rate_limit(limit=120, window_seconds=60)
def inventory_db_now(request):
    # No auth needed for simple clock? Keep consistent with other endpoints: require auth
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    now = db_now()
    return JsonResponse(
        {
            "success": True,
            "data": {
                "dbNow": now.isoformat(),
                "epochSeconds": int(now.timestamp()),
            },
        }
    )


@require_http_methods(["GET"]) 
@rate_limit(limit=120, window_seconds=60)
def inventory_stock(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        ids_param = request.GET.get("ingredient_ids") or request.GET.get("item_ids") or ""
        ids = [s for s in [x.strip() for x in ids_param.split(",")] if s]
        location_id = request.GET.get("location_id") or None
        as_of = request.GET.get("as_of") or None
        as_of_dt = None
        if as_of:
            try:
                as_of_dt = datetime.fromisoformat(as_of)
            except Exception:
                as_of_dt = None
        data = get_current_stock(ids or None, location_id=location_id, as_of=as_of_dt)
        # Convert Decimal to float
        out = {k: float(v or 0) for k, v in data.items()}
        return JsonResponse({"success": True, "data": out})
    except Exception:
        return JsonResponse({"success": True, "data": {}})


@require_http_methods(["GET"]) 
@rate_limit(limit=120, window_seconds=60)
def inventory_expiring(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import InventoryItem
        days = int(request.GET.get("days") or 7)
        ids_param = request.GET.get("ingredient_ids") or request.GET.get("item_ids") or ""
        ids = [s for s in [x.strip() for x in ids_param.split(",")] if s]
        location_id = request.GET.get("location_id") or None
        batches = get_expiring_batches(days, item_ids=ids or None, location_id=location_id)
        data = []
        for b in batches:
            data.append({
                "id": str(b.id),
                "itemId": str(b.item_id),
                "itemName": getattr(b.item, "name", ""),
                "lotCode": b.lot_code,
                "expiryDate": b.expiry_date.isoformat() if b.expiry_date else None,
                "receivedAt": b.received_at.isoformat() if b.received_at else None,
                "supplier": b.supplier,
                "unitCost": float(b.unit_cost or 0),
            })
        return JsonResponse({"success": True, "data": data})
    except Exception:
        return JsonResponse({"success": True, "data": []})


@require_http_methods(["POST"]) 
@rate_limit(limit=60, window_seconds=60)
def inventory_receipts(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not (_has_permission(actor, "inventory.update") or getattr(actor, "role", "").lower() in {"admin", "manager", "staff"}):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import InventoryItem, Location, Batch
        payload = json.loads(request.body.decode("utf-8") or "{}")
        item_id = payload.get("itemId") or payload.get("item_id")
        qty = float(payload.get("qty") or payload.get("quantity") or 0)
        location_code = (payload.get("location") or payload.get("locationCode") or "MAIN").strip() or "MAIN"
        loc = Location.objects.filter(code=location_code).first() or Location.objects.create(code=location_code, name=location_code.title())
        item = InventoryItem.objects.filter(id=item_id).first()
        if not item:
            return JsonResponse({"success": False, "message": "Item not found"}, status=404)
        batch_payload = payload.get("batch") or {}
        mv = record_receipt(
            item=item,
            qty=qty,
            location=loc,
            actor=actor if hasattr(actor, "id") else None,
            batch_payload=batch_payload or None,
            reference_type="goods_receipt",
            reference_id=str(payload.get("goodsReceiptId") or ""),
        )
        return JsonResponse({"success": True, "data": {"movementId": str(mv.id)}})
    except Exception as e:
        return JsonResponse({"success": False, "message": "Failed to record receipt"}, status=500)


@require_http_methods(["GET", "POST"])
@rate_limit(limit=60, window_seconds=60)
def inventory_reorder_settings(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "inventory.restock.manage"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import ReorderSetting, InventoryItem, Location

        if request.method == "GET":
            item_id = request.GET.get("itemId") or request.GET.get("item_id")
            location_id = request.GET.get("locationId") or request.GET.get("location_id")
            qs = ReorderSetting.objects.select_related("item", "location").all()
            if item_id:
                qs = qs.filter(item_id=item_id)
            if location_id:
                qs = qs.filter(location_id=location_id)
            rows = qs.order_by("item__name", "location__code")
            data = [_safe_reorder_setting(rs) for rs in rows]
            return JsonResponse({"success": True, "data": data})

        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}

        item_id = payload.get("itemId") or payload.get("item_id")
        if not item_id:
            return JsonResponse({"success": False, "message": "itemId is required"}, status=400)
        item = InventoryItem.objects.filter(id=item_id).first()
        if not item:
            return JsonResponse({"success": False, "message": "Item not found"}, status=404)

        location_id = payload.get("locationId") or payload.get("location_id")
        location_code = (payload.get("locationCode") or payload.get("location") or "").strip()
        loc = None
        if location_id:
            loc = Location.objects.filter(id=location_id).first()
        if not loc:
            code = (location_code or "MAIN").strip().upper() or "MAIN"
            loc = Location.objects.filter(code=code).first()
            if not loc:
                loc = Location.objects.create(code=code, name=code.title() or "Main")

        def _parse_decimal(value, field):
            if value is None:
                return Decimal("0")
            try:
                dec = Decimal(str(value))
            except (InvalidOperation, ValueError, TypeError):
                raise ValueError(f"{field} must be a number")
            if dec < 0:
                raise ValueError(f"{field} cannot be negative")
            return dec

        try:
            reorder_point = _parse_decimal(payload.get("reorderPoint") or payload.get("reorder_point"), "reorderPoint")
            reorder_qty = _parse_decimal(payload.get("reorderQty") or payload.get("reorder_qty"), "reorderQty")
            low_raw = payload.get("lowStockThreshold") or payload.get("low_stock_threshold")
            if low_raw is None:
                low_threshold = reorder_point
            else:
                low_threshold = _parse_decimal(low_raw, "lowStockThreshold")
        except ValueError as ve:
            return JsonResponse({"success": False, "message": str(ve)}, status=400)

        lead_raw = payload.get("leadTimeDays") or payload.get("lead_time_days")
        try:
            lead_time = int(lead_raw or 0)
        except Exception:
            return JsonResponse({"success": False, "message": "leadTimeDays must be an integer"}, status=400)
        if lead_time < 0:
            return JsonResponse({"success": False, "message": "leadTimeDays cannot be negative"}, status=400)

        rs, created = ReorderSetting.objects.update_or_create(
            item=item,
            location=loc,
            defaults={
                "reorder_point": reorder_point,
                "reorder_qty": reorder_qty,
                "lead_time_days": lead_time,
                "low_stock_threshold": low_threshold,
            },
        )
        trigger_low_stock_notifications([str(item.id)])
        return JsonResponse({"success": True, "data": _safe_reorder_setting(rs), "created": created})
    except ValueError as ve:
        return JsonResponse({"success": False, "message": str(ve)}, status=400)
    except Exception:
        return JsonResponse({"success": False, "message": "Unable to save restock setting"}, status=500)


@require_http_methods(["GET", "PUT", "DELETE"])
@rate_limit(limit=60, window_seconds=60)
def inventory_reorder_setting_detail(request, rid):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "inventory.restock.manage"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import ReorderSetting, InventoryItem, Location

        rs = ReorderSetting.objects.select_related("item", "location").filter(id=rid).first()
        if not rs:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)

        if request.method == "GET":
            return JsonResponse({"success": True, "data": _safe_reorder_setting(rs)})

        if request.method == "DELETE":
            rs.delete()
            return JsonResponse({"success": True, "message": "Deleted"})

        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}

        if "itemId" in payload or "item_id" in payload:
            new_item_id = payload.get("itemId") or payload.get("item_id")
            new_item = InventoryItem.objects.filter(id=new_item_id).first()
            if not new_item:
                return JsonResponse({"success": False, "message": "Item not found"}, status=404)
            rs.item = new_item

        if any(k in payload for k in ("locationId", "location_id", "locationCode", "location")):
            loc_id = payload.get("locationId") or payload.get("location_id")
            loc_code = (payload.get("locationCode") or payload.get("location") or "").strip()
            loc = None
            if loc_id:
                loc = Location.objects.filter(id=loc_id).first()
            if not loc:
                code = (loc_code or "MAIN").strip().upper() or "MAIN"
                loc = Location.objects.filter(code=code).first()
                if not loc:
                    loc = Location.objects.create(code=code, name=code.title() or "Main")
            rs.location = loc

        def _parse_decimal(value, field):
            if value is None:
                return None
            try:
                dec = Decimal(str(value))
            except (InvalidOperation, ValueError, TypeError):
                raise ValueError(f"{field} must be a number")
            if dec < 0:
                raise ValueError(f"{field} cannot be negative")
            return dec

        if "reorderPoint" in payload or "reorder_point" in payload:
            try:
                rp = _parse_decimal(payload.get("reorderPoint") or payload.get("reorder_point"), "reorderPoint")
                if rp is not None:
                    rs.reorder_point = rp
            except ValueError as ve:
                return JsonResponse({"success": False, "message": str(ve)}, status=400)

        if "reorderQty" in payload or "reorder_qty" in payload:
            try:
                rq = _parse_decimal(payload.get("reorderQty") or payload.get("reorder_qty"), "reorderQty")
                if rq is not None:
                    rs.reorder_qty = rq
            except ValueError as ve:
                return JsonResponse({"success": False, "message": str(ve)}, status=400)

        if "lowStockThreshold" in payload or "low_stock_threshold" in payload:
            try:
                lt = _parse_decimal(payload.get("lowStockThreshold") or payload.get("low_stock_threshold"), "lowStockThreshold")
                if lt is not None:
                    rs.low_stock_threshold = lt
            except ValueError as ve:
                return JsonResponse({"success": False, "message": str(ve)}, status=400)

        if "leadTimeDays" in payload or "lead_time_days" in payload:
            try:
                lead = int(payload.get("leadTimeDays") or payload.get("lead_time_days") or 0)
            except Exception:
                return JsonResponse({"success": False, "message": "leadTimeDays must be an integer"}, status=400)
            if lead < 0:
                return JsonResponse({"success": False, "message": "leadTimeDays cannot be negative"}, status=400)
            rs.lead_time_days = lead

        rs.save()
        rs = ReorderSetting.objects.select_related("item", "location").get(id=rs.id)
        trigger_low_stock_notifications([str(rs.item_id)])
        return JsonResponse({"success": True, "data": _safe_reorder_setting(rs)})
    except ValueError as ve:
        return JsonResponse({"success": False, "message": str(ve)}, status=400)
    except Exception:
        return JsonResponse({"success": False, "message": "Unable to update restock setting"}, status=500)


@require_http_methods(["POST"]) 
@rate_limit(limit=60, window_seconds=60)
def inventory_adjust(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not (_has_permission(actor, "inventory.update") or getattr(actor, "role", "").lower() in {"admin", "manager"}):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import InventoryItem, Location
        payload = json.loads(request.body.decode("utf-8") or "{}")
        item_id = payload.get("itemId") or payload.get("item_id")
        delta = float(payload.get("delta") or payload.get("quantity") or 0)
        reason = (payload.get("reason") or "Manual adjustment").strip()
        location_code = (payload.get("location") or payload.get("locationCode") or "MAIN").strip() or "MAIN"
        loc = Location.objects.filter(code=location_code).first() or Location.objects.create(code=location_code, name=location_code.title())
        item = InventoryItem.objects.filter(id=item_id).first()
        if not item:
            return JsonResponse({"success": False, "message": "Item not found"}, status=404)
        mv = adjust_stock(item=item, delta_qty=delta, location=loc, reason=reason, actor=actor if hasattr(actor, "id") else None)
        return JsonResponse({"success": True, "data": {"movementId": str(mv.id)}})
    except ValueError as ve:
        return JsonResponse({"success": False, "message": str(ve)}, status=400)
    except Exception:
        return JsonResponse({"success": False, "message": "Failed to adjust"}, status=500)


@require_http_methods(["GET"]) 
@rate_limit(limit=120, window_seconds=60)
def inventory_ledger(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .inventory_services import get_stock_ledger
        item_id = request.GET.get("item_id") or request.GET.get("itemId")
        if not item_id:
            return JsonResponse({"success": False, "message": "item_id required"}, status=400)
        date_from = request.GET.get("from") or None
        date_to = request.GET.get("to") or None
        location_id = request.GET.get("location_id") or None
        df = datetime.fromisoformat(date_from) if date_from else None
        dt = datetime.fromisoformat(date_to) if date_to else None
        moves = get_stock_ledger(item_id=item_id, date_from=df, date_to=dt, location_id=location_id)
        data = []
        for m in moves:
            data.append({
                "id": str(m.id),
                "itemId": str(m.item_id),
                "locationId": str(m.location_id),
                "batchId": str(m.batch_id) if m.batch_id else None,
                "type": m.movement_type,
                "qty": float(m.qty or 0),
                "effectiveAt": m.effective_at.isoformat() if m.effective_at else None,
                "recordedAt": m.recorded_at.isoformat() if m.recorded_at else None,
                "referenceType": m.reference_type,
                "referenceId": m.reference_id,
                "reason": m.reason,
            })
        return JsonResponse({"success": True, "data": data})
    except Exception:
        return JsonResponse({"success": True, "data": []})


@require_http_methods(["GET"]) 
@rate_limit(limit=120, window_seconds=60)
def inventory_recent_activity(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        # Validate UUID-like params defensively to avoid ValueError from ORM filters
        def _parse_uuid(val):
            try:
                if not val:
                    return None
                _ = UUID(str(val))
                return str(val)
            except Exception:
                return None

        item_id = _parse_uuid(request.GET.get("itemId") or request.GET.get("item_id"))
        location_id = _parse_uuid(request.GET.get("locationId") or request.GET.get("location_id"))
        types_param = request.GET.get("types") or ""
        types = [t for t in [x.strip() for x in types_param.split(",")] if t]
        since = request.GET.get("since") or None
        try:
            page = int(request.GET.get("page", 1) or 1)
        except Exception:
            page = 1
        try:
            limit = int(request.GET.get("limit", 50) or 50)
        except Exception:
            limit = 50
        limit = max(1, min(200, limit))
        since_dt = None
        if since:
            try:
                since_dt = datetime.fromisoformat(since)
            except Exception:
                since_dt = None
        rows = get_recent_activity(item_id=item_id, location_id=location_id, types=types or None, since=since_dt, page=page, limit=limit)
        data = []
        for m in rows:
            data.append({
                "id": str(m.id),
                "itemId": str(m.item_id),
                "itemName": getattr(m.item, "name", ""),
                "itemUnit": getattr(m.item, "unit", None),
                "locationId": str(m.location_id),
                "locationCode": getattr(m.location, "code", None),
                "batchId": str(m.batch_id) if m.batch_id else None,
                "batchLot": getattr(m.batch, "lot_code", None) if m.batch_id else None,
                "batchExpiry": m.batch.expiry_date.isoformat() if getattr(m, "batch", None) and m.batch.expiry_date else None,
                "type": m.movement_type,
                "qty": float(m.qty or 0),
                "effectiveAt": m.effective_at.isoformat() if m.effective_at else None,
                "recordedAt": m.recorded_at.isoformat() if m.recorded_at else None,
                "referenceType": m.reference_type,
                "referenceId": m.reference_id,
                "reason": m.reason,
                "actorId": str(m.actor_id) if m.actor_id else None,
                "actorName": (getattr(m.actor, "name", None) or getattr(m.actor, "email", None) or None),
            })
        # Include non-stock item updates from InventoryActivity
        try:
            from .models import InventoryActivity
            ia_qs = InventoryActivity.objects.select_related("item").filter(action="update")
            if item_id:
                ia_qs = ia_qs.filter(item_id=item_id)
            ia_qs = ia_qs.order_by("-created_at")[:limit]
            for a in ia_qs:
                data.append({
                    "id": str(a.id),
                    "itemId": str(a.item_id),
                    "itemName": getattr(a.item, "name", ""),
                    "type": "ITEM_UPDATE",
                    "qty": None,
                    "effectiveAt": None,
                    "recordedAt": a.created_at.isoformat() if a.created_at else None,
                    "referenceType": "",
                    "referenceId": "",
                    "reason": a.reason,
                    "actorId": str(a.actor_id) if a.actor_id else None,
                    "actorName": (getattr(a.actor, "name", None) or getattr(a, "performed_by", None) or None),
                    "meta": getattr(a, "meta", {}) or {},
                })
        except Exception:
            pass
        # Sort combined by recordedAt desc
        def _key(x):
            return x.get("recordedAt") or x.get("effectiveAt") or ""
        try:
            data.sort(key=_key, reverse=True)
        except Exception:
            pass
        return JsonResponse({"success": True, "data": data, "pagination": {"page": page, "limit": limit, "total": None}})
    except Exception:
        # Fallback: no activity yet
        return JsonResponse({"success": True, "data": [], "pagination": {"page": 1, "limit": 50, "total": None}})


@require_http_methods(["POST"]) 
@rate_limit(limit=60, window_seconds=60)
def inventory_consume(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    # Staff can consume for orders
    if not (getattr(actor, "role", "").lower() in {"admin", "manager", "staff"} or _has_permission(actor, "inventory.update")):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import InventoryItem, Location
        payload = json.loads(request.body.decode("utf-8") or "{}")
        order_id = str(payload.get("orderId") or payload.get("order_id") or "")
        comps = payload.get("components") or []
        location_code = (payload.get("location") or payload.get("locationCode") or "MAIN").strip() or "MAIN"
        loc = Location.objects.filter(code=location_code).first() or Location.objects.create(code=location_code, name=location_code.title())
        components = []
        for c in comps:
            iid = c.get("itemId") or c.get("ingredientId") or c.get("inventoryItemId")
            qty = float(c.get("qty") or c.get("quantity") or 0)
            if not iid or qty <= 0:
                continue
            it = InventoryItem.objects.filter(id=iid).first()
            if it:
                components.append((it, qty))
        mvs = consume_for_order(order_id=order_id, components=components, location=loc, actor=actor if hasattr(actor, "id") else None)
        return JsonResponse({"success": True, "data": {"count": len(mvs)}})
    except ValueError as ve:
        return JsonResponse({"success": False, "message": str(ve)}, status=400)
    except Exception:
        return JsonResponse({"success": False, "message": "Failed to consume"}, status=500)


@require_http_methods(["POST"]) 
@rate_limit(limit=60, window_seconds=60)
def inventory_transfer(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not (_has_permission(actor, "inventory.update") or getattr(actor, "role", "").lower() in {"admin", "manager"}):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import InventoryItem, Location
        payload = json.loads(request.body.decode("utf-8") or "{}")
        item_id = payload.get("itemId") or payload.get("item_id")
        qty = float(payload.get("qty") or payload.get("quantity") or 0)
        from_code = (payload.get("fromLocation") or payload.get("from") or "MAIN").strip() or "MAIN"
        to_code = (payload.get("toLocation") or payload.get("to") or "MAIN").strip() or "MAIN"
        from_loc = Location.objects.filter(code=from_code).first() or Location.objects.create(code=from_code, name=from_code.title())
        to_loc = Location.objects.filter(code=to_code).first() or Location.objects.create(code=to_code, name=to_code.title())
        item = InventoryItem.objects.filter(id=item_id).first()
        if not item:
            return JsonResponse({"success": False, "message": "Item not found"}, status=404)
        mvs = transfer_stock(item=item, qty=qty, from_location=from_loc, to_location=to_loc, actor=actor if hasattr(actor, "id") else None)
        return JsonResponse({"success": True, "data": {"count": len(mvs)}})
    except ValueError as ve:
        return JsonResponse({"success": False, "message": str(ve)}, status=400)
    except Exception:
        return JsonResponse({"success": False, "message": "Failed to transfer"}, status=500)


_all_ = [
    "inventory_items",
    "inventory_item_detail",
    "inventory_item_stock",
    "inventory_low_stock",
    "inventory_activities",
    "inventory_db_now",
    "inventory_stock",
    "inventory_expiring",
    "inventory_receipts",
    "inventory_adjust",
    "inventory_ledger",
    "inventory_consume",
    "inventory_transfer",
    "inventory_recent_activity",
]
