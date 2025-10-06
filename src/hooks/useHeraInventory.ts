/**
 * HERA Enterprise Inventory Hook
 *
 * Enterprise-grade inventory management using Universal Entity API
 * NO direct Supabase calls - follows HERA CRUD architecture
 *
 * Features:
 * - Multi-branch inventory tracking
 * - Stock movements with audit trail
 * - Low stock alerts
 * - Inventory valuation
 * - Complete CRUD operations
 */

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntity'
import { getProductInventory, recordStockMovement, getStockAlerts } from '@/lib/services/inventory-service'
import type { ProductInventory, StockMovementInput, StockAlert } from '@/types/inventory'

export interface InventoryItem {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: string
  // Dynamic fields
  sku?: string
  category?: string
  price_cost?: number
  price_market?: number
  stock_quantity?: number
  reorder_level?: number
  unit_of_measure?: string
  supplier?: string
  // Computed
  stock_value?: number
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  created_at: string
  updated_at: string
  // Relationships
  relationships?: any
}

export interface StockMovement {
  id: string
  entity_name: string
  movement_type: string
  product_id: string
  branch_id: string
  quantity: number
  unit_cost: number
  created_at: string
  created_by: string
  // Metadata
  reference_id?: string
  reason?: string
  notes?: string
}

export interface UseHeraInventoryOptions {
  organizationId?: string
  branchId?: string
  includeArchived?: boolean
  searchQuery?: string
  categoryFilter?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    status?: string
    limit?: number
    offset?: number
  }
}

// Inventory Item Preset
const INVENTORY_ITEM_PRESET = {
  dynamicFields: [
    {
      name: 'sku',
      type: 'text' as const,
      smart_code: 'HERA.SALON.INV.ITEM.SKU.V1',
      ui: { label: 'SKU', placeholder: 'Item SKU' }
    },
    {
      name: 'category',
      type: 'text' as const,
      smart_code: 'HERA.SALON.INV.ITEM.CATEGORY.V1',
      ui: { label: 'Category', placeholder: 'Item category' }
    },
    {
      name: 'price_cost',
      type: 'number' as const,
      smart_code: 'HERA.SALON.INV.ITEM.PRICE.COST.V1',
      ui: { label: 'Cost Price', placeholder: '0.00' }
    },
    {
      name: 'price_market',
      type: 'number' as const,
      smart_code: 'HERA.SALON.INV.ITEM.PRICE.MARKET.V1',
      ui: { label: 'Selling Price', placeholder: '0.00' }
    },
    {
      name: 'stock_quantity',
      type: 'number' as const,
      smart_code: 'HERA.SALON.INV.ITEM.STOCK.QTY.V1',
      ui: { label: 'Stock Quantity', placeholder: '0' }
    },
    {
      name: 'reorder_level',
      type: 'number' as const,
      smart_code: 'HERA.SALON.INV.ITEM.REORDER.LEVEL.V1',
      ui: { label: 'Reorder Level', placeholder: '10' }
    },
    {
      name: 'unit_of_measure',
      type: 'text' as const,
      smart_code: 'HERA.SALON.INV.ITEM.UOM.V1',
      ui: { label: 'Unit', placeholder: 'pcs, kg, liters' }
    },
    {
      name: 'supplier',
      type: 'text' as const,
      smart_code: 'HERA.SALON.INV.ITEM.SUPPLIER.V1',
      ui: { label: 'Supplier', placeholder: 'Supplier name' }
    }
  ],
  relationships: [
    {
      type: 'STOCK_AT',
      smart_code: 'HERA.SALON.INV.ITEM.REL.STOCK_AT.V1',
      cardinality: 'many' as const
    },
    {
      type: 'HAS_CATEGORY',
      smart_code: 'HERA.SALON.INV.ITEM.REL.HAS_CATEGORY.V1',
      cardinality: 'one' as const
    }
  ]
}

