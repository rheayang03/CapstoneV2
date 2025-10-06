import apiClient from '../client';
import { mockInventoryItems } from '../mockData';

const mockDelay = (ms = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms));
const USE_MOCKS = !(
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  (import.meta.env.VITE_ENABLE_MOCKS === 'false' ||
    import.meta.env.VITE_ENABLE_MOCKS === '0')
);

class InventoryService {
  async getInventoryItems(params = {}) {
    if (!USE_MOCKS) {
      const qs = new URLSearchParams();
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
      });
      const res = await apiClient.get(`/inventory/items?${qs.toString()}`);
      const data = res?.data || res;
      return {
        success: true,
        data: data?.data || data,
        pagination: data?.pagination || {
          page: 1,
          limit: (data?.data || data)?.length || 0,
          total: (data?.data || data)?.length || 0,
          totalPages: 1,
        },
      };
    }
    await mockDelay();
    return {
      success: true,
      data: mockInventoryItems,
      pagination: {
        page: 1,
        limit: 50,
        total: mockInventoryItems.length,
        totalPages: 1,
      },
    };
  }

  async getInventoryItemById(itemId) {
    if (!USE_MOCKS) {
      const res = await apiClient.get(`/inventory/items/${itemId}`);
      const data = res?.data || res;
      return { success: true, data: data?.data || data };
    }
    await mockDelay(600);
    const item = mockInventoryItems.find((i) => i.id === itemId);
    if (!item) throw new Error('Inventory item not found');
    return { success: true, data: item };
  }

  async createInventoryItem(itemData) {
    if (!USE_MOCKS) {
      const res = await apiClient.post('/inventory/items', itemData, {
        retry: { retries: 1 },
      });
      const data = res?.data || res;
      return { success: true, data: data?.data || data };
    }
    await mockDelay(1000);
    const newItem = {
      id: Date.now().toString(),
      ...itemData,
      createdAt: new Date().toISOString(),
      lastRestocked: new Date().toISOString(),
    };
    return { success: true, data: newItem };
  }

  async updateInventoryItem(itemId, updates) {
    if (!USE_MOCKS) {
      const res = await apiClient.put(`/inventory/items/${itemId}`, updates, {
        retry: { retries: 1 },
      });
      const data = res?.data || res;
      return { success: true, data: data?.data || data };
    }
    await mockDelay(800);
    const itemIndex = mockInventoryItems.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) throw new Error('Inventory item not found');
    const updatedItem = {
      ...mockInventoryItems[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: updatedItem };
  }

  async deleteInventoryItem(itemId) {
    if (!USE_MOCKS) {
      const res = await apiClient.delete(`/inventory/items/${itemId}`, {
        retry: { retries: 1 },
      });
      return { success: true, data: res?.data || true };
    }
    await mockDelay(600);
    const item = mockInventoryItems.find((i) => i.id === itemId);
    if (!item) throw new Error('Inventory item not found');
    return { success: true, message: 'Inventory item deleted successfully' };
  }

  async updateStock(itemId, quantity, operation = 'set') {
    if (!USE_MOCKS) {
      const res = await apiClient.patch(
        `/inventory/items/${itemId}/stock`,
        { quantity, operation },
        { retry: { retries: 1 } }
      );
      const data = res?.data || res;
      return { success: true, data: data?.data || data };
    }
    await mockDelay(500);
    const item = mockInventoryItems.find((i) => i.id === itemId);
    if (!item) throw new Error('Inventory item not found');
    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = item.quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, item.quantity - quantity);
        break;
      default:
        newQuantity = quantity;
    }
    return this.updateInventoryItem(itemId, {
      quantity: newQuantity,
      lastRestocked:
        operation === 'add' ? new Date().toISOString() : item.lastRestocked,
    });
  }

  async getLowStockItems(threshold) {
    if (!USE_MOCKS) {
      const res = await apiClient.get(
        `/inventory/low-stock${
          threshold !== undefined
            ? `?threshold=${encodeURIComponent(threshold)}`
            : ''
        }`
      );
      const data = res?.data || res;
      return { success: true, data: data?.data || data };
    }
    await mockDelay(600);
    const lowStockItems = mockInventoryItems.filter(
      (item) => item.quantity <= (threshold || item.minStock)
    );
    return { success: true, data: lowStockItems };
  }

  async getInventoryActivities(params = {}) {
    if (!USE_MOCKS) {
      const qs = new URLSearchParams();
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
      });
      // Use new authoritative endpoint
      const res = await apiClient.get(
        `/inventory/recent-activity?${qs.toString()}`
      );
      const raw = res?.data || res;
      const list = raw?.data || raw;
      // Map to UI-friendly structure used by components
      const typeToAction = (t) => {
        switch ((t || '').toUpperCase()) {
          case 'RECEIPT':
            return 'Stock Received';
          case 'SALE':
            return 'Stock Deduction';
          case 'ADJUSTMENT':
            return 'Stock Adjustment';
          case 'WASTE':
            return 'Waste';
          case 'TRANSFER_IN':
            return 'Transfer In';
          case 'TRANSFER_OUT':
            return 'Transfer Out';
          case 'RETURN':
            return 'Return to Supplier';
          default:
            return 'Stock Update';
        }
      };
      const mapped = (list || []).map((m) => {
        if ((m.type || '').toUpperCase() === 'ITEM_UPDATE') {
          const fields =
            (m.meta && m.meta.changed && Object.keys(m.meta.changed)) || [];
          return {
            id: m.id,
            action: 'Item Updated',
            item: m.itemName || m.itemId,
            quantity: fields.length
              ? `Fields: ${fields.join(', ')}`
              : 'Updated',
            timestamp: m.recordedAt || m.effectiveAt,
            user: m.actorName || 'System',
          };
        }
        const qty = Number(m.qty || 0);
        const sign = qty > 0 ? '+' : '';
        const unit = m.itemUnit ? ` ${m.itemUnit}` : '';
        return {
          id: m.id,
          action: typeToAction(m.type),
          item: m.itemName || m.itemId,
          quantity: `${sign}${qty}${unit}`,
          timestamp: m.recordedAt || m.effectiveAt,
          user: m.actorName || 'System',
        };
      });
      return { success: true, data: mapped, pagination: raw?.pagination };
    }
    // Mocks
    await mockDelay(800);
    return {
      success: true,
      data: [],
    };
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
