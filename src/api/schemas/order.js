import { z } from 'zod';
import { IdSchema, ISODateTime } from './utils';

export const OrderType = z.enum(['walk-in', 'online']).or(z.string());
export const OrderStatus = z.enum(['pending', 'preparing', 'completed', 'cancelled']).or(z.string());

export const OrderItemSchema = z.object({
  id: z.string().min(1).optional(),
  menuItemId: IdSchema,
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

export const OrderSchema = z
  .object({
    id: IdSchema,
    orderNumber: z.string().min(1),
    type: OrderType,
    status: OrderStatus,
    items: z.array(OrderItemSchema),
    subtotal: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().optional(),
    total: z.number().nonnegative(),
    paymentMethod: z.string().nullable().optional(),
    timeReceived: z.date().or(ISODateTime),
    timeCompleted: z.date().or(ISODateTime).nullable().optional(),
    customerName: z.string().nullable().optional(),
  })
  .passthrough();

