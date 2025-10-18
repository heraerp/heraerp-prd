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

  // Phase 1 hook
  const phase1 = useHeraInventory(options)

  // Phase 2 hook
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
      ...phase1
    }
  }

  if (usePhase2) {
    console.log('✅ [Unified Inventory] Using Phase 2 (STOCK_LEVEL entities)')
    return {
      ...phase2,
      items: phase2.stockLevels,
      phase: 'phase2' as const,
      isLoading: phase2.isLoading,
      refetch: phase2.refetch
    }
  }

  console.log('📦 [Unified Inventory] Using Phase 1 (product.stock_quantity)')
  return {
    ...phase1,
    phase: 'phase1' as const
  }
}
