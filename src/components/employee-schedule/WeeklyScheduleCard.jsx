import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Role colors
const roleColors = {
  manager: 'bg-blue-200 text-blue-800',
  staff: 'bg-green-200 text-green-800',
  admin: 'bg-red-200 text-red-800',
};

const WeeklyScheduleCard = ({
  daysOfWeek,
  employeeList,
  schedule,
  onEditSchedule,
  onDeleteSchedule,
  onAddScheduleForDay,
  onOpenManageEmployees,
  canManage = false,
}) => {
  return (
    <div className="bg-white border rounded-lg shadow-xl p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-3xl font-bold">Weekly Schedule</h3>
          <p className="text-sm text-muted-foreground">
            Employee shifts for the current week
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button
              size="sm"
              className="bg-primary text-white shadow-sm"
              onClick={onOpenManageEmployees}
            >
              Manage Employees
            </Button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-b-2 border-gray-200 mb-4"></div>

      {/* Scrollable Schedule */}
      <ScrollArea className="rounded border">
        <div className="max-h-[500px] w-full">
          {/* Table Header */}
          <div className="grid grid-cols-9 gap-2 pr-1 text-sm font-semibold text-center sticky top-0 bg-yellow-100 z-20 border-b-2 border-yellow-500">
            <div className="text-left pl-4 pr-4 py-2 sticky left-0 bg-yellow-100 z-30 border-r border-yellow-500 col-span-2">
              Employee
            </div>
            {daysOfWeek.map((day) => (
              <div key={day} className="py-2 px-2">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1">
            {employeeList.map((employee, index) => (
              <div key={employee.id} className="relative">
                <div className="grid grid-cols-9 gap-2 pr-1 items-center min-h-[50px]">
                  {/* Employee Column */}
                  <div className="col-span-2 flex items-center gap-2 pl-4 pr-4 py-2 sticky left-0 bg-white z-10 border-r border-gray-300">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                      {employee.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <span className="font-medium text-sm block truncate">
                        {employee.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {employee.position}
                      </span>
                    </div>
                  </div>

                  {/* Day Cells */}
                  {daysOfWeek.map((day) => {
                    const entry = schedule.find(
                      (s) => s.employeeId === employee.id && s.day === day
                    );

                    if (entry) {
                      return (
                        <div
                          key={day}
                          title={`${entry.startTime} - ${entry.endTime} | ${employee.position}`}
                          className={clsx(
                            'rounded px-2 py-1 w-full text-[10px] font-medium text-center truncate cursor-pointer relative',
                            roleColors[employee.role] || 'bg-primary/10 text-primary-800'
                          )}
                          onClick={() => canManage && onEditSchedule(entry)}
                        >
                          {entry.startTime} - {entry.endTime}
                          {canManage && (
                            <div className="absolute top-0 right-0 flex gap-1 p-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSchedule(entry);
                                }}
                                title="Edit"
                                className="text-primary hover:text-primary/80 p-0.5"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSchedule(entry.id);
                                }}
                                title="Delete"
                                className="text-destructive hover:text-destructive/80 p-0.5"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={day}
                        onClick={() =>
                          canManage && onAddScheduleForDay(employee.id, day)
                        }
                        className="w-full rounded flex items-center justify-center cursor-pointer border border-muted hover:bg-blue-100 transition-colors min-h-[40px] px-2 py-1"
                        style={{
                          borderStyle: 'dashed',
                          borderColor: 'rgb(203 213 225)',
                          borderWidth: '1px',
                          borderRadius: '0.25rem',
                          borderDasharray: '6,3',
                        }}
                        title={`Add schedule for ${day}`}
                      >
                        <Plus size={14} className="text-red-600" />
                      </div>
                    );
                  })}
                </div>

                {index < employeeList.length - 1 && (
                  <div className="border-t border-gray-200 mt-1"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default WeeklyScheduleCard;
