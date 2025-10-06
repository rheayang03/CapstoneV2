import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';

const PaymentMethodsCard = ({ methodActive, updateMethod }) => {
  const methods = [
    {
      key: 'cash',
      label: 'Cash',
      desc: 'Physical currency',
      icon: <Banknote className="h-6 w-6" />,
      color: 'green',
    },
    {
      key: 'card',
      label: 'Credit/Debit Cards',
      desc: 'Visa, Mastercard, Amex',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'blue',
    },
    {
      key: 'mobile',
      label: 'Mobile Payments',
      desc: 'Apple Pay, Google Pay',
      icon: <Smartphone className="h-6 w-6" />,
      color: 'purple',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Configure accepted payment types</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {methods.map((m) => (
            <div
              key={m.key}
              className={`flex justify-between items-center p-4 rounded-xl shadow-sm transition ${
                methodActive[m.key]
                  ? `bg-${m.color}-50 border border-${m.color}-200`
                  : 'bg-gray-50 border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${m.color}-100 text-${m.color}-600`}>
                  {m.icon}
                </div>
                <div>
                  <p className="font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </div>
              <Switch
                checked={methodActive[m.key]}
                onCheckedChange={(v) => updateMethod(m.key, v)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsCard;
