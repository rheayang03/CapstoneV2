from django.urls import include, path
from django.contrib import admin
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Redirect the root path to a simple health endpoint to avoid 404s
    path("", RedirectView.as_view(url="/api/health/", permanent=False), name="root"),
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("accounts/", include("allauth.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
