"""Utilities for outbound notifications (web push, email).

All functions are best‑effort: failures are swallowed (logged in DEBUG) so they
don’t break primary request flows.
"""

from __future__ import annotations

from typing import Any, Dict

from django.conf import settings


def _debug_log(msg: str):
    try:
        if getattr(settings, "DEBUG", False):
            print(f"[notify] {msg}")
    except Exception:
        pass


def send_webpush_to_user(user, *, title: str, message: str = "", data: Dict[str, Any] | None = None) -> bool:
    """Send a Web Push notification to all active subscriptions for a user.

    Requires WEBPUSH_VAPID_PUBLIC_KEY and WEBPUSH_VAPID_PRIVATE_KEY in settings.
    Uses pywebpush if available; no‑ops otherwise.
    """
    # Skip if not enabled
    try:
        pref = getattr(user, "notification_pref", None)
        if pref and not getattr(pref, "push_enabled", False):
            return False
    except Exception:
        pass

    pub = getattr(settings, "WEBPUSH_VAPID_PUBLIC_KEY", None) or getattr(settings, "VAPID_PUBLIC_KEY", None)
    priv = getattr(settings, "WEBPUSH_VAPID_PRIVATE_KEY", None) or getattr(settings, "VAPID_PRIVATE_KEY", None)
    subject = getattr(settings, "WEBPUSH_VAPID_SUBJECT", "mailto:admin@example.com")
    if not pub or not priv:
        _debug_log("Missing VAPID keys; skipping webpush")
        return False

    try:
        from pywebpush import webpush, WebPushException  # type: ignore
    except Exception:
        _debug_log("pywebpush not installed; skipping webpush")
        return False

    payload = {
        "title": title or "Notification",
        "body": message or "",
        "data": data or {},
    }

    ok_any = False
    try:
        from .models import WebPushSubscription
        subs = list(WebPushSubscription.objects.filter(user=user, active=True))
    except Exception:
        subs = []

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json_dumps(payload),
                vapid_private_key=priv,
                vapid_claims={"sub": subject},
            )
            ok_any = True
        except Exception as e:  # includes WebPushException
            _debug_log(f"webpush failed for endpoint={sub.endpoint[:32]}..: {e}")
            # soft‑deactivate clearly invalid subscriptions
            try:
                sub.active = False
                sub.save(update_fields=["active"])
            except Exception:
                pass
            continue

    return ok_any


def json_dumps(data: Dict[str, Any]) -> str:
    try:
        import json as _json
        return _json.dumps(data)
    except Exception:
        return "{}"


__all__ = ["send_webpush_to_user"]

