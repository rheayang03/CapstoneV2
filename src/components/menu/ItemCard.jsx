// src/components/menu/ItemCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Image as ImageIcon, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getItemImage = (item) =>
  (item.imageUrl && item.imageUrl.trim() !== '' && item.imageUrl) ||
  (item.image && item.image.trim() !== '' && item.image) ||
  (item.comboItems?.[0]?.imageUrl && item.comboItems[0].imageUrl) ||
  (item.comboItems?.[0]?.image && item.comboItems[0].image) ||
  null;

const ItemCard = ({ item, onEdit, onDelete, onToggleAvailability }) => {
  const isAvailable = Boolean(item.available);
  const imageSrc = getItemImage(item);

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 ${
        !isAvailable ? 'bg-gray-100' : ''
      } hover:shadow-lg hover:scale-[1.02]`}
    >
      <CardHeader className="p-3 pb-0 space-y-1 relative">
        {/* Image */}
        <div className="mb-2 relative">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={item.name}
              className={`w-full h-24 sm:h-28 md:h-32 lg:h-36 object-cover rounded-sm border transition-all ${
                !isAvailable ? 'grayscale opacity-70' : ''
              }`}
            />
          ) : (
            <div className="w-full h-24 sm:h-28 md:h-32 lg:h-36 flex items-center justify-center rounded-sm border bg-muted text-muted-foreground">
              <ImageIcon className="w-6 h-6" />
              <span className="ml-2 text-xs">No Image</span>
            </div>
          )}
        </div>

        {/* Name + 3-dots menu */}
        <CardTitle className="text-base font-semibold leading-tight truncate flex items-center justify-between">
          <span className={!isAvailable ? 'text-gray-500' : ''}>
            {item.name}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  onToggleAvailability?.(item.id, !isAvailable)
                }
              >
                {isAvailable ? 'Mark as Unavailable' : 'Mark as Available'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>

        {/* Description */}
        <CardDescription
          className={`text-xs line-clamp-2 min-h-[1.5rem] ${
            !isAvailable ? 'text-gray-500' : ''
          }`}
        >
          {item.description || '\u00A0'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-3 pt-1">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`font-semibold text-base ${
              !isAvailable ? 'text-gray-500' : ''
            }`}
          >
            ₱{Number(item.price).toFixed(2)}
          </span>

          {/* Availability Badge */}
          <div
            className={`text-[10px] font-semibold px-2 py-1 rounded-full select-none text-center cursor-default ${
              isAvailable
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {isAvailable ? 'Available' : 'Unavailable'}
          </div>
        </div>

        <p
          className={`text-xs ${
            !isAvailable ? 'text-gray-500' : 'text-muted-foreground'
          }`}
        >
          Category:{' '}
          {item.category || (item.isCombo ? 'Combo Meal' : 'Uncategorized')}
        </p>
      </CardContent>

      <CardFooter className="p-3 pt-4 flex justify-end gap-2 border-t border-gray-300">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => onEdit(item)}
        >
          <Edit className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDelete(item.id)}
          aria-label={`Delete ${item.name}`}
          title={`Delete ${item.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;
