import React from 'react';
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const InventoryHeader = ({ onAddItem }) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-2 mb-4">
      <div>
        <CardTitle>Raw Materials Inventory</CardTitle>
        <CardDescription>Track and manage inventory items</CardDescription>
      </div>
      <Button onClick={onAddItem}>
        <PlusCircle className="h-4 w-4 mr-1" /> Add Item
      </Button>
    </CardHeader>
  );
};

export default InventoryHeader;
