import { useToast } from '@/hooks/use-toast';
import userService from '@/api/services/userService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Normalize params to stable queryKey
const normalizeParams = (params) => {
  const def = { page: 1, limit: 20, search: '', role: '', status: '', sortBy: 'name', sortDir: 'asc' };
  return { ...def, ...(params || {}) };
};

export const useUserManagement = (params = {}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const qp = normalizeParams(params);

  const usersQuery = useQuery({
    queryKey: ['users', qp],
    queryFn: async () => {
      const res = await userService.getUsers(qp);
      if (!res?.success) throw new Error('Failed to load users');
      return res; // { success, data, pagination }
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createUser = useMutation({
    mutationFn: (userData) => userService.createUser(userData),
    onSuccess: () => {
      invalidateUsers();
      toast({ title: 'User Created', description: 'User added successfully.' });
    },
    onError: (err) => {
      toast({ title: 'Error Creating User', description: err?.message || 'Failed to create user', variant: 'destructive' });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ userId, updates }) => userService.updateUser(userId, updates),
    onSuccess: () => {
      invalidateUsers();
      toast({ title: 'User Updated', description: 'User information has been updated.' });
    },
    onError: (err) => {
      toast({ title: 'Error Updating User', description: err?.message || 'Failed to update user', variant: 'destructive' });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId) => userService.deleteUser(userId),
    onSuccess: () => {
      invalidateUsers();
      toast({ title: 'User Deleted', description: 'User removed from the system.', variant: 'destructive' });
    },
    onError: (err) => {
      toast({ title: 'Error Deleting User', description: err?.message || 'Failed to delete user', variant: 'destructive' });
    },
  });

  const updateUserStatus = useMutation({
    mutationFn: ({ userId, status }) => userService.updateUserStatus(userId, status),
    onSuccess: (_, variables) => {
      invalidateUsers();
      const label = variables.status === 'active' ? 'Activated' : 'Deactivated';
      toast({ title: `User ${label}`, description: `User status updated to ${variables.status}.` });
    },
    onError: (err) => {
      toast({ title: 'Error Updating Status', description: err?.message || 'Failed to update status', variant: 'destructive' });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: ({ userId, role }) => userService.updateUserRole(userId, role),
    onSuccess: () => {
      invalidateUsers();
      toast({ title: 'Role Updated', description: 'User role has been updated.' });
    },
    onError: (err) => {
      toast({ title: 'Error Updating Role', description: err?.message || 'Failed to update role', variant: 'destructive' });
    },
  });

  return {
    users: usersQuery.data?.data || [],
    pagination: usersQuery.data?.pagination || { page: qp.page, limit: qp.limit, total: 0, totalPages: 0 },
    loading: usersQuery.isLoading,
    fetching: usersQuery.isFetching,
    error: usersQuery.error?.message || null,
    refetch: usersQuery.refetch,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    updateUserRole,
  };
};

export const useRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await userService.getRoles();
      if (!res?.success) throw new Error('Failed to load roles');
      return res.data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const updateRoleConfig = useMutation({
    mutationFn: (roleConfig) => userService.updateRoleConfig(roleConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: 'Role Updated', description: 'Role configuration has been saved.' });
    },
    onError: (err) => {
      toast({ title: 'Error Updating Role', description: err?.message || 'Failed to update role configuration', variant: 'destructive' });
    },
  });

  if (query.error) {
    toast({ title: 'Error Loading Roles', description: query.error.message, variant: 'destructive' });
  }

  return {
    roles: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    updateRoleConfig,
  };
};

export default useUserManagement;
