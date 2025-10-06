// import apiClient from '../client';
import { mockDashboardStats } from '../mockData';

// Mock delay for realistic API simulation
const mockDelay = (ms = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class DashboardService {
  async getDashboardStats(_timeRange = 'today') {
    await mockDelay();

    // TODO: Replace with actual API call
    // return apiClient.get(`/dashboard/stats?timeRange=${timeRange}`);

    // Mock implementation
    return {
      success: true,
      data: mockDashboardStats,
    };
  }

  async getSalesData(_params = {}) {
    await mockDelay();

    // TODO: Replace with actual API call
    // const queryParams = new URLSearchParams(params).toString();
    // return apiClient.get(`/dashboard/sales?${queryParams}`);

    // Mock implementation
    return {
      success: true,
      data: mockDashboardStats.salesByTime,
    };
  }

  async getRecentActivity(limit = 10) {
    await mockDelay(600);

    // TODO: Replace with actual API call
    // return apiClient.get(`/dashboard/recent-activity?limit=${limit}`);

    // Mock implementation
    return {
      success: true,
      data: mockDashboardStats.recentSales.slice(0, limit),
    };
  }

  async getPopularItems(_timeRange = 'week') {
    await mockDelay(600);

    // TODO: Replace with actual API call
    // return apiClient.get(`/dashboard/popular-items?timeRange=${timeRange}`);

    // Mock implementation
    return {
      success: true,
      data: mockDashboardStats.popularItems,
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
