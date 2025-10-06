import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, List } from 'lucide-react';
import ItemGrid from './ItemGrid';
import ItemList from './ItemList';

const CategoryTabs = ({
  items = [],
  categories = [],
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
  const [view, setView] = useState('grid');
  const [localCategories, setLocalCategories] = useState(categories || []);

  useEffect(() => {
    setLocalCategories(categories || []);
  }, [categories]);

  const markCombo = (list) =>
    list.map((i) => ({
      ...i,
      isCombo: i.category === 'Combo Meals',
    }));

  const renderItems = (list) =>
    view === 'grid' ? (
      <ItemGrid
        items={markCombo(list)}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleAvailability={onToggleAvailability}
      />
    ) : (
      <ItemList
        items={markCombo(list)}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleAvailability={onToggleAvailability}
      />
    );

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 overflow-x-auto scrollbar-none">
          <TabsList className="flex gap-1 min-w-max">
            <TabsTrigger
              value="all"
              className="
                hover:bg-muted hover:text-foreground
                data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                data-[state=active]:shadow-sm
              "
            >
              All Items
            </TabsTrigger>
            {localCategories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="
                  hover:bg-muted hover:text-foreground
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-sm
                "
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v)}
          variant="outline"
          size="sm"
          className="ml-2 flex-shrink-0"
          aria-label="View mode"
        >
          <ToggleGroupItem
            value="grid"
            aria-label="Grid view"
            className="
              hover:bg-muted hover:text-foreground
              data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
              data-[state=active]:shadow-sm
            "
          >
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label="List view"
            className="
              hover:bg-muted hover:text-foreground
              data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
              data-[state=active]:shadow-sm
            "
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* All Items */}
      <TabsContent value="all" className="mt-6">
        {renderItems(items)}
      </TabsContent>

      {/* Per-category */}
      {localCategories.map((category) => (
        <TabsContent key={category} value={category} className="mt-6">
          {renderItems(items.filter((i) => i.category === category))}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default CategoryTabs;
