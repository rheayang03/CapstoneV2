import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Users, MapPin } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Day } from 'react-day-picker';

export const CalendarViewModal = ({ open, onOpenChange, events }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  const getEventsForDate = (date) =>
    events.filter((event) => isSameDay(parseISO(event.date), date));

  const handleDateSelect = (date) => setSelectedDate(date);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-300 text-yellow-900';
      case 'in-progress':
        return 'bg-blue-300 text-blue-900';
      case 'completed':
        return 'bg-green-300 text-green-900';
      case 'cancelled':
        return 'bg-red-300 text-red-900';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            Create New Catering Event
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Select a Date</h3>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              showOutsideDays={true}
              className="rounded-md border p-3 w-full max-w-full pointer-events-auto shadow-lg"
              classNames={{
                day: 'text-gray-800 rounded-full transition-colors w-12 h-12 flex items-center justify-center',
                day_selected:
                  'bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow',
                day_selected_hover: 'bg-primary/90',
                day_today: 'text-gray-900 font-semibold',
                day_disabled: 'text-gray-400 cursor-not-allowed',
                day_outside: 'text-gray-400',
                day_focus: 'ring-0 bg-transparent',
              }}
              components={{
                Day: (props) => {
                  const dayEvents = getEventsForDate(props.date);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div className="relative">
                      <Day {...props} />

                      {hasEvents && (
                        <>
                          <span
                            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                dayEvents[0].status === 'scheduled'
                                  ? '#facc15'
                                  : dayEvents[0].status === 'in-progress'
                                  ? '#3b82f6'
                                  : dayEvents[0].status === 'completed'
                                  ? '#22c55e'
                                  : '#ef4444',
                            }}
                          />
                          {/* Pin marker at top-right */}
                          <span className="absolute top-1 right-1 text-xs">📌</span>
                        </>
                      )}
                    </div>
                  );
                },
              }}
            />

            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20"></div>
              <span>Days with events</span>
            </div>
          </div>

          {/* Events for Selected Date */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                {selectedDate
                  ? `Events on ${format(selectedDate, 'MMMM d, yyyy')}`
                  : 'Select a date to view events'}
              </h3>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDate
                ? selectedDateEvents.length > 0
                  ? selectedDateEvents.map((event) => (
                      <Card
                        id={`event-${event.id}`}
                        key={event.id}
                        className="relative bg-yellow-50 shadow-yellow-400 hover:shadow-lg transition-shadow"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base underline">{event.name}</CardTitle>
                            <Badge
                              className={`text-xs px-2 py-1 ${getStatusBadgeColor(
                                event.status
                              )}`}
                            >
                              {event.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.client}</p>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{event.time}</span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{event.location}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{event.attendees} attendees</span>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <span className="font-semibold">${event.total.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">
                              Contact: {event.contactPerson.name}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  : (
                      <div className="text-center py-8">
                        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">No events scheduled for this date</p>
                      </div>
                    )
                : (
                    <div className="text-center py-8">
                      <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Select a date to view events</p>
                    </div>
                  )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">Total Events: {events.length}</p>
          <Button variant="close" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
