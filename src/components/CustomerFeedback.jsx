import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedback } from '@/hooks/useFeedback';
import ErrorState from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { FeedbackMetrics } from './feedback/FeedbackMetrics';
import { FeedbackList } from './feedback/FeedbackList';
import { FeedbackForm } from './feedback/FeedbackForm';

const CustomerFeedback = () => {
  const { feedback, loading, error, markResolved, createFeedback, refetch } =
    useFeedback();
  const [activeTab, setActiveTab] = useState('all');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState({}); 

  const forceResolve = async (id) => {
    try {
      return await markResolved(id, true); 
    } catch {
      toast.error('Failed to mark as resolved');
    }
  };

  const handleResolve = async (id) => {
    try {
      await markResolved(id);
    } catch {}
  };

  const handleSendReply = async (id) => {
    if (!replyText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setReplies((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), replyText],
    }));

    toast.success('Response sent successfully');
    setReplyText('');
    setReplyingId(null);

    await forceResolve(id);
  };

  const handleCreateFeedback = async (values) => {
    try {
      await createFeedback(values);
      toast.success('Feedback logged');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to log feedback';
      toast.error(message);
      throw err;
    }
  };

  const filteredFeedback =
    activeTab === 'all'
      ? feedback
      : activeTab === 'resolved'
      ? feedback.filter((item) => item.resolved)
      : feedback.filter((item) => !item.resolved);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-60" />
        <Card className="bg-blue-100 shadow-lg rounded-xl">
          <CardHeader className="pb-6">
            <CardTitle>Customer Comments</CardTitle>
            <CardDescription>
              Review and manage customer feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold">Customer Feedback</h2>

      <FeedbackForm onSubmit={handleCreateFeedback} />

      <FeedbackMetrics feedback={feedback || []} />

      <Card className="bg-blue-100 shadow-lg rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle>Customer Comments</CardTitle>
          <CardDescription>
            Review and manage customer feedback
          </CardDescription>

          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="flex space-x-2 p-2 mt-4 bg-blue-100 rounded-lg justify-start">
              {['all', 'pending', 'resolved'].map((tab) => {
                const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                const isActive = activeTab === tab;
                return (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={`
                      px-4 py-2 rounded-xl font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-blue-400 text-white shadow-lg scale-105'
                          : 'bg-blue-200 text-blue-800 hover:bg-blue-300 hover:shadow-md'
                      }
                    `}
                  >
                    {label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {filteredFeedback.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No feedback to display
            </div>
          ) : (
            <FeedbackList
              feedback={filteredFeedback}
              replyingId={replyingId}
              replyText={replyText}
              replies={replies}
              onReply={setReplyingId}
              onReplyChange={setReplyText}
              onSendReply={handleSendReply}
              onResolve={handleResolve}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerFeedback;
