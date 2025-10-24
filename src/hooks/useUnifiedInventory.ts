/**
 * Unified Inventory Hook (Phase 1 + Phase 2)
 *
 * Automatically detects and uses:
 * - Phase 2 (STOCK_LEVEL entities) when available
 * - Phase 1 (product.stock_quantity) as fallback
 *
 * ✅ Seamless migration support
 * ✅ Backward compatible
 */

import { useEffect, useState } from 'react'
import { useHeraInventory } from './useHeraInventory'
import { useStockLevels } from './useStockLevels'
import { apiV2 } from '@/lib/client/fetchV2'

interface UseUnifiedInventoryOptions {
  organizationId?: string
  branchId?: string
  includeArchived?: boolean
  searchQuery?: string
  categoryFilter?: string
}

export function useUnifiedInventory(options: UseUnifiedInventoryOptions) {
  const { organizationId, branchId } = options
  const [usePhase2, setUsePhase2] = useState<boolean | null>(null)
  const [isCheckingPhase, setIsCheckingPhase] = useState(true)

  // Check if Phase 2 stock levels exist
  useEffect(() => {
    async function checkPhase2() {
      if (!organizationId) {
        setIsCheckingPhase(false)
        return
      }

      try {
        const result = await apiV2.get('entities', {
          p_organization_id: organizationId,
          p_entity_type: 'STOCK_LEVEL',
          p_limit: 1
        })

        const hasStockLevels = (result.data?.data || []).length > 0
        console.log('📊 [Unified Inventory] Phase detection:', hasStockLevels ? 'Phase 2' : 'Phase 1')
        setUsePhase2(hasStockLevels)
      } catch (error) {
        console.error('[Unified Inventory] Phase detection failed:', error)
        setUsePhase2(false)
      } finally {
        setIsCheckingPhase(false)
      }
    }

    checkPhase2()
  }, [organizationId])

  // ✅ ALWAYS initialize both hooks (React Hooks Rules)
  // We'll just ignore the one we don't need
  const phase1 = useHeraInventory(options)
  const phase2 = useStockLevels({
    organizationId,
    locationId: branchId !== 'all' ? branchId : undefined
  })

  // Return the appropriate hook
  if (isCheckingPhase) {
    return {
      items: [],
      isLoading: true,
      phase: 'checking' as const,
      refetch: async () => {},
      createItem: undefined,
      updateItem: undefined,
      archiveItem: undefined,
      restoreItem: undefined,
      lowStockCount: 0,
      totalValue: 0
    }
  }

  if (usePhase2) {
    console.log('✅ [Unified Inventory] Using Phase 2 (STOCK_LEVEL entities)')
    console.log('   Stock levels loaded:', phase2.stockLevels?.length || 0)
    console.log('   Phase 2 loading:', phase2.isLoading)

    // Map Phase 2 stock levels to look like inventory items
    const mappedItems = (phase2.stockLevels || []).map((sl: any) => ({
      id: sl.id,
      entity_name: sl.entity_name,
      entity_code: sl.entity_code,
      smart_code: sl.smart_code,
      status: sl.status || 'active',
      product_id: sl.product_id,
      product_name: sl.product_name,
      location_id: sl.location_id,
      location_name: sl.location_name,
      stock_quantity: sl.quantity,
      reorder_level: sl.reorder_level,
      stock_status: sl.status,
      stock_value: 0, // TODO: Calculate from cost price
      created_at: sl.created_at,
      updated_at: sl.updated_at,
      relationships: sl.relationships
    }))

    return {
      items: mappedItems,
      isLoading: phase2.isLoading,
      error: phase2.error,
      refetch: phase2.refetch,
      phase: 'phase2' as const,
      // Phase 2 specific methods
      createStockLevel: phase2.createStockLevel,
      adjustStock: phase2.adjustStock,
      incrementStock: phase2.incrementStock,
      decrementStock: phase2.decrementStock,
      isAdjusting: phase2.isAdjusting,
      // Keep Phase 1 methods for compatibility
      createItem: async () => { throw new Error('Use createStockLevel for Phase 2') },
      updateItem: async () => { throw new Error('Use adjustStock for Phase 2') },
      archiveItem: async () => { throw new Error('Not supported in Phase 2') },
      restoreItem: async () => { throw new Error('Not supported in Phase 2') },
      lowStockCount: mappedItems.filter(i => i.stock_status === 'low_stock' || i.stock_status === 'out_of_stock').length,
      totalValue: 0 // TODO: Calculate from stock values
    }
  }

  console.log('📦 [Unified Inventory] Using Phase 1 (product.stock_quantity)')
  return {
    ...phase1,
    phase: 'phase1' as const,
    // Phase 1 doesn't have these
    createStockLevel: undefined,
    adjustStock: undefined,
    incrementStock: undefined,
    decrementStock: undefined,
    isAdjusting: false
  }
}
