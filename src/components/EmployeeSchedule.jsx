
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthContext';
import { useEmployees, useSchedule } from '@/hooks/useEmployees';

import ManageEmployeesDialog from '@/components/employee-schedule/ManageEmployeesDialog';
import AddScheduleDialog from '@/components/employee-schedule/AddScheduleDialog';
import WeeklyScheduleCard from '@/components/employee-schedule/WeeklyScheduleCard';
import CalendarViewCard from '@/components/employee-schedule/CalendarViewCard';
import EditScheduleDialog from '@/components/employee-schedule/EditScheduleDialog';
import AttendanceAdmin from '@/components/employee-schedule/AttendanceAdmin';
import LeaveManagement from '@/components/employee-schedule/LeaveManagement';
import AttendanceTimeCard from '@/components/employee-schedule/AttendanceTimeCard';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const EmployeeSchedule = () => {
  const { hasAnyRole, user } = useAuth();
  const canManage = hasAnyRole(['manager', 'admin']);

  const {
    employees = [],
    loading: employeesLoading,
  } = useEmployees();

  const {
    schedule = [],
    addScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
  } = useSchedule({}, { autoFetch: true });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [newScheduleEntry, setNewScheduleEntry] = useState({
    employeeId: '',
    employeeName: '',
    day: '',
    startTime: '',
    endTime: '',
  });

  const employeeList = useMemo(() => {
    return [...employees]
      .map((emp) => ({
        ...emp,
        role: (emp.role || emp.userRole || 'staff').toLowerCase(),
      }))
      .sort((a, b) => {
        const left = (a.name || '').toLowerCase();
        const right = (b.name || '').toLowerCase();
        if (left < right) return -1;
        if (left > right) return 1;
        return 0;
      });
  }, [employees]);

  const employeeNameMap = useMemo(() => {
    const map = new Map();
    employeeList.forEach((emp) => {
      map.set(emp.id, emp.name || 'Unknown');
    });
    return map;
  }, [employeeList]);

  const lookupEmployeeName = (employeeId) => {
    return employeeNameMap.get(employeeId) || 'Unknown';
  };

  const toMinutes = (timeValue) => {
    if (!timeValue) return NaN;
    const match = String(timeValue).match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) return NaN;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  const ensureEmployeesAvailable = () => {
    if (!canManage) return true;
    if (employeeList.length === 0) {
      toast.error('Add an employee before creating schedules');
      return false;
    }
    return true;
  };

  const handleAddSchedule = async () => {
    if (!canManage || !ensureEmployeesAvailable()) return;
    const { employeeId, day, startTime, endTime } = newScheduleEntry;
    if (!employeeId || !day || !startTime || !endTime) {
      toast.error('Please fill in all fields');
      return;
    }
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      toast.error('Invalid time range');
      return;
    }
    if (schedule.some((entry) => entry.employeeId === employeeId && entry.day === day)) {
      toast.error('Schedule already exists for this employee on the selected day');
      return;
    }
    try {
      await addScheduleEntry({
        ...newScheduleEntry,
        employeeName: lookupEmployeeName(employeeId),
      });
      setDialogOpen(false);
      setNewScheduleEntry({
        employeeId: '',
        employeeName: '',
        day: '',
        startTime: '',
        endTime: '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add schedule');
    }
  };

  const handleEditSchedule = async () => {
    if (!editingSchedule || !canManage) return;
    const start = toMinutes(editingSchedule.startTime);
    const end = toMinutes(editingSchedule.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      toast.error('Invalid time range');
      return;
    }
    try {
      await updateScheduleEntry(editingSchedule.id, editingSchedule);
      setEditingSchedule(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!canManage) return;
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm('Delete this schedule entry?')
        : true;
    if (!confirmed) return;
    try {
      await deleteScheduleEntry(scheduleId);
      toast.success('Schedule deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete schedule');
    }
  };

  const dialogEmployees = useMemo(() => {
    return employeeList.map((emp) => ({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      email: emp.email,
      contact: emp.contact,
    }));
  }, [employeeList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 mt-2">
          <WeeklyScheduleCard
            daysOfWeek={DAYS_OF_WEEK}
            employeeList={employeeList}
            schedule={schedule}
            onEditSchedule={setEditingSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onAddScheduleForDay={(employeeId, day) => {
              if (!canManage || !ensureEmployeesAvailable()) return;
              setNewScheduleEntry({
                employeeId,
                employeeName: lookupEmployeeName(employeeId),
                day,
                startTime: '',
                endTime: '',
              });
              setDialogOpen(true);
            }}
            onOpenManageEmployees={() => canManage && setEmployeeDialogOpen(true)}
            onOpenAddSchedule={() => {
              if (!canManage || !ensureEmployeesAvailable()) return;
              setNewScheduleEntry({
                employeeId: '',
                employeeName: '',
                day: '',
                startTime: '',
                endTime: '',
              });
              setDialogOpen(true);
            }}
            canManage={canManage}
          />
        </div>

        <div className="flex flex-col gap-7">
          <CalendarViewCard
            className="w-[280px]"
            date={date}
            setDate={setDate}
            schedule={schedule}
          />
          {user && (
            <AttendanceTimeCard className="w-[280px] self-end" user={user} />
          )}
        </div>
      </div>

      {canManage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AttendanceAdmin
            employees={employeeList}
            employeesLoading={employeesLoading}
          />
          <LeaveManagement
            employees={employeeList}
            employeesLoading={employeesLoading}
          />
        </div>
      )}

      <EditScheduleDialog
        editingSchedule={editingSchedule}
        setEditingSchedule={setEditingSchedule}
        daysOfWeek={DAYS_OF_WEEK}
        employeeList={employeeList}
        onSave={handleEditSchedule}
      />

      <ManageEmployeesDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        employeeList={dialogEmployees}
      />

      <AddScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        newScheduleEntry={newScheduleEntry}
        setNewScheduleEntry={setNewScheduleEntry}
        employeeList={employeeList}
        daysOfWeek={DAYS_OF_WEEK}
        onAddSchedule={handleAddSchedule}
        showTrigger={false}
      />
    </div>
  );
};

export default EmployeeSchedule;
