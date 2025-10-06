from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os


class PrivateMediaStorage(FileSystemStorage):
    """File storage for private media.

    - Files are stored under settings.PRIVATE_MEDIA_ROOT
    - No base_url is set, so Django won't generate direct URLs.
    Serve via authenticated views or presigned URLs only.
    """

    def __init__(self, *args, **kwargs):
        location = getattr(settings, "PRIVATE_MEDIA_ROOT", None)
        if not location:
            # Fallback to a 'private_media' under BASE_DIR if not configured
            base = getattr(settings, "BASE_DIR", ".")
            location = os.path.join(str(base), "private_media")
        os.makedirs(location, exist_ok=True)
        super().__init__(location=location, base_url=None)

