import apiClient from '../client';

// Normalize backend/static mock data to the shape expected by UI components
function normalize(item = {}) {
  return {
    id: String(item.id ?? ''),
    customerName:
      item.customerName ?? item.customer_name ?? item.name ?? 'Anonymous',
    rating: Number(item.rating ?? 0),
    comment: item.comment ?? '',
    date:
      item.date ??
      item.createdAt ??
      item.created_at ??
      new Date().toISOString(),
    resolved:
      typeof item.resolved === 'boolean'
        ? item.resolved
        : String(item.status || '').toLowerCase() === 'resolved',
    orderNumber: item.orderNumber ?? item.order_number ?? null,
    category: item.category ?? null,
    email: item.email ?? null,
    metadata: item.metadata ?? {},
    resolvedAt: item.resolvedAt ?? item.resolved_at ?? null,
    resolvedBy: item.resolvedBy ?? item.resolved_by ?? null,
    resolvedByName: item.resolvedByName ?? item.resolved_by_name ?? '',
    submittedBy: item.submittedBy ?? item.submitted_by ?? null,
  };
}

class FeedbackService {
  async getFeedback() {
    const res = await apiClient.get('/feedback/?limit=200');
    if (res?.success) {
      const list = Array.isArray(res.data) ? res.data : [];
      return list.map((item) => normalize(item));
    }
    throw new Error(res?.message || 'Failed to fetch feedback');
  }

  async markFeedbackResolved(id, force = null) {
    const payload =
      force === null || typeof force === 'undefined' ? {} : { resolved: !!force };
    const res = await apiClient.post(
      `/feedback/${encodeURIComponent(id)}/resolve/`,
      payload
    );
    if (res?.success) {
      return normalize(res.data);
    }
    throw new Error(res?.message || 'Failed to update feedback status');
  }

  async updateFeedback(id, updates) {
    const res = await apiClient.patch(
      `/feedback/${encodeURIComponent(id)}/`,
      updates
    );
    if (res?.success) {
      return normalize(res.data);
    }
    throw new Error(res?.message || 'Failed to update feedback');
  }

  async createFeedback(feedbackData) {
    const res = await apiClient.post('/feedback/', feedbackData);
    if (res?.success) {
      return normalize(res.data);
    }
    throw new Error(res?.message || 'Failed to create feedback');
  }

  async getSummary() {
    const res = await apiClient.get('/feedback/summary/');
    if (res?.success) {
      return res.data;
    }
    throw new Error(res?.message || 'Failed to load feedback summary');
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;
