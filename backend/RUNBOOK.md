Runbook: POS Operations

Auth and Access

- Provision user: create AppUser via admin or management command, set role and explicit permissions as needed.
- Deactivate user: set status=deactivated (blocked by middleware).

Orders and Queue

- Create order: POST /api/orders with items (menuItemId, quantity).
- Move through states: PATCH /api/orders/:id/status with transitions:
  pending → in_queue → in_progress → ready → completed → refunded; cancel from most non-terminal states.
- Real-time updates: frontend polls /api/orders/queue every 5s; use /api/orders/bulk-progress for specific IDs.

Payments

- Cash/Card/Mobile via POST /api/orders/:id/payment. For card/mobile, pass token (nonce) from provider; backend never stores PAN/CVV.
- Idempotency: pass Idempotency-Key header to prevent duplicate charges.
- Refunds: POST /api/payments/:id/refund (role-gated).

Inventory

- Receipts and adjustments: POST /api/inventory/receipts and /api/inventory/adjust.
- Consumption: POST /api/inventory/consume for order-linked usage.
- Low-stock alerts: automatic notifications on threshold breach and via scheduled scan (manage.py inventory_scan).

Cash Handling

- Open drawer session: POST /api/cash/open (openingFloat optional).
- Cash movements: POST /api/cash/move with type=cash_in|cash_out and amount.
- Close session: POST /api/cash/close; session summary via GET /api/cash/session.

Notifications

- Create: POST /api/notifications. Delivery to web push is via outbox: run `python manage.py process_outbox` periodically.

Reports

- Sales: GET /api/reports/sales?range=24h|7d|30d|ISO..ISO
- Inventory, Orders, Staff Attendance, Customer History via respective endpoints.

Diagnostics

- Ping: GET /api/diagnostics/ping
- Test receipt: GET /api/diagnostics/receipt (renders PDF)
- Cash drawer: POST /api/diagnostics/cash-drawer (simulated response)

Backups

- SQLite: `python manage.py backup_db` creates file under backend/backups.
- Restore: `python manage.py restore_db path/to/file.sqlite3` (SQLite only).
- MySQL: use mysqldump/mysql CLI per instructions printed by backup command.

Security

- Ensure env sets SECURE\_\* flags in production; reverse proxy should terminate TLS.
- JWT secret: DJANGO_JWT_SECRET must be strong and secret.

Alerts and Monitoring

- Logs include X-Request-ID and X-Response-Time-ms headers for correlation; configure your log shipping in deployment.
