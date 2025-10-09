/**
 * HERA Enterprise Inventory Levels Hook
 * Smart Code: HERA.HOOKS.INVENTORY.LEVELS.V1
 *
 * Read-only hook for fetching per-branch inventory levels
 * Uses Universal API v2 with automatic fallback
 *
 * Features:
 * - Real-time stock levels per product per branch
 * - Automatic branch context from useBranchFilter
 * - Intelligent fallback (analytics → RPC)
 * - Type-safe response mapping
 * - React Query caching and deduplication
 */

import { useQuery } from '@tanstack/react-query'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { apiV2 } from '@/lib/client/fetchV2'

// ==================== TYPES ====================

export interface InventoryLevel {
  product_id: string
  branch_id: string
  on_hand: number
  reserved: number
  available: number
  reorder_level?: number
  last_updated?: string
}

export interface InventoryLevelsRequest {
  product_ids?: string[]
  branch_id?: string
  organization_id: string
}

export interface InventoryLevelsResponse {
  items: InventoryLevel[]
  total_count: number
  cached_at?: string
}

// ==================== HOOK ====================

/**
 * Fetch inventory levels for given products
 *
 * @param productIds - Optional array of product IDs to fetch levels for
 * @param organizationId - Organization ID (required)
 * @param options - Additional query options
 */
export function useInventoryLevels(
  productIds?: string[],
  organizationId?: string,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  }
) {
  const { branchId: selectedBranchId } = useBranchFilter()

  return useQuery({
    queryKey: ['inventory-levels', { productIds, selectedBranchId, organizationId }] as const,
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required for inventory levels')
      }

      // Try analytics endpoint first (optimized aggregation)
      try {
        const { data, error } = await apiV2.get('analytics/inventory/levels', {
          product_ids: productIds,
          branch_id: selectedBranchId,
          organization_id: organizationId
        })

        if (error) throw error
        return data as InventoryLevelsResponse
      } catch (analyticsError) {
        console.warn(
          '[useInventoryLevels] Analytics endpoint failed, falling back to RPC:',
          analyticsError
        )

        // Fallback to RPC function
        const { data, error } = await apiV2.post('rpc/inventory_levels_v1', {
          p_organization_id: organizationId,
          p_product_ids: productIds,
          p_branch_id: selectedBranchId
        })

        if (error) throw error
        return data as InventoryLevelsResponse
      }
    },
    enabled: options?.enabled !== false && !!organizationId && (productIds?.length ?? 0) > 0,
    refetchInterval: options?.refetchInterval,
    staleTime: 30000, // 30 seconds
    gcTime: 300000 // 5 minutes (formerly cacheTime)
  })
}

// ==================== HELPERS ====================

/**
 * Map inventory levels array to a lookup object by product_id
 * Useful for quick lookups in rendering loops
 */
export function mapLevelsByProduct(items?: InventoryLevel[]): Record<string, InventoryLevel> {
  const map: Record<string, InventoryLevel> = {}
  if (!items) return map

  for (const item of items) {
    // Use the most recent entry for each product (in case of duplicates)
    if (
      !map[item.product_id] ||
      (item.last_updated &&
        (!map[item.product_id].last_updated ||
          item.last_updated > map[item.product_id].last_updated!))
    ) {
      map[item.product_id] = item
    }
  }

  return map
}

/**
 * Map inventory levels by branch_id for branch-specific lookups
 */
export function mapLevelsByBranch(items?: InventoryLevel[]): Record<string, InventoryLevel[]> {
  const map: Record<string, InventoryLevel[]> = {}
  if (!items) return map

  for (const item of items) {
    if (!map[item.branch_id]) {
      map[item.branch_id] = []
    }
    map[item.branch_id].push(item)
  }

  return map
}

/**
 * Calculate stock status based on levels
 */
export function getStockStatus(
  level: InventoryLevel
): 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' {
  const { available, reorder_level = 10 } = level

  if (available === 0) return 'out_of_stock'
  if (available <= reorder_level) return 'low_stock'
  if (available > reorder_level * 3) return 'overstock'
  return 'in_stock'
}

/**
 * Get human-readable stock status label
 */
export function getStockStatusLabel(status: ReturnType<typeof getStockStatus>): string {
  const labels = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    overstock: 'Overstock'
  }
  return labels[status]
}

/**
 * Get stock status color (semantic tokens)
 */
export function getStockStatusVariant(
  status: ReturnType<typeof getStockStatus>
): 'default' | 'destructive' | 'outline' | 'secondary' {
  const variants = {
    in_stock: 'default' as const,
    low_stock: 'secondary' as const,
    out_of_stock: 'destructive' as const,
    overstock: 'outline' as const
  }
  return variants[status]
}
