import apiClient from '../client';

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .reduce(
        (acc, [key, value]) => ({ ...acc, [key]: Array.isArray(value) ? value.join(',') : value }),
        {}
      )
  ).toString();
  return search ? `?${search}` : '';
};

const unwrap = (response) =>
  response && typeof response === 'object' && 'data' in response ? response.data : response;

export const analyticsService = {
  async getSalesSummary(params) {
    const res = await apiClient.get(`/analytics/sales${buildQueryString(params)}`);
    return unwrap(res);
  },

  async getInventorySummary(params) {
    const res = await apiClient.get(`/analytics/inventory${buildQueryString(params)}`);
    return unwrap(res);
  },

  async getOrdersSummary(params) {
    const res = await apiClient.get(`/analytics/orders${buildQueryString(params)}`);
    return unwrap(res);
  },

  async getAttendanceSummary(params) {
    const res = await apiClient.get(`/analytics/attendance${buildQueryString(params)}`);
    return unwrap(res);
  },

  async getCustomerSummary(params) {
    const res = await apiClient.get(`/analytics/customers${buildQueryString(params)}`);
    return unwrap(res);
  },

  async createEvent(payload) {
    const res = await apiClient.post('/analytics/events', payload || {});
    return unwrap(res);
  },

  async listEvents(params) {
    const res = await apiClient.get(`/analytics/events${buildQueryString(params)}`);
    return unwrap(res);
  },

  async listSnapshots(params) {
    const res = await apiClient.get(`/analytics/snapshots${buildQueryString(params)}`);
    return unwrap(res);
  },
};

export default analyticsService;
