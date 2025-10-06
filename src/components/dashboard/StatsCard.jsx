import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatsCard = ({
  title,
  value,
  previousValue, 
  icon: Icon,
  formatter = (v) => v,
  onClick,
}) => {
  const clickable = typeof onClick === 'function';

  // Calculate change percentage
  let changePercentage = null;
  let isIncrease = null;
  if (typeof previousValue === 'number' && previousValue !== 0) {
    changePercentage = ((value - previousValue) / previousValue) * 100;
    isIncrease = value >= previousValue;
  }

  return (
    <Card
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={`transition-colors duration-200 hover:bg-yellow-50 ${
        clickable ? 'cursor-pointer' : ''
      }`}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-1 py-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xl font-bold">{formatter(value)}</div>
        {changePercentage !== null && (
          <p className="text-[11px] flex items-center space-x-1 text-muted-foreground">
            {isIncrease ? (
              <ArrowUp className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-600" />
            )}
            <span className={isIncrease ? 'text-green-600' : 'text-red-600'}>
              {changePercentage.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">from previous</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
