'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect } from 'react'

export interface FilterValue {
  value: any
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between'
  label?: string
}

export interface Filter {
  field: string
  value: FilterValue
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
  active: boolean
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total?: number
}

export interface HeraFilterState {
  // Core state
  entityType: string
  organizationId: string
  searchQuery: string
  filters: Record<string, Filter>
  activeFilters: string[]
  sortConfig: SortConfig
  pagination: PaginationConfig
  
  // UI state
  isFilterPanelOpen: boolean
  isLoading: boolean
  lastUpdated: number
  
  // Actions
  setEntityType: (entityType: string) => void
  setOrganizationId: (orgId: string) => void
  setSearchQuery: (query: string) => void
  addFilter: (field: string, filter: Omit<Filter, 'active'>) => void
  removeFilter: (field: string) => void
  updateFilter: (field: string, updates: Partial<Filter>) => void
  toggleFilter: (field: string) => void
  clearAllFilters: () => void
  setSortConfig: (config: SortConfig) => void
  setPagination: (config: Partial<PaginationConfig>) => void
  setFilterPanelOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  resetStore: () => void
}

const initialState = {
  entityType: '',
  organizationId: '',
  searchQuery: '',
  filters: {},
  activeFilters: [],
  sortConfig: { field: 'created_at', direction: 'desc' as const },
  pagination: { page: 1, pageSize: 20 },
  isFilterPanelOpen: false,
  isLoading: false,
  lastUpdated: Date.now()
}

export const useHeraFilterStore = create<HeraFilterState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setEntityType: (entityType: string) => {
        set({ 
          entityType, 
          lastUpdated: Date.now(),
          // Reset pagination when entity type changes
          pagination: { ...get().pagination, page: 1 }
        })
      },
      
      setOrganizationId: (organizationId: string) => {
        set({ organizationId, lastUpdated: Date.now() })
      },
      
      setSearchQuery: (searchQuery: string) => {
        set({ 
          searchQuery, 
          lastUpdated: Date.now(),
          // Reset pagination when search changes
          pagination: { ...get().pagination, page: 1 }
        })
      },
      
      addFilter: (field: string, filter: Omit<Filter, 'active'>) => {
        const filters = { ...get().filters }
        filters[field] = { ...filter, active: true }
        
        const activeFilters = [...get().activeFilters]
        if (!activeFilters.includes(field)) {
          activeFilters.push(field)
        }
        
        set({ 
          filters, 
          activeFilters,
          lastUpdated: Date.now(),
          // Reset pagination when filters change
          pagination: { ...get().pagination, page: 1 }
        })
      },
      
      removeFilter: (field: string) => {
        const filters = { ...get().filters }
        delete filters[field]
        
        const activeFilters = get().activeFilters.filter(f => f !== field)
        
        set({ 
          filters, 
          activeFilters,
          lastUpdated: Date.now(),
          pagination: { ...get().pagination, page: 1 }
        })
      },
      
      updateFilter: (field: string, updates: Partial<Filter>) => {
        const filters = { ...get().filters }
        if (filters[field]) {
          filters[field] = { ...filters[field], ...updates }
          set({ 
            filters, 
            lastUpdated: Date.now(),
            pagination: { ...get().pagination, page: 1 }
          })
        }
      },
      
      toggleFilter: (field: string) => {
        const filters = { ...get().filters }
        let activeFilters = [...get().activeFilters]
        
        if (filters[field]) {
          filters[field].active = !filters[field].active
          
          if (filters[field].active && !activeFilters.includes(field)) {
            activeFilters.push(field)
          } else if (!filters[field].active) {
            activeFilters = activeFilters.filter(f => f !== field)
          }
          
          set({ 
            filters, 
            activeFilters,
            lastUpdated: Date.now(),
            pagination: { ...get().pagination, page: 1 }
          })
        }
      },
      
      clearAllFilters: () => {
        set({ 
          filters: {},
          activeFilters: [],
          searchQuery: '',
          lastUpdated: Date.now(),
          pagination: { ...get().pagination, page: 1 }
        })
      },
      
      setSortConfig: (sortConfig: SortConfig) => {
        set({ 
          sortConfig, 
          lastUpdated: Date.now(),
          pagination: { ...get().pagination, page: 1 }
        })
      },
      
      setPagination: (config: Partial<PaginationConfig>) => {
        const pagination = { ...get().pagination, ...config }
        set({ pagination, lastUpdated: Date.now() })
      },
      
      setFilterPanelOpen: (isFilterPanelOpen: boolean) => {
        set({ isFilterPanelOpen })
      },
      
      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },
      
      resetStore: () => {
        set({ 
          ...initialState, 
          lastUpdated: Date.now(),
          // Preserve organization and entity type
          organizationId: get().organizationId,
          entityType: get().entityType
        })
      }
    }),
    {
      name: 'hera-filter-store',
      partialize: (state) => ({
        // Only persist essential filter state, not UI state
        entityType: state.entityType,
        organizationId: state.organizationId,
        filters: state.filters,
        activeFilters: state.activeFilters,
        sortConfig: state.sortConfig,
        pagination: state.pagination
      })
    }
  )
)

