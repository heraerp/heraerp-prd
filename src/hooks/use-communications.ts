import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/state/org';
import { useToast } from '@/components/ui/use-toast';
import type {
  CommKpis,
  Template,
  Audience,
  Campaign,
  Message,
  CommFilters,
  CommExportRequest,
} from '@/types/communications';

// Base API client
const apiClient = async <T>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  const orgId = useOrgStore.getState().currentOrgId;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(orgId && { 'X-Organization-Id': orgId }),
    ...options?.headers,
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Queries
export function useCommKpis() {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['comm-kpis', orgId],
    queryFn: () => apiClient<CommKpis>('/api/civicflow/communications/kpis'),
    enabled: !!orgId,
    refetchInterval: 30000, // 30s
  });
}

export function useCampaignList(filters?: CommFilters) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['campaigns', orgId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      
      return apiClient<{
        items: Campaign[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/civicflow/communications/campaigns?${params}`);
    },
    enabled: !!orgId,
    keepPreviousData: true,
  });
}

export function useCampaign(id: string) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['campaign', orgId, id],
    queryFn: () => apiClient<Campaign>(`/api/civicflow/communications/campaigns/${id}`),
    enabled: !!orgId && !!id,
  });
}

export function useTemplateList(filters?: CommFilters) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['templates', orgId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      
      return apiClient<{
        items: Template[];
        total: number;
      }>(`/api/civicflow/communications/templates?${params}`);
    },
    enabled: !!orgId,
  });
}

export function useTemplate(id: string) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['template', orgId, id],
    queryFn: () => apiClient<Template>(`/api/civicflow/communications/templates/${id}`),
    enabled: !!orgId && !!id,
  });
}

export function useAudienceList(filters?: CommFilters) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['audiences', orgId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      
      return apiClient<{
        items: Audience[];
        total: number;
      }>(`/api/civicflow/communications/audiences?${params}`);
    },
    enabled: !!orgId,
  });
}

export function useAudience(id: string) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['audience', orgId, id],
    queryFn: () => apiClient<Audience>(`/api/civicflow/communications/audiences/${id}`),
    enabled: !!orgId && !!id,
  });
}

export function useOutbox(filters?: CommFilters) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['outbox', orgId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      
      return apiClient<{
        items: Message[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/civicflow/communications/outbox?${params}`);
    },
    enabled: !!orgId,
    refetchInterval: filters?.status?.includes('running') ? 5000 : 30000,
  });
}

export function useInboxMessages(filters?: CommFilters) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['inbox', orgId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      
      return apiClient<{
        items: Message[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/civicflow/communications/inbox?${params}`);
    },
    enabled: !!orgId,
  });
}

export function useCommLogs(filters?: CommFilters) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['comm-logs', orgId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      
      return apiClient<{
        items: any[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/civicflow/communications/logs?${params}`);
    },
    enabled: !!orgId,
    keepPreviousData: true,
  });
}

// Mutations
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          entity_type: 'comm_template',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Template created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create template', variant: 'destructive' });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          id,
          entity_type: 'comm_template',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Template updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update template', variant: 'destructive' });
    },
  });
}

export function useCreateAudience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          entity_type: 'comm_audience',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create audience');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      toast({ title: 'Audience created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create audience', variant: 'destructive' });
    },
  });
}

export function useUpdateAudience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          id,
          entity_type: 'comm_audience',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update audience');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      toast({ title: 'Audience updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update audience', variant: 'destructive' });
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          entity_type: 'comm_campaign',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create campaign', variant: 'destructive' });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          id,
          entity_type: 'comm_campaign',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update campaign', variant: 'destructive' });
    },
  });
}

export function useCampaignSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.CAMPAIGN.SCHEDULED.v1',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to schedule campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign scheduled successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to schedule campaign', variant: 'destructive' });
    },
  });
}

export function useCampaignPause() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.CAMPAIGN.PAUSED.v1',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to pause campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign paused successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to pause campaign', variant: 'destructive' });
    },
  });
}

export function useCampaignResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.CAMPAIGN.RESUMED.v1',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to resume campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign resumed successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to resume campaign', variant: 'destructive' });
    },
  });
}

export function useCampaignCancel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.CAMPAIGN.CANCELLED.v1',
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to cancel campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Campaign cancelled successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to cancel campaign', variant: 'destructive' });
    },
  });
}

export function useTestSend() {
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.TEST_SEND.v1',
          demo_guard: true,
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send test');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Test message sent (simulated in demo mode)' });
    },
    onError: () => {
      toast({ title: 'Failed to send test message', variant: 'destructive' });
    },
  });
}

export function useRetryFailed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'X-Organization-Id': orgId }),
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.RETRY.v1',
          demo_guard: true,
          ...data,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to retry message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbox'] });
      toast({ title: 'Message retry initiated (simulated in demo mode)' });
    },
    onError: () => {
      toast({ title: 'Failed to retry message', variant: 'destructive' });
    },
  });
}

export function useExportComms() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: CommExportRequest) => {
      const response = await fetch('/api/civicflow/communications/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to export');
      
      // Handle different response types
      if (data.format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `communications-${data.kind}-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        return response.blob();
      }
    },
    onSuccess: () => {
      toast({ title: 'Export completed successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to export data', variant: 'destructive' });
    },
  });
}