"""Helpers for login one-time password generation and validation."""

from __future__ import annotations

import hashlib
from datetime import timedelta
from typing import Optional, Tuple

from django.conf import settings
from django.utils import timezone as dj_timezone

from .models import LoginOTP, AppUser
from .utils_password_reset import generate_otp_code


def _sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def get_login_otp_ttl_seconds() -> int:
    """Return the configured lifetime (seconds) for login OTP codes."""

    return max(1, int(getattr(settings, "LOGIN_OTP_TTL_SECONDS", 60)))


def _max_attempts() -> int:
    return max(1, int(getattr(settings, "LOGIN_OTP_MAX_ATTEMPTS", 5)))


def create_login_otp(
    user: AppUser,
    *,
    remember: bool = False,
    ip_address: str = "",
    user_agent: str = "",
) -> Tuple[str, LoginOTP]:
    """Create and persist a login OTP for the given user.

    Returns a tuple of (raw_code, model_instance).
    """

    code = generate_otp_code()
    ttl_seconds = get_login_otp_ttl_seconds()
    otp = LoginOTP.objects.create(
        user=user,
        code_hash=_sha256_hex(code),
        remember=bool(remember),
        expires_at=dj_timezone.now() + timedelta(seconds=ttl_seconds),
        ip_address=ip_address[:64],
        user_agent=user_agent[:256],
    )
    return code, otp


def verify_login_otp(
    otp_id: str,
    raw_code: str,
    *,
    email: Optional[str] = None,
    max_attempts: Optional[int] = None,
) -> Tuple[bool, Optional[LoginOTP], str]:
    """Validate a submitted login OTP.

    Returns (success, otp_instance_or_none, message).
    The OTP instance will always include the related user on success.
    """

    max_attempts = max_attempts or _max_attempts()
    if not otp_id or not raw_code:
        return False, None, "Invalid verification request."

    raw = str(raw_code).strip()
    if len(raw) != 6 or not raw.isdigit():
        return False, None, "Invalid verification code."

    try:
        otp = (
            LoginOTP.objects.select_related("user")
            .filter(id=otp_id)
            .order_by("-created_at")
            .first()
        )
    except (LoginOTP.DoesNotExist, Exception):
        otp = None

    if not otp:
        return False, None, "Invalid or expired code."

    if email and (otp.user.email or "").lower().strip() != email.lower().strip():
        return False, None, "Invalid or expired code."

    now = dj_timezone.now()
    if otp.consumed_at or otp.expires_at <= now:
        return False, None, "Invalid or expired code."

    if otp.attempts >= max_attempts:
        otp.consumed_at = now
        otp.save(update_fields=["consumed_at"])
        return False, None, "Too many attempts."

    if otp.code_hash != _sha256_hex(raw):
        otp.attempts = (otp.attempts or 0) + 1
        updates = ["attempts"]
        if otp.attempts >= max_attempts:
            otp.consumed_at = now
            updates.append("consumed_at")
        otp.save(update_fields=updates)
        return False, None, "Invalid verification code."

    otp.consumed_at = now
    otp.attempts = (otp.attempts or 0) + 1
    otp.save(update_fields=["consumed_at", "attempts"])
    return True, otp, "Verification successful."


__all__ = [
    "create_login_otp",
    "verify_login_otp",
    "get_login_otp_ttl_seconds",
]
