import { useState, useEffect } from 'react';
import menuService from '@/api/services/menuService';
import { toast } from 'sonner';

export const useMenuItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await menuService.getMenuItems();
      setItems(res?.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch menu items';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async (item) => {
    try {
      const res = await menuService.createMenuItem(item);
      const newItem = res?.data || res;
      setItems((prev) => [...prev, newItem]);
      toast.success('Menu item added successfully');
      return newItem;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add menu item';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateMenuItem = async (id, updates) => {
    try {
      const res = await menuService.updateMenuItem(id, updates);
      const updatedItem = res?.data || res;
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
      toast.success('Menu item updated successfully');
      return updatedItem;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update menu item';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await menuService.deleteMenuItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Menu item deleted successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete menu item';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return {
    items,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refetch: fetchMenuItems,
  };
};
