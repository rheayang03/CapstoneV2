import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Receipt, Check, X, ArrowDownUp, Calendar } from "lucide-react";
import { CustomBadge } from "@/components/ui/custom-badge";

const RecentTransactions = ({ sortedPayments = [], getStatusBadgeVariant }) => {
  // Group transactions by time
  const groups = { today: [], yesterday: [], earlier: [] };

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  sortedPayments.forEach((payment) => {
    const paymentDate = new Date(payment.date);
    const isToday = paymentDate.toDateString() === today.toDateString();
    const isYesterday = paymentDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      groups.today.push(payment);
    } else if (isYesterday) {
      groups.yesterday.push(payment);
    } else {
      groups.earlier.push(payment);
    }
  });

  const renderGroup = (label, items) =>
    items.length > 0 && (
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
          {label}
        </h4>
        <div className="space-y-3">
          {items.map((payment) => (
            <div
              key={payment.id}
              className="flex justify-between items-center border-b pb-2 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-1 ${
                    payment.status === "completed"
                      ? "bg-green-100"
                      : payment.status === "failed"
                      ? "bg-red-100"
                      : payment.status === "refunded"
                      ? "bg-amber-100"
                      : "bg-gray-100"
                  }`}
                >
                  {payment.status === "completed" && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {payment.status === "failed" && (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  {payment.status === "refunded" && (
                    <ArrowDownUp className="h-4 w-4 text-amber-600" />
                  )}
                  {payment.status === "pending" && (
                    <Calendar className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{payment.orderId}</span>
                    <CustomBadge
                      variant={getStatusBadgeVariant(payment.status)}
                      className="capitalize text-xs"
                    >
                      {payment.status}
                    </CustomBadge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payment.customer ? payment.customer : "Walk-in Customer"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  ₱{payment.amount.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {payment.method}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>View latest payment activities</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
                {' '}
        {sortedPayments.length > 0 ? (
          <div className="max-h-96 overflow-y-auto pr-2 space-y-6">
            {renderGroup("Today", groups.today)}
            {renderGroup("Yesterday", groups.yesterday)}
            {renderGroup("Earlier", groups.earlier)}
          </div>
        ) : (
          <div className="text-center py-6">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              No recent transactions to display
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
