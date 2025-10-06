import apiClient from '../client';

class MenuService {
  async getMenuItems(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    const res = await apiClient.get(`/menu/items?${qs.toString()}`, {
      retry: { retries: 1 },
    });
    const raw = res?.data || res;
    const list = raw?.data || raw || [];
    const getBackendOrigin = () => {
      try {
        const env =
          (typeof import.meta !== 'undefined' && import.meta.env) || {};
        const mediaBase = env?.VITE_MEDIA_BASE_URL;
        if (typeof mediaBase === 'string' && /^https?:\/\//i.test(mediaBase)) {
          return new URL(mediaBase).origin;
        }
        const apiBase = env?.VITE_API_BASE_URL || apiClient?.baseURL;
        if (typeof apiBase === 'string' && /^https?:\/\//i.test(apiBase)) {
          return new URL(apiBase).origin;
        }
      } catch {}
      try {
        return typeof window !== 'undefined' ? window.location.origin : '';
      } catch {
        return '';
      }
    };
    const absoluteUrl = (url) => {
      if (!url || typeof url !== 'string') return '';
      if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;
      const path = url.startsWith('/') ? url : `/${url}`;
      const baseOrigin = getBackendOrigin();
      try {
        return baseOrigin ? new URL(path, baseOrigin).toString() : path;
      } catch {
        return path;
      }
    };
    const pickUrl = (o) => {
      if (!o) return '';
      const keys = [
        'imageUrl',
        'image_url',
        'image',
        'photo',
        'picture',
        'image_path',
        'img',
        'url',
        'path',
        'location',
        'href',
      ];
      for (const k of keys) {
        const v = o?.[k];
        if (!v) continue;
        if (typeof v === 'string') return v;
        if (typeof v === 'object') {
          const nested = pickUrl(v);
          if (nested) return nested;
        }
      }
      return '';
    };
    const normalizeImage = (obj) => absoluteUrl(pickUrl(obj));
    const normalized = Array.isArray(list)
      ? list.map((it) => ({
          ...it,
          image: normalizeImage(it),
        }))
      : [];
    return {
      success: true,
      data: normalized,
      pagination: raw?.pagination || {
        page: 1,
        limit: Array.isArray(list) ? list.length : 0,
        total: Array.isArray(list) ? list.length : 0,
        totalPages: 1,
      },
    };
  }

  async getMenuItemById(itemId) {
    const res = await apiClient.get(`/menu/items/${itemId}`, {
      retry: { retries: 1 },
    });
    const data = res?.data || res;
    return { success: true, data };
  }

  async createMenuItem(itemData) {
    const res = await apiClient.post('/menu/items', itemData, {
      retry: { retries: 1 },
    });
    return { success: true, data: res?.data || res };
  }

  async updateMenuItem(itemId, updates) {
    const res = await apiClient.put(`/menu/items/${itemId}`, updates, {
      retry: { retries: 1 },
    });
    return { success: true, data: res?.data || res };
  }

  async deleteMenuItem(itemId) {
    const res = await apiClient.delete(`/menu/items/${itemId}`, {
      retry: { retries: 1 },
    });
    return { success: true, data: res?.data || true };
  }

  async updateItemAvailability(itemId, available) {
    const res = await apiClient.patch(
      `/menu/items/${itemId}/availability`,
      { available },
      { retry: { retries: 1 } }
    );
    return { success: true, data: res?.data || res };
  }

  async getCategories() {
    const res = await apiClient.get('/menu/categories', {
      retry: { retries: 1 },
    });
    const raw = res?.data || res;
    return { success: true, data: raw?.data || raw };
  }

  async uploadItemImage(itemId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await apiClient.post(`/menu/items/${itemId}/image`, null, {
      body: formData,
      retry: { retries: 1 },
    });
    const getBackendOrigin = () => {
      try {
        const env =
          (typeof import.meta !== 'undefined' && import.meta.env) || {};
        const mediaBase = env?.VITE_MEDIA_BASE_URL;
        if (typeof mediaBase === 'string' && /^https?:\/\//i.test(mediaBase)) {
          return new URL(mediaBase).origin;
        }
        const apiBase = env?.VITE_API_BASE_URL || apiClient?.baseURL;
        if (typeof apiBase === 'string' && /^https?:\/\//i.test(apiBase)) {
          return new URL(apiBase).origin;
        }
      } catch {}
      try {
        return typeof window !== 'undefined' ? window.location.origin : '';
      } catch {
        return '';
      }
    };
    const absoluteUrl = (url) => {
      if (!url || typeof url !== 'string') return '';
      if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;
      const path = url.startsWith('/') ? url : `/${url}`;
      const baseOrigin = getBackendOrigin();
      try {
        return baseOrigin ? new URL(path, baseOrigin).toString() : path;
      } catch {
        return path;
      }
    };
    const pickUrl = (o) => {
      if (!o) return '';
      const keys = [
        'imageUrl',
        'image_url',
        'image',
        'photo',
        'picture',
        'image_path',
        'img',
        'url',
        'path',
        'location',
        'href',
      ];
      for (const k of keys) {
        const v = o?.[k];
        if (!v) continue;
        if (typeof v === 'string') return v;
        if (typeof v === 'object') {
          const nested = pickUrl(v);
          if (nested) return nested;
        }
      }
      return '';
    };
    const raw = res?.data || res || {};
    const imageUrlAbs = absoluteUrl(pickUrl(raw));
    const imageUrl = imageUrlAbs
      ? `${imageUrlAbs}${imageUrlAbs.includes('?') ? '&' : '?'}v=${Date.now()}`
      : '';
    return { success: true, data: { imageUrl } };
  }
}

export const menuService = new MenuService();
export default menuService;
