import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Restore database from a backup file. Supports SQLite only (file copy)."

    def add_arguments(self, parser):
        parser.add_argument('path', type=str, help='Path to backup file')

    def handle(self, *args, **options):
        db = settings.DATABASES.get('default', {})
        engine = db.get('ENGINE', '')
        src = Path(options['path'])
        if not src.exists():
            self.stderr.write(self.style.ERROR(f'Backup not found: {src}'))
            return
        if engine.endswith('sqlite3'):
            dest = Path(db.get('NAME'))
            dest.parent.mkdir(exist_ok=True)
            shutil.copy2(src, dest)
            self.stdout.write(self.style.SUCCESS(f'Restored SQLite DB to {dest}'))
        else:
            self.stdout.write(self.style.WARNING('Only SQLite restore is automated. For MySQL, use mysql client to import .sql dumps.'))

