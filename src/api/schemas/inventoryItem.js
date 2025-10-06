import { z } from 'zod';
import { IdSchema, ISODateTime } from './utils';

export const InventoryItemSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1),
    category: z.string().min(1),
    quantity: z.number().nonnegative(),
    unit: z.string().min(1),
    minStock: z.number().nonnegative().optional(),
    supplier: z.string().optional(),
    lastRestocked: ISODateTime,
    expiryDate: ISODateTime,
  })
  .passthrough();

