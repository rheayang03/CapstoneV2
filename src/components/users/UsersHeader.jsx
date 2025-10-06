import React from 'react';
import { UserPlus } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const UsersHeader = ({ onAddClick, canAdd = true }) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <div>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage system users and access</CardDescription>
      </div>
      {canAdd && (
        <Button size="sm" className="flex gap-1" onClick={onAddClick}>
          <UserPlus className="h-4 w-4 mr-1" />
          Add User
        </Button>
      )}
    </CardHeader>
  );
};
