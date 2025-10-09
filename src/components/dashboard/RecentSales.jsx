import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const paymentColors = {
  card: 'bg-blue-600',
  cash: 'bg-green-600',
  mobile: 'bg-purple-600',
};

const RecentSales = ({ sales = [] }) => {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }),
    []
  );

  const items = Array.isArray(sales) ? sales : [];

  return (
    <Card>
      <CardHeader className="py-2 mb-4">
        <CardTitle className="text-2xl">Recent Sales</CardTitle>
        <CardDescription className="text-sm">
          Latest paid orders processed in the canteen
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-2">
        {items.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
            No recent sales yet.
          </div>
        ) : (
          items.map((sale) => {
            const paymentMethod = (sale.paymentMethod || '')
              .toString()
              .replace(/_/g, ' ');
            const stripeColor =
              paymentColors[sale.paymentMethod] || 'bg-gray-400';
            const orderLabel = sale.orderNumber || sale.id;
            const saleDate = sale.date ? new Date(sale.date) : null;

            return (
              <div
                key={`${sale.id}-${sale.date ?? ''}`}
                className="relative flex items-center justify-between px-4 py-3 rounded border border-blue-100 hover:bg-blue-50 transition-colors"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l ${stripeColor}`}
                />

                <div className="flex-1 flex justify-between items-center ml-3">
                  <div>
                    <p className="font-semibold text-base text-gray-800">
                      Order #{orderLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {saleDate
                        ? saleDate.toLocaleString()
                        : 'Timestamp unavailable'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-base text-gray-800">
                      {formatter.format(Number(sale.total || 0))}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {paymentMethod || 'n/a'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSales;
