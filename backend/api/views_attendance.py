"""Attendance and Leave management endpoints.

Rules:
- Any authenticated user can GET (view) attendance and leave lists.
- Only Manager/Admin (attendance.manage / leave.manage) can create/update/delete.
"""

import json
from datetime import datetime, date, time
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.utils import timezone as dj_tz

from .views_common import _actor_from_request, _has_permission


def _parse_date(val):
    try:
        if isinstance(val, date):
            return val
        return datetime.strptime(str(val), "%Y-%m-%d").date()
    except Exception:
        return None


def _parse_time(val):
    try:
        if isinstance(val, time):
            return val
        h, m = str(val or "").split(":", 1)
        return time(hour=int(h), minute=int(m))
    except Exception:
        return None


def _safe_att(a):
    return {
        "id": str(a.id),
        "employeeId": str(a.employee_id),
        "employeeName": getattr(a.employee, "name", ""),
        "date": a.date.isoformat(),
        "checkIn": a.check_in.strftime("%H:%M") if a.check_in else None,
        "checkOut": a.check_out.strftime("%H:%M") if a.check_out else None,
        "status": a.status,
        "notes": a.notes or "",
        "createdAt": a.created_at.isoformat() if a.created_at else None,
        "updatedAt": a.updated_at.isoformat() if a.updated_at else None,
    }


def _safe_leave(l):
    return {
        "id": str(l.id),
        "employeeId": str(l.employee_id),
        "employeeName": getattr(l.employee, "name", ""),
        "startDate": l.start_date.isoformat(),
        "endDate": l.end_date.isoformat(),
        "type": l.type,
        "status": l.status,
        "reason": l.reason or "",
        "decidedBy": l.decided_by or "",
        "decidedAt": l.decided_at.isoformat() if l.decided_at else None,
        "createdAt": l.created_at.isoformat() if l.created_at else None,
        "updatedAt": l.updated_at.isoformat() if l.updated_at else None,
    }


