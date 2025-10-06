import { z } from 'zod';
import { IdSchema, ISODateTime } from './utils';

export const CateringEventSchema = z
  .object({
    id: IdSchema,
    eventName: z.string().min(1),
    eventDate: ISODateTime,
    eventLocation: z.string().min(1),
    clientName: z.string().min(1),
    clientEmail: z.string().email(),
    guestCount: z.number().int().nonnegative(),
    status: z.string().min(1),
    items: z.array(
      z.object({
        menuItemId: IdSchema,
        name: z.string().min(1),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
      })
    ).optional().default([]),
    total: z.number().nonnegative(),
    notes: z.string().optional(),
  })
  .passthrough();

