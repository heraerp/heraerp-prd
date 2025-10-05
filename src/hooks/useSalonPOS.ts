/**
 * HERA Salon POS Composition Hook
 * Smart Code: HERA.HOOKS.SALON.POS.COMPOSITION.V1
 *
 * Thin composition layer that combines existing hooks for POS UI.
 * Does NOT fetch directly - delegates to useHeraServicesV2, useHeraProducts, useHeraStaff.
 *
 * Benefits:
 * - Unified POS item list (services + products)
 * - Inherits branch filtering, search, category from base hooks
 * - Clean separation: data fetching vs POS-specific logic
 * - Preserves raw entities for checkout/transaction building
 */

import { useMemo } from 'react'
import { useHeraServices } from '@/hooks/useHeraServicesV2'
import { useHeraProducts } from '@/hooks/useHeraProducts'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useBranchFilter } from '@/hooks/useBranchFilter'

export type PosItem = {
  __kind: 'SERVICE' | 'PRODUCT'
  raw: any // Preserve original entity for checkout
  id: string
  title: string
  code?: string | null
  category?: string | null
  description?: string | null
  price: number
  imageUrl?: string | null
  duration?: number | null // For services
  metadata?: any
}

export interface UseSalonPOSOptions {
  search?: string
  categoryId?: string
  organizationId?: string
}

export interface UseSalonPOSReturn {
  items: PosItem[]
  staff: any[]
  branchId: string | undefined
  branches: any[]
  isLoading: boolean
  isFetching: boolean
  error: string | null
  refetch: () => void
  setBranchId: (branchId: string | undefined) => void
}

export function useSalonPOS(options?: UseSalonPOSOptions): UseSalonPOSReturn {
  const { search, categoryId, organizationId } = options || {}

  // Get branch filter state
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId
  } = useBranchFilter(undefined, undefined, organizationId)

  // Use existing hooks - they handle all data fetching with proper branch filtering
  const {
    services,
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices
  } = useHeraServices({
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      search,
      category_id: categoryId,
      branch_id: branchId && branchId !== 'all' ? branchId : undefined,
      limit: 100
    }
  })

  const {
    products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useHeraProducts({
    organizationId,
    includeArchived: false,
    searchQuery: search || '',
    categoryFilter: categoryId || '',
    filters: {
      include_dynamic: true,
      include_relationships: true,
      branch_id: branchId && branchId !== 'all' ? branchId : undefined,
      limit: 100
    }
  })

  const {
    staff,
    isLoading: staffLoading,
    error: staffError,
    refetch: refetchStaff
  } = useHeraStaff({
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      branch_id: branchId && branchId !== 'all' ? branchId : undefined,
      limit: 100
    }
  })

  console.log('[useSalonPOS] Staff data:', {
    count: staff?.length || 0,
    isLoading: staffLoading,
    error: staffError,
    branchId,
    organizationId
  })

  // Merge services and products into unified POS items
  const items: PosItem[] = useMemo(() => {
    console.log('[useSalonPOS] Creating POS items:', {
      servicesCount: services?.length || 0,
      productsCount: products?.length || 0,
      sampleService: services?.[0],
      branchId
    })

    const serviceItems: PosItem[] =
      (services || []).map((svc: any) => ({
        __kind: 'SERVICE' as const,
        raw: svc,
        id: svc.id,
        title: svc.entity_name,
        code: svc.entity_code,
        category: svc.category || null, // useHeraServices flattens category from relationships
        description: svc.service_description || svc.description || null, // Try both field names
        price: svc.market_price || svc.price_market || svc.price || 0, // Try multiple field names
        imageUrl: svc.image_url || svc.imageUrl || null, // Try both field names
        duration: svc.duration_minutes || svc.duration_min || null, // FIXED: use duration_minutes
        metadata: svc.metadata
      })) || []

    console.log('[useSalonPOS] Created service items:', {
      count: serviceItems.length,
      sample: serviceItems[0]
    })

    const productItems: PosItem[] =
      (products || []).map((prd: any) => ({
        __kind: 'PRODUCT' as const,
        raw: prd,
        id: prd.id,
        title: prd.entity_name,
        code: prd.entity_code,
        category: prd.category || null, // Products don't have flattened category from hook, but should have it
        description: prd.entity_description || null, // Use entity_description field
        price: prd.price_market || prd.price || 0, // Try price_market first, fallback to price
        imageUrl: prd.image_url || null, // Flattened dynamic field
        duration: null,
        metadata: prd.metadata
      })) || []

    return [...serviceItems, ...productItems]
  }, [services, products])

  const isLoading = servicesLoading || productsLoading || staffLoading || branchesLoading
  const isFetching = servicesLoading || productsLoading || staffLoading

  const error = servicesError || productsError || staffError || null

  const refetch = () => {
    refetchServices()
    refetchProducts()
    refetchStaff()
  }

  return {
    items,
    staff: staff || [],
    branchId,
    branches,
    isLoading,
    isFetching,
    error,
    refetch,
    setBranchId
  }
}
