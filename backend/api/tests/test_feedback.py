import json

from django.test import Client, TestCase
from django.conf import settings
from django.utils import timezone as dj_tz
import jwt

from api.models import AppUser, CustomerFeedback


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


class FeedbackApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff = AppUser.objects.create(email="staff@example.com", name="Staff", role="staff", status="active")
        self.manager = AppUser.objects.create(email="manager@example.com", name="Manager", role="manager", status="active")

    def test_staff_can_submit_feedback(self):
        payload = {
            "customerName": "Alice",
            "email": "alice@example.com",
            "rating": 5,
            "comment": "Great service!",
            "category": "service",
        }
        resp = self.client.post(
            "/api/feedback/",
            data=json.dumps(payload),
            content_type="application/json",
            **auth_headers(self.staff),
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body["success"])
        self.assertEqual(CustomerFeedback.objects.count(), 1)
        fb = CustomerFeedback.objects.first()
        self.assertEqual(fb.customer_name, "Alice")
        self.assertEqual(fb.submitted_by, self.staff)

    def test_manager_can_list_feedback(self):
        CustomerFeedback.objects.create(
            customer_name="Bob",
            email="bob@example.com",
            rating=4,
            comment="Good food",
            category="food",
            submitted_by=self.staff,
        )
        CustomerFeedback.objects.create(
            customer_name="Charlie",
            email="charlie@example.com",
            rating=2,
            comment="Slow service",
            category="service",
            submitted_by=self.staff,
        )
        resp = self.client.get("/api/feedback/?limit=10", **auth_headers(self.manager))
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertEqual(len(data), 2)

    def test_manager_can_resolve_feedback(self):
        fb = CustomerFeedback.objects.create(
            customer_name="Dana",
            rating=3,
            comment="Fine",
            submitted_by=self.staff,
        )
        url = f"/api/feedback/{fb.id}/resolve/"
        resp = self.client.post(url, data=json.dumps({"resolved": True}), content_type="application/json", **auth_headers(self.manager))
        self.assertEqual(resp.status_code, 200)
        fb.refresh_from_db()
        self.assertTrue(fb.resolved)
        self.assertEqual(fb.resolved_by, self.manager)

    def test_feedback_summary(self):
        CustomerFeedback.objects.create(
            customer_name="Eva",
            rating=5,
            comment="Excellent",
            submitted_by=self.staff,
            resolved=True,
            resolved_by=self.manager,
            resolved_at=dj_tz.now(),
        )
        CustomerFeedback.objects.create(
            customer_name="Finn",
            rating=2,
            comment="Needs improvement",
            submitted_by=self.staff,
        )
        resp = self.client.get("/api/feedback/summary/", **auth_headers(self.manager))
        self.assertEqual(resp.status_code, 200)
        summary = resp.json()["data"]
        self.assertEqual(summary["total"], 2)
        self.assertEqual(summary["resolved"], 1)
        self.assertEqual(summary["pending"], 1)
        self.assertAlmostEqual(summary["average"], 3.5, places=1)
