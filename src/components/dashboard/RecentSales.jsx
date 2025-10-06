import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

const paymentColors = {
  card: 'bg-blue-600',
  cash: 'bg-green-600',
  mobile: 'bg-purple-600'
};

const RecentSales = ({ sales }) => {
  return (
    <Card>
      <CardHeader className="py-2 mb-4">
        <CardTitle className="text-2xl">Recent Sales</CardTitle>
        <CardDescription className="text-sm">
          Latest orders processed in the canteen
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-2">
        {sales.map(sale => (
          <div
            key={sale.id}
            className="relative flex items-center justify-between px-4 py-3 rounded border border-blue-100 hover:bg-blue-50 transition-colors"
          >
            {/* Payment method stripe */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l ${
                paymentColors[sale.paymentMethod] || 'bg-gray-400'
              }`}
            />

            {/* Sale details */}
            <div className="flex-1 flex justify-between items-center ml-3">
              <div>
                <p className="font-semibold text-base text-gray-800">Order #{sale.id}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(sale.date).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-base text-gray-800">
                  ₱{sale.total.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {sale.paymentMethod}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentSales;
