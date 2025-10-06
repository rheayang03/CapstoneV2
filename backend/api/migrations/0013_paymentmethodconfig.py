from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0012_paymenttransaction"),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentMethodConfig",
            fields=[
                ("id", models.SmallIntegerField(primary_key=True, default=1, editable=False, serialize=False)),
                ("cash_enabled", models.BooleanField(default=True)),
                ("card_enabled", models.BooleanField(default=True)),
                ("mobile_enabled", models.BooleanField(default=True)),
                ("updated_by", models.CharField(max_length=255, blank=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "payment_method_config",
            },
        ),
    ]

