from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage


class Command(BaseCommand):
    help = "Verify that media files referenced by MenuItem.image exist; optionally clear missing references."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fix",
            action="store_true",
            help="Clear image field for items whose files are missing",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="If > 0, only process this many items for quick checks",
        )

    def handle(self, *args, **options):
        from api.models import MenuItem

        qs = MenuItem.objects.all()
        total = qs.count()
        with_img_qs = qs.exclude(image="").exclude(image__isnull=True)
        with_img = with_img_qs.count()

        missing = []
        processed = 0
        for item in with_img_qs.iterator():
            name = getattr(item.image, "name", None)
            if not name:
                continue
            if not default_storage.exists(name):
                missing.append((item, name))
                if options.get("fix"):
                    # Remove broken reference
                    item.image.delete(save=False)
                    item.image = None
                    try:
                        item.save(update_fields=["image", "updated_at"])  # type: ignore[arg-type]
                    except Exception:
                        item.save(update_fields=["image"])  # fallback if updated_at not present
            processed += 1
            if options.get("limit") and processed >= options["limit"]:
                break

        self.stdout.write(self.style.SUCCESS(
            f"Menu items: total={total}, with_images={with_img}, checked={processed}, missing={len(missing)}"
        ))
        if missing:
            self.stdout.write("Missing files (first 20):")
            for item, path in missing[:20]:
                self.stdout.write(f" - {item.id} | {item.name} | {path}")

        if options.get("fix"):
            self.stdout.write(self.style.WARNING("Applied fixes for missing image references."))