// Hook to sync with URL parameters
export const useHeraFilterSync = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = useHeraFilterStore()
  
  // Sync store to URL
  const syncToUrl = useCallback(() => {
    const params = new URLSearchParams()
    
    if (store.searchQuery) {
      params.set('search', store.searchQuery)
    }
    
    if (store.activeFilters.length > 0) {
      const activeFilterData: Record<string, any> = {}
      store.activeFilters.forEach(field => {
        const filter = store.filters[field]
        if (filter && filter.active) {
          activeFilterData[field] = {
            value: filter.value.value,
            operator: filter.value.operator,
            type: filter.type
          }
        }
      })
      params.set('filters', JSON.stringify(activeFilterData))
    }
    
    if (store.sortConfig.field !== 'created_at' || store.sortConfig.direction !== 'desc') {
      params.set('sort', `${store.sortConfig.field}:${store.sortConfig.direction}`)
    }
    
    if (store.pagination.page > 1) {
      params.set('page', store.pagination.page.toString())
    }
    
    if (store.pagination.pageSize !== 20) {
      params.set('pageSize', store.pagination.pageSize.toString())
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    if (newUrl !== window.location.search) {
      router.replace(newUrl, { scroll: false })
    }
  }, [store, router])
  
  // Sync URL to store
  const syncFromUrl = useCallback(() => {
    const search = searchParams.get('search')
    if (search && search !== store.searchQuery) {
      store.setSearchQuery(search)
    }
    
    const filtersParam = searchParams.get('filters')
    if (filtersParam) {
      try {
        const filterData = JSON.parse(filtersParam)
        Object.entries(filterData).forEach(([field, data]: [string, any]) => {
          store.addFilter(field, {
            field,
            value: {
              value: data.value,
              operator: data.operator || 'eq'
            },
            type: data.type || 'text'
          })
        })
      } catch (e) {
        console.warn('Invalid filters parameter:', e)
      }
    }
    
    const sortParam = searchParams.get('sort')
    if (sortParam) {
      const [field, direction] = sortParam.split(':')
      if (field && direction) {
        store.setSortConfig({
          field,
          direction: direction as 'asc' | 'desc'
        })
      }
    }
    
    const pageParam = searchParams.get('page')
    if (pageParam) {
      const page = parseInt(pageParam, 10)
      if (!isNaN(page) && page > 0) {
        store.setPagination({ page })
      }
    }
    
    const pageSizeParam = searchParams.get('pageSize')
    if (pageSizeParam) {
      const pageSize = parseInt(pageSizeParam, 10)
      if (!isNaN(pageSize) && pageSize > 0) {
        store.setPagination({ pageSize })
      }
    }
  }, [searchParams, store])
  
  // Initial sync from URL on mount
  useEffect(() => {
    syncFromUrl()
  }, [syncFromUrl])
  
  return { syncToUrl, syncFromUrl }
}

// Hook to get computed filter query for API calls
export const useHeraFilterQuery = () => {
  const store = useHeraFilterStore()
  
  return {
    // Main query parameters
    organization_id: store.organizationId,
    entity_type: store.entityType,
    search: store.searchQuery || undefined,
    
    // Filters converted to API format
    filters: store.activeFilters.length > 0 ? 
      Object.fromEntries(
        store.activeFilters.map(field => {
          const filter = store.filters[field]
          if (!filter || !filter.active) return [field, undefined]
          
          const { value, operator = 'eq' } = filter.value
          
          // Convert to API format based on operator
          switch (operator) {
            case 'eq':
              return [field, value]
            case 'ne':
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
            case 'like':
              return [field, { operator, value }]
            case 'in':
              return [field, Array.isArray(value) ? value : [value]]
            case 'between':
              return [field, { operator, value }]
            default:
              return [field, value]
          }
        }).filter(([, v]) => v !== undefined)
      ) : undefined,
    
    // Sorting
    order_by: {
      field: store.sortConfig.field,
      direction: store.sortConfig.direction.toUpperCase()
    },
    
    // Pagination
    limit: store.pagination.pageSize,
    offset: (store.pagination.page - 1) * store.pagination.pageSize,
    
    // Include related data
    joins: ['dynamic_data'],
    aggregate: true
  }
}