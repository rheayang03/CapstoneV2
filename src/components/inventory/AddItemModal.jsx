import React, { useState } from 'react';
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
import clsx from 'clsx';

const AddItemModal = ({ open, onOpenChange, onAddItem }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = useForm({
    mode: 'onSubmit',
  });

  const [isOtherCategory, setIsOtherCategory] = useState(false);

  const categories = [
    'Grains',
    'Meat',
    'Vegetables',
    'Fruits',
    'Dairy',
    'Seafood',
    'Condiments & Sauces',
    'Spices & Seasonings',
    'Baking & Pastry',
    'Snacks',
    'Beverages',
    'Canned & Preserved Goods',
    'Frozen Foods',
    'Oils & Fats',
    'Eggs & Poultry',
    'Noodles & Pasta',
    'Bread & Bakery',
    'Cleaning Supplies',
    'Paper & Packaging',
  ];

  const units = [
    'kg',
    'g',
    'lbs',
    'oz',
    'liters',
    'ml',
    'pieces',
    'packs',
    'boxes',
    'cans',
    'bottles',
    'bags',
    'cups',
    'trays',
    'dozen',
    'sachets',
    'rolls',
    'tubs',
    'jars',
    'pouches',
  ];

  const selectedCategory = watch('category');

  const onSubmit = (data) => {
    onAddItem(data);
    reset();
    setIsOtherCategory(false);
    onOpenChange(false);
    toast.success(`${data.name} has been added to inventory`);
  };

  const handleCancel = () => {
    reset();
    setIsOtherCategory(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Add New Inventory Item
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-700">
            Enter the details for the new inventory item.
          </DialogDescription>

          {/* Divider line */}
          <div className="mt-2 border-t border-gray-400" />
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Item Name */}
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Item name is required' })}
              placeholder="e.g., Rice"
              className={clsx(
                isSubmitted && errors.name && 'border-destructive'
              )}
            />
            {isSubmitted && errors.name && (
              <span className="text-sm text-destructive">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) => {
                  if (value === 'Other') {
                    setIsOtherCategory(true);
                    setValue('category', '', { shouldValidate: true });
                  } else {
                    setIsOtherCategory(false);
                    setValue('category', value, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger
                  id="category"
                  className={clsx(
                    'border',
                    isSubmitted && errors.category && 'border-destructive'
                  )}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {isOtherCategory && (
                <div className="mt-2">
                  <Input
                    placeholder="Type new category"
                    {...register('category', {
                      required: 'Category is required',
                    })}
                    className={clsx(
                      isSubmitted && errors.category && 'border-destructive'
                    )}
                  />
                </div>
              )}
              {isSubmitted && errors.category && (
                <span className="text-sm text-destructive">
                  {errors.category.message}
                </span>
              )}
            </div>

            {/* Unit */}
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                onValueChange={(value) =>
                  setValue('unit', value, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  id="unit"
                  className={clsx(
                    'border',
                    isSubmitted && errors.unit && 'border-destructive'
                  )}
                >
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSubmitted && errors.unit && (
                <span className="text-sm text-destructive">
                  {errors.unit.message}
                </span>
              )}
            </div>
          </div>

          {/* Current Stock & Min Threshold */}
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
                placeholder="0"
                className={clsx(
                  isSubmitted && errors.currentStock && 'border-destructive'
                )}
              />
              {isSubmitted && errors.currentStock && (
                <span className="text-sm text-destructive">
                  {errors.currentStock.message}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="minThreshold">Min Threshold</Label>
              <Input
                id="minThreshold"
                type="number"
                {...register('minThreshold', {
                  required: 'Minimum threshold is required',
                  min: { value: 0, message: 'Threshold cannot be negative' },
                })}
                placeholder="0"
                className={clsx(
                  isSubmitted && errors.minThreshold && 'border-destructive'
                )}
              />
              {isSubmitted && errors.minThreshold && (
                <span className="text-sm text-destructive">
                  {errors.minThreshold.message}
                </span>
              )}
            </div>
          </div>

          {/* Supplier */}
          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              {...register('supplier', { required: 'Supplier is required' })}
              placeholder="e.g., Global Foods"
              className={clsx(
                isSubmitted && errors.supplier && 'border-destructive'
              )}
            />
            {isSubmitted && errors.supplier && (
              <span className="text-sm text-destructive">
                {errors.supplier.message}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="hover:bg-gray-300 hover:text-gray-900 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-300 hover:shadow-lg transition-all"
            >
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemModal;
