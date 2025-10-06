import { z } from 'zod';

export const DashboardStatsSchema = z.object({
  dailySales: z.number(),
  monthlySales: z.number(),
  customerCount: z.number().int(),
  orderCount: z.number().int(),
  salesByTime: z.array(z.object({ time: z.string(), amount: z.number() })),
  salesByCategory: z.array(z.object({ category: z.string(), amount: z.number() })),
  popularItems: z.array(z.object({ name: z.string(), count: z.number().int() })),
  recentSales: z.array(
    z.object({ id: z.string(), total: z.number(), date: z.any(), paymentMethod: z.string() })
  ),
}).passthrough();

