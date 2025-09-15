'use client'

import { useState, useEffect, useCallback } from 'react'

interface Product {
  id: string
  entity_code: string
  entity_name: string
  category: string
  material: string
  length_cm: number
  width_cm: number
  height_cm: number
  price: number
  stock_quantity: number
  status: string
  metadata?: any
  sub_category?: string
  [key: string]: any // For dynamic fields
}

interface ProductsData {
  products: Product[]
  loading: boolean
  error: string | null
}

// Cache to store data between component remounts
const dataCache = new Map<string, { data: ProductsData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useProductsData(organizationId: string | null) {
  const [data, setData] = useState<ProductsData>({
    products: [],
    loading: true,
    error: null
  })

  const loadProducts = useCallback(async () => {
    if (!organizationId) {
      setData({
        products: [],
        loading: false,
        error: null
      })
      return
    }

    // Check cache first
    const cacheKey = `products-${organizationId}`
    const cached = dataCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data)
      return
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Fetch products from API endpoint with proper error handling
      const response = await fetch(`/api/furniture/products?organizationId=${organizationId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch products')
      }

      const { products: allEntities, dynamicData: allDynamicData } = await response.json()

      // Filter for furniture products
      const productEntities = (allEntities || []).filter((e: any) =>
        e.smart_code?.startsWith('HERA.FURNITURE.PRODUCT')
      )

      // If no furniture products, try all products
      const finalProducts = productEntities.length > 0 ? productEntities : allEntities || []

      // Enrich products with dynamic fields
      const enrichedProducts = finalProducts.map((product: any) => {
        // Get dynamic fields for this product
        const productDynamicData =
          allDynamicData?.filter((d: any) => d.entity_id === product.id) || []

        // Transform dynamic data into object
        const dynamicFields = productDynamicData.reduce((acc: any, field: any) => {
          let value =
            field.field_value_text || field.field_value_number || field.field_value_boolean

          // Handle JSON field - it might already be parsed
          if (!value && field.field_value_json) {
            try {
              value =
                typeof field.field_value_json === 'string'
                  ? JSON.parse(field.field_value_json)
                  : field.field_value_json
            } catch (e) {
              console.warn(
                'Failed to parse JSON for field:',
                field.field_name,
                field.field_value_json
              )
              value = field.field_value_json
            }
          }

          if (value !== null && value !== undefined) {
            acc[field.field_name] = value
          }
          return acc
        }, {})

        return {
          ...product,
          ...dynamicFields,
          category:
            dynamicFields.category || (product.metadata as any)?.category || 'uncategorized',
          sub_category: dynamicFields.sub_category || (product.metadata as any)?.sub_category,
          material: dynamicFields.material || (product.metadata as any)?.material || '',
          length_cm: dynamicFields.length_cm || (product.metadata as any)?.length_cm || 0,
          width_cm: dynamicFields.width_cm || (product.metadata as any)?.width_cm || 0,
          height_cm: dynamicFields.height_cm || (product.metadata as any)?.height_cm || 0,
          price: dynamicFields.price || (product.metadata as any)?.price || 0,
          stock_quantity:
            dynamicFields.stock_quantity || (product.metadata as any)?.stock_quantity || 0,
          status: dynamicFields.status || (product.metadata as any)?.status || 'active'
        }
      })

      const newData: ProductsData = {
        products: enrichedProducts,
        loading: false,
        error: null
      }

      // Update cache
      dataCache.set(cacheKey, { data: newData, timestamp: Date.now() })
      setData(newData)
    } catch (error) {
      console.error('Failed to load products:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load products'
      }))
    }
  }, [organizationId])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const refresh = useCallback(() => {
    if (organizationId) {
      // Clear cache and reload
      const cacheKey = `products-${organizationId}`
      dataCache.delete(cacheKey)
      loadProducts()
    }
  }, [organizationId, loadProducts])

  const filterProducts = useCallback(
    (searchTerm: string) => {
      if (!searchTerm) return data.products

      const lowerSearch = searchTerm.toLowerCase()
      return data.products.filter(
        p =>
          p.entity_name.toLowerCase().includes(lowerSearch) ||
          p.entity_code.toLowerCase().includes(lowerSearch) ||
          p.material?.toLowerCase().includes(lowerSearch) ||
          p.category?.toLowerCase().includes(lowerSearch)
      )
    },
    [data.products]
  )

  return {
    ...data,
    refresh,
    filterProducts
  }
}
