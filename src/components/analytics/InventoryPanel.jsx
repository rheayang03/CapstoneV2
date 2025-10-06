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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/api/services/analyticsService';

const formatDate = (iso) => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString();
};

export default function InventoryPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'inventory'],
    queryFn: () => analyticsService.getInventorySummary(),
  });

  const items = data?.items || [];
  const lowStockCount = data?.lowStockCount || 0;
  const okStockCount = data?.okStockCount ?? Math.max(items.length - lowStockCount, 0);
  const expiringSoon = data?.expiringSoon || [];

  const qtyByItem = useMemo(
    () => items.map((item) => ({ name: item.name, qty: item.quantity })),
    [items]
  );

  const pieData = useMemo(
    () => [
      { name: 'Low', value: lowStockCount, color: '#F56565' },
      { name: 'OK', value: okStockCount, color: '#4299E1' },
    ],
    [lowStockCount, okStockCount]
  );

  const lowPercent = useMemo(() => {
    const total = lowStockCount + okStockCount;
    return total > 0 ? Math.round((lowStockCount / total) * 100) : 0;
  }, [lowStockCount, okStockCount]);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading inventory analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load inventory analytics. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="col-span-1 lg:col-span-2 shadow-md rounded-2xl border border-gray-200 bg-blue-50">
        <CardHeader className="pb-3 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">
            Stock Levels by Item
          </CardTitle>
          <CardDescription className="text-gray-500">
            Monitor current on-hand quantities
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={qtyByItem} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#374151', fontWeight: 'bold' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11, fill: '#374151' }} width={42} />
              <Tooltip contentStyle={{ borderRadius: 8, backgroundColor: '#f3f4f6' }} />
              <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                {qtyByItem.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={['#3B82F6', '#FBBF24', '#10B981', '#8B5CF6', '#EC4899'][idx % 5]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-2xl border border-gray-200 bg-red-50">
        <CardHeader className="pb-3 mb-4">
          <CardTitle className="text-medium font-bold text-gray-800">
            Low Stock Ratio
          </CardTitle>
          <CardDescription className="text-gray-500">
            Items at or below minimum
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(value) => `${value} items`}
                contentStyle={{ borderRadius: 8, backgroundColor: '#f9fafb' }}
              />
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                cornerRadius={6}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" wrapperStyle={{ marginTop: 40 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-4 inset-x-0 text-center text-sm font-semibold text-gray-700">
            {lowPercent}% of tracked items need attention
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-3 shadow-md rounded-2xl border border-gray-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-medium font-bold text-gray-800">
            Expiring Soon (≤ 7 days)
          </CardTitle>
          <CardDescription className="text-gray-500">
            Prioritize usage or restocking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-yellow-50 z-10">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Days Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringSoon.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">
                        No items expiring soon
                      </TableCell>
                    </TableRow>
                  ) : (
                    expiringSoon.map((item) => (
                      <TableRow key={item.id} className="hover:bg-yellow-100 transition-colors">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>{formatDate(item.expiryDate)}</TableCell>
                        <TableCell
                          className={
                            item.daysToExpiry <= 3 ? 'text-red-500 font-semibold' : 'text-yellow-700'
                          }
                        >
                          {item.daysToExpiry}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
