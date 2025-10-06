import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/api/services/analyticsService';
import { currency } from '@/utils/currency';

const formatDate = (iso) => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString();
};

export default function CustomersPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'customers'],
    queryFn: () => analyticsService.getCustomerSummary(),
  });

  const dailyTotals = data?.dailyTotals || [];
  const recentPurchases = data?.recentPurchases || [];

  const chartData = useMemo(
    () =>
      dailyTotals.map((entry) => ({
        name: formatDate(entry.date),
        total: entry.total || 0,
      })),
    [dailyTotals]
  );

  const history = useMemo(
    () =>
      [...recentPurchases]
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 8),
    [recentPurchases]
  );

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading customer analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load customer analytics. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="col-span-1 lg:col-span-2 shadow-xl rounded-2xl border border-gray-200 bg-purple-50">
        <CardHeader className="pb-2 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">
            Purchases Over Time
          </CardTitle>
          <CardDescription className="text-gray-600">
            Total customer spend per day
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="75%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#374151' }}
                tickLine={false}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#374151' }}
                width={50}
                tickLine={false}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip
                formatter={(value) => currency(value)}
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, fill: 'hsl(var(--primary))', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                fill="url(#colorTotal)"
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-xl rounded-2xl border border-gray-200 bg-yellow-50">
        <CardHeader className="pb-2 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">
            Recent Purchases
          </CardTitle>
          <CardDescription className="text-gray-600">
            Latest customer transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-y-auto">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-gray-100 transition-colors">
                    <TableCell className="font-medium">{entry.orderId}</TableCell>
                    <TableCell>{entry.customer || '-'}</TableCell>
                    <TableCell className="capitalize">{entry.method}</TableCell>
                    <TableCell className="text-right">{currency(entry.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
