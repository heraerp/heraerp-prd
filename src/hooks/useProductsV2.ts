'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface ProductFormData {
  name: string
  code?: string
  category?: string
  price?: number
  currency: string
  description?: string
  requires_inventory: boolean
  reorder_point?: number
  brand?: string
  barcode?: string
}

export function useProductsV2() {
  const { organization } = useHERAAuth()
  const queryClient = useQueryClient()
  const organizationId = organization?.id

  // Fetch products
  const {
    data: productsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['products-v2', organizationId],
    queryFn: async () => {
      const response = await fetch('/api/salon/products-v2?limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json()
    },
    enabled: !!organizationId
  })

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const response = await fetch('/api/salon/products-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-v2', organizationId] })
    }
  })

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/salon/products-v2/${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-v2', organizationId] })
    }
  })

  return {
    products: productsData?.data || [],
    isLoading,
    error: error?.message,
    refetch,
    
    // Mutations
    createProduct: createProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
    
    // Loading states
    isCreating: createProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending
  }
}