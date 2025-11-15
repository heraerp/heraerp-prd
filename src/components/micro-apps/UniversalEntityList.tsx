/**
 * Universal Entity List (Next)
 * Smart Code: HERA.MICRO_APPS.UNIVERSAL.ENTITY_LIST.v1
 * 
 * Most advanced glassmorphism SAP Fiori style entity list component
 * Features: search, edit modal, destruction warning, enterprise animations
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, type ReactElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  Settings,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

// HERA Components
import { ListReport } from '@/components/ui-kit/floorplans/list-report'
import { DataGrid } from '@/components/ui-kit/data-grid'
import { GlassCard, LoadingSkeleton, EmptyState } from '@/components/ui-kit/primitives'

// Services and Types
import { EntityListService, type EntityListQuery, type EntityListResponse } from '@/lib/micro-apps/EntityListService'
import { UniversalEntityListRegistry, type EntityListConfig, type WorkspaceEntityContext } from '@/lib/micro-apps/UniversalEntityListRegistry'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Utilities
import { cn } from '@/lib/utils'
import { fadeSlide, staggerChildren } from '@/components/ui-kit/design-tokens'

// Enhanced interfaces for the component
interface UniversalEntityListProps {
  entityType?: string
  workspaceContext: WorkspaceEntityContext
  onEntitySelect?: (entity: any) => void
  onEntityEdit?: (entity: any) => void
  onEntityDelete?: (entity: any) => void
  onEntityCreate?: () => void
  className?: string
  viewMode?: 'table' | 'card' | 'grid'
  showSearch?: boolean
  showFilters?: boolean
  showActions?: boolean
  showSelection?: boolean
  showExport?: boolean
  enableRealTimeUpdates?: boolean
  customActions?: Array<{
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    handler: (entity: any) => void
  }>
}

interface ListFilters {
  searchTerm: string
  statusFilter: string
  categoryFilter: string
  dateFilter: string
  customFilters: Record<string, any>
}

interface ListSettings {
  viewMode: 'table' | 'card' | 'grid'
  pageSize: number
  sortField: string
  sortOrder: 'asc' | 'desc'
  columnsVisible: string[]
  autoRefresh: boolean
  refreshInterval: number
}

/**
 * Universal Entity List - Advanced glassmorphism SAP Fiori component
 */
