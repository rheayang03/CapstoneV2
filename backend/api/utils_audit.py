"""Lightweight helpers to record audit events consistently.

Attempts to write to the DB-backed AuditLog when available and falls back to
an in-memory list shared with the logs endpoints.
"""

from __future__ import annotations

from typing import Any, Optional, Mapping
from uuid import uuid4
from django.utils import timezone as dj_timezone


def _coerce_str(val: Any) -> str:
    try:
        return str(val)
    except Exception:
        return ""


def record_audit(
    request=None,
    *,
    user: Optional[Any] = None,
    actor_email: Optional[str] = None,
    type: str = "action",
    action: str = "Activity",
    details: str = "",
    severity: str = "",
    meta: Optional[Mapping[str, Any]] = None,
):
    """Record an audit event with best-effort persistence.

    - If DB and AuditLog table are available, writes there.
    - Otherwise appends to the in-memory LOGS_MEM used by logs endpoints.
    """
    # Lazy import to avoid circulars during startup/migrations
    try:
        from .views_common import _client_meta
    except Exception:
        def _client_meta(_request):
            return "", ""

    ua, ip = _client_meta(request)

    # Normalize actor email and DB user if possible
    email = (actor_email or "").lower().strip()
    db_user = None
    try:
        # Model instance passed directly
        if user is not None and hasattr(user, "id") and hasattr(user, "email"):
            db_user = user
            email = email or (getattr(user, "email", "") or "").lower().strip()
        else:
            # dict-like
            if user and not db_user:
                try:
                    email = email or (user.get("email") or "").lower().strip()
                except Exception:
                    pass
            if not db_user and email:
                try:
                    from .models import AppUser  # noqa: WPS433
                    db_user = AppUser.objects.filter(email=email).first()
                except Exception:
                    db_user = None
    except Exception:
        db_user = None

    # Try DB-backed AuditLog first
    try:
        from .models import AuditLog  # noqa: WPS433
        # Validate type against choices
        valid_types = {c[0] for c in getattr(AuditLog, "TYPE_CHOICES", [])}
        atype = type if type in valid_types else AuditLog.TYPE_ACTION
        log = AuditLog.objects.create(
            user=db_user,
            actor_email=email,
            type=atype,
            action=action,
            details=details or "",
            severity=(severity or "").lower(),
            ip_address=ip,
            user_agent=ua,
            meta=dict(meta or {}),
        )
        return {"ok": True, "id": str(getattr(log, "id", "")), "backend": "db"}
    except Exception:
        pass

    # Fallback to memory shared with logs endpoints
    try:
        from .views_logs import LOGS_MEM  # noqa: WPS433
    except Exception:
        LOGS_MEM = []  # type: ignore

    entry = {
        "id": uuid4().hex,
        "action": action,
        "user": email or "",
        "type": (type or "action").lower(),
        "timestamp": dj_timezone.now().isoformat(),
        "details": details or "",
        "severity": (severity or "").lower(),
        "ip": ip,
        "userAgent": ua,
        "meta": dict(meta or {}),
    }
    try:
        LOGS_MEM.append(entry)  # type: ignore[attr-defined]
        return {"ok": True, "id": entry["id"], "backend": "memory"}
    except Exception:
        return {"ok": False}


__all__ = ["record_audit"]

