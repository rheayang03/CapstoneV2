// src/components/attendance/AttendanceAdmin.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Edit as EditIcon, Trash2, Loader2 } from 'lucide-react';

export default function AttendanceAdmin({ employees: providedEmployees = null, employeesLoading: providedEmployeesLoading = false } = {}) {
  const { hasAnyRole } = useAuth();
  const isManager = hasAnyRole(['admin', 'manager']);
  const { records, loading, setParams } = useAttendance();
  const { employees: hookEmployees, loading: hookEmployeesLoading } = useEmployees({ autoFetch: !providedEmployees });
  const employees = providedEmployees ?? hookEmployees;
  const employeesLoading = providedEmployees != null ? Boolean(providedEmployeesLoading) : hookEmployeesLoading;

  const [filters, setFilters] = useState({
    employeeId: '_all',
    from: new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10),
    to: new Date().toISOString().slice(0,10),
    status: '_any',
  });

  // Auto-apply filters
  useEffect(() => {
    if (!isManager) return;
    const payload = {
      employeeId: filters.employeeId === '_all' ? '' : filters.employeeId,
      from: filters.from || '',
      to: filters.to || '',
      status: filters.status === '_any' ? '' : filters.status,
    };
    setParams(payload);
  }, [filters, isManager, setParams]);

  return (
    <div className="space-y-4 animate-fade-in">
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Attendance Records</CardTitle>
            <CardDescription>
              View, filter, and manage employee attendance over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <Label>Employee</Label>
                <Select value={filters.employeeId} onValueChange={v => setFilters(f => ({ ...f, employeeId:v }))} disabled={employeesLoading}>
                  <SelectTrigger className="w-full h-8 text-xs" disabled={employeesLoading}>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All</SelectItem>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From</Label>
                <Input type="date" className="h-8 text-xs" value={filters.from} onChange={e => setFilters(f => ({ ...f, from:e.target.value }))}/>
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" className="h-8 text-xs" value={filters.to} onChange={e => setFilters(f => ({ ...f, to:e.target.value }))}/>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status:v }))}>
                  <SelectTrigger className="w-full h-8 text-xs" disabled={employeesLoading}>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_any">Any</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(records || []).length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  )}
                  {(records || []).map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.employeeName || r.employeeId}</TableCell>
                      <TableCell>{r.checkIn || '-'}</TableCell>
                      <TableCell>{r.checkOut || '-'}</TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="outline" className={
                          r.status==='present' ? 'border-green-300 text-green-700' :
                          r.status==='late' ? 'border-amber-300 text-amber-700' :
                          r.status==='absent' ? 'border-red-300 text-red-700' : ''
                        }>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate">{r.notes || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => toast('Edit not implemented')}>
                          <EditIcon className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => toast('Delete not implemented')}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                  <Loader2 className="h-4 w-4 animate-spin"/> Loading...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
