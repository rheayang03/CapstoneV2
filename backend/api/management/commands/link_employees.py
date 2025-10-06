from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Link Employee.user to AppUser by matching Employee.contact to AppUser.email (case-insensitive). Optionally fallback to exact name match."

    def add_arguments(self, parser):
        parser.add_argument(
            "--by-name",
            action="store_true",
            help="Also attempt to link by exact name match when contact/email does not match.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Do not write changes, just print what would be done.",
        )

    def handle(self, *args, **options):
        by_name = bool(options.get("by_name"))
        dry_run = bool(options.get("dry_run"))

        from api.models import Employee, AppUser
        total = 0
        linked = 0
        skipped_has_user = 0
        missing_match = 0

        with transaction.atomic():
            for emp in Employee.objects.all().select_related("user"):
                total += 1
                if emp.user_id:
                    skipped_has_user += 1
                    continue
                cand = None
                contact = (emp.contact or "").strip().lower()
                if contact:
                    cand = AppUser.objects.filter(email__iexact=contact).first()
                if not cand and by_name:
                    name = (emp.name or "").strip()
                    if name:
                        cand = AppUser.objects.filter(name__iexact=name).first()
                if cand:
                    linked += 1
                    msg = f"Link: Employee[{emp.id} {emp.name}] -> AppUser[{cand.id} {cand.email}]"
                    self.stdout.write(msg)
                    if not dry_run:
                        emp.user = cand
                        emp.save(update_fields=["user"])
                else:
                    missing_match += 1
                    self.stdout.write(f"No match for Employee[{emp.id} {emp.name}] (contact='{emp.contact}')")

            if dry_run:
                self.stdout.write(self.style.WARNING("Dry-run: no changes were written."))

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. total={total} linked={linked} already_linked={skipped_has_user} no_match={missing_match}"
            )
        )

