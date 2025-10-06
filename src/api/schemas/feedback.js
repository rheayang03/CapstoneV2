import { z } from 'zod';
import { IdSchema, ISODateTime } from './utils';

export const FeedbackSchema = z
  .object({
    id: IdSchema,
    customerName: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    orderNumber: z.string().optional(),
    category: z.string().min(1),
    status: z.string().min(1),
    createdAt: ISODateTime,
  })
  .passthrough();

