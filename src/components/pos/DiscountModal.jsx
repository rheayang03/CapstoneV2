import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Percent, DollarSign, X } from 'lucide-react';

const DiscountModal = ({
  isOpen,
  onClose,
  discountInput,
  setDiscountInput,
  discountType,
  setDiscountType,
  onApplyDiscount,
  calculateSubtotal,
}) => {
  const [show, setShow] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      // Delay unmount for animation
      const timeout = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!show) return null;

  const handleClose = () => {
    onClose();
    setDiscountInput('');
  };

  const subtotal = calculateSubtotal();
  const discountValue = parseFloat(discountInput) || 0;
  const pct = Math.max(0, Math.min(100, discountValue));
  const discountAmount =
    discountInput === ''
      ? 0
      : discountType === 'percentage'
        ? (subtotal * pct) / 100
        : Math.min(discountValue, subtotal);
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Card
        className={`w-full max-w-md relative mx-4 transform transition-transform duration-200 ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-2 right-2 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Header */}
        <CardHeader className="pb-2 mb-4">
          <div>
            <CardTitle>Apply Discount</CardTitle>
            <CardDescription>Enter discount details</CardDescription>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-4 mb-2">
          <div className="flex gap-2">
            <button
              className={`flex-1 p-3 rounded-md border text-sm ${
                discountType === 'percentage'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent'
              }`}
              onClick={() => setDiscountType('percentage')}
              type="button"
            >
              <Percent className="h-4 w-4 mx-auto mb-1" />
              Percentage
            </button>
            <button
              className={`flex-1 p-3 rounded-md border text-sm ${
                discountType === 'fixed'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent'
              }`}
              onClick={() => setDiscountType('fixed')}
              type="button"
            >
              <DollarSign className="h-4 w-4 mx-auto mb-1" />
              Fixed Amount
            </button>
          </div>

          <Input
            type="number"
            placeholder={
              discountType === 'percentage'
                ? 'Enter percentage (0-100)'
                : 'Enter amount (₱)'
            }
            value={discountInput}
            onChange={(e) => setDiscountInput(e.target.value)}
            min="0"
            max={discountType === 'percentage' ? '100' : undefined}
          />

          {discountType === 'percentage' && discountValue > 100 && (
            <p className="text-xs text-red-500">⚠️ Maximum discount is 100%</p>
          )}

          {discountInput && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                <strong>Preview:</strong>
              </p>
              <p className="text-sm">Subtotal: ₱{subtotal.toFixed(2)}</p>
              <p className="text-sm text-green-600">
                Discount: -₱{discountAmount.toFixed(2)}
              </p>
              <p className="text-sm font-semibold">
                Total: ₱{total.toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex gap-3 pt-3">
          <Button className="flex-[3] rounded-full" onClick={onApplyDiscount}>
            Apply Discount
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={handleClose}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DiscountModal;
