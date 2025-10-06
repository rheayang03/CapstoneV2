import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const PaymentsHeader = () => {
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <div>
        <CardTitle>Payment Management</CardTitle>
        <CardDescription>Track and process payments</CardDescription>
      </div>
      <div className="flex gap-2">
        <Button variant="default" size="sm" className="flex items-center gap-1">
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>
    </CardHeader>
  );
};

export default PaymentsHeader;

