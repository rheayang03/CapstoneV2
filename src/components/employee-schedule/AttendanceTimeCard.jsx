// src/components/employee-schedule/AttendanceTimeCard.jsx
import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';

export default function AttendanceTimeCard({ user }) {
  const { records = [], createRecord, updateRecord } = useAttendance();

  const todayStr = () => new Date().toISOString().slice(0, 10);
  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const subjectId = user?.employeeId || user?.id;

  const todayRecord = useMemo(() => {
    return records.find(r => r.employeeId === subjectId && r.date === todayStr());
  }, [records, subjectId]);

  const handleTimeIn = async () => {
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      toast.error('Already timed in today. Use Time Out.');
      return;
    }
    try {
      await createRecord({
        employeeId: subjectId,
        employeeName: user?.name || '',
        date: todayStr(),
        checkIn: nowTime(),
        status: 'present',
      });
      toast.success('Timed in successfully');
    } catch (e) {
      toast.error(e?.message || 'Failed to time in');
    }
  };

  const handleTimeOut = async () => {
    if (!todayRecord || todayRecord.checkOut) {
      toast.error('No active time-in record today');
      return;
    }
    try {
      await updateRecord(todayRecord.id, { checkOut: nowTime() });
      toast.success('Timed out successfully');
    } catch (e) {
      toast.error(e?.message || 'Failed to time out');
    }
  };

  return (
    <div className="w-full border rounded-2xl shadow-lg bg-gradient-to-br from-white to-blue-50 p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-md font-semibold">Today's Attendance</h3>
        {todayRecord?.status && (
          <Badge variant="outline" className="text-xs py-0.5 px-2">
            {todayRecord.status}
          </Badge>
        )}
      </div>

      {/* Buttons stacked vertically */}
      <div className="flex flex-col gap-3 mb-3">
        <Button
          size="xs"
          className="bg-green-600 text-white hover:bg-green-300 w-full h-10 px-6 rounded-full justify-center"
          onClick={handleTimeIn}
        >
          <LogIn className="h-6 w-4 mr-2" /> Time In
        </Button>
        <Button
          size="xs"
          className="bg-red-600 text-white hover:bg-red-300 w-full h-10 px-6 rounded-full justify-center"
          onClick={handleTimeOut}
        >
          <LogOut className="h-6 w-4 mr-2" /> Time Out
        </Button>
      </div>

      {/* Record display */}
      <div className="text-sm space-y-1 mt-4">
        <div>Checked in: {todayRecord?.checkIn || '-'}</div>
        <div>Checked out: {todayRecord?.checkOut || '-'}</div>
      </div>
    </div>
  );
}
