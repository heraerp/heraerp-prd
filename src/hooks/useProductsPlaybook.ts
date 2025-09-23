'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Product, ProductForm, ProductFilters, ProductsResponse } from '@/types/salon-product'

// Products API functions
async function fetchProducts(
  organizationId: string,
  filters: Partial<ProductFilters> = {}
): Promise<ProductsResponse> {
  const params = new URLSearchParams({
    ...filters,
    limit: filters.limit?.toString() || '100',
    offset: filters.offset?.toString() || '0'
  } as Record<string, string>)

  const response = await fetch(`/api/playbook/salon/products?${params}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch products')
  }
  return response.json()
}

async function createProduct(organizationId: string, productData: ProductForm): Promise<Product> {
  const response = await fetch('/api/playbook/salon/products', {
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
}

async function updateProduct(
  organizationId: string,
  productId: string,
  productData: Partial<ProductForm>
): Promise<void> {
  const response = await fetch(`/api/playbook/salon/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update product')
  }
}

async function deleteProduct(organizationId: string, productId: string): Promise<void> {
  const response = await fetch(`/api/playbook/salon/products/${productId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete product')
  }
}

async function archiveProduct(
  organizationId: string,
  productId: string,
  archive: boolean = true
): Promise<void> {
  const response = await fetch(`/api/playbook/salon/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: archive ? 'archived' : 'active'
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to ${archive ? 'archive' : 'restore'} product`)
  }
}

// Products hook
export function useProductsPlaybook({
  organizationId,
  filters = {},
  includeArchived = false
}: {
  organizationId: string
  filters?: Partial<ProductFilters>
  includeArchived?: boolean
}) {
  const queryClient = useQueryClient()

  // Merge filters with defaults
  const finalFilters: Partial<ProductFilters> = {
    status: includeArchived ? 'all' : 'active',
    sort: 'name_asc',
    limit: 100,
    offset: 0,
    ...filters
  }

  // Fetch products
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['products', organizationId, finalFilters],
    queryFn: () => fetchProducts(organizationId, finalFilters),
    enabled: !!organizationId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  })

  const products = productsResponse?.items || []

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (productData: ProductForm) => createProduct(organizationId, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] })
    }
  })

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({
      productId,
      productData
    }: {
      productId: string
      productData: Partial<ProductForm>
    }) => updateProduct(organizationId, productId, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] })
    }
  })

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(organizationId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] })
    }
  })

  // Archive product mutation
  const archiveProductMutation = useMutation({
    mutationFn: ({ productId, archive }: { productId: string; archive: boolean }) =>
      archiveProduct(organizationId, productId, archive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', organizationId] })
    }
  })

  return {
    products,
    isLoading,
    error: error?.message,
    refetch,

    // Mutations
    createProduct: createProductMutation.mutateAsync,
    updateProduct: (productId: string, productData: Partial<ProductForm>) =>
      updateProductMutation.mutateAsync({ productId, productData }),
    deleteProduct: deleteProductMutation.mutateAsync,
    archiveProduct: (productId: string, archive: boolean = true) =>
      archiveProductMutation.mutateAsync({ productId, archive }),

    // Loading states
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
    isArchiving: archiveProductMutation.isPending
  }
}
