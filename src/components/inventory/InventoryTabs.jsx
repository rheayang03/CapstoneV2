import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryGrid } from '@/components/inventory/InventoryGrid';

const InventoryTabs = ({
  filteredItems,
  onEditItem,
  onDisableItem,
  onDeleteItem, 
  getStockPercentage,
  getStockBadgeVariant,
  getStockStatusText,
}) => {
  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList>
        <TabsTrigger value="list">List View</TabsTrigger>
        <TabsTrigger value="grid">Grid View</TabsTrigger>
      </TabsList>

      {/* List View */}
      <TabsContent value="list">
        <InventoryTable
          items={filteredItems}
          onEditItem={onEditItem}
          onDisableItem={onDisableItem}
          onDeleteItem={onDeleteItem} 
          getStockPercentage={getStockPercentage}
          getStockBadgeVariant={getStockBadgeVariant}
          getStockStatusText={getStockStatusText}
        />
      </TabsContent>

      {/* Grid View */}
      <TabsContent value="grid">
        <InventoryGrid
          items={filteredItems}
          onEditItem={onEditItem}
          onDisableItem={onDisableItem}
          onDeleteItem={onDeleteItem} 
          getStockPercentage={getStockPercentage}
          getStockBadgeVariant={getStockBadgeVariant}
          getStockStatusText={getStockStatusText}
        />
      </TabsContent>
    </Tabs>
  );
};

export default InventoryTabs;
