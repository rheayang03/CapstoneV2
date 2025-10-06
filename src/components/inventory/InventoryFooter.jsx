import React from 'react';
import { CardFooter } from '@/components/ui/card';

const InventoryFooter = ({ filteredCount, totalCount }) => {
  return (
    <CardFooter className="border-t py-3">
      <div className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} items
      </div>
    </CardFooter>
  );
};

export default InventoryFooter;

