import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

const PopularItems = ({ items = [] }) => {
  const list = Array.isArray(items) ? items : [];
  const maxCount = list.length
    ? Math.max(...list.map((item) => Number(item.count) || 0))
    : 0;
  const labelForCount = (count) =>
    `${count} ${count === 1 ? 'order' : 'orders'}`;

  return (
    <Card className="w-full">
      <CardHeader className="py-2 mb-4">
        <CardTitle className="text-2xl">Popular Items</CardTitle>
        <CardDescription className="text-sm">
          Most ordered items in the past week
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 max-h-80 overflow-y-auto overflow-x-hidden">
        <div className="space-y-3 w-full">
          {list.map((item, index) => (
            <div
              key={index}
              className="flex items-center px-3 py-2 rounded transition-transform duration-150 hover:scale-102 hover:bg-yellow-100/70"
            >
              {/* Item index and name */}
              <div className="flex items-center space-x-2 w-1/4 flex-shrink-0">
                <span className="font-medium text-base">{index + 1}.</span>
                <span className="text-base font-medium">{item.name}</span> {/* Mild bold */}
              </div>

              {/* Mini oblong bar with yellow gradient */}
              <div className="flex-1 mx-2 bg-gray-200 rounded-full h-5 overflow-hidden">
                <div
                  className="h-5 rounded-full"
                  style={{
                    width: maxCount ? `${((Number(item.count) || 0) / maxCount) * 100}%` : '0%',
                    background: 'linear-gradient(to right, #FFB700, #FFD233)'
                  }}
                />
              </div>

              {/* Order count */}
              <span className="text-sm text-muted-foreground w-20 text-right whitespace-nowrap flex-shrink-0">
                {labelForCount(Number(item.count) || 0)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularItems;
