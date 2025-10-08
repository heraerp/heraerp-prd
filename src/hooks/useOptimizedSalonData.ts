/**
 * Optimized Salon Data Hooks
 * High-performance hooks that leverage global cache and smart loading
 */

import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useOptimizedSalonContext } from '@/app/salon/OptimizedSalonProvider'
import { 
  salonQueryKeys, 
  salonCacheHelpers, 
  salonPerformanceMonitor,
  salonUIStateManager 
} from '@/lib/salon/global-salon-cache'
import { getEntities, getTransactions, createEntity, updateEntity } from '@/lib/universal-api-v2-client'

// Hook for appointments with intelligent caching
export function useOptimizedAppointments(options?: {
  dateRange?: { start: string; end: string }
  branchId?: string
  status?: string
  realTime?: boolean
}) {
  const { organizationId, updateUIState } = useOptimizedSalonContext()
  const queryClient = useQueryClient()

  const queryKey = salonQueryKeys.appointments(
    organizationId!,
    options?.dateRange,
    options?.branchId
  )

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return []
      
      const start = Date.now()
      salonPerformanceMonitor.trackCacheHit(queryKey.join('-'), false)
      
      const data = await getTransactions({
        orgId: organizationId,
        transactionType: 'APPOINTMENT',
        startDate: options?.dateRange?.start,
        endDate: options?.dateRange?.end,
        ...(options?.branchId ? { branchId: options.branchId } : {})
      })
      
      salonPerformanceMonitor.trackPageLoad('appointments', Date.now() - start)
      return data
    },
    enabled: !!organizationId,
    staleTime: options?.realTime ? 30 * 1000 : 2 * 60 * 1000, // Real-time or 2 minutes
    refetchInterval: options?.realTime ? 30 * 1000 : false,
    refetchOnWindowFocus: options?.realTime,
    select: useCallback((data: any[]) => {
      // Client-side filtering for better performance
      let filtered = data
      
      if (options?.status && options.status !== 'all') {
        filtered = filtered.filter(apt => apt.metadata?.status === options.status)
      }
      
      return filtered
    }, [options?.status])
  })

  // Optimistic mutation for quick updates
  const updateAppointment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return updateEntity(id, updates)
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey)
      
      // Optimistically update
      queryClient.setQueryData(queryKey, (old: any[]) => {
        if (!old) return []
        return old.map(apt => apt.id === id ? { ...apt, ...updates } : apt)
      })
      
      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      salonCacheHelpers.invalidateAfterMutation(queryClient, 'update', 'appointments', organizationId!)
    }
  })

  const createAppointment = useMutation({
    mutationFn: async (appointmentData: any) => {
      return createEntity(appointmentData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      salonCacheHelpers.invalidateAfterMutation(queryClient, 'create', 'appointments', organizationId!)
    }
  })

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    isValidating: query.isFetching,
    lastUpdated: query.dataUpdatedAt,
    
    // Mutations
    updateAppointment: updateAppointment.mutate,
    createAppointment: createAppointment.mutate,
    isUpdating: updateAppointment.isPending,
    isCreating: createAppointment.isPending,
    
    // Cache management
    refresh: () => queryClient.invalidateQueries({ queryKey }),
    prefetch: (dateRange: { start: string; end: string }) => {
      const newQueryKey = salonQueryKeys.appointments(organizationId!, dateRange, options?.branchId)
      return queryClient.prefetchQuery({
        queryKey: newQueryKey,
        staleTime: 2 * 60 * 1000
      })
    }
  }
}

// Hook for staff with role-based filtering
export function useOptimizedStaff(options?: {
  branchId?: string
  role?: string
  includeUnavailable?: boolean
}) {
  const { staff: cachedStaff, loadingStates, organizationId } = useOptimizedSalonContext()
  
  // Use cached data first, then enhance with real-time updates if needed
  const filteredStaff = useMemo(() => {
    let filtered = cachedStaff || []
    
    if (options?.branchId && options.branchId !== '__ALL__') {
      filtered = filtered.filter(staff => staff.metadata?.branch_id === options.branchId)
    }
    
    if (options?.role) {
      filtered = filtered.filter(staff => staff.metadata?.role === options.role)
    }
    
    if (!options?.includeUnavailable) {
      filtered = filtered.filter(staff => staff.metadata?.available !== false)
    }
    
    return filtered
  }, [cachedStaff, options])

  return {
    staff: filteredStaff,
    isLoading: loadingStates.staff,
    allStaff: cachedStaff,
    
    // Helpers
    getStaffById: useCallback((id: string) => {
      return cachedStaff?.find(s => s.id === id)
    }, [cachedStaff]),
    
    getStaffByRole: useCallback((role: string) => {
      return cachedStaff?.filter(s => s.metadata?.role === role) || []
    }, [cachedStaff])
  }
}

