/**
 * HERA Stock Levels Hook V1
 *
 * ✅ UPGRADED: Now uses useUniversalEntityV1 with RPC hera_entities_crud_v1
 * Thin wrapper over useUniversalEntityV1 for stock level management
 * Provides stock-specific helpers and relationship management
 */

import { useMemo } from 'react'
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntityV1'

export interface StockLevel {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: string
  // Flattened dynamic fields
  quantity?: number
  reorder_level?: number
  cost_price?: number
  selling_price?: number
  last_counted_at?: string
  last_counted_by?: string
  // Relationships
  relationships?: {
    STOCK_OF_PRODUCT?: any[]
    STOCK_AT_LOCATION?: any[]
  }
  // Computed
  product_id?: string
  product_name?: string
  location_id?: string
  location_name?: string
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  stock_value?: number
  created_at: string
  updated_at: string
}

export interface StockMovement {
  movement_type: 'adjust_in' | 'adjust_out' | 'receive' | 'transfer_in' | 'transfer_out' | 'sale'
  quantity: number
  reason?: string
  reference?: string
}

interface UseHeraStockLevelsOptions {
  organizationId?: string
  productId?: string
  locationId?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
  }
}

// Stock Level Preset (following SERVICE_PRESET pattern)
const STOCK_LEVEL_PRESET = {
  dynamicFields: [
    { name: 'quantity', type: 'number', smart_code: 'HERA.SALON.INV.DYN.QTY.v1' },
    { name: 'reorder_level', type: 'number', smart_code: 'HERA.SALON.INV.DYN.REORDER.v1' },
    { name: 'cost_price', type: 'number', smart_code: 'HERA.SALON.INV.DYN.COST.PRICE.v1' },
    { name: 'selling_price', type: 'number', smart_code: 'HERA.SALON.INV.DYN.SELLING.PRICE.v1' },
    { name: 'last_counted_at', type: 'date', smart_code: 'HERA.SALON.INV.DYN.LAST_COUNTED.v1' },
    { name: 'last_counted_by', type: 'text', smart_code: 'HERA.SALON.INV.DYN.COUNTED_BY.v1' }
  ] as DynamicFieldDef[],
  relationships: [
    { type: 'STOCK_OF_PRODUCT', smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.v1' },
    { type: 'STOCK_AT_LOCATION', smart_code: 'HERA.SALON.INV.REL.STOCKATLOCATION.v1' }
  ] as RelationshipDef[]
}

export function useHeraStockLevels(options?: UseHeraStockLevelsOptions) {
  const {
    entities: stockLevels,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntityV1({
    entity_type: 'STOCK_LEVEL', // ✅ UPPERCASE for RPC pattern
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      status: 'active',  // ✅ Only load active stock levels (exclude deleted/archived)
      limit: options?.filters?.limit || 100,
      ...options?.filters
    },
    dynamicFields: STOCK_LEVEL_PRESET.dynamicFields,
    relationships: STOCK_LEVEL_PRESET.relationships
  })

  // Transaction hook for stock movements
  const {
    create: createTransaction,
    isCreating: isCreatingTransaction
  } = useUniversalTransactionV1({
    organizationId: options?.organizationId
  })

  // ✅ Fetch products and locations separately to map names (like services do with categories)
  const { entities: products, isLoading: productsLoading } = useUniversalEntityV1({
    entity_type: 'PRODUCT',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: false,
      include_relationships: false,
      status: 'active',  // ✅ Only load active products
      limit: 500
    }
  })

  const { entities: locations, isLoading: locationsLoading } = useUniversalEntityV1({
    entity_type: 'BRANCH',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: false,
      include_relationships: false,
      status: 'active',  // ✅ Only load active branches
      limit: 100
    }
  })

  // Map stock levels to include product and location names from relationships
  const stockLevelsWithNames = useMemo(() => {
    if (!stockLevels) return []

    // ✅ CRITICAL FIX: Wait for products and locations to load before mapping
    if (productsLoading || locationsLoading) {
      return []
    }

    if (!products || !locations) {
      return []
    }

    // 🔍 DEBUG: Log counts
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [STOCK LEVELS COUNT]', {
        totalStockLevels: stockLevels.length,
        activeProducts: products.length,
        activeBranches: locations.length
      })
    }

    return (stockLevels as any[]).map((sl, index) => {
      // 🔍 DEBUG: Log first few items to understand data structure
      if (process.env.NODE_ENV === 'development' && index < 3) {
        console.log(`🔍 [STOCK LEVEL ${index}]`, {
          id: sl.id,
          entity_name: sl.entity_name,
          status: sl.status,
          hasDynamicFields: !!sl.dynamic_fields,
          dynamicFields: sl.dynamic_fields,
          quantity: sl.quantity,
          cost_price: sl.cost_price,
          selling_price: sl.selling_price
        })
      }

      // Extract product and location IDs from relationships
      const productRels = sl.relationships?.STOCK_OF_PRODUCT
      const locationRels = sl.relationships?.STOCK_AT_LOCATION

      let productId = null
      let productName = 'Unknown Product'
      let locationId = null
      let locationName = 'Unknown Location'

      // Get product ID from relationship
      if (Array.isArray(productRels) && productRels.length > 0) {
        productId = productRels[0].to_entity_id || productRels[0].to_entity?.id
      } else if (productRels?.to_entity_id || productRels?.to_entity?.id) {
        productId = productRels.to_entity_id || productRels.to_entity?.id
      }

      // Get location ID from relationship
      if (Array.isArray(locationRels) && locationRels.length > 0) {
        locationId = locationRels[0].to_entity_id || locationRels[0].to_entity?.id
      } else if (locationRels?.to_entity_id || locationRels?.to_entity?.id) {
        locationId = locationRels.to_entity_id || locationRels.to_entity?.id
      }

      // ✅ FALLBACK: If relationships are missing, parse entity_name
      // Format: "Stock: {PRODUCT_NAME} @ {LOCATION_NAME}"
      // This handles legacy stock levels created before relationships were required
      if (!productId && !locationId && sl.entity_name) {
        const match = sl.entity_name.match(/^Stock:\s*(.+?)\s*@\s*(.+)$/)
        if (match) {
          const [, parsedProductName, parsedLocationName] = match

          // Try to find matching product and location by name
          if (products && parsedProductName) {
            const product = (products as any[]).find((p: any) =>
              p.entity_name?.trim() === parsedProductName.trim()
            )
            if (product) {
              productId = product.id
              productName = product.entity_name
            } else {
              // Couldn't find by exact match, use parsed name
              productName = parsedProductName
            }
          }

          if (locations && parsedLocationName) {
            const location = (locations as any[]).find((l: any) =>
              l.entity_name?.trim() === parsedLocationName.trim()
            )
            if (location) {
              locationId = location.id
              locationName = location.entity_name
            } else {
              // Couldn't find by exact match, use parsed name
              locationName = parsedLocationName
            }
          }
        }
      }

      // Lookup product name from products list (only if we have an ID but no name yet)
      if (productId && products && productName === 'Unknown Product') {
        const product = (products as any[]).find((p: any) => p.id === productId)
        productName = product?.entity_name || productName
      }

      // Lookup location name from locations list (only if we have an ID but no name yet)
      if (locationId && locations && locationName === 'Unknown Location') {
        const location = (locations as any[]).find((l: any) => l.id === locationId)
        locationName = location?.entity_name || locationName
      }

      // ✅ ENTERPRISE: Start with base stock level fields
      const flattenedStockLevel: any = {
        ...sl,
        product_id: productId,
        product_name: productName,
        location_id: locationId,
        location_name: locationName
      }

      // ✅ CRITICAL: Force flatten dynamic_fields if they exist in nested format
      if (sl.dynamic_fields && typeof sl.dynamic_fields === 'object') {
        Object.entries(sl.dynamic_fields).forEach(([key, field]) => {
          if (field && typeof field === 'object' && 'value' in field) {
            flattenedStockLevel[key] = (field as any).value
          }
        })
      }

      // Calculate stock status
      const quantity = flattenedStockLevel.quantity || 0
      const reorderLevel = flattenedStockLevel.reorder_level || 10
      flattenedStockLevel.stock_status =
        quantity === 0 ? 'out_of_stock' :
        quantity <= reorderLevel ? 'low_stock' : 'in_stock'

      // Calculate stock value
      flattenedStockLevel.stock_value = quantity * (flattenedStockLevel.cost_price || 0)

      return flattenedStockLevel
    })
    // ✅ FILTER: Remove stock levels where product or location couldn't be found
    .filter((sl) => {
      const hasValidProduct = sl.product_id || sl.product_name !== 'Unknown Product'
      const hasValidLocation = sl.location_id || sl.location_name !== 'Unknown Location'

      if (!hasValidProduct || !hasValidLocation) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ [FILTERED OUT] Invalid stock level:', {
            id: sl.id,
            entity_name: sl.entity_name,
            product_name: sl.product_name,
            location_name: sl.location_name,
            hasValidProduct,
            hasValidLocation
          })
        }
        return false
      }
      return true
    })
  }, [stockLevels, products, locations, productsLoading, locationsLoading])

  // Filter by product and/or location
  const filteredStockLevels = useMemo(() => {
    let filtered = stockLevelsWithNames

    // Filter by product
    if (options?.productId) {
      filtered = filtered.filter(sl => sl.product_id === options.productId)
    }

    // Filter by location
    if (options?.locationId) {
      filtered = filtered.filter(sl => sl.location_id === options.locationId)
    }

    return filtered
  }, [stockLevelsWithNames, options?.productId, options?.locationId])

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
    cost_price?: number
    selling_price?: number
  }) => {
    const dynamic_fields: Record<string, any> = {}

    // Build dynamic fields from params
    if (params.quantity !== undefined) {
      dynamic_fields.quantity = {
        value: params.quantity,
        type: 'number',
        smart_code: 'HERA.SALON.INV.DYN.QTY.v1'
      }
    }

    if (params.reorder_level !== undefined) {
      dynamic_fields.reorder_level = {
        value: params.reorder_level,
        type: 'number',
        smart_code: 'HERA.SALON.INV.DYN.REORDER.v1'
      }
    }

    if (params.cost_price !== undefined) {
      dynamic_fields.cost_price = {
        value: params.cost_price,
        type: 'number',
        smart_code: 'HERA.SALON.INV.DYN.COST.PRICE.v1'
      }
    }

    if (params.selling_price !== undefined) {
      dynamic_fields.selling_price = {
        value: params.selling_price,
        type: 'number',
        smart_code: 'HERA.SALON.INV.DYN.SELLING.PRICE.v1'
      }
    }

    const entity_name = `Stock: ${params.product_name} @ ${params.location_name}`
    const entity_code = `STOCK-${params.product_id.substring(0, 8)}-${params.location_id.substring(0, 8)}`

    const relationships: Record<string, string[]> = {
      STOCK_OF_PRODUCT: [params.product_id],
      STOCK_AT_LOCATION: [params.location_id]
    }

    return baseCreate({
      entity_type: 'STOCK_LEVEL',
      entity_name,
      entity_code,
      smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.v1',
      dynamic_fields,
      relationships
    } as any)
  }

  /**
   * Update stock level (quantity, reorder level, prices)
   */
  const updateStockLevel = async (
    id: string,
    data: Partial<{
      quantity: number
      reorder_level: number
      cost_price: number
      selling_price: number
    }>
  ) => {
    const stockLevel = (stockLevels as any[])?.find(sl => sl.id === id)
    if (!stockLevel) throw new Error('Stock level not found')

    // Build dynamic patch
    const dynamic_patch: Record<string, any> = {}
    if (data.quantity !== undefined) dynamic_patch.quantity = data.quantity
    if (data.reorder_level !== undefined) dynamic_patch.reorder_level = data.reorder_level
    if (data.cost_price !== undefined) dynamic_patch.cost_price = data.cost_price
    if (data.selling_price !== undefined) dynamic_patch.selling_price = data.selling_price

    const payload: any = {
      entity_id: id,
      entity_name: stockLevel.entity_name,
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {})
    }

    return baseUpdate(payload)
  }

  /**
   * Adjust stock quantity with transaction audit trail
   */
  const adjustStock = async (params: {
    stock_level_id: string
    product_id: string
    location_id: string
    movement: StockMovement
    current_quantity: number
  }) => {
    const { stock_level_id, product_id, location_id, movement, current_quantity } = params

    // Calculate new quantity
    const quantityChange = movement.movement_type.includes('in') || movement.movement_type === 'receive'
      ? movement.quantity
      : -movement.quantity

    const new_quantity = Math.max(0, current_quantity + quantityChange)

    // Step 1: Create transaction for audit trail
    await createTransaction({
      transaction_type: 'INV_ADJUSTMENT',
      smart_code: 'HERA.SALON.INV.TXN.ADJUST.v1',
      source_entity_id: product_id,
      target_entity_id: location_id,
      total_amount: 0,
      lines: [
        {
          line_type: 'INVENTORY_MOVE',
          smart_code: 'HERA.SALON.INV.LINE.ADJUST.v1',
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

    // Step 2: Update stock level entity
    await updateStockLevel(stock_level_id, { quantity: new_quantity })

    // ✅ NO REFETCH NEEDED: RPC returns updated data automatically
    return {
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
    updateStockLevel,
    adjustStock,
    incrementStock,
    decrementStock,
    isAdjusting: isCreatingTransaction || isUpdating
  }
}
