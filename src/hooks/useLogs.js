import { useEffect, useState, useCallback } from 'react';
import { logsService } from '@/api/services/logsService';
import { toast } from 'sonner';

export function useLogs(initialFilters = {}) {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    timeRange: '24h',
    page: 1,
    limit: 50,
    ...initialFilters,
  });
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({
    today: { login: 0, action: 0, security: 0, system: 0 },
    week: { login: 0, action: 0, security: 0, system: 0 },
    month: { login: 0, action: 0, security: 0, system: 0 },
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await logsService.list(filters);
      setLogs(res.data || []);
      setPagination(
        res.pagination || {
          page: 1,
          limit: (res.data || []).length,
          total: (res.data || []).length,
          totalPages: 1,
        }
      );
    } catch (err) {
      const message = err?.message || 'Failed to fetch logs';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await logsService.alerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await logsService.summary();
      setSummary(data || summary);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);
  useEffect(() => {
    fetchAlerts();
    fetchSummary();
  }, [fetchAlerts, fetchSummary]);

  return {
    logs,
    pagination,
    filters,
    setFilters,
    loading,
    error,
    refresh: fetchLogs,
    alerts,
    setAlerts,
    summary,
  };
}

export default useLogs;
