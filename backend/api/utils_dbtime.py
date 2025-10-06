from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from django.db import connection


def db_now() -> datetime:
    """Return the database server's current timestamp as an aware UTC datetime.

    - SQLite: uses CURRENT_TIMESTAMP (UTC)
    - MySQL:  uses UTC_TIMESTAMP() for UTC
    - Postgres: uses NOW() at UTC via AT TIME ZONE 'UTC'
    """
    vendor = connection.vendor
    with connection.cursor() as cur:
        if vendor == "sqlite":
            # SQLite CURRENT_TIMESTAMP returns UTC in 'YYYY-MM-DD HH:MM:SS'
            cur.execute("SELECT CURRENT_TIMESTAMP")
            row = cur.fetchone()
            # row[0] is a string in UTC
            ts = str(row[0])
            # Some drivers may already return datetime; try both
            if isinstance(row[0], datetime):
                dt = row[0]
            else:
                # Parse as naive UTC and attach tzinfo
                dt = datetime.fromisoformat(ts.replace(" ", "T"))
            return dt.replace(tzinfo=timezone.utc)
        elif vendor == "mysql":
            cur.execute("SELECT UTC_TIMESTAMP()")
            row = cur.fetchone()
            dt = row[0]
            if isinstance(dt, datetime):
                return dt.replace(tzinfo=timezone.utc)
            return datetime.fromisoformat(str(dt).replace(" ", "T")).replace(tzinfo=timezone.utc)
        else:
            # Postgres
            cur.execute("SELECT (NOW() AT TIME ZONE 'UTC')")
            row = cur.fetchone()
            dt = row[0]
            if isinstance(dt, datetime):
                # Result is naive in UTC
                return dt.replace(tzinfo=timezone.utc)
            return datetime.fromisoformat(str(dt).replace(" ", "T")).replace(tzinfo=timezone.utc)


__all__ = ["db_now"]

