import React from 'react';
import { TrendingUp, ShoppingBag, DollarSign, ShieldCheck } from 'lucide-react';
import StatsCard from './dashboard/StatsCard';
import SalesChart from './dashboard/SalesChart';
import CategoryChart from './dashboard/CategoryChart';
import PopularItems from './dashboard/PopularItems';
import RecentSales from './dashboard/RecentSales';
import { useDashboard } from '@/hooks/useDashboard';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import ErrorState from '@/components/shared/ErrorState';
import { useVerificationQueue } from '@/hooks/useVerificationQueue';
import { useAuth } from '@/components/AuthContext';

const Dashboard = () => {
  const { stats, loading, error, refetch } = useDashboard('today');
  const { hasAnyRole, token } = useAuth();
  const isVerifier = hasAnyRole(['admin', 'manager']);
  const { requests: pendingRequests, pagination: verifyPagination } =
    useVerificationQueue({
      status: 'pending',
      limit: 1,
      enabled: isVerifier && Boolean(token),
    });

  const salesTimeData = (stats?.salesByTime || []).map((item) => ({
    name: item.time,
    amount: item.amount,
  }));

  const categorySalesData = (stats?.salesByCategory || []).map((item) => ({
    name: item.category,
    amount: item.amount,
  }));

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Today's Sales"
          value={stats?.dailySales || 0}
          previousValue={stats?.previousDailySales ?? null}
          icon={DollarSign}
          formatter={(value) =>
            new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
            }).format(value)
          }
        />
        <StatsCard
          title="Monthly Sales"
          value={stats?.monthlySales || 0}
          previousValue={stats?.previousMonthlySales ?? null}
          icon={TrendingUp}
          formatter={(value) =>
            new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
            }).format(value)
          }
        />
        <StatsCard
          title="Orders Today"
          value={stats?.orderCount ?? (stats?.recentSales?.length || 0)}
          previousValue={stats?.previousOrderCount ?? null}
          icon={ShoppingBag}
        />
        {isVerifier ? (
          <StatsCard
            title="Pending Accounts"
            value={verifyPagination?.total ?? (pendingRequests?.length || 0)}
            icon={ShieldCheck}
          />
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesChart
          data={salesTimeData}
          title="Sales by Time of Day"
          description="Hourly sales distribution for today"
        />
        <CategoryChart
          data={categorySalesData}
          title="Sales by Category"
          description="Revenue distribution across menu categories"
        />
      </div>

      {/* Popular Items & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PopularItems items={stats?.popularItems || []} />
        <RecentSales sales={stats?.recentSales || []} />
      </div>
    </div>
  );
};

export default Dashboard;
