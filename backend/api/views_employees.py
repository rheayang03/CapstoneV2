"""Employee directory and schedule endpoints.

Follows project conventions: JWT auth via Authorization Bearer, role/permission
checks via helpers in views_common, and JSON responses with { success, data }.
"""

import json
from datetime import time
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import transaction

from .views_common import _actor_from_request, _has_permission, _paginate


DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
]


def _parse_time(val: str):
    try:
        h, m = str(val or "").split(":", 1)
        h = int(h)
        m = int(m)
        if 0 <= h < 24 and 0 <= m < 60:
            return time(hour=h, minute=m)
    except Exception:
        pass
    return None


def _safe_emp(e):
    user = getattr(e, "user", None)
    role = (getattr(user, "role", "") or "").lower() if user else None
    email = None
    if user and getattr(user, "email", None):
        email = user.email
    elif isinstance(e.contact, str) and "@" in e.contact:
        email = e.contact
    return {
        "id": str(e.id),
        "name": e.name,
        "position": e.position,
        "hourlyRate": float(e.hourly_rate or 0),
        "contact": e.contact,
        "status": e.status,
        "role": role,
        "email": email,
        "userId": str(user.id) if user else None,
        "userName": getattr(user, "name", None) if user else None,
        "userRole": role,
        "userEmail": email,
        "createdAt": e.created_at.isoformat() if e.created_at else None,
        "updatedAt": e.updated_at.isoformat() if e.updated_at else None,
    }

def _safe_sched(s):
    return {
        "id": str(s.id),
        "employeeId": str(s.employee_id),
        "employeeName": getattr(s.employee, "name", ""),
        "day": s.day,
        "startTime": s.start_time.strftime("%H:%M") if s.start_time else None,
        "endTime": s.end_time.strftime("%H:%M") if s.end_time else None,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
        "updatedAt": s.updated_at.isoformat() if s.updated_at else None,
    }


@require_http_methods(["GET", "POST"])
def employees(request):
    """List/create employees.

    Access:
    - GET: staff+ (any authenticated user) to support schedule views
    - POST: manager/admin
    """
    actor, err = _actor_from_request(request)
    if not actor:
        return err

    if request.method == "GET":
        try:
            from .models import Employee
            search = (request.GET.get("search") or "").lower()
            status = (request.GET.get("status") or "").lower()
            page = request.GET.get("page", 1)
            limit = request.GET.get("limit", 50)

            qs = Employee.objects.select_related("user").all()
            # Confidentiality: Staff should only see themselves
            role_l = (getattr(actor, "role", "") or "").lower()
            if role_l not in {"admin", "manager"} and not _has_permission(actor, "employees.manage"):
                actor_id = getattr(actor, "id", None)
                if actor_id:
                    # Prefer relation; if none, fall back to email/name
                    try:
                        qs_user = qs.filter(user_id=actor_id)
                        if qs_user.exists():
                            qs = qs_user
                        else:
                            actor_email = (getattr(actor, "email", "") or "").strip().lower()
                            actor_name = (getattr(actor, "name", "") or "").strip()
                            if actor_email:
                                qs = qs.filter(contact__iexact=actor_email)
                            elif actor_name:
                                qs = qs.filter(name__iexact=actor_name)
                            else:
                                qs = qs.none()
                    except Exception:
                        actor_email = (getattr(actor, "email", "") or "").strip().lower()
                        actor_name = (getattr(actor, "name", "") or "").strip()
                        if actor_email:
                            qs = qs.filter(contact__iexact=actor_email)
                        elif actor_name:
                            qs = qs.filter(name__iexact=actor_name)
                        else:
                            qs = qs.none()
                else:
                    actor_email = (getattr(actor, "email", "") or "").strip().lower()
                    actor_name = (getattr(actor, "name", "") or "").strip()
                    if actor_email:
                        qs = qs.filter(contact__iexact=actor_email)
                    elif actor_name:
                        qs = qs.filter(name__iexact=actor_name)
                    else:
                        qs = qs.none()
            if search:
                from django.db.models import Q
                qs = qs.filter(Q(name__icontains=search) | Q(position__icontains=search) | Q(contact__icontains=search))
            if status:
                qs = qs.filter(status=status)
            qs = qs.order_by("name")
            total = qs.count()
            page = max(1, int(page or 1))
            limit = max(1, int(limit or 50))
            start = (page - 1) * limit
            end = start + limit
            items = [_safe_emp(e) for e in qs[start:end]]
            pagination = {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": max(1, (total + limit - 1) // limit),
            }
            return JsonResponse({"success": True, "data": items, "pagination": pagination})
        except Exception:
            # Minimal fallback: empty list
            return JsonResponse({"success": True, "data": [], "pagination": {"page": 1, "limit": 50, "total": 0, "totalPages": 1}})

    # POST: require manager/admin (or explicit employees.manage permission)
    role_l = getattr(actor, "role", "").lower()
    if not (_has_permission(actor, "employees.manage") or role_l in {"admin", "manager"}):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        payload = {}
    name = (payload.get("name") or "").strip()
    if not name:
        return JsonResponse({"success": False, "message": "Name is required"}, status=400)
    try:
        from .models import Employee, AppUser
        user = None
        user_id = str(payload.get("userId") or payload.get("user") or "").strip()
        if user_id:
            try:
                user = AppUser.objects.filter(id=user_id).first()
                if not user and len(user_id) == 36:
                    from uuid import UUID
                    user = AppUser.objects.filter(id=UUID(user_id)).first()
            except Exception:
                user = AppUser.objects.filter(email=user_id.lower()).first()
            if not user:
                return JsonResponse({"success": False, "message": "User not found"}, status=404)
            if Employee.objects.filter(user=user).exists():
                return JsonResponse({"success": False, "message": "User already linked to an employee"}, status=400)
        with transaction.atomic():
            emp = Employee.objects.create(
                name=name,
                position=(payload.get("position") or "").strip(),
                hourly_rate=float(payload.get("hourlyRate") or 0),
                contact=(payload.get("contact") or "").strip(),
                status=(payload.get("status") or "active").lower(),
                user=user,
            )
            if user and not emp.contact:
                emp.contact = user.email or ""
                emp.save(update_fields=["contact"])
        return JsonResponse({"success": True, "data": _safe_emp(emp)})
    except Exception as e:
        return JsonResponse({"success": False, "message": "Failed to create employee"}, status=500)



