import React from 'react';
import { Check, MessageCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const FeedbackList = ({
  feedback,
  replyingId,
  replyText,
  replies,
  onReply,
  onReplyChange,
  onSendReply, 
  onResolve,
}) => {
  const renderStars = (rating) =>
    Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 transition-colors ${
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ));

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="space-y-4">
      {feedback.length === 0 ? (
        <p className="text-center py-12 text-gray-400 italic">
          No feedback available
        </p>
      ) : (
        feedback.map((item) => (
          <div
            key={item.id}
            className="relative flex flex-col md:flex-row p-5 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            {/* Avatar */}
            <div className="flex-shrink-0 mr-4 mb-3 md:mb-0">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 text-white font-semibold">
                {getInitials(item.customerName)}
              </div>
            </div>

            {/* Feedback Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {item.customerName || 'Anonymous'}
                    </h4>
                    {item.resolved && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-green-700 border-green-300 bg-green-100"
                      >
                        <Check className="h-4 w-4" /> Resolved
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="flex">{renderStars(item.rating)}</div>
                    <span className="italic text-xs text-gray-400">
                      {item.date
                        ? new Date(item.date).toLocaleDateString()
                        : 'No date'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                  {/* Reply Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-100 hover:text-blue-700 transition"
                    onClick={() =>
                      onReply(replyingId === item.id ? null : item.id)
                    }
                  >
                    <MessageCircle className="h-4 w-4" /> Reply
                  </Button>

                  {/* Resolve / Unresolve Button */}
                  <Button
                    variant={item.resolved ? 'outline' : 'default'}
                    size="sm"
                    className={`flex items-center gap-1 transition ${
                      item.resolved
                        ? 'text-gray-600 border-gray-300 hover:bg-gray-300'
                        : 'bg-blue-500 text-white hover:bg-blue-300'
                    }`}
                    onClick={() => onResolve(item.id)}
                  >
                    {item.resolved ? 'Unresolve' : 'Resolve'}
                  </Button>
                </div>
              </div>

              {/* Customer Comment */}
              <div className="mt-4 max-w-[87%]">
                <p className="text-gray-800 text-base leading-relaxed bg-gray-100 px-4 py-2 rounded-2xl">
                  {item.comment || 'No comment provided.'}
                </p>
              </div>

              {/* Connector + Multiple Reply bubbles */}
              {replies[item.id] && replies[item.id].length > 0 && (
                <div className="flex flex-col gap-2 mt-2 ml-6">
                  {replies[item.id].map((reply, index) => (
                    <div key={index} className="flex items-start">
                      {/* L-shaped arrow */}
                      <div className="w-6 h-6 border-l-2 border-b-2 border-gray-300 rounded-bl-lg"></div>

                      {/* Reply bubble */}
                      <div className="ml-2 max-w-[85%] bg-blue-100 text-black px-5 py-3 rounded-full shadow text-base w-full">
                        <span className="font-semibold text-gray-800">
                          Your Reply:
                        </span>{' '}
                        {reply}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline reply box */}
              {replyingId === item.id && (
                <div className="mt-4 space-y-4">
                  <div className="max-w-[88%]">
                    <Textarea
                      value={replyText}
                      onChange={(e) => onReplyChange(e.target.value)}
                      placeholder="Type your response..."
                      rows={3}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onSendReply(item.id)}
                      className="bg-blue-500 text-white shadow-md hover:bg-blue-600"
                    >
                      Send Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
                      onClick={() => onReply(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
