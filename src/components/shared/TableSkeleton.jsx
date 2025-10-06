import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const TableSkeleton = ({ headers = [], rows = 5 }) => {
  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((h) => (
                <th key={h} className="h-10 px-4 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b">
                {headers.map((_, j) => (
                  <td key={j} className="p-4 align-middle">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;

