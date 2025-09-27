import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'
import type { SyncJob, SyncSchedule, SyncOptions, SyncRun } from '@/types/integration-hub'
import { useToast } from '@/components/ui/use-toast'

// Fetch all sync jobs for an organization
export function useSyncJobs(organizationId: string) {
  return useQuery({
    queryKey: ['integration-sync-jobs', organizationId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          entity_type: 'integration_sync_job',
          organization_id: organizationId
        }
      })
      return result.data as SyncJob[]
    },
    enabled: !!organizationId
  })
}

// Fetch sync jobs for a specific connector
export function useConnectorSyncJobs(connectorId: string) {
  return useQuery({
    queryKey: ['integration-sync-jobs', 'connector', connectorId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          entity_type: 'integration_sync_job'
        }
      })
      // Filter by connector_id in metadata
      return result.data.filter(j => j.metadata?.connector_id === connectorId) as SyncJob[]
    },
    enabled: !!connectorId
  })
}

// Fetch a single sync job
export function useSyncJob(syncJobId: string) {
  return useQuery({
    queryKey: ['integration-sync-job', syncJobId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          id: syncJobId,
          entity_type: 'integration_sync_job'
        }
      })
      return result.data[0] as SyncJob
    },
    enabled: !!syncJobId
  })
}

// Create a new sync job
export function useCreateSyncJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      organizationId: string
      connectorId: string
      mappingId: string
      name: string
      syncType: SyncJob['sync_type']
      syncDirection: SyncJob['sync_direction']
      schedule?: SyncSchedule
      options: SyncOptions
    }) => {
      const syncJob = await universalApi.createEntity({
        entity_type: 'integration_sync_job',
        entity_name: data.name,
        entity_code: `SYNC-${Date.now()}`,
        organization_id: data.organizationId,
        smart_code: `HERA.INTEGRATIONS.SYNC.${data.syncType.toUpperCase()}.v1`,
        metadata: {
          connector_id: data.connectorId,
          mapping_id: data.mappingId,
          sync_type: data.syncType,
          sync_direction: data.syncDirection,
          schedule: data.schedule,
          options: data.options,
          status: 'active',
          filters: []
        }
      })

      return syncJob as SyncJob
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs', variables.organizationId]
      })
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs', 'connector', variables.connectorId]
      })
      toast({
        title: 'Sync job created',
        description: 'Sync job has been created successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to create sync job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Update a sync job
export function useUpdateSyncJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      syncJobId: string
      organizationId: string
      updates: Partial<SyncJob>
    }) => {
      await universalApi.updateEntity({
        id: data.syncJobId,
        metadata: data.updates
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-job', variables.syncJobId]
      })
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs', variables.organizationId]
      })
      toast({
        title: 'Sync job updated',
        description: 'Sync job has been updated successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to update sync job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Delete a sync job
export function useDeleteSyncJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { syncJobId: string; organizationId: string }) => {
      await universalApi.deleteEntity(data.syncJobId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs', variables.organizationId]
      })
      toast({
        title: 'Sync job deleted',
        description: 'Sync job has been deleted successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to delete sync job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Run a sync job manually
export function useRunSyncJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (syncJobId: string) => {
      const response = await fetch(`/api/integration-hub/sync-jobs/${syncJobId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to run sync job')
      }

      return response.json()
    },
    onSuccess: (data, syncJobId) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-job', syncJobId]
      })
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-runs']
      })
      toast({
        title: 'Sync job started',
        description: 'Sync job has been started successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Failed to run sync job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Pause/resume a sync job
export function useToggleSyncJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      syncJobId: string
      organizationId: string
      action: 'pause' | 'resume'
    }) => {
      await universalApi.updateEntity({
        id: data.syncJobId,
        metadata: {
          status: data.action === 'pause' ? 'paused' : 'active'
        }
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-job', variables.syncJobId]
      })
      queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs', variables.organizationId]
      })
      toast({
        title: variables.action === 'pause' ? 'Sync job paused' : 'Sync job resumed',
        description: `Sync job has been ${variables.action}d successfully.`
      })
    },
    onError: error => {
      toast({
        title: 'Failed to update sync job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}
