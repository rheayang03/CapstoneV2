// src/components/menu/ItemList.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';

const getItemImage = (item) =>
  (item.imageUrl && item.imageUrl.trim() !== '' && item.imageUrl) ||
  (item.image && item.image.trim() !== '' && item.image) ||
  (item.comboItems?.[0]?.imageUrl && item.comboItems[0].imageUrl) ||
  (item.comboItems?.[0]?.image && item.comboItems[0].image) ||
  null;

const ItemList = ({ items, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const imageSrc = getItemImage(item);
        const isAvailable = Boolean(item.available);

        return (
          <div
            key={item.id}
            className={`flex items-center gap-4 p-4 border rounded-lg shadow-sm transition-all duration-200 ${
              !isAvailable ? 'opacity-50' : ''
            } hover:shadow-lg hover:scale-[1.01] hover:border-gray-400`}
          >
            {/* Image */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3
                className={`font-semibold ${
                  !isAvailable ? 'text-gray-500' : ''
                }`}
              >
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {item.description}
              </p>
              <p
                className={`text-sm font-medium mt-1 ${
                  !isAvailable ? 'text-gray-500' : ''
                }`}
              >
                ₱{Number(item.price).toFixed(2)}
              </p>

              {/* ✅ Uniform badge styling like grid */}
              <div
                className={`inline-block text-[10px] font-semibold px-2 py-1 rounded-full mt-2 ${
                  isAvailable
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {isAvailable ? 'Available' : 'Unavailable'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(item)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant={isAvailable ? 'secondary' : 'default'}
                size="sm"
                onClick={() => onToggleAvailability(item.id, !isAvailable)}
              >
                {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ItemList;
