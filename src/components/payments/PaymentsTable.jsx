import React from 'react';
import { MoreVertical, Download, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomBadge } from '@/components/ui/custom-badge';

const PaymentsTable = ({ sortedPayments, getPaymentMethodIcon, getStatusBadgeVariant }) => {
  return (
    <div className="rounded-xl border shadow-md overflow-hidden">
      <div className="relative w-full overflow-auto rounded-xl">
        <table className="w-full text-sm border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-yellow-100 border-b-2 border-yellow-500">
              <th className="h-10 px-3 text-left font-semibold text-black">
                Order ID
              </th>
              <th className="h-10 px-3 text-left font-semibold text-black">
                Date
              </th>
              <th className="h-10 px-3 text-left font-semibold text-black">
                Method
              </th>
              <th className="h-10 px-3 text-left font-semibold text-black">
                Amount
              </th>
              <th className="h-10 px-3 text-left font-semibold text-black">
                Status
              </th>
              <th className="h-10 px-3 text-center font-semibold text-black">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {sortedPayments.length > 0 ? (
              sortedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-yellow-50 transition-colors">
                  <td className="p-3 align-middle font-medium">{payment.orderId}</td>
                  <td className="p-3 align-middle whitespace-nowrap text-gray-700">
                    {payment.date.split(' ')[0]}
                  </td>
                  <td className="p-3 align-middle">
                    <div className="flex items-center gap-2 text-gray-800">
                      {getPaymentMethodIcon(payment.method)}
                      <span className="capitalize">{payment.method}</span>
                    </div>
                  </td>
                  <td className="p-3 align-middle text-gray-900 font-medium">
                    ₱{payment.amount.toFixed(2)}
                  </td>
                  <td className="p-3 align-middle">
                    <CustomBadge
                      variant={getStatusBadgeVariant(payment.status)}
                      className="capitalize"
                    >
                      {payment.status}
                    </CustomBadge>
                  </td>
                  <td className="p-3 align-middle text-center flex justify-center gap-2">
                    {/* Download */}
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Download Invoice"
                      className="text-blue-600"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {/* Refund (only for completed) */}
                    {payment.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Process Refund"
                        className="text-yellow-600"
                      >
                        <ArrowDownUp className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Retry (only for failed) */}
                    {payment.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Retry Payment"
                        className="text-green-600"
                      >
                        <ArrowDownUp className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="h-20 text-center text-gray-500 italic">
                  No transactions match your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsTable;
