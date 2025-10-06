import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const TICK_STYLE = {
  fontSize: 10,
  fill: "hsl(45, 50%, 20%)" 
};

const GRID_STYLE = {
  stroke: "hsl(45, 50%, 75%)",
  strokeDasharray: "3 3"
};

const TOOLTIP_STYLE = {
  wrapperStyle: { fontSize: 11, backgroundColor: "hsl(45, 100%, 95%)" },
  labelStyle: { fontSize: 11, color: "hsl(45, 30%, 20%)" },
  contentStyle: { padding: "6px 8px", backgroundColor: "hsl(45, 100%, 95%)" }
};

const CategoryChart = ({ data, title, description }) => {
  return (
    <Card className="flex flex-col bg-yellow-100/30 border border-yellow-100 rounded-xl">
      <CardHeader className="py-2 mb-4">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 16, bottom: 0 }}
          >
            <CartesianGrid {...GRID_STYLE} opacity={0.5} />
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
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar
              dataKey="amount"
              fill="#FFB700"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryChart;
