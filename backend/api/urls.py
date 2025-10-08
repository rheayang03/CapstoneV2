from django.urls import path, include
from . import (
    views_auth as auth_views,
    views_password_reset as pr_views,
    views_verify as verify_views,
    views_menu as menu_views,
    views_users as user_views,
    views_face as face_views,
    views_logs as logs_views,
    views_notifications as notif,  # Use 'notif' alias for all notifications
    views_payments as pay_views,
    views_employees as emp_views,
    views_attendance as att_views,
    views_feedback as feedback_views,
    views_inventory as inv_views,
    views_orders as order_views,
    views_reports as rpt_views,
    views_cash as cash_views,
    views_diag as diag_views,
    views_analytics as analytics_views,
    views_catering as catering_views,
    views_dashboard as dashboard_views,
)

urlpatterns = [
    # Health checks
    path("health/", auth_views.health, name="health"),
    path("health/db", auth_views.health_db, name="health_db"),

    # Authentication
    path("auth/login", auth_views.auth_login, name="auth_login"),
    path("auth/login/resend-otp", auth_views.auth_login_resend_otp, name="auth_login_resend_otp"),
    path("auth/login/verify-otp", auth_views.auth_login_verify_otp, name="auth_login_verify_otp"),
    path("auth/logout", auth_views.auth_logout, name="auth_logout"),
    path("auth/register", auth_views.auth_register, name="auth_register"),
    path("auth/verify-email", auth_views.verify_email, name="verify_email"),
    path("auth/resend-verification", auth_views.resend_verification, name="resend_verification"),
    path("auth/forgot-password", auth_views.forgot_password, name="forgot_password"),
    path("auth/resend-reset", auth_views.forgot_password, name="resend_reset"),
    path("auth/reset-password", auth_views.reset_password, name="reset_password"),
    path("auth/reset-password-code", auth_views.reset_password_code, name="reset_password_code"),
    path("auth/verify-reset-code", auth_views.verify_reset_code, name="verify_reset_code"),

    # New OTP + signer-based password reset
    path("auth/password-reset/request", pr_views.password_reset_request, name="password_reset_request"),
    path("auth/password-reset/verify", pr_views.password_reset_verify, name="password_reset_verify"),
    path("auth/password-reset/confirm", pr_views.password_reset_confirm, name="password_reset_confirm"),

    # Other auth routes
    path("auth/change-password", auth_views.change_password, name="change_password"),
    path("auth/refresh-token", auth_views.refresh_token, name="refresh_token"),
    path("auth/google", auth_views.auth_google, name="auth_google"),
    path("auth/me", auth_views.auth_me, name="auth_me"),

    # Verification endpoints
    path("verify/status", verify_views.verify_status, name="verify_status"),
    path("verify/upload", verify_views.verify_upload, name="verify_upload"),
    path("verify/resend-token", verify_views.verify_resend_token, name="verify_resend_token"),
    path("verify/requests", verify_views.verify_requests, name="verify_requests"),
    path("verify/approve", verify_views.verify_approve, name="verify_approve"),
    path("verify/reject", verify_views.verify_reject, name="verify_reject"),
    path("verify/headshot/<uuid:request_id>", verify_views.verify_headshot, name="verify_headshot"),

    # Menu
    path("menu/items", menu_views.menu_items, name="menu_items"),
    path("menu/items/<str:item_id>", menu_views.menu_item_detail, name="menu_item_detail"),
    path("menu/items/<str:item_id>/availability", menu_views.menu_item_availability, name="menu_item_availability"),
    path("menu/items/<str:item_id>/image", menu_views.menu_item_image, name="menu_item_image"),
    path("menu/categories", menu_views.menu_categories, name="menu_categories"),

    # Users
    path("users", user_views.users, name="users"),
    path("users/<uuid:user_id>", user_views.user_detail, name="user_detail"),
    path("users/<uuid:user_id>/status", user_views.user_status, name="user_status"),
    path("users/<uuid:user_id>/role", user_views.user_role, name="user_role"),
    path("users/roles", user_views.user_roles, name="user_roles"),
    path("users/roles/<str:value>", user_views.user_role_config, name="user_role_config"),

    # Face recognition
    path("auth/face-register", face_views.face_register, name="face_register"),
    path("auth/face-login", face_views.face_login, name="face_login"),
    path("auth/face-unregister", face_views.face_unregister, name="face_unregister"),

    # Logs
    path("logs", logs_views.logs, name="logs"),
    path("logs/summary", logs_views.logs_summary, name="logs_summary"),
    path("logs/alerts", logs_views.logs_alerts, name="logs_alerts"),

    # Notifications (corrected)
    path("notifications/", notif.notifications, name="notifications_list_create"),
    path("notifications/mark-all/", notif.notifications_mark_all, name="notifications_mark_all"),
    path("notifications/<str:notif_id>/read/", notif.notification_read, name="notification_read"),
    path("notifications/<str:notif_id>/delete/", notif.notification_delete, name="notification_delete"),
    path("notifications/settings/", notif.notifications_settings, name="notifications_settings"),
    path("notifications/push/public-key/", notif.notifications_push_public_key, name="notifications_push_public_key"),
    path("notifications/push/subscribe/", notif.notifications_push_subscribe, name="notifications_push_subscribe"),
    path("notifications/push/unsubscribe/", notif.notifications_push_unsubscribe, name="notifications_push_unsubscribe"),

    # Customer Feedback
    path("feedback/", feedback_views.feedback, name="feedback_list_create"),
    path("feedback/summary/", feedback_views.feedback_summary, name="feedback_summary"),
    path("feedback/<uuid:feedback_id>/", feedback_views.feedback_detail, name="feedback_detail"),
    path("feedback/<uuid:feedback_id>/resolve/", feedback_views.feedback_resolve, name="feedback_resolve"),

    # Catering
    path("catering/events", catering_views.catering_events, name="catering_events"),
    path("catering/events/upcoming", catering_views.catering_events_upcoming, name="catering_events_upcoming"),
    path("catering/events/<uuid:event_id>", catering_views.catering_event_detail, name="catering_event_detail"),
    path("catering/events/<uuid:event_id>/menu", catering_views.catering_event_menu, name="catering_event_menu"),
    path("api/catering/", include("api.urls_catering")),

    # Payments
    path("payments", pay_views.payments_list, name="payments_list"),
    path("payments/<uuid:pid>/refund", pay_views.payment_refund, name="payment_refund"),
    path("payments/<uuid:pid>/invoice", pay_views.payment_invoice, name="payment_invoice"),
    path("payments/config", pay_views.payments_config, name="payments_config"),
    path("orders/<str:order_id>/payment", pay_views.order_payment, name="order_payment"),

    # Orders
    path("orders", order_views.orders, name="orders"),
    path("orders/queue", order_views.order_queue, name="order_queue"),
    path("orders/history", order_views.order_history, name="order_history"),
    path("orders/bulk-progress", order_views.order_bulk_progress, name="order_bulk_progress"),
    path("orders/<uuid:oid>", order_views.order_detail, name="order_detail"),
    path("orders/<uuid:oid>/status", order_views.order_status, name="order_status"),

    # Employees & schedule
    path("employees", emp_views.employees, name="employees"),
    path("employees/<uuid:emp_id>", emp_views.employee_detail, name="employee_detail"),
    path("schedule", emp_views.schedule, name="schedule"),
    path("schedule/<uuid:sid>", emp_views.schedule_detail, name="schedule_detail"),

    # Attendance & leaves
    path("attendance", att_views.attendance, name="attendance"),
    path("attendance/<uuid:rid>", att_views.attendance_detail, name="attendance_detail"),
    path("leaves", att_views.leaves, name="leaves"),
    path("leaves/<uuid:lid>", att_views.leave_detail, name="leave_detail"),

    # Inventory
    path("inventory/items", inv_views.inventory_items, name="inventory_items"),
    path("inventory/items/<uuid:iid>/stock", inv_views.inventory_item_stock, name="inventory_item_stock"),
    path("inventory/low-stock", inv_views.inventory_low_stock, name="inventory_low_stock"),
    path("inventory/activities", inv_views.inventory_activities, name="inventory_activities"),
    path("inventory/recent-activity", inv_views.inventory_recent_activity, name="inventory_recent_activity"),
    path("inventory/db-now", inv_views.inventory_db_now, name="inventory_db_now"),
    path("inventory/stock", inv_views.inventory_stock, name="inventory_stock"),
    path("inventory/expiring", inv_views.inventory_expiring, name="inventory_expiring"),
    path("inventory/receipts", inv_views.inventory_receipts, name="inventory_receipts"),
    path("inventory/consume", inv_views.inventory_consume, name="inventory_consume"),
    path("inventory/transfer", inv_views.inventory_transfer, name="inventory_transfer"),
    path("inventory/adjust", inv_views.inventory_adjust, name="inventory_adjust"),
    path("inventory/ledger", inv_views.inventory_ledger, name="inventory_ledger"),

    # Reports
    path("reports/sales", rpt_views.reports_sales, name="reports_sales"),
    path("reports/inventory", rpt_views.reports_inventory, name="reports_inventory"),
    path("reports/orders", rpt_views.reports_orders, name="reports_orders"),
    path("reports/staff-attendance", rpt_views.reports_staff_attendance, name="reports_staff_attendance"),
    path("reports/customer-history", rpt_views.reports_customer_history, name="reports_customer_history"),

    # Analytics
    path("analytics/sales", analytics_views.analytics_sales, name="analytics_sales"),
    path("analytics/inventory", analytics_views.analytics_inventory, name="analytics_inventory"),
    path("analytics/orders", analytics_views.analytics_orders, name="analytics_orders"),
    path("analytics/attendance", analytics_views.analytics_attendance, name="analytics_attendance"),
    path("analytics/customers", analytics_views.analytics_customers, name="analytics_customers"),
    path("analytics/events", analytics_views.analytics_events, name="analytics_events"),
    path("analytics/snapshots", analytics_views.analytics_snapshots, name="analytics_snapshots"),

    # Dashboard
    path("dashboard/stats", dashboard_views.dashboard_stats, name="dashboard_stats"),

    # Cash handling
    path("cash/open", cash_views.cash_open, name="cash_open"),
    path("cash/close", cash_views.cash_close, name="cash_close"),
    path("cash/move", cash_views.cash_move, name="cash_move"),
    path("cash/session", cash_views.cash_session, name="cash_session"),

    # Diagnostics
    path("diagnostics/ping", diag_views.diag_ping, name="diag_ping"),
    path("diagnostics/media", diag_views.diag_media, name="diag_media"),
    path("diagnostics/receipt", diag_views.diag_receipt, name="diag_receipt"),
    path("diagnostics/cash-drawer", diag_views.diag_cash_drawer, name="diag_cash_drawer"),
]
