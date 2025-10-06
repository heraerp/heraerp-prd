/**
 * HERA Products Hook
 *
 * Thin wrapper over useUniversalEntity for product management
 * Provides product-specific helpers and RPC integration
 *
 * ✅ FOLLOWS HERA CRUD ARCHITECTURE:
 * - Uses useUniversalEntity (NO direct Supabase)
 * - Uses PRODUCT_PRESET for dynamic fields
 * - Follows staff/role pattern exactly
 */

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import { PRODUCT_PRESET } from './entityPresets'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntity'

export interface Product {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: string
  entity_description?: string
  metadata?: any
  // Flattened dynamic fields (must match PRODUCT_PRESET field names)
  name?: string
  code?: string
  category?: string
  price_cost?: number // ✅ Matches PRODUCT_PRESET
  price_market?: number // ✅ Matches PRODUCT_PRESET
  stock_quantity?: number // ✅ Matches PRODUCT_PRESET
  reorder_level?: number
  brand?: string
  barcode?: string
  sku?: string
  size?: string
  // Backward compatibility aliases
  cost_price?: number // Alias for price_cost
  selling_price?: number // Alias for price_market
  stock_level?: number // Alias for stock_quantity
  created_at: string
  updated_at: string
}

export interface UseHeraProductsOptions {
  organizationId?: string
  includeArchived?: boolean
  searchQuery?: string
  categoryFilter?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    branch_id?: string
    limit?: number
    offset?: number
    status?: string
    search?: string
  }
}

