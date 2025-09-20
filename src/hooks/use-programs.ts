import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ProgramFilters,
  CreateProgramRequest,
  CreateGrantRoundRequest,
  ExportProgramsRequest,
} from '@/types/crm-programs';

export function useProgramKpis() {
  return useQuery({
    queryKey: ['programs', 'kpis'],
    queryFn: () => api.crm.programs.getKpis(),
    refetchInterval: 15000, // Auto-refresh every 15s
    staleTime: 10000,
  });
}

export function useProgramList(filters: ProgramFilters = {}) {
  return useQuery({
    queryKey: ['programs', 'list', filters],
    queryFn: () => api.crm.programs.list(filters),
    keepPreviousData: true,
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: () => api.crm.programs.get(id),
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProgramRequest) => api.crm.programs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create program');
    },
  });
}

export function useCreateGrantRound(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGrantRoundRequest) => 
      api.crm.programs.createGrantRound(programId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Grant round created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create grant round');
    },
  });
}

export function useExportPrograms() {
  return useMutation({
    mutationFn: async (data: ExportProgramsRequest) => {
      const result = await api.crm.programs.export(data);
      
      if (data.format === 'csv' && result instanceof Blob) {
        // Download CSV file
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `programs-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      toast.success(`Programs exported as ${variables.format.toUpperCase()}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export programs');
    },
  });
}