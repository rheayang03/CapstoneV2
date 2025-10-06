import os
from uuid import uuid4
from decimal import Decimal
from django.db import models
from django.utils import timezone

try:
    from .storage import PrivateMediaStorage
except Exception:  # fallback if storage cannot be imported during migrations
    PrivateMediaStorage = None


class AppUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=32, default="staff")
    status = models.CharField(max_length=32, default="active")
    permissions = models.JSONField(default=list, blank=True)
    password_hash = models.CharField(max_length=128, blank=True)
    avatar = models.URLField(blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "app_user"

    def __str__(self) -> str:
        return f"{self.email} ({self.role})"


def _headshot_upload_path(instance, filename):
    # Store under a per-user folder with a random filename; keep extension if present
    base, ext = os.path.splitext(filename or "")
    ext = ext if ext else ".bin"
    return f"access_requests/{instance.user_id}/{uuid4().hex}{ext}"


class AccessRequest(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    # One request per user account (update in place on resubmission)
    user = models.OneToOneField(
        AppUser,
        on_delete=models.CASCADE,
        related_name="access_request",
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)

    # Evidence
    headshot = models.FileField(
        upload_to=_headshot_upload_path,
        blank=True,
        null=True,
        storage=PrivateMediaStorage() if PrivateMediaStorage else None,
    )
    consent_at = models.DateTimeField(blank=True, null=True)
    code = models.CharField(max_length=32, blank=True, null=True)
    extra = models.JSONField(default=dict, blank=True)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    verified_by = models.CharField(max_length=255, blank=True, null=True, help_text="Verifier identifier (e.g., email)")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "access_request"

    def mark_consented(self):
        self.consent_at = timezone.now()
        self.save(update_fields=["consent_at"]) 

    def approve(self, verifier_identifier: str = ""):
        self.status = self.STATUS_APPROVED
        self.verified_at = timezone.now()
        self.verified_by = verifier_identifier or self.verified_by
        self.save(update_fields=["status", "verified_at", "verified_by"]) 

    def reject(self, verifier_identifier: str = "", note: str = ""):
        self.status = self.STATUS_REJECTED
        self.verified_at = timezone.now()
        self.verified_by = verifier_identifier or self.verified_by
        if note:
            self.notes = (self.notes or "") + ("\n" if self.notes else "") + note
        self.save(update_fields=["status", "verified_at", "verified_by", "notes"]) 


class RefreshToken(models.Model):
    """Persistent refresh token with rotation and revocation support.

    The raw token is only shown to the client once and its SHA256 is stored.
    """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="refresh_tokens")
    token_hash = models.CharField(max_length=128, unique=True)
    remember = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(blank=True, null=True)
    rotated_from = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="rotated_to"
    )
    user_agent = models.CharField(max_length=256, blank=True)
    ip_address = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = "refresh_token"
        indexes = [
            models.Index(fields=["user", "expires_at"]),
        ]

    @property
    def is_active(self) -> bool:
        if self.revoked_at:
            return False
        return timezone.now() < self.expires_at


