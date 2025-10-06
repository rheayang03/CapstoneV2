
import apiClient from '../client';
import { mockCateringOrders } from '../mockData';

const mockDelay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldUseMocks = () =>
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  (import.meta.env.VITE_ENABLE_MOCKS === 'true' ||
    import.meta.env.VITE_ENABLE_MOCKS === '1');

const toDateString = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return null;
  return date.toISOString().slice(0, 10);
};

const normalizeMenuItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const quantity = Number.parseInt(item.quantity ?? item.qty ?? 0, 10) || 0;
      const price = Number.parseFloat(
        item.price ?? item.lineTotal ?? item.total ?? 0
      );
      const unitPrice = Number.parseFloat(
        item.unitPrice ?? item.unit_price ?? (quantity ? price / quantity : 0)
      );
      return {
        menuItemId:
          String(
            item.menuItemId ?? item.menu_item_id ?? item.id ?? item.menuId ?? ''
          ) || null,
        name: item.name ?? item.menuItemName ?? '',
        quantity,
        price: Number.isFinite(price) ? price : 0,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      };
    })
    .filter((item) => item.quantity > 0);

const composeTime = (start, end, fallback) => {
  const cleanStart = start ? start.slice(0, 5) : null;
  const cleanEnd = end ? end.slice(0, 5) : null;
  if (cleanStart && cleanEnd) return `${cleanStart} - ${cleanEnd}`;
  if (cleanStart) return cleanStart;
  if (cleanEnd) return cleanEnd;
  if (typeof fallback === 'string' && fallback.trim().length > 0) {
    return fallback;
  }
  return '';
};

const normalizeEvent = (event) => {
  if (!event || typeof event !== 'object') return event;

  const id = event.id ?? event.eventId ?? event.uuid ?? event._id;
  const startTime =
    event.startTime ?? event.start_time ?? event.eventStartTime ?? null;
  const endTime = event.endTime ?? event.end_time ?? event.eventEndTime ?? null;
  const rawTime = event.time ?? event.eventTime ?? null;

  const contactPerson = event.contactPerson ?? {
    name: event.contactName ?? event.clientName ?? '',
    phone: event.contactPhone ?? event.clientPhone ?? '',
  };

  const total =
    event.total ?? event.totalAmount ?? event.total_amount ?? event.amount ?? 0;

  return {
    id: id ? String(id) : undefined,
    name: event.name ?? event.eventName ?? '',
    client: event.client ?? event.clientName ?? '',
    date:
      event.date ?? toDateString(event.eventDate ?? event.event_date) ?? null,
    startTime: typeof startTime === 'string' ? startTime.slice(0, 5) : startTime,
    endTime: typeof endTime === 'string' ? endTime.slice(0, 5) : endTime,
    time: composeTime(startTime, endTime, rawTime),
    location: event.location ?? event.eventLocation ?? '',
    attendees:
      Number.parseInt(event.attendees ?? event.guestCount ?? 0, 10) || 0,
    status: String(event.status ?? event.eventStatus ?? 'scheduled').toLowerCase(),
    total: Number.parseFloat(total) || 0,
    contactPerson: {
      name: contactPerson?.name ?? '',
      phone: contactPerson?.phone ?? '',
    },
    notes: event.notes ?? '',
    menuItems: normalizeMenuItems(
      event.menuItems ?? event.menu_items ?? event.items ?? []
    ),
    createdAt: event.createdAt ?? event.created_at ?? null,
    updatedAt: event.updatedAt ?? event.updated_at ?? null,
  };
};

const normalizeCollection = (collection) => {
  if (Array.isArray(collection)) {
    return collection.map(normalizeEvent);
  }
  if (collection && typeof collection === 'object' && 'results' in collection) {
    return normalizeCollection(collection.results);
  }
  return [];
};

const toPayload = (event = {}) => {
  const start = event.startTime ?? event.start_time;
  const end = event.endTime ?? event.end_time;
  return {
    name: event.name ?? event.eventName,
    client: event.client ?? event.clientName,
    date: event.date ?? toDateString(event.eventDate),
    startTime: start ?? (event.time ? event.time.split(' - ')[0] : undefined),
    endTime: end ?? (event.time ? event.time.split(' - ')[1] : undefined),
    location: event.location ?? event.eventLocation,
    attendees: event.attendees ?? event.guestCount,
    status: event.status ?? event.eventStatus,
    total: event.total ?? event.totalAmount ?? event.total_amount,
    contactPerson: event.contactPerson ?? {
      name: event.contactName,
      phone: event.contactPhone,
    },
    notes: event.notes,
    menuItems: event.menuItems ?? event.menu_items ?? event.items,
  };
};

class CateringService {
  _wrapResponse(res) {
    if (res && typeof res === 'object' && 'data' in res) {
      const normalizedData = Array.isArray(res.data)
        ? res.data.map(normalizeEvent)
        : normalizeEvent(res.data);
      return { ...res, data: normalizedData };
    }
    if (Array.isArray(res)) {
      return { success: true, data: res.map(normalizeEvent) };
    }
    return { success: true, data: normalizeEvent(res) };
  }

