/**
 * HERA Universal Tile System - React Hook for Tile Statistics
 * Provides real-time tile statistics with caching and error handling
 * Smart Code: HERA.PLATFORM.UI.HOOK.TILE_STATS.v1
 */

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiV2 } from '@/lib/client/fetchV2'

// ================================================================================
// TYPES
// ================================================================================

export interface TileStatResult {
  statId: string
  label: string
  value: number | string | null
  formattedValue: string
  format: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    percentage: number
    comparisonValue: number | string
  }
  executionTime: number
  error?: string
}

export interface TileStatsResponse {
  tileId: string
  stats: TileStatResult[]
  executedAt: string
  totalExecutionTime: number
  cacheHit: boolean
}

export interface UseTileStatsOptions {
  tileId: string
  organizationId: string
  enabled?: boolean
  refetchInterval?: number
  statsFilter?: string[]
  context?: {
    timeRange?: 'today' | 'week' | 'month' | 'year'
    filters?: Record<string, any>
  }
}

export interface UseTileStatsResult {
  stats: TileStatResult[]
  response: TileStatsResponse | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  refresh: (options?: { statsFilter?: string[] }) => Promise<void>
  isRefreshing: boolean
}

// ================================================================================
// MAIN HOOK
// ================================================================================

/**
 * Hook to fetch and manage tile statistics
 */
export function useTileStats({
  tileId,
  organizationId,
  enabled = true,
  refetchInterval = 60000, // 1 minute default
  statsFilter,
  context
}: UseTileStatsOptions): UseTileStatsResult {
  
  const queryClient = useQueryClient()
  
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['tile-stats', tileId, organizationId, statsFilter, context],
    queryFn: async () => {
      const response = await apiV2.get<TileStatsResponse>(
        `/tiles/${tileId}/stats`,
        {
          params: {
            ...(statsFilter && { stats: statsFilter.join(',') }),
            ...(context?.timeRange && { timeRange: context.timeRange }),
            ...(context?.filters && { filters: JSON.stringify(context.filters) })
          }
        }
      )
      return response.data
    },
    enabled: enabled && !!tileId && !!organizationId,
    refetchInterval,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation for refreshing stats with POST request
  const refreshMutation = useMutation({
    mutationFn: async (options?: { statsFilter?: string[] }) => {
      const response = await apiV2.post<TileStatsResponse>(
        `/tiles/${tileId}/stats`,
        {
          refresh: true,
          statsFilter: options?.statsFilter || statsFilter,
          context
        }
      )
      return response.data
    },
    onSuccess: (data) => {
      // Update the cache with fresh data
      queryClient.setQueryData(
        ['tile-stats', tileId, organizationId, statsFilter, context],
        data
      )
    },
  })

  const refresh = async (options?: { statsFilter?: string[] }) => {
    await refreshMutation.mutateAsync(options)
  }

  return {
    stats: response?.stats || [],
    response,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    refresh,
    isRefreshing: refreshMutation.isPending
  }
}

// ================================================================================
// UTILITY HOOKS
// ================================================================================

/**
 * Hook to get a specific stat by ID
 */
export function useTileStat({
  tileId,
  organizationId,
  statId,
  enabled = true,
  refetchInterval
}: UseTileStatsOptions & { statId: string }) {
  
  const { stats, isLoading, isError, error, refetch, refresh } = useTileStats({
    tileId,
    organizationId,
    enabled,
    refetchInterval,
    statsFilter: [statId]
  })
  
  const stat = stats.find(s => s.statId === statId) || null
  
  return {
    stat,
    isLoading,
    isError,
    error,
    refetch,
    refresh,
    notFound: !isLoading && !stat
  }
}

/**
 * Hook for multiple tiles stats (batch loading)
 */
export function useMultipleTileStats({
  tileIds,
  organizationId,
  enabled = true,
  refetchInterval
}: {
  tileIds: string[]
  organizationId: string
  enabled?: boolean
  refetchInterval?: number
}) {
  
  const queries = useQueries({
    queries: tileIds.map(tileId => ({
      queryKey: ['tile-stats', tileId, organizationId],
      queryFn: async () => {
        const response = await apiV2.get<TileStatsResponse>(`/tiles/${tileId}/stats`)
        return response.data
      },
      enabled: enabled && !!tileId && !!organizationId,
      refetchInterval,
      staleTime: 30 * 1000,
    }))
  })
  
  const allStats = new Map<string, TileStatResult[]>()
  let isLoading = false
  let hasError = false
  
  queries.forEach((query, index) => {
    const tileId = tileIds[index]
    allStats.set(tileId, query.data?.stats || [])
    
    if (query.isLoading) isLoading = true
    if (query.isError) hasError = true
  })
  
  return {
    statsMap: allStats,
    isLoading,
    hasError,
    queries
  }
}

/**
 * Hook for workspace-level stats aggregation
 */