class ResetToken(models.Model):
    """One-time password reset token with optional 6-digit code fallback."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="reset_tokens")
    token_hash = models.CharField(max_length=128, unique=True)
    code_hash = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    revoked_at = models.DateTimeField(blank=True, null=True)
    ip_address = models.CharField(max_length=64, blank=True)
    user_agent = models.CharField(max_length=256, blank=True)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "reset_token"
        indexes = [
            models.Index(fields=["user", "expires_at"]),
        ]

    @property
    def is_active(self) -> bool:
        if self.revoked_at or self.used_at:
            return False
        return timezone.now() < self.expires_at


class PasswordResetCode(models.Model):
    """Short‑lived OTP for password reset verification.

    Stores only a SHA256 hash of the 6‑digit code. Single‑use with
    attempt tracking and strict expiry.
    """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="password_reset_codes")
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset_code"
        indexes = [
            models.Index(fields=["user", "expires_at", "used"]),
        ]

    @property
    def is_active(self) -> bool:
        if self.used:
            return False
        return timezone.now() < self.expires_at


class LoginOTP(models.Model):
    """One-time login verification code delivered via email."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="login_otps")
    code_hash = models.CharField(max_length=128)
    remember = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(blank=True, null=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    ip_address = models.CharField(max_length=64, blank=True)
    user_agent = models.CharField(max_length=256, blank=True)

    class Meta:
        db_table = "login_otp"
        indexes = [
            models.Index(fields=["user", "expires_at", "consumed_at"]),
        ]

    @property
    def is_active(self) -> bool:
        if self.consumed_at:
            return False
        return timezone.now() < self.expires_at


def _facetpl_upload_path(instance, filename):
    base, ext = os.path.splitext(filename or "")
    ext = ext if ext else ".jpg"
    return f"face_templates/{instance.user_id}/{uuid4().hex}{ext}"


class FaceTemplate(models.Model):
    """Simple face template using perceptual/average hash of a reference image.

    Note: This is a lightweight demonstration and not a substitute for
    production-grade biometric matching. Hash collisions and false positives
    are possible; tune thresholds accordingly.
    """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.OneToOneField(AppUser, on_delete=models.CASCADE, related_name="face_template")
    ahash = models.CharField(max_length=16)  # 64-bit average hash as 16-hex
    reference = models.FileField(
        upload_to=_facetpl_upload_path,
        blank=True,
        null=True,
        storage=PrivateMediaStorage() if PrivateMediaStorage else None,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "face_template"


# -----------------------------
# Employees & Scheduling
# -----------------------------


class Employee(models.Model):
    """Employee directory entry for scheduling and staffing.

    This model is intentionally separate from AppUser to allow
    non-login employees to exist. It can be linked to an AppUser
    by email in the future if needed.
    """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    # Optional link to an AppUser for confidentiality-aware features
    user = models.OneToOneField(
        AppUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employee_profile",
    )
    name = models.CharField(max_length=255)
    position = models.CharField(max_length=128, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contact = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=32, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "employee"
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.position})"


class ScheduleEntry(models.Model):
    """Simple weekly schedule entry for an employee.

    Uses a day-of-week string (e.g., 'Monday') and start/end times.
    """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="schedules")
    day = models.CharField(max_length=16)  # Sunday..Saturday
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "schedule_entry"
        indexes = [
            models.Index(fields=["employee", "day"]),
        ]

# -----------------------------
# Analytics snapshots & events
# -----------------------------


