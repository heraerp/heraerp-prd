'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Bookmark, X, Grid3x3, List, Settings2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SearchFacetsEnhanced } from './components/SearchFacetsEnhanced'
import { SearchResultsEnhanced } from './components/SearchResultsEnhanced'
import { DetailsDrawer } from './components/DetailsDrawer'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useDebounce } from '@/hooks/useDebounce'
import { useSavedViews } from '@/hooks/useSavedViews'
import '@/styles/jewelry-glassmorphism.css'

// Available entity types for jewelry search
const SEARCHABLE_ENTITIES = [
  { value: 'JEWELRY_ITEM', label: 'Jewelry Items', icon: '💎' },
  { value: 'GRADING_JOB', label: 'Grading Jobs', icon: '⚖️' },
  { value: 'CERTIFICATE', label: 'Certificates', icon: '📜' },
  { value: 'CUSTOMER', label: 'Customers', icon: '👤' },
  { value: 'ORDER', label: 'Orders', icon: '📋' },
] as const

type EntityType = typeof SEARCHABLE_ENTITIES[number]['value']

interface SearchFilters {
  [key: string]: any
}

interface SearchState {
  selectedEntities: EntityType[]
  searchQuery: string
  filters: SearchFilters
  sortBy: string
  sortOrder: 'asc' | 'desc'
  viewMode: 'table' | 'grid'
  selectedEntity: string | null
}

