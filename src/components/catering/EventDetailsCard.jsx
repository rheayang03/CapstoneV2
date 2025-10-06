import React from 'react';
import { 
  CalendarDays, 
  Map, 
  Users, 
  Phone, 
  User, 
  Banknote 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { CustomBadge } from '@/components/ui/custom-badge';

export const EventDetailsCard = ({ event, getStatusBadgeVariant }) => {
  if (!event) return null;

  return (
    <Card className="rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="px-4 pt-4">
        <CardTitle className="text-2xl font-bold text-black">
          Event Details
        </CardTitle>
        <CardDescription className="text-gray-500">
          Next scheduled catering event
        </CardDescription>
        <div className="border-b border-gray-300 mt-2" /> {/* Underline */}
      </CardHeader>

      <CardContent className="space-y-4 px-4 py-3">
        {/* Event Name + Status */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
            <p className="text-sm text-gray-600">{event.client}</p>
          </div>
          <CustomBadge
            variant={getStatusBadgeVariant(event.status)}
            className="capitalize w-fit px-2 py-1 text-sm font-medium"
          >
            {event.status.replace('-', ' ')}
          </CustomBadge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex flex-col p-2 border rounded-md bg-blue-50">
            <div className="flex items-center gap-1 text-sm font-medium text-blue-600 mb-1">
              <CalendarDays className="h-4 w-4" />
              Date & Time
            </div>
            <p className="text-sm text-gray-700">{event.date}<br />{event.time}</p>
          </div>

          <div className="flex flex-col p-2 border rounded-md bg-green-50">
            <div className="flex items-center gap-1 text-sm font-medium text-green-600 mb-1">
              <Map className="h-4 w-4" />
              Location
            </div>
            <p className="text-sm text-gray-700">{event.location}</p>
          </div>

          <div className="flex flex-col p-2 border rounded-md bg-yellow-50">
            <div className="flex items-center gap-1 text-sm font-medium text-yellow-600 mb-1">
              <Users className="h-4 w-4" />
              Attendees
            </div>
            <p className="text-sm text-gray-700">{event.attendees} guests</p>
          </div>
        </div>

        {/* Contact + Financial */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex flex-col p-2 border rounded-md bg-purple-50">
            <div className="flex items-center gap-1 text-sm font-medium text-purple-600 mb-1">
              <User className="h-4 w-4" />
              Contact Person
            </div>
            <p className="text-sm text-gray-700">{event.contactPerson.name}</p>
            <p className="text-sm text-gray-700">{event.contactPerson.phone}</p>
          </div>

          <div className="flex flex-col p-2 border rounded-md bg-pink-50">
            <div className="flex items-center gap-1 text-sm font-medium text-pink-600 mb-1">
              <Banknote className="h-4 w-4" />
              Financial Summary
            </div>
            <p className="text-sm text-gray-700">
              Total: <span className="font-bold">₱{event.total.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-700">
              Deposit: <span className="font-bold">₱{(event.deposit || event.total * 0.5).toFixed(2)}</span>
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                event.depositPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {event.depositPaid ? 'Paid' : 'Unpaid'}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
