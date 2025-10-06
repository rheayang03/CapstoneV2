import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Clock } from 'lucide-react';

const ActivityLogsCard = ({
  selectedLogType,
  setSelectedLogType,
  timeRange,
  setTimeRange,
  logs,
  onRowClick,
  getActionIcon,
  getActionColor,
}) => {
  const filteredLogs = logs.filter((log) =>
    selectedLogType === 'all' ? true : log.type === selectedLogType
  );

  const sortedLogs = [...filteredLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Activity Logs</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </CardHeader>

      {/* Filters */}
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <Select value={selectedLogType} onValueChange={setSelectedLogType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Log Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="action">User Actions</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scrollable Table */}
        <div className="rounded-md border max-h-[650px] overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b bg-yellow-100">
                <th className="h-10 px-4 text-left font-semibold w-[35%]">Action</th>
                <th className="h-10 px-4 text-left font-semibold min-w-[120px]">User ID</th>
                <th className="h-10 px-4 text-left font-semibold min-w-[150px]">Timestamp</th>
                <th className="h-10 px-4 text-left font-semibold w-[10%]">More Details</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.length > 0 ? (
                sortedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => onRowClick(log)}
                  >
                    <td className="p-4 align-middle w-[35%]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-full p-1 ${getActionColor(log.type)}`}>
                          {getActionIcon(log.type)}
                        </div>
                        <span className="truncate">
                          {log.action || (log.type || '').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap min-w-[120px]">
                      <span className="font-mono">{log.userId || '—'}</span>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap min-w-[150px]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="p-2 align-middle text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(log);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="h-24 text-center">
                    No logs found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <CardFooter className="border-t py-3">
        <div className="text-xs text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </CardFooter>
    </Card>
  );
};

export default ActivityLogsCard;
