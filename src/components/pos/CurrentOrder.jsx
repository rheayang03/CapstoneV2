import React, { useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Tag,
  Receipt,
} from 'lucide-react';

const CurrentOrder = ({
  currentOrder,
  discount,
  orderNumber,
  onUpdateQuantity,
  onRemoveFromOrder,
  onClearOrder,
  onRemoveDiscount,
  calculateSubtotal,
  calculateDiscountAmount,
  calculateTotal,
  onOpenPaymentModal,
  onOpenDiscountModal,
  onOpenHistoryModal,
}) => {
  const hasOrderItems = Array.isArray(currentOrder) && currentOrder.length > 0;
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const isNearBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 50;

      if (isNearBottom) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [currentOrder]);

  if (!hasOrderItems) return null;

  return (
    <div className="md:col-span-1 md:self-start">
      <Card className="flex flex-col md:max-h-[760px] shadow-md border">
        {/* Header */}
        <CardHeader className="bg-blue-50 border-b z-10">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Current Order
          </CardTitle>
          <CardDescription className="italic text-gray-600">
            Order #{orderNumber}
          </CardDescription>
        </CardHeader>

        {/* Scrollable Items */}
        <ScrollArea className="flex-1 relative rounded border">
          <div
            ref={scrollRef}
            className="p-4 pb-20 space-y-3 max-h-[500px] overflow-y-auto"
          >
            {currentOrder.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onRemoveFromOrder(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₱{item.price.toFixed(2)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Subtotal & Discount */}
        <CardContent className="border-t pt-4">
          <div className="bg-gray-100 p-3 rounded-md space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span>₱{calculateSubtotal().toFixed(2)}</span>
            </div>

            {discount.value > 0 && (
              <div className="flex justify-between text-sm font-medium text-green-600">
                <span>
                  Discount (
                  {discount.type === 'percentage'
                    ? `${discount.value}%`
                    : `₱${discount.value}`}
                  )
                </span>
                <span>-₱{calculateDiscountAmount().toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <span className="text-lg font-bold text-primary">Total</span>
            <span className="text-lg font-bold text-primary">
              ₱{calculateTotal().toFixed(2)}
            </span>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="border-t pt-4 flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              size="sm"
              variant="default"
              disabled={!hasOrderItems}
              onClick={onOpenPaymentModal}
            >
              <CreditCard className="h-4 w-4 mr-1" /> Pay
            </Button>
            <Button
              className="flex-1"
              size="sm"
              variant="outline"
              disabled={!hasOrderItems}
              onClick={onClearOrder}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" size="sm" onClick={onOpenDiscountModal}>
              <Tag className="h-4 w-4 mr-1" /> Apply Discount
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenHistoryModal}>
              <Receipt className="h-4 w-4 mr-1" /> Order History
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CurrentOrder;
