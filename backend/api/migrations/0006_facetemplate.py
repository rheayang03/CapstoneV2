from django.db import migrations, models
import django.db.models.deletion
import uuid
import api.models
import api.storage


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_resettoken"),
    ]

    operations = [
        migrations.CreateModel(
            name="FaceTemplate",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("ahash", models.CharField(max_length=16)),
                (
                    "reference",
                    models.FileField(
                        upload_to=api.models._facetpl_upload_path,
                        blank=True,
                        null=True,
                        storage=api.storage.PrivateMediaStorage(),
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="face_template",
                        to="api.appuser",
                    ),
                ),
            ],
            options={
                "db_table": "face_template",
            },
        ),
    ]

