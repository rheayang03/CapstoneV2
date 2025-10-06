import React from 'react';
import AddItemModal from '@/components/inventory/AddItemModal';
import EditItemModal from '@/components/inventory/EditItemModal';

const InventoryModals = ({
  showAddModal,
  setShowAddModal,
  showEditModal,
  setShowEditModal,
  editingItem,
  onAddItem,
  onEditItem,
}) => {
  return (
    <>
      <AddItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAddItem={onAddItem}
      />

      <EditItemModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        item={editingItem}
        onEditItem={onEditItem}
      />
    </>
  );
};

export default InventoryModals;

