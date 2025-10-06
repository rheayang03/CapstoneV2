import { z } from 'zod';
import { IdSchema, ISODateTime } from './utils';

export const PaymentMethod = z.enum(['cash', 'card', 'mobile']).or(z.string());
export const PaymentStatus = z.enum(['completed', 'pending', 'failed']).or(z.string());

export const PaymentSchema = z
  .object({
    id: IdSchema,
    orderId: z.string().min(1),
    amount: z.number().nonnegative(),
    method: PaymentMethod,
    status: PaymentStatus,
    timestamp: ISODateTime,
    reference: z.string().nullable().optional(),
  })
  .passthrough();

