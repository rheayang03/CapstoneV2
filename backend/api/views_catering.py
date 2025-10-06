"""Catering event endpoints: CRUD, menu management, upcoming summaries."""

from __future__ import annotations

import json
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone as dj_timezone
from django.views.decorators.http import require_http_methods

from .models import CateringEvent, MenuItem
from .views_common import _actor_from_request, _has_permission, rate_limit

DECIMAL_ZERO = Decimal("0")
TWO_PLACES = Decimal("0.01")


# --------------------- Helper Functions ---------------------

def _parse_date(value) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(text, fmt).date()
        except (ValueError, TypeError):
            continue
    try:
        return datetime.fromisoformat(text).date()
    except Exception:
        return None


def _parse_time(value) -> time | None:
    if value is None or value == "":
        return None
    if isinstance(value, time):
        return value
    if isinstance(value, datetime):
        return value.timetz()
    text = str(value).strip()
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(text, fmt).time()
        except (ValueError, TypeError):
            continue
    return None


def _as_decimal(value) -> Decimal | None:
    if value is None or value == "":
        return None
    if isinstance(value, Decimal):
        try:
            return value.quantize(TWO_PLACES)
        except InvalidOperation:
            return None
    try:
        return Decimal(str(value)).quantize(TWO_PLACES)
    except (InvalidOperation, TypeError, ValueError):
        return None


def _format_time(value: time | None) -> str | None:
    if not value:
        return None
    try:
        return value.strftime("%H:%M")
    except Exception:
        return None


def _sanitize_menu_items(items) -> tuple[list[dict], Decimal]:
    sanitized: list[dict] = []
    total = DECIMAL_ZERO
    if not isinstance(items, list):
        return sanitized, total

    menu_ids = {
        str(item.get("menuItemId") or item.get("menu_item_id") or item.get("id") or "").strip()
        for item in items
        if item.get("menuItemId") or item.get("menu_item_id") or item.get("id")
    }
    menu_lookup = {}
    if menu_ids:
        try:
            menu_lookup = {
                str(m.id): m
                for m in MenuItem.objects.filter(id__in=[mid for mid in menu_ids if mid])
            }
        except Exception:
            menu_lookup = {}

    for raw in items:
        mid = str(raw.get("menuItemId") or raw.get("menu_item_id") or raw.get("id") or "").strip()
        try:
            quantity = int(raw.get("quantity") or 0)
        except (ValueError, TypeError):
            quantity = 0
        if quantity <= 0:
            continue

        unit_price_dec = _as_decimal(raw.get("unitPrice") or raw.get("unit_price"))
        line_total_dec = _as_decimal(raw.get("price") or raw.get("lineTotal") or raw.get("total"))

        if line_total_dec is None and unit_price_dec is not None:
            line_total_dec = (unit_price_dec * Decimal(quantity)).quantize(TWO_PLACES)
        if unit_price_dec is None and line_total_dec is not None and quantity:
            try:
                unit_price_dec = (line_total_dec / Decimal(quantity)).quantize(TWO_PLACES)
            except (InvalidOperation, ZeroDivisionError):
                unit_price_dec = DECIMAL_ZERO

        if unit_price_dec is None:
            unit_price_dec = DECIMAL_ZERO
        if line_total_dec is None:
            line_total_dec = DECIMAL_ZERO

        name = raw.get("name") or ""
        if not name and mid and mid in menu_lookup:
            try:
                name = menu_lookup[mid].name
            except Exception:
                name = ""

        sanitized.append(
            {
                "menuItemId": mid,
                "name": name,
                "quantity": quantity,
                "unitPrice": float(unit_price_dec),
                "price": float(line_total_dec),
            }
        )
        total += line_total_dec

    return sanitized, total.quantize(TWO_PLACES)


def _safe_event(event: CateringEvent) -> dict:
    start = _format_time(event.start_time)
    end = _format_time(event.end_time)
    if start and end:
        time_range = f"{start} - {end}"
    elif start:
        time_range = start
    elif end:
        time_range = end
    else:
        time_range = ""

    menu_items = []
    try:
        raw_items = event.menu_items.all() if hasattr(event, "menu_items") else []
    except Exception:
        raw_items = []

    for item in raw_items:
        menu_items.append(
            {
                "menuItemId": str(item.id),
                "name": item.name,
                "quantity": int(getattr(item, "quantity", 1)),
                "price": float(getattr(item, "price", 0)),
                "unitPrice": float(getattr(item, "unit_price", 0)),
            }
        )

    return {
        "id": str(event.id),
        "name": event.name,
        "client": event.client,
        "date": event.date.isoformat() if event.date else None,
        "startTime": start,
        "endTime": end,
        "time": time_range,
        "location": event.location or "",
        "attendees": int(event.attendees or 0),
        "status": event.status,
        "total": float(event.total or 0),
        "contactPerson": {
            "name": event.contact_name or "",
            "phone": event.contact_phone or "",
        },
        "notes": event.notes or "",
        "menuItems": menu_items,
        "createdAt": event.created_at.isoformat() if event.created_at else None,
        "updatedAt": event.updated_at.isoformat() if event.updated_at else None,
    }


