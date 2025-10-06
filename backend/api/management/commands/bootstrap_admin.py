from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone


class Command(BaseCommand):
    help = "Create or update a default admin user in the AppUser table."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Admin email")
        parser.add_argument("--password", required=True, help="Admin password")
        parser.add_argument("--name", default="Admin", help="Admin name")
        parser.add_argument("--role", default="admin", help="Role (default: admin)")

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        password = options["password"]
        name = options["name"].strip()
        role = options["role"].lower().strip() or "admin"
        perms = ["all"] if role == "admin" else []

        from api.models import AppUser

        user, created = AppUser.objects.get_or_create(
            email=email,
            defaults={
                "name": name,
                "role": role,
                "status": "active",
                "permissions": perms,
                "password_hash": make_password(password),
                "last_login": timezone.now(),
            },
        )

        if not created:
            user.name = name or user.name
            user.role = role
            user.permissions = perms
            user.password_hash = make_password(password)
            user.status = "active"
            user.last_login = timezone.now()
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Updated admin user: {email}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Created admin user: {email}"))
