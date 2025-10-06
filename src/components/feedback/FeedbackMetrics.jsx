import React from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const FeedbackMetrics = ({ feedback }) => {
  const averageRating =
    feedback.length > 0
      ? (
          feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
        ).toFixed(1)
      : '0.0';

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ));
  };

  const sentimentCounts = feedback.reduce(
    (acc, item) => {
      if (item.rating >= 4) acc.positive += 1;
      else if (item.rating === 3) acc.neutral += 1;
      else acc.negative += 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const total = feedback.length || 0;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Overall Rating */}
      <Card className="shadow-lg rounded-xl hover:scale-105 transition-transform duration-300 bg-white overflow-hidden">
        <div className="h-1 bg-blue-400 w-full"></div>
        <CardHeader className="pb-4">
          <CardTitle>Overall Rating</CardTitle>
          <CardDescription>Average customer satisfaction</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-2">
          <span className="text-3xl font-bold">{averageRating}</span>
          <div className="flex space-x-1">{renderStars(Math.round(parseFloat(averageRating)))}</div>
          <p className="text-sm text-muted-foreground">
            Based on {feedback.length} reviews
          </p>
        </CardContent>
      </Card>

      {/* Sentiment Analysis */}
      <Card className="shadow-lg rounded-xl hover:scale-105 transition-transform duration-300 bg-white overflow-hidden">
        <div className="h-1 bg-green-400 w-full"></div>
        <CardHeader className="pb-4">
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>Feedback sentiment breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
              <span>Positive</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">{sentimentCounts.positive}</span>
              <span className="text-muted-foreground text-sm">({pct(sentimentCounts.positive)}%)</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              <span>Neutral</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">{sentimentCounts.neutral}</span>
              <span className="text-muted-foreground text-sm">({pct(sentimentCounts.neutral)}%)</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <ThumbsDown className="h-4 w-4 mr-2 text-red-500" />
              <span>Negative</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">{sentimentCounts.negative}</span>
              <span className="text-muted-foreground text-sm">({pct(sentimentCounts.negative)}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resolution Status */}
      <Card className="shadow-lg rounded-xl hover:scale-105 transition-transform duration-300 bg-white overflow-hidden">
        <div className="h-1 bg-purple-400 w-full"></div>
        <CardHeader className="pb-4">
          <CardTitle>Resolution Status</CardTitle>
          <CardDescription>Feedback resolution tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Resolved</span>
            <div className="flex items-center">
              <span className="font-medium mr-2">{feedback.filter((f) => f.resolved).length}</span>
              <span className="text-muted-foreground text-sm">({pct(feedback.filter((f) => f.resolved).length)}%)</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span>Pending</span>
            <div className="flex items-center">
              <span className="font-medium mr-2">{feedback.filter((f) => !f.resolved).length}</span>
              <span className="text-muted-foreground text-sm">({pct(feedback.filter((f) => !f.resolved).length)}%)</span>
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2.5 mt-2">
            <div
              className="bg-purple-400 h-2.5 rounded-full"
              style={{ width: `${pct(feedback.filter((f) => f.resolved).length)}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
