import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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
  const current = typeof value === 'number' ? value : Number(value);
  const previous =
    typeof previousValue === 'number' ? previousValue : Number(previousValue);
  const hasComparable =
    Number.isFinite(current) && Number.isFinite(previous);

  let changePercentage = null;
  let trend = null; // 'up' | 'down' | 'equal'

  if (hasComparable) {
    if (previous === 0) {
      if (current === 0) {
        changePercentage = 0;
        trend = 'equal';
      } else {
        changePercentage = 100;
        trend = 'up';
      }
    } else {
      changePercentage = ((current - previous) / Math.abs(previous)) * 100;
      if (Math.abs(current - previous) < 0.0001) {
        changePercentage = 0;
        trend = 'equal';
      } else if (current > previous) {
        trend = 'up';
      } else {
        trend = 'down';
      }
    }
  }

  const TrendIcon =
    trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-slate-500';

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
        {trend && changePercentage !== null && (
          <p className="text-[11px] flex items-center space-x-1 text-muted-foreground">
            <TrendIcon className={`h-3 w-3 ${trendColor}`} />
            <span className={trendColor}>
              {`${trend === 'down' ? '-' : ''}${Math.abs(changePercentage).toFixed(1)}%`}
            </span>
            <span className="text-muted-foreground">from previous</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
