import json
import hashlib
import secrets
from datetime import timedelta
from typing import Optional, Tuple

from django.conf import settings
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.utils import timezone as dj_timezone


OTP_TTL_SECONDS = 60  # 1 minute
RESET_TOKEN_TTL_SECONDS = 15 * 60  # 15 minutes
SIGNER_SALT = "api.password_reset.v1"


def _sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generate_otp_code() -> str:
    """Generate a cryptographically strong 6‑digit code (zero‑padded)."""
    return f"{secrets.randbelow(1_000_000):06d}"


def create_password_reset_code(user) -> Tuple[str, "PasswordResetCode"]:
    """Create and persist a short‑lived OTP for the given user.

    Returns the raw code and the saved model instance.
    """
    from .models import PasswordResetCode  # local import to avoid circulars

    code = generate_otp_code()
    chash = _sha256_hex(code)
    inst = PasswordResetCode.objects.create(
        user=user,
        code_hash=chash,
        expires_at=dj_timezone.now() + timedelta(seconds=OTP_TTL_SECONDS),
    )
    return code, inst


def verify_password_reset_code(user, raw_code: str, max_attempts: int = 5) -> Optional["PasswordResetCode"]:
    """Validate a submitted code for a user.

    - Enforces expiry and single‑use
    - Increments attempts on failure; blocks after max_attempts
    - Returns the matching instance on success and marks it used
    - Returns None on failure (generic)
    """
    from .models import PasswordResetCode

    if not raw_code or len(raw_code.strip()) != 6 or not raw_code.strip().isdigit():
        return None
    now = dj_timezone.now()
    code_qs = (
        PasswordResetCode.objects.filter(user=user, used=False, expires_at__gt=now)
        .order_by("-created_at")
    )
    chash = _sha256_hex(raw_code.strip())
    for item in code_qs:
        if item.attempts >= max_attempts:
            # Hard block this code
            item.used = True
            item.save(update_fields=["used"])
            continue
        if item.code_hash == chash:
            item.used = True
            item.save(update_fields=["used"])
            return item
        # wrong try
        item.attempts = int(item.attempts or 0) + 1
        if item.attempts >= max_attempts:
            item.used = True
            item.save(update_fields=["attempts", "used"])
        else:
            item.save(update_fields=["attempts"])
    return None


def make_reset_token(user) -> str:
    """Create a short‑lived, signed token bound to the user id.

    Uses Django's TimestampSigner so the age can be verified server‑side
    without storing the token.
    """
    signer = TimestampSigner(salt=SIGNER_SALT)
    payload = json.dumps({"uid": str(getattr(user, "id", "")), "v": 1})
    return signer.sign(payload)


def read_reset_token(token: str, max_age_seconds: int = RESET_TOKEN_TTL_SECONDS) -> Optional[str]:
    """Validate and decode the reset token.

    Returns the user id string on success, None otherwise.
    """
    if not token:
        return None
    signer = TimestampSigner(salt=SIGNER_SALT)
    try:
        payload = signer.unsign(token, max_age=max_age_seconds)
        data = json.loads(payload)
        uid = str(data.get("uid") or "").strip()
        return uid or None
    except (BadSignature, SignatureExpired, json.JSONDecodeError, Exception):
        return None

