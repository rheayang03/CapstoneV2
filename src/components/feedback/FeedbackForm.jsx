import React from 'react';
import { Star } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const FeedbackForm = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collect New Feedback</CardTitle>
        <CardDescription>
          Add a form to collect customer feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input id="name" placeholder="Enter customer name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input id="email" placeholder="Enter email address" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} className="focus:outline-none">
                <Star className="h-6 w-6 text-gray-300 hover:text-yellow-400" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment">Comment</Label>
          <Textarea
            id="comment"
            placeholder="Please share your experience with us"
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button>Submit Feedback</Button>
      </CardFooter>
    </Card>
  );
};