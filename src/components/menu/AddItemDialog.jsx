import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const AddItemDialog = ({
  open,
  onOpenChange,
  newItem,
  setNewItem,
  onAdd,
  categories = [],
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setNewItem({ ...newItem, imageFile: file, imageUrl: previewUrl });
  };

  const clearImage = () => {
    setNewItem({ ...newItem, imageFile: undefined, imageUrl: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus size={16} /> Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
          <DialogDescription>
            Add a new item to your canteen menu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newItem.name}
              onChange={(e) =>
                setNewItem({ ...newItem, name: e.target.value })
              }
              className="col-span-3"
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              className="col-span-3"
            />
          </div>

          {/* Price with Peso Sign */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <div className="col-span-3 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                ₱
              </span>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={newItem.price === 0 ? '' : newItem.price}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    price:
                      e.target.value === '' ? 0 : parseFloat(e.target.value),
                  })
                }
                className="pl-7 w-full"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={newItem.category}
              onValueChange={(value) =>
                setNewItem({ ...newItem, category: value })
              }
            >
              <SelectTrigger className="col-span-3 w-full h-12 text-base">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="w-[--radix-select-trigger-width]">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-base py-2">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Available Switch */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="available" className="text-right">
              Available
            </Label>
            <Switch
              id="available"
              checked={newItem.available}
              onCheckedChange={(checked) =>
                setNewItem({ ...newItem, available: checked })
              }
            />
          </div>

          {/* Image Upload */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image-file" className="text-right">
              Upload Image
            </Label>
            <Input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>

          {/* Image Preview */}
          {(newItem.imageUrl || newItem.imageFile) && (
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right font-medium pt-1">Preview</div>
              <div className="col-span-3 space-y-2">
                <img
                  src={newItem.imageUrl}
                  alt={newItem.name || 'Preview'}
                  className="h-32 w-full object-cover rounded-md border"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={clearImage}>
                    Remove Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAdd}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
