import React from 'react';
import InventoryStats from '@/components/inventory/InventoryStats';
import { InventoryActivity } from '@/components/inventory/InventoryActivity';

const InventorySidebar = ({ lowStockItems, totalItems, recentActivities }) => {
  return (
    <div className="space-y-4">
      <InventoryStats lowStockItems={lowStockItems} totalItems={totalItems} />
      <InventoryActivity activities={recentActivities} />
    </div>
  );
};

export default InventorySidebar;

