from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0011_webpushsubscription"),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentTransaction",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("order_id", models.CharField(max_length=64)),
                ("amount", models.DecimalField(max_digits=12, decimal_places=2)),
                ("method", models.CharField(max_length=16, choices=[("cash", "Cash"), ("card", "Card"), ("mobile", "Mobile")])),
                ("status", models.CharField(max_length=16, choices=[("completed", "Completed"), ("pending", "Pending"), ("failed", "Failed"), ("refunded", "Refunded")], default="completed")),
                ("reference", models.CharField(max_length=128, blank=True)),
                ("customer", models.CharField(max_length=255, blank=True)),
                ("refunded_at", models.DateTimeField(blank=True, null=True)),
                ("refunded_by", models.CharField(max_length=255, blank=True)),
                ("meta", models.JSONField(default=dict, blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("processed_by", models.ForeignKey(null=True, blank=True, on_delete=models.deletion.SET_NULL, related_name="payments_processed", to="api.appuser")),
            ],
            options={
                "db_table": "payment_txn",
                "indexes": [
                    models.Index(fields=["order_id", "created_at"], name="pay_order_created_idx"),
                    models.Index(fields=["method", "created_at"], name="pay_method_created_idx"),
                    models.Index(fields=["status", "created_at"], name="pay_status_created_idx"),
                ],
            },
        ),
    ]

