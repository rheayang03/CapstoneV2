"""Cash handling endpoints: open/close session, cash in/out, session summary.

Permissions:
- Open/close and cash movements require 'payment.process' or manager/admin.
"""

from __future__ import annotations

import json
from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone as dj_tz

from .views_common import _actor_from_request, _has_permission, rate_limit


def _safe_session(s, total_cash=None):
    return {
        "id": str(s.id),
        "status": s.status,
        "openingFloat": float(s.opening_float or 0),
        "closingTotal": float(s.closing_total or 0),
        "openedAt": s.opened_at.isoformat() if s.opened_at else None,
        "closedAt": s.closed_at.isoformat() if s.closed_at else None,
        "openedBy": getattr(s.opened_by, "email", "") or "",
        "closedBy": getattr(s.closed_by, "email", "") or "",
        "totalCash": float(total_cash) if total_cash is not None else None,
    }


@require_http_methods(["POST"])  # /cash/open
@rate_limit(limit=10, window_seconds=60)
def cash_open(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "payment.process"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import CashSession
        # Ensure no open session exists
        open_sess = CashSession.objects.filter(status=CashSession.STATUS_OPEN).first()
        if open_sess:
            return JsonResponse({"success": True, "data": _safe_session(open_sess)})
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            data = {}
        opening = Decimal(str(data.get("openingFloat") or 0))
        s = CashSession.objects.create(opened_by=actor if hasattr(actor, "id") else None, opening_float=opening)
        return JsonResponse({"success": True, "data": _safe_session(s)})
    except Exception:
        return JsonResponse({"success": False, "message": "Failed"}, status=500)


@require_http_methods(["POST"])  # /cash/close
@rate_limit(limit=10, window_seconds=60)
def cash_close(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "payment.process"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from django.db.models import Sum
        from .models import CashSession, CashEntry
        s = CashSession.objects.filter(status=CashSession.STATUS_OPEN).first()
        if not s:
            return JsonResponse({"success": False, "message": "No open session"}, status=400)
        total = CashEntry.objects.filter(session=s).aggregate(total=Sum("amount")).get("total") or 0
        s.status = CashSession.STATUS_CLOSED
        s.closed_by = actor if hasattr(actor, "id") else None
        s.closed_at = dj_tz.now()
        s.closing_total = total
        s.save(update_fields=["status", "closed_by", "closed_at", "closing_total", "notes"])
        return JsonResponse({"success": True, "data": _safe_session(s, total_cash=total)})
    except Exception:
        return JsonResponse({"success": False, "message": "Failed"}, status=500)


@require_http_methods(["POST"])  # /cash/move (cash in/out)
@rate_limit(limit=30, window_seconds=60)
def cash_move(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "payment.process"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import CashSession, CashEntry
        s = CashSession.objects.filter(status=CashSession.STATUS_OPEN).first()
        if not s:
            return JsonResponse({"success": False, "message": "No open session"}, status=400)
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            data = {}
        type_v = (data.get("type") or "").lower()  # cash_in | cash_out
        if type_v not in {CashEntry.TYPE_IN, CashEntry.TYPE_OUT}:
            return JsonResponse({"success": False, "message": "Invalid type"}, status=400)
        amount = Decimal(str(data.get("amount") or 0))
        if amount <= 0:
            return JsonResponse({"success": False, "message": "Amount must be positive"}, status=400)
        ref = (data.get("reference") or "").strip()
        notes = (data.get("notes") or "").strip()
        if type_v == CashEntry.TYPE_OUT:
            amount = -amount
        e = CashEntry.objects.create(session=s, type=type_v, amount=amount, reference=ref, notes=notes, actor=actor if hasattr(actor, "id") else None)
        return JsonResponse({"success": True, "data": {"id": str(e.id)} })
    except Exception:
        return JsonResponse({"success": False, "message": "Failed"}, status=500)


@require_http_methods(["GET"])  # /cash/session
@rate_limit(limit=60, window_seconds=60)
def cash_session(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from django.db.models import Sum
        from .models import CashSession, CashEntry
        s = CashSession.objects.filter(status=CashSession.STATUS_OPEN).first()
        if not s:
            return JsonResponse({"success": True, "data": None})
        total = CashEntry.objects.filter(session=s).aggregate(total=Sum("amount")).get("total") or 0
        return JsonResponse({"success": True, "data": _safe_session(s, total_cash=total)})
    except Exception:
        return JsonResponse({"success": True, "data": None})


__all__ = ["cash_open", "cash_close", "cash_move", "cash_session"]

