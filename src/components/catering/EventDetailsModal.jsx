import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomBadge } from '@/components/ui/custom-badge';
import {
  CalendarDays,
  Users,
  MapPin,
  User,
  Phone,
  Banknote,
} from 'lucide-react';

export const EventDetailsModal = ({ open, onOpenChange, event }) => {
  if (!event) return null;

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'scheduled':
        return 'outline';
      case 'in-progress':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold">Event Details</span>
          </DialogTitle>
          <div className="border-b border-gray-300 mt-2" /> {/* Underline */}
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Header */}
          <Card className="rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="px-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-semibold">{event.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">{event.client}</p>
                </div>
                <CustomBadge
                  variant={getStatusBadgeVariant(event.status)}
                  className="capitalize px-2 py-1 text-sm font-medium"
                >
                  {event.status.replace('-', ' ')}
                </CustomBadge>
              </div>
            </CardHeader>
          </Card>

          {/* Event Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="rounded-lg bg-blue-50 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                  <CalendarDays className="h-4 w-4" />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-bold">{event.date}</p>
                <p className="text-sm text-gray-700">{event.time}</p>
              </CardContent>
            </Card>

            <Card className="rounded-lg bg-green-50 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                  <Users className="h-4 w-4" />
                  Attendees
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-bold">{event.attendees} people</p>
                <p className="text-sm text-gray-700">Expected guests</p>
              </CardContent>
            </Card>

            <Card className="rounded-lg bg-yellow-50 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-bold">{event.location}</p>
              </CardContent>
            </Card>

            <Card className="rounded-lg bg-pink-50 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-pink-700">
                  <Banknote className="h-4 w-4" />
                  Financial
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Total:</span>
                  <span className="font-bold">₱{event.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Per person:</span>
                  <span className="font-bold">
                    ₱{(event.total / event.attendees).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="rounded-lg bg-purple-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                <User className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-medium">{getInitials(event.contactPerson.name)}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold">{event.contactPerson.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{event.contactPerson.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
