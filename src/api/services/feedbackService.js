import { mockFeedback } from '../mockData';

const mockDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Normalize backend/static mock data to the shape expected by UI components
function normalize(item) {
  return {
    id: String(item.id),
    customerName: item.customerName || item.name || 'Anonymous',
    rating: Number(item.rating || 0),
    comment: item.comment || '',
    // UI expects `date`; mock has `createdAt`
    date: item.date || item.createdAt || new Date().toISOString(),
    // UI expects boolean `resolved`; mock has `status`
    resolved:
      typeof item.resolved === 'boolean'
        ? item.resolved
        : String(item.status || '').toLowerCase() === 'resolved',
    // Keep passthrough fields if present
    orderNumber: item.orderNumber || null,
    category: item.category || null,
    email: item.email || null,
  };
}

// In-memory store so resolve/update/create are reflected in UI
let FEEDBACK_MEM = Array.isArray(mockFeedback)
  ? mockFeedback.map(normalize)
  : [];

class FeedbackService {
  async getFeedback() {
    await mockDelay(200);
    return FEEDBACK_MEM.map((x) => ({ ...x }));
  }

  async markFeedbackResolved(id) {
    await mockDelay(150);
    const idx = FEEDBACK_MEM.findIndex((f) => String(f.id) === String(id));
    if (idx === -1) throw new Error('Feedback not found');
    const updated = {
      ...FEEDBACK_MEM[idx],
      resolved: !FEEDBACK_MEM[idx].resolved,
    };
    FEEDBACK_MEM[idx] = updated;
    return { ...updated };
  }

  async updateFeedback(id, updates) {
    await mockDelay(150);
    const idx = FEEDBACK_MEM.findIndex((f) => String(f.id) === String(id));
    if (idx === -1) throw new Error('Feedback not found');
    const merged = normalize({ ...FEEDBACK_MEM[idx], ...updates });
    FEEDBACK_MEM[idx] = merged;
    return { ...merged };
  }

  async createFeedback(feedbackData) {
    await mockDelay(200);
    const item = normalize({
      id: Date.now().toString(),
      customerName: feedbackData.customerName || 'Anonymous',
      rating: Number(feedbackData.rating || 0),
      comment: feedbackData.comment || '',
      createdAt: new Date().toISOString(),
      status: 'new',
      email: feedbackData.email || null,
      orderNumber: feedbackData.orderNumber || null,
      category: feedbackData.category || null,
    });
    FEEDBACK_MEM.push(item);
    return { ...item };
  }

  async getSummary() {
    await mockDelay(150);
    const list = FEEDBACK_MEM;
    const count = list.length;
    const avg =
      count > 0
        ? list.reduce((s, f) => s + (Number(f.rating) || 0), 0) / count
        : 0;
    return { success: true, data: { average: Number(avg.toFixed(2)), count } };
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;
