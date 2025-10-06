import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ManageEmployeesDialog = ({
  open,
  onOpenChange,
  employeeList = [], // pass in staff/manager/admin users
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Employees</DialogTitle>
          <DialogDescription>
            View all employees (staff, manager, admin) in the system.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto border rounded-md p-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Role</th>
                <th className="px-2 py-1">Email / Contact</th>
                <th className="px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeeList.length > 0 ? (
                employeeList.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-1">{emp.name}</td>
                    <td className="px-2 py-1">{emp.role}</td>
                    <td className="px-2 py-1">{emp.email || emp.contact}</td>
                    <td className="px-2 py-1">
                      {/* Optional: delete/edit */}
                      <Button variant="ghost" size="sm" className="p-0">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-2 text-muted-foreground">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageEmployeesDialog;
