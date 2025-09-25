import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/state/org';
import { useToast } from '@/components/ui/use-toast';
import type {
  Connector,
  SyncJob,
  VendorType,
  SyncRequest,
  SyncResult,
  ConnectorMapping,
} from '@/types/integrations';

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
export function useConnectors() {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['connectors', orgId],
    queryFn: () => apiClient<{ items: Connector[] }>('/api/integrations/connectors'),
    enabled: !!orgId,
    refetchInterval: 30000, // 30s
  });
}

export function useConnector(vendor: VendorType) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['connector', orgId, vendor],
    queryFn: async () => {
      const result = await apiClient<{ items: Connector[] }>('/api/integrations/connectors');
      return result.items.find(c => c.vendor === vendor);
    },
    enabled: !!orgId && !!vendor,
  });
}

export function useSyncStatus(connectorId: string) {
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useQuery({
    queryKey: ['sync-status', orgId, connectorId],
    queryFn: async () => {
      const vendor = connectorId.split('-')[0]; // Extract vendor from connector ID
      return apiClient<SyncJob>(`/api/integrations/${vendor}/status?connector_id=${connectorId}`);
    },
    enabled: !!orgId && !!connectorId,
    refetchInterval: (data) => {
      // Poll more frequently while sync is running
      return data?.status === 'running' ? 5000 : 60000;
    },
  });
}

// Mutations
export function useConnectIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async ({ vendor, authCode }: { vendor: VendorType; authCode?: string }) => {
      // For demo mode or BlueSky (app password), create connector directly
      if (!authCode) {
        return apiClient(`/api/integrations/${vendor}/auth/callback`, {
          method: 'POST',
          body: JSON.stringify({ demo: true }),
        });
      }
      
      // For OAuth flows
      return apiClient(`/api/integrations/${vendor}/auth/callback`, {
        method: 'POST',
        body: JSON.stringify({ code: authCode }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      toast({ title: `Connected to ${variables.vendor}` });
    },
    onError: (error, variables) => {
      toast({ 
        title: `Failed to connect to ${variables.vendor}`, 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async ({ connectorId, vendor }: { connectorId: string; vendor: VendorType }) => {
      // Emit REVOKED transaction
      await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId!,
        },
        body: JSON.stringify({
          smart_code: 'HERA.INTEGRATION.CONNECTOR.REVOKED.v1',
          metadata: {
            connector_id: connectorId,
            vendor,
          },
        }),
      });
      
      // Update connector status
      return fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId!,
        },
        body: JSON.stringify({
          id: connectorId,
          entity_type: 'connector',
          metadata: { status: 'inactive' },
        }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      toast({ title: `Disconnected from ${variables.vendor}` });
    },
    onError: () => {
      toast({ 
        title: 'Failed to disconnect', 
        variant: 'destructive' 
      });
    },
  });
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async ({ vendor, connectorId, syncType = 'incremental' }: { 
      vendor: VendorType; 
      connectorId: string;
      syncType?: 'full' | 'incremental';
    }) => {
      const syncRequest: SyncRequest = {
        connector_id: connectorId,
        sync_type: syncType,
      };
      
      return apiClient<SyncResult>(`/api/integrations/${vendor}/sync`, {
        method: 'POST',
        body: JSON.stringify(syncRequest),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status', orgId, variables.connectorId] });
      toast({ 
        title: `Sync started for ${variables.vendor}`,
        description: 'This may take a few minutes to complete.',
      });
    },
    onError: (error, variables) => {
      toast({ 
        title: `Failed to sync ${variables.vendor}`, 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateConnectorSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async ({ 
      connectorId, 
      schedule 
    }: { 
      connectorId: string; 
      schedule: string | null;
    }) => {
      return fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId!,
        },
        body: JSON.stringify({
          id: connectorId,
          entity_type: 'connector',
          metadata: { 
            sync_schedule: schedule,
            next_sync_at: schedule ? calculateNextRun(schedule) : null,
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      toast({ title: 'Sync schedule updated' });
    },
    onError: () => {
      toast({ 
        title: 'Failed to update schedule', 
        variant: 'destructive' 
      });
    },
  });
}

export function useSaveMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orgId = useOrgStore((state) => state.currentOrgId);
  
  return useMutation({
    mutationFn: async (mapping: Partial<ConnectorMapping>) => {
      // Create mapping as a relationship
      return fetch('/api/v2/universal/relationship-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId!,
        },
        body: JSON.stringify({
          from_entity_id: mapping.connector_id,
          to_entity_id: mapping.target_id,
          relationship_type: mapping.mapping_type,
          metadata: {
            source_id: mapping.source_id,
            source_name: mapping.source_name,
            target_name: mapping.target_name,
            is_active: mapping.is_active,
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connector-mappings'] });
      toast({ title: 'Mapping saved successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Failed to save mapping', 
        variant: 'destructive' 
      });
    },
  });
}

// Helper functions
function calculateNextRun(cronExpression: string): string {
  // Simple implementation - in production, use a cron parser library
  const now = new Date();
  
  // Basic patterns
  if (cronExpression === '0 * * * *') { // Every hour
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    now.setSeconds(0);
  } else if (cronExpression === '0 0 * * *') { // Daily at midnight
    now.setDate(now.getDate() + 1);
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
  } else if (cronExpression === '0 0 * * 0') { // Weekly on Sunday
    now.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
  } else {
    // Default to 1 hour from now
    now.setHours(now.getHours() + 1);
  }
  
  return now.toISOString();
}