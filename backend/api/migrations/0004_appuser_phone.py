from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_appuser_email_verified"),
    ]

    operations = [
        migrations.AddField(
            model_name="appuser",
            name="phone",
            field=models.CharField(max_length=32, blank=True),
        ),
    ]

