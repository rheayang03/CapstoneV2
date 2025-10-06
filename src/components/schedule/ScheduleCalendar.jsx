import React from 'react';
import { Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';

export const ScheduleCalendar = ({
  date,
  onDateSelect,
  schedule,
  employees,
}) => {
  const getDaySchedule = (selectedDate) => {
    const dayName = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
    });

    return schedule.filter((entry) => entry.day === dayName);
  };

  const daySchedule = date ? getDaySchedule(date) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
        <CardDescription>Monthly schedule overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateSelect}
          className="rounded-md border p-2 w-full max-w-full"
        />

        {date && (
          <div>
            <h4 className="font-medium mb-2">
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h4>
            {daySchedule.length > 0 ? (
              <div className="space-y-2">
                {daySchedule.map((entry) => {
                  const employee = employees.find(
                    (emp) => emp.id === entry.employeeId
                  );
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 p-2 border rounded-md text-sm"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {entry.startTime} - {entry.endTime}
                      </span>
                      <span className="text-muted-foreground">
                        {employee?.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No schedules for this day
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
