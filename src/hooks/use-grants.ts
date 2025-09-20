import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  GrantFilters,
  CreateGrantRequest,
  ReviewGrantRequest,
  ExportGrantsRequest,
} from '@/types/crm-grants';

export function useGrantKpis() {
  return useQuery({
    queryKey: ['grants', 'kpis'],
    queryFn: () => api.crm.grants.getKpis(),
    refetchInterval: 15000, // Auto-refresh every 15s
    staleTime: 10000,
  });
}

export function useGrantList(filters: GrantFilters = {}) {
  return useQuery({
    queryKey: ['grants', 'list', filters],
    queryFn: () => api.crm.grants.list(filters),
    keepPreviousData: true,
  });
}

export function useGrant(applicationId: string) {
  return useQuery({
    queryKey: ['grants', applicationId],
    queryFn: () => api.crm.grants.get(applicationId),
    enabled: !!applicationId,
  });
}

export function useCreateGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGrantRequest) => api.crm.grants.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grants'] });
      toast.success('Grant application created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create grant application');
    },
  });
}

export function useReviewGrant(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewGrantRequest) => 
      api.crm.grants.review(applicationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['grants'] });
      queryClient.invalidateQueries({ queryKey: ['grants', applicationId] });
      toast.success(`Grant application ${variables.action}d successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to review grant application');
    },
  });
}

export function useExportGrants() {
  return useMutation({
    mutationFn: async (data: ExportGrantsRequest) => {
      const result = await api.crm.grants.export(data);
      
      if (data.format === 'csv' && result instanceof Blob) {
        // Download CSV file
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grants-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      toast.success(`Grants exported as ${variables.format.toUpperCase()}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export grants');
    },
  });
}