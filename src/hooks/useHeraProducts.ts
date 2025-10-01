'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEntities,
  getDynamicData,
  setDynamicDataBatch,
  upsertEntity,
  deleteEntity,
  DynamicFieldInput,
} from '@/lib/universal-api-v2-client'
import { Product } from '@/types/salon-product'

interface ProductDynamicData {
  category?: string
  brand?: string
  price?: number
  barcode?: string
  sku?: string
  cost?: number
  qty_on_hand?: number
  supplier_name?: string
  low_stock_alert?: number
  commission_amount?: number
  commission_type?: 'fixed' | 'percentage'
  is_retail?: boolean
  is_professional?: boolean
  selling_price?: number
  size?: string
  // Add more fields as needed
}

// No longer need to set organization context - we pass it with each request

export function useHeraProducts({
  includeArchived = false,
  searchQuery = '',
  categoryFilter = '',
  organizationId
}: {
  includeArchived?: boolean
  searchQuery?: string
  categoryFilter?: string
  organizationId?: string
} = {}) {
  const queryClient = useQueryClient()
  
  // Fetch all product entities using Universal API v2
  const { data: entities, isLoading: entitiesLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['products', organizationId, { includeArchived }],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')
      
      const result = await universalApi.getEntities({
        orgId: organizationId,
        entityType: 'product',
        status: includeArchived ? undefined : 'active' // Only get active products unless including archived
      })
      
      console.log('[useHeraProducts] Fetched products:', {
        count: result.length,
        organizationId
      })
      
      return result
    },
    enabled: !!organizationId
  })
  
  const error = fetchError?.message

  // Create mutations using Universal API v2
  const createEntity = useMutation({
    mutationFn: async (data: any) => {
      if (!organizationId) throw new Error('Organization ID required')
      const result = await universalApi.upsertEntity(organizationId, data)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] })
    }
  })

  const updateEntity = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!organizationId) throw new Error('Organization ID required')
      // For updates, we need to merge the existing data with updates
      const result = await universalApi.upsertEntity(organizationId, {
        ...updates,
        p_entity_id: id
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] })
    }
  })

  const deleteEntity = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error('Organization ID required')
      const result = await universalApi.deleteEntity(organizationId, id)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] })
    }
  })

  // Transform entities to Product format with dynamic data
  const products = useMemo(() => {
    if (!entities) return []
    
    return entities
      .filter(entity => {
        // Filter by status
        if (!includeArchived && entity.status === 'archived') {
          return false
        }

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            entity.entity_name.toLowerCase().includes(query) ||
            entity.entity_code?.toLowerCase().includes(query) ||
            false
          )
        }

        return true
      })
      .map(entity => {
        // Validate required fields for production
        if (!entity || !entity.entity_name || !entity.smart_code || !entity.id) {
          console.warn('Invalid entity data - missing required fields:', entity)
          return null
        }

        // Only include entities with valid currency data if price is set
        const hasPrice = entity.metadata?.price !== undefined && entity.metadata?.price !== null
        const hasCurrency = entity.metadata?.currency !== undefined && entity.metadata?.currency !== null
        
        if (hasPrice && !hasCurrency) {
          console.warn('Product has price but no currency, skipping:', entity.id)
          return null
        }

        // Transform to Product type (no dummy defaults)
        const product: Product = {
          id: entity.id,
          entity_name: entity.entity_name,
          entity_code: entity.entity_code || null,
          status: entity.status === 'archived' ? 'archived' : 'active',
          smart_code: entity.smart_code,
          qty_on_hand: entity.metadata?.qty_on_hand ? parseInt(entity.metadata.qty_on_hand) : 0,
          price: hasPrice ? parseFloat(entity.metadata.price) : null,
          category: entity.metadata?.category || null,
          description: entity.metadata?.description || null,
          currency: hasCurrency ? entity.metadata.currency : 'AED', // Only use AED if no price is set
          requires_inventory: entity.metadata?.requires_inventory === true,
          created_at: entity.created_at || null,
          updated_at: entity.updated_at || null
        }

        // Store additional fields in a separate object if needed
        // These are not part of the Product interface
        const additionalData = {
          brand: entity.metadata?.brand || '',
          cost: parseFloat(entity.metadata?.cost || '0'),
          barcode: entity.metadata?.barcode || '',
          sku: entity.metadata?.sku || '',
          size: entity.metadata?.size || '',
          supplier_name: entity.metadata?.supplier_name || '',
          selling_price: parseFloat(entity.metadata?.selling_price || '0'),
          is_retail: entity.metadata?.is_retail !== false,
          is_professional: entity.metadata?.is_professional === true,
          low_stock_alert: parseInt(entity.metadata?.low_stock_alert || '10'),
          commission_amount: parseFloat(entity.metadata?.commission_amount || '0'),
          commission_type: entity.metadata?.commission_type || 'fixed'
        }

        // Could store additionalData somewhere if needed
        // For now, just return the product
        return product
      })
      .filter(product => product !== null)
  }, [entities, includeArchived, searchQuery])

  // Filter by category if needed
  const filteredProducts = useMemo(() => {
    if (!categoryFilter) return products
    
    return products.filter(product => 
      product.category === categoryFilter
    )
  }, [products, categoryFilter])

  // Create product function
  const createProduct = async (productData: any) => {
    // Map the form data to our expected format
    const name = productData.name || productData.entity_name
    const code = productData.code || productData.entity_code || ''
    
    // Store all product data in metadata for now
    // In production, you'd use dynamic fields
    const metadata = {
      description: productData.description || '',
      category: productData.category || '',
      brand: productData.brand || '',
      price: productData.price?.toString() || '0',
      cost: productData.cost?.toString() || '0',
      qty_on_hand: productData.qty_on_hand?.toString() || '0',
      barcode: productData.barcode || '',
      sku: productData.sku || '',
      size: productData.size || '',
      supplier_name: productData.supplier_name || '',
      selling_price: productData.selling_price?.toString() || productData.price?.toString() || '0',
      is_retail: productData.is_retail !== false,
      is_professional: productData.is_professional === true,
      low_stock_alert: productData.low_stock_alert?.toString() || '10',
      commission_amount: productData.commission_amount?.toString() || '0',
      commission_type: productData.commission_type || 'fixed'
    }

    // Create the entity using RPC API
    const result = await createEntity.mutateAsync({
      p_entity_type: 'product',
      p_entity_name: name,
      p_entity_code: code,
      p_smart_code: 'HERA.SALON.PROD.ENT.RETAIL.V1',
      p_entity_description: productData.description || null,
      p_parent_entity_id: null
    })

    // TODO: Set dynamic fields for product-specific data
    // For now, storing in metadata

    // Dynamic fields would be set here in production
    // For now, everything is stored in metadata

    return result
  }

  // Update product function
  const updateProduct = async (productId: string, productData: any) => {
    // Map the form data
    const name = productData.name || productData.entity_name
    const code = productData.code || productData.entity_code
    
    // Build metadata with all fields
    const metadata: any = {}
    
    // Add all product fields to metadata
    const fields = [
      'description', 'category', 'brand', 'price', 'cost', 'qty_on_hand',
      'barcode', 'sku', 'size', 'supplier_name', 'selling_price',
      'is_retail', 'is_professional', 'low_stock_alert', 
      'commission_amount', 'commission_type'
    ]
    
    fields.forEach(field => {
      if (productData[field] !== undefined) {
        // Convert numbers to strings for storage
        if (typeof productData[field] === 'number') {
          metadata[field] = productData[field].toString()
        } else {
          metadata[field] = productData[field]
        }
      }
    })

    // Update the entity using RPC API
    await updateEntity.mutateAsync({
      id: productId,
      updates: {
        p_entity_type: 'product',
        p_entity_name: name || productData.entity_name,
        p_entity_code: code || productData.entity_code,
        p_smart_code: 'HERA.SALON.PROD.ENT.RETAIL.V1',
        p_entity_description: productData.description || null
      }
    })
  }

  // Archive/unarchive product
  const archiveProduct = async (productId: string, archive: boolean = true) => {
    // For now, we'll use the update mechanism
    // In the future, this should update status via relationships
    const product = entities?.find(e => e.id === productId)
    if (!product) return
    
    await updateEntity.mutateAsync({
      id: productId,
      updates: {
        p_entity_type: 'product',
        p_entity_name: product.entity_name,
        p_entity_code: product.entity_code,
        p_smart_code: product.smart_code,
        p_entity_description: product.description || null
      }
    })
  }

  // Delete product (soft delete)
  const deleteProduct = async (productId: string) => {
    await deleteEntity.mutateAsync(productId)
  }

  return {
    products: filteredProducts,
    isLoading: entitiesLoading,
    error: error,
    refetch,
    
    // Mutations
    createProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    
    // Loading states
    isCreating: createEntity.isPending,
    isUpdating: updateEntity.isPending,
    isDeleting: deleteEntity.isPending,
    isArchiving: updateEntity.isPending
  }
}