import React, { useEffect, useMemo, useState } from 'react';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AddComboMealDialog = ({ open, onOpenChange, items = [], onCreate }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sel1, setSel1] = useState('');
  const [sel2, setSel2] = useState('');
  const [sel3, setSel3] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const category = 'Combo Meals'; // static category

  useEffect(() => {
    if (!open) {
      setName('');
      setPrice('');
      setSel1('');
      setSel2('');
      setSel3('');
      setImageFile(null);
      setImageUrl('');
    }
  }, [open]);

  // Only allow items that are not combos
  const options = useMemo(
    () =>
      (items || [])
        .filter((i) => !i.isCombo) // filter out combos
        .map((i) => ({ id: i.id, label: i.name })),
    [items]
  );

  const summary = useMemo(() => {
    const labels = [sel1, sel2, sel3]
      .map((id) => options.find((o) => o.id === id)?.label)
      .filter(Boolean);
    return labels.join(' + ');
  }, [sel1, sel2, sel3, options]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImageUrl('');
  };

  const handleCreate = async () => {
    const chosen = [sel1, sel2, sel3].filter(Boolean);
    if (chosen.length === 0) return;

    const payload = {
      name: name.trim() || `Combo: ${summary}`,
      description: summary ? `Includes ${summary}` : 'Combo meal',
      price: Number(price) || 0,
      category,
      available: true,
      ingredients: chosen,
      comboItems: chosen,
      preparationTime: 0,
      isCombo: true,
      imageFile,
      imageUrl,
    };

    await onCreate?.(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Combo Meal</DialogTitle>
          <DialogDescription>
            Select up to three menu items to include in the combo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="combo-name" className="text-right">
              Name
            </Label>
            <Input
              id="combo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={summary ? `Combo: ${summary}` : 'Combo name'}
              className="col-span-3"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="combo-price" className="text-right">
              Price
            </Label>
            <Input
              id="combo-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="col-span-3"
            />
          </div>

          {/* Item selects */}
          {[sel1, sel2, sel3].map((sel, idx) => (
            <div key={idx} className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Item {idx + 1}</Label>
              <Select value={sel} onValueChange={[setSel1, setSel2, setSel3][idx]}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a menu item" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Category - static */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="combo-category" className="text-right">
              Category
            </Label>
            <Input
              id="combo-category"
              value={category}
              className="col-span-3 bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Image Upload */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="combo-image" className="text-right">
              Upload Image
            </Label>
            <Input
              id="combo-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right font-medium pt-1">Preview</div>
              <div className="col-span-3 space-y-2">
                <img
                  src={imageUrl}
                  alt={name || 'Preview'}
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
          <Button onClick={handleCreate} disabled={!sel1 && !sel2 && !sel3}>
            Create Combo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddComboMealDialog;
