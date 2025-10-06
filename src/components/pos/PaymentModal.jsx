import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Delete } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, onProcessPayment, calculateTotal }) => {
  const { can } = useAuth();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [change, setChange] = useState(0);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null); // Ref for input

  const totalAmount = calculateTotal();

  // Animate modal and focus input
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setTimeout(() => inputRef.current?.focus(), 100); // Focus input after modal opens
    } else {
      const timeout = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Calculate change
  useEffect(() => {
    const payment = parseFloat(paymentAmount) || 0;
    const calculatedChange = payment - totalAmount;
    setChange(calculatedChange >= 0 ? calculatedChange : 0);
  }, [paymentAmount, totalAmount]);

  // Listen for Enter key to process payment
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && isPaymentValid() && can('payment.process')) {
        handleProcessPayment();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentAmount, totalAmount, can]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) setPaymentAmount(value);
  };

  // Number pad clicks
  const handleNumberClick = (number) => {
    if (number === '.' && paymentAmount.includes('.')) return;
    setPaymentAmount((prev) => prev + number);
  };

  const handleClear = () => setPaymentAmount('');
  const handleBackspace = () => setPaymentAmount((prev) => prev.slice(0, -1));
  const isPaymentValid = () => (parseFloat(paymentAmount) || 0) >= totalAmount;

  const handleProcessPayment = () => {
    if (isPaymentValid()) {
      onProcessPayment();
      setPaymentAmount('');
      setChange(0);
    }
  };

  const numberButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '.'],
  ];

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black/30 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Card
        className={`w-full max-w-md mx-4 rounded-3xl shadow-2xl transform transition-all duration-300 ${
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-6 scale-95'
        }`}
      >
        {/* Header */}
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold text-center">
            Complete Payment
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground text-center">
            Enter payment amount
          </CardDescription>
        </CardHeader>

        {/* Total & Payment Input */}
        <CardContent className="space-y-6 text-center">
          <div className="bg-gray-50 p-5 rounded-2xl shadow-inner">
            <p className="text-4xl font-extrabold mb-1">₱{totalAmount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Total amount due</p>
          </div>

          <Input
            ref={inputRef} // Input ref for auto-focus
            type="text"
            placeholder="0.00"
            value={paymentAmount}
            onChange={handleInputChange}
            className="text-center !text-4xl !font-extrabold !h-20 !rounded-xl !shadow-inner"
          />

          <div className="text-2xl font-semibold text-green-600">
            Change: ₱{change.toFixed(2)}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            {numberButtons.flat().map((btn) => (
              <Button
                key={btn}
                variant="outline"
                className="h-16 text-xl font-bold rounded-xl shadow hover:bg-gray-100 transition"
                onClick={() => {
                  if (btn === 'C') handleClear();
                  else handleNumberClick(btn);
                }}
              >
                {btn}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-16 col-span-3 rounded-xl shadow hover:bg-gray-100 transition flex justify-center items-center gap-2"
              onClick={handleBackspace}
            >
              <Delete className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex gap-3 pt-3">
          <Button
            className="flex-[3] rounded-full shadow-lg text-lg font-semibold"
            onClick={handleProcessPayment}
            disabled={!isPaymentValid() || !can('payment.process')}
          >
            Process Payment
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-full text-lg font-semibold"
            onClick={onClose}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentModal;
