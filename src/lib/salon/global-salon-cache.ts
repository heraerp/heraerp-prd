/**
 * Global Salon Cache Manager
 * Enterprise-grade caching solution for salon app
 * Persists data across navigation and page reloads
 */

import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

// Cache configuration with different TTL for different data types
const CACHE_CONFIG = {
  // Core business data - cache longer
  organizations: 30 * 60 * 1000, // 30 minutes
  branches: 20 * 60 * 1000, // 20 minutes
  staff: 15 * 60 * 1000, // 15 minutes
  customers: 10 * 60 * 1000, // 10 minutes
  services: 15 * 60 * 1000, // 15 minutes

  // Dynamic data - shorter cache
  appointments: 2 * 60 * 1000, // 2 minutes
  transactions: 1 * 60 * 1000, // 1 minute

  // UI state - persist across sessions
  uiState: 24 * 60 * 60 * 1000, // 24 hours

  // Real-time data - very short cache
  availability: 30 * 1000, // 30 seconds
  notifications: 60 * 1000 // 1 minute
}

// Storage keys
const STORAGE_KEYS = {
  queryCache: 'salon-query-cache-v1',
  uiState: 'salon-ui-state-v1',
  userPreferences: 'salon-user-prefs-v1'
}

// Create persistent storage for React Query
const createPersistentStorage = () => {
  if (typeof window === 'undefined') return null

  return createSyncStoragePersister({
    storage: window.localStorage,
    key: STORAGE_KEYS.queryCache,
    serialize: JSON.stringify,
    deserialize: JSON.parse
  })
}

// Create optimized Query Client for salon app
export const createSalonQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Global defaults for salon app
        staleTime: 5 * 60 * 1000, // 5 minutes default
        gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
        retry: (failureCount, error: any) => {
          // Smart retry logic
          if (error?.status === 401) return false // Don't retry auth errors
          if (error?.status >= 400 && error?.status < 500) return false // Don't retry client errors
          return failureCount < 3
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false, // Disable for salon app
        refetchOnReconnect: true,
        refetchOnMount: 'always', // Always check for fresh data
        networkMode: 'online'
      },
      mutations: {
        retry: 1,
        networkMode: 'online'
      }
    }
  })

  // Setup persistence
  if (typeof window !== 'undefined') {
    const persister = createPersistentStorage()
    if (persister) {
      persistQueryClient({
        queryClient,
        persister,
        maxAge: CACHE_CONFIG.organizations, // Max age for persisted data
        hydrateOptions: {
          defaultOptions: {
            queries: {
              staleTime: CACHE_CONFIG.organizations
            }
          }
        },
        dehydrateOptions: {
          shouldDehydrateQuery: query => {
            // Only persist certain query types
            const queryKey = query.queryKey[0] as string
            return ['organizations', 'branches', 'staff', 'customers', 'services', 'ui-state'].some(
              key => queryKey.includes(key)
            )
          }
        }
      })
    }
  }

  return queryClient
}

// Query key factories for consistent caching
export const salonQueryKeys = {
  // Core entities
  organizations: (orgId?: string) => ['salon', 'organizations', orgId].filter(Boolean),
  branches: (orgId: string) => ['salon', 'branches', orgId],
  staff: (orgId: string, branchId?: string) => ['salon', 'staff', orgId, branchId].filter(Boolean),
  customers: (orgId: string, params?: any) => ['salon', 'customers', orgId, params],
  services: (orgId: string, categoryId?: string) =>
    ['salon', 'services', orgId, categoryId].filter(Boolean),

  // Dynamic data
  appointments: (orgId: string, dateRange?: { start: string; end: string }, branchId?: string) =>
    ['salon', 'appointments', orgId, dateRange, branchId].filter(Boolean),
  transactions: (orgId: string, type?: string, dateRange?: any) =>
    ['salon', 'transactions', orgId, type, dateRange].filter(Boolean),

  // UI state
  uiState: (userId: string, component: string) => ['salon', 'ui-state', userId, component],
  branchFilter: (userId: string, component: string) => [
    'salon',
    'branch-filter',
    userId,
    component
  ],

  // Real-time data
  availability: (orgId: string, date: string) => ['salon', 'availability', orgId, date],
  notifications: (userId: string) => ['salon', 'notifications', userId]
}

