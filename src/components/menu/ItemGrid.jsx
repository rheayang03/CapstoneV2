// src/components/menu/ItemGrid.jsx
import React from 'react';
import ItemCard from './ItemCard';

const ItemGrid = ({ items, onEdit, onDelete, onToggleAvailability, showCategory = false }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={showCategory ? item : { ...item }}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleAvailability={onToggleAvailability} // <-- forward it
        />
      ))}
    </div>
  );
};

export default ItemGrid;
