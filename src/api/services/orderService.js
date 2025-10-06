import apiClient from '../client';
import { mockOrders } from '../mockData';

const shouldUseMocks = () =>
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  (import.meta.env.VITE_ENABLE_MOCKS === 'true' ||
    import.meta.env.VITE_ENABLE_MOCKS === '1');

// Mock delay for realistic API simulation
const mockDelay = (ms = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Normalize date-like fields on orders to ISO strings
const toISO = (v) => {
  if (v === null || v === undefined) return v ?? null;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  return d.toISOString();
};

const normalizeStatus = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'in_queue':
      return 'pending';
    case 'in_progress':
      return 'preparing';
    default:
      return s;
  }
};

const normalizeOrder = (order) => {
  if (!order || typeof order !== 'object') return order;
  return {
    ...order,
    status: normalizeStatus(order.status),
    timeReceived:
      'timeReceived' in order ? toISO(order.timeReceived) : order?.timeReceived,
    timeCompleted:
      'timeCompleted' in order
        ? toISO(order.timeCompleted)
        : order?.timeCompleted,
    updatedAt: 'updatedAt' in order ? toISO(order.updatedAt) : order?.updatedAt,
    createdAt: 'createdAt' in order ? toISO(order.createdAt) : order?.createdAt,
  };
};

const normalizeApiResult = (res) => {
  // Typical shape: { success, data, ... }
  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in res) {
    const d = res.data;
    const nd = Array.isArray(d) ? d.map(normalizeOrder) : normalizeOrder(d);
    return { ...res, data: nd };
  }
  // Sometimes plain arrays or objects
  if (Array.isArray(res)) return res.map(normalizeOrder);
  if (res && typeof res === 'object') return normalizeOrder(res);
  return res;
};

class OrderService {
  async getOrders(params = {}) {
    if (shouldUseMocks()) {
      await mockDelay();
      return normalizeApiResult({
        success: true,
        data: mockOrders,
        pagination: {
          page: 1,
          limit: 50,
          total: mockOrders.length,
          totalPages: 1,
        },
      });
    }
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/orders${query ? `?${query}` : ''}`);
    return normalizeApiResult(res);
  }

  async getOrderById(orderId) {
    if (shouldUseMocks()) {
      await mockDelay(600);
      const order = mockOrders.find((o) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      return normalizeApiResult({ success: true, data: order });
    }
    const res = await apiClient.get(`/orders/${encodeURIComponent(orderId)}`);
    return normalizeApiResult(res);
  }

  async createOrder(orderData) {
    if (shouldUseMocks()) {
      await mockDelay(1000);
      const newOrder = {
        id: Date.now().toString(),
        orderNumber: `W-${String(Date.now()).slice(-3)}`,
        ...orderData,
        status: 'pending',
        timeReceived: new Date().toISOString(),
        timeCompleted: null,
      };
      return normalizeApiResult({ success: true, data: newOrder });
    }
    const res = await apiClient.post('/orders', orderData);
    return normalizeApiResult(res);
  }

  async updateOrderStatus(orderId, status) {
    if (shouldUseMocks()) {
      await mockDelay(600);
      const orderIndex = mockOrders.findIndex((o) => o.id === orderId);
      if (orderIndex === -1) throw new Error('Order not found');
      const updatedOrder = {
        ...mockOrders[orderIndex],
        status,
        timeCompleted: status === 'completed' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };
      return normalizeApiResult({ success: true, data: updatedOrder });
    }
    const serverStatus = status === 'preparing' ? 'in_progress' : status;
    const res = await apiClient.patch(
      `/orders/${encodeURIComponent(orderId)}/status`,
      { status: serverStatus }
    );
    return normalizeApiResult(res);
  }

  async cancelOrder(orderId, reason) {
    return this.updateOrderStatus(orderId, 'cancelled', { reason });
  }

  async getOrderQueue(params = {}) {
    if (shouldUseMocks()) {
      await mockDelay(600);
      const queueOrders = mockOrders.filter((o) =>
        ['pending', 'preparing', 'ready'].includes(o.status)
      );
      return normalizeApiResult({ success: true, data: queueOrders });
    }
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/orders/queue${query ? `?${query}` : ''}`);
    return normalizeApiResult(res);
  }

  async getOrderHistory(params = {}) {
    if (shouldUseMocks()) {
      await mockDelay(800);
      const historyOrders = mockOrders.filter((o) =>
        ['completed', 'cancelled'].includes(o.status)
      );
      return normalizeApiResult({
        success: true,
        data: historyOrders,
        pagination: {
          page: 1,
          limit: 20,
          total: historyOrders.length,
          totalPages: 1,
        },
      });
    }
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(
      `/orders/history${query ? `?${query}` : ''}`
    );
    return normalizeApiResult(res);
  }

  async processPayment(orderId, paymentData) {
    return apiClient.post(
      `/orders/${encodeURIComponent(orderId)}/payment`,
      paymentData
    );
  }
}

export const orderService = new OrderService();
export default orderService;
