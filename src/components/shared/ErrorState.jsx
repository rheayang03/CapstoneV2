import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ErrorState = ({ message = 'Something went wrong.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertCircle className="h-6 w-6 text-destructive mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorState;

