"""Customer feedback endpoints: list, create, update, resolve, summary."""

import json
from typing import Any, Dict, List
from uuid import uuid4

from django.db.models import Avg
from django.db.utils import OperationalError, ProgrammingError
from django.http import JsonResponse
from django.utils import timezone as dj_timezone
from django.views.decorators.http import require_http_methods

from .views_common import _actor_from_request, _has_permission, rate_limit


FEEDBACK_MEM: List[Dict[str, Any]] = []


def _serialize_db(obj):
    return {
        "id": str(obj.id),
        "customerName": obj.customer_name or "Anonymous",
        "email": obj.email or "",
        "rating": int(obj.rating or 0),
        "comment": obj.comment or "",
        "category": obj.category or "",
        "orderNumber": obj.order_number or "",
        "metadata": obj.metadata if isinstance(obj.metadata, dict) else {},
        "resolved": bool(obj.resolved),
        "resolvedAt": obj.resolved_at.isoformat() if obj.resolved_at else None,
        "date": (obj.created_at or dj_timezone.now()).isoformat(),
        "createdAt": (obj.created_at or dj_timezone.now()).isoformat(),
        "updatedAt": (obj.updated_at or dj_timezone.now()).isoformat(),
        "submittedBy": str(getattr(obj.submitted_by, "id", "") or ""),
        "resolvedBy": str(getattr(obj.resolved_by, "id", "") or ""),
        "resolvedByName": getattr(obj.resolved_by, "name", "") or "",
    }


def _serialize_mem(entry):
    return {
        "id": str(entry.get("id")),
        "customerName": entry.get("customerName") or "Anonymous",
        "email": entry.get("email") or "",
        "rating": int(entry.get("rating") or 0),
        "comment": entry.get("comment") or "",
        "category": entry.get("category") or "",
        "orderNumber": entry.get("orderNumber") or "",
        "metadata": entry.get("metadata") or {},
        "resolved": bool(entry.get("resolved")),
        "resolvedAt": entry.get("resolvedAt"),
        "date": entry.get("date") or dj_timezone.now().isoformat(),
        "createdAt": entry.get("createdAt") or dj_timezone.now().isoformat(),
        "updatedAt": entry.get("updatedAt") or dj_timezone.now().isoformat(),
        "submittedBy": entry.get("submittedBy") or "",
        "resolvedBy": entry.get("resolvedBy") or "",
        "resolvedByName": entry.get("resolvedByName") or "",
    }


def _permission_guard(actor, perm: str):
    try:
        return _has_permission(actor, perm)
    except Exception:
        return False


def _parse_body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return {}


def _rating_from_data(data: Dict[str, Any]):
    rating = data.get("rating")
    try:
        rating = int(rating)
    except Exception:
        rating = None
    if rating is None or rating < 1 or rating > 5:
        return None
    return rating


