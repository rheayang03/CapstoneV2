import React from 'react';
import {
  CalendarDays,
  Clock,
  Users,
  MoreVertical,
  ClipboardCheck,
  Utensils,
  Edit,
  Trash2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const CateringEventTable = ({
  events,
  onViewDetails,
  onMenuItems,
  onCancelEvent,
  onEditEvent,
  onDeleteEvent,
  onRestoreEvent,
}) => {
  const isPastEvent = (event) => {
    const today = new Date();
    return new Date(event.date) < today && event.status !== 'cancelled';
  };

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden">
      <div className="relative w-full overflow-auto">
        <table className="w-full text-sm caption-bottom">
          <thead>
            <tr className="bg-yellow-100 border-b-2 border-yellow-500">
              <th className="h-10 px-4 text-left font-semibold">Event</th>
              <th className="h-10 px-4 text-left font-semibold hidden md:table-cell">
                Client
              </th>
              <th className="h-10 px-4 text-left font-semibold">Date & Time</th>
              <th className="h-10 px-4 text-left font-semibold hidden md:table-cell">
                Guests
              </th>
              <th className="h-10 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => {
              const past = isPastEvent(event);
              const cancelled = event.status === 'cancelled';

              return (
                <tr
                  key={event.id}
                  className={`border-b transition-all duration-200 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                  } ${past || cancelled ? 'bg-gray-100 text-gray-400' : ''}`}
                >
                  <td className="p-4 align-middle font-medium">{event.name}</td>
                  <td className="p-4 align-middle hidden md:table-cell">{event.client}</td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center gap-1 ${past || cancelled ? 'text-gray-500' : 'text-primary'}`}>
                        <CalendarDays className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${past || cancelled ? 'text-gray-400' : 'text-muted-foreground'}`}>
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle hidden md:table-cell">
                    <div className={`flex items-center gap-1 ${past || cancelled ? 'text-gray-400' : 'text-black'}`}>
                      <Users className="h-4 w-4" />
                      <span>{event.attendees}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={false}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Always available */}
                        <DropdownMenuItem onClick={() => onViewDetails(event)}>
                          <ClipboardCheck className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onMenuItems(event, past || cancelled)}
                        >
                          <Utensils className="mr-2 h-4 w-4" /> Menu Items
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        {/* Upcoming only */}
                        {!past && !cancelled && (
                          <>
                            <DropdownMenuItem onClick={() => onEditEvent(event)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onCancelEvent(event)}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Cancel Event
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDeleteEvent(event)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Cancelled only */}
                        {cancelled && (
                          <DropdownMenuItem
                            onClick={() => onRestoreEvent(event)}
                            className="text-green-600"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" /> Restore Event
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
