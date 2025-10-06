import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const CateringSidebar = ({ 
  menuItems = [], 
  upcomingEvents = [], 
  onViewFullMenu 
}) => {
  return (
    <div className="space-y-5">
      {/* Catering Menu Card */}
      <Card className="bg-blue-100 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Catering Menu
          </CardTitle>
          <CardDescription className="text-gray-500">
            Available catering options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {menuItems.length > 0 ? (
              <>
                {menuItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center rounded-xl p-3 bg-white hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      ₱{Number(item.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                ))}
                <Button
                  className="w-full bg-blue-500 text-white font-bold rounded-full shadow-sm hover:bg-blue-300 transition-colors mt-2 flex items-center justify-center gap-2"
                  onClick={onViewFullMenu}
                >
                  View Full Menu <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                No menu items available. Create menu items in the POS or Inventory modules first.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events Card */}
      <Card className="bg-blue-100 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Upcoming Events
          </CardTitle>
          <CardDescription className="text-gray-500">
            Next scheduled catering events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 4).map((event) => (
              <div
                key={event.id}
                className="flex flex-col rounded-xl border border-gray-200 p-3 bg-white hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{event.date}</span>
                  </div>
                  <span className="text-xs text-gray-400">{event.time}</span>
                </div>
                <h4 className="font-medium text-sm text-gray-900">{event.name}</h4>
                <p className="text-xs text-gray-500">{event.client}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
