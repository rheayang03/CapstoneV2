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
import { X } from 'lucide-react';

const OrderHistoryModal = ({
  isOpen,
  onClose,
  orderHistory,
  loading = false,
  onRefresh = null,
  error = null,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timeout = setTimeout(() => setVisible(false), 300); // match transition duration
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div
  className={`top-0 left-0 w-screen h-screen fixed inset-0 bg-black/40 flex items-center justify-center z-50 transition-opacity duration-300 ${
    isOpen ? 'opacity-100' : 'opacity-0'
  }`}
>
      <Card
        className={`w-full max-w-2xl max-h-[80vh] flex flex-col relative transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-6 scale-95'
        }`}
      >
        {/* Top-right buttons */}
        <div className="absolute top-4 right-2 flex items-center gap-2">
          {onRefresh && (
            <Button size="sm" variant="default" className="rounded-full" onClick={onRefresh}>
              Refresh
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Header */}
        <CardHeader className="pb-2 mb-4">
          <div>
            <CardTitle>Order History</CardTitle>
            <CardDescription>Recent completed orders</CardDescription>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {error && <div className="text-sm text-red-600">{String(error)}</div>}
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : orderHistory.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No order history found.
            </div>
          ) : (
            orderHistory.map((order) => {
              const tsRaw =
                order.timeCompleted || order.updatedAt || order.timeReceived || order.createdAt;
              const d = tsRaw instanceof Date ? tsRaw : new Date(tsRaw);
              const tsValid = !Number.isNaN(d.getTime());
              const dateStr = tsValid ? d.toLocaleDateString() : '';
              const timeStr = tsValid ? d.toLocaleTimeString() : '';
              return (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">#{order.orderNumber}</h3>
                      {tsValid && (
                        <p className="text-sm text-muted-foreground">
                          {dateStr} {timeStr}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Payment: {order.paymentMethod || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₱{Number(order.total || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="pt-4">
          <Button className="w-full rounded-full" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderHistoryModal;