def _with_pagination(queryset, page: int, limit: int):
    total = queryset.count()
    start = (page - 1) * limit
    end = start + limit
    rows = list(queryset[start:end])
    pagination = {
        "page": page,
        "limit": limit,
        "total": total,
        "totalPages": max(1, (total + limit - 1) // limit),
    }
    return rows, pagination


# --------------------- API ENDPOINTS ---------------------

@require_http_methods(["GET", "POST"])
@rate_limit(limit=60, window_seconds=60)
def catering_events(request):
    """List all events or create a new one."""
    actor, err = _actor_from_request(request)
    if not actor:
        return err

    if request.method == "GET":
        if not _has_permission(actor, "catering.events.view"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        qs = CateringEvent.objects.all().order_by("-date")
        page = int(request.GET.get("page", 1))
        limit = int(request.GET.get("limit", 25))
        rows, pagination = _with_pagination(qs, page, limit)
        data = [_safe_event(e) for e in rows]
        return JsonResponse({"success": True, "data": data, "pagination": pagination})

    elif request.method == "POST":
        if not _has_permission(actor, "catering.events.create"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        try:
            data = json.loads(request.body.decode("utf-8"))
        except Exception:
            data = {}

        try:
            event = CateringEvent(
                name=data.get("name"),
                client=data.get("client"),
                location=data.get("location"),
                attendees=int(data.get("attendees") or 0),
                contact_name=data.get("contactPerson", {}).get("name"),
                contact_phone=data.get("contactPerson", {}).get("phone"),
                notes=data.get("notes"),
                date=_parse_date(data.get("date")),
                start_time=_parse_time(data.get("startTime")),
                end_time=_parse_time(data.get("endTime")),
                status=data.get("status", "scheduled"),
            )

            with transaction.atomic():
                event.save()  # Save first to assign ID

                items = data.get("menuItems", [])
                sanitized_items, total = _sanitize_menu_items(items)
                menu_ids = [MenuItem.objects.get(id=item["menuItemId"]) for item in sanitized_items if item.get("menuItemId")]
                event.menu_items.set(menu_ids)  # Use .set() for ManyToMany
                event.total = float(total)
                event.save()

            return JsonResponse({"success": True, "data": _safe_event(event)}, status=201)
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)


@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
@rate_limit(limit=60, window_seconds=60)
def catering_event_detail(request, event_id):
    """Retrieve, update, or delete a single event by ID."""
    actor, err = _actor_from_request(request)
    if not actor:
        return err

    try:
        event = CateringEvent.objects.get(id=event_id)
    except CateringEvent.DoesNotExist:
        return JsonResponse({"success": False, "message": "Event not found"}, status=404)

    if request.method == "GET":
        if not _has_permission(actor, "catering.events.view"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        return JsonResponse({"success": True, "data": _safe_event(event)})

    elif request.method in ("PUT", "PATCH"):
        if not _has_permission(actor, "catering.events.edit"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        try:
            data = json.loads(request.body.decode("utf-8"))
        except Exception:
            data = {}

        # Update fields
        event.name = data.get("name", event.name)
        event.client = data.get("client", event.client)
        event.location = data.get("location", event.location)
        event.attendees = data.get("attendees", event.attendees)
        event.contact_name = data.get("contactPerson", {}).get("name", event.contact_name)
        event.contact_phone = data.get("contactPerson", {}).get("phone", event.contact_phone)
        event.notes = data.get("notes", event.notes)
        event.date = _parse_date(data.get("date")) or event.date
        event.start_time = _parse_time(data.get("startTime")) or event.start_time
        event.end_time = _parse_time(data.get("endTime")) or event.end_time
        event.status = data.get("status", event.status)

        try:
            with transaction.atomic():
                event.save()
            return JsonResponse({"success": True, "data": _safe_event(event)})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)

    elif request.method == "DELETE":
        if not _has_permission(actor, "catering.events.delete"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        try:
            event.delete()
            return JsonResponse({"success": True, "message": "Event deleted"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)


@require_http_methods(["PUT", "PATCH"])
@rate_limit(limit=60, window_seconds=60)
def catering_event_menu(request, event_id):
    """Update the menu items for a specific event."""
    actor, err = _actor_from_request(request)
    if not actor:
        return err

    try:
        event = CateringEvent.objects.get(id=event_id)
    except CateringEvent.DoesNotExist:
        return JsonResponse({"success": False, "message": "Event not found"}, status=404)

    if not _has_permission(actor, "catering.events.edit"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    try:
        data = json.loads(request.body.decode("utf-8"))
        items = data.get("menuItems", [])
        sanitized_items, total = _sanitize_menu_items(items)
        menu_ids = [MenuItem.objects.get(id=item["menuItemId"]) for item in sanitized_items if item.get("menuItemId")]

        with transaction.atomic():
            event.menu_items.set(menu_ids)
            event.total = float(total)
            event.save()

        return JsonResponse({"success": True, "data": _safe_event(event)})
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@require_http_methods(["GET"])
@rate_limit(limit=60, window_seconds=60)
def catering_events_upcoming(request):
    """List upcoming events, ordered by date."""
    actor, err = _actor_from_request(request)
    if not actor:
        return err

    if not _has_permission(actor, "catering.events.view"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    today = dj_timezone.localdate()
    qs = CateringEvent.objects.filter(date__gte=today).order_by("date")
    page = int(request.GET.get("page", 1))
    limit = int(request.GET.get("limit", 25))
    rows, pagination = _with_pagination(qs, page, limit)
    data = [_safe_event(e) for e in rows]
    return JsonResponse({"success": True, "data": data, "pagination": pagination})


__all__ = [
    "catering_events",
    "catering_event_detail",
    "catering_event_menu",
    "catering_events_upcoming"
]
