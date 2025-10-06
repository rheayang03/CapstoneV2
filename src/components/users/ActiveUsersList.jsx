import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const GRADIENTS = [
  'from-pink-500 via-red-500 to-yellow-500',
  'from-purple-500 via-indigo-500 to-blue-500',
  'from-green-400 via-teal-400 to-cyan-400',
  'from-yellow-400 via-orange-400 to-red-400',
  'from-blue-400 via-indigo-400 to-purple-400',
];

function getGradientForUser(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % GRADIENTS.length);
  return GRADIENTS[index];
}

export const ActiveUsersList = ({ users, getInitials }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Active Users</CardTitle>
        <CardDescription>Currently active system users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-6">
          {users.map((user) => {
            const gradient = getGradientForUser(user.name);
            return (
              <div key={user.id} className="flex flex-col items-center px-2">
                <div className={`relative rounded-full p-0.5 bg-gradient-to-tr ${gradient}`}>
                  <Avatar className="h-16 w-16 border bg-gray-300">
                    <AvatarFallback className="text-lg font-semibold text-gray-500">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Green active dot */}
                  <span className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                </div>
                <span className="mt-2 text-sm font-medium text-center truncate w-20">
                  {user.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
