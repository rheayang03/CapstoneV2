from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_refreshtoken"),
    ]

    operations = [
        migrations.AddField(
            model_name="appuser",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
    ]

