'use client'

import React from 'react'
import { Plus, Filter } from 'lucide-react'
import { useHeraFilterStore, useHeraFilterSync } from '@/hooks/useHeraFilterStore'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { HeraFilterPanel, FilterFieldConfig } from './HeraFilterPanel'
import { HeraEntityTable, TableColumn, TableAction } from './HeraEntityTable'
import { HeraCardGrid, CardField, CardAction } from './HeraCardGrid'

export interface HeraListPageProps {
  entityType: string
  title: string
  subtitle?: string
  icon?: React.ComponentType<any>
  
  // Data configuration
  filters?: FilterFieldConfig[]
  columns?: TableColumn[]
  cardFields?: CardField[]
  
  // Actions
  tableActions?: TableAction[]
  cardActions?: CardAction[]
  createAction?: {
    label: string
    onClick: () => void
  }
  
  // View options
  viewMode?: 'table' | 'cards'
  allowViewToggle?: boolean
  selectable?: boolean
  
  // Customization
  emptyMessage?: string
  emptyIcon?: React.ComponentType<any>
  className?: string
}

export function HeraListPage({
  entityType,
  title,
  subtitle,
  icon: IconComponent,
  filters = [],
  columns = [],
  cardFields = [],
  tableActions = [],
  cardActions = [],
  createAction,
  viewMode: defaultViewMode = 'table',
  allowViewToggle = true,
  selectable = false,
  emptyMessage,
  emptyIcon,
  className = ''
}: HeraListPageProps) {
  const store = useHeraFilterStore()
  const { syncToUrl } = useHeraFilterSync()
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>(defaultViewMode)
  
  // Initialize store
  React.useEffect(() => {
    store.setEntityType(entityType)
  }, [entityType, store])
  
  // Sync filters to URL when they change
  React.useEffect(() => {
    syncToUrl()
  }, [store.lastUpdated, syncToUrl])
  
  // Fetch data using Universal Entity hook
  const { 
    entities, 
    isLoading, 
    error, 
    refetch 
  } = useUniversalEntity({
    entity_type: entityType,
    filters: {
      q: store.searchQuery || undefined,
      status: store.filters.status?.value?.value,
      limit: store.pagination.pageSize,
      offset: (store.pagination.page - 1) * store.pagination.pageSize,
      include_dynamic: true,
      include_relationships: true
    }
  })
  
  // Update pagination total when data changes
  React.useEffect(() => {
    if (entities?.length !== undefined) {
      store.setPagination({ total: entities.length })
    }
  }, [entities, store])
  
  const handleCreateClick = () => {
    if (createAction) {
      createAction.onClick()
    }
  }
  
  const toggleViewMode = () => {
    setViewMode(current => current === 'table' ? 'cards' : 'table')
  }
  
  return (
    <div className={`space-y-6 hera-animate-fade-in ${className}`}>
      {/* Header */}
      <div className=\"hera-card hera-card-elevated\">
        <div className=\"flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4\">
          <div className=\"flex items-center gap-4\">
            {IconComponent && (
              <div className=\"p-3 rounded-xl bg-gradient-to-br from-[var(--hera-primary-start)]/20 to-[var(--hera-primary-end)]/10\">
                <IconComponent className=\"w-7 h-7 text-[var(--hera-primary-start)]\" />
              </div>
            )}
            <div>
              <h1 className=\"text-2xl font-bold text-[var(--hera-text-dark)] hera-font-primary mb-1\">
                {title}
              </h1>
              {subtitle && (
                <p className=\"text-[var(--hera-text-medium)] hera-font-primary\">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className=\"flex items-center gap-3\">
            {/* View Toggle */}
            {allowViewToggle && (
              <div className=\"hera-surface rounded-lg p-1 flex\">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded text-sm hera-font-primary transition-all ${
                    viewMode === 'table' 
                      ? 'bg-[var(--hera-gradient-primary)] text-white shadow-sm' 
                      : 'text-[var(--hera-text-medium)] hover:text-[var(--hera-text-dark)]'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded text-sm hera-font-primary transition-all ${
                    viewMode === 'cards' 
                      ? 'bg-[var(--hera-gradient-primary)] text-white shadow-sm' 
                      : 'text-[var(--hera-text-medium)] hover:text-[var(--hera-text-dark)]'
                  }`}
                >
                  Cards
                </button>
              </div>
            )}
            
            {/* Filters Toggle */}
            {filters.length > 0 && (
              <button
                onClick={() => store.setFilterPanelOpen(!store.isFilterPanelOpen)}
                className=\"hera-btn-surface flex items-center gap-2\"
              >
                <Filter className=\"w-4 h-4\" />
                Filters
                {store.activeFilters.length > 0 && (
                  <span className=\"hera-chip-active text-xs px-2 py-1\">
                    {store.activeFilters.length}
                  </span>
                )}
              </button>
            )}
            
            {/* Create Button */}
            {createAction && (
              <button
                onClick={handleCreateClick}
                className=\"hera-btn-primary flex items-center gap-2\"
              >
                <Plus className=\"w-4 h-4\" />
                {createAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Active Filters Chips */}
      {store.activeFilters.length > 0 && (
        <div className=\"flex flex-wrap items-center gap-2\">
          <span className=\"text-sm text-[var(--hera-text-medium)] hera-font-primary font-medium\">
            Active filters:
          </span>
          {store.activeFilters.map(fieldKey => {
            const filter = store.filters[fieldKey]
            if (!filter) return null
            
            return (
              <button
                key={fieldKey}
                onClick={() => store.removeFilter(fieldKey)}
                className=\"hera-chip-active flex items-center gap-2 hover:opacity-80 transition-opacity\"
              >
                <span>{filter.value.label || filter.value.value}</span>
                <span className=\"text-white/80\">\u00d7</span>
              </button>
            )
          })}
          <button
            onClick={store.clearAllFilters}
            className=\"text-sm text-[var(--hera-text-medium)] hover:text-[var(--hera-error)] transition-colors hera-font-primary\"
          >
            Clear all
          </button>
        </div>
      )}
      
      <div className=\"grid lg:grid-cols-4 gap-6\">
        {/* Filter Panel */}
        {filters.length > 0 && store.isFilterPanelOpen && (
          <div className=\"lg:col-span-1\">
            <HeraFilterPanel
              entityType={entityType}
              fields={filters}
              isOpen={store.isFilterPanelOpen}
              onToggle={store.setFilterPanelOpen}
            />
          </div>
        )}
        
        {/* Main Content */}
        <div className={`${filters.length > 0 && store.isFilterPanelOpen ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {error && (
            <div className=\"hera-card border border-red-200 bg-red-50\">
              <div className=\"text-red-800 hera-font-primary\">
                <strong>Error loading data:</strong> {error}
              </div>
              <button 
                onClick={() => refetch()}
                className=\"hera-btn-surface mt-2 text-red-600 border-red-200\"
              >
                Try Again
              </button>
            </div>
          )}
          
          {!error && viewMode === 'table' && (
            <HeraEntityTable
              data={entities || []}
              columns={columns}
              actions={tableActions}
              loading={isLoading}
              selectable={selectable}
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              emptyMessage={emptyMessage}
              emptyIcon={emptyIcon}
            />
          )}
          
          {!error && viewMode === 'cards' && (
            <HeraCardGrid
              data={entities || []}
              fields={cardFields}
              actions={cardActions}
              loading={isLoading}
              selectable={selectable}
              selectedCards={selectedRows}
              onSelectionChange={setSelectedRows}
              emptyMessage={emptyMessage}
              emptyIcon={emptyIcon}
            />
          )}
        </div>
      </div>
      
      {/* Selection Actions */}
      {selectable && selectedRows.length > 0 && (
        <div className=\"fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50\">
          <div className=\"hera-card hera-card-float px-6 py-4 flex items-center gap-4 min-w-64\">
            <span className=\"text-sm hera-font-primary text-[var(--hera-text-dark)] font-medium\">
              {selectedRows.length} selected
            </span>
            <div className=\"flex items-center gap-2\">
              <button className=\"hera-btn-surface text-sm\">
                Export
              </button>
              <button 
                className=\"hera-btn-surface text-sm text-red-600 border-red-200\"
                onClick={() => {\n                  // Handle bulk delete\n                  setSelectedRows([])\n                }}\n              >\n                Delete\n              </button>\n              <button \n                onClick={() => setSelectedRows([])}\n                className=\"p-2 text-[var(--hera-text-medium)] hover:text-[var(--hera-text-dark)] transition-colors\"\n              >\n                \u00d7\n              </button>\n            </div>\n          </div>\n        </div>\n      )}\n    </div>\n  )\n}"