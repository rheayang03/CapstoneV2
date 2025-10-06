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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

const AddScheduleDialog = ({
  open,
  onOpenChange,
  newScheduleEntry,
  setNewScheduleEntry,
  employeeList,
  daysOfWeek,
  onAddSchedule,
  showTrigger = true,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus size={16} /> Add Schedule
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
          <DialogDescription>
            Schedule an employee for a shift.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee" className="text-right">
              Employee
            </Label>
            <Select
              onValueChange={(value) =>
                setNewScheduleEntry({
                  ...newScheduleEntry,
                  employeeId: value,
                })
              }
              value={newScheduleEntry.employeeId}
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
            <Label htmlFor="day" className="text-right">
              Day
            </Label>
            <Select
              onValueChange={(value) =>
                setNewScheduleEntry({ ...newScheduleEntry, day: value })
              }
              value={newScheduleEntry.day}
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
            <Label htmlFor="startTime" className="text-right">
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={newScheduleEntry.startTime}
              onChange={(e) =>
                setNewScheduleEntry({
                  ...newScheduleEntry,
                  startTime: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              End Time
            </Label>
            <Input
              id="endTime"
              type="time"
              value={newScheduleEntry.endTime}
              onChange={(e) =>
                setNewScheduleEntry({
                  ...newScheduleEntry,
                  endTime: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAddSchedule}>Add Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddScheduleDialog;