export function useWorkspaceStats({
  workspaceId,
  organizationId,
  enabled = true
}: {
  workspaceId: string
  organizationId: string
  enabled?: boolean
}) {
  
  return useQuery({
    queryKey: ['workspace-stats', workspaceId, organizationId],
    queryFn: async () => {
      // Get all tiles for workspace first, then aggregate their stats
      const tilesResponse = await apiV2.get(`/workspaces/${workspaceId}/tiles/resolved`)
      const tiles = tilesResponse.data
      
      const statsPromises = tiles.map((tile: any) =>
        apiV2.get<TileStatsResponse>(`/tiles/${tile.tileId}/stats`)
          .then(res => ({ tileId: tile.tileId, tileName: tile.tileName, stats: res.data.stats }))
          .catch(err => ({ tileId: tile.tileId, tileName: tile.tileName, stats: [], error: err }))
      )
      
      const allStats = await Promise.all(statsPromises)
      
      return {
        workspaceId,
        tiles: allStats,
        totalTiles: tiles.length,
        aggregatedAt: new Date().toISOString()
      }
    },
    enabled: enabled && !!workspaceId && !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })
}

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

/**
 * Format stat value for display
 */
export function formatStatValue(
  value: number | string | null,
  format: string = 'number'
): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  switch (format) {
    case 'currency':
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numValue)
      }
      break

    case 'number':
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        return new Intl.NumberFormat('en-US').format(numValue)
      }
      break

    case 'percentage':
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(numValue / 100)
      }
      break

    case 'duration':
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        const hours = Math.floor(numValue / 3600)
        const minutes = Math.floor((numValue % 3600) / 60)
        if (hours > 0) {
          return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
      }
      break

    case 'relative_time':
      if (typeof value === 'string') {
        const date = new Date(value)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)
        
        if (diffDays > 0) return `${diffDays}d ago`
        if (diffHours > 0) return `${diffHours}h ago`
        return 'Just now'
      }
      break
  }

  return String(value)
}

/**
 * Get trend direction indicator
 */
export function getTrendIndicator(trend?: TileStatResult['trend']) {
  if (!trend) return null
  
  const { direction, percentage } = trend
  
  return {
    direction,
    percentage,
    icon: direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→',
    color: direction === 'up' ? 'text-green-600' : direction === 'down' ? 'text-red-600' : 'text-gray-500',
    bgColor: direction === 'up' ? 'bg-green-50' : direction === 'down' ? 'bg-red-50' : 'bg-gray-50'
  }
}

/**
 * Prefetch tile stats for performance
 */
export async function prefetchTileStats({
  queryClient,
  tileId,
  organizationId
}: {
  queryClient: any
  tileId: string
  organizationId: string
}) {
  await queryClient.prefetchQuery({
    queryKey: ['tile-stats', tileId, organizationId],
    queryFn: async () => {
      const response = await apiV2.get<TileStatsResponse>(`/tiles/${tileId}/stats`)
      return response.data
    },
    staleTime: 30 * 1000,
  })
}

// ================================================================================
// EXAMPLE USAGE COMPONENTS
// ================================================================================

/**
 * Example: Simple stat display component
 */
export function ExampleStatDisplay({ 
  tileId, 
  organizationId,
  statId 
}: { 
  tileId: string
  organizationId: string
  statId: string
}) {
  const { stat, isLoading, isError } = useTileStat({
    tileId,
    organizationId,
    statId
  })

  if (isLoading) return <div className="animate-pulse bg-gray-200 h-6 w-16 rounded" />
  if (isError) return <div className="text-red-600 text-sm">Error</div>
  if (!stat) return <div className="text-gray-400 text-sm">No data</div>

  const trend = getTrendIndicator(stat.trend)

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold">{stat.formattedValue}</span>
      {trend && (
        <span className={`text-xs px-1 py-0.5 rounded ${trend.bgColor} ${trend.color}`}>
          {trend.icon} {Math.abs(trend.percentage).toFixed(1)}%
        </span>
      )}
    </div>
  )
}

/**
 * Example: Stats grid for a tile
 */
export function ExampleTileStatsGrid({
  tileId,
  organizationId
}: {
  tileId: string
  organizationId: string
}) {
  const { stats, isLoading, refresh, isRefreshing } = useTileStats({
    tileId,
    organizationId,
    refetchInterval: 60000 // 1 minute
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-4 w-20 rounded mb-2" />
            <div className="bg-gray-200 h-6 w-16 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Statistics</h3>
        <button
          onClick={() => refresh()}
          disabled={isRefreshing}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => {
          const trend = getTrendIndicator(stat.trend)
          
          return (
            <div key={stat.statId} className="space-y-1">
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{stat.formattedValue}</span>
                {trend && (
                  <span className={`text-xs px-1 py-0.5 rounded ${trend.bgColor} ${trend.color}`}>
                    {trend.icon} {Math.abs(trend.percentage).toFixed(1)}%
                  </span>
                )}
              </div>
              {stat.error && (
                <div className="text-xs text-red-600">{stat.error}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Re-import useQueries (it's not available by default)
import { useQueries } from '@tanstack/react-query'

// Export everything
export default useTileStats