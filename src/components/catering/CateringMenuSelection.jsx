import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle, BookOpen } from 'lucide-react';

const CateringMenuSelection = ({
  categories,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm,
  onAddToOrder,
  eventName,
  attendees,
  readOnly = false,
}) => {
  const normalizedCategories = useMemo(() => {
    return (categories || [])
      .filter((category) => (category?.id || '').toLowerCase() !== 'all')
      .map((category) => {
        const name = category?.name || category?.label || String(category?.id || 'General');
        const id = String(category?.id || name);
        const items = (category?.items || []).map((item) => ({
          ...item,
          categoryName: item?.categoryName || item?.category || name,
          category: item?.category || name,
          price: Number(item?.price ?? 0),
        }));
        return { id, name, items };
      });
  }, [categories]);

  const getFilteredItems = () => {
    if (searchTerm.trim()) {
      const allItems = [];
      normalizedCategories.forEach((category) => {
        (category.items || [])
          .filter((item) => {
            const lowerTerm = searchTerm.toLowerCase();
            const nameMatch = (item.name || '').toLowerCase().includes(lowerTerm);
            const descMatch = (item.description || '').toLowerCase().includes(lowerTerm);
            return nameMatch || descMatch;
          })
          .forEach((item) => {
            allItems.push({ ...item, categoryName: category.name });
          });
      });
      return allItems;
    }
    return [];
  };

  const searchResults = getFilteredItems();

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full text-center bg-gradient-to-b from-blue-50 via-blue-50 to-blue-50 rounded-xl p-8 w-full">
      <AlertCircle className="mx-auto h-16 w-16 text-blue-300 mb-4 animate-bounce" />
      <p className="text-gray-500 text-lg font-medium">{message}</p>
    </div>
  );

  const MenuCard = ({ item }) => (
    <div
      className={`border rounded-xl p-4 bg-white shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:via-blue-100 hover:to-blue-50 transition-all transform ${
        readOnly ? 'cursor-not-allowed opacity-80' : 'hover:scale-105 cursor-pointer'
      } w-full`}
      onClick={() => {
        if (!readOnly) onAddToOrder(item);
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold text-gray-900">{item.name}</h4>
      </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
          {item.description || 'No description available'}
        </p>
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-primary">₱{Number(item.price ?? 0).toFixed(2)}</p>
        <Badge variant="secondary" className="text-xs">
          {item.categoryName || item.category || 'General'}
        </Badge>
      </div>
    </div>
  );

  // Combine all items for "All" tab
  const allItems = useMemo(
    () =>
      normalizedCategories.reduce(
        (acc, category) => [
          ...acc,
          ...(category.items || []).map((item) => ({
            ...item,
            categoryName: item.categoryName || category.name,
          })),
        ],
        []
      ),
    [normalizedCategories]
  );

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-black" />
            <CardTitle className="text-3xl font-bold text-black">
              Menu Selection
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="border-2 border-primary text-primary px-3 py-1 rounded-full"
          >
            Catering
          </Badge>
        </div>
        <CardDescription className="text-gray-500 mt-1">
          {eventName} - {attendees} attendees
        </CardDescription>
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search menu items..."
              className="pl-12 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary transition rounded-full w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {searchTerm.trim() ? (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Search results for "{searchTerm}"
            </h3>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState message={`No menu items found matching "${searchTerm}"`} />
            )}
          </div>
        ) : (
          <Tabs
            defaultValue="all"
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="flex-1 flex flex-col"
          >
            <div className="border-b border-gray-300">
              <TabsList className="w-full justify-start overflow-auto p-0 h-auto gap-2 bg-gray-200 rounded-lg">
                <TabsTrigger
                  value="all"
                  className="px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-colors font-medium flex-1 text-center"
                >
                  All
                </TabsTrigger>
                {normalizedCategories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-colors font-medium flex-1 text-center"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent
              value="all"
              className="flex-1 overflow-y-auto p-4 mt-2"
            >
              {allItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {allItems.map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState message="No items available" />
              )}
            </TabsContent>

            {normalizedCategories.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="flex-1 overflow-y-auto p-4 mt-2"
              >
                {category.items.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {category.items.map((item) => (
                      <MenuCard
                        key={item.id}
                        item={{ ...item, categoryName: item.categoryName || category.name }}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No items in this category" />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default CateringMenuSelection;
