from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0009_notification"),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationPreference",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("email_enabled", models.BooleanField(default=True)),
                ("push_enabled", models.BooleanField(default=False)),
                ("low_stock", models.BooleanField(default=True)),
                ("order", models.BooleanField(default=True)),
                ("payment", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="notification_pref", to="api.appuser")),
            ],
            options={
                "db_table": "notification_preference",
                "indexes": [
                    models.Index(fields=["user"], name="notif_pref_user_idx"),
                ],
            },
        ),
    ]

