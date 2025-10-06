// src/components/menu/ManageCategoriesDialog.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';

const ManageCategoriesDialog = ({ open, onOpenChange, categories, onDeleteCategory }) => {
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete);
      setCategoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setCategoryToDelete(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 py-4">
          {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories found.</p>}
          {categories.map((category) => (
            <div
              key={category}
              className="flex items-center justify-between rounded-md border p-2 bg-background"
            >
              <span>{category}</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDeleteClick(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Modal */}
      {categoryToDelete && (
        <Dialog open={true} onOpenChange={cancelDelete}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Category?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Are you sure you want to delete "{categoryToDelete}"? This action cannot be undone.
            </p>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
              <Button className="bg-red-500 text-white hover:bg-red-600" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default ManageCategoriesDialog;