  async listEvents(params = {}) {
    if (shouldUseMocks()) {
      await mockDelay(200);
      return { success: true, data: normalizeCollection(mockCateringOrders) };
    }
    const query = new URLSearchParams(params).toString();
    try {
      const url = query ? `/catering/events?${query}` : '/catering/events';
      const res = await apiClient.get(url);
      return this._wrapResponse(res);
    } catch (error) {
      console.error('Failed to load catering events', error);
      throw error;
    }
  }

  async getEvent(eventId) {
    if (!eventId) {
      return { success: false, data: null };
    }
    if (shouldUseMocks()) {
      await mockDelay(200);
      const event = mockCateringOrders.find((item) => item.id === eventId);
      return { success: Boolean(event), data: normalizeEvent(event) };
    }
    const res = await apiClient.get(`/catering/events/${encodeURIComponent(eventId)}`);
    return this._wrapResponse(res);
  }

  async createEvent(event) {
    if (shouldUseMocks()) {
      await mockDelay(200);
      const mockEvent = {
        ...event,
        id: event.id ?? Date.now().toString(),
      };
      mockCateringOrders.push(mockEvent);
      return { success: true, data: normalizeEvent(mockEvent) };
    }
    const payload = toPayload(event);
    const res = await apiClient.post('/catering/events', payload);
    return this._wrapResponse(res);
  }

  async updateEvent(eventId, updates) {
    if (shouldUseMocks()) {
      await mockDelay(200);
      const idx = mockCateringOrders.findIndex((item) => item.id === eventId);
      if (idx !== -1) {
        mockCateringOrders[idx] = {
          ...mockCateringOrders[idx],
          ...updates,
        };
        return { success: true, data: normalizeEvent(mockCateringOrders[idx]) };
      }
      return { success: false, data: null };
    }
    const res = await apiClient.patch(
      `/catering/events/${encodeURIComponent(eventId)}`,
      toPayload(updates)
    );
    return this._wrapResponse(res);
  }

  async deleteEvent(eventId) {
    if (shouldUseMocks()) {
      await mockDelay(150);
      const idx = mockCateringOrders.findIndex((item) => item.id === eventId);
      if (idx !== -1) {
        mockCateringOrders.splice(idx, 1);
      }
      return { success: true };
    }
    await apiClient.delete(`/catering/events/${encodeURIComponent(eventId)}`);
    return { success: true };
  }

  async updateMenuItems(eventId, menuItems, extra = {}) {
    if (shouldUseMocks()) {
      await mockDelay(200);
      const idx = mockCateringOrders.findIndex((item) => item.id === eventId);
      if (idx !== -1) {
        mockCateringOrders[idx] = {
          ...mockCateringOrders[idx],
          menuItems,
          ...extra,
        };
        return { success: true, data: normalizeEvent(mockCateringOrders[idx]) };
      }
      return { success: false, data: null };
    }

    const normalizedItems = (menuItems || []).map((item) => {
      const quantity = Number.parseInt(item.quantity ?? item.qty ?? 0, 10) || 0;
      const unitPrice = Number.parseFloat(
        item.unitPrice ?? item.unit_price ?? item.price ?? 0
      ) || 0;
      const totalPrice = Number.parseFloat(
        item.price ?? unitPrice * quantity
      ) || 0;
      return {
        menuItemId: item.menuItemId ?? item.menu_item_id ?? item.id ?? null,
        name: item.name ?? '',
        quantity,
        unitPrice,
        price: totalPrice,
      };
    });

    const res = await apiClient.put(
      `/catering/events/${encodeURIComponent(eventId)}/menu`,
      {
        menuItems: normalizedItems,
        ...extra,
      }
    );
    return this._wrapResponse(res);
  }

  async updateStatus(eventId, status) {
    if (shouldUseMocks()) {
      return this.updateEvent(eventId, { status });
    }
    const res = await apiClient.patch(
      `/catering/events/${encodeURIComponent(eventId)}`,
      { status }
    );
    return this._wrapResponse(res);
  }

  async getUpcoming(limit = 5) {
    if (shouldUseMocks()) {
      await mockDelay(200);
      const upcoming = (mockCateringOrders || [])
        .map(normalizeEvent)
        .filter((event) => {
          const eventDate = event.date ? new Date(event.date) : null;
          if (!eventDate) return false;
          const now = new Date();
          return (
            event.status === 'confirmed' ||
            event.status === 'scheduled' ||
            eventDate >= now
          );
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, limit);
      return { success: true, data: upcoming };
    }
    const url = limit ? `/catering/events/upcoming?limit=${limit}` : '/catering/events/upcoming';
    const res = await apiClient.get(url);
    return this._wrapResponse(res);
  }
}

export const cateringService = new CateringService();
export default cateringService;
