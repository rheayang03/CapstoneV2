import React from 'react';
import { CardFooter } from '@/components/ui/card';

const PaymentsFooter = ({ shownCount, totalCount, totalAmount }) => {
  return (
    <CardFooter className="border-t py-3 flex justify-between">
      <div className="text-xs text-muted-foreground">
        Showing {shownCount} of {totalCount} transactions
      </div>
      <div className="text-sm">
        Total: <span className="font-semibold">�,�{totalAmount}</span>
      </div>
    </CardFooter>
  );
};

export default PaymentsFooter;

