import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import InventoryRecentActivity from '@/components/inventory/InventoryRecentActivity';
import { toast } from 'sonner';
import InventoryHeader from '@/components/inventory/InventoryHeader';
import InventoryFilters from '@/components/inventory/InventoryFilters';
import InventoryTabs from '@/components/inventory/InventoryTabs';
import InventoryFooter from '@/components/inventory/InventoryFooter';
import InventoryModals from '@/components/inventory/InventoryModals';
import {
  useInventoryManagement,
  useInventoryActivities,
} from '@/hooks/useInventoryManagement';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Build stable params for list query
  const listParams = useMemo(
    () => ({
      search: searchTerm,
      category: selectedCategory === 'all' ? '' : selectedCategory,
    }),
    [searchTerm, selectedCategory]
  );
  const {
    items,
    createInventoryItem,
    updateInventoryItem,
    updateStock,
    refetch: refetchInventory,
  } = useInventoryManagement(listParams);
  const [disabledMap, setDisabledMap] = useState({});

  // Recent activity (DB)
  const activityParams = useMemo(() => ({ limit: 8 }), []);
  const {
    activities: recentActivities,
    loading: recentLoading,
    refetch: refetchActivities,
  } = useInventoryActivities(activityParams, {
    auto: true,
    debounceMs: 400,
    cacheTtlMs: 30000,
  });

  const refreshInventoryData = useCallback(() => {
    refetchInventory();
    refetchActivities({ force: true });
  }, [refetchInventory, refetchActivities]);

  const categories = [
    'Grains',
    'Meat',
    'Vegetables',
    'Dairy',
    'Condiments',
    'Baking',
    'Fruits',
  ];

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const mapped = (items || []).map((it) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      currentStock: it.quantity ?? 0,
      minThreshold: it.minStock ?? 0,
      unit: it.unit,
      supplier: it.supplier || '',
      disabled: !!disabledMap[it.id],
      lastUpdated: it.updatedAt || it.lastRestocked || '',
    }));
    return mapped.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        (item.supplier || '').toLowerCase().includes(term);
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, disabledMap, searchTerm, selectedCategory]);

  const getStockPercentage = (current, threshold) =>
    Math.min(100, Math.round((current / (threshold * 2)) * 100));
  const getStockBadgeVariant = (current, threshold) =>
    current <= threshold * 0.5
      ? 'destructive'
      : current <= threshold
        ? 'warning'
        : 'success';
  const getStockStatusText = (current, threshold) =>
    current <= threshold * 0.5
      ? 'Critical'
      : current <= threshold
        ? 'Low'
        : current >= threshold * 2
          ? 'Overstocked'
          : 'Good';

  const handleAddItem = useCallback(
    async (newItem) => {
      const initialQty = Number(newItem.currentStock ?? 0);
      // Create item (backend now also mirrors initial quantity into ledger, but we set quantity explicitly just in case)
      const payload = {
        name: newItem.name,
        category: newItem.category,
        quantity: initialQty,
        minStock: Number(newItem.minThreshold ?? 0),
        unit: newItem.unit,
        supplier: newItem.supplier,
      };
      const created = await createInventoryItem(payload);
      refreshInventoryData();
      // No extra call needed since backend mirrors initial quantity into ledger and response includes authoritative quantity
      return created;
    },
    [createInventoryItem, refreshInventoryData]
  );

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setShowEditModal(true);
  }, []);

  const handleUpdateItem = useCallback(
    async (updatedItem) => {
      const newQty = Number(updatedItem.currentStock ?? 0);
      const prevQty = Number(
        (editingItem && editingItem.currentStock) ?? newQty
      );
      // First update metadata (exclude quantity which is ledger-driven)
      const metaPayload = {
        name: updatedItem.name,
        category: updatedItem.category,
        minStock: Number(updatedItem.minThreshold ?? 0),
        unit: updatedItem.unit,
        supplier: updatedItem.supplier,
      };
      await updateInventoryItem(updatedItem.id, metaPayload);
      // Then, if stock changed, write through stock endpoint using 'set'
      if (!Number.isNaN(newQty) && newQty !== prevQty) {
        await updateStock(updatedItem.id, newQty, 'set');
      }
      refreshInventoryData();
    },
    [updateInventoryItem, editingItem, refreshInventoryData]
  );

  const handleDisableItem = useCallback((itemId, itemName) => {
    setDisabledMap((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      const disabled = !!next[itemId];
      toast.success(
        `${itemName} has been ${disabled ? 'disabled' : 'enabled'}`
      );
      return next;
    });
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Left: Raw Materials Inventory */}
      <div className="md:col-span-2 space-y-4">
        <Card>
          <InventoryHeader onAddItem={() => setShowAddModal(true)} />
          <CardContent className="space-y-4">
            <InventoryFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
            />

            <InventoryTabs
              filteredItems={filteredItems}
              onEditItem={handleEditItem}
              onDisableItem={handleDisableItem}
              getStockPercentage={useCallback(getStockPercentage, [])}
              getStockBadgeVariant={useCallback(getStockBadgeVariant, [])}
              getStockStatusText={useCallback(getStockStatusText, [])}
            />
          </CardContent>
          <InventoryFooter
            filteredCount={filteredItems.length}
            totalCount={(items || []).length}
          />
        </Card>
      </div>

      {/* Right: Recent Inventory Activity (beside) */}
      <div className="space-y-4">
        <InventoryRecentActivity
          recentActivities={recentActivities}
          loading={recentLoading}
          onRefresh={() => refetchActivities({ force: true })}
        />
      </div>

      <InventoryModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editingItem={editingItem}
        onAddItem={handleAddItem}
        onEditItem={handleUpdateItem}
      />
    </div>
  );
};

export default Inventory;