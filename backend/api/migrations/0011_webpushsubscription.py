from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0010_notificationpreference"),
    ]

    operations = [
        migrations.CreateModel(
            name="WebPushSubscription",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("endpoint", models.URLField(unique=True)),
                ("p256dh", models.CharField(max_length=255)),
                ("auth", models.CharField(max_length=255)),
                ("expiration_time", models.DateTimeField(blank=True, null=True)),
                ("user_agent", models.CharField(max_length=256, blank=True)),
                ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="push_subscriptions", to="api.appuser")),
            ],
            options={
                "db_table": "webpush_subscription",
                "indexes": [
                    models.Index(fields=["user", "active"], name="webpush_user_active_idx"),
                ],
            },
        ),
    ]

