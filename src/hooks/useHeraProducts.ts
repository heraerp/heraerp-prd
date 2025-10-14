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
  // Legacy barcode field
  barcode?: string
  // ✅ ENTERPRISE BARCODE FIELDS
  barcode_primary?: string
  barcode_type?: string
  barcodes_alt?: string[]
  gtin?: string
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
      // ⚡ PERFORMANCE: Only fetch relationships when filtering by branch
      // This cuts initial page load time significantly since relationships require expensive joins
      include_relationships: !!(options?.filters?.branch_id && options.filters.branch_id !== 'all'),
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
    // ✅ ENTERPRISE BARCODE FIELDS
    barcode_primary?: string
    barcode_type?: string
    barcodes_alt?: string[]
    gtin?: string
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

    // ✅ ENTERPRISE BARCODE FIELDS
    if (data.barcode_primary) {
      dynamic_fields.barcode_primary = {
        value: data.barcode_primary,
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1'
      }
    }

    if (data.barcode_type) {
      dynamic_fields.barcode_type = {
        value: data.barcode_type,
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.BARCODE.TYPE.V1'
      }
    }

    if (data.barcodes_alt && data.barcodes_alt.length > 0) {
      dynamic_fields.barcodes_alt = {
        value: data.barcodes_alt,
        type: 'json',
        smart_code: 'HERA.SALON.PRODUCT.DYN.BARCODES.ALT.V1'
      }
    }

    if (data.gtin) {
      dynamic_fields.gtin = {
        value: data.gtin,
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.DYN.BARCODE.GTIN.V1'
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
      metadata:
        data.branch_ids && data.branch_ids.length > 0
          ? {
              relationships: {
                STOCK_AT: data.branch_ids
              }
            }
          : undefined
    } as any)

    // 🎯 ENTERPRISE PATTERN: No explicit refetch needed (React Query auto-invalidation)
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

    // ✅ ENTERPRISE BARCODE FIELDS
    if (data.barcode_primary !== undefined) {
      dynamic_patch.barcode_primary = data.barcode_primary
    }

    if (data.barcode_type !== undefined) {
      dynamic_patch.barcode_type = data.barcode_type
    }

    if (data.barcodes_alt !== undefined) {
      dynamic_patch.barcodes_alt = data.barcodes_alt
    }

    if (data.gtin !== undefined) {
      dynamic_patch.gtin = data.gtin
    }

    // Build relationships patch if branch_ids provided
    const relationships_patch =
      data.branch_ids !== undefined
        ? {
            STOCK_AT: data.branch_ids
          }
        : undefined

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
    // 🎯 ENTERPRISE PATTERN: No explicit refetch needed (React Query auto-invalidation)
    return result
  }

  // Helper to archive product (soft delete)
  const archiveProduct = async (id: string) => {
    const product = (products as Product[])?.find(p => p.id === id)
    if (!product) throw new Error('Product not found')

    // console.log('[useHeraProducts] Archiving product:', { id })

    const result = await baseUpdate({
      entity_id: id,
      entity_name: product.entity_name,
      status: 'archived'
    })

    // 🎯 ENTERPRISE PATTERN: No explicit refetch needed (React Query auto-invalidation)
    return result
  }

  // Helper to restore archived product
  const restoreProduct = async (id: string) => {
    const product = (products as Product[])?.find(p => p.id === id)
    if (!product) throw new Error('Product not found')

    // console.log('[useHeraProducts] Restoring product:', { id })

    const result = await baseUpdate({
      entity_id: id,
      entity_name: product.entity_name,
      status: 'active'
    })

    // 🎯 ENTERPRISE PATTERN: No explicit refetch needed (React Query auto-invalidation)
    return result
  }

  // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
  // Try hard delete first, but if product is referenced in transactions, archive instead
  const deleteProduct = async (
    id: string
  ): Promise<{
    success: boolean
    archived: boolean
    message?: string
  }> => {
    const product = (products as Product[])?.find(p => p.id === id)
    if (!product) throw new Error('Product not found')

    try {
      // Attempt hard delete with cascade
      await baseDelete({
        entity_id: id,
        hard_delete: true,
        cascade: true,
        reason: 'Permanently delete product',
        smart_code: 'HERA.SALON.PRODUCT.DELETE.V1'
      })

      // If we reach here, hard delete succeeded
      return {
        success: true,
        archived: false
      }
    } catch (error: any) {
      // 🎯 ENTERPRISE ERROR DETECTION: Check multiple error patterns
      const errorString = JSON.stringify(error).toLowerCase()
      const errorMessage = (error.message || '').toLowerCase()
      const is409Conflict =
        error.status === 409 ||
        error.statusCode === 409 ||
        errorString.includes('409') ||
        errorString.includes('conflict') ||
        errorMessage.includes('409') ||
        errorMessage.includes('conflict') ||
        errorMessage.includes('referenced') ||
        errorMessage.includes('foreign key') ||
        errorMessage.includes('cannot delete')

      if (is409Conflict) {
        // Product is referenced - fallback to archive with warning
        try {
          await baseUpdate({
            entity_id: id,
            entity_name: product.entity_name,
            status: 'archived'
          })

          return {
            success: true,
            archived: true,
            message:
              'Product is used in transactions and cannot be deleted. It has been archived instead.'
          }
        } catch (archiveError: any) {
          // If archive also fails, throw a clear error
          throw new Error(
            `Failed to delete and archive: ${archiveError.message || 'Unknown error'}`
          )
        }
      }

      // If it's a different error, re-throw it
      throw error
    }
  }

  // Filter products by branch, search, and category using HERA relationship patterns
  const filteredProducts = useMemo(() => {
    if (!products) return []

    let filtered = products as Product[]

    // console.log('[useHeraProducts] Filtering products:', {
    //   total: filtered.length,
    //   branch_id: options?.filters?.branch_id,
    //   sample_product_relationships: filtered[0] ? (filtered[0] as any).relationships : 'no products'
    // })

    // Filter by STOCK_AT branch relationship (when branch is selected, not "All Locations")
    if (options?.filters?.branch_id && options.filters.branch_id !== 'all') {
      filtered = filtered.filter(p => {
        // Check if product has STOCK_AT relationship with the specified branch
        const stockAtRelationships =
          (p as any).relationships?.stock_at || (p as any).relationships?.STOCK_AT

        // console.log('[useHeraProducts] Product filter check:', {
        //   product: p.entity_name,
        //   has_relationships: !!(p as any).relationships,
        //   stockAtRelationships,
        //   branch_id_filter: options.filters?.branch_id
        // })

        if (!stockAtRelationships) return false

        // Handle both array and single relationship formats
        // Check both rel.to_entity?.id (populated) and rel.to_entity_id (raw) for compatibility
        if (Array.isArray(stockAtRelationships)) {
          return stockAtRelationships.some(
            (rel: any) => rel.to_entity?.id === options.filters?.branch_id || rel.to_entity_id === options.filters?.branch_id
          )
        } else {
          return stockAtRelationships.to_entity?.id === options.filters?.branch_id || stockAtRelationships.to_entity_id === options.filters?.branch_id
        }
      })

      // console.log('[useHeraProducts] After branch filter:', filtered.length)
    }

    // Search filter
    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase()
      filtered = filtered.filter(
        product =>
          product.entity_name?.toLowerCase().includes(query) ||
          product.entity_code?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.barcode?.toLowerCase().includes(query) ||
          product.barcode_primary?.toLowerCase().includes(query) ||
          product.gtin?.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query)
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
