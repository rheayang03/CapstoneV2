import React from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { SearchInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PaymentsFilters = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  dateRange,
  setDateRange,
}) => {
  return (
    <div className="mt-4 mb-6 flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <SearchInput
          type="searchInput"
          placeholder="Search by order ID or customer..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Status Filter */}
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-[180px] rounded-full border-2 border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#60a5fa] focus:ring-2 focus:ring-[#93c5fd]">
          <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range Filter */}
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-[180px] rounded-full border-2 border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#60a5fa] focus:ring-2 focus:ring-[#93c5fd]">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="7d">Last 7 Days</SelectItem>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PaymentsFilters;
