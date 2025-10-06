import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CateringMenuSelection from './CateringMenuSelection';
import CurrentCateringOrder from './CurrentCateringOrder';

export const MenuItemsModal = ({
  open,
  onOpenChange,
  event,
  menuItems,
  onUpdateMenuItems,
  readOnly = false, 
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [paymentType, setPaymentType] = useState('downpayment');
  const [amountPaid, setAmountPaid] = useState('');
  const [saving, setSaving] = useState(false);

  const categoryGroups = useMemo(() => {
    const groups = new Map();
    (menuItems || []).forEach((item) => {
      const groupName = (item.category || 'General').toString();
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName).push({ ...item, categoryName: groupName });
    });
    return Array.from(groups.entries())
      .map(([name, items]) => ({ id: name, name, items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems]);

  useEffect(() => {
    if (categoryGroups.length === 0) {
      return;
    }
    if (activeCategory !== 'all' && !categoryGroups.some((cat) => cat.id === activeCategory)) {
      setActiveCategory(categoryGroups[0].id);
    }
  }, [categoryGroups, activeCategory]);

  // Filter menu items by category
  // Initialize selected items if event already has menu
  useEffect(() => {
    if (event?.menuItems) {
      setSelectedItems(
        event.menuItems.map((item, index) => {
          const quantity = Number(item.quantity ?? 0) || 0;
          const rawPrice = Number(item.price ?? 0);
          const unitPrice = Number(
            item.unitPrice ?? (quantity > 0 ? rawPrice / quantity : rawPrice)
          ) || 0;
          return {
            id: `order-item-${item.menuItemId || item.id || index}`,
            menuItemId: String(item.menuItemId || item.id || ''),
            name: item.name || '',
            price: unitPrice,
            quantity: quantity || 1,
          };
        })
      );
    } else {
      setSelectedItems([]);
    }
  }, [event]);

  const addToOrder = (menuItem) => {
    if (readOnly) return; // Disable adding for readOnly events
    setSelectedItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(item => item.menuItemId === menuItem.id);
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        return [
          ...prevItems,
          {
            id: `order-item-${menuItem.id}-${Date.now()}`,
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: Number(menuItem.price ?? menuItem.unitPrice ?? 0),
            quantity: 1,
          },
        ];
      }
    });
  };

  const updateQuantity = (itemId, change) => {
    if (readOnly) return; // Disable editing for readOnly events
    setSelectedItems((prevItems) =>
      prevItems
        .map((item) => item.id === itemId ? { ...item, quantity: Math.max(item.quantity + change, 0) } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (itemId) => {
    if (readOnly) return; // Disable removing for readOnly events
    setSelectedItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const clearOrder = () => {
    if (readOnly) return;
    setSelectedItems([]);
    setAmountPaid('');
  };

  const calculateSubtotal = () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculateDownpayment = () => calculateSubtotal() * 0.5;
  const calculateBalance = () => {
    const subtotal = calculateSubtotal();
    const paidAmount = parseFloat(amountPaid) || 0;
    return subtotal - paidAmount;
  };

  const handleSave = async () => {
    if (readOnly || !event) return; // Prevent saving for readOnly
    const eventMenuItems = selectedItems.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      price: item.price * item.quantity,
    }));
    try {
      setSaving(true);
      await onUpdateMenuItems(event.id, eventMenuItems);
      onOpenChange(false);
      clearOrder();
    } catch (error) {
      console.error('Failed to update catering menu items', error);
    } finally {
      setSaving(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 h-[calc(90vh-200px)]">
          <div className="lg:col-span-2">
            <CateringMenuSelection
              categories={categoryGroups}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAddToOrder={addToOrder}
              eventName={event.name}
              attendees={event.attendees}
              readOnly={readOnly} // Pass down readOnly
            />
          </div>

          <div className="lg:col-span-1">
            <CurrentCateringOrder
              selectedItems={selectedItems}
              paymentType={paymentType}
              amountPaid={amountPaid}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearOrder={clearOrder}
              onPaymentTypeChange={setPaymentType}
              onAmountPaidChange={setAmountPaid}
              calculateSubtotal={calculateSubtotal}
              calculateDownpayment={calculateDownpayment}
              calculateBalance={calculateBalance}
              readOnly={readOnly} // Disable controls for readOnly
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!readOnly && (
            <Button
              onClick={handleSave}
              disabled={selectedItems.length === 0 || saving}
            >
              Save Menu Items & Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
