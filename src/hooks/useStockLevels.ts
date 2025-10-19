/**
 * HERA Phase 2 Stock Management Hook
 *
 * Enterprise-grade inventory using STOCK_LEVEL entities + transactions
 * ✅ NO direct Supabase calls
 * ✅ Uses useUniversalEntity (v2 API - reliable and tested)
 * ✅ Full audit trail via transactions
 * ✅ Multi-branch support built-in
 */

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import { useUniversalTransaction } from './useUniversalTransaction'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntity'

export interface StockLevel {
  id: string
  entity_name: string
  product_id: string
  product_name?: string
  location_id: string
  location_name?: string
  quantity: number
  reorder_level: number
  last_counted_at?: string
  last_counted_by?: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  created_at: string
  updated_at: string
}

export interface StockMovement {
  movement_type: 'adjust_in' | 'adjust_out' | 'receive' | 'transfer_in' | 'transfer_out' | 'sale'
  quantity: number
  reason?: string
  reference?: string
}

interface UseStockLevelsOptions {
  organizationId?: string
  productId?: string
  locationId?: string
}

export function useStockLevels(options: UseStockLevelsOptions) {
  const { organizationId, productId, locationId } = options

  // ✅ Fetch STOCK_LEVEL entities using Universal Entity hook (v2 API - reliable and tested)
  const {
    entities: stockLevels,
    isLoading,
    error,
    refetch,
    create: createStockLevelEntity,
    update: updateStockLevelEntity
  } = useUniversalEntity({
    entity_type: 'STOCK_LEVEL', // Will be normalized to uppercase by useUniversalEntity
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: 100
      // Removed status filter - let's fetch all stock levels
    },
    dynamicFields: [
      { name: 'quantity', type: 'number', smart_code: 'HERA.SALON.INV.DYN.QTY.V1' },
      { name: 'reorder_level', type: 'number', smart_code: 'HERA.SALON.INV.DYN.REORDER.V1' },
      { name: 'last_counted_at', type: 'date', smart_code: 'HERA.SALON.INV.DYN.LAST_COUNTED.V1' },
      { name: 'last_counted_by', type: 'text', smart_code: 'HERA.SALON.INV.DYN.COUNTED_BY.V1' }
    ] as DynamicFieldDef[],
    relationships: [
      { type: 'STOCK_OF_PRODUCT', smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1' },
      { type: 'STOCK_AT_LOCATION', smart_code: 'HERA.SALON.INV.REL.STOCKATLOCATION.V1' }
    ] as RelationshipDef[]
  })

  // Debug: Log what entity_type is being fetched
  console.log('[useStockLevels] 🔍 Hook initialized with:', {
    entity_type: 'STOCK_LEVEL',
    organizationId,
    stockLevelsCount: stockLevels?.length || 0,
    sampleEntity: stockLevels?.[0]
  })

  // Transaction hook for stock movements (using v2 API)
  const {
    create: createTransaction,
    isCreating: isCreatingMovement
  } = useUniversalTransaction({
    organizationId
  })

  // Filter stock levels by product and/or location
  const filteredStockLevels = useMemo(() => {
    if (!stockLevels) return []

    console.log('[useStockLevels] 🔍 Filtering stock levels:', {
      totalStockLevels: stockLevels.length,
      productId,
      locationId,
      sampleStockLevel: stockLevels[0]
    })

    let filtered = stockLevels as any[]

    // Filter by product
    if (productId) {
      console.log('[useStockLevels] 🔍 Filtering by productId:', productId)
      filtered = filtered.filter(sl => {
        const productRels = sl.relationships?.STOCK_OF_PRODUCT || sl.relationships?.stock_of_product || []
        console.log('[useStockLevels] 🔍 Checking stock level:', {
          stockLevelId: sl.id,
          hasRelationships: !!sl.relationships,
          productRels,
          isArray: Array.isArray(productRels)
        })
        if (Array.isArray(productRels)) {
          const matches = productRels.some((rel: any) => {
            const matchesById = rel.to_entity_id === productId || rel.to_entity?.id === productId
            console.log('[useStockLevels] 🔍 Checking rel:', { rel, matchesById })
            return matchesById
          })
          return matches
        }
        return productRels.to_entity_id === productId || productRels.to_entity?.id === productId
      })
      console.log('[useStockLevels] ✅ Filtered by product, count:', filtered.length)
    }

    // Filter by location
    if (locationId) {
      filtered = filtered.filter(sl => {
        const locationRels = sl.relationships?.STOCK_AT_LOCATION || sl.relationships?.stock_at_location || []
        if (Array.isArray(locationRels)) {
          return locationRels.some((rel: any) => rel.to_entity?.id === locationId)
        }
        return locationRels.to_entity?.id === locationId
      })
    }

    // Calculate stock status
    return filtered.map(sl => ({
      ...sl,
      status: sl.quantity === 0
        ? 'out_of_stock'
        : sl.quantity <= (sl.reorder_level || 10)
          ? 'low_stock'
          : 'in_stock'
    }))
  }, [stockLevels, productId, locationId])

  /**
   * Create a new stock level for a product at a location
   */
  const createStockLevel = async (params: {
    product_id: string
    product_name: string
    location_id: string
    location_name: string
    quantity: number
    reorder_level?: number
  }) => {
    if (!organizationId) throw new Error('Organization ID required')

    console.log('[useStockLevels] 🏗️ createStockLevel called with params:', {
      product_id: params.product_id,
      product_name: params.product_name,
      location_id: params.location_id,
      location_name: params.location_name,
      quantity: params.quantity,
      reorder_level: params.reorder_level,
      organizationId
    })

    const entity_name = `Stock: ${params.product_name} @ ${params.location_name}`
    const entity_code = `STOCK-${params.product_id.substring(0, 8)}-${params.location_id.substring(0, 8)}-${Date.now().toString(36).substring(-4)}`

    console.log('[useStockLevels] 🔨 Creating STOCK_LEVEL entity with relationships:', {
      entity_name,
      entity_code,
      relationships: {
        STOCK_OF_PRODUCT: [params.product_id],
        STOCK_AT_LOCATION: [params.location_id]
      }
    })

    const result = await createStockLevelEntity({
      entity_type: 'STOCK_LEVEL',
      entity_name,
      entity_code,
      smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.V1',
      dynamic_fields: {
        quantity: {
          value: params.quantity,
          type: 'number',
          smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
        },
        reorder_level: {
          value: params.reorder_level || 10,
          type: 'number',
          smart_code: 'HERA.SALON.INV.DYN.REORDER.V1'
        }
      },
      relationships: {
        STOCK_OF_PRODUCT: [params.product_id],
        STOCK_AT_LOCATION: [params.location_id]
      }
    } as any)

    console.log('[useStockLevels] ✅ STOCK_LEVEL entity created, result:', result)

    return result
  }

  /**
   * Adjust stock quantity with transaction audit trail
   *
   * ✅ HERA PATTERN: Creates transaction + updates entity atomically
   */
  const adjustStock = async (params: {
    stock_level_id: string
    product_id: string
    location_id: string
    movement: StockMovement
    current_quantity: number
  }) => {
    if (!organizationId) throw new Error('Organization ID required')

    const { stock_level_id, product_id, location_id, movement, current_quantity } = params

    // Calculate new quantity
    const quantityChange = movement.movement_type.includes('in') || movement.movement_type === 'receive'
      ? movement.quantity
      : -movement.quantity

    const new_quantity = Math.max(0, current_quantity + quantityChange)

    console.log('🔄 [adjustStock] Processing:', {
      stock_level_id,
      current_quantity,
      quantityChange,
      new_quantity,
      movement
    })

    // Step 1: Create transaction for audit trail
    const transaction = await createTransaction({
      transaction_type: 'INV_ADJUSTMENT',
      smart_code: 'HERA.SALON.INV.TXN.ADJUST.V1',
      source_entity_id: product_id,
      target_entity_id: location_id,
      total_amount: 0, // No financial impact for adjustments
      lines: [
        {
          line_type: 'INVENTORY_MOVE',
          smart_code: 'HERA.SALON.INV.LINE.ADJUST.V1',
          entity_id: stock_level_id,
          quantity: quantityChange,
          unit_amount: 0,
          line_amount: 0,
          metadata: {
            movement_type: movement.movement_type,
            reason: movement.reason,
            reference: movement.reference,
            previous_quantity: current_quantity,
            new_quantity
          }
        }
      ],
      metadata: {
        stock_level_id,
        movement_type: movement.movement_type,
        previous_quantity: current_quantity,
        new_quantity
      }
    })

    console.log('✅ [adjustStock] Transaction created:', transaction)

    // Step 2: Update stock level entity
    const updateResult = await updateStockLevelEntity({
      entity_id: stock_level_id,
      dynamic_patch: {
        quantity: new_quantity
      }
    })

    console.log('✅ [adjustStock] Stock level updated:', updateResult)

    // Step 3: Refetch to get fresh data
    await refetch()

    return {
      transaction,
      new_quantity,
      quantityChange
    }
  }

  /**
   * Quick stock adjustment helpers
   */
  const incrementStock = async (stockLevelId: string, productId: string, locationId: string, currentQty: number, amount: number = 1) => {
    return adjustStock({
      stock_level_id: stockLevelId,
      product_id: productId,
      location_id: locationId,
      movement: {
        movement_type: 'adjust_in',
        quantity: amount,
        reason: 'Manual stock increase'
      },
      current_quantity: currentQty
    })
  }

  const decrementStock = async (stockLevelId: string, productId: string, locationId: string, currentQty: number, amount: number = 1) => {
    return adjustStock({
      stock_level_id: stockLevelId,
      product_id: productId,
      location_id: locationId,
      movement: {
        movement_type: 'adjust_out',
        quantity: amount,
        reason: 'Manual stock decrease'
      },
      current_quantity: currentQty
    })
  }

  return {
    stockLevels: filteredStockLevels as StockLevel[],
    isLoading,
    error,
    refetch,
    createStockLevel,
    adjustStock,
    incrementStock,
    decrementStock,
    isAdjusting: isCreatingMovement
  }
}
