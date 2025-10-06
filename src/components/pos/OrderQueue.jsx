import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Smartphone, Clock, Check } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

const OrderQueue = ({ orderQueue, updateOrderStatus }) => {
  const { can } = useAuth();
  const walkInOrders = orderQueue.filter((order) => order.type === 'walk-in');
  const onlineOrders = orderQueue.filter((order) => order.type === 'online');

  const formatTimeAgo = (input) => {
    const d = input instanceof Date ? input : new Date(input);
    const ts = d.getTime();
    if (Number.isNaN(ts)) return 'Unknown';
    const nowTs = Date.now();
    const diffInMinutes = Math.floor((nowTs - ts) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const hours = Math.floor(diffInMinutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderOrderCard = (orders) => {
    if (orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No orders in queue</p>
        </div>
      );
    }

    return (
      <div className="divide-y overflow-y-auto max-h-[500px]">
        {orders.map((order) => (
          <div key={order.id} className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                {order.customerName && (
                  <p className="text-sm font-medium">{order.customerName}</p>
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {formatTimeAgo(order.timeReceived)}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-md">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {order.status === 'pending' && can('order.status.update') && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                >
                  Start Preparing
                </Button>
              )}
              {order.status === 'preparing' && can('order.status.update') && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                >
                  Mark Ready
                </Button>
              )}
              {order.status === 'ready' && can('order.status.update') && (
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                >
                  <Check className="h-4 w-4 mr-1" /> Complete Order
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {/* Walk-in Orders */}
      <Card>
        <CardHeader className="bg-amber-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Walk-in Orders
              </CardTitle>
              <CardDescription>Orders placed at counter</CardDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 border-amber-200"
            >
              {walkInOrders.length} Orders
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">{renderOrderCard(walkInOrders)}</CardContent>
      </Card>

      {/* Online Orders */}
      <Card>
        <CardHeader className="bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" /> Online Orders
              </CardTitle>
              <CardDescription>Orders placed through app or website</CardDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-100 text-blue-800 border-blue-200"
            >
              {onlineOrders.length} Orders
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">{renderOrderCard(onlineOrders)}</CardContent>
      </Card>

      {/* Statistics Overview */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Queue Statistics</CardTitle>
          <CardDescription>Overview of current order processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold">{orderQueue.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm font-medium text-yellow-800">Pending</p>
              <p className="text-3xl font-bold text-yellow-800">
                {orderQueue.filter((o) => o.status === 'pending').length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm font-medium text-blue-800">Preparing</p>
              <p className="text-3xl font-bold text-blue-800">
                {orderQueue.filter((o) => o.status === 'preparing').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm font-medium text-green-800">Ready</p>
              <p className="text-3xl font-bold text-green-800">
                {orderQueue.filter((o) => o.status === 'ready').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderQueue;
