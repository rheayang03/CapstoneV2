import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/api/services/analyticsService';
import { currency } from '@/utils/currency';

const formatDateLabel = (iso) => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString();
};

export default function OrdersPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'orders'],
    queryFn: () => analyticsService.getOrdersSummary(),
  });

  const ordersVsRevenue = data?.ordersVsRevenue || [];
  const paymentsByMethod = data?.paymentsByMethod || [];
  const recentTransactions = data?.recentTransactions || [];

  const chartData = useMemo(
    () =>
      ordersVsRevenue.map((row) => ({
        name: formatDateLabel(row.date),
        orders: row.orders || 0,
        revenue: row.revenue || 0,
      })),
    [ordersVsRevenue]
  );

  const paymentChartData = useMemo(
    () =>
      paymentsByMethod.map((row) => ({
        name: row.method || 'Unknown',
        amount: row.amount || 0,
      })),
    [paymentsByMethod]
  );

  const transactions = useMemo(
    () =>
      [...recentTransactions]
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 8),
    [recentTransactions]
  );

  const barColors = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading order analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load order analytics. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="col-span-1 lg:col-span-2 shadow-md rounded-2xl border border-gray-200 bg-blue-50">
        <CardHeader className="pb-3 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">Orders vs Revenue</CardTitle>
          <CardDescription className="text-gray-500">Daily orders (line) against revenue (bars)</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#374151' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} width={44} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={44} />
              <Tooltip formatter={(v, n) => (n === 'revenue' ? currency(v) : v)} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-2xl border border-gray-200 bg-red-50">
        <CardHeader className="pb-3 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">Transactions by Method</CardTitle>
          <CardDescription className="text-gray-500">Distribution of payment methods</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#374151' }} />
              <YAxis tick={{ fontSize: 11 }} width={44} />
              <Tooltip formatter={(v) => currency(v)} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {paymentChartData.map((_, idx) => (
                  <Cell key={idx} fill={barColors[idx % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-3 shadow-md rounded-2xl border border-gray-200 bg-yellow-50">
        <CardHeader className="pb-3 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">Recent Transactions</CardTitle>
          <CardDescription className="text-gray-500">Latest processed payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-yellow-50 z-10">
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((p) => (
                    <TableRow key={p.id} className="hover:bg-yellow-100 transition-colors">
                      <TableCell className="font-medium">{p.orderId}</TableCell>
                      <TableCell>{currency(p.amount)}</TableCell>
                      <TableCell className="capitalize">{p.method}</TableCell>
                      <TableCell>{formatDateLabel(p.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
