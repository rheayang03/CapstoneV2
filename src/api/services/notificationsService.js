import { mockNotifications } from '../mockData';
import apiClient from '../client';

// Mock delay for realistic API simulation
const mockDelay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class NotificationsService {
  async list(limit = 50) {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      const res = await apiClient.get(`/notifications?${params.toString()}`);
      if (res && res.success) return res;
      throw new Error('Unexpected response');
    } catch (err) {
      await mockDelay(250);
      const list = (mockNotifications || []).slice(0, limit).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        type: n.type,
        read: Boolean(n.isRead || n.read),
      }));
      return { success: true, data: list };
    }
  }
  async getUnreadCount() {
    await mockDelay(200);
    const count = (mockNotifications || []).filter(
      (n) => !n.isRead && !n.read
    ).length;
    return { success: true, data: { unreadCount: count } };
  }

  async getRecent(limit = 5) {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      const res = await apiClient.get(`/notifications?${params.toString()}`);
      if (res && res.success) return res;
      throw new Error('Unexpected response');
    } catch (err) {
      await mockDelay(300);
      const list = (mockNotifications || []).slice(0, limit).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        type: n.type,
        read: Boolean(n.isRead || n.read),
      }));
      return { success: true, data: list };
    }
  }

  async getSettings() {
    try {
      const res = await apiClient.get('/notifications/settings');
      if (res && res.success) return res.data;
      throw new Error('Unexpected response');
    } catch {
      await mockDelay(150);
      return {
        emailEnabled: true,
        pushEnabled: false,
        lowStock: true,
        order: true,
        payment: true,
      };
    }
  }

  async updateSettings(payload = {}) {
    try {
      const res = await apiClient.put('/notifications/settings', payload);
      if (res && res.success) return true;
      throw new Error('Unexpected response');
    } catch {
      await mockDelay(150);
      return true;
    }
  }

  async getVapidPublicKey() {
    try {
      const res = await apiClient.get('/notifications/push/public-key');
      return (res && res.data) || res || {};
    } catch {
      return {};
    }
  }

  async subscribePush(subscription) {
    try {
      return await apiClient.post(
        '/notifications/push/subscribe',
        subscription
      );
    } catch {
      return { success: true };
    }
  }

  async unsubscribePush(subscription) {
    try {
      return await apiClient.post(
        '/notifications/push/unsubscribe',
        subscription
      );
    } catch {
      return { success: true };
    }
  }

  async markRead(id) {
    try {
      const res = await apiClient.post(
        `/notifications/${encodeURIComponent(id)}/read`,
        {}
      );
      return res || { success: true };
    } catch {
      await mockDelay(120);
      return { success: true };
    }
  }

  async markAllRead() {
    try {
      const res = await apiClient.post(`/notifications/mark-all-read`, {});
      return res || { success: true };
    } catch {
      await mockDelay(150);
      return { success: true };
    }
  }

  async delete(id) {
    try {
      const res = await apiClient.delete(
        `/notifications/${encodeURIComponent(id)}`
      );
      return res || { success: true };
    } catch {
      await mockDelay(120);
      return { success: true };
    }
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