export default function JewelrySearchPage() {
  const router = useRouter()
  const { currentOrganization, user } = useMultiOrgAuth()
  const [orgLoading, setOrgLoading] = useState(true)
  
  // Initialize all state hooks before any conditional returns
  const [searchState, setSearchState] = useState<SearchState>({
    selectedEntities: ['JEWELRY_ITEM'],
    searchQuery: '',
    filters: {},
    sortBy: 'created_at',
    sortOrder: 'desc',
    viewMode: 'table',
    selectedEntity: null,
  })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isFacetsOpen, setIsFacetsOpen] = useState(true)

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchState.searchQuery, 300)

  // Get organization context from localStorage after all hooks
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [jewelryRole, setJewelryRole] = useState<string | null>(null)

  // Saved views management
  const { savedViews, saveView, deleteView, loadView } = useSavedViews(
    'jewelry_search',
    organizationId || undefined
  )

  // Update search state
  const updateSearchState = useCallback((updates: Partial<SearchState>) => {
    setSearchState(prev => ({ ...prev, ...updates }))
  }, [])

  // Handle entity selection
  const handleEntityToggle = useCallback((entityType: EntityType) => {
    setSearchState(prev => ({
      ...prev,
      selectedEntities: prev.selectedEntities.includes(entityType)
        ? prev.selectedEntities.filter(e => e !== entityType)
        : [...prev.selectedEntities, entityType],
      filters: {}, // Reset filters when entities change
    }))
  }, [])

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    updateSearchState({ searchQuery: value })
  }, [updateSearchState])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    updateSearchState({ filters: newFilters })
  }, [updateSearchState])

  // Handle entity detail selection
  const handleOpenDetails = useCallback((entityId: string) => {
    setSearchState(prev => ({ ...prev, selectedEntity: entityId }))
    setIsDrawerOpen(true)
  }, [])

  // Handle drawer close
  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setSearchState(prev => ({ ...prev, selectedEntity: null }))
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    updateSearchState({ 
      searchQuery: '', 
      filters: {},
      selectedEntities: ['JEWELRY_ITEM']
    })
  }, [updateSearchState])

  // Save current view
  const handleSaveView = useCallback(async () => {
    const viewName = prompt('Enter a name for this search view:')
    if (viewName) {
      await saveView(viewName, {
        selectedEntities: searchState.selectedEntities,
        filters: searchState.filters,
        sortBy: searchState.sortBy,
        sortOrder: searchState.sortOrder,
      })
    }
  }, [searchState, saveView])

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return Object.keys(searchState.filters).length + 
           (searchState.searchQuery ? 1 : 0) +
           (searchState.selectedEntities.length > 1 ? 1 : 0)
  }, [searchState.filters, searchState.searchQuery, searchState.selectedEntities])

  // Check for jewelry organization context
  useEffect(() => {
    const timer = setTimeout(() => {
      const orgId = localStorage.getItem('organizationId')
      const role = localStorage.getItem('jewelryRole')
      
      if (!orgId || !role) {
        router.push('/jewelry/demo')
        return
      }
      
      setOrganizationId(orgId)
      setJewelryRole(role)
      setOrgLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  // Show loading while checking auth
  if (orgLoading) {
    return (
      <div className="min-h-screen jewelry-gradient-bg flex items-center justify-center">
        <div className="jewelry-glass-card p-6">
          <Search className="h-12 w-12 jewelry-text-gold animate-pulse" />
        </div>
      </div>
    )
  }

  if (!organizationId || !jewelryRole) {
    return (
      <div className="min-h-screen jewelry-gradient-bg flex items-center justify-center">
        <Card className="jewelry-glass-card p-8 text-center">
          <p className="jewelry-text-gold mb-4">Please select an organization to continue</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Left Panel - Facets */}
        <div className={`transition-all duration-300 ${isFacetsOpen ? 'w-96' : 'w-0'} overflow-hidden`}>
          <div className="h-full border-r border-yellow-500/30">
            <SearchFacetsEnhanced
              selectedEntities={searchState.selectedEntities}
              filters={searchState.filters}
              onFiltersChange={handleFiltersChange}
              organizationId={organizationId}
              userRole={jewelryRole || 'staff'}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-yellow-500/30 bg-gray-900/50 backdrop-blur-xl">
            <div className="p-6">
              {/* Title */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 text-transparent bg-clip-text">
                    Global Search
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Universal search across jewelry entities
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
                    <Button
                      variant={searchState.viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => updateSearchState({ viewMode: 'table' })}
                      className="px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={searchState.viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => updateSearchState({ viewMode: 'grid' })}
                      className="px-3"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Facets Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFacetsOpen(!isFacetsOpen)}
                    className="border-yellow-500/50 text-yellow-400"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-2 bg-yellow-500 text-gray-900">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Search Controls */}
              <div className="space-y-4">
                {/* Entity Selection */}
                <div className="flex flex-wrap gap-2">
                  {SEARCHABLE_ENTITIES.map((entity) => (
                    <Button
                      key={entity.value}
                      variant={searchState.selectedEntities.includes(entity.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleEntityToggle(entity.value)}
                      className={
                        searchState.selectedEntities.includes(entity.value)
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'border-gray-600 text-gray-400 hover:border-yellow-500/50'
                      }
                    >
                      <span className="mr-2">{entity.icon}</span>
                      {entity.label}
                    </Button>
                  ))}
                </div>

                {/* Search Input & Controls */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search across selected entities..."
                      value={searchState.searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-gray-600 text-gray-100 placeholder-gray-400"
                    />
                  </div>

                  {/* Saved Views */}
                  <Select onValueChange={loadView}>
                    <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600">
                      <SelectValue placeholder="Saved Views" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedViews.map((view) => (
                        <SelectItem key={view.id} value={view.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{view.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteView(view.id)
                              }}
                              className="h-4 w-4 p-0 ml-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={handleSaveView}
                    className="border-yellow-500/50 text-yellow-400"
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save View
                  </Button>

                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="border-red-500/50 text-red-400"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden">
            <SearchResultsEnhanced
              selectedEntities={searchState.selectedEntities}
              searchQuery={debouncedSearchQuery}
              filters={searchState.filters}
              sortBy={searchState.sortBy}
              sortOrder={searchState.sortOrder}
              viewMode={searchState.viewMode}
              organizationId={organizationId}
              userRole={jewelryRole || 'staff'}
              onOpenDetails={handleOpenDetails}
              onSortChange={(field, order) => 
                updateSearchState({ sortBy: field, sortOrder: order })
              }
            />
          </div>
        </div>

        {/* Details Drawer */}
        <DetailsDrawer
          isOpen={isDrawerOpen}
          entityId={searchState.selectedEntity}
          onClose={handleCloseDrawer}
          organizationId={organizationId}
          userRole={jewelryRole || 'staff'}
        />
      </div>
    </div>
  )
}