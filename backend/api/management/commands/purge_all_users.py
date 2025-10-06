from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


class Command(BaseCommand):
    help = "Delete ALL domain users and related records (AppUser, AccessRequest, RefreshToken, ResetToken). Irreversible."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Do not prompt for confirmation",
        )

    def handle(self, *args, **options):
        force = options.get("force")
        if not force:
            confirm = input(
                "This will delete ALL AppUser, AccessRequest, RefreshToken, and ResetToken records. Type 'DELETE' to proceed: "
            ).strip()
            if confirm != "DELETE":
                self.stdout.write(self.style.WARNING("Aborted."))
                return

        from api.models import AppUser, AccessRequest

        # Optional models (created in later migrations)
        try:
            from api.models import RefreshToken  # type: ignore
        except Exception:
            RefreshToken = None  # type: ignore
        try:
            from api.models import ResetToken  # type: ignore
        except Exception:
            ResetToken = None  # type: ignore

        with transaction.atomic():
            counts = {}
            if ResetToken is not None:
                counts["ResetToken"] = ResetToken.objects.count()
                ResetToken.objects.all().delete()
            if RefreshToken is not None:
                counts["RefreshToken"] = RefreshToken.objects.count()
                RefreshToken.objects.all().delete()
            counts["AccessRequest"] = AccessRequest.objects.count()
            AccessRequest.objects.all().delete()
            counts["AppUser"] = AppUser.objects.count()
            AppUser.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("Purge complete."))
        for model, n in counts.items():
            self.stdout.write(f"Deleted {n} {model} record(s)")

