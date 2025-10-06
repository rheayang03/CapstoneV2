import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const EditItemModal = ({ open, onOpenChange, item, onEditItem }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const categories = [
    'Grains',
    'Meat',
    'Vegetables',
    'Dairy',
    'Condiments',
    'Baking',
    'Fruits',
  ];

  const units = [
    'kg',
    'g',
    'lbs',
    'oz',
    'liters',
    'ml',
    'pieces',
    'boxes',
    'cans',
    'bottles',
    'bags',
    'cups',
  ];

  useEffect(() => {
    if (item) {
      reset(item);
      setValue('category', item.category);
      setValue('unit', item.unit);
    }
  }, [item, reset, setValue]);

  const onSubmit = (data) => {
    if (!item) return;

    const updatedItem = {
      ...data,
      id: item.id,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    onEditItem(updatedItem);
    onOpenChange(false);
    toast.success(`${data.name} has been updated`);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update the details for {item.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                {...register('name', { required: 'Item name is required' })}
              />
              {errors.name && (
                <span className="text-sm text-destructive">
                  {errors.name.message}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                defaultValue={item.category}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                {...register('currentStock', {
                  required: 'Current stock is required',
                  min: { value: 0, message: 'Stock cannot be negative' },
                })}
              />
              {errors.currentStock && (
                <span className="text-sm text-destructive">
                  {errors.currentStock.message}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="minThreshold">Minimum Stock</Label>
              <Input
                id="minThreshold"
                type="number"
                {...register('minThreshold', {
                  required: 'Minimum threshold is required',
                  min: { value: 0, message: 'Threshold cannot be negative' },
                })}
              />
              {errors.minThreshold && (
                <span className="text-sm text-destructive">
                  {errors.minThreshold.message}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                defaultValue={item.unit}
                onValueChange={(value) => setValue('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                {...register('supplier', { required: 'Supplier is required' })}
              />
              {errors.supplier && (
                <span className="text-sm text-destructive">
                  {errors.supplier.message}
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Update Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemModal;