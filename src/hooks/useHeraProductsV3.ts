/**
 * HERA Products Hook V3
 *
 * Thin wrapper over useUniversalEntity for product management
 * Provides product-specific helpers and relationship management
 */

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import { PRODUCT_PRESET } from './entityPresets'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntity'

export interface ProductEntity {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  dynamic_fields?: {
    price?: { value: number }
    cost?: { value: number }
    qty_on_hand?: { value: number }
    min_stock?: { value: number }
    barcode?: { value: string }
    size?: { value: string }
    unit?: { value: string }
    sku_code?: { value: string }
    commission_rate?: { value: number }
    active?: { value: boolean }
  }
  relationships?: {
    category?: { to_entity: any }
    brand?: { to_entity: any }
    suppliers?: { to_entity: any }[]
  }
  created_at: string
  updated_at: string
}

export interface UseHeraProductsOptions {
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
    branch_id?: string // Add branch filtering
    category_id?: string // Add category filtering
    low_stock?: boolean // Add low stock filtering
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
    entity_type: 'PRODUCT',
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: 100,
      ...options?.filters
    },
    dynamicFields: PRODUCT_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: PRODUCT_PRESET.relationships as RelationshipDef[]
  })

  // Filter products by branch and other criteria
  const filteredProducts = useMemo(() => {
    if (!products) return products as ProductEntity[]

    let filtered = products as ProductEntity[]

    // Filter by branch relationship
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(p => {
        // Check if product has STOCK_AT relationship with the specified branch
        const stockAtRelationships = p.relationships?.stock_at
        if (!stockAtRelationships) return false

        if (Array.isArray(stockAtRelationships)) {
          return stockAtRelationships.some(rel => rel.to_entity?.id === options.filters?.branch_id)
        } else {
          return stockAtRelationships.to_entity?.id === options.filters?.branch_id
        }
      })
    }

    // Filter by category if provided
    if (options?.filters?.category_id) {
      filtered = filtered.filter(p => {
        const categoryRelationship = p.relationships?.category
        if (!categoryRelationship) return false

        if (Array.isArray(categoryRelationship)) {
          return categoryRelationship.some(
            rel => rel.to_entity?.id === options.filters?.category_id
          )
        } else {
          return categoryRelationship.to_entity?.id === options.filters?.category_id
        }
      })
    }

    // Filter by low stock if requested
    if (options?.filters?.low_stock) {
      filtered = filtered.filter(p => {
        const qtyOnHand = p.dynamic_fields?.qty_on_hand?.value || 0
        const minStock = p.dynamic_fields?.min_stock?.value || 10
        return qtyOnHand < minStock
      })
    }

    return filtered
  }, [
    products,
    options?.filters?.branch_id,
    options?.filters?.category_id,
    options?.filters?.low_stock
  ])

  // Helper to create product with proper smart codes and relationships
  const createProduct = async (data: {
    name: string
    code?: string
    price?: number
    cost?: number
    qty_on_hand?: number
    min_stock?: number
    barcode?: string
    size?: string
    unit?: string
    sku_code?: string
    commission_rate?: number
    active?: boolean
    category_id?: string
    brand_id?: string
    supplier_ids?: string[]
    branch_id?: string // Add branch support
  }) => {
    // Map provided primitives to dynamic_fields payload using preset definitions
    const dynamic_fields: Record<string, any> = {}
    for (const def of PRODUCT_PRESET.dynamicFields) {
      const key = def.name as keyof typeof data
      if (key in data && (data as any)[key] !== undefined) {
        dynamic_fields[def.name] = {
          value: (data as any)[key],
          type: def.type,
          smart_code: def.smart_code
        }
      }
    }

    // Relationships map according to preset relationship types
    const relationships: Record<string, string[] | undefined> = {
      ...(data.category_id ? { HAS_CATEGORY: [data.category_id] } : {}),
      ...(data.brand_id ? { HAS_BRAND: [data.brand_id] } : {}),
      ...(data.supplier_ids ? { SUPPLIED_BY: data.supplier_ids } : {}),
      // Add branch relationship - use STOCK_AT for product stocking at branches
      ...(data.branch_id ? { STOCK_AT: [data.branch_id] } : {})
    }

    return baseCreate({
      entity_type: 'PRODUCT',
      entity_name: data.name,
      entity_code: data.code,
      smart_code: 'HERA.SALON.PRODUCT.ENTITY.PRODUCT.V1',
      dynamic_fields,
      metadata: { relationships }
    } as any)
  }

  // Helper to update product
  const updateProduct = async (id: string, data: Partial<Parameters<typeof createProduct>[0]>) => {
    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}
    for (const def of PRODUCT_PRESET.dynamicFields) {
      const key = def.name as keyof typeof data
      if (key in data && (data as any)[key] !== undefined) {
        dynamic_patch[def.name] = (data as any)[key]
      }
    }

    // Relationships patch
    const relationships_patch: Record<string, string[]> = {}
    if (data.category_id) relationships_patch['HAS_CATEGORY'] = [data.category_id]
    if (data.brand_id) relationships_patch['HAS_BRAND'] = [data.brand_id]
    if (data.supplier_ids) relationships_patch['SUPPLIED_BY'] = data.supplier_ids
    if (data.branch_id) relationships_patch['STOCK_AT'] = [data.branch_id]

    const payload: any = {
      entity_id: id,
      ...(data.name && { entity_name: data.name }),
      ...(data.code && { entity_code: data.code }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(Object.keys(relationships_patch).length ? { relationships_patch } : {})
    }

    return baseUpdate(payload)
  }

  // Helper to archive product (soft delete)
  const archiveProduct = async (id: string) => {
    return baseArchive(id)
  }

  // Helper to delete product (hard delete)
  const deleteProduct = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      return archiveProduct(id)
    }
    return baseDelete(id)
  }

  // Helper to update stock quantity
  const updateStock = async (productId: string, quantity: number) => {
    const product = (products as ProductEntity[])?.find(p => p.id === productId)
    if (product) {
      return updateProduct(productId, {
        qty_on_hand: quantity
      })
    }
    throw new Error('Product not found')
  }

  // Helper to adjust stock (relative change)
  const adjustStock = async (productId: string, adjustment: number) => {
    const product = (products as ProductEntity[])?.find(p => p.id === productId)
    if (product) {
      const currentStock = product.dynamic_fields?.qty_on_hand?.value || 0
      return updateProduct(productId, {
        qty_on_hand: currentStock + adjustment
      })
    }
    throw new Error('Product not found')
  }

  // Helper to check if product is in stock
  const isInStock = (product: ProductEntity) => {
    const qtyOnHand = product.dynamic_fields?.qty_on_hand?.value || 0
    return qtyOnHand > 0
  }

  // Helper to check if product is low on stock
  const isLowStock = (product: ProductEntity) => {
    const qtyOnHand = product.dynamic_fields?.qty_on_hand?.value || 0
    const minStock = product.dynamic_fields?.min_stock?.value || 10
    return qtyOnHand < minStock
  }

  // Helper to calculate product profit margin
  const calculateMargin = (product: ProductEntity) => {
    const price = product.dynamic_fields?.price?.value || 0
    const cost = product.dynamic_fields?.cost?.value || 0

    if (price === 0) return { margin: 0, marginPercent: 0 }

    const margin = price - cost
    const marginPercent = (margin / price) * 100

    return {
      margin,
      marginPercent,
      price,
      cost
    }
  }

  return {
    products: filteredProducts,
    isLoading,
    error,
    refetch,
    createProduct,
    updateProduct,
    archiveProduct,
    deleteProduct,
    updateStock,
    adjustStock,
    isInStock,
    isLowStock,
    calculateMargin,
    isCreating,
    isUpdating,
    isDeleting
  }
}
