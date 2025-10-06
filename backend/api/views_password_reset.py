"""Secure password reset via OTP (verification code) + TimestampSigner token.

Endpoints:
- POST /auth/password-reset/request  { email }
- POST /auth/password-reset/verify   { email, code }
- POST /auth/password-reset/confirm  { resetToken, password }
"""

import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.db.utils import OperationalError, ProgrammingError
from django.utils import timezone as dj_timezone

from .views_common import rate_limit, _email_rate_key, _revoke_all_refresh_tokens
from .utils_password_reset import (
    create_password_reset_code,
    verify_password_reset_code,
    make_reset_token,
    read_reset_token,
    OTP_TTL_SECONDS,
)
from .emails import email_user_password_reset


def _parse_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return {}


@rate_limit(limit=5, window_seconds=60, key_fn=_email_rate_key)
@require_http_methods(["POST"]) 
def password_reset_request(request):
    data = _parse_json(request)
    email = (data.get("email") or "").lower().strip()

    # Always respond generically to avoid user enumeration
    generic_payload = {"success": True, "message": "If account exists, code sent."}
    status_code = 202

    if not email:
        resp = JsonResponse(generic_payload)
        resp.status_code = status_code
        return resp

    try:
        from .models import AppUser
        u = AppUser.objects.filter(email=email).first()
        if u:
            # Create a 60s OTP and email it. Never store the raw code.
            code, _rec = create_password_reset_code(u)
            try:
                base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:8080").rstrip("/")
                link = f"{base}/reset-password"  # generic landing page
                # Send an email that includes the code and an optional link.
                email_user_password_reset(email, link, code=code, expires_minutes=max(1, int(OTP_TTL_SECONDS/60)))
            except Exception:
                pass
    except (OperationalError, ProgrammingError):
        # If DB is not ready, still respond generically.
        pass

    resp = JsonResponse(generic_payload)
    resp.status_code = status_code
    return resp


@rate_limit(limit=10, window_seconds=60, key_fn=_email_rate_key)
@require_http_methods(["POST"]) 
def password_reset_verify(request):
    data = _parse_json(request)
    email = (data.get("email") or "").lower().strip()
    code = (data.get("code") or "").strip()

    if not email or not code:
        return JsonResponse({"success": False, "message": "Invalid or expired code"}, status=400)

    try:
        from .models import AppUser
        u = AppUser.objects.filter(email=email).first()
        if not u:
            return JsonResponse({"success": False, "message": "Invalid or expired code"}, status=400)
        rec = verify_password_reset_code(u, code)
        if not rec:
            return JsonResponse({"success": False, "message": "Invalid or expired code"}, status=400)
        # Success: return a short‑lived reset token (15m)
        token = make_reset_token(u)
        return JsonResponse({"success": True, "resetToken": token})
    except (OperationalError, ProgrammingError):
        return JsonResponse({"success": False, "message": "Invalid or expired code"}, status=400)


@rate_limit(limit=10, window_seconds=60)
@require_http_methods(["POST"]) 
def password_reset_confirm(request):
    data = _parse_json(request)
    token = (data.get("resetToken") or data.get("token") or "").strip()
    new_password = data.get("newPassword") or data.get("password") or ""

    if not token:
        return JsonResponse({"success": False, "message": "Missing token"}, status=400)
    if not new_password:
        return JsonResponse({"success": False, "message": "Password is required"}, status=400)

    uid = read_reset_token(token)
    if not uid:
        return JsonResponse({"success": False, "message": "Invalid or expired token"}, status=400)

    # Validate against Django's password validators
    try:
        validate_password(new_password)
    except ValidationError as ve:
        # Return first message to keep response compact
        msg = "; ".join([str(m) for m in ve.messages]) or "Password validation failed"
        return JsonResponse({"success": False, "message": msg}, status=400)

    try:
        from .models import AppUser
        u = AppUser.objects.filter(id=uid).first()
        if not u:
            return JsonResponse({"success": False, "message": "Invalid or expired token"}, status=400)
        u.password_hash = make_password(new_password)
        u.save(update_fields=["password_hash"])
        _revoke_all_refresh_tokens(u)
        return JsonResponse({"success": True, "message": "Password reset successful"})
    except (OperationalError, ProgrammingError):
        return JsonResponse({"success": False, "message": "Server error"}, status=500)

