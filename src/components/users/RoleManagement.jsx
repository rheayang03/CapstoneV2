import React from 'react';
import { Edit, Shield, User } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const roleColors = {
  admin: 'bg-red-50 text-red-800',
  manager: 'bg-amber-50 text-amber-800',
  staff: 'bg-blue-50 text-blue-800',
  default: 'bg-gray-50 text-gray-800'
};

export const RoleManagement = ({ roles, onConfigureRole }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Role Management</CardTitle>
        <CardDescription>
          Configure user roles and permissions easily
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {roles.map((role) => {
          const colorClass = roleColors[role.value] || roleColors.default;
          const RoleIcon = role.value === 'admin' ? Shield :
                           role.value === 'manager' ? User : User;
          return (
            <div
              key={role.value}
              className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-2xl border border-gray-200 ${colorClass} shadow-md`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full flex items-center justify-center">
                    <RoleIcon className="h-5 w-5" />
                  </div>
                  <h4 className="text-xl font-bold capitalize">{role.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-1 max-w-md">
                  {role.description}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 md:mt-0 rounded-full px-4 py-1 flex items-center gap-2"
                onClick={() => onConfigureRole(role)}
              >
                <Edit className="h-4 w-4" /> Configure
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
