/**
 * HERA Universal Tile System - React Hook for Resolved Tiles
 * Provides clean React integration for consuming resolved tile configurations
 * Smart Code: HERA.PLATFORM.UI.HOOK.RESOLVED_TILES.v1
 */

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ResolvedTileConfig } from './resolved-tile-config'
import { apiV2 } from '@/lib/client/fetchV2'

// ================================================================================
// TYPES
// ================================================================================

export interface UseResolvedTilesOptions {
  workspaceId: string
  organizationId: string
  enabled?: boolean
  refetchInterval?: number
}

export interface UseResolvedTilesResult {
  tiles: ResolvedTileConfig[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  isRefetching: boolean
}

// ================================================================================
// MAIN HOOK
// ================================================================================

/**
 * Hook to fetch resolved tile configurations for a workspace
 */
export function useResolvedTiles({
  workspaceId,
  organizationId,
  enabled = true,
  refetchInterval
}: UseResolvedTilesOptions): UseResolvedTilesResult {
  
  const {
    data: tiles = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['resolved-tiles', workspaceId, organizationId],
    queryFn: async () => {
      const response = await apiV2.get<ResolvedTileConfig[]>(
        `/workspaces/${workspaceId}/tiles/resolved`
      )
      return response.data
    },
    enabled: enabled && !!workspaceId && !!organizationId,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes (was cacheTime)
  })

  return {
    tiles,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    isRefetching
  }
}

// ================================================================================
// UTILITY HOOKS
// ================================================================================

/**
 * Hook to get a specific tile by ID
 */
export function useResolvedTile({
  workspaceId,
  organizationId,
  tileId,
  enabled = true
}: UseResolvedTilesOptions & { tileId: string }) {
  
  const { tiles, isLoading, isError, error } = useResolvedTiles({
    workspaceId,
    organizationId,
    enabled
  })
  
  const tile = tiles.find(t => t.tileId === tileId) || null
  
  return {
    tile,
    isLoading,
    isError,
    error,
    notFound: !isLoading && !tile
  }
}

/**
 * Hook to get tiles filtered by type
 */
export function useResolvedTilesByType({
  workspaceId,
  organizationId,
  tileType,
  enabled = true
}: UseResolvedTilesOptions & { tileType: ResolvedTileConfig['tileType'] }) {
  
  const { tiles, isLoading, isError, error, refetch } = useResolvedTiles({
    workspaceId,
    organizationId,
    enabled
  })
  
  const filteredTiles = tiles.filter(t => t.tileType === tileType)
  
  return {
    tiles: filteredTiles,
    count: filteredTiles.length,
    isLoading,
    isError,
    error,
    refetch
  }
}

/**
 * Hook for tile statistics (aggregated data)
 */
export function useWorkspaceTileStats({
  workspaceId,
  organizationId,
  enabled = true
}: UseResolvedTilesOptions) {
  
  const { tiles, isLoading, isError, error } = useResolvedTiles({
    workspaceId,
    organizationId,
    enabled
  })
  
  const stats = {
    totalTiles: tiles.length,
    tilesByType: tiles.reduce((acc, tile) => {
      acc[tile.tileType] = (acc[tile.tileType] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    tilesByCategory: tiles.reduce((acc, tile) => {
      acc[tile.operationCategory] = (acc[tile.operationCategory] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    tilesWithActions: tiles.filter(t => t.actions.length > 0).length,
    tilesWithStats: tiles.filter(t => t.stats.length > 0).length
  }
  
  return {
    stats,
    isLoading,
    isError,
    error
  }
}

// ================================================================================
// PREFETCH UTILITIES
// ================================================================================

/**
 * Prefetch resolved tiles for a workspace (useful for route transitions)
 */
export async function prefetchResolvedTiles({
  queryClient,
  workspaceId,
  organizationId
}: {
  queryClient: any // QueryClient from @tanstack/react-query
  workspaceId: string
  organizationId: string
}) {
  await queryClient.prefetchQuery({
    queryKey: ['resolved-tiles', workspaceId, organizationId],
    queryFn: async () => {
      const response = await apiV2.get<ResolvedTileConfig[]>(
        `/workspaces/${workspaceId}/tiles/resolved`
      )
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ================================================================================
// EXAMPLE USAGE COMPONENTS
// ================================================================================

/**
 * Example: Simple workspace component using resolved tiles
 */
export function ExampleWorkspaceComponent({ 
  workspaceId, 
  organizationId 
}: { 
  workspaceId: string
  organizationId: string 
}) {
  const { tiles, isLoading, isError } = useResolvedTiles({
    workspaceId,
    organizationId
  })

  if (isLoading) {
    return <div>Loading tiles...</div>
  }

  if (isError) {
    return <div>Error loading tiles</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tiles
        .sort((a, b) => a.layout.position - b.layout.position)
        .map((tile) => (
          <div key={tile.tileId} className="border rounded-lg p-4">
            <h3 className="font-semibold">{tile.ui.title}</h3>
            <p className="text-sm text-gray-600">{tile.ui.subtitle}</p>
            <div className="mt-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {tile.tileType}
              </span>
            </div>
          </div>
        ))}
    </div>
  )
}

/**
 * Example: Tile stats dashboard
 */
export function ExampleTileStatsDashboard({
  workspaceId,
  organizationId
}: {
  workspaceId: string
  organizationId: string
}) {
  const { stats, isLoading } = useWorkspaceTileStats({
    workspaceId,
    organizationId
  })

  if (isLoading) {
    return <div>Loading stats...</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg border">
        <div className="text-2xl font-bold">{stats.totalTiles}</div>
        <div className="text-sm text-gray-600">Total Tiles</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <div className="text-2xl font-bold">{stats.tilesWithActions}</div>
        <div className="text-sm text-gray-600">With Actions</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <div className="text-2xl font-bold">{stats.tilesWithStats}</div>
        <div className="text-sm text-gray-600">With Stats</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border">
        <div className="text-2xl font-bold">
          {Object.keys(stats.tilesByType).length}
        </div>
        <div className="text-sm text-gray-600">Tile Types</div>
      </div>
    </div>
  )
}

// Export everything
export default useResolvedTiles