// Hook for customers with search and pagination
export function useOptimizedCustomers(options?: {
  search?: string
  limit?: number
  offset?: number
}) {
  const { customers: cachedCustomers, loadingStates, organizationId } = useOptimizedSalonContext()
  const queryClient = useQueryClient()

  // Use cached data with client-side filtering for performance
  const filteredCustomers = useMemo(() => {
    let filtered = cachedCustomers || []
    
    if (options?.search) {
      const searchLower = options.search.toLowerCase()
      filtered = filtered.filter(customer => 
        customer.entity_name?.toLowerCase().includes(searchLower) ||
        customer.metadata?.email?.toLowerCase().includes(searchLower) ||
        customer.metadata?.phone?.includes(options.search!)
      )
    }
    
    // Apply pagination
    if (options?.offset || options?.limit) {
      const start = options.offset || 0
      const end = start + (options.limit || 50)
      filtered = filtered.slice(start, end)
    }
    
    return filtered
  }, [cachedCustomers, options])

  // Load more customers if needed
  const loadMore = useCallback(async () => {
    if (!organizationId) return
    
    const currentCount = cachedCustomers?.length || 0
    const moreQueryKey = salonQueryKeys.customers(organizationId, { 
      limit: 500, 
      offset: currentCount 
    })
    
    const moreData = await queryClient.fetchQuery({
      queryKey: moreQueryKey,
      queryFn: async () => {
        return getEntities('', {
          p_organization_id: organizationId,
          p_entity_type: 'CUSTOMER',
          p_limit: 500,
          p_offset: currentCount
        })
      },
      staleTime: 10 * 60 * 1000
    })
    
    // Merge with cached data
    if (moreData?.length) {
      const allCustomersKey = salonQueryKeys.customers(organizationId)
      queryClient.setQueryData(allCustomersKey, (old: any[]) => {
        const existing = old || []
        const newIds = new Set(existing.map(c => c.id))
        const uniqueNew = moreData.filter(c => !newIds.has(c.id))
        return [...existing, ...uniqueNew]
      })
    }
    
    return moreData
  }, [organizationId, cachedCustomers, queryClient])

  return {
    customers: filteredCustomers,
    isLoading: loadingStates.customers,
    totalCount: cachedCustomers?.length || 0,
    hasMore: (cachedCustomers?.length || 0) % 1000 === 0, // Assume more if exact multiple
    
    // Actions
    loadMore,
    
    // Helpers
    searchCustomers: useCallback((query: string) => {
      return cachedCustomers?.filter(customer => 
        customer.entity_name?.toLowerCase().includes(query.toLowerCase()) ||
        customer.metadata?.email?.toLowerCase().includes(query.toLowerCase())
      ) || []
    }, [cachedCustomers])
  }
}

// Hook for services with category filtering
export function useOptimizedServices(options?: {
  categoryId?: string
  available?: boolean
}) {
  const { services: cachedServices, loadingStates } = useOptimizedSalonContext()
  
  const filteredServices = useMemo(() => {
    let filtered = cachedServices || []
    
    if (options?.categoryId) {
      filtered = filtered.filter(service => service.metadata?.category_id === options.categoryId)
    }
    
    if (options?.available !== undefined) {
      filtered = filtered.filter(service => service.metadata?.available === options.available)
    }
    
    return filtered
  }, [cachedServices, options])

  return {
    services: filteredServices,
    isLoading: loadingStates.services,
    allServices: cachedServices,
    
    // Helpers
    getServicesByCategory: useCallback((categoryId: string) => {
      return cachedServices?.filter(s => s.metadata?.category_id === categoryId) || []
    }, [cachedServices]),
    
    getPopularServices: useCallback(() => {
      return cachedServices?.filter(s => s.metadata?.popular === true) || []
    }, [cachedServices])
  }
}

// Hook for branch filtering with persistence
export function useOptimizedBranchFilter(componentName: string) {
  const { 
    branches, 
    organizationId, 
    uiState, 
    updateUIState,
    loadingStates 
  } = useOptimizedSalonContext()

  const selectedBranchId = uiState?.selectedBranchId

  const setBranchId = useCallback((branchId: string) => {
    updateUIState({ selectedBranchId: branchId })
  }, [updateUIState])

  const hasMultipleBranches = branches.length > 1

  return {
    branches,
    selectedBranchId,
    setBranchId,
    hasMultipleBranches,
    isLoading: loadingStates.branches,
    
    // Helpers
    getSelectedBranch: useCallback(() => {
      return branches.find(b => b.id === selectedBranchId)
    }, [branches, selectedBranchId]),
    
    getBranchName: useCallback((branchId: string) => {
      return branches.find(b => b.id === branchId)?.entity_name || 'Unknown Branch'
    }, [branches])
  }
}

// Hook for salon dashboard data
export function useOptimizedDashboardData() {
  const { 
    todayAppointments, 
    staff, 
    organizationId, 
    performanceMetrics,
    refreshAll
  } = useOptimizedSalonContext()

  // Calculate dashboard metrics
  const dashboardStats = useMemo(() => {
    const today = new Date().toDateString()
    const todayAppts = todayAppointments || []
    
    return {
      todayAppointments: todayAppts.length,
      completedToday: todayAppts.filter(apt => apt.metadata?.status === 'completed').length,
      upcomingToday: todayAppts.filter(apt => apt.metadata?.status === 'booked').length,
      totalRevenue: todayAppts.reduce((sum, apt) => sum + (apt.total_amount || 0), 0),
      activeStaff: staff?.filter(s => s.metadata?.available !== false).length || 0,
      totalStaff: staff?.length || 0
    }
  }, [todayAppointments, staff])

  return {
    stats: dashboardStats,
    todayAppointments,
    performanceMetrics,
    refreshAll,
    
    // Quick actions
    getUpcomingAppointments: useCallback((hours: number = 2) => {
      const now = new Date()
      const future = new Date(now.getTime() + hours * 60 * 60 * 1000)
      
      return todayAppointments?.filter(apt => {
        const aptTime = new Date(apt.metadata?.start_time || apt.transaction_date)
        return aptTime >= now && aptTime <= future
      }) || []
    }, [todayAppointments])
  }
}