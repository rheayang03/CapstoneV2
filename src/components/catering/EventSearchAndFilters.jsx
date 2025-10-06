import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { SearchInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const EventSearchAndFilters = ({ 
  searchTerm, 
  onSearchChange, 
  onCalendarView 
}) => {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-2.5 h-4 w-4 text-gray-400" />
        <SearchInput
          type="search"
          placeholder="Search events..."
          className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Calendar View Button */}
      <Button
  variant="outline"
  className="flex gap-1 items-center border-2 border-blue-300 shadow-sm transition-all duration-200
             hover:border-blue-300 hover:bg-blue-100"
  onClick={onCalendarView}
>
  <Calendar className="h-4 w-4" /> Calendar View
</Button>

    </div>
  );
};
