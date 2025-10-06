import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const TICK_STYLE = {
  fontSize: 10,
  fill: "hsl(var(--muted-foreground))"
};

const SalesChart = ({ data, title, description }) => {
  return (
    <Card className="bg-blue-50 shadow-md rounded-xl transition-shadow duration-500 hover:shadow-lg">
      <CardHeader className="py-2 mb-4">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-96 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, left: 16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{TICK_STYLE, fontSize: 9, fill: '#374151', fontWeight: 'bold'}}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={TICK_STYLE}
              width={44}
              axisLine={false}
              tickLine={false}
              tickCount={4}
            />
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <Tooltip
              wrapperStyle={{ fontSize: 11 }}
              labelStyle={{ fontSize: 11 }}
              contentStyle={{ padding: "6px 8px" }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="url(#colorPrimary)"
              dot={false}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SalesChart;
