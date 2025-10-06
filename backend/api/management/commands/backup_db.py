import os
import shutil
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Create a simple database backup. Supports SQLite fully; prints guidance for MySQL."

    def handle(self, *args, **options):
        db = settings.DATABASES.get('default', {})
        engine = db.get('ENGINE', '')
        base_dir = Path(settings.BASE_DIR)
        backups = base_dir / 'backups'
        backups.mkdir(exist_ok=True)
        ts = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
        if engine.endswith('sqlite3'):
            src = Path(db.get('NAME'))
            if not src.exists():
                self.stderr.write(self.style.ERROR(f'SQLite DB not found at {src}'))
                return
            dest = backups / f'db-{ts}.sqlite3'
            shutil.copy2(src, dest)
            self.stdout.write(self.style.SUCCESS(f'Backup created: {dest}'))
        elif 'mysql' in engine:
            name = db.get('NAME'); user = db.get('USER'); host = db.get('HOST'); port = db.get('PORT');
            out = backups / f'{name}-{ts}.sql'
            self.stdout.write(self.style.WARNING('MySQL backup requires mysqldump available on PATH.'))
            self.stdout.write(self.style.WARNING(f'Run: mysqldump -h {host} -P {port} -u {user} -p {name} > {out}'))
        else:
            self.stdout.write(self.style.WARNING('Unsupported engine for automated backups.'))

