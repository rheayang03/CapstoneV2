import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { CustomBadge } from '@/components/ui/custom-badge';
import {
  CreditCard,
  Banknote,
  Smartphone,
  CircleDollarSign,
} from 'lucide-react';

import PaymentsHeader from '@/components/payments/PaymentsHeader';
import PaymentsFilters from '@/components/payments/PaymentsFilters';
import PaymentsTable from '@/components/payments/PaymentsTable';
import { paymentsService } from '@/api/services/paymentsService';
import RecentTransactions from '@/components/payments/RecentTransactions';
import PaymentMethodsCard from '@/components/payments/PaymentMethodsCard';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  const [methodActive, setMethodActive] = useState({
    cash: true,
    card: true,
    mobile: true,
  });

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await paymentsService.list({
        timeRange: dateRange,
        status: selectedStatus === 'all' ? '' : selectedStatus,
      });
      const mapped = (list || []).map((p) => ({
        ...p,
        date: p.date || p.timestamp || new Date().toISOString(),
      }));
      setPayments(mapped);
    } catch (e) {
      setError(e?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [dateRange, selectedStatus]);

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CircleDollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'default';
    }
  };

  const filteredPayments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        payment.orderId.toLowerCase().includes(term) ||
        (payment.customer && payment.customer.toLowerCase().includes(term));
      const matchesStatus =
        selectedStatus === 'all' || payment.status === selectedStatus;
      const methodIsActive = methodActive[payment.method] ?? true;
      return matchesSearch && matchesStatus && methodIsActive;
    });
  }, [payments, searchTerm, selectedStatus, methodActive]);

  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredPayments]);

  const totalForSelectedStatus = useMemo(() => {
    return filteredPayments
      .filter((p) => p.status !== 'refunded')
      .reduce((acc, cur) => acc + cur.amount, 0)
      .toFixed(2);
  }, [filteredPayments]);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await paymentsService.getConfig();
        setMethodActive({
          cash: Boolean(cfg.cash),
          card: Boolean(cfg.card),
          mobile: Boolean(cfg.mobile),
        });
      } catch {}
    })();
  }, []);

  const updateMethod = async (key, value) => {
    const next = { ...methodActive, [key]: value };
    setMethodActive(next);
    try {
      await paymentsService.updateConfig({
        cash: next.cash,
        card: next.card,
        mobile: next.mobile,
      });
    } catch {}
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Main Content */}
      <div className="md:col-span-2 space-y-4">
        <Card className="shadow-2xl">
          <PaymentsHeader />

          <CardContent className="space-y-4">
            <PaymentsFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />

            <PaymentsTable
              sortedPayments={sortedPayments}
              getPaymentMethodIcon={getPaymentMethodIcon}
              getStatusBadgeVariant={getStatusBadgeVariant}
            />
          </CardContent>

          <CardFooter className="border-t py-3 flex justify-between">
            <div className="text-xs text-muted-foreground">
              Showing {sortedPayments.length} of {payments.length} transactions
            </div>
            <div className="text-sm">
              Total:{' '}
              <span className="font-semibold">₱{totalForSelectedStatus}</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Swapped order: Payment Methods first */}
        <PaymentMethodsCard
          methodActive={methodActive}
          updateMethod={updateMethod}
        />

        {/* Recent Transactions second */}
        <RecentTransactions
          sortedPayments={sortedPayments}
          getStatusBadgeVariant={getStatusBadgeVariant}
        />
      </div>
    </div>
  );
};

export default Payments;