@require_http_methods(["GET", "POST"])
@rate_limit(limit=120, window_seconds=60)
def feedback(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err

    if request.method == "GET":
        if not (_permission_guard(actor, "feedback.view") or _permission_guard(actor, "feedback.manage")):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

        status_filter = (request.GET.get("status") or "").lower()
        search = (request.GET.get("search") or "").strip()
        category = (request.GET.get("category") or "").strip().lower()
        limit = max(1, min(200, int(request.GET.get("limit") or 50)))
        page = max(1, int(request.GET.get("page") or 1))
        start = (page - 1) * limit
        end = start + limit

        try:
            from .models import CustomerFeedback

            qs = CustomerFeedback.objects.all().order_by("-created_at")
            if not _permission_guard(actor, "feedback.manage"):
                qs = qs.filter(submitted_by=actor)
            if status_filter == "resolved":
                qs = qs.filter(resolved=True)
            elif status_filter == "pending":
                qs = qs.filter(resolved=False)
            if category:
                qs = qs.filter(category__iexact=category)
            if search:
                qs = qs.filter(comment__icontains=search)
            total = qs.count()
            items = [_serialize_db(obj) for obj in qs[start:end]]
            return JsonResponse(
                {
                    "success": True,
                    "data": items,
                    "pagination": {
                        "page": page,
                        "limit": limit,
                        "total": total,
                        "totalPages": max(1, (total + limit - 1) // limit),
                    },
                }
            )
        except (OperationalError, ProgrammingError):
            pass

        # In-memory fallback
        items = []
        for entry in FEEDBACK_MEM:
            if not _permission_guard(actor, "feedback.manage") and entry.get("submittedBy") != str(getattr(actor, "id", "")):
                continue
            if status_filter == "resolved" and not entry.get("resolved"):
                continue
            if status_filter == "pending" and entry.get("resolved"):
                continue
            if category and (entry.get("category") or "").lower() != category:
                continue
            if search and search.lower() not in (entry.get("comment") or "").lower():
                continue
            items.append(_serialize_mem(entry))
        total = len(items)
        return JsonResponse(
            {
                "success": True,
                "data": items[start:end],
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "totalPages": max(1, (total + limit - 1) // limit),
                },
            }
        )

    # POST create feedback
    if not _permission_guard(actor, "feedback.submit"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    data = _parse_body(request)
    rating = _rating_from_data(data)
    if rating is None:
        return JsonResponse({"success": False, "message": "Rating must be between 1 and 5"}, status=400)

    payload = {
        "customer_name": (data.get("customerName") or data.get("name") or "").strip(),
        "email": (data.get("email") or "").strip(),
        "rating": rating,
        "comment": (data.get("comment") or "").strip(),
        "category": (data.get("category") or "").strip().lower() or "",
        "order_number": (data.get("orderNumber") or "").strip(),
        "metadata": data.get("metadata") if isinstance(data.get("metadata"), dict) else {},
    }

    try:
        from .models import CustomerFeedback

        fb = CustomerFeedback.objects.create(submitted_by=actor, **payload)
        return JsonResponse({"success": True, "data": _serialize_db(fb)})
    except (OperationalError, ProgrammingError):
        pass

    entry = {
        "id": uuid4().hex,
        "submittedBy": str(getattr(actor, "id", "")),
        "resolved": False,
        "resolvedAt": None,
        "resolvedBy": "",
        "resolvedByName": "",
        "createdAt": dj_timezone.now().isoformat(),
        "updatedAt": dj_timezone.now().isoformat(),
    }
    entry.update(
        {
            "customerName": payload["customer_name"] or "Anonymous",
            "email": payload["email"],
            "rating": payload["rating"],
            "comment": payload["comment"],
            "category": payload["category"],
            "orderNumber": payload["order_number"],
            "metadata": payload["metadata"],
            "date": dj_timezone.now().isoformat(),
        }
    )
    FEEDBACK_MEM.append(entry)
    return JsonResponse({"success": True, "data": _serialize_mem(entry)})


@require_http_methods(["GET", "PATCH", "DELETE"])
def feedback_detail(request, feedback_id: str):
    actor, err = _actor_from_request(request)
    if not actor:
        return err

    data = _parse_body(request) if request.method == "PATCH" else {}

    try:
        from .models import CustomerFeedback

        fb = CustomerFeedback.objects.filter(id=feedback_id).first()
        if not fb:
            raise CustomerFeedback.DoesNotExist  # type: ignore
        can_manage = _permission_guard(actor, "feedback.manage")
        is_author = getattr(fb.submitted_by, "id", None) == getattr(actor, "id", None)
        if request.method == "GET":
            if not (can_manage or (_permission_guard(actor, "feedback.view") and is_author)):
                return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
            return JsonResponse({"success": True, "data": _serialize_db(fb)})
        if request.method == "PATCH":
            if not (can_manage or (is_author and _permission_guard(actor, "feedback.submit"))):
                return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
            update_fields = []
            if "customerName" in data:
                fb.customer_name = (data.get("customerName") or "").strip()
                update_fields.append("customer_name")
            if "email" in data:
                fb.email = (data.get("email") or "").strip()
                update_fields.append("email")
            if "comment" in data:
                fb.comment = (data.get("comment") or "").strip()
                update_fields.append("comment")
            if "category" in data:
                fb.category = (data.get("category") or "").strip().lower()
                update_fields.append("category")
            if "orderNumber" in data:
                fb.order_number = (data.get("orderNumber") or "").strip()
                update_fields.append("order_number")
            if "metadata" in data and isinstance(data.get("metadata"), dict):
                fb.metadata = data["metadata"]
                update_fields.append("metadata")
            if "rating" in data:
                rating = _rating_from_data(data)
                if rating is None:
                    return JsonResponse({"success": False, "message": "Rating must be between 1 and 5"}, status=400)
                fb.rating = rating
                update_fields.append("rating")
            if "resolved" in data and can_manage:
                fb.resolved = bool(data.get("resolved"))
                fb.resolved_at = dj_timezone.now() if fb.resolved else None
                fb.resolved_by = actor if fb.resolved else None
                update_fields.extend(["resolved", "resolved_at", "resolved_by"])
            if update_fields:
                fb.save(update_fields=list(set(update_fields + ["updated_at"])))
            return JsonResponse({"success": True, "data": _serialize_db(fb)})
        # DELETE
        if not can_manage:
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        fb.delete()
        return JsonResponse({"success": True})
    except (OperationalError, ProgrammingError, Exception):
        pass

    # Memory fallback
    idx = next((i for i, item in enumerate(FEEDBACK_MEM) if str(item.get("id")) == str(feedback_id)), None)
    if idx is None:
        return JsonResponse({"success": False, "message": "Not found"}, status=404)
    entry = FEEDBACK_MEM[idx]
    can_manage = _permission_guard(actor, "feedback.manage")
    is_author = entry.get("submittedBy") == str(getattr(actor, "id", ""))
    if request.method == "GET":
        if not (can_manage or (_permission_guard(actor, "feedback.view") and is_author)):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        return JsonResponse({"success": True, "data": _serialize_mem(entry)})
    if request.method == "PATCH":
        if not (can_manage or is_author):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        entry.update({k: v for k, v in data.items() if k in {"customerName", "email", "comment", "category", "orderNumber", "metadata"}})
        if "rating" in data:
            rating = _rating_from_data(data)
            if rating is None:
                return JsonResponse({"success": False, "message": "Rating must be between 1 and 5"}, status=400)
            entry["rating"] = rating
        if "resolved" in data and can_manage:
            entry["resolved"] = bool(data.get("resolved"))
            entry["resolvedAt"] = dj_timezone.now().isoformat() if entry["resolved"] else None
            entry["resolvedBy"] = str(getattr(actor, "id", ""))
            entry["resolvedByName"] = getattr(actor, "name", "") or ""
        entry["updatedAt"] = dj_timezone.now().isoformat()
        FEEDBACK_MEM[idx] = entry
        return JsonResponse({"success": True, "data": _serialize_mem(entry)})
    # DELETE
    if not can_manage:
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    FEEDBACK_MEM.pop(idx)
    return JsonResponse({"success": True})


@require_http_methods(["POST"])
def feedback_resolve(request, feedback_id: str):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _permission_guard(actor, "feedback.manage"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    data = _parse_body(request)
    explicit = data.get("resolved")
    explicit_bool = None
    if isinstance(explicit, bool):
        explicit_bool = explicit
    elif isinstance(explicit, (int, str)):
        s = str(explicit).strip().lower()
        if s in {"1", "true", "yes", "on"}:
            explicit_bool = True
        elif s in {"0", "false", "no", "off"}:
            explicit_bool = False

    try:
        from .models import CustomerFeedback

        fb = CustomerFeedback.objects.filter(id=feedback_id).first()
        if not fb:
            raise CustomerFeedback.DoesNotExist  # type: ignore
        target_state = not fb.resolved if explicit_bool is None else explicit_bool
        fb.resolved = target_state
        fb.resolved_at = dj_timezone.now() if target_state else None
        fb.resolved_by = actor if target_state else None
        fb.save(update_fields=["resolved", "resolved_at", "resolved_by", "updated_at"])
        return JsonResponse({"success": True, "data": _serialize_db(fb)})
    except (OperationalError, ProgrammingError, Exception):
        pass

    idx = next((i for i, item in enumerate(FEEDBACK_MEM) if str(item.get("id")) == str(feedback_id)), None)
    if idx is None:
        return JsonResponse({"success": False, "message": "Not found"}, status=404)
    entry = FEEDBACK_MEM[idx]
    target_state = (not bool(entry.get("resolved"))) if explicit_bool is None else explicit_bool
    entry["resolved"] = target_state
    entry["resolvedAt"] = dj_timezone.now().isoformat() if target_state else None
    entry["resolvedBy"] = str(getattr(actor, "id", ""))
    entry["resolvedByName"] = getattr(actor, "name", "") or ""
    entry["updatedAt"] = dj_timezone.now().isoformat()
    FEEDBACK_MEM[idx] = entry
    return JsonResponse({"success": True, "data": _serialize_mem(entry)})


@require_http_methods(["GET"])
def feedback_summary(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not (_permission_guard(actor, "feedback.view") or _permission_guard(actor, "feedback.manage")):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    try:
        from .models import CustomerFeedback

        qs = CustomerFeedback.objects.all()
        if not _permission_guard(actor, "feedback.manage"):
            qs = qs.filter(submitted_by=actor)
        aggregate = qs.aggregate(average=Avg("rating"))
        avg = float(aggregate.get("average") or 0.0)
        total = qs.count()
        resolved = qs.filter(resolved=True).count()
        pending = total - resolved
        return JsonResponse(
            {
                "success": True,
                "data": {
                    "average": round(avg, 2),
                    "total": total,
                    "resolved": resolved,
                    "pending": pending,
                },
            }
        )
    except (OperationalError, ProgrammingError):
        pass

    # Fallback
    relevant = []
    for entry in FEEDBACK_MEM:
        if not _permission_guard(actor, "feedback.manage") and entry.get("submittedBy") != str(getattr(actor, "id", "")):
            continue
        relevant.append(_serialize_mem(entry))
    total = len(relevant)
    resolved = len([x for x in relevant if x.get("resolved")])
    pending = total - resolved
    average = round(sum(x.get("rating", 0) for x in relevant) / total, 2) if total else 0.0
    return JsonResponse(
        {
            "success": True,
            "data": {"average": average, "total": total, "resolved": resolved, "pending": pending},
        }
    )


__all__ = [
    "feedback",
    "feedback_detail",
    "feedback_resolve",
    "feedback_summary",
]
