"""Utilities for outbound notifications (web push, email, DB persistence).

All functions are best-effort: failures are swallowed (logged in DEBUG) so they
do not break primary request flows.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence

from django.conf import settings


def _debug_log(msg: str):
    try:
        if getattr(settings, "DEBUG", False):
            print(f"[notify] {msg}")
    except Exception:
        pass


def _normalize_type(value: str | None) -> str:
    allowed = {"info", "warning", "success", "error"}
    v = (value or "info").strip().lower()
    return v if v in allowed else "info"


def _should_send_for_topic(pref, topic: str) -> bool:
    if not pref:
        return True
    if topic == "low_stock":
        return bool(getattr(pref, "low_stock", True))
    if topic == "order":
        return bool(getattr(pref, "order", True))
    if topic == "payment":
        return bool(getattr(pref, "payment", True))
    return True


def create_notification(
    user,
    *,
    title: str,
    message: str = "",
    notif_type: str = "info",
    meta: Optional[Dict[str, Any]] = None,
    topic: str = "",
    push: Optional[bool] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> Any:
    """Persist a notification for a single user and enqueue optional push delivery.

    Args:
        user: AppUser instance (required).
        title: Notification title (required).
        message: Body text.
        notif_type: info|warning|success|error (defaults to info).
        meta: Optional JSON metadata saved with the record.
        topic: Logical topic used to respect NotificationPreference filters
               (e.g., 'low_stock', 'order', 'payment').
        push: Override to force enabling/disabling push queueing. If None, falls
              back to user preference.
        payload: Optional push payload dict stored in NotificationOutbox.payload.
    """
    if user is None:
        return None

    from .models import Notification, NotificationPreference, NotificationOutbox

    notif_type = _normalize_type(notif_type)
    meta_data: Dict[str, Any] = meta if isinstance(meta, dict) else {}
    topic_value = (topic or "").strip().lower()

    notification = Notification.objects.create(
        user=user,
        title=title or "Notification",
        message=message or "",
        type=notif_type,
        meta=meta_data,
    )

    pref = None
    try:
        pref, _ = NotificationPreference.objects.get_or_create(user=user)
    except Exception:
        pref = getattr(user, "notification_pref", None)

    should_push = bool(push) if push is not None else bool(getattr(pref, "push_enabled", False))
    if should_push and not _should_send_for_topic(pref, topic_value):
        should_push = False

    if should_push:
        try:
            NotificationOutbox.objects.create(
                user=user,
                title=title or "Notification",
                message=message or "",
                category=topic_value,
                payload=payload if isinstance(payload, dict) else {},
                status=NotificationOutbox.STATUS_PENDING,
            )
        except Exception as exc:
            _debug_log(f"Failed to enqueue push notification: {exc}")

    return notification


def notify_users(
    users: Sequence[Any] | Iterable[Any],
    *,
    title: str,
    message: str = "",
    notif_type: str = "info",
    meta: Optional[Dict[str, Any]] = None,
    topic: str = "",
    payload: Optional[Dict[str, Any]] = None,
    push: Optional[bool] = None,
) -> List[Any]:
    """Create the same notification for multiple users."""
    created: List[Any] = []
    for user in users or []:
        try:
            n = create_notification(
                user,
                title=title,
                message=message,
                notif_type=notif_type,
                meta=meta,
                topic=topic,
                payload=payload,
                push=push,
            )
            if n is not None:
                created.append(n)
        except Exception as exc:
            _debug_log(f"notify_users error: {exc}")
            continue
    return created


def send_webpush_to_user(user, *, title: str, message: str = "", data: Dict[str, Any] | None = None) -> bool:
    """Send a Web Push notification to all active subscriptions for a user.

    Requires WEBPUSH_VAPID_PUBLIC_KEY and WEBPUSH_VAPID_PRIVATE_KEY in settings.
    Uses pywebpush if available; no-ops otherwise.
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
            # soft-deactivate clearly invalid subscriptions
            try:
                sub.active = False
                sub.save(update_fields=["active", "updated_at"])
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


__all__ = ["create_notification", "notify_users", "send_webpush_to_user"]
