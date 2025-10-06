import React from 'react';
import { Search, Users } from 'lucide-react';
import { SearchInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const UsersSearch = ({ searchTerm, onChange, roleFilter, setRoleFilter }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full mt-4 mb-2">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <SearchInput
          type="search"
          placeholder="Search users..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {/* Role Filter */}
      <Select
        value={roleFilter === '' ? '_all' : roleFilter}
        onValueChange={(v) => setRoleFilter(v === '_all' ? '' : v)}
      >
        <SelectTrigger className="w-[180px] rounded-full border-2 border-blue-300 bg-blue-100 px-3 py-2 text-sm shadow-sm focus:border-[#60a5fa] focus:ring-2 focus:ring-[#93c5fd]">
          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>
          <SelectItem value="staff">Staff</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
