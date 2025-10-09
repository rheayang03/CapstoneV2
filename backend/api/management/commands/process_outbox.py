from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import NotificationOutbox


class Command(BaseCommand):
    help = "Deliver pending notification outbox entries via web push (best-effort)."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100, help="Max entries to process")
        parser.add_argument("--max-attempts", type=int, default=5, help="Retry attempts before giving up")

    def handle(self, *args, **options):
        limit = int(options.get("limit") or 100)
        max_attempts = max(1, int(options.get("max_attempts") or 5))
        qs = (
            NotificationOutbox.objects.filter(
                status__in=[NotificationOutbox.STATUS_PENDING, NotificationOutbox.STATUS_FAILED],
                attempts__lt=max_attempts,
            )
            .order_by("created_at")[:limit]
        )
        count = 0
        for e in qs:
            try:
                with transaction.atomic():
                    from api.utils_notify import send_webpush_to_user
                    payload = e.payload if isinstance(e.payload, dict) else {}
                    if "url" not in payload:
                        payload["url"] = "/notifications"
                    if e.category and "category" not in payload:
                        payload["category"] = e.category
                    ok = send_webpush_to_user(e.user, title=e.title, message=e.message, data=payload)
                    e.attempts = (e.attempts or 0) + 1
                    if ok:
                        e.status = NotificationOutbox.STATUS_SENT
                        e.last_error = ""
                    else:
                        e.status = NotificationOutbox.STATUS_FAILED
                        e.last_error = "send failed"
                    e.save(update_fields=["attempts", "status", "last_error", "updated_at"])
                count += 1
            except Exception as ex:
                try:
                    e.attempts = (e.attempts or 0) + 1
                    e.status = NotificationOutbox.STATUS_FAILED
                    e.last_error = str(ex)[:500]
                    e.save(update_fields=["attempts", "status", "last_error", "updated_at"])
                except Exception:
                    pass
                continue
        self.stdout.write(self.style.SUCCESS(f"Processed {count} outbox entries"))

