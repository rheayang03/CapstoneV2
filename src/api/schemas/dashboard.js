import { z } from 'zod';

export const DashboardStatsSchema = z.object({
  dailySales: z.number(),
  monthlySales: z.number(),
  customerCount: z.number().int(),
  orderCount: z.number().int(),
  previousDailySales: z.number().optional().default(0),
  previousMonthlySales: z.number().optional().default(0),
  previousOrderCount: z.number().int().optional().default(0),
  salesByTime: z.array(z.object({ time: z.string(), amount: z.number() })),
  salesByCategory: z.array(z.object({ category: z.string(), amount: z.number() })),
  popularItems: z.array(z.object({ name: z.string(), count: z.number().int() })),
  recentSales: z.array(
    z.object({
      id: z.string(),
      orderNumber: z.string().optional(),
      total: z.number(),
      date: z.string().optional().nullable(),
      paymentMethod: z.string().optional().default(''),
      status: z.string().optional().nullable(),
    })
  ),
}).passthrough();

