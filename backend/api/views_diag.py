from __future__ import annotations

from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from .views_common import _actor_from_request
from django.utils import timezone as dj_tz
from django.core.files.storage import default_storage


@require_http_methods(["GET"])  # /diagnostics/media
def diag_media(request):
    """Check media files referenced by DB exist on storage.

    Returns counts and a small sample list of missing files.
    """
    try:
        from .models import MenuItem
        qs = MenuItem.objects.all()
        total = qs.count()
        with_img_qs = qs.exclude(image="").exclude(image__isnull=True)
        with_img = with_img_qs.count()
        missing_list = []
        checked = 0
        for item in with_img_qs.iterator():
            try:
                name = getattr(item.image, "name", None)
                if not name:
                    continue
                if not default_storage.exists(name):
                    missing_list.append({
                        "id": str(item.id),
                        "name": item.name,
                        "path": name,
                        "url": getattr(item.image, "url", None),
                    })
                checked += 1
                if len(missing_list) >= 50:  # cap output
                    break
            except Exception:
                # ignore individual errors; continue
                continue
        data = {
            "success": True,
            "totalItems": total,
            "withImages": with_img,
            "checked": checked,
            "missingCount": len(missing_list),
            "missing": missing_list,
        }
        return JsonResponse(data)
    except Exception:
        return JsonResponse({"success": False, "message": "Diagnostics failed"}, status=500)


@require_http_methods(["GET"])  # /diagnostics/ping
def diag_ping(request):
    return JsonResponse({"success": True, "time": dj_tz.now().isoformat()})


@require_http_methods(["POST"])  # /diagnostics/cash-drawer
def diag_cash_drawer(request):
    # Placeholder success; actual drawer opening is device-specific via printer kick codes.
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    return JsonResponse({"success": True, "message": "Drawer signal simulated"})


@require_http_methods(["GET"])  # /diagnostics/receipt
def diag_receipt(request):
    # Produce a simple PDF receipt for printer validation
    try:
        import io
        from reportlab.pdfgen import canvas  # type: ignore
        from reportlab.lib.pagesizes import letter  # type: ignore
    except Exception:
        return JsonResponse({"success": False, "message": "PDF generator unavailable"}, status=501)
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    w, h = letter
    y = h - 72
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, y, "Test Receipt")
    y -= 18
    c.setFont("Helvetica", 10)
    c.drawString(72, y, f"Generated: {dj_tz.now().strftime('%Y-%m-%d %H:%M:%S')}")
    y -= 24
    c.drawString(72, y, "Line 1: Sample item A x1  ₱10.00")
    y -= 14
    c.drawString(72, y, "Line 2: Sample item B x2  ₱20.00")
    y -= 14
    c.drawString(72, y, "Total: ₱30.00")
    c.showPage(); c.save()
    pdf = buf.getvalue()
    resp = HttpResponse(pdf, content_type='application/pdf')
    resp['Content-Disposition'] = 'inline; filename="test-receipt.pdf"'
    return resp


__all__ = ["diag_ping", "diag_cash_drawer", "diag_receipt", "diag_media"]
