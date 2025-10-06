from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.inventory_services import get_low_stock, get_expiring_batches
from api.models import Notification, AppUser


class Command(BaseCommand):
    help = "Scan inventory for low stock and expiring batches; create notifications for managers."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=7, help="Expiry threshold in days (default: 7)")

    @transaction.atomic
    def handle(self, *args, **options):
        days = int(options.get("days") or 7)
        now = timezone.now()
        # Managers
        managers = list(AppUser.objects.filter(role__in=["manager", "admin"]))
        # Low stock
        low = get_low_stock()
        for item, qty in low:
            for u in managers:
                Notification.objects.create(
                    user=u,
                    title=f"Low stock: {item.name}",
                    message=f"Current stock is {qty}. Reorder point may be reached.",
                    type=Notification.TYPE_WARNING,
                    meta={"itemId": str(item.id), "qty": float(qty)},
                )
        # Expiring
        batches = get_expiring_batches(days)
        for b in batches:
            for u in managers:
                Notification.objects.create(
                    user=u,
                    title=f"Expiring soon: {getattr(b.item, 'name', '')}",
                    message=f"Batch {b.lot_code or b.id} expires on {b.expiry_date}",
                    type=Notification.TYPE_WARNING,
                    meta={"batchId": str(b.id), "expiryDate": b.expiry_date.isoformat() if b.expiry_date else None},
                )
        self.stdout.write(self.style.SUCCESS("Inventory scan complete"))