@require_http_methods(["GET", "POST"])
def attendance(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import AttendanceRecord
        if request.method == "GET":
            employee_id = request.GET.get("employeeId")
            dfrom = _parse_date(request.GET.get("from"))
            dto = _parse_date(request.GET.get("to"))
            status = (request.GET.get("status") or "").lower()
            qs = AttendanceRecord.objects.select_related("employee").all()
            if employee_id:
                qs = qs.filter(employee_id=employee_id)
            if dfrom:
                qs = qs.filter(date__gte=dfrom)
            if dto:
                qs = qs.filter(date__lte=dto)
            if status:
                qs = qs.filter(status=status)
            qs = qs.order_by("-date", "employee__name")
            data = [_safe_att(x) for x in qs]
            return JsonResponse({"success": True, "data": data})

        # POST (manager/admin)
        if not _has_permission(actor, "attendance.manage"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}
        emp_id = payload.get("employeeId")
        d = _parse_date(payload.get("date"))
        if not emp_id or not d:
            return JsonResponse({"success": False, "message": "employeeId and date are required"}, status=400)
        ci = _parse_time(payload.get("checkIn")) if payload.get("checkIn") else None
        co = _parse_time(payload.get("checkOut")) if payload.get("checkOut") else None
        status = (payload.get("status") or "present").lower()
        notes = payload.get("notes") or ""
        from .models import Employee
        e = Employee.objects.filter(id=emp_id).first()
        if not e:
            return JsonResponse({"success": False, "message": "Employee not found"}, status=404)
        with transaction.atomic():
            rec = AttendanceRecord.objects.create(employee=e, date=d, check_in=ci, check_out=co, status=status, notes=notes)
        return JsonResponse({"success": True, "data": _safe_att(rec)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


@require_http_methods(["PUT", "DELETE"]) 
def attendance_detail(request, rid):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "attendance.manage"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import AttendanceRecord, Employee
        rec = AttendanceRecord.objects.select_related("employee").filter(id=rid).first()
        if not rec:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        if request.method == "DELETE":
            rec.delete()
            return JsonResponse({"success": True})
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}
        if "employeeId" in payload and payload["employeeId"]:
            e = Employee.objects.filter(id=payload["employeeId"]).first()
            if not e:
                return JsonResponse({"success": False, "message": "Employee not found"}, status=404)
            rec.employee = e
        if "date" in payload and payload["date"]:
            d = _parse_date(payload["date"]) 
            if not d:
                return JsonResponse({"success": False, "message": "Invalid date"}, status=400)
            rec.date = d
        if "checkIn" in payload:
            rec.check_in = _parse_time(payload["checkIn"]) if payload["checkIn"] else None
        if "checkOut" in payload:
            rec.check_out = _parse_time(payload["checkOut"]) if payload["checkOut"] else None
        if "status" in payload and payload["status"]:
            rec.status = str(payload["status"]).lower()
        if "notes" in payload and payload["notes"] is not None:
            rec.notes = str(payload["notes"]) 
        rec.save()
        return JsonResponse({"success": True, "data": _safe_att(rec)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


@require_http_methods(["GET", "POST"]) 
def leaves(request):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import LeaveRecord, Employee
        if request.method == "GET":
            # Only managers/admins can view leave records
            if not _has_permission(actor, "leave.manage"):
                return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
            employee_id = request.GET.get("employeeId")
            status = (request.GET.get("status") or "").lower()
            type_v = (request.GET.get("type") or "").lower()
            qs = LeaveRecord.objects.select_related("employee").all()
            if employee_id:
                qs = qs.filter(employee_id=employee_id)
            if status:
                qs = qs.filter(status=status)
            if type_v:
                qs = qs.filter(type=type_v)
            qs = qs.order_by("-start_date", "employee__name")
            return JsonResponse({"success": True, "data": [_safe_leave(x) for x in qs]})

        # POST: allow staff/managers to request; managers/admins manage
        can_manage = _has_permission(actor, "leave.manage")
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}
        emp_id = payload.get("employeeId")
        sd = _parse_date(payload.get("startDate"))
        ed = _parse_date(payload.get("endDate"))
        if not emp_id or not sd or not ed:
            return JsonResponse({"success": False, "message": "employeeId, startDate, endDate required"}, status=400)
        if ed < sd:
            return JsonResponse({"success": False, "message": "endDate must be after startDate"}, status=400)
        # If actor cannot manage, force employee to self (by email/name mapping)
        if not can_manage:
            # Try to map AppUser -> Employee by relation, then by email in contact, then by name
            e = None
            try:
                actor_id = getattr(actor, "id", None)
                if actor_id:
                    e = Employee.objects.filter(user_id=actor_id).first()
            except Exception:
                e = None
            if not e:
                actor_email = (getattr(actor, "email", "") or "").strip().lower()
                if actor_email:
                    e = Employee.objects.filter(contact__iexact=actor_email).first()
            if not e:
                actor_name = (getattr(actor, "name", "") or "").strip()
                if actor_name:
                    e = Employee.objects.filter(name__iexact=actor_name).first()
            if not e:
                return JsonResponse({"success": False, "message": "No employee profile linked to your account"}, status=400)
        else:
            e = Employee.objects.filter(id=emp_id).first()
            if not e:
                return JsonResponse({"success": False, "message": "Employee not found"}, status=404)
        with transaction.atomic():
            rec = LeaveRecord.objects.create(
                employee=e,
                start_date=sd,
                end_date=ed,
                type=(payload.get("type") or "other").lower(),
                # Staff requests are always pending; managers/admins can pre-set
                status=(payload.get("status") or "pending").lower() if can_manage else "pending",
                reason=payload.get("reason") or "",
                decided_by="",
            )
        return JsonResponse({"success": True, "data": _safe_leave(rec)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


@require_http_methods(["PUT", "DELETE"]) 
def leave_detail(request, lid):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if not _has_permission(actor, "leave.manage"):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import LeaveRecord, Employee
        rec = LeaveRecord.objects.select_related("employee").filter(id=lid).first()
        if not rec:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        if request.method == "DELETE":
            rec.delete()
            return JsonResponse({"success": True})
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}
        if "employeeId" in payload and payload["employeeId"]:
            e = Employee.objects.filter(id=payload["employeeId"]).first()
            if not e:
                return JsonResponse({"success": False, "message": "Employee not found"}, status=404)
            rec.employee = e
        if "startDate" in payload and payload["startDate"]:
            sd = _parse_date(payload["startDate"]) 
            if not sd:
                return JsonResponse({"success": False, "message": "Invalid startDate"}, status=400)
            rec.start_date = sd
        if "endDate" in payload and payload["endDate"]:
            ed = _parse_date(payload["endDate"]) 
            if not ed:
                return JsonResponse({"success": False, "message": "Invalid endDate"}, status=400)
            rec.end_date = ed
        if rec.end_date < rec.start_date:
            return JsonResponse({"success": False, "message": "endDate must be after startDate"}, status=400)
        if "type" in payload and payload["type"]:
            rec.type = str(payload["type"]).lower()
        if "status" in payload and payload["status"]:
            rec.status = str(payload["status"]).lower()
            rec.decided_by = getattr(actor, "email", "") or getattr(actor, "name", "") or ""
            rec.decided_at = dj_tz.now()
        if "reason" in payload and payload["reason"] is not None:
            rec.reason = str(payload["reason"]) 
        rec.save()
        return JsonResponse({"success": True, "data": _safe_leave(rec)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


__all__ = [
    "attendance",
    "attendance_detail",
    "leaves",
    "leave_detail",
]
