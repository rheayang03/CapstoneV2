import json

from django.test import TestCase, Client
from django.conf import settings
from django.utils import timezone as dj_tz
import jwt

from api.models import (
    AppUser,
    Notification,
    NotificationOutbox,
    NotificationPreference,
)


def auth_headers(user):
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "iat": int(dj_tz.now().timestamp()),
        "exp": int(dj_tz.now().timestamp()) + 3600,
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


class NotificationApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = AppUser.objects.create(
            email="manager@example.com",
            name="Manager",
            role="manager",
            status="active",
        )

    def _post_notification(self, payload: dict):
        return self.client.post(
            "/api/notifications/",
            data=json.dumps(payload),
            content_type="application/json",
            **auth_headers(self.user),
        )

    def test_create_notification_enqueues_outbox_with_payload(self):
        NotificationPreference.objects.create(
            user=self.user,
            push_enabled=True,
            low_stock=True,
            order=True,
            payment=True,
        )
        resp = self._post_notification(
            {
                "title": "Low stock alert",
                "message": "Item is below threshold",
                "type": "warning",
                "topic": "low_stock",
                "payload": {"url": "/inventory/items"},
            }
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()["data"]
        self.assertEqual(body["topic"], "low_stock")
        self.assertIn("meta", body)
        self.assertEqual(body["meta"].get("topic"), "low_stock")
        self.assertEqual(Notification.objects.count(), 1)
        self.assertEqual(NotificationOutbox.objects.count(), 1)
        outbox = NotificationOutbox.objects.first()
        self.assertEqual(outbox.category, "low_stock")
        self.assertEqual(outbox.payload.get("url"), "/inventory/items")

    def test_topic_preferences_gate_push_delivery(self):
        NotificationPreference.objects.create(
            user=self.user,
            push_enabled=True,
            low_stock=False,
            order=True,
            payment=True,
        )
        resp = self._post_notification(
            {
                "title": "Low stock alert",
                "message": "Item is below threshold",
                "type": "warning",
                "topic": "low_stock",
            }
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Notification.objects.count(), 1)
        self.assertEqual(NotificationOutbox.objects.count(), 0)

    def test_list_returns_payload_and_topic(self):
        NotificationPreference.objects.create(
            user=self.user,
            push_enabled=True,
            low_stock=True,
            order=True,
            payment=True,
        )
        self._post_notification(
            {
                "title": "Order ready",
                "message": "Order #123 is ready for pickup",
                "type": "success",
                "topic": "order",
                "payload": {"url": "/orders/123"},
            }
        )
        resp = self.client.get("/api/notifications/?limit=10", **auth_headers(self.user))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertEqual(len(data), 1)
        notif = data[0]
        self.assertEqual(notif["topic"], "order")
        self.assertEqual(notif["payload"].get("url"), "/orders/123")
        self.assertIsInstance(notif["meta"], dict)