@require_http_methods(["GET", "PUT", "DELETE"])
def employee_detail(request, emp_id):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    try:
        from .models import Employee
        emp = Employee.objects.select_related("user").filter(id=emp_id).first()
        if not emp:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        if request.method == "GET":
            return JsonResponse({"success": True, "data": _safe_emp(emp)})

        # Mutations require manager/admin (or explicit employees.manage permission)
        role_l = getattr(actor, "role", "").lower()
        if not (_has_permission(actor, "employees.manage") or role_l in {"admin", "manager"}):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

        if request.method == "DELETE":
            emp.delete()
            return JsonResponse({"success": True})

        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}
        changed = False
        if "name" in payload and payload["name"] is not None:
            emp.name = str(payload["name"]).strip(); changed = True
        if "position" in payload and payload["position"] is not None:
            emp.position = str(payload["position"]).strip(); changed = True
        if "hourlyRate" in payload and payload["hourlyRate"] is not None:
            try:
                emp.hourly_rate = float(payload["hourlyRate"]) ; changed = True
            except Exception:
                pass
        if "contact" in payload and payload["contact"] is not None:
            emp.contact = str(payload["contact"]).strip(); changed = True
        if "status" in payload and payload["status"] is not None:
            emp.status = str(payload["status"]).lower(); changed = True
        if "userId" in payload:
            new_user_id = str(payload.get("userId") or "").strip()
            from .models import AppUser, Employee as EmployeeModel
            if new_user_id:
                try:
                    new_user = AppUser.objects.filter(id=new_user_id).first()
                    if not new_user and len(new_user_id) == 36:
                        from uuid import UUID
                        new_user = AppUser.objects.filter(id=UUID(new_user_id)).first()
                except Exception:
                    new_user = AppUser.objects.filter(email=new_user_id.lower()).first()
                if not new_user:
                    return JsonResponse({"success": False, "message": "User not found"}, status=404)
                if EmployeeModel.objects.filter(user=new_user).exclude(id=emp.id).exists():
                    return JsonResponse({"success": False, "message": "User already linked to another employee"}, status=400)
                emp.user = new_user; changed = True
                if not emp.contact:
                    emp.contact = new_user.email or emp.contact
            else:
                if emp.user_id is not None:
                    emp.user = None; changed = True
        if changed:
            emp.save()
        return JsonResponse({"success": True, "data": _safe_emp(emp)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


@require_http_methods(["GET", "POST"])
def schedule(request):
    """List/create schedule entries.

    Access:
    - GET: staff+ with permission 'schedule.view_edit' (view only)
    - POST: manager/admin or permission 'schedule.manage'
    """
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    if request.method == "GET":
        if not _has_permission(actor, "schedule.view_edit"):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    else:
        # Mutations require manage permission or manager/admin role
        role_l = getattr(actor, "role", "").lower()
        if not (_has_permission(actor, "schedule.manage") or role_l in {"admin", "manager"}):
            return JsonResponse({"success": False, "message": "Forbidden"}, status=403)

    try:
        from .models import ScheduleEntry, Employee
        if request.method == "GET":
            employee_id = request.GET.get("employeeId")
            day = request.GET.get("day")
            qs = ScheduleEntry.objects.select_related("employee").all()
            # Confidentiality: if not manager/admin (or schedule.manage), limit to actor's employee
            role_l = (getattr(actor, "role", "") or "").lower()
            if role_l not in {"admin", "manager"} and not _has_permission(actor, "schedule.manage"):
                # map actor -> employee via relation, then fallback
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
                if e:
                    qs = qs.filter(employee_id=e.id)
                else:
                    qs = qs.none()
            # Apply explicit filters (manager/admin may use these)
            if employee_id:
                qs = qs.filter(employee_id=employee_id)
            if day:
                qs = qs.filter(day=day)
            qs = qs.order_by("employee__name", "day", "start_time")
            items = [_safe_sched(s) for s in qs]
            return JsonResponse({"success": True, "data": items})

        # POST create
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}
        emp_id = payload.get("employeeId") or payload.get("employee")
        day = payload.get("day")
        st = _parse_time(payload.get("startTime"))
        et = _parse_time(payload.get("endTime"))
        if not emp_id:
            return JsonResponse({"success": False, "message": "employeeId is required"}, status=400)
        if day not in DAYS:
            return JsonResponse({"success": False, "message": "Invalid day"}, status=400)
        if not st or not et or st >= et:
            return JsonResponse({"success": False, "message": "Invalid start/end time"}, status=400)
        from .models import Employee
        emp = Employee.objects.filter(id=emp_id).first()
        if not emp:
            return JsonResponse({"success": False, "message": "Employee not found"}, status=404)
        with transaction.atomic():
            entry = ScheduleEntry.objects.create(employee=emp, day=day, start_time=st, end_time=et)
        return JsonResponse({"success": True, "data": _safe_sched(entry)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


@require_http_methods(["PUT", "DELETE"]) 
def schedule_detail(request, sid):
    actor, err = _actor_from_request(request)
    if not actor:
        return err
    # Mutations require manage permission or manager/admin role
    role_l = getattr(actor, "role", "").lower()
    if not (_has_permission(actor, "schedule.manage") or role_l in {"admin", "manager"}):
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    try:
        from .models import ScheduleEntry, Employee
        s = ScheduleEntry.objects.select_related("employee").filter(id=sid).first()
        if not s:
            return JsonResponse({"success": False, "message": "Not found"}, status=404)
        if request.method == "DELETE":
            s.delete()
            return JsonResponse({"success": True})
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            payload = {}
        changed = False
        if "employeeId" in payload and payload["employeeId"]:
            emp = Employee.objects.filter(id=payload["employeeId"]).first()
            if not emp:
                return JsonResponse({"success": False, "message": "Employee not found"}, status=404)
            s.employee = emp; changed = True
        if "day" in payload and payload["day"]:
            if payload["day"] not in DAYS:
                return JsonResponse({"success": False, "message": "Invalid day"}, status=400)
            s.day = payload["day"]; changed = True
        if "startTime" in payload and payload["startTime"]:
            st = _parse_time(payload["startTime"]) 
            if not st:
                return JsonResponse({"success": False, "message": "Invalid startTime"}, status=400)
            s.start_time = st; changed = True
        if "endTime" in payload and payload["endTime"]:
            et = _parse_time(payload["endTime"]) 
            if not et:
                return JsonResponse({"success": False, "message": "Invalid endTime"}, status=400)
            s.end_time = et; changed = True
        if s.start_time and s.end_time and s.start_time >= s.end_time:
            return JsonResponse({"success": False, "message": "startTime must be before endTime"}, status=400)
        if changed:
            s.save()
        # Refresh relation
        s = ScheduleEntry.objects.select_related("employee").get(id=s.id)
        return JsonResponse({"success": True, "data": _safe_sched(s)})
    except Exception:
        return JsonResponse({"success": False, "message": "Server error"}, status=500)


__all__ = [
    "employees",
    "employee_detail",
    "schedule",
    "schedule_detail",
]
