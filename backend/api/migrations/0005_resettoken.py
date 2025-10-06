from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_appuser_phone"),
    ]

    operations = [
        migrations.CreateModel(
            name="ResetToken",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("token_hash", models.CharField(max_length=128, unique=True)),
                ("code_hash", models.CharField(max_length=128, blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("ip_address", models.CharField(max_length=64, blank=True)),
                ("user_agent", models.CharField(max_length=256, blank=True)),
                ("attempts", models.PositiveIntegerField(default=0)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reset_tokens",
                        to="api.appuser",
                    ),
                ),
            ],
            options={"db_table": "reset_token"},
        ),
        migrations.AddIndex(
            model_name="resettoken",
            index=models.Index(fields=["user", "expires_at"], name="api_reset__user_id_1d6aee_idx"),
        ),
    ]

