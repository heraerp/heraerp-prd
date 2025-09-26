import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'
import type { SyncRun, SyncStats } from '@/types/integration-hub'
import { useToast } from '@/components/ui/use-toast'

// Fetch sync runs for an organization
export function useSyncRuns(organizationId: string, limit = 50) {
  return useQuery({
    queryKey: ['integration-sync-runs', organizationId, limit],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          entity_type: 'integration_sync_run',
          organization_id: organizationId
        }
      })
      // Sort by started_at desc and limit
      const sorted = result.data.sort((a, b) => 
        new Date(b.metadata?.started_at || 0).getTime() - 
        new Date(a.metadata?.started_at || 0).getTime()
      )
      return sorted.slice(0, limit) as SyncRun[]
    },
    enabled: !!organizationId
  })
}

// Fetch sync runs for a specific sync job
export function useSyncJobRuns(syncJobId: string, limit = 20) {
  return useQuery({
    queryKey: ['integration-sync-runs', 'sync-job', syncJobId, limit],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          entity_type: 'integration_sync_run'
        }
      })
      // Filter by sync_job_id in metadata
      const filtered = result.data.filter(r => r.metadata?.sync_job_id === syncJobId)
      const sorted = filtered.sort((a, b) => 
        new Date(b.metadata?.started_at || 0).getTime() - 
        new Date(a.metadata?.started_at || 0).getTime()
      )
      return sorted.slice(0, limit) as SyncRun[]
    },
    enabled: !!syncJobId
  })
}

// Fetch a single sync run
export function useSyncRun(syncRunId: string) {
  return useQuery({
    queryKey: ['integration-sync-run', syncRunId],
    queryFn: async () => {
      const result = await universalApi.read({
        table: 'core_entities',
        filters: {
          id: syncRunId,
          entity_type: 'integration_sync_run'
        }
      })
      return result.data[0] as SyncRun
    },
    enabled: !!syncRunId,
    refetchInterval: (data) => {
      // Refetch every 5 seconds if still running
      return data?.status === 'running' ? 5000 : false
    }
  })
}

// Cancel a running sync
export function useCancelSyncRun() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (syncRunId: string) => {
      const response = await fetch(`/api/integration-hub/sync-runs/${syncRunId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to cancel sync run')
      }

      return response.json()
    },
    onSuccess: (data, syncRunId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['integration-sync-run', syncRunId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['integration-sync-runs'] 
      })
      toast({
        title: 'Sync cancelled',
        description: 'Sync run has been cancelled successfully.'
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to cancel sync',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Retry failed records in a sync run
export function useRetrySyncErrors() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      syncRunId: string
      recordIds?: string[]
    }) => {
      const response = await fetch(`/api/integration-hub/sync-runs/${data.syncRunId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recordIds: data.recordIds })
      })

      if (!response.ok) {
        throw new Error('Failed to retry sync errors')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['integration-sync-run', variables.syncRunId] 
      })
      toast({
        title: 'Retry initiated',
        description: `Retrying ${data.recordCount} failed records.`
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to retry sync errors',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Get sync run logs
export function useSyncRunLogs(syncRunId: string) {
  return useQuery({
    queryKey: ['integration-sync-run-logs', syncRunId],
    queryFn: async () => {
      const response = await fetch(`/api/integration-hub/sync-runs/${syncRunId}/logs`)
      if (!response.ok) {
        throw new Error('Failed to fetch sync run logs')
      }
      return response.json()
    },
    enabled: !!syncRunId
  })
}

// Get sync run errors
export function useSyncRunErrors(syncRunId: string) {
  return useQuery({
    queryKey: ['integration-sync-run-errors', syncRunId],
    queryFn: async () => {
      const response = await fetch(`/api/integration-hub/sync-runs/${syncRunId}/errors`)
      if (!response.ok) {
        throw new Error('Failed to fetch sync run errors')
      }
      return response.json()
    },
    enabled: !!syncRunId
  })
}

// Get aggregated sync statistics for dashboard
export function useSyncStatistics(organizationId: string, period: '24h' | '7d' | '30d' = '24h') {
  return useQuery({
    queryKey: ['integration-sync-statistics', organizationId, period],
    queryFn: async () => {
      const response = await fetch(
        `/api/integration-hub/statistics?organizationId=${organizationId}&period=${period}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch sync statistics')
      }
      return response.json()
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}