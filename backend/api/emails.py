from django.conf import settings
from django.core.mail import send_mail, mail_admins
from django.template.loader import render_to_string


def _safe_send(func, *args, **kwargs):
    try:
        func(*args, **kwargs)
    except Exception as e:
        # Log in debug to aid troubleshooting (e.g., SMTP misconfig)
        try:
            if getattr(settings, "DEBUG", False):
                print(f"[email] send failed: {e}")
        except Exception:
            pass


def notify_admins_verification_submitted(app_user, access_request=None):
    subject = f"New verification submitted: {app_user.email}"
    message = (
        f"A user has submitted verification.\n\n"
        f"Name: {app_user.name}\n"
        f"Email: {app_user.email}\n"
        f"Status: {app_user.status}\n"
        f"Role: {app_user.role}\n"
    )
    _safe_send(mail_admins, subject, message, fail_silently=True)


def email_user_verification_received(app_user):
    if not app_user.email:
        return
    subject = "Verification received"
    message = (
        "Hello,\n\n"
        "We received your identity verification submission. "
        "An administrator will review it shortly. You will be notified once approved or if we need more information.\n\n"
        "Thank you."
    )
    _safe_send(
        send_mail,
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [app_user.email],
        fail_silently=True,
    )


def email_user_approved(app_user):
    if not app_user.email:
        return
    subject = "Access approved"
    message = (
        f"Hello {app_user.name},\n\n"
        "Your account has been approved. You can now sign in and access the system.\n\n"
        "Thank you."
    )
    _safe_send(
        send_mail,
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [app_user.email],
        fail_silently=True,
    )


def email_user_rejected(app_user, note: str = ""):
    if not app_user.email:
        return
    subject = "Access request update"
    body_note = f"\n\nNote from reviewer:\n{note}" if note else ""
    message = (
        f"Hello {app_user.name},\n\n"
        "Your access request was not approved at this time." + body_note + "\n\n"
        "You may contact support for more information or resubmit if applicable."
    )
    _safe_send(
        send_mail,
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [app_user.email],
        fail_silently=True,
    )


def email_user_password_reset(email: str, reset_link: str, code: str | None = None, expires_minutes: int = 15):
    """Send a password reset email containing a one-time link and optional code."""
    if not email:
        return
    subject = "Reset your password"
    # Plain text fallback
    message = (
        "Hello,\n\n"
        "We received a request to reset your password. If you made this request, "
        "use the link below (or the 6-digit code) to choose a new password. "
        "If you did not request this, you can safely ignore this email.\n\n"
        f"Reset link: {reset_link}\n"
        f"This reset expires in approximately {expires_minutes} minutes.\n"
        + (f"Reset code: {code}\n" if code else "")
        + "If the link doesn't work on this device, open the app and choose 'I have a code'.\n"
    )
    # HTML body via template
    try:
        html = render_to_string(
            "email/password_reset.html",
            {
                "reset_link": reset_link,
                "expires_minutes": expires_minutes,
                "code": code,
                "brand": getattr(settings, "EMAIL_SUBJECT_PREFIX", ""),
            },
        )
    except Exception:
        html = None
    _safe_send(
        send_mail,
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True,
        html_message=html,
    )

def email_user_login_otp(app_user, code: str, expires_minutes: int = 5):
    """Send a login verification code via email."""

    email = getattr(app_user, "email", None)
    if not email:
        return

    display_name = (getattr(app_user, "name", "") or "").strip() or "there"
    subject = "Your login verification code"
    message = (
        f"Hello {display_name},\n\n"
        "Here is your 6-digit verification code to finish signing in.\n"
        f"Code: {code}\n"
        f"This code expires in approximately {expires_minutes} minutes.\n\n"
        "If you didn't try to sign in, you can ignore this email."
    )
    try:
        html = render_to_string(
            "email/login_otp.html",
            {
                "code": code,
                "expires_minutes": expires_minutes,
                "brand": getattr(settings, "EMAIL_SUBJECT_PREFIX", ""),
                "user": app_user,
            },
        )
    except Exception:
        html = None
    _safe_send(
        send_mail,
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True,
        html_message=html,
    )


def email_user_email_verification(email: str, verify_link: str):
    """Send an email address verification link."""
    if not email:
        return
    subject = "Verify your email address"
    message = (
        "Hello,\n\n"
        "Please verify your email address by clicking the link below:\n\n"
        f"Verify link: {verify_link}\n\n"
        "If you did not create an account, you can ignore this email."
    )
    try:
        html = render_to_string(
            "email/verify_email.html",
            {
                "verify_link": verify_link,
                "brand": getattr(settings, "EMAIL_SUBJECT_PREFIX", ""),
            },
        )
    except Exception:
        html = None
    _safe_send(
        send_mail,
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True,
        html_message=html,
    )
