// src/pages/MenuManagement.jsx
import React, { useState, useEffect } from 'react';
import useMenuManagement, { useMenuCategories } from '@/hooks/useMenuManagement';
import AddItemDialog from '@/components/menu/AddItemDialog';
import AddCategoryDialog from '@/components/menu/AddCategoryDialog';
import AddComboMealDialog from '@/components/menu/AddComboMealDialog';
import EditItemDialog from '@/components/menu/EditItemDialog';
import CategoryTabs from '@/components/menu/CategoryTabs';
import ManageCategoriesDialog from '@/components/menu/ManageCategoriesDialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const MenuManagement = () => {
  const {
    items: fetchedItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadItemImage,
  } = useMenuManagement();
  const { categories: categoryRows } = useMenuCategories();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
    imageUrl: '',
    imageFile: null,
  });
  const [editingItem, setEditingItem] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  // Sync categories
  useEffect(() => {
    setCategories((categoryRows || []).map((c) => c.name));
  }, [categoryRows]);

  // Sync fetched items but preserve existing image if backend doesn’t send one
  useEffect(() => {
  setItems((prev) =>
    (fetchedItems || []).map((it) => {
      const existing = prev.find((p) => p.id === it.id);
      return {
        ...it,
        available: it.available, 
        imageUrl:
          it.imageUrl && it.imageUrl.trim() !== ''
            ? it.imageUrl
            : existing?.imageUrl || it.image || '',
        isCombo: it.isCombo || it.category === 'Combo Meals',
      };
    })
  );
}, [fetchedItems]);


  const handleToggleAvailability = async (id, newStatus) => {
  setItems((prev) =>
    prev.map((i) =>
      i.id === id
        ? {
            ...i,
            available: newStatus,
          }
        : i
    )
  );
  try {
    await updateMenuItem(id, { available: newStatus });
  } catch (e) {
    toast.error(e?.message || 'Failed to update availability');
  }
};


  // Add new item
  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      const payload = {
        name: newItem.name,
        description: newItem.description,
        price: Number(newItem.price) || 0,
        category: newItem.category,
        available: Boolean(newItem.available),
        ingredients: [],
        preparationTime: 0,
        imageUrl: newItem.imageUrl,
      };

      const created = await createMenuItem(payload);

      if (newItem.imageFile && created?.id) {
        await uploadItemImage(created.id, newItem.imageFile);
      }

      setNewItem({
        name: '',
        description: '',
        price: 0,
        category: '',
        available: true,
        imageUrl: '',
        imageFile: null,
      });
      setDialogOpen(false);
    } catch (e) {
      toast.error(e?.message || 'Failed to add menu item');
    }
  };

  // Add combo meal
  const handleAddCombo = async (payload) => {
    try {
      const created = await createMenuItem(payload);

      if (payload.imageFile && created?.id) {
        await uploadItemImage(created.id, payload.imageFile);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to create combo meal');
    }
  };

  // Edit item
  const handleEditItem = async () => {
    try {
      if (!editingItem) return;

      const updates = {
        name: editingItem.name,
        description: editingItem.description,
        price: Number(editingItem.price) || 0,
        category: editingItem.category,
        available: Boolean(editingItem.available),
        ...(editingItem.imageUrl ? { imageUrl: editingItem.imageUrl } : {}),
      };

      await updateMenuItem(editingItem.id, updates);

      if (editingItem.imageFile) {
        await uploadItemImage(editingItem.id, editingItem.imageFile);
      }

      setEditingItem(null);
    } catch (e) {
      toast.error(e?.message || 'Failed to update menu item');
    }
  };

  // Delete item
  const handleDeleteItem = async (id) => {
    try {
      await deleteMenuItem(id);
    } catch (e) {
      toast.error(e?.message || 'Failed to delete menu item');
    }
  };

  const handleDeleteCategory = (categoryName) => {
    if (newItem.category === categoryName) {
      setNewItem((prev) => ({ ...prev, category: '' }));
    }
    setCategories(categories.filter((c) => c !== categoryName));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Menu Management</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManageCategoriesOpen(true)}
          >
            Manage Categories
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryDialogOpen(true)}
          >
            + Add Category
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setComboDialogOpen(true)}
          >
            + Add Combo Meal
          </Button>
          <AddItemDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            newItem={newItem}
            setNewItem={setNewItem}
            onAdd={handleAddItem}
            categories={categories}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        items={items}
        categories={categories}
        onEdit={(it) => setEditingItem(it)}
        onDelete={handleDeleteItem}
        onToggleAvailability={handleToggleAvailability}
      />

      {/* Edit Item Dialog */}
      <EditItemDialog
        item={editingItem}
        setItem={setEditingItem}
        onSave={handleEditItem}
        onClose={() => setEditingItem(null)}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onConfirm={(catName) => {
          if (!categories.includes(catName)) {
            setCategories([...categories, catName]);
          }
          setNewItem((prev) => ({ ...prev, category: catName }));
          setCategoryDialogOpen(false);
          setDialogOpen(true);
        }}
      />

      {/* Manage Categories Dialog */}
      <ManageCategoriesDialog
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        categories={categories}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Add Combo Meal Dialog */}
      <AddComboMealDialog
        open={comboDialogOpen}
        onOpenChange={setComboDialogOpen}
        items={items.filter((i) => !i.isCombo)} // combos cannot include other combos
        onCreate={handleAddCombo}
      />
    </div>
  );
};

export default MenuManagement;
