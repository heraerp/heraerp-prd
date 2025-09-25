/**
 * React Query hooks for Cases module
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  keepPreviousData 
} from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { useOrgStore } from '@/state/org';
import type {
  CaseListResponse,
  CaseFilters,
  CaseDetail,
  CaseKpis,
  CaseTimelineEvent,
  CreateCasePayload,
  CaseActionApprovePayload,
  CaseActionVaryPayload,
  CaseActionWaivePayload,
  CaseActionBreachPayload,
  CaseActionClosePayload,
  ExportCasesPayload,
  CaseActionType
} from '@/types/cases';

// Query key factory
export const caseKeys = {
  all: ['cases'] as const,
  lists: () => [...caseKeys.all, 'list'] as const,
  list: (filters: CaseFilters) => [...caseKeys.lists(), filters] as const,
  details: () => [...caseKeys.all, 'detail'] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,
  timelines: () => [...caseKeys.all, 'timeline'] as const,
  timeline: (id: string) => [...caseKeys.timelines(), id] as const,
  kpis: () => [...caseKeys.all, 'kpis'] as const,
};

// API client functions
const casesApi = {
  list: async (orgId: string, filters: CaseFilters): Promise<CaseListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.q) params.append('q', filters.q);
    if (filters.status?.length) filters.status.forEach(s => params.append('status', s));
    if (filters.owner) params.append('owner', filters.owner);
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.priority?.length) filters.priority.forEach(p => params.append('priority', p));
    if (filters.rag?.length) filters.rag.forEach(r => params.append('rag', r));
    if (filters.due_from) params.append('due_from', filters.due_from);
    if (filters.due_to) params.append('due_to', filters.due_to);
    if (filters.tags?.length) filters.tags.forEach(t => params.append('tags', t));
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await fetch(`/api/civicflow/cases?${params}`, {
      headers: {
        'X-Organization-Id': orgId,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch cases');
    return response.json();
  },

  get: async (orgId: string, id: string): Promise<CaseDetail> => {
    const response = await fetch(`/api/civicflow/cases/${id}`, {
      headers: {
        'X-Organization-Id': orgId,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch case');
    return response.json();
  },

  timeline: async (orgId: string, id: string): Promise<CaseTimelineEvent[]> => {
    const response = await fetch(`/api/civicflow/cases/${id}/timeline`, {
      headers: {
        'X-Organization-Id': orgId,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch timeline');
    return response.json();
  },

  kpis: async (orgId: string): Promise<CaseKpis> => {
    const response = await fetch('/api/civicflow/cases/kpis', {
      headers: {
        'X-Organization-Id': orgId,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch KPIs');
    return response.json();
  },

  create: async (orgId: string, data: CreateCasePayload) => {
    const response = await fetch('/api/civicflow/cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to create case');
    return response.json();
  },

  action: async (orgId: string, id: string, action: CaseActionType, data: any) => {
    const response = await fetch(`/api/civicflow/cases/${id}/actions/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error(`Failed to ${action} case`);
    return response.json();
  },

  export: async (orgId: string, data: ExportCasesPayload) => {
    const response = await fetch('/api/civicflow/cases/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to export cases');
    
    // Get filename from headers or default
    const contentDisposition = response.headers.get('content-disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : `cases_export.${data.format}`;
    
    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, filename };
  },
};

// Query hooks
export function useCaseKpis() {
  const { currentOrgId } = useOrgStore();
  
  return useQuery({
    queryKey: caseKeys.kpis(),
    queryFn: () => casesApi.kpis(currentOrgId!),
    enabled: !!currentOrgId,
    refetchInterval: 15000, // Refresh every 15 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is visible
  });
}

export function useCaseList(filters: CaseFilters) {
  const { currentOrgId } = useOrgStore();
  
  return useQuery({
    queryKey: caseKeys.list(filters),
    queryFn: () => casesApi.list(currentOrgId!, filters),
    enabled: !!currentOrgId,
    placeholderData: keepPreviousData,
  });
}

export function useCase(id: string) {
  const { currentOrgId } = useOrgStore();
  
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => casesApi.get(currentOrgId!, id),
    enabled: !!currentOrgId && !!id,
  });
}

export function useCaseTimeline(id: string) {
  const { currentOrgId } = useOrgStore();
  
  return useQuery({
    queryKey: caseKeys.timeline(id),
    queryFn: () => casesApi.timeline(currentOrgId!, id),
    enabled: !!currentOrgId && !!id,
  });
}

// Mutation hooks
export function useCreateCase() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrgStore();

  return useMutation({
    mutationFn: (data: CreateCasePayload) => casesApi.create(currentOrgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.kpis() });
      toast({
        title: 'Success',
        description: 'Case created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create case',
        variant: 'destructive',
      });
    },
  });
}

export function useActionApprove(id: string) {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrgStore();

  return useMutation({
    mutationFn: (data: CaseActionApprovePayload) => 
      casesApi.action(currentOrgId!, id, 'approve', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.kpis() });
      toast({
        title: 'Success',
        description: 'Case approved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve case',
        variant: 'destructive',
      });
    },
  });
}

export function useActionVary(id: string) {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrgStore();

  return useMutation({
    mutationFn: (data: CaseActionVaryPayload) => 
      casesApi.action(currentOrgId!, id, 'vary', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast({
        title: 'Success',
        description: 'Variation recorded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record variation',
        variant: 'destructive',
      });
    },
  });
}

export function useActionWaive(id: string) {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrgStore();

  return useMutation({
    mutationFn: (data: CaseActionWaivePayload) => 
      casesApi.action(currentOrgId!, id, 'waive', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast({
        title: 'Success',
        description: 'Waiver applied successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply waiver',
        variant: 'destructive',
      });
    },
  });
}

export function useActionBreach(id: string) {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrgStore();

  return useMutation({
    mutationFn: (data: CaseActionBreachPayload) => 
      casesApi.action(currentOrgId!, id, 'breach', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.kpis() });
      toast({
        title: 'Success',
        description: 'Breach recorded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record breach',
        variant: 'destructive',
      });
    },
  });
}

export function useActionClose(id: string) {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrgStore();

  return useMutation({
    mutationFn: (data: CaseActionClosePayload) => 
      casesApi.action(currentOrgId!, id, 'close', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: caseKeys.kpis() });
      toast({
        title: 'Success',
        description: 'Case closed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close case',
        variant: 'destructive',
      });
    },
  });
}

export function useExportCases() {
  const { currentOrgId } = useOrgStore();

  return useMutation({
    mutationFn: (data: ExportCasesPayload) => casesApi.export(currentOrgId!, data),
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: `Export completed: ${result.filename}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export cases',
        variant: 'destructive',
      });
    },
  });
}