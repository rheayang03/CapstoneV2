import React from 'react';
import { Edit, Trash2, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area'; 

export const UserTable = ({
  users,
  onEditUser,
  onDeactivateUser,
  onDeleteUser,
  getRoleBadgeVariant,
  getInitials,
  isAdmin = false,
}) => {
  return (
    <div className="rounded-xl border shadow-md overflow-hidden">
      <ScrollArea className="w-full h-[400px]"> 
        <table className="w-full caption-bottom text-sm table-auto">
          <thead className="sticky top-0 z-10 bg-yellow-100 border-b-2 border-yellow-500">
            <tr>
              <th className="h-10 px-5 text-left font-semibold w-[35%]">User</th>
              <th className="h-10 px-4 text-left font-semibold w-[30%]">Role</th>
              <th className="h-10 px-4 text-left font-semibold w-[25%]">Status</th>
              <th className="h-10 px-5 text-right font-semibold w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b transition-colors hover:bg-blue-50${
                    user.status !== 'active' ? 'opacity-50' : ''
                  }`}
                >
                  {/* User Column */}
                  <td className="pl-5 pr-4 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role Column */}
                  <td className="px-4 py-3 align-middle">
                    <Badge
                      variant={getRoleBadgeVariant(user.role)}
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                  </td>

                  {/* Status Column */}
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center">
                      <div
                        className={`mr-2 h-2.5 w-2.5 rounded-full ${
                          user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      ></div>
                      <span className="text-sm capitalize">{user.status}</span>
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="pl-4 pr-5 py-3 align-middle text-right">
                    <div className="flex items-center justify-end gap-6">
                      {/* Edit */}
                      <div className="relative group">
                        <button
                          onClick={() => onEditUser(user)}
                          className={`hover:scale-110 transition-transform ${
                            user.status !== 'active' ? 'text-gray-400' : 'text-blue-600'
                          }`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Edit
                        </span>
                      </div>

                      {/* Deactivate/Activate */}
                      <div className="relative group">
                        <button
                          onClick={() => onDeactivateUser(user.id)}
                          className={`hover:scale-110 transition-transform ${
                            user.status !== 'active' ? 'text-green-600' : 'text-yellow-600'
                          }`}
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </span>
                      </div>

                      {/* Delete (Admin Only) */}
                      {isAdmin && (
                        <div className="relative group">
                          <button
                            onClick={() => onDeleteUser(user.id)}
                            className={`hover:scale-110 transition-transform ${
                              user.status !== 'active' ? 'text-gray-400' : 'text-red-600'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            Delete
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="h-24 text-center">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
};
