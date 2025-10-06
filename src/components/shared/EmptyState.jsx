import React from 'react';
import { Search } from 'lucide-react';

const EmptyState = ({ title = 'No data found', description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Search className="h-6 w-6 text-muted-foreground mb-2" />
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};

export default EmptyState;

