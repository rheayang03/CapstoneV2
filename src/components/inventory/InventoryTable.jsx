import React from 'react';
import { PenSquare, Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export const InventoryTable = ({
  items,
  onEditItem,
  onDisableItem,
  onDeleteItem,
  getStockPercentage,
  getStockBadgeVariant,
  getStockStatusText,
}) => {
  return (
    <div className="mt-4 rounded-xl border">
      <ScrollArea className="h-[600px] rounded border">
        <table className="w-full caption-bottom text-sm table-fixed">
          <thead className="bg-yellow-100 border-b-2 border-yellow-500 sticky top-0 z-10">
            <tr>
              <th className="h-10 px-4 text-left font-bold text-gray-700 w-[20%]">Name</th>
              <th className="h-10 px-4 text-left font-bold text-gray-700 w-[20%]">Category</th>
              <th className="h-10 px-4 text-left font-bold text-gray-700 w-[30%]">Stock Level</th>
              <th className="h-10 px-4 text-left font-bold text-gray-700 hidden md:table-cell w-[15%]">Supplier</th>
              <th className="h-10 px-4 text-center font-bold text-gray-700 w-[15%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b transition-all duration-200 hover:bg-primary/10 ${
                    item.disabled ? 'opacity-50' : ''
                  }`}
                >
                  <td className="p-4 align-middle font-medium">
                    <div className="flex items-center gap-2">
                      {item.name}
                      {item.disabled && (
                        <Badge variant="secondary" className="text-xs">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline">{item.category}</Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span>{item.currentStock} {item.unit}</span>
                        <CustomBadge
                          variant={getStockBadgeVariant(item.currentStock, item.minThreshold)}
                        >
                          {getStockStatusText(item.currentStock, item.minThreshold)}
                        </CustomBadge>
                      </div>
                      <Progress
                        value={getStockPercentage(item.currentStock, item.minThreshold)}
                        className={`h-2 ${
                          item.currentStock < item.minThreshold
                            ? 'bg-red-200'
                            : 'bg-green-200'
                        }`}
                      />
                    </div>
                  </td>
                  <td className="p-4 align-middle hidden md:table-cell text-left">
                    {item.supplier}
                  </td>
                  <td className="p-4 align-middle flex justify-center gap-2 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditItem(item)}
                      title="Edit"
                      className="text-blue-600"
                      disabled={item.disabled}
                    >
                      <PenSquare className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDisableItem(item.id, item.name)}
                      title={item.disabled ? 'Enable' : 'Disable'}
                      className={item.disabled ? 'text-green-600' : 'text-destructive'}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteItem(item)}
                      title="Delete"
                      className="text-red-600"
                      disabled={item.disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="h-24 text-center">
                  No inventory items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
};
