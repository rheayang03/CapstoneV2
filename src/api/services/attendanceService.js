import apiClient from '../client';

const mockDelay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const USE_MOCKS = !(
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  (import.meta.env.VITE_ENABLE_MOCKS === 'false' ||
    import.meta.env.VITE_ENABLE_MOCKS === '0')
);

class AttendanceService {
  // Attendance
  async getAttendance(params = {}) {
    if (!USE_MOCKS) {
      try {
        const qs = new URLSearchParams();
        Object.entries(params || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '')
            qs.append(k, String(v));
        });
        const res = await apiClient.get(`/attendance?${qs.toString()}`, {
          retry: { retries: 2 },
        });
        const list = Array.isArray(res) ? res : res?.data || [];
        return list.map((r) => ({
          id: r.id,
          employeeId: r.employeeId,
          employeeName: r.employeeName || '',
          date: r.date,
          checkIn: r.checkIn || null,
          checkOut: r.checkOut || null,
          status: r.status || 'present',
          notes: r.notes || '',
        }));
      } catch (e) {
        console.warn('getAttendance API failed:', e?.message);
      }
    }
    await mockDelay();
    return [];
  }

  async createAttendance(payload) {
    if (!USE_MOCKS) {
      const res = await apiClient.post('/attendance', payload, {
        retry: { retries: 1 },
      });
      const r = res?.data || res;
      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName || '',
        date: r.date,
        checkIn: r.checkIn || null,
        checkOut: r.checkOut || null,
        status: r.status || 'present',
        notes: r.notes || '',
      };
    }
    await mockDelay(200);
    return { id: Date.now().toString(), ...payload };
  }

  async updateAttendance(id, updates) {
    if (!USE_MOCKS) {
      const res = await apiClient.put(`/attendance/${id}`, updates, {
        retry: { retries: 1 },
      });
      const r = res?.data || res;
      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName || '',
        date: r.date,
        checkIn: r.checkIn || null,
        checkOut: r.checkOut || null,
        status: r.status || 'present',
        notes: r.notes || '',
      };
    }
    await mockDelay(150);
    return { id, ...updates };
  }

  async deleteAttendance(id) {
    if (!USE_MOCKS) {
      await apiClient.delete(`/attendance/${id}`, { retry: { retries: 1 } });
      return true;
    }
    await mockDelay(120);
    return true;
  }

  // Leave
  async getLeaves(params = {}) {
    if (!USE_MOCKS) {
      try {
        const qs = new URLSearchParams();
        Object.entries(params || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '')
            qs.append(k, String(v));
        });
        const res = await apiClient.get(`/leaves?${qs.toString()}`, {
          retry: { retries: 2 },
        });
        const list = Array.isArray(res) ? res : res?.data || [];
        return list.map((l) => ({
          id: l.id,
          employeeId: l.employeeId,
          employeeName: l.employeeName || '',
          startDate: l.startDate,
          endDate: l.endDate,
          type: l.type || 'other',
          status: l.status || 'pending',
          reason: l.reason || '',
          decidedBy: l.decidedBy || '',
          decidedAt: l.decidedAt || null,
        }));
      } catch (e) {
        console.warn('getLeaves API failed:', e?.message);
      }
    }
    await mockDelay();
    return [];
  }

  async createLeave(payload) {
    if (!USE_MOCKS) {
      const res = await apiClient.post('/leaves', payload, {
        retry: { retries: 1 },
      });
      const l = res?.data || res;
      return {
        id: l.id,
        employeeId: l.employeeId,
        employeeName: l.employeeName || '',
        startDate: l.startDate,
        endDate: l.endDate,
        type: l.type || 'other',
        status: l.status || 'pending',
        reason: l.reason || '',
        decidedBy: l.decidedBy || '',
        decidedAt: l.decidedAt || null,
      };
    }
    await mockDelay(200);
    return { id: Date.now().toString(), ...payload };
  }

  async updateLeave(id, updates) {
    if (!USE_MOCKS) {
      const res = await apiClient.put(`/leaves/${id}`, updates, {
        retry: { retries: 1 },
      });
      const l = res?.data || res;
      return {
        id: l.id,
        employeeId: l.employeeId,
        employeeName: l.employeeName || '',
        startDate: l.startDate,
        endDate: l.endDate,
        type: l.type || 'other',
        status: l.status || 'pending',
        reason: l.reason || '',
        decidedBy: l.decidedBy || '',
        decidedAt: l.decidedAt || null,
      };
    }
    await mockDelay(150);
    return { id, ...updates };
  }

  async deleteLeave(id) {
    if (!USE_MOCKS) {
      await apiClient.delete(`/leaves/${id}`, { retry: { retries: 1 } });
      return true;
    }
    await mockDelay(120);
    return true;
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
