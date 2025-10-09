import jwt
from decimal import Decimal
from datetime import timedelta

from django.conf import settings
from django.test import Client, TestCase
from django.utils import timezone as dj_tz

from api.models import AppUser, MenuItem, Order, OrderItem, PaymentTransaction


def auth_headers(user):
    now = dj_tz.now()
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


class DashboardStatsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = AppUser.objects.create(
            email="manager@example.com",
            name="Manager",
            role="manager",
            status="active",
        )
        self.menu_item = MenuItem.objects.create(
            name="Bam-i",
            category="Noodles",
            price=Decimal("50.00"),
            available=True,
        )

    def test_dashboard_stats_returns_live_data(self):
        order = Order.objects.create(
            order_number="ORD-1001",
            status=Order.STATUS_COMPLETED,
            order_type="walk-in",
            customer_name="Juan Dela Cruz",
            subtotal=Decimal("150.00"),
            discount=Decimal("0.00"),
            total_amount=Decimal("150.00"),
            payment_method="cash",
            placed_by=self.user,
        )
        OrderItem.objects.create(
            order=order,
            menu_item=self.menu_item,
            item_name=self.menu_item.name,
            price=self.menu_item.price,
            quantity=3,
        )
        payment = PaymentTransaction.objects.create(
            order_id=order.order_number,
            amount=Decimal("150.00"),
            method=PaymentTransaction.METHOD_CASH,
            status=PaymentTransaction.STATUS_COMPLETED,
            customer=order.customer_name,
        )

        recent_time = dj_tz.now() - timedelta(hours=2)
        Order.objects.filter(id=order.id).update(created_at=recent_time)
        PaymentTransaction.objects.filter(id=payment.id).update(created_at=recent_time)

        response = self.client.get("/api/dashboard/stats", **auth_headers(self.user))
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertTrue(payload.get("success"))
        data = payload.get("data", {})

        self.assertEqual(data.get("orderCount"), 1)
        self.assertEqual(data.get("customerCount"), 1)
        self.assertAlmostEqual(data.get("dailySales"), 150.0, places=2)
        self.assertAlmostEqual(data.get("monthlySales"), 150.0, places=2)
        self.assertEqual(data.get("previousDailySales"), 0.0)
        self.assertEqual(data.get("previousMonthlySales"), 0.0)
        self.assertEqual(data.get("previousOrderCount"), 0)
        self.assertTrue(any(item["name"] == "Bam-i" for item in data.get("popularItems", [])))
        self.assertTrue(data.get("salesByTime"))
        self.assertTrue(data.get("salesByCategory"))
        recent_sales = data.get("recentSales")
        self.assertTrue(recent_sales)
        first_sale = recent_sales[0]
        self.assertEqual(first_sale.get("orderNumber"), order.order_number)
        self.assertEqual(first_sale.get("paymentMethod"), PaymentTransaction.METHOD_CASH)
        self.assertAlmostEqual(first_sale.get("total"), 150.0, places=2)
