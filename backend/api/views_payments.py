"""Payment endpoints: process payment for order, list, refund.

Permissions:
- payment.process to process payments
- payment.records.view to list transactions
- payment.refund to refund
"""

from __future__ import annotations

import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone as dj_timezone
from django.db.utils import OperationalError, ProgrammingError

from .views_common import _actor_from_request, _has_permission, _client_meta, _require_admin_or_manager, rate_limit


def _serialize_db(p):
    return {
        "id": str(p.id),
        "orderId": p.order_id,
        "amount": float(p.amount),
        "method": p.method,
        "status": p.status,
        "reference": p.reference or "",
        "customer": p.customer or "",
        "processedBy": (p.processed_by.email if getattr(p, "processed_by", None) else ""),
        "date": (p.created_at or dj_timezone.now()).isoformat(),
    }


@require_http_methods(["POST"])  # /orders/<order_id>/payment
@rate_limit(limit=20, window_seconds=60)
def order_payment(request, order_id: str):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        if not _has_permission(actor, "payment.process"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    except Exception:
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        data = {}
    amount = data.get("amount")
    method = (data.get("method") or "").lower()
    customer = (data.get("customer") or "").strip()
    reference = (data.get("reference") or "").strip()
    idempo = (request.META.get("HTTP_IDEMPOTENCY_KEY") or "").strip()
    if not amount or not method:
        return JsonResponse({"success": False, "message": "Missing amount or method"}, status=400)
    try:
        from decimal import Decimal
        amt = Decimal(str(amount))
    except Exception:
        return JsonResponse({"success": False, "message": "Invalid amount"}, status=400)

    try:
        from .models import PaymentTransaction, PaymentMethodConfig
        # Enforce allowed payment methods
        cfg = None
        try:
            cfg = PaymentMethodConfig.objects.first()
        except Exception:
            cfg = None
        if cfg:
            allowed = {
                "cash": bool(getattr(cfg, "cash_enabled", True)),
                "card": bool(getattr(cfg, "card_enabled", True)),
                "mobile": bool(getattr(cfg, "mobile_enabled", True)),
            }
            if not allowed.get(method, True):
                return JsonResponse({"success": False, "message": f"Payment method '{method}' is disabled"}, status=400)

        # Idempotency: if an Idempotency-Key header is provided and matches an existing txn for this order, return it
        if idempo:
            existing = PaymentTransaction.objects.filter(order_id=str(order_id), meta__idempotencyKey=idempo).first()
            if existing:
                return JsonResponse({"success": True, "data": _serialize_db(existing)})

        # External provider for card/mobile payments (expects tokenized input)
        if method in {PaymentTransaction.METHOD_CARD, PaymentTransaction.METHOD_MOBILE}:
            token = (data.get("token") or data.get("paymentToken") or "").strip()
            if not token:
                return JsonResponse({"success": False, "message": "Missing payment token"}, status=400)
            try:
                from .payment_providers import get_gateway
                gw = get_gateway()
                res = gw.charge(order_id=str(order_id), amount=float(amt), token=token, method=method)
                if not res.ok:
                    return JsonResponse({"success": False, "message": res.error or "Gateway error"}, status=400)
                reference = reference or res.reference
            except Exception:
                return JsonResponse({"success": False, "message": "Payment provider unavailable"}, status=502)

        p = PaymentTransaction.objects.create(
            order_id=str(order_id),
            amount=amt,
            method=method,
            status=PaymentTransaction.STATUS_COMPLETED,
            reference=reference,
            customer=customer,
            processed_by=actor if hasattr(actor, "id") else None,
            meta=({"idempotencyKey": idempo} if idempo else {}),
        )
        # Update the order's payment method for consistency
        try:
            from .models import Order
            o = Order.objects.filter(id=order_id).first()
            if o and getattr(o, "payment_method", None) != method:
                o.payment_method = method
                try:
                    o.save(update_fields=["payment_method", "updated_at"])
                except Exception:
                    o.save(update_fields=["payment_method"])  # fallback if updated_at missing
        except Exception:
            pass
        # Audit log
        try:
            from .utils_audit import record_audit
            ua, ip = _client_meta(request)
            record_audit(
                request,
                user=actor if hasattr(actor, "id") else None,
                type="action",
                action="Payment processed",
                details=f"order={order_id} amount={amt} method={method}",
                severity="info",
                meta={"orderId": str(order_id), "amount": float(amt), "method": method, "paymentId": str(p.id)},
            )
        except Exception:
            pass
        return JsonResponse({"success": True, "data": _serialize_db(p)})
    except Exception:
        return JsonResponse({"success": False, "message": "Processing failed"}, status=500)


@require_http_methods(["GET"])  # /payments
def payments_list(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        if not _has_permission(actor, "payment.records.view"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    except Exception:
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    search = (request.GET.get("search") or "").strip().lower()
    status = (request.GET.get("status") or "").strip().lower()
    method = (request.GET.get("method") or "").strip().lower()
    date_range = (request.GET.get("timeRange") or request.GET.get("dateRange") or "").strip().lower()
    page = int(request.GET.get("page") or 1)
    limit = int(request.GET.get("limit") or 50)
    try:
        from .models import PaymentTransaction
        qs = PaymentTransaction.objects.all()
        if status:
            qs = qs.filter(status=status)
        if method:
            qs = qs.filter(method=method)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(order_id__icontains=search)
                | Q(customer__icontains=search)
                | Q(reference__icontains=search)
            )
        if date_range in {"24h", "7d", "30d"}:
            from datetime import timedelta
            start = dj_timezone.now() - (
                timedelta(hours=24)
                if date_range == "24h"
                else timedelta(days=7)
                if date_range == "7d"
                else timedelta(days=30)
            )
            qs = qs.filter(created_at__gte=start)
        qs = qs.order_by("-created_at")
        total = qs.count()
        start_i = max(0, (page - 1) * max(1, limit))
        end_i = start_i + max(1, limit)
        items = [_serialize_db(x) for x in qs[start_i:end_i]]
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
        return JsonResponse(
            {
                "success": True,
                "data": [],
                "pagination": {"page": 1, "limit": 0, "total": 0, "totalPages": 1},
            }
        )


@require_http_methods(["POST"])  # /payments/<uuid:pid>/refund
def payment_refund(request, pid: str):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        if not _has_permission(actor, "payment.refund"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    except Exception:
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import PaymentTransaction
        p = PaymentTransaction.objects.filter(id=pid).first()
        if not p:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        if p.status == PaymentTransaction.STATUS_REFUNDED:
            return JsonResponse({"success": True, "data": _serialize_db(p)})
        p.status = PaymentTransaction.STATUS_REFUNDED
        p.refunded_at = dj_timezone.now()
        p.refunded_by = getattr(actor, "email", "") or ""
        p.save(update_fields=["status", "refunded_at", "refunded_by", "updated_at"])
        try:
            from .utils_audit import record_audit
            record_audit(
                request,
                user=actor if hasattr(actor, "id") else None,
                type="action",
                action="Payment refunded",
                details=f"paymentId={pid} order={p.order_id}",
                severity="warning",
                meta={"paymentId": str(p.id), "orderId": p.order_id},
            )
        except Exception:
            pass
        return JsonResponse({"success": True, "data": _serialize_db(p)})
    except Exception:
        return JsonResponse({"success": False, "message": "Refund failed"}, status=500)


__all__ = ["order_payment", "payments_list", "payment_refund"]


@require_http_methods(["GET", "PUT"])  # /payments/config
def payments_config(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import PaymentMethodConfig
        cfg, _ = PaymentMethodConfig.objects.get_or_create(id=1)
        if request.method == "GET":
            return JsonResponse({
                "success": True,
                "data": {
                    "cash": bool(cfg.cash_enabled),
                    "card": bool(cfg.card_enabled),
                    "mobile": bool(cfg.mobile_enabled),
                },
            })
        # PUT update -> admin/manager only
        if not _require_admin_or_manager(actor):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            data = {}
        def _getb(v, curr):
            if isinstance(v, bool):
                return v
            if isinstance(v, (int, str)):
                s = str(v).lower()
                if s in {"1", "true", "yes", "on"}:
                    return True
                if s in {"0", "false", "no", "off"}:
                    return False
            return curr
        cfg.cash_enabled = _getb(data.get("cash"), cfg.cash_enabled)
        cfg.card_enabled = _getb(data.get("card"), cfg.card_enabled)
        cfg.mobile_enabled = _getb(data.get("mobile"), cfg.mobile_enabled)
        cfg.updated_by = getattr(actor, "email", "") or ""
        cfg.save()
        return JsonResponse({"success": True})
    except (OperationalError, ProgrammingError):
        pass
    # Fallback: static allow all when DB unavailable
    if request.method == "GET":
        return JsonResponse({"success": True, "data": {"cash": True, "card": True, "mobile": True}})
    return JsonResponse({"success": True})


@require_http_methods(["GET"])  # /payments/<uuid:pid>/invoice
def payment_invoice(request, pid: str):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import PaymentTransaction
        p = PaymentTransaction.objects.filter(id=pid).first()
        if not p:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        # Build PDF
        try:
            import io
            from reportlab.pdfgen import canvas  # type: ignore
            from reportlab.lib.pagesizes import letter  # type: ignore
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=letter)
            width, height = letter
            y = height - 72
            c.setFont("Helvetica-Bold", 16)
            c.drawString(72, y, "Payment Invoice")
            y -= 24
            c.setFont("Helvetica", 10)
            fields = [
                ("Invoice ID", str(p.id)),
                ("Order ID", p.order_id),
                ("Date", (p.created_at or dj_timezone.now()).strftime("%Y-%m-%d %H:%M:%S")),
                ("Amount", f"₱{float(p.amount):.2f}"),
                ("Method", p.method.title()),
                ("Status", p.status),
                ("Reference", p.reference or ""),
                ("Customer", p.customer or ""),
                ("Processed By", (p.processed_by.email if getattr(p, 'processed_by', None) else '')),
            ]
            for label, val in fields:
                y -= 16
                c.drawString(72, y, f"{label}: {val}")
            c.showPage()
            c.save()
            pdf = buf.getvalue()
            from django.http import HttpResponse
            resp = HttpResponse(pdf, content_type='application/pdf')
            resp['Content-Disposition'] = f'inline; filename="invoice-{p.id}.pdf"'
            return resp
        except Exception:
            return JsonResponse({"success": False, "message": "Invoice generation not available"}, status=501)
    except Exception:
        return JsonResponse({"success": False, "message": "Failed"}, status=500)
