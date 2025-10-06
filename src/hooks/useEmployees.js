import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '@/api/services/employeeService';
import { toast } from 'sonner';

export const useEmployees = (options = {}) => {
  const { autoFetch = true } = options || {};
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoFetch));
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchEmployees();
  }, [autoFetch, fetchEmployees]);

  const addEmployee = async (employee) => {
    try {
      const newEmployee = await employeeService.createEmployee(employee);
      setEmployees((prev) => [...prev, newEmployee]);
      toast.success('Employee added successfully');
      return newEmployee;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add employee';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateEmployee = async (id, updates) => {
    try {
      const updatedEmployee = await employeeService.updateEmployee(id, updates);
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? updatedEmployee : emp))
      );
      toast.success('Employee updated successfully');
      return updatedEmployee;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update employee';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await employeeService.deleteEmployee(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      toast.success('Employee deleted successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete employee';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees,
  };
};

export const useSchedule = (initialParams = {}, options = {}) => {
  const { autoFetch = true, suppressErrorToast = false } = options || {};
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoFetch));
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams || {});

  const fetchSchedule = useCallback(
    async (override = null) => {
      try {
        setLoading(true);
        setError(null);
        const data = await employeeService.getSchedule(override || params);
        setSchedule(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch schedule';
        setError(errorMessage);
        if (!suppressErrorToast) toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [params, suppressErrorToast]
  );

  useEffect(() => {
    if (autoFetch) fetchSchedule();
  }, [autoFetch, fetchSchedule]);

  const updateScheduleEntry = async (id, updates) => {
    try {
      const updatedEntry = await employeeService.updateSchedule(id, updates);
      setSchedule((prev) =>
        prev.map((entry) => (entry.id === id ? updatedEntry : entry))
      );
      toast.success('Schedule updated successfully');
      return updatedEntry;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update schedule';
      toast.error(errorMessage);
      throw err;
    }
  };

  const addScheduleEntry = async (entry) => {
    try {
      const created = await employeeService.createSchedule(entry);
      setSchedule((prev) => [...prev, created]);
      toast.success('Schedule added successfully');
      return created;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add schedule';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteScheduleEntry = async (id) => {
    try {
      await employeeService.deleteSchedule(id);
      setSchedule((prev) => prev.filter((s) => s.id !== id));
      toast.success('Schedule deleted successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete schedule';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    schedule,
    loading,
    error,
    updateScheduleEntry,
    addScheduleEntry,
    deleteScheduleEntry,
    params,
    setParams,
    refetch: fetchSchedule,
  };
};
