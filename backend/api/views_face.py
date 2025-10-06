"""Face registration and login via simple image hashing.

This is a pragmatic implementation using an average-hash (aHash) approach
computed from a submitted face image. It enables a basic demo of face-based
login without heavy dependencies. Do not use as-is for high security needs.
"""

import io
import json
from typing import Optional
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.utils import timezone as dj_timezone

from .views_common import (
    _extract_dataurl_image,
    _safe_user_from_db,
    _issue_jwt,
    _issue_refresh_token_db,
)
from .utils_audit import record_audit


def _compute_ahash(image_bytes: bytes, size: int = 8) -> Optional[str]:
    """Compute a 64-bit average hash (aHash) as 16-hex string.

    Requires Pillow.
    """
    if not image_bytes:
        return None
    try:
        from PIL import Image
    except Exception:
        return None
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = img.convert("L")  # grayscale
            img = img.resize((size, size))
            pixels = list(img.getdata())
            avg = sum(pixels) / float(len(pixels))
            bits = 0
            for i, p in enumerate(pixels):
                if p >= avg:
                    bits |= (1 << (len(pixels) - 1 - i))
            # 64-bit -> 16 hex chars
            return f"{bits:016x}"
    except Exception:
        return None


def _hamming(a_hex: str, b_hex: str) -> int:
    try:
        return bin(int(a_hex, 16) ^ int(b_hex, 16)).count("1")
    except Exception:
        return 64


@require_http_methods(["POST"]) 
def face_register(request):
    """Register or update the calling user's face template.

    Expects Authorization: Bearer <jwt> and JSON body with `image` or `images` (data URLs).
    Stores an average-hash and optional reference image.
    """
    auth = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth.startswith("Bearer "):
        return JsonResponse({"success": False, "message": "Unauthorized"}, status=401)
    token = auth.split(" ", 1)[1].strip()

    import jwt
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        return JsonResponse({"success": False, "message": "Unauthorized"}, status=401)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        data = {}

    def _first_image_bytes():
        image = data.get("image") or data.get("imageData") or ""
        images = data.get("images") or []
        if not image and images:
            image = images[0].get("data") if isinstance(images[0], dict) else images[0]
        mime, raw = _extract_dataurl_image(image)
        return raw

    raw = _first_image_bytes()
    if not raw:
        return JsonResponse({"success": False, "message": "Missing image"}, status=400)

    ahash = _compute_ahash(raw)
    if not ahash:
        return JsonResponse({"success": False, "message": "Image processing failed"}, status=400)

    try:
        from .models import AppUser, FaceTemplate
        user = AppUser.objects.filter(id=payload.get("sub")).first()
        if not user:
            return JsonResponse({"success": False, "message": "User not found"}, status=404)
        tpl, created = FaceTemplate.objects.get_or_create(user=user, defaults={"ahash": ahash})
        if not created:
            tpl.ahash = ahash
        # Optionally store reference image
        try:
            from django.core.files.base import ContentFile
            tpl.reference.save("reference.jpg", ContentFile(raw), save=False)
        except Exception:
            pass
        tpl.save()
        try:
            record_audit(
                request,
                user=user,
                type="security",
                action="Face template registered",
                details="User added/updated face template",
                severity="info",
            )
        except Exception:
            pass
        return JsonResponse({"success": True})
    except Exception:
        return JsonResponse({"success": False, "message": "Registration failed"}, status=500)


