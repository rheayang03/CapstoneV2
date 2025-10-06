import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import verificationService from '@/api/services/verificationService';

export const useVerificationQueue = (params = {}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const qp = {
    status: 'pending',
    page: 1,
    limit: 10,
    search: '',
    ...(params || {}),
  };
  const enabled =
    params?.enabled !== undefined ? Boolean(params.enabled) : true;

  const query = useQuery({
    queryKey: ['verify-requests', qp],
    queryFn: async () => {
      try {
        const res = await verificationService.list(qp);
        if (!res?.success)
          throw new Error(
            res?.message || 'Failed to load verification requests'
          );
        return res;
      } catch (err) {
        throw new Error(err?.message || 'Failed to load verification requests');
      }
    },
    enabled,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['verify-requests'] });

  const approve = useMutation({
    mutationFn: ({ requestId, role, note }) =>
      verificationService.approve({ requestId, role, note }),
    onSuccess: () => {
      invalidate();
      toast({
        title: 'Approved',
        description: 'Access granted and role assigned.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Approval failed',
        description: err?.message || 'Unable to approve',
        variant: 'destructive',
      });
    },
  });

  const reject = useMutation({
    mutationFn: ({ requestId, note }) =>
      verificationService.reject({ requestId, note }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Rejected', description: 'Request has been rejected.' });
    },
    onError: (err) => {
      toast({
        title: 'Rejection failed',
        description: err?.message || 'Unable to reject',
        variant: 'destructive',
      });
    },
  });

  return {
    requests: query.data?.data || [],
    pagination: query.data?.pagination || {
      page: qp.page,
      limit: qp.limit,
      total: 0,
      totalPages: 0,
    },
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error?.message || null,
    refetch: query.refetch,
    approve,
    reject,
  };
};

export default useVerificationQueue;
