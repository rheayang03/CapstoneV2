import { useEffect, useState, useCallback } from 'react';
import menuService from '@/api/services/menuService';
import { toast } from 'sonner';

export const usePOSData = () => {
  const [orderHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderQueue, setOrderQueue] = useState([]);

  const loadMenu = useCallback(async () => {
    try {
      const [catsRes, itemsRes] = await Promise.all([
        menuService.getCategories(),
        menuService.getMenuItems({ available: true, limit: 500 }),
      ]);
      // Normalize helpers
      const getCatName = (c) => {
        if (typeof c === 'string') return c;
        if (!c || typeof c !== 'object') return String(c || '');
        return c.name || c.label || c.title || c.slug || c.id || String(c);
      };
      // Normalize items and ensure category is a string
      const toImage = (obj) => {
        const cands = [obj?.image, obj?.imageUrl, obj?.photo, obj?.picture];
        for (const c of cands) {
          if (typeof c === 'string' && c) return c;
        }
        return null;
      };
      const items = (itemsRes?.data || []).map((it) => {
        const catName = getCatName(it.category) || 'General';
        return {
          id: it.id,
          name: it.name,
          description: it.description || '',
          price: Number(it.price || 0),
          category: String(catName),
          available: !!it.available,
          image: toImage(it),
        };
      });

      // Aggregate category names from API and from items to be safe
      const rawCats = (catsRes?.data || []).map(getCatName);
      const catSet = new Set(
        [...rawCats, ...items.map((it) => it.category)]
          .map((s) => String(s || '').trim())
          .filter(Boolean)
      );

      // Build category list with 'All' first
      const byCat = new Map();
      // 'All' category contains all items
      byCat.set('All', { id: 'all', name: 'All', items: [...items] });

      Array.from(catSet)
        .sort((a, b) => a.localeCompare(b))
        .forEach((name) => {
          if (name === 'All') return;
          byCat.set(name, { id: name, name, items: [] });
        });

      items.forEach((it) => {
        const name = it.category || 'General';
        if (!byCat.has(name)) byCat.set(name, { id: name, name, items: [] });
        byCat.get(name).items.push(it);
      });

      const grouped = Array.from(byCat.values());
      setCategories(grouped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load menu';
      toast.error(msg);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Auto-refresh when menu items are created/updated/images uploaded elsewhere
  useEffect(() => {
    const handler = () => {
      loadMenu();
    };
    try {
      window?.addEventListener?.('menu.items.updated', handler);
    } catch {}
    return () => {
      try {
        window?.removeEventListener?.('menu.items.updated', handler);
      } catch {}
    };
  }, [loadMenu]);

  return {
    orderHistory,
    categories,
    orderQueue,
    setOrderQueue,
  };
};
