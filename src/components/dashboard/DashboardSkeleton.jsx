import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <Skeleton className="h-7 w-48 bg-gray-400 animate-pulse rounded-md" />

      {/* Small Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 bg-gray-400 animate-pulse rounded-md" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-32 bg-gray-400 animate-pulse rounded-md" />
              <Skeleton className="h-3 w-20 mt-2 bg-gray-400 animate-pulse rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Large Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40 bg-gray-400 animate-pulse rounded-md" />
              <Skeleton className="h-3 w-56 mt-1 bg-gray-400 animate-pulse rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full bg-gray-400 animate-pulse rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Medium Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40 bg-gray-400 animate-pulse rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full bg-gray-400 animate-pulse rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;
