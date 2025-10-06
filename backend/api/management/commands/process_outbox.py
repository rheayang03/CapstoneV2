from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import NotificationOutbox


class Command(BaseCommand):
    help = "Deliver pending notification outbox entries via web push (best-effort)."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100, help="Max entries to process")

    def handle(self, *args, **options):
        limit = int(options.get("limit") or 100)
        qs = NotificationOutbox.objects.filter(status=NotificationOutbox.STATUS_PENDING).order_by("created_at")[:limit]
        count = 0
        for e in qs:
            try:
                with transaction.atomic():
                    from api.utils_notify import send_webpush_to_user
                    ok = send_webpush_to_user(e.user, title=e.title, message=e.message, data={"url": "/notifications"})
                    e.attempts = (e.attempts or 0) + 1
                    e.status = NotificationOutbox.STATUS_SENT if ok else NotificationOutbox.STATUS_FAILED
                    e.last_error = "" if ok else "send failed"
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

