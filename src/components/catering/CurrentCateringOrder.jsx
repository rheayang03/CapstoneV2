import React from 'react';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign } from 'lucide-react';

const CurrentCateringOrder = ({
  selectedItems,
  paymentType,
  amountPaid,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onPaymentTypeChange,
  onAmountPaidChange,
  calculateSubtotal,
  calculateDownpayment,
  calculateBalance,
}) => {
  const subtotal = calculateSubtotal();
  const downpayment = calculateDownpayment();
  const expectedAmount = paymentType === 'full' ? subtotal : downpayment;
  const paidAmount = parseFloat(amountPaid) || 0;
  const balance = calculateBalance();

  return (
    <Card className="h-full flex flex-col shadow-2xl">
      {/* Header */}
      <CardHeader className="bg-gray-50 shadow-md">
        <CardTitle className="flex items-center gap-2 text-3xl font-bold text-black">
          <ShoppingCart className="h-6 w-6 text-black" />
          Selected Items
        </CardTitle>
        <CardDescription className="text-gray-500 border-b border-gray-300 pb-2">
          Catering Event Order
        </CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 overflow-auto p-4 bg-white rounded-b-lg shadow-inner space-y-4">
        {selectedItems.length > 0 ? (
          <>
            <div className="border rounded-md divide-y divide-gray-200 shadow-sm">
              {selectedItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex justify-between items-center px-3 py-2 transition-colors ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } hover:bg-gray-100 rounded-md`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">₱{item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Section */}
            <div className="border-t pt-4 space-y-4">
              <div>
                <Label className="text-base font-medium">Payment Options</Label>
                <RadioGroup
                  value={paymentType}
                  onValueChange={(value) => onPaymentTypeChange(value)}
                  className="mt-2 space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">
                      Full Payment (₱{subtotal.toFixed(2)})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="downpayment" id="downpayment" />
                    <Label htmlFor="downpayment">
                      50% Down Payment (₱{downpayment.toFixed(2)})
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="amountPaid"
                    type="number"
                    placeholder="0.00"
                    value={amountPaid}
                    onChange={(e) => onAmountPaidChange(e.target.value)}
                    className="pl-8"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Cost:</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    Required (
                    {paymentType === 'full'
                      ? 'Full Payment'
                      : '50% Down Payment'}
                    ):
                  </span>
                  <span>₱{expectedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount Paid:</span>
                  <span
                    className={
                      paidAmount >= expectedAmount
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    ₱{paidAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Balance:</span>
                  <span
                    className={balance <= 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    ₱{balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-400">No items selected</p>
            <p className="text-xs text-gray-400 mt-1">Select menu items to begin</p>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      {selectedItems.length > 0 && (
        <CardFooter className="border-t pt-4">
          <Button className="w-full shadow-md" variant="outline" onClick={onClearOrder}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Items
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default CurrentCateringOrder;
