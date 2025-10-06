from django.db import migrations
import uuid


def seed_default_location(apps, schema_editor):
    Location = apps.get_model('api', 'Location')
    if not Location.objects.filter(code='MAIN').exists():
        Location.objects.create(id=uuid.uuid4(), code='MAIN', name='Main')


def unseed_default_location(apps, schema_editor):
    Location = apps.get_model('api', 'Location')
    # Keep it; no-op on reverse to avoid breaking data
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0019_batch_location_reordersetting_stockmovement_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_default_location, unseed_default_location),
    ]