@require_http_methods(["POST"]) 
def face_login(request):
    """Attempt login by matching submitted face image to stored templates.

    Expects JSON body: { image: dataURL, remember?: bool }
    On match to an active user, issues JWT + refresh token.
    """
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        data = {}
    image = data.get("image") or data.get("imageData") or ""
    remember_raw = data.get("remember")
    remember = False
    if isinstance(remember_raw, bool):
        remember = remember_raw
    elif isinstance(remember_raw, (int, str)):
        remember = str(remember_raw).lower() in {"1", "true", "yes", "on"}

    mime, raw = _extract_dataurl_image(image)
    if not raw:
        return JsonResponse({"success": False, "message": "Missing image"}, status=400)
    ahash = _compute_ahash(raw)
    if not ahash:
        return JsonResponse({"success": False, "message": "Image processing failed"}, status=400)

    # Hamming distance threshold for 64-bit aHash. Tune as needed.
    MAX_DIST = 8

    # Try DB templates
    try:
        from .models import FaceTemplate
        candidates = list(FaceTemplate.objects.select_related("user").all())
        if not candidates:
            try:
                record_audit(
                    request,
                    type="login",
                    action="Login failed",
                    details="Face login: no registered faces",
                    severity="warning",
                )
            except Exception:
                pass
            return JsonResponse({"success": False, "message": "No registered faces"}, status=404)
        best = None
        best_d = 999
        for tpl in candidates:
            d = _hamming(ahash, tpl.ahash)
            if d < best_d:
                best_d = d
                best = tpl
        if not best or best_d > MAX_DIST:
            try:
                record_audit(
                    request,
                    type="login",
                    action="Login failed",
                    details="Face login: not recognized",
                    severity="warning",
                )
            except Exception:
                pass
            return JsonResponse({"success": False, "message": "Face not recognized"}, status=401)

        user = best.user
        # Require active status; block deactivated explicitly
        status_l = (user.status or "").lower()
        if status_l == "deactivated":
            try:
                record_audit(
                    request,
                    user=user,
                    type="security",
                    action="Login blocked (deactivated)",
                    details="Face login",
                    severity="warning",
                )
            except Exception:
                pass
            return JsonResponse({
                "success": False,
                "message": "Your account is currently deactivated, to activate please contact the admin.",
            }, status=403)
        if status_l != "active":
            # Issue verify token to allow app to route appropriately for pending users
            from .views_common import _issue_verify_token_from_db
            try:
                record_audit(
                    request,
                    user=user,
                    type="login",
                    action="Login pending",
                    details="Face login",
                    severity="info",
                )
            except Exception:
                pass
            return JsonResponse({
                "success": True,
                "pending": True,
                "user": _safe_user_from_db(user),
                "verifyToken": _issue_verify_token_from_db(user),
            })

        user.last_login = dj_timezone.now()
        user.save(update_fields=["last_login"])

        exp_seconds = (
            getattr(settings, "JWT_REMEMBER_EXP_SECONDS", 30 * 24 * 60 * 60)
            if remember
            else getattr(settings, "JWT_EXP_SECONDS", 3600)
        )
        token = _issue_jwt(user, exp_seconds=exp_seconds)
        refresh_token = _issue_refresh_token_db(user, remember=remember, request=request)
        try:
            record_audit(
                request,
                user=user,
                type="login",
                action="Login success",
                details="Face login",
                severity="info",
            )
        except Exception:
            pass
        return JsonResponse({
            "success": True,
            "user": _safe_user_from_db(user),
            "token": token,
            "refreshToken": refresh_token,
        })
    except Exception:
        try:
            record_audit(
                request,
                type="system",
                action="Login error",
                details="Face login failed with server error",
                severity="warning",
            )
        except Exception:
            pass
        return JsonResponse({"success": False, "message": "Login failed"}, status=500)


from django.views.decorators.http import require_http_methods


@require_http_methods(["POST", "DELETE"]) 
def face_unregister(request):
    """Remove the calling user's face template.

    Requires Authorization: Bearer <jwt>.
    Accepts POST or DELETE for convenience.
    """
    auth = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth.startswith("Bearer "):
        return JsonResponse({"success": False, "message": "Unauthorized"}, status=401)
    token = auth.split(" ", 1)[1].strip()

    import jwt
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        return JsonResponse({"success": False, "message": "Unauthorized"}, status=401)

    try:
        from .models import AppUser, FaceTemplate
        user = AppUser.objects.filter(id=payload.get("sub")).first()
        if not user:
            return JsonResponse({"success": False, "message": "User not found"}, status=404)
        tpl = FaceTemplate.objects.filter(user=user).first()
        if not tpl:
            # Already removed
            return JsonResponse({"success": True})
        try:
            if getattr(tpl, "reference", None):
                tpl.reference.delete(save=False)
        except Exception:
            pass
        tpl.delete()
        try:
            record_audit(
                request,
                user=user,
                type="security",
                action="Face template unregistered",
                details="User removed face template",
                severity="info",
            )
        except Exception:
            pass
        return JsonResponse({"success": True})
    except Exception:
        return JsonResponse({"success": False, "message": "Unregister failed"}, status=500)


__all__ = ["face_register", "face_login", "face_unregister"]
