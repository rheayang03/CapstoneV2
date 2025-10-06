from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Set payment_method='cash' for existing walk-in orders with empty payment_method."

    def handle(self, *args, **options):
        from api.models import Order

        qs = Order.objects.filter(order_type__iexact='walk-in').filter(payment_method__in=['', None])
        count = qs.update(payment_method='cash')
        self.stdout.write(self.style.SUCCESS(f"Updated {count} walk-in orders to payment_method='cash'."))

