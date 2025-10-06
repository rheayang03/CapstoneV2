import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const InventoryFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
}) => {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 rounded-full border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Category Select */}
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="text-semibold w-[200px] h-10 rounded-full border-2 border-blue-200 bg-blue-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories
            .slice() 
            .sort((a, b) => a.localeCompare(b)) 
            .map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default InventoryFilters;
