from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from django.http import HttpResponse
from django.utils import timezone


class SocialAdapter(DefaultSocialAccountAdapter):
    """Custom adapter to ensure users created via social login are pending and least-privileged.

    - Creates or syncs an api.AppUser record per email
    - Ensures AccessRequest exists and is pending until admin approval
    - Avoids assigning any Django groups/permissions automatically
    """

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form=form)
        # Ensure email and name are populated from social data
        extra = sociallogin.account.extra_data or {}
        name = extra.get("name") or user.get_full_name() or user.get_username() or user.email
        picture = extra.get("picture")

        # Create or update domain user profile
        from api.models import AppUser, AccessRequest

        app_user = AppUser.objects.filter(email=user.email.lower()).first()
        if not app_user:
            app_user = AppUser.objects.create(
                email=user.email.lower(),
                name=name or "User",
                role="staff",  # default label; actual access is gated by status
                status="pending",  # key: pending until admin approves
                permissions=[],
                avatar=picture or "",
            )
        else:
            # Keep name/avatar fresh; set to pending if not approved
            if app_user.status != "active":
                app_user.status = "pending"
            if name:
                app_user.name = name
            if picture and not app_user.avatar:
                app_user.avatar = picture
            app_user.save()

        # Ensure there's an AccessRequest linked
        ar, _ = AccessRequest.objects.get_or_create(user=app_user)
        if ar.status == AccessRequest.STATUS_REJECTED:
            # If previously rejected, set back to pending upon new login intent
            ar.status = AccessRequest.STATUS_PENDING
            ar.save(update_fields=["status"]) 

        return user

    def is_open_for_signup(self, request, sociallogin):
        # Allow signup, but access is gated post-login via status/middleware
        return True

    def get_connect_redirect_url(self, request, socialaccount):
        return "/account/verify/"

