import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';

const MenuSelection = ({
  categories,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm,
  onAddToOrder,
  occupyFullWidth = false,
}) => {
  const getFilteredItems = () => {
    if (searchTerm.trim()) {
      const allItems = [];
      categories.forEach((category) => {
        category.items
          .filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .forEach((item) => {
            allItems.push({ ...item, categoryName: category.name });
          });
      });
      return allItems;
    }

    return (
      categories
        .find((cat) => cat.id === activeCategory)
        ?.items.map((item) => ({ ...item, categoryName: '' })) || []
    );
  };

  const filteredItems = getFilteredItems();

  const ItemCard = ({ item, showCategoryBadge = false }) => {
    const imageSrc = item.image || item.imageUrl || null;
    const categoryLabel = item.categoryName || item.category || '';
    const isUnavailable = item.available === false;

    const handleActivate = (event) => {
      if (isUnavailable) return;
      if (event?.type === 'keydown') {
        event.preventDefault();
      }
      onAddToOrder(item);
    };

    return (
      <Card
        role="button"
        tabIndex={isUnavailable ? -1 : 0}
        onClick={handleActivate}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleActivate(event);
          }
        }}
        className={`flex h-full flex-col overflow-hidden transition-all duration-200 ${
          isUnavailable
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:bg-blue-100 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/60'
        }`}
        aria-disabled={isUnavailable}
      >
        <CardHeader className="p-0">
          <div className="border-b bg-muted">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={item.name}
                className="h-24 w-full object-cover sm:h-28 md:h-32"
                loading="lazy"
              />
            ) : (
              <div className="flex h-24 w-full items-center justify-center text-xs text-muted-foreground sm:h-28 md:h-32">
                No Image
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-2 px-3 py-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-sm font-semibold leading-tight">
                {item.name}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {item.description}
              </CardDescription>
            </div>
            {showCategoryBadge && categoryLabel ? (
              <Badge
                variant="outline"
                className="shrink-0 px-1.5 py-0 text-[10px]"
              >
                {categoryLabel}
              </Badge>
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="text-sm font-semibold md:text-base">
              ₱{Number(item.price).toFixed(2)}
            </span>
            <Badge
              variant={isUnavailable ? 'destructive' : 'outline'}
              className="shrink-0 px-1.5 py-0 text-[10px]"
            >
              {isUnavailable ? 'Unavailable' : 'Available'}
            </Badge>
          </div>

          {!showCategoryBadge && categoryLabel ? (
            <Badge
              variant="secondary"
              className="w-max px-1.5 py-0 text-[10px]"
            >
              {categoryLabel}
            </Badge>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const columnClass = occupyFullWidth ? 'md:col-span-3' : 'md:col-span-2';

  return (
    <div className={`col-span-1 ${columnClass}`}>
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between pb-2">
            <div>
              <CardTitle>Point of Sale</CardTitle>
              <CardDescription className="mb-2">
                Select menu items to add to order
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col space-y-2 pt-2 md:flex-row md:space-x-2 md:space-y-0 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
              <SearchInput
                type="search"
                placeholder="Search menu items..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col overflow-hidden">
          {categories.length === 0 ? (
            <div className="grid flex-1 place-items-center text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p>No menu items available. Add items in Menu Management.</p>
              </div>
            </div>
          ) : searchTerm.trim() ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Search results for "{searchTerm}"
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-3 lg:gap-4">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <ItemCard
                        key={`${item.categoryName}-${item.id}`}
                        item={item}
                        showCategoryBadge
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center">
                      <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        No menu items found matching "{searchTerm}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Tabs
              defaultValue={categories[0]?.id || ''}
              value={activeCategory}
              onValueChange={setActiveCategory}
              className="flex-1 flex-col"
            >
              {/* Tabs List */}
              <div className="border-b mt-2">
                <TabsList className="h-auto w-full flex justify-start overflow-x-auto p-0">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className={`
                        flex-1 px-3 py-2 text-sm font-medium
                        transition-colors
                        hover:bg-muted hover:text-foreground
                        data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                        data-[state=active]:shadow-sm
                      `}
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tabs Content */}
              {categories.map((category) => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="flex-1 overflow-y-auto p-0"
                >
                  <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-3 lg:gap-4">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center">
                        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No items in this category
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>

        <CardFooter className="border-t pt-3">
          <div className="flex w-full justify-between text-xs text-muted-foreground">
            <span>Cashier</span>
            <span>
              {new Date().toLocaleDateString()}{' '}
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MenuSelection;