export function useHeraInventory(options?: UseHeraInventoryOptions) {
  const {
    entities: items,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    restore: baseRestore,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'product',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: 100,
      ...(options?.includeArchived ? {} : { status: 'active' }),
      ...options?.filters
    },
    dynamicFields: INVENTORY_ITEM_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: INVENTORY_ITEM_PRESET.relationships as RelationshipDef[]
  })

  // Helper to create inventory item
  const createItem = async (data: {
    name: string
    code?: string
    sku?: string
    category?: string
    cost_price?: number
    selling_price?: number
    stock_quantity?: number
    reorder_level?: number
    unit_of_measure?: string
    supplier?: string
    branch_ids?: string[]
    status?: string
  }) => {
    const entity_name = data.name
    const entity_code = data.code || data.name.toUpperCase().replace(/\s+/g, '_')

    // Build dynamic fields
    const dynamic_fields: Record<string, any> = {}

    if (data.sku) {
      dynamic_fields.sku = {
        value: data.sku,
        type: 'text',
        smart_code: 'HERA.SALON.INV.ITEM.SKU.V1'
      }
    }

    if (data.category) {
      dynamic_fields.category = {
        value: data.category,
        type: 'text',
        smart_code: 'HERA.SALON.INV.ITEM.CATEGORY.V1'
      }
    }

    if (data.cost_price !== undefined) {
      dynamic_fields.price_cost = {
        value: data.cost_price,
        type: 'number',
        smart_code: 'HERA.SALON.INV.ITEM.PRICE.COST.V1'
      }
    }

    if (data.selling_price !== undefined) {
      dynamic_fields.price_market = {
        value: data.selling_price,
        type: 'number',
        smart_code: 'HERA.SALON.INV.ITEM.PRICE.MARKET.V1'
      }
    }

    if (data.stock_quantity !== undefined) {
      dynamic_fields.stock_quantity = {
        value: data.stock_quantity,
        type: 'number',
        smart_code: 'HERA.SALON.INV.ITEM.STOCK.QTY.V1'
      }
    }

    if (data.reorder_level !== undefined) {
      dynamic_fields.reorder_level = {
        value: data.reorder_level,
        type: 'number',
        smart_code: 'HERA.SALON.INV.ITEM.REORDER.LEVEL.V1'
      }
    }

    if (data.unit_of_measure) {
      dynamic_fields.unit_of_measure = {
        value: data.unit_of_measure,
        type: 'text',
        smart_code: 'HERA.SALON.INV.ITEM.UOM.V1'
      }
    }

    if (data.supplier) {
      dynamic_fields.supplier = {
        value: data.supplier,
        type: 'text',
        smart_code: 'HERA.SALON.INV.ITEM.SUPPLIER.V1'
      }
    }

    const result = await baseCreate({
      entity_type: 'product',
      entity_name,
      entity_code,
      smart_code: 'HERA.SALON.PROD.ENT.V1',
      status: data.status === 'inactive' ? 'archived' : 'active',
      dynamic_fields,
      metadata: data.branch_ids && data.branch_ids.length > 0 ? {
        relationships: {
          STOCK_AT: data.branch_ids
        }
      } : undefined
    } as any)

    await refetch()
    return result
  }

  // Helper to update inventory item
  const updateItem = async (id: string, data: Partial<Parameters<typeof createItem>[0]>) => {
    const item = (items as InventoryItem[])?.find(i => i.id === id)

    const entity_name = data.name || item?.entity_name
    const entity_code = data.code || item?.entity_code

    // Build dynamic patch
    const dynamic_patch: Record<string, any> = {}

    if (data.sku !== undefined) dynamic_patch.sku = data.sku
    if (data.category !== undefined) dynamic_patch.category = data.category
    if (data.cost_price !== undefined) dynamic_patch.price_cost = data.cost_price
    if (data.selling_price !== undefined) dynamic_patch.price_market = data.selling_price
    if (data.stock_quantity !== undefined) dynamic_patch.stock_quantity = data.stock_quantity
    if (data.reorder_level !== undefined) dynamic_patch.reorder_level = data.reorder_level
    if (data.unit_of_measure !== undefined) dynamic_patch.unit_of_measure = data.unit_of_measure
    if (data.supplier !== undefined) dynamic_patch.supplier = data.supplier

    // Build relationships patch
    const relationships_patch = data.branch_ids !== undefined ? {
      STOCK_AT: data.branch_ids
    } : undefined

    const payload: any = {
      entity_id: id,
      ...(entity_name && { entity_name }),
      ...(entity_code && { entity_code }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(relationships_patch && { relationships_patch })
    }

    if (data.status !== undefined) {
      payload.status = data.status === 'inactive' ? 'archived' : 'active'
    }

    const result = await baseUpdate(payload)
    await refetch()
    return result
  }

  // Helper to archive item
  const archiveItem = async (id: string) => {
    const item = (items as InventoryItem[])?.find(i => i.id === id)
    if (!item) throw new Error('Item not found')

    const result = await baseUpdate({
      entity_id: id,
      entity_name: item.entity_name,
      status: 'archived'
    })

    await refetch()
    return result
  }

  // Helper to restore item
  const restoreItem = async (id: string) => {
    const item = (items as InventoryItem[])?.find(i => i.id === id)
    if (!item) throw new Error('Item not found')

    const result = await baseUpdate({
      entity_id: id,
      entity_name: item.entity_name,
      status: 'active'
    })

    await refetch()
    return result
  }

  // Filter items by branch, search, and category
  const filteredItems = useMemo(() => {
    if (!items) return []

    let filtered = items as InventoryItem[]

    // Filter by branch
    if (options?.branchId && options.branchId !== 'all') {
      filtered = filtered.filter(item => {
        const stockAtRelationships = (item as any).relationships?.stock_at || (item as any).relationships?.STOCK_AT
        if (!stockAtRelationships) return false

        if (Array.isArray(stockAtRelationships)) {
          return stockAtRelationships.some((rel: any) => rel.to_entity?.id === options.branchId)
        } else {
          return stockAtRelationships.to_entity?.id === options.branchId
        }
      })
    }

    // Search filter
    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.entity_name?.toLowerCase().includes(query) ||
        item.entity_code?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (options?.categoryFilter) {
      filtered = filtered.filter(item => item.category === options.categoryFilter)
    }

    // Calculate stock status and value
    return filtered.map(item => ({
      ...item,
      stock_value: (item.stock_quantity || 0) * (item.price_cost || 0),
      stock_status:
        (item.stock_quantity || 0) === 0 ? 'out_of_stock' :
        (item.stock_quantity || 0) <= (item.reorder_level || 10) ? 'low_stock' :
        'in_stock'
    }))
  }, [items, options?.branchId, options?.searchQuery, options?.categoryFilter])

  // Get low stock items count
  const lowStockCount = useMemo(() => {
    return filteredItems.filter(item => item.stock_status === 'low_stock' || item.stock_status === 'out_of_stock').length
  }, [filteredItems])

  // Get total inventory value
  const totalValue = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (item.stock_value || 0), 0)
  }, [filteredItems])

  return {
    items: filteredItems as InventoryItem[],
    allItems: items as InventoryItem[],
    isLoading,
    error,
    refetch,
    createItem,
    updateItem,
    archiveItem,
    restoreItem,
    deleteItem: baseDelete,
    isCreating,
    isUpdating,
    isDeleting,
    lowStockCount,
    totalValue
  }
}

// Hook for stock movements
export function useHeraStockMovements(options?: UseHeraInventoryOptions) {
  const {
    entities: movements,
    isLoading,
    error,
    refetch,
    create: baseCreate
  } = useUniversalEntity({
    entity_type: 'stock_movement',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      limit: 100,
      ...options?.filters
    }
  })

  // Create stock movement
  const createMovement = async (
    userId: string,
    data: StockMovementInput
  ) => {
    if (!options?.organizationId) throw new Error('Organization ID required')

    const movement = await recordStockMovement(
      options.organizationId,
      userId,
      data
    )

    await refetch()
    return movement
  }

  return {
    movements: movements as StockMovement[],
    isLoading,
    error,
    refetch,
    createMovement
  }
}
