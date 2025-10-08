import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category' },
  { value: 'service', label: 'Service' },
  { value: 'food', label: 'Food' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'other', label: 'Other' },
];

export const FeedbackForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    customerName: '',
    email: '',
    orderNumber: '',
    category: '',
    rating: 5,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.comment.trim()) {
      toast.error('Please enter customer feedback');
      return;
    }
    const ratingNum = Number(form.rating);
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      toast.error('Rating must be between 1 and 5');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...form,
        rating: ratingNum,
      });
      setForm({
        customerName: '',
        email: '',
        orderNumber: '',
        category: '',
        rating: 5,
        comment: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Log Customer Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              placeholder="Optional"
              value={form.customerName}
              onChange={handleChange('customerName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Customer Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={form.email}
              onChange={handleChange('email')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input
              id="orderNumber"
              placeholder="Optional reference"
              value={form.orderNumber}
              onChange={handleChange('orderNumber')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={form.category}
              onChange={handleChange('category')}
              className="border rounded-md px-3 py-2 text-sm"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating (1-5)</Label>
            <Input
              id="rating"
              type="number"
              min={1}
              max={5}
              value={form.rating}
              onChange={handleChange('rating')}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="comment">Customer Comment</Label>
            <Textarea
              id="comment"
              placeholder="Describe the customer's feedback"
              rows={4}
              value={form.comment}
              onChange={handleChange('comment')}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Feedback'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
