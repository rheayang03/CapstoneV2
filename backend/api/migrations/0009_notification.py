from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0008_auditlog"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("message", models.TextField(blank=True)),
                ("type", models.CharField(max_length=16, choices=[("info", "Info"), ("warning", "Warning"), ("success", "Success"), ("error", "Error")], default="info")),
                ("read", models.BooleanField(default=False)),
                ("meta", models.JSONField(default=dict, blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="notifications", to="api.appuser")),
            ],
            options={
                "db_table": "notification",
                "indexes": [
                    models.Index(fields=["user", "read", "created_at"], name="notif_user_read_created_idx"),
                    models.Index(fields=["type", "created_at"], name="notif_type_created_idx"),
                ],
            },
        ),
    ]