// Cache invalidation helpers
export const salonCacheHelpers = {
  // Invalidate all salon data
  invalidateAll: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: ['salon'] })
  },

  // Invalidate specific entity type
  invalidateEntity: (
    queryClient: QueryClient,
    entityType: keyof typeof salonQueryKeys,
    orgId: string
  ) => {
    return queryClient.invalidateQueries({ queryKey: [entityType, orgId] })
  },

  // Smart invalidation after mutations
  invalidateAfterMutation: (
    queryClient: QueryClient,
    mutationType: string,
    entityType: string,
    orgId: string
  ) => {
    switch (mutationType) {
      case 'create':
      case 'update':
      case 'delete':
        // Invalidate the specific entity type
        queryClient.invalidateQueries({ queryKey: ['salon', entityType, orgId] })
        // Also invalidate related data
        if (entityType === 'appointments') {
          queryClient.invalidateQueries({ queryKey: ['salon', 'availability', orgId] })
        }
        break
      default:
        break
    }
  },

  // Prefetch critical data
  prefetchCriticalData: async (queryClient: QueryClient, orgId: string) => {
    const prefetchPromises = [
      queryClient.prefetchQuery({
        queryKey: salonQueryKeys.organizations(orgId),
        staleTime: CACHE_CONFIG.organizations
      }),
      queryClient.prefetchQuery({
        queryKey: salonQueryKeys.branches(orgId),
        staleTime: CACHE_CONFIG.branches
      }),
      queryClient.prefetchQuery({
        queryKey: salonQueryKeys.staff(orgId),
        staleTime: CACHE_CONFIG.staff
      })
    ]

    return Promise.allSettled(prefetchPromises)
  }
}

// UI State persistence
interface SalonUIState {
  selectedBranchId?: string
  viewPreferences?: {
    appointmentsView?: 'grid' | 'list'
    calendarView?: 'day' | 'week' | 'month'
    sidebarCollapsed?: boolean
  }
  filters?: {
    dateRange?: { start: string; end: string }
    status?: string
    stylist?: string
  }
  lastVisited?: {
    page?: string
    timestamp?: number
  }
}

export const salonUIStateManager = {
  save: (userId: string, component: string, state: Partial<SalonUIState>) => {
    if (typeof window === 'undefined') return

    const key = `${STORAGE_KEYS.uiState}-${userId}-${component}`
    const existing = salonUIStateManager.load(userId, component)
    const merged = { ...existing, ...state, lastUpdated: Date.now() }

    try {
      localStorage.setItem(key, JSON.stringify(merged))
    } catch (error) {
      console.warn('Failed to save UI state:', error)
    }
  },

  load: (userId: string, component: string): SalonUIState => {
    if (typeof window === 'undefined') return {}

    const key = `${STORAGE_KEYS.uiState}-${userId}-${component}`

    try {
      const stored = localStorage.getItem(key)
      if (!stored) return {}

      const parsed = JSON.parse(stored)

      // Check if state is expired (24 hours)
      if (parsed.lastUpdated && Date.now() - parsed.lastUpdated > CACHE_CONFIG.uiState) {
        localStorage.removeItem(key)
        return {}
      }

      return parsed
    } catch (error) {
      console.warn('Failed to load UI state:', error)
      return {}
    }
  },

  clear: (userId: string, component?: string) => {
    if (typeof window === 'undefined') return

    if (component) {
      const key = `${STORAGE_KEYS.uiState}-${userId}-${component}`
      localStorage.removeItem(key)
    } else {
      // Clear all UI state for user
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`${STORAGE_KEYS.uiState}-${userId}`)) {
          localStorage.removeItem(key)
        }
      })
    }
  }
}

// Performance monitoring
export const salonPerformanceMonitor = {
  trackPageLoad: (page: string, loadTime: number) => {
    console.log(`Salon ${page} loaded in ${loadTime}ms`)

    // Send to analytics if needed
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'page_load_time', {
        custom_parameter_1: page,
        value: Math.round(loadTime)
      })
    }
  },

  trackCacheHit: (queryKey: string, fromCache: boolean) => {
    console.log(`Query ${queryKey} ${fromCache ? 'HIT' : 'MISS'} cache`)
  },

  trackDataFreshness: (queryKey: string, age: number) => {
    if (age > 60000) {
      // Older than 1 minute
      console.warn(`Stale data for ${queryKey}, age: ${age}ms`)
    }
  }
}
