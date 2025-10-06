import re
import jwt
from django.http import JsonResponse
from django.conf import settings
import time
import uuid


class PendingUserGateMiddleware:
    """Blocks API access for users who are not approved.

    This middleware is JWT-aware and only applies to API routes. It allows
    unauthenticated access to a small set of public endpoints (health, auth routes).
    All other API requests require a valid JWT for an AppUser whose status is
    'active' and whose role is one of the approved roles.
    """

    PUBLIC_PATHS = {
        "/api/health",
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/register",
        "/api/auth/google",
        "/api/auth/verify-email",
        "/api/auth/resend-verification",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/reset-password-code",
        "/api/auth/verify-reset-code",
        "/api/auth/password-reset/",
        "/api/auth/refresh-token",
        "/api/auth/face-login",
        "/api/verify/status",
        "/api/verify/upload",
        "/api/verify/resend-token",
        "/api/users/roles",
        "/accounts/",  # allow allauth endpoints
        "/admin/",     # allow admin UI
        "/static/",
        "/media/",
    }

    APPROVED_ROLES = {"admin", "manager", "staff"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path or ""
        # Only enforce for API routes
        if path.startswith("/api/"):
            if self._is_public(path):
                return self.get_response(request)

            user = self._user_from_jwt(request)
            if not user:
                return JsonResponse({"success": False, "message": "Unauthorized"}, status=401)

            # Only allow active + approved role
            status = (user.status or "").lower()
            role = (user.role or "").lower()
            if status != "active" or role not in self.APPROVED_ROLES:
                # Provide clearer messaging for deactivated accounts
                if status == "deactivated":
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "Your account is currently deactivated, to activate please contact the admin.",
                        },
                        status=403,
                    )
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Account pending approval or unauthorized",
                        "pending": status != "active",
                        "role": role,
                    },
                    status=403,
                )

        return self.get_response(request)

    def _is_public(self, path: str) -> bool:
        for prefix in self.PUBLIC_PATHS:
            if path.startswith(prefix):
                return True
        return False

    def _user_from_jwt(self, request):
        auth = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth.split(" ", 1)[1].strip()
        if not token:
            return None
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except Exception:
            return None

        user_id = str(payload.get("sub") or "")
        email = (payload.get("email") or "").lower().strip()
        try:
            from .models import AppUser
            if user_id:
                u = AppUser.objects.filter(id=user_id).first()
                if u:
                    return u
            if email:
                u = AppUser.objects.filter(email=email).first()
                return u
        except Exception:
            return None
        return None


class VersionHeaderMiddleware:
    """Attach API version header to all /api responses."""

    def __init__(self, get_response):
        self.get_response = get_response
        self.version = getattr(settings, "API_VERSION", "1")

    def __call__(self, request):
        resp = self.get_response(request)
        try:
            if getattr(request, 'path', '').startswith('/api/'):
                resp["X-API-Version"] = str(self.version)
        except Exception:
            pass
        return resp


class RequestIdMiddleware:
    """Assign a request ID and expose it via header for log correlation."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        rid = request.META.get('HTTP_X_REQUEST_ID') or uuid.uuid4().hex
        request.request_id = rid
        resp = self.get_response(request)
        try:
            resp['X-Request-ID'] = rid
        except Exception:
            pass
        return resp


class ResponseTimingMiddleware:
    """Adds X-Response-Time-ms header."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        resp = self.get_response(request)
        try:
            dur = int((time.perf_counter() - start) * 1000)
            resp['X-Response-Time-ms'] = str(dur)
        except Exception:
            pass
        return resp


class SecurityHeadersMiddleware:
    """Add common security headers (lightweight, configurable)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        resp = self.get_response(request)
        try:
            resp['X-Content-Type-Options'] = 'nosniff'
            resp['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            resp['X-Frame-Options'] = 'DENY'
            resp['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        except Exception:
            pass
        return resp
