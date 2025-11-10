'use client'

/**
 * Universal Entity List Shell - Main Container
 * Smart Code: HERA.UNIVERSAL.COMPONENT.ENTITY_LIST_SHELL.v1
 * 
 * Responsive three-panel layout for entity list management with mobile-first design
 * Supports both grid and list views with dynamic filtering and search capabilities
 */

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  Download, 
  Upload,
  Settings,
  MoreVertical,
  ChevronLeft,
  Bell,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface Breadcrumb {
  label: string
  href?: string
}

interface UniversalEntityListShellProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  module: string
  entityType: string
  
  // Panel Content
  filterPanelContent?: React.ReactNode
  listContentComponent: React.ReactNode
  detailPanelContent?: React.ReactNode
  
  // Configuration
  enableSearch?: boolean
  enableFilters?: boolean
  enableExport?: boolean
  enableBatchOperations?: boolean
  showViewToggle?: boolean
  showCreateButton?: boolean
  
  // State & Callbacks
  searchTerm?: string
  onSearchChange?: (term: string) => void
  selectedView?: 'grid' | 'list' | 'mobile'
  onViewChange?: (view: 'grid' | 'list' | 'mobile') => void
  totalCount?: number
  selectedCount?: number
  onCreateNew?: () => void
  onExport?: () => void
  onBatchDelete?: () => void
  
  // Loading states
  loading?: boolean
  lastUpdated?: Date
}

