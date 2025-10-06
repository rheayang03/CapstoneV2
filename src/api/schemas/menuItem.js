import { z } from 'zod';
import { IdSchema } from './utils';

export const MenuItemSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1),
    description: z.string().optional().default(''),
    price: z.number().nonnegative(),
    category: z.string().min(1),
    available: z.boolean(),
    image: z.string().optional(),
    ingredients: z.array(z.string()).optional().default([]),
    preparationTime: z.number().int().nonnegative().optional(),
  })
  .passthrough();

