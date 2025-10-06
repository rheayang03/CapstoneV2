import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const formatTimestamp = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(ts);
  }
};

const normalize = (list = []) =>
  (list || []).map((a) => ({
    id: a.id,
    action: a.action || 'Stock Update',
    item: a.item || '',
    quantity: a.quantity ?? '',
    timestamp: a.timestamp || '',
    user: a.user || 'System',
  }));

const groupActivities = (activities) => {
  const today = [];
  const yesterday = [];
  const earlier = [];
  const now = new Date();

  activities.forEach((activity) => {
    const activityDate = new Date(activity.timestamp);
    const diffTime = now - activityDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 1 && now.getDate() === activityDate.getDate()) {
      today.push(activity);
    } else if (diffDays < 2 && now.getDate() - 1 === activityDate.getDate()) {
      yesterday.push(activity);
    } else {
      earlier.push(activity);
    }
  });

  return { today, yesterday, earlier };
};

const InventoryRecentActivity = ({ recentActivities, loading = false, onRefresh }) => {
  const items = useMemo(() => normalize(recentActivities || []), [recentActivities]);
  const grouped = groupActivities(items);
  const [showEarlier, setShowEarlier] = useState(false);

  const renderActivity = (activity) => (
    <div
      key={activity.id}
      className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
    >
      <div className="bg-muted rounded-full p-3">
        <History className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start pr-4">
          <p className="font-medium text-sm">{activity.action}</p>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(activity.timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{activity.item}</span>
          {activity.quantity ? <span> — {activity.quantity}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">By {activity.user || 'System'}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Inventory Activity</CardTitle>
            <CardDescription className="mb-4">
              Latest inventory changes and updates
            </CardDescription>
          </div>
          {onRefresh && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={!!loading}
              className="rounded-full px-4 py-1 flex items-center gap-2 shadow-md hover:shadow-lg hover:bg-gray-300 transition-all"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Refreshing</> : 'Refresh'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 h-[715px] overflow-y-auto scrollbar scrollbar-thumb-gray-200 scrollbar-track-gray-100">
          {grouped.today.length > 0 && (
            <>
              <p className="font-semibold text-lg text-foreground">Today</p>
              {grouped.today.map(renderActivity)}
            </>
          )}

          {grouped.yesterday.length > 0 && (
            <>
              <p className="font-semibold text-lg text-foreground">Yesterday</p>
              {grouped.yesterday.map(renderActivity)}
            </>
          )}

          {grouped.earlier.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 mt-2"
                onClick={() => setShowEarlier(!showEarlier)}
              >
                {showEarlier ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Earlier
              </Button>
              {showEarlier && grouped.earlier.map(renderActivity)}
            </>
          )}

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryRecentActivity;
