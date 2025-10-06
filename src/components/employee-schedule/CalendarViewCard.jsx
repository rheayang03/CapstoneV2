import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';

const CalendarViewCard = ({ date, setDate, schedule = [] }) => {
  const dayString = date?.toLocaleDateString('en-US', { weekday: 'long' });
  const schedulesForDay = schedule.filter((entry) => entry.day === dayString);
  const today = new Date();

  return (
    <Card className="sm:text-sm max-w-full mx-auto">
      <CardHeader className="py-3 px-5 text-center">
        <CardTitle className="font-bold">Calendar</CardTitle>
        <CardDescription className="text-xs">Monthly overview</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="w-full rounded-md border p-1"
            classNames={{
              caption_label: 'text-base font-semibold mb-0',
              nav_button:
                'h-5 w-5 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors duration-200',
              head_cell: 'flex items-center justify-center p-6 text-[10px] text-center',
              row: 'grid grid-cols-7 mt-0',
              cell: 'flex items-center justify-center h-8 hover:bg-blue-100 hover:rounded-full transition-colors duration-200 p-1',
              day: ({ date: d }) =>
                `flex items-center justify-center h-8 w-8 p-0 text-xs ${
                  d.toDateString() === today.toDateString()
                    ? 'font-bold text-blue-600' 
                    : ''
                }`,
            }}
          />
        </div>

        {date && (
          <div>
            <h4 className="font-medium mt-6 mb-3 text-sm text-center">
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h4>

            <div className="space-y-1 max-h-36 overflow-y-auto">
              {schedulesForDay.length > 0 ? (
                schedulesForDay.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center p-1 bg-muted/70 rounded-full hover:bg-muted/70 transition-colors duration-200 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-xs">{entry.employeeName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.startTime} - {entry.endTime}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[9px] py-0 px-1">
                      {entry.day}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  No schedules for this day
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarViewCard;
