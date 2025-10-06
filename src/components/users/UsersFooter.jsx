import React from 'react';
import { CardFooter } from '@/components/ui/card';

export const UsersFooter = ({ showing, total }) => {
  return (
    <CardFooter className="border-t py-3">
      <div className="text-xs text-muted-foreground">
        Showing {showing} of {total} users
      </div>
    </CardFooter>
  );
};

