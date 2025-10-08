import apiClient from '../client';
import { DashboardStatsSchema } from '../schemas';

class DashboardService {
  async getDashboardStats(_timeRange = 'today') {
    const range = _timeRange || 'today';
    const response = await apiClient.get(
      `/dashboard/stats?range=${encodeURIComponent(range)}`
    );
    if (response?.success && response?.data) {
      try {
        response.data = DashboardStatsSchema.parse(response.data);
      } catch (error) {
        console.warn('Dashboard stats schema validation failed:', error);
      }
    }
    return response;
  }

  async getSalesData(_params = {}) {
    const range = _params?.range || _params?.timeRange || 'today';
    const response = await this.getDashboardStats(range);
    if (response?.success) {
      return {
        success: true,
        data: response.data?.salesByTime ?? [],
      };
    }
    return response;
  }

  async getRecentActivity(limit = 10) {
    const response = await this.getDashboardStats('today');
    if (response?.success) {
      const all = Array.isArray(response.data?.recentSales)
        ? response.data.recentSales
        : [];
      return {
        success: true,
        data: all.slice(0, limit),
      };
    }
    return response;
  }

  async getPopularItems(_timeRange = 'week') {
    const response = await this.getDashboardStats(_timeRange);
    if (response?.success) {
      return {
        success: true,
        data: response.data?.popularItems ?? [],
      };
    }
    return response;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
