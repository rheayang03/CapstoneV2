import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EditScheduleDialog = ({
  editingSchedule,
  setEditingSchedule,
  daysOfWeek,
  employeeList,
  onSave,
}) => {
  if (!editingSchedule) return null;

  return (
    <Dialog
      open={!!editingSchedule}
      onOpenChange={(open) => !open && setEditingSchedule(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
          <DialogDescription>Update the employee's schedule.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-employee" className="text-right">
              Employee
            </Label>
            <Select
              onValueChange={(value) => {
                const employee = employeeList.find((emp) => emp.id === value);
                setEditingSchedule({
                  ...editingSchedule,
                  employeeId: value,
                  employeeName: employee?.name || '',
                });
              }}
              value={editingSchedule.employeeId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employeeList.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} ({employee.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-day" className="text-right">
              Day
            </Label>
            <Select
              onValueChange={(value) =>
                setEditingSchedule({ ...editingSchedule, day: value })
              }
              value={editingSchedule.day}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-startTime" className="text-right">
              Start Time
            </Label>
            <Input
              id="edit-startTime"
              type="time"
              value={editingSchedule.startTime}
              onChange={(e) =>
                setEditingSchedule({
                  ...editingSchedule,
                  startTime: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-endTime" className="text-right">
              End Time
            </Label>
            <Input
              id="edit-endTime"
              type="time"
              value={editingSchedule.endTime}
              onChange={(e) =>
                setEditingSchedule({
                  ...editingSchedule,
                  endTime: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingSchedule(null)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditScheduleDialog;

