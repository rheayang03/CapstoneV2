import apiClient from '../client'; // Axios instance with baseURL + token headers

class NotificationsService {
  /**
   * Fetch all notifications for the logged-in user
  */
  async list(limit = 50, page = 1) {
    const params = new URLSearchParams({ limit, page });
    const res = await apiClient.get(`/notifications/?${params.toString()}`);
    if (res?.success) {
      return {
        success: true,
        data: Array.isArray(res.data) ? res.data : [],
        pagination: res.pagination || null,
      };
    }
    throw new Error('Failed to fetch notifications');
  }

  /**
   * Fetch unread notification count
   */
  async getUnreadCount() {
    const res = await apiClient.get('/notifications/?limit=100');
    if (res?.success) {
      const unreadCount = (Array.isArray(res.data) ? res.data : []).filter(
        (n) => !n.read
      ).length;
      return { success: true, data: { unreadCount } };
    }
    throw new Error('Failed to get unread count');
  }

  /**
   * Get recent notifications (default: last 5)
   */
  async getRecent(limit = 5) {
    return this.list(limit, 1);
  }

  /**
   * Fetch user notification preferences
   */
  async getSettings() {
    const res = await apiClient.get('/notifications/settings/');
    if (res?.success) return res.data;
    throw new Error('Failed to load notification settings');
  }

  /**
   * Update user notification preferences
   */
  async updateSettings(payload = {}) {
    const res = await apiClient.put('/notifications/settings/', payload);
    if (res?.success) return res.data || payload;
    throw new Error('Failed to update settings');
  }

  /**
   * Get the public VAPID key for push subscriptions
   */
  async getVapidPublicKey() {
    const res = await apiClient.get('/notifications/push/public-key/');
    if (res?.success) return res.data || {};
    return {};
  }

  /**
   * Subscribe device/browser for push notifications
   */
  async subscribePush(subscription) {
    const res = await apiClient.post('/notifications/push/subscribe/', subscription);
    if (res?.success) return res.data || { pushEnabled: true };
    return { success: false };
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribePush(subscription) {
    const res = await apiClient.post('/notifications/push/unsubscribe/', subscription);
    if (res?.success) return res.data || { pushEnabled: false };
    return { success: false };
  }

  /**
   * Mark a specific notification as read
   */
  async markRead(id) {
    const res = await apiClient.post(`/notifications/${encodeURIComponent(id)}/read/`, {});
    return res || { success: false };
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead() {
    const res = await apiClient.post('/notifications/mark-all/', {});
    return res || { success: false };
  }

  /**
   * Delete a specific notification
   */
  async delete(id) {
    const res = await apiClient.delete(`/notifications/${encodeURIComponent(id)}/delete/`);
    return res || { success: false };
  }

  /**
   * Create (send) a notification manually (admin/system feature)
   */
  async create(payload = {}) {
    const res = await apiClient.post('/notifications/', payload);
    if (res?.success) return res.data || res;
    throw new Error('Failed to create notification');
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
