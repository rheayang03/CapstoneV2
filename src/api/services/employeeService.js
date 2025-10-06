import apiClient from '../client';

class EmployeeService {
  async getEmployees(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    const res = await apiClient.get(`/employees?${qs.toString()}`, {
      retry: { retries: 2 },
    });
    // Backend returns { success, data }
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map((e) => ({
      id: e.id,
      name: e.name,
      position: e.position || '',
      hourlyRate: Number(e.hourlyRate ?? 0),
      contact: e.contact || '',
      status: e.status || 'active',
      role: (e.role || e.userRole || '').toLowerCase() || null,
      email: e.email || e.userEmail || '',
      userId: e.userId || null,
      userName: e.userName || '',
      avatar: e.avatar || '/placeholder.svg',
    }));
  }

  async createEmployee(employee) {
    const payload = {
      name: employee?.name || '',
      position: employee?.position || '',
      hourlyRate: Number(employee?.hourlyRate ?? 0),
      contact: employee?.contact || '',
      status: employee?.status || 'active',
      userId: employee?.userId || null,
    };
    const res = await apiClient.post('/employees', payload, {
      retry: { retries: 1 },
    });
    const e = res?.data || res;
    return {
      id: e.id,
      name: e.name,
      position: e.position || '',
      hourlyRate: Number(e.hourlyRate ?? 0),
      contact: e.contact || '',
      status: e.status || 'active',
      role: (e.role || e.userRole || '').toLowerCase() || null,
      email: e.email || e.userEmail || '',
      userId: e.userId || null,
      userName: e.userName || '',
      avatar: e.avatar || '/placeholder.svg',
    };
  }

  async updateEmployee(id, updates) {
    const payload = { ...updates };
    if (Object.prototype.hasOwnProperty.call(updates || {}, 'userId')) {
      payload.userId = updates.userId;
    }
    const res = await apiClient.put(`/employees/${id}`, payload, {
      retry: { retries: 1 },
    });
    const e = res?.data || res;
    return {
      id: e.id,
      name: e.name,
      position: e.position || '',
      hourlyRate: Number(e.hourlyRate ?? 0),
      contact: e.contact || '',
      status: e.status || 'active',
      role: (e.role || e.userRole || '').toLowerCase() || null,
      email: e.email || e.userEmail || '',
      userId: e.userId || null,
      userName: e.userName || '',
      avatar: e.avatar || '/placeholder.svg',
    };
  }

  async deleteEmployee(id) {
    await apiClient.delete(`/employees/${id}`, { retry: { retries: 1 } });
    return true;
  }

  async getSchedule(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    const res = await apiClient.get(`/schedule?${qs.toString()}`, {
      retry: { retries: 2 },
    });
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map((s) => ({
      id: s.id,
      employeeId: s.employeeId,
      employeeName: s.employeeName || '',
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
    }));
  }

  async createSchedule(entry) {
    const payload = {
      employeeId: entry?.employeeId,
      day: entry?.day,
      startTime: entry?.startTime,
      endTime: entry?.endTime,
    };
    const res = await apiClient.post('/schedule', payload, {
      retry: { retries: 1 },
    });
    const s = res?.data || res;
    return {
      id: s.id,
      employeeId: s.employeeId,
      employeeName: s.employeeName || '',
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
    };
  }

  async updateSchedule(id, updates) {
    const res = await apiClient.put(`/schedule/${id}`, updates, {
      retry: { retries: 1 },
    });
    const s = res?.data || res;
    return {
      id: s.id,
      employeeId: s.employeeId,
      employeeName: s.employeeName || '',
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
    };
  }

  async deleteSchedule(id) {
    await apiClient.delete(`/schedule/${id}`, { retry: { retries: 1 } });
    return true;
  }
}

export const employeeService = new EmployeeService();
export default employeeService;
