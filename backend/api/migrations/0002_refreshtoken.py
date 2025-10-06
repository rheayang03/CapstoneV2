from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RefreshToken",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("token_hash", models.CharField(max_length=128, unique=True)),
                ("remember", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                (
                    "rotated_from",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.SET_NULL,
                        blank=True,
                        null=True,
                        related_name="rotated_to",
                        to="api.refreshtoken",
                    ),
                ),
                ("user_agent", models.CharField(max_length=256, blank=True)),
                ("ip_address", models.CharField(max_length=64, blank=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="refresh_tokens",
                        to="api.appuser",
                    ),
                ),
            ],
            options={
                "db_table": "refresh_token",
            },
        ),
        migrations.AddIndex(
            model_name="refreshtoken",
            index=models.Index(fields=["user", "expires_at"], name="api_refres_user_id_4a3cb5_idx"),
        ),
    ]