export function UniversalEntityListShell({
  title,
  description,
  breadcrumbs = [],
  module,
  entityType,
  filterPanelContent,
  listContentComponent,
  detailPanelContent,
  enableSearch = true,
  enableFilters = true,
  enableExport = true,
  enableBatchOperations = true,
  showViewToggle = true,
  showCreateButton = true,
  searchTerm = '',
  onSearchChange,
  selectedView = 'list',
  onViewChange,
  totalCount = 0,
  selectedCount = 0,
  onCreateNew,
  onExport,
  onBatchDelete,
  loading = false,
  lastUpdated
}: UniversalEntityListShellProps) {
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [showFilters, setShowFilters] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const searchParams = useSearchParams()

  // Authentication guards
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 mb-2">🔐</div>
          <p className="text-gray-600">Please log in to access entity management</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 mb-2">🏢</div>
          <p className="text-gray-600">No organization context found</p>
        </div>
      </div>
    )
  }

  // Handle view changes
  const handleViewChange = (view: 'grid' | 'list' | 'mobile') => {
    onViewChange?.(view)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button className="min-w-[44px] min-h-[44px] rounded-full bg-slate-100 flex items-center justify-center active:scale-95">
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{title}</h1>
              <p className="text-xs text-slate-600">{module} • {entityType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enableFilters && (
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="min-w-[44px] min-h-[44px] rounded-full bg-blue-100 flex items-center justify-center active:scale-95"
              >
                <Filter className="w-5 h-5 text-blue-600" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="min-w-[44px] min-h-[44px] rounded-full bg-slate-100 flex items-center justify-center active:scale-95">
                  <MoreVertical className="w-5 h-5 text-slate-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {showViewToggle && (
                  <>
                    <DropdownMenuItem onClick={() => handleViewChange('grid')}>
                      <Grid className="w-4 h-4 mr-2" />
                      Grid View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewChange('list')}>
                      <List className="w-4 h-4 mr-2" />
                      List View
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {enableExport && (
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  View Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {enableSearch && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 bg-white/80 border-slate-200/50 focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Mobile Stats Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50">
          <div className="text-sm text-slate-600">
            {totalCount} {title.toLowerCase()}{totalCount !== 1 ? 's' : ''}
            {selectedCount > 0 && ` • ${selectedCount} selected`}
          </div>
          {lastUpdated && (
            <div className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {crumb.href ? (
                        <a href={crumb.href} className="hover:text-slate-800">
                          {crumb.label}
                        </a>
                      ) : (
                        <span className={index === breadcrumbs.length - 1 ? 'text-slate-800 font-medium' : ''}>
                          {crumb.label}
                        </span>
                      )}
                      {index < breadcrumbs.length - 1 && <span className="text-slate-400">→</span>}
                    </React.Fragment>
                  ))}
                </nav>
              )}
              
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                <Badge variant="outline" className="text-xs">
                  {module}
                </Badge>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                )}
              </div>
              
              {description && (
                <p className="text-slate-600 mt-1">{description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {enableSearch && (
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={`Search ${title.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-10 bg-white/70 border-slate-200/50 focus:bg-white focus:border-blue-500"
                  />
                </div>
              )}

              {showViewToggle && (
                <div className="flex items-center bg-white/70 rounded-lg border border-slate-200/50 p-1">
                  <button
                    onClick={() => handleViewChange('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      selectedView === 'grid' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewChange('list')}
                    className={`p-2 rounded-md transition-colors ${
                      selectedView === 'list' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}

              {enableFilters && (
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`bg-white/70 border-slate-200/50 ${showFilters ? 'border-blue-300 bg-blue-50' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              )}

              {enableExport && (
                <Button variant="outline" onClick={onExport} className="bg-white/70 border-slate-200/50">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}

              {showCreateButton && onCreateNew && (
                <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New {entityType}
                </Button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50">
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span>
                {totalCount.toLocaleString()} {title.toLowerCase()}{totalCount !== 1 ? 's' : ''}
              </span>
              {selectedCount > 0 && (
                <span className="text-blue-600 font-medium">
                  {selectedCount} selected
                </span>
              )}
              {lastUpdated && (
                <span>
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            {selectedCount > 0 && enableBatchOperations && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button variant="outline" size="sm" onClick={onBatchDelete}>
                  Delete Selected ({selectedCount})
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left Panel - Filters (Desktop) */}
          {enableFilters && showFilters && (
            <div className="xl:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-white/50 sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="w-5 h-5" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filterPanelContent || (
                    <div className="space-y-4">
                      <div className="text-sm text-slate-600">
                        Filter options will be dynamically generated based on entity configuration.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Center Panel - Entity List */}
          <div className={`${enableFilters && showFilters ? 'xl:col-span-2' : showDetails ? 'xl:col-span-3' : 'xl:col-span-4'}`}>
            {/* Mobile Create Button */}
            {showCreateButton && onCreateNew && (
              <div className="md:hidden mb-4">
                <button
                  onClick={onCreateNew}
                  className="w-full min-h-[56px] bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                  New {entityType}
                </button>
              </div>
            )}

            {/* Mobile Filters */}
            {showFilters && (
              <div className="md:hidden mb-4">
                <Card className="bg-white/80 backdrop-blur-sm border-white/50">
                  <CardContent className="p-4">
                    {filterPanelContent || (
                      <div className="text-sm text-slate-600">
                        Mobile filter options
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Entity List Content */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-white/50 shadow-xl">
              {listContentComponent}
            </div>
          </div>

          {/* Right Panel - Details (Optional) */}
          {showDetails && detailPanelContent && (
            <div className="xl:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-white/50 sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5" />
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detailPanelContent}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-8" />
    </div>
  )
}

// Hook for managing shell state
export function useUniversalEntityListShell() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'mobile'>('list')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setLastUpdated(new Date())
  }

  const handleViewChange = (view: 'grid' | 'list' | 'mobile') => {
    setSelectedView(view)
    // Persist view preference to localStorage
    localStorage.setItem('entity-list-view-preference', view)
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const selectAll = (itemIds: string[]) => {
    setSelectedItems(itemIds)
  }

  // Load view preference on mount
  React.useEffect(() => {
    const savedView = localStorage.getItem('entity-list-view-preference') as 'grid' | 'list' | 'mobile'
    if (savedView) {
      setSelectedView(savedView)
    }
  }, [])

  return {
    searchTerm,
    selectedView,
    selectedItems,
    lastUpdated,
    handleSearchChange,
    handleViewChange,
    toggleItemSelection,
    clearSelection,
    selectAll,
    selectedCount: selectedItems.length
  }
}