export function UniversalEntityList({
  entityType,
  workspaceContext,
  onEntitySelect,
  onEntityEdit,
  onEntityDelete,
  onEntityCreate,
  className = '',
  viewMode: defaultViewMode = 'table',
  showSearch = true,
  showFilters = true,
  showActions = true,
  showSelection = false,
  showExport = true,
  enableRealTimeUpdates = false,
  customActions = []
}: UniversalEntityListProps) {
  
  // Auth context
  const { user, organization, isAuthenticated } = useHERAAuth()

  // State management
  const [config, setConfig] = useState<EntityListConfig | null>(null)
  const [service, setService] = useState<EntityListService | null>(null)
  const [entities, setEntities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  
  // Filters and search
  const [filters, setFilters] = useState<ListFilters>({
    searchTerm: '',
    statusFilter: '',
    categoryFilter: '',
    dateFilter: '',
    customFilters: {}
  })

  // List settings and preferences
  const [settings, setSettings] = useState<ListSettings>({
    viewMode: defaultViewMode,
    pageSize: 25,
    sortField: 'entity_name',
    sortOrder: 'asc',
    columnsVisible: [],
    autoRefresh: false,
    refreshInterval: 30000
  })

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  /**
   * Initialize entity list configuration
   */
  useEffect(() => {
    if (!organization?.id || !isAuthenticated) return

    const initializeConfig = async () => {
      try {
        setLoading(true)
        console.log('🎯 Initializing Universal Entity List:', { entityType, workspaceContext })

        let listConfig: EntityListConfig | null = null

        if (entityType) {
          // Get config for specific entity type
          listConfig = await UniversalEntityListRegistry.getEntityConfigByType(entityType, {
            ...workspaceContext,
            organization_id: organization.id
          })
        } else {
          // Get first available config
          const { configs } = await UniversalEntityListRegistry.getAvailableEntityListConfigs({
            ...workspaceContext,
            organization_id: organization.id
          })
          listConfig = configs[0] || null
        }

        if (!listConfig) {
          throw new Error('No entity configuration found for workspace')
        }

        setConfig(listConfig)

        // Initialize service
        const entityService = new EntityListService(listConfig)
        setService(entityService)

        // Set initial visible columns
        setSettings(prev => ({
          ...prev,
          columnsVisible: listConfig!.displayConfig.tableViewFields,
          sortField: listConfig!.defaultSort.field,
          sortOrder: listConfig!.defaultSort.order
        }))

        console.log('✅ Entity list configuration initialized:', listConfig.entityLabel)

      } catch (error) {
        console.error('❌ Error initializing entity list:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize entity list')
      } finally {
        setLoading(false)
      }
    }

    initializeConfig()
  }, [entityType, workspaceContext, organization?.id, isAuthenticated])

  /**
   * Fetch entities with current filters and settings
   */
  const fetchEntities = useCallback(async () => {
    if (!service || !organization?.id || !config) return

    try {
      console.log('🔍 Fetching entities with filters:', filters)

      const query: EntityListQuery = {
        entityType: config.entityType,
        organizationId: organization.id,
        searchTerm: filters.searchTerm.trim() || undefined,
        filters: {
          ...filters.customFilters,
          ...(filters.statusFilter && { status: filters.statusFilter }),
          ...(filters.categoryFilter && { category: filters.categoryFilter })
        },
        sortField: settings.sortField,
        sortOrder: settings.sortOrder,
        page: pagination.page,
        limit: settings.pageSize
      }

      const response: EntityListResponse = await service.fetchEntities(query)

      setEntities(response.entities)
      setPagination({
        page: response.page,
        total: response.total,
        hasNextPage: response.hasNextPage,
        hasPreviousPage: response.hasPreviousPage
      })

      setLastRefresh(new Date())
      console.log(`✅ Fetched ${response.entities.length} entities`)

    } catch (error) {
      console.error('❌ Error fetching entities:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch entities')
    }
  }, [service, organization?.id, config, filters, settings, pagination.page])

  /**
   * Debounced search effect
   */
  useEffect(() => {
    if (!service) return

    const timeoutId = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        fetchEntities()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters.searchTerm, service, fetchEntities])

  /**
   * Fetch entities when filters or settings change
   */
  useEffect(() => {
    fetchEntities()
  }, [filters.statusFilter, filters.categoryFilter, settings.sortField, settings.sortOrder, settings.pageSize, pagination.page, fetchEntities])

  /**
   * Auto-refresh functionality
   */
  useEffect(() => {
    if (!settings.autoRefresh || !service) return

    const intervalId = setInterval(() => {
      setIsRefreshing(true)
      fetchEntities().finally(() => setIsRefreshing(false))
    }, settings.refreshInterval)

    return () => clearInterval(intervalId)
  }, [settings.autoRefresh, settings.refreshInterval, fetchEntities])

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }))
  }, [])

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }, [])

  /**
   * Handle sort changes
   */
  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSettings(prev => ({
      ...prev,
      sortField: field,
      sortOrder: order
    }))
  }, [])

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchEntities()
    setIsRefreshing(false)
  }, [fetchEntities])

  /**
   * Handle entity actions
   */
  const handleEntityView = useCallback((entity: any) => {
    console.log('👁️ View entity:', entity.id)
    onEntitySelect?.(entity)
  }, [onEntitySelect])

  const handleEntityEdit = useCallback((entity: any) => {
    console.log('✏️ Edit entity:', entity.id)
    onEntityEdit?.(entity)
  }, [onEntityEdit])

  const handleEntityDelete = useCallback((entity: any) => {
    console.log('🗑️ Delete entity:', entity.id)
    onEntityDelete?.(entity)
  }, [onEntityDelete])

  /**
   * Handle selection changes
   */
  const handleSelectionChange = useCallback((entityIds: string[]) => {
    setSelectedEntities(entityIds)
  }, [])

  /**
   * Memoized columns with actions
   */
  const columns = useMemo(() => {
    if (!config) return []

    const baseColumns = config.columns.filter(column => 
      settings.columnsVisible.includes(column.accessorKey as string)
    )

    // Add actions column if actions are enabled
    if (showActions) {
      const actionsColumn = {
        id: 'actions',
        header: '',
        cell: ({ row }: any) => {
          return React.createElement('div', {
            className: 'flex items-center gap-1'
          }, [
            React.createElement(Button, {
              key: 'view',
              variant: 'ghost',
              size: 'sm',
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation()
                handleEntityView(row.original)
              },
              className: 'h-8 w-8 p-0 hover:bg-white/20 transition-colors'
            }, React.createElement(Eye, { className: 'w-4 h-4' })),
            React.createElement(Button, {
              key: 'edit',
              variant: 'ghost',
              size: 'sm',
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation()
                handleEntityEdit(row.original)
              },
              className: 'h-8 w-8 p-0 hover:bg-blue-500/20 transition-colors'
            }, React.createElement(Edit, { className: 'w-4 h-4 text-blue-600' })),
            React.createElement(Button, {
              key: 'delete',
              variant: 'ghost',
              size: 'sm',
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation()
                handleEntityDelete(row.original)
              },
              className: 'h-8 w-8 p-0 hover:bg-red-500/20 transition-colors'
            }, React.createElement(Trash2, { className: 'w-4 h-4 text-red-600' })),
            ...customActions.map(action => 
              React.createElement(Button, {
                key: action.id,
                variant: 'ghost',
                size: 'sm',
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation()
                  action.handler(row.original)
                },
                className: 'h-8 w-8 p-0 hover:bg-purple-500/20 transition-colors'
              }, React.createElement(action.icon, { className: 'w-4 h-4 text-purple-600' }))
            )
          ])
        },
        enableSorting: false,
        enableHiding: false
      }

      return [...baseColumns, actionsColumn]
    }

    return baseColumns
  }, [config, settings.columnsVisible, showActions, customActions, handleEntityView, handleEntityEdit, handleEntityDelete])

  // Show loading state
  if (loading) {
    return (
      <GlassCard className={cn("p-8", className)}>
        <motion.div className="space-y-6" {...staggerChildren}>
          <motion.div {...fadeSlide(0.1)}>
            <LoadingSkeleton className="h-12 w-64" />
            <LoadingSkeleton className="h-4 w-96 mt-2" />
          </motion.div>
          <motion.div {...fadeSlide(0.2)}>
            <div className="flex gap-4 mb-6">
              <LoadingSkeleton className="h-10 w-80" />
              <LoadingSkeleton className="h-10 w-32" />
              <LoadingSkeleton className="h-10 w-32" />
            </div>
          </motion.div>
          <motion.div {...fadeSlide(0.3)}>
            <LoadingSkeleton lines={8} className="h-16" />
          </motion.div>
        </motion.div>
      </GlassCard>
    )
  }

  // Show error state
  if (error) {
    return (
      <GlassCard className={cn("p-8", className)}>
        <motion.div {...fadeSlide()}>
          <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error loading entities:</strong> {error}
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex gap-3">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </motion.div>
      </GlassCard>
    )
  }

  if (!config) {
    return null
  }

  return (
    <motion.div 
      className={cn("space-y-6", className)}
      {...staggerChildren}
    >
      {/* Header Section */}
      <motion.div {...fadeSlide(0.1)}>
        <GlassCard className="p-6 border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {config.entityLabelPlural}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage {config.entityLabelPlural.toLowerCase()} for {workspaceContext.domain} › {workspaceContext.section}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-50/80 text-blue-700 border-blue-200/50">
                <Users className="w-3 h-3 mr-1" />
                {pagination.total} {pagination.total === 1 ? 'item' : 'items'}
              </Badge>
              {lastRefresh && (
                <div className="text-xs text-slate-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Toolbar Section */}
      <motion.div {...fadeSlide(0.2)}>
        <GlassCard className="p-4 border-white/30">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                {showSearch && (
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={`Search ${config.entityLabelPlural.toLowerCase()}...`}
                      value={filters.searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9 bg-white/50 border-white/30 backdrop-blur-sm focus:bg-white/70 transition-colors"
                    />
                  </div>
                )}

                {/* Quick Filters */}
                {showFilters && config.filterableFields.length > 0 && (
                  <div className="flex gap-2">
                    {config.filterableFields.slice(0, 2).map(filter => (
                      <Select
                        key={filter.field}
                        value={filters.customFilters[filter.field] || '__all__'}
                        onValueChange={(value) => handleFilterChange('customFilters', {
                          ...filters.customFilters,
                          [filter.field]: value === '__all__' ? undefined : value || undefined
                        })}
                      >
                        <SelectTrigger className="w-[180px] bg-white/50 border-white/30 backdrop-blur-sm">
                          <SelectValue placeholder={filter.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All {filter.label}</SelectItem>
                          {filter.options?.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                    
                    {config.filterableFields.length > 2 && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="bg-white/50 border-white/30 backdrop-blur-sm hover:bg-white/70 transition-colors"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        More Filters
                        <ChevronDown className={cn(
                          "w-4 h-4 ml-2 transition-transform",
                          showAdvancedFilters && "rotate-180"
                        )} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {selectedEntities.length > 0 && (
                <Badge variant="secondary" className="bg-blue-50/80 text-blue-700 border-blue-200/50">
                  {selectedEntities.length} selected
                </Badge>
              )}

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white/50 border-white/30 backdrop-blur-sm hover:bg-white/70 transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>

              {showExport && (
                <Button
                  variant="outline"
                  className="bg-white/50 border-white/30 backdrop-blur-sm hover:bg-white/70 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}

              {onEntityCreate && (
                <Button 
                  onClick={onEntityCreate}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create {config.entityLabel}
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {config.filterableFields.slice(2).map(filter => (
                    <div key={filter.field}>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {filter.label}
                      </label>
                      <Select
                        value={filters.customFilters[filter.field] || '__all__'}
                        onValueChange={(value) => handleFilterChange('customFilters', {
                          ...filters.customFilters,
                          [filter.field]: value === '__all__' ? undefined : value || undefined
                        })}
                      >
                        <SelectTrigger className="bg-white/50 border-white/30 backdrop-blur-sm">
                          <SelectValue placeholder={filter.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All</SelectItem>
                          {filter.options?.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* Data Grid Section */}
      <motion.div {...fadeSlide(0.3)}>
        <DataGrid
          data={entities}
          columns={columns}
          loading={false}
          error={undefined}
          onRowClick={handleEntityView}
          searchable={false}
          selectable={showSelection}
          exportable={false}
          pagination={true}
          pageSize={settings.pageSize}
          emptyState={{
            icon: <Search className="w-8 h-8 text-slate-400" />,
            title: `No ${config.entityLabelPlural.toLowerCase()} found`,
            description: filters.searchTerm 
              ? `No results found for "${filters.searchTerm}". Try adjusting your search or filters.`
              : `Get started by creating your first ${config.entityLabel.toLowerCase()}.`,
            action: onEntityCreate ? (
              <Button onClick={onEntityCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create {config.entityLabel}
              </Button>
            ) : undefined
          }}
          className="border-white/30 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40"
        />
      </motion.div>

      {/* Status Bar */}
      <motion.div {...fadeSlide(0.4)}>
        <GlassCard className="px-4 py-2 border-white/30">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                Showing {entities.length} of {pagination.total} {config.entityLabelPlural.toLowerCase()}
              </span>
              {filters.searchTerm && (
                <Badge variant="outline" className="bg-white/50">
                  Search: "{filters.searchTerm}"
                </Badge>
              )}
              {Object.values(filters.customFilters).some(v => v) && (
                <Badge variant="outline" className="bg-white/50">
                  {Object.values(filters.customFilters).filter(v => v).length} filter(s) active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Connected</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

export default UniversalEntityList