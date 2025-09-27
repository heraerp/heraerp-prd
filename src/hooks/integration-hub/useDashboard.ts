import { useQuery } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'
import type { IntegrationDashboard } from '@/types/integration-hub'

// Fetch dashboard data for the integration hub
export function useIntegrationDashboard(organizationId: string) {
  return useQuery({
    queryKey: ['integration-dashboard', organizationId],
    queryFn: async () => {
      // Fetch all data in parallel
      const [connectors, syncJobs, syncRuns] = await Promise.all([
        universalApi.read({
          table: 'core_entities',
          filters: {
            entity_type: 'integration_connector',
            organization_id: organizationId
          }
        }),
        universalApi.read({
          table: 'core_entities',
          filters: {
            entity_type: 'integration_sync_job',
            organization_id: organizationId
          }
        }),
        universalApi.read({
          table: 'core_entities',
          filters: {
            entity_type: 'integration_sync_run',
            organization_id: organizationId
          }
        })
      ])

      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Filter runs from last 24 hours
      const recentRuns = syncRuns.data.filter(
        run => new Date(run.metadata?.started_at || 0) > yesterday
      )

      // Calculate statistics
      const activeConnectors = connectors.data.filter(c => c.metadata?.status === 'active').length

      const activeSyncJobs = syncJobs.data.filter(j => j.metadata?.status === 'active').length

      // Calculate health summary
      const healthSummary = {
        healthy: connectors.data.filter(c => c.metadata?.health_status === 'healthy').length,
        degraded: connectors.data.filter(c => c.metadata?.health_status === 'degraded').length,
        unhealthy: connectors.data.filter(c => c.metadata?.health_status === 'unhealthy').length
      }

      // Aggregate sync run stats
      let totalRecords = 0
      let totalErrors = 0
      const allErrors: any[] = []

      recentRuns.forEach(run => {
        const stats = run.metadata?.stats || {}
        totalRecords += stats.processed_records || 0
        totalErrors += stats.error_records || 0
        if (run.metadata?.errors) {
          allErrors.push(...run.metadata.errors)
        }
      })

      // Get top errors
      const errorCounts = new Map<string, number>()
      allErrors.forEach(error => {
        const key = error.error_code || error.message
        errorCounts.set(key, (errorCounts.get(key) || 0) + 1)
      })
      const topErrors = Array.from(errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([message, count]) => ({
          message,
          count,
          timestamp: new Date().toISOString(),
          error_type: 'aggregated',
          error_code: 'AGGREGATED'
        }))

      // Get upcoming syncs
      const upcomingSyncs = syncJobs.data
        .filter(job => job.metadata?.next_run)
        .sort(
          (a, b) =>
            new Date(a.metadata.next_run).getTime() - new Date(b.metadata.next_run).getTime()
        )
        .slice(0, 5)

      const dashboard: IntegrationDashboard = {
        total_connectors: connectors.data.length,
        active_connectors: activeConnectors,
        total_sync_jobs: syncJobs.data.length,
        active_sync_jobs: activeSyncJobs,
        last_24h_syncs: recentRuns.length,
        last_24h_records: totalRecords,
        last_24h_errors: totalErrors,
        health_summary: healthSummary,
        top_errors: topErrors,
        upcoming_syncs: upcomingSyncs
      }

      return dashboard
    },
    enabled: !!organizationId,
    refetchInterval: 1000 * 60 // Refetch every minute
  })
}

// Fetch connector health metrics
export function useConnectorHealthMetrics(organizationId: string) {
  return useQuery({
    queryKey: ['integration-connector-health-metrics', organizationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/integration-hub/health-metrics?organizationId=${organizationId}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch health metrics')
      }
      return response.json()
    },
    enabled: !!organizationId,
    refetchInterval: 1000 * 30 // Refetch every 30 seconds
  })
}

// Fetch sync performance metrics
export function useSyncPerformanceMetrics(
  organizationId: string,
  period: '1h' | '24h' | '7d' = '24h'
) {
  return useQuery({
    queryKey: ['integration-sync-performance-metrics', organizationId, period],
    queryFn: async () => {
      const response = await fetch(
        `/api/integration-hub/performance-metrics?organizationId=${organizationId}&period=${period}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics')
      }
      return response.json()
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

// Fetch data flow statistics
export function useDataFlowStatistics(organizationId: string) {
  return useQuery({
    queryKey: ['integration-data-flow-statistics', organizationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/integration-hub/data-flow?organizationId=${organizationId}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch data flow statistics')
      }
      return response.json()
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  })
}