class AnalyticsSnapshot(models.Model):
    CATEGORY_SALES = "sales"
    CATEGORY_INVENTORY = "inventory"
    CATEGORY_ORDERS = "orders"
    CATEGORY_ATTENDANCE = "attendance"
    CATEGORY_CUSTOMERS = "customers"
    CATEGORY_CHOICES = [
        (CATEGORY_SALES, "Sales"),
        (CATEGORY_INVENTORY, "Inventory"),
        (CATEGORY_ORDERS, "Orders"),
        (CATEGORY_ATTENDANCE, "Attendance"),
        (CATEGORY_CUSTOMERS, "Customers"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    label = models.CharField(max_length=128, blank=True)
    range_start = models.DateTimeField(blank=True, null=True)
    range_end = models.DateTimeField(blank=True, null=True)
    data = models.JSONField(default=dict, blank=True)
    generated_by = models.ForeignKey(
        AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="analytics_snapshots"
    )
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "analytics_snapshot"
        indexes = [
            models.Index(fields=["category", "range_start", "range_end"]),
            models.Index(fields=["created_at"]),
        ]
        unique_together = ("category", "range_start", "range_end")

    def __str__(self) -> str:
        label = self.label or self.category
        if self.range_start and self.range_end:
            return f"{label} ({self.range_start} - {self.range_end})"
        return label


class AnalyticsEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    category = models.CharField(max_length=64)
    action = models.CharField(max_length=128)
    actor = models.ForeignKey(
        AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="analytics_events"
    )
    payload = models.JSONField(default=dict, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analytics_event"
        indexes = [
            models.Index(fields=["category", "occurred_at"]),
            models.Index(fields=["action", "occurred_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.category}:{self.action} @ {self.occurred_at}"




# -----------------------------
# Activity / Audit Logging
# -----------------------------


class AuditLog(models.Model):
    TYPE_LOGIN = "login"
    TYPE_ACTION = "action"
    TYPE_SYSTEM = "system"
    TYPE_SECURITY = "security"
    TYPE_CHOICES = [
        (TYPE_LOGIN, "Login"),
        (TYPE_ACTION, "Action"),
        (TYPE_SYSTEM, "System"),
        (TYPE_SECURITY, "Security"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True)
    actor_email = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default=TYPE_ACTION)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    severity = models.CharField(max_length=16, blank=True)  # e.g., info, warning, critical
    ip_address = models.CharField(max_length=64, blank=True)
    user_agent = models.CharField(max_length=256, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_log"
        indexes = [
            models.Index(fields=["type", "created_at"]),
            models.Index(fields=["actor_email", "created_at"]),
        ]


# -----------------------------
# Notifications
# -----------------------------


class Notification(models.Model):
    TYPE_INFO = "info"
    TYPE_WARNING = "warning"
    TYPE_SUCCESS = "success"
    TYPE_ERROR = "error"
    TYPE_CHOICES = [
        (TYPE_INFO, "Info"),
        (TYPE_WARNING, "Warning"),
        (TYPE_SUCCESS, "Success"),
        (TYPE_ERROR, "Error"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default=TYPE_INFO)
    read = models.BooleanField(default=False)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification"
        indexes = [
            models.Index(fields=["user", "read", "created_at"]),
            models.Index(fields=["type", "created_at"]),
        ]


class NotificationPreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.OneToOneField(AppUser, on_delete=models.CASCADE, related_name="notification_pref")
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=False)
    low_stock = models.BooleanField(default=True)
    order = models.BooleanField(default=True)
    payment = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_preference"
        indexes = [
            models.Index(fields=["user"]),
        ]


class WebPushSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.URLField(unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    expiration_time = models.DateTimeField(blank=True, null=True)
    user_agent = models.CharField(max_length=256, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "webpush_subscription"
        indexes = [
            models.Index(fields=["user", "active"]),
        ]


class NotificationOutbox(models.Model):
    STATUS_PENDING = "pending"
    STATUS_SENT = "sent"
    STATUS_FAILED = "failed"
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="notif_outbox")
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=16, default=STATUS_PENDING)
    attempts = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_outbox"
        indexes = [
            models.Index(fields=["status", "created_at"]),
        ]


# -----------------------------
# Payments
# -----------------------------


class PaymentTransaction(models.Model):
    METHOD_CASH = "cash"
    METHOD_CARD = "card"
    METHOD_MOBILE = "mobile"
    METHOD_CHOICES = [
        (METHOD_CASH, "Cash"),
        (METHOD_CARD, "Card"),
        (METHOD_MOBILE, "Mobile"),
    ]

    STATUS_COMPLETED = "completed"
    STATUS_PENDING = "pending"
    STATUS_FAILED = "failed"
    STATUS_REFUNDED = "refunded"
    STATUS_CHOICES = [
        (STATUS_COMPLETED, "Completed"),
        (STATUS_PENDING, "Pending"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    order_id = models.CharField(max_length=64)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=16, choices=METHOD_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_COMPLETED)
    reference = models.CharField(max_length=128, blank=True)
    customer = models.CharField(max_length=255, blank=True)
    processed_by = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments_processed")
    refunded_at = models.DateTimeField(blank=True, null=True)
    refunded_by = models.CharField(max_length=255, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payment_txn"
        indexes = [
            models.Index(fields=["order_id", "created_at"]),
            models.Index(fields=["method", "created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]


class PaymentMethodConfig(models.Model):
    id = models.SmallIntegerField(primary_key=True, default=1, editable=False)
    cash_enabled = models.BooleanField(default=True)
    card_enabled = models.BooleanField(default=True)
    mobile_enabled = models.BooleanField(default=True)
    updated_by = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payment_method_config"


# -----------------------------
# Attendance & Leave
# -----------------------------


class AttendanceRecord(models.Model):
    STATUS_PRESENT = "present"
    STATUS_ABSENT = "absent"
    STATUS_LATE = "late"
    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
        (STATUS_ABSENT, "Absent"),
        (STATUS_LATE, "Late"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    employee = models.ForeignKey("Employee", on_delete=models.CASCADE, related_name="attendance_records")
    date = models.DateField()
    check_in = models.TimeField(blank=True, null=True)
    check_out = models.TimeField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PRESENT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "attendance_record"
        unique_together = ("employee", "date")
        indexes = [
            models.Index(fields=["employee", "date"]),
            models.Index(fields=["date"]),
        ]


class LeaveRecord(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    TYPE_SICK = "sick"
    TYPE_VACATION = "vacation"
    TYPE_OTHER = "other"
    TYPE_CHOICES = [
        (TYPE_SICK, "Sick"),
        (TYPE_VACATION, "Vacation"),
        (TYPE_OTHER, "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    employee = models.ForeignKey("Employee", on_delete=models.CASCADE, related_name="leave_records")
    start_date = models.DateField()
    end_date = models.DateField()
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default=TYPE_OTHER)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    reason = models.TextField(blank=True)
    decided_by = models.CharField(max_length=255, blank=True)
    decided_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "leave_record"
        indexes = [
            models.Index(fields=["employee", "start_date", "end_date"]),
            models.Index(fields=["status"]),
        ]


# -----------------------------
# Inventory
# -----------------------------


class InventoryItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=128, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=32, blank=True)
    min_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    supplier = models.CharField(max_length=255, blank=True)
    last_restocked = models.DateTimeField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inventory_item"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["category"]),
            models.Index(fields=["quantity"]),
            models.Index(fields=["min_stock"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.quantity} {self.unit})"


class InventoryActivity(models.Model):
    ACTION_RESTOCK = "restock"
    ACTION_USAGE = "usage"
    ACTION_ADJUST = "adjust"
    ACTION_SET = "set"
    ACTION_EXPIRY_CHECK = "expiry_check"
    ACTION_UPDATE = "update"
    ACTION_CHOICES = [
        (ACTION_RESTOCK, "Restock"),
        (ACTION_USAGE, "Usage"),
        (ACTION_ADJUST, "Adjust"),
        (ACTION_SET, "Set"),
        (ACTION_EXPIRY_CHECK, "Expiry Check"),
        (ACTION_UPDATE, "Update"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="activities")
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    quantity_change = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    previous_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    new_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reason = models.CharField(max_length=255, blank=True)
    performed_by = models.CharField(max_length=255, blank=True)
    actor = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inventory_activity"
        indexes = [
            models.Index(fields=["item", "created_at"]),
            models.Index(fields=["action", "created_at"]),
        ]


class Location(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=32, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inv_location"
        indexes = [
            models.Index(fields=["code"]),
        ]

    def __str__(self) -> str:
        return f"{self.code}: {self.name}"


class Batch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="batches")
    lot_code = models.CharField(max_length=64, blank=True)
    expiry_date = models.DateField(blank=True, null=True)
    received_at = models.DateTimeField(blank=True, null=True)
    supplier = models.CharField(max_length=255, blank=True)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inv_batch"
        indexes = [
            models.Index(fields=["item", "expiry_date"]),
            models.Index(fields=["lot_code"]),
        ]


class StockMovement(models.Model):
    TYPE_RECEIPT = "RECEIPT"
    TYPE_SALE = "SALE"
    TYPE_ADJUSTMENT = "ADJUSTMENT"
    TYPE_WASTE = "WASTE"
    TYPE_TRANSFER_IN = "TRANSFER_IN"
    TYPE_TRANSFER_OUT = "TRANSFER_OUT"
    TYPE_RETURN = "RETURN"
    TYPE_CHOICES = [
        (TYPE_RECEIPT, "Receipt"),
        (TYPE_SALE, "Sale/Consumption"),
        (TYPE_ADJUSTMENT, "Manual Adjustment"),
        (TYPE_WASTE, "Waste"),
        (TYPE_TRANSFER_IN, "Transfer In"),
        (TYPE_TRANSFER_OUT, "Transfer Out"),
        (TYPE_RETURN, "Return to Supplier"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="movements")
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="movements")
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name="movements")
    movement_type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    qty = models.DecimalField(max_digits=14, decimal_places=4)
    effective_at = models.DateTimeField()
    recorded_at = models.DateTimeField()
    actor = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True)
    reference_type = models.CharField(max_length=32, blank=True)
    reference_id = models.CharField(max_length=64, blank=True)
    reason = models.CharField(max_length=255, blank=True)
    idempotency_key = models.CharField(max_length=64, blank=True, null=True, unique=True)

    class Meta:
        db_table = "inv_stock_movement"
        indexes = [
            models.Index(fields=["item", "location", "effective_at"]),
            models.Index(fields=["batch"]),
            models.Index(fields=["movement_type", "effective_at"]),
            models.Index(fields=["recorded_at"]),
            models.Index(fields=["item", "recorded_at"]),
            models.Index(fields=["location", "recorded_at"]),
        ]
        constraints = [
            models.CheckConstraint(check=~models.Q(qty=0), name="movement_qty_nonzero"),
        ]


class ReorderSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="reorder_settings")
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="reorder_settings")
    reorder_point = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    reorder_qty = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    lead_time_days = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inv_reorder_setting"
        constraints = [
            models.UniqueConstraint(fields=["item", "location"], name="uniq_item_location_reorder"),
        ]


# -----------------------------
# Menu Management
# -----------------------------


class MenuItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=128, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    available = models.BooleanField(default=True)
    image = models.ImageField(upload_to="menu_items/", blank=True, null=True)
    ingredients = models.JSONField(default=list, blank=True)
    preparation_time = models.PositiveIntegerField(default=0, help_text="Minutes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "menu_item"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["category"]),
            models.Index(fields=["available"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.category})"
    

# -----------------------------
# Orders
# -----------------------------


class Order(models.Model):
    STATUS_PENDING = "pending"
    STATUS_IN_QUEUE = "in_queue"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_READY = "ready"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_REFUNDED = "refunded"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_IN_QUEUE, "In Queue"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_READY, "Ready"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    order_number = models.CharField(max_length=32, unique=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    order_type = models.CharField(max_length=32, blank=True)  # e.g., walk-in, delivery
    customer_name = models.CharField(max_length=255, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=16, blank=True)  # cash/card/mobile
    placed_by = models.ForeignKey('AppUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "order"
        indexes = [
            models.Index(fields=["order_number"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.order_number} ({self.status})"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey('MenuItem', on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "order_item"
        indexes = [
            models.Index(fields=["order"]),
        ]


# -----------------------------
# Cash handling (sessions and movements)
# -----------------------------


class CashSession(models.Model):
    STATUS_OPEN = "open"
    STATUS_CLOSED = "closed"
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    opened_by = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, related_name="cash_opened")
    closed_by = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="cash_closed")
    status = models.CharField(max_length=16, default=STATUS_OPEN)
    opening_float = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closing_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.CharField(max_length=255, blank=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "cash_session"
        indexes = [models.Index(fields=["status", "opened_at"]) ]


class CashEntry(models.Model):
    TYPE_IN = "cash_in"
    TYPE_OUT = "cash_out"
    TYPE_SALE = "sale"
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    session = models.ForeignKey(CashSession, on_delete=models.CASCADE, related_name="entries")
    type = models.CharField(max_length=16)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    actor = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cash_entry"
        indexes = [models.Index(fields=["session", "created_at"]) ]



class CateringEvent(models.Model):
    STATUS_SCHEDULED = "scheduled"
    STATUS_CONFIRMED = "confirmed"
    STATUS_IN_PROGRESS = "in-progress"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=255)
    client = models.CharField(max_length=255, blank=True)
    date = models.DateField()
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True)
    attendees = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    contact_name = models.CharField(max_length=255, blank=True)
    contact_phone = models.CharField(max_length=64, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catering_event"
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["status", "date"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.date})"


class CateringMenuItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    event = models.ForeignKey(
        CateringEvent,
        on_delete=models.CASCADE,
        related_name="menu_items",
    )
    menu_item_id = models.CharField(max_length=128, blank=True)
    name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        db_table = "catering_menu_item"
        indexes = [
            models.Index(fields=["event"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} x{self.quantity}"
