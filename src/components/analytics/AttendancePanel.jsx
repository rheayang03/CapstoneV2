import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/api/services/analyticsService';
import { currency } from '@/utils/currency';

export default function AttendancePanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'attendance'],
    queryFn: () => analyticsService.getAttendanceSummary(),
  });

  const scheduledHours = data?.scheduledHours || [];
  const roster = data?.roster || [];

  const hours = useMemo(
    () =>
      scheduledHours
        .map((entry) => ({ name: entry.name, hours: Math.round((entry.hours || 0) * 10) / 10 }))
        .sort((a, b) => b.hours - a.hours),
    [scheduledHours]
  );

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading attendance analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load attendance analytics. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="shadow-xl rounded-2xl border border-gray-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-medium font-bold text-gray-800">Scheduled Hours by Staff</CardTitle>
          <CardDescription className="text-gray-600">Sum of weekly scheduled hours</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hours}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#374151' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: '#374151' }} width={44} />
              <Tooltip formatter={(v) => `${v} hrs`} />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-xl rounded-2xl border border-gray-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-medium font-bold text-gray-800">Staff Roster</CardTitle>
          <CardDescription className="text-gray-600">Key roles and hourly rates</CardDescription>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Hourly Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-gray-100 transition-colors">
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="text-right">{currency(employee.hourlyRate)}</TableCell>
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
