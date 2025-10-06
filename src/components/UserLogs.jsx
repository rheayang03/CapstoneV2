import React, { useMemo, useState, useEffect } from 'react';
import { FileText, ShieldAlert, UserCog, LogIn, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ActivityLogsCard from './user-logs/ActivityLogsCard';
import SecurityAlertsCard from './user-logs/SecurityAlertsCard';
import LogSummaryCard from './user-logs/LogSummaryCard';
import LogDetailsDialog from './user-logs/LogDetailsDialog';
import { useLogs } from '@/hooks/useLogs';

const UserLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogType, setSelectedLogType] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { logs, filters, setFilters, alerts, setAlerts, summary } = useLogs({
    timeRange: '24h',
    limit: 100,
  });
  const [securityAlerts, setSecurityAlerts] = useState([]);

  useEffect(() => {
    setSecurityAlerts(alerts || []);
  }, [alerts]);

  // Sync UI controls to backend filters
  useEffect(() => {
    setFilters({
      ...filters,
      type: selectedLogType === 'all' ? '' : selectedLogType,
      timeRange,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLogType, timeRange]);

  useEffect(() => {
    const h = setTimeout(
      () => setFilters({ ...filters, search: searchTerm }),
      300
    );
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const getActionIcon = (type) => {
    switch (type) {
      case 'login':
        return <LogIn className="h-4 w-4" />;
      case 'security':
        return <ShieldAlert className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'action':
        return <UserCog className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'login':
        return 'bg-blue-100 text-blue-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'action':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBlockIP = (alertId) => {
    toast({
      title: 'IP Address Blocked',
      description: 'The suspicious IP address has been blocked successfully.',
    });
    // Remove the alert after blocking IP
    setSecurityAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const handleDismissAlert = (alertId) => {
    setSecurityAlerts((prev) =>
      prev
        .map((alert) =>
          alert.id === alertId ? { ...alert, dismissed: true } : alert
        )
        .filter((alert) => !alert.dismissed)
    );
    toast({
      title: 'Alert Dismissed',
      description: 'Security alert has been dismissed.',
    });
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Activity Logs on the left */}
      <div className="md:col-span-2 space-y-4">
        <ActivityLogsCard
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedLogType={selectedLogType}
          setSelectedLogType={setSelectedLogType}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          logs={logs.map((l) => ({
            ...l,
            timestamp:
              typeof l.timestamp === 'string'
                ? l.timestamp
                : new Date(l.timestamp).toLocaleString(),
          }))}
          onRowClick={handleRowClick}
          getActionIcon={getActionIcon}
          getActionColor={getActionColor}
        />
      </div>

      {/* Log Summary above Security Alerts on the right */}
      <div className="space-y-4">
        <LogSummaryCard summary={summary} />

        <SecurityAlertsCard
          securityAlerts={securityAlerts}
          onBlockIP={handleBlockIP}
          onDismiss={handleDismissAlert}
        />
      </div>

      {/* Log Details Dialog */}
      <LogDetailsDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedLog={selectedLog}
        getActionIcon={getActionIcon}
        getActionColor={getActionColor}
      />
    </div>
  );
};

export default UserLogs;
