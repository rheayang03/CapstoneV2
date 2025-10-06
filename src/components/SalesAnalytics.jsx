import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import SalesPanel from '@/components/analytics/SalesPanel';
import InventoryPanel from '@/components/analytics/InventoryPanel';
import OrdersPanel from '@/components/analytics/OrdersPanel';
import AttendancePanel from '@/components/analytics/AttendancePanel';
import CustomersPanel from '@/components/analytics/CustomerPanel';

export default function SalesAnalytics() {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold">Analytics</h2>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="flex flex-wrap gap-3">
          {[
            { value: 'sales', label: 'Sales Reports' },
            { value: 'inventory', label: 'Inventory Reports' },
            { value: 'orders', label: 'Orders & Transactions' },
            { value: 'attendance', label: 'Staff Attendance' },
            { value: 'customers', label: 'Customer Purchases' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="
                flex-1 md:flex-[3] text-center px-5 py-3 text-sm font-semibold transition-all
                hover:bg-muted hover:text-foreground
                data-[state=active]:bg-primary
                data-[state=active]:text-primary-foreground
                data-[state=active]:shadow-lg
              "
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <SalesPanel />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryPanel />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersPanel />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendancePanel />
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <CustomersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
