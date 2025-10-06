import React from 'react';
import { History } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const InventoryActivity = ({ activities }) => {
  const getBadgeColor = (action) => {
    switch (action.toLowerCase()) {
      case 'added':
        return 'bg-green-500 text-white';
      case 'removed':
        return 'bg-red-500 text-white';
      case 'updated':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="bg-white shadow-lg rounded-2xl border border-gray-200">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-bold">Recent Inventory Activity</CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-500 mt-1 sm:mt-0">
          Latest inventory changes
        </CardDescription>
      </CardHeader>

      <CardContent className="max-h-96 overflow-y-auto space-y-3">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col bg-gray-100 rounded-lg p-3 border-l-4 border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${getBadgeColor(
                        activity.action
                      )}`}
                    >
                      {activity.action.toUpperCase()}
                    </span>
                    <p className="text-sm font-medium text-gray-800">{activity.item}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.quantity}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.timestamp}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">by {activity.user}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
};
