import os
from pathlib import Path
from .settings_components import get_database, get_cors, get_jwt, get_email
try:
    from dotenv import load_dotenv  # type: ignore
except Exception:
    load_dotenv = None

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from backend directory if python-dotenv is available
if load_dotenv:
    try:
        load_dotenv(BASE_DIR / ".env")
    except Exception:
        pass

# Core settings
DEBUG = os.getenv("DJANGO_DEBUG", "1") in {"1", "true", "True"}
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-insecure-secret-key")
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")

# Minimal apps to avoid DB usage
INSTALLED_APPS = [
    # Django core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    # Third-party
    "corsheaders",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",

    # Local apps
    "api",
    "accounts",
]

# Keep middleware lightweight; omit session/auth/csrf
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "api.middleware.SecurityHeadersMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "api.middleware.RequestIdMiddleware",
    # Gate API routes for pending/unauthorized users (JWT-aware)
    "api.middleware.PendingUserGateMiddleware",
    "api.middleware.VersionHeaderMiddleware",
    "api.middleware.ResponseTimingMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.template.context_processors.i18n",
                "django.template.context_processors.media",
                "django.template.context_processors.static",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"

# Database configuration (SQLite by default; supports MySQL/Postgres via env)
DATABASES = get_database(BASE_DIR)

# Static files (optional for API-only)
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
SITE_ID = 1

TIME_ZONE = "UTC"
USE_TZ = True

# CORS
CORS_ALLOWED_ORIGINS, CORS_ALLOW_HEADERS = get_cors()

# Django defaults
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# Disable in-memory fallbacks for API responses outside development, unless explicitly allowed
DISABLE_INMEM_FALLBACK = (
    os.getenv("DJANGO_DISABLE_INMEM_FALLBACK", "0") in {"1", "true", "True", "yes", "on"}
    or not DEBUG
)

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# JWT settings
_jwt = get_jwt()
JWT_SECRET = _jwt["JWT_SECRET"]
JWT_ALGORITHM = _jwt["JWT_ALGORITHM"]
JWT_EXP_SECONDS = _jwt["JWT_EXP_SECONDS"]
JWT_REMEMBER_EXP_SECONDS = _jwt["JWT_REMEMBER_EXP_SECONDS"]
JWT_REFRESH_EXP_SECONDS = _jwt["JWT_REFRESH_EXP_SECONDS"]
JWT_REFRESH_REMEMBER_EXP_SECONDS = _jwt["JWT_REFRESH_REMEMBER_EXP_SECONDS"]

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()

# Media (public) and Private Media (not served directly)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Private media directory for sensitive uploads (e.g., identity headshots)
# Not served by Django; use authenticated views or presigned URLs.
PRIVATE_MEDIA_ROOT = os.getenv("DJANGO_PRIVATE_MEDIA_ROOT") or str(BASE_DIR / "private_media")
try:
    os.makedirs(PRIVATE_MEDIA_ROOT, exist_ok=True)
except Exception:
    # If the path is invalid or we lack permissions, ignore here; file saves will attempt to create directories as needed
    pass

# Django Allauth config
AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
)

ACCOUNT_EMAIL_VERIFICATION = "mandatory"
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]

SOCIALACCOUNT_AUTO_SIGNUP = True  # creation allowed, but we gate access until approved
SOCIALACCOUNT_ADAPTER = "accounts.adapters.SocialAdapter"
LOGIN_REDIRECT_URL = "/account/verify/"
LOGOUT_REDIRECT_URL = "/"

SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": ["openid", "email", "profile"],
        "AUTH_PARAMS": {"prompt": "select_account"},
        "VERIFIED_EMAILS_ONLY": True,
    }
}

# Email configuration
_email = get_email()
EMAIL_BACKEND = _email["EMAIL_BACKEND"]
DEFAULT_FROM_EMAIL = _email["DEFAULT_FROM_EMAIL"]
SERVER_EMAIL = _email["SERVER_EMAIL"]
EMAIL_HOST = _email["EMAIL_HOST"]
EMAIL_PORT = _email["EMAIL_PORT"]
EMAIL_HOST_USER = _email["EMAIL_HOST_USER"]
EMAIL_HOST_PASSWORD = _email["EMAIL_HOST_PASSWORD"]
EMAIL_USE_TLS = _email["EMAIL_USE_TLS"]
EMAIL_USE_SSL = _email["EMAIL_USE_SSL"]
ADMINS = _email["ADMINS"]
EMAIL_SUBJECT_PREFIX = _email["EMAIL_SUBJECT_PREFIX"]

# Frontend base URL for building links in emails (password reset, verification)
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:8080")

# --- Web Push / VAPID ---
WEBPUSH_VAPID_PUBLIC_KEY = os.getenv("WEBPUSH_VAPID_PUBLIC_KEY", "").strip()
WEBPUSH_VAPID_PRIVATE_KEY = os.getenv("WEBPUSH_VAPID_PRIVATE_KEY", "").strip()
WEBPUSH_VAPID_SUBJECT = os.getenv("WEBPUSH_VAPID_SUBJECT", "mailto:josephformentera2@gmail.com")

# Optional: simple guard to fail early if you forget the keys in prod
if not DEBUG:
    assert WEBPUSH_VAPID_PUBLIC_KEY and WEBPUSH_VAPID_PRIVATE_KEY, "Missing VAPID keys"

# API version
API_VERSION = os.getenv("API_VERSION", "1")

# Security hardening flags (sane defaults, can be tuned via env)
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0" if DEBUG else "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "1") in {"1","true","True","yes","on"}
SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "1") in {"1","true","True","yes","on"}
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "0" if DEBUG else "1") in {"1","true","True","yes","on"}
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "0" if DEBUG else "1") in {"1","true","True","yes","on"}
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "0" if DEBUG else "1") in {"1","true","True","yes","on"}
CSRF_TRUSTED_ORIGINS = [o for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if o]
