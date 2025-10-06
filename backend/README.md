# Backend (Django)

This is a minimal Django backend scaffolded for API development without touching a database. It exposes stub endpoints that mirror the frontend's needs and uses an in-memory SQLite config so Django can run without migrations.

What's included

- Minimal settings (no auth/sessions/admin) to avoid DB usage
- File-based SQLite DB by default (`db.sqlite3`) for models; override with `DJANGO_DB_NAME`
- Endpoints:
  - `GET /api/health` -> `{ status: "ok" }`
  - `POST /api/auth/login` -> authenticates with your created users
  - `POST /api/auth/logout`
  - `POST /api/auth/register`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/refresh-token`
  - Orders:
    - `GET /api/orders` list orders (filters: `status`, `search`, `page`, `limit`)
    - `POST /api/orders` place order (items -> menuItemId, quantity)
    - `GET /api/orders/queue` queue view (pending/in_queue/in_progress/ready)
    - `GET /api/orders/history` history (completed/cancelled/refunded)
    - `GET /api/orders/<id>` detail with items
    - `PATCH /api/orders/<id>/status` status transitions (pending→in_queue→in_progress→ready→completed; completed→refunded)
    - `POST /api/orders/<id>/payment` process payment with optional `Idempotency-Key` header
  - Reports:
    - `GET /api/reports/sales?range=24h|7d|30d|ISO..ISO`
    - `GET /api/reports/inventory`
    - `GET /api/reports/orders`
    - `GET /api/reports/staff-attendance`
    - `GET /api/reports/customer-history?customer=`
  - Basic rate limiting on auth endpoints (e.g., login 5/min, signup 3/min) returning HTTP 429 with `Retry-After` header
  - `POST /api/auth/google` -> verifies Google ID token or code and issues a JWT

Run locally

1. Create a virtualenv and install deps
   python -m venv .venv
   .venv/Scripts/activate # Windows
   source .venv/bin/activate # macOS/Linux
   pip install -r requirements.txt

2. Create DB and run migrations
   python manage.py makemigrations
   python manage.py migrate

3. Start the dev server
   python manage.py runserver 8000

Frontend proxy

- The Vite dev server is configured to proxy `/api` to `http://localhost:8000`.
- To switch the frontend from built-in mocks to this backend, set `VITE_ENABLE_MOCKS=false` in your environment (or `.env`) when running Vite.

Notes

- A minimal `AppUser` model has been added under `api/models.py`. The API uses the DB when available and falls back to in-memory data if the DB is not migrated yet. On first DB access, the in-memory seed is imported automatically.
- JWT is issued for auth flows. Configure `DJANGO_JWT_SECRET` and `DJANGO_JWT_EXP_SECONDS` in `.env` for production.

## Use MySQL instead of SQLite

1. Install MySQL Server and create a database and user

- Example (MySQL shell):
  - CREATE DATABASE technomart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  - CREATE USER 'tm_user'@'%' IDENTIFIED BY 'your-strong-pass';
  - GRANT ALL PRIVILEGES ON technomart.\* TO 'tm_user'@'%';
  - FLUSH PRIVILEGES;

2. Configure environment in `backend/.env`

- Add the following keys (see `.env.example` for reference):
  - DJANGO_DB_ENGINE=mysql
  - DJANGO_DB_NAME=technomart
  - DJANGO_DB_USER=tm_user
  - DJANGO_DB_PASSWORD=your-strong-pass
  - DJANGO_DB_HOST=127.0.0.1
  - DJANGO_DB_PORT=3306
  - DJANGO_DB_CONN_MAX_AGE=60

3. Install the MySQL driver and apply migrations

- pip install -r requirements.txt
- python manage.py migrate

If the connection fails, verify:

- MySQL is running and reachable from the host defined in `DJANGO_DB_HOST`.
- The user has privileges on the database.
- Port 3306 is open (or adjust `DJANGO_DB_PORT`).
- Your Python environment has `mysqlclient` installed (shown in `pip show mysqlclient`).

## Bootstrap an admin user

You can quickly create or update an admin via a management command:

    python manage.py bootstrap_admin --email your-email@example.com --password "your-strong-pass" --name "Admin"

This will set role=admin and permissions=["all"]. Re-running updates the password/name.
