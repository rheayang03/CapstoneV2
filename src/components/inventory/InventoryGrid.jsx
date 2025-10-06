import React from 'react';
import { PenSquare, Ban, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CustomBadge } from '@/components/ui/custom-badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const InventoryGrid = ({
  items,
  onEditItem,
  onDisableItem,
  onDeleteItem,
  getStockPercentage,
  getStockBadgeVariant,
  getStockStatusText,
}) => {
  return (
    <ScrollArea className="h-[600px] rounded"> 
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Card
              key={item.id}
              className={`transition-all hover:bg-yellow-50 hover:shadow-md ${
                item.disabled ? 'opacity-60 bg-gray-50' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-col">
                  <span className="text-lg font-semibold">{item.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="text-xs font-normal text-muted-foreground border-gray-300"
                    >
                      {item.category}
                    </Badge>
                    {item.disabled && (
                      <Badge variant="secondary" className="text-xs font-medium">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {/* Stock info */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>
                      {item.currentStock} {item.unit}
                    </span>
                    <CustomBadge
                      variant={getStockBadgeVariant(item.currentStock, item.minThreshold)}
                    >
                      {getStockStatusText(item.currentStock, item.minThreshold)}
                    </CustomBadge>
                  </div>
                  <Progress
                    value={getStockPercentage(item.currentStock, item.minThreshold)}
                    className="h-2"
                  />
                </div>

                {/* Supplier + Actions */}
                <div className="flex justify-between items-center pt-1">
                  <p className="text-xs text-muted-foreground truncate">
                    Supplier: {item.supplier || 'N/A'}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditItem(item)}
                      disabled={item.disabled}
                      className={`p-1 text-blue-600 ${
                        item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <PenSquare className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDisableItem(item.id, item.name)}
                      className={`p-1 ${
                        item.disabled ? 'text-green-600' : 'text-destructive'
                      }`}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteItem(item)}
                      disabled={item.disabled}
                      className={`p-1 text-red-600 ${
                        item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-8">
            No inventory items found
          </p>
        )}
      </div>
    </ScrollArea>
  );
};