export function useHeraProducts(options?: UseHeraProductsOptions) {
  const {
    entities: products,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'product',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true, // Enable relationships for branch filtering
      limit: 100,
      // Only filter by 'active' status when not including archived
      ...(options?.includeArchived ? {} : { status: 'active' }),
      ...options?.filters
    },
    dynamicFields: PRODUCT_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: PRODUCT_PRESET.relationships as RelationshipDef[]
  })

  // Helper to create product with proper smart codes
  const createProduct = async (data: {
    name: string
    code?: string
    description?: string
    category?: string
    cost_price?: number
    selling_price?: number
    stock_level?: number
    reorder_level?: number
    brand?: string
    barcode?: string
    sku?: string
    size?: string
    status?: string
    branch_ids?: string[]
  }) => {
    const entity_name = data.name
    const entity_code = data.code || data.name.toUpperCase().replace(/\s+/g, '_')

    // Build dynamic_fields payload following useHeraStaff pattern
    const dynamic_fields: Record<string, any> = {}

    if (data.category !== undefined) {
      dynamic_fields.category = {
        value: data.category,
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.CATEGORY.V1'
      }
    }

    if (data.cost_price !== undefined) {
      dynamic_fields.price_cost = {
        value: data.cost_price,
        type: 'number',
        smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1'
      }
    }

    if (data.selling_price !== undefined) {
      dynamic_fields.price_market = {
        value: data.selling_price,
        type: 'number',
        smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1'
      }
    }

    if (data.stock_level !== undefined) {
      dynamic_fields.stock_quantity = {
        value: data.stock_level,
        type: 'number',
        smart_code: 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1'
      }
    }

    if (data.reorder_level !== undefined) {
      dynamic_fields.reorder_level = {
        value: data.reorder_level,
        type: 'number',
        smart_code: 'HERA.SALON.PRODUCT.DYN.REORDER.LEVEL.v1'
      }
    }

    if (data.brand) {
      dynamic_fields.brand = {
        value: data.brand,
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.BRAND.V1'
      }
    }

    if (data.barcode) {
      dynamic_fields.barcode = {
        value: data.barcode,
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.BARCODE.v1'
      }
    }

    if (data.sku) {
      dynamic_fields.sku = {
        value: data.sku,
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.SKU.v1'
      }
    }

    if (data.size) {
      dynamic_fields.size = {
        value: data.size,
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.SIZE.v1'
      }
    }

    const result = await baseCreate({
      entity_type: 'product',
      entity_name,
      entity_code,
      smart_code: 'HERA.SALON.PROD.ENT.RETAIL.V1',
      entity_description: data.description || null,
      status: data.status === 'inactive' ? 'archived' : 'active',
      dynamic_fields,
      metadata: data.branch_ids && data.branch_ids.length > 0 ? {
        relationships: {
          STOCK_AT: data.branch_ids
        }
      } : undefined
    } as any)

    // Trigger refetch to show new product
    await refetch()
    return result
  }

  // Helper to update product
  const updateProduct = async (id: string, data: Partial<Parameters<typeof createProduct>[0]>) => {
    // Get existing product to build complete update
    const product = (products as Product[])?.find(p => p.id === id)

    const entity_name = data.name || product?.entity_name
    const entity_code = data.code || product?.entity_code

    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}

    if (data.category !== undefined) {
      dynamic_patch.category = data.category
    }

    if (data.cost_price !== undefined) {
      dynamic_patch.price_cost = data.cost_price // Map to correct field name
    }

    if (data.selling_price !== undefined) {
      dynamic_patch.price_market = data.selling_price // Map to correct field name
    }

    if (data.stock_level !== undefined) {
      dynamic_patch.stock_quantity = data.stock_level // Map to correct field name
    }

    if (data.reorder_level !== undefined) {
      dynamic_patch.reorder_level = data.reorder_level
    }

    if (data.brand !== undefined) {
      dynamic_patch.brand = data.brand
    }

    if (data.barcode !== undefined) {
      dynamic_patch.barcode = data.barcode
    }

    if (data.sku !== undefined) {
      dynamic_patch.sku = data.sku
    }

    if (data.size !== undefined) {
      dynamic_patch.size = data.size
    }

    // Build relationships patch if branch_ids provided
    const relationships_patch = data.branch_ids !== undefined ? {
      STOCK_AT: data.branch_ids
    } : undefined

    const payload: any = {
      entity_id: id,
      ...(entity_name && { entity_name }),
      ...(entity_code && { entity_code }),
      ...(data.description !== undefined && { entity_description: data.description }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(relationships_patch && { relationships_patch })
    }

    // Handle status separately if needed
    if (data.status !== undefined) {
      payload.status = data.status === 'inactive' ? 'archived' : 'active'
    }

    const result = await baseUpdate(payload)
    // Trigger refetch to show updated product
    await refetch()
    return result
  }

  // Helper to archive product (soft delete)
  const archiveProduct = async (id: string) => {
    const product = (products as Product[])?.find(p => p.id === id)
    if (!product) throw new Error('Product not found')

    console.log('[useHeraProducts] Archiving product:', { id })

    const result = await baseUpdate({
      entity_id: id,
      entity_name: product.entity_name,
      status: 'archived'
    })

    // Trigger refetch to update the list
    await refetch()
    return result
  }

  // Helper to restore archived product
  const restoreProduct = async (id: string) => {
    const product = (products as Product[])?.find(p => p.id === id)
    if (!product) throw new Error('Product not found')

    console.log('[useHeraProducts] Restoring product:', { id })

    const result = await baseUpdate({
      entity_id: id,
      entity_name: product.entity_name,
      status: 'active'
    })

    // Trigger refetch to update the list
    await refetch()
    return result
  }

  // Helper to delete product (hard delete)
  const deleteProduct = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      const result = await archiveProduct(id)
      return result
    }
    const result = await baseDelete({ entity_id: id, hard_delete: true })
    // Trigger refetch after hard delete
    await refetch()
    return result
  }

  // Filter products by branch, search, and category using HERA relationship patterns
  const filteredProducts = useMemo(() => {
    if (!products) return []

    let filtered = products as Product[]

    console.log('[useHeraProducts] Filtering products:', {
      total: filtered.length,
      branch_id: options?.filters?.branch_id,
      sample_product_relationships: filtered[0] ? (filtered[0] as any).relationships : 'no products'
    })

    // Filter by STOCK_AT branch relationship (when branch is selected, not "All Locations")
    if (options?.filters?.branch_id && options.filters.branch_id !== 'all') {
      filtered = filtered.filter(p => {
        // Check if product has STOCK_AT relationship with the specified branch
        const stockAtRelationships = (p as any).relationships?.stock_at || (p as any).relationships?.STOCK_AT

        console.log('[useHeraProducts] Product filter check:', {
          product: p.entity_name,
          has_relationships: !!(p as any).relationships,
          stockAtRelationships,
          branch_id_filter: options.filters?.branch_id
        })

        if (!stockAtRelationships) return false

        // Handle both array and single relationship formats
        if (Array.isArray(stockAtRelationships)) {
          return stockAtRelationships.some((rel: any) => rel.to_entity?.id === options.filters?.branch_id)
        } else {
          return stockAtRelationships.to_entity?.id === options.filters?.branch_id
        }
      })

      console.log('[useHeraProducts] After branch filter:', filtered.length)
    }

    // Search filter
    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.entity_name?.toLowerCase().includes(query) ||
        product.entity_code?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (options?.categoryFilter) {
      filtered = filtered.filter(product => product.category === options.categoryFilter)
    }

    return filtered
  }, [products, options?.filters?.branch_id, options?.searchQuery, options?.categoryFilter])

  return {
    products: filteredProducts as Product[],
    allProducts: products as Product[],
    isLoading,
    error,
    refetch,
    createProduct,
    updateProduct,
    archiveProduct,
    restoreProduct,
    deleteProduct,
    isCreating,
    isUpdating,
    isDeleting
  }
}
