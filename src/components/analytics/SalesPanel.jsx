import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/api/services/analyticsService';

const currency = (n) => `₱${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const formatDateLabel = (isoDate) => {
  if (!isoDate) return '';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString();
};

export default function SalesPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'sales'],
    queryFn: () => analyticsService.getSalesSummary(),
  });

  const totalRevenue = data?.totalRevenue || 0;
  const totalOrders = data?.totalOrders || 0;
  const averageOrderValue = data?.averageOrderValue || 0;
  const topItem = data?.topItems?.[0]?.name || '-';

  const daily = useMemo(() => {
    const rows = data?.daily || [];
    return rows.map((entry) => ({
      name: formatDateLabel(entry.date),
      amount: entry.revenue || 0,
      orders: entry.orders || 0,
    }));
  }, [data?.daily]);

  const monthly = useMemo(() => {
    const rows = data?.monthly || [];
    return rows.map((entry) => ({
      name: entry.month || '-',
      amount: entry.revenue || 0,
    }));
  }, [data?.monthly]);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading sales analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load sales analytics. Please try again later.
      </div>
    );
  }

  const metrics = [
    { label: 'Total Revenue', value: currency(totalRevenue), bg: 'bg-blue-100', text: 'text-blue-600' },
    { label: 'Total Orders', value: totalOrders.toLocaleString(), bg: 'bg-yellow-100', text: 'text-yellow-600' },
    { label: 'Avg. Order Value', value: currency(averageOrderValue), bg: 'bg-green-100', text: 'text-green-600' },
    { label: 'Top Item', value: topItem, bg: 'bg-pink-100', text: 'text-pink-600' },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="col-span-1 lg:col-span-3 shadow-md rounded-2xl border border-gray-200 bg-white">
        <CardHeader className="pb-3 mb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Key Metrics</CardTitle>
          <CardDescription className="text-gray-500">
            Revenue, orders, and top-selling items overview
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <div key={metric.label} className={`${metric.bg} p-4 rounded-lg flex flex-col items-center shadow-sm`}>
              <div className="text-xs font-semibold text-gray-700">{metric.label}</div>
              <div className={`text-2xl font-bold mt-1 ${metric.text}`}>{metric.value}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-2 shadow-md rounded-2xl border border-gray-200 bg-white">
        <CardHeader className="pb-3 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">Daily Revenue</CardTitle>
          <CardDescription className="text-gray-500">Trend of daily revenue over time</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gradDaily" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a0c4ff" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#a0c4ff" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                formatter={(v, name) => (name === 'orders' ? v : currency(v))}
                contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#a0c4ff" strokeWidth={2} fill="url(#gradDaily)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-2xl border border-gray-200 bg-white">
        <CardHeader className="pb-3 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">Monthly Revenue</CardTitle>
          <CardDescription className="text-gray-500">Aggregated monthly revenue</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                formatter={(v) => currency(v)}
                contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#ffd6a5" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
