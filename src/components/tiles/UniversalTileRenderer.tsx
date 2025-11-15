/**
 * HERA Universal Tile System - Universal Tile Renderer
 * Complete workspace tile orchestrator with responsive grid layouts
 * Smart Code: HERA.PLATFORM.UI.COMPONENT.UNIVERSAL_TILE_RENDERER.v1
 */

'use client'

import React, { Suspense, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useResolvedTiles } from '@/lib/tiles/use-resolved-tiles'
import { DynamicTile } from './DynamicTile'
import { TileStatsDisplay } from './TileStatsDisplay'
import { TileActionsMenu } from './TileActionsMenu'
import { ResolvedTileConfig } from '@/lib/tiles/resolved-tile-config'
import { useTileTelemetry } from '@/lib/tiles/tile-telemetry'
import { useGlassEffect, GlassConfig } from '@/lib/dna/design-system/glass-effects-2.0'
import { fadeSlide } from '@/components/ui-kit/design-tokens'
import { 
  Grid, LayoutGrid, List, Filter, Search, Plus, Settings,
  Loader2, AlertTriangle, RefreshCw, Eye, EyeOff
} from 'lucide-react'

// ================================================================================
// TYPES
// ================================================================================

export interface UniversalTileRendererProps {
  workspaceId: string
  organizationId: string
  actorUserId: string
  
  // Layout options
  className?: string
  layout?: 'grid' | 'masonry' | 'list' | 'auto'
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  maxHeight?: string
  
  // Display options
  showHeader?: boolean
  showControls?: boolean
  showSearch?: boolean
  showFilter?: boolean
  enableDragDrop?: boolean
  
  // Behavior
  autoRefresh?: boolean
  refreshInterval?: number
  virtualized?: boolean
  
  // Event handlers
  onTileClick?: (tile: ResolvedTileConfig) => void
  onTileActionExecute?: (tileId: string, actionId: string, result: any) => void
  onLayoutChange?: (layout: string) => void
  onTileReorder?: (tiles: ResolvedTileConfig[]) => void
}

interface TileFilter {
  tileType?: string[]
  operationCategory?: string[]
  hasActions?: boolean
  hasStats?: boolean
  isActive?: boolean
  searchQuery?: string
}

interface LayoutConfig {
  className: string
  itemClassName: string
  containerClassName: string
  responsive: boolean
}

// ================================================================================
// LAYOUT CONFIGURATIONS
// ================================================================================

const LAYOUT_CONFIGS: Record<string, LayoutConfig> = {
  grid: {
    className: 'grid auto-rows-min',
    itemClassName: '',
    containerClassName: 'space-y-0',
    responsive: true
  },
  masonry: {
    className: 'columns-1 md:columns-2 lg:columns-3 xl:columns-4',
    itemClassName: 'break-inside-avoid mb-4',
    containerClassName: 'space-y-0',
    responsive: true
  },
  list: {
    className: 'flex flex-col',
    itemClassName: 'w-full',
    containerClassName: 'space-y-4',
    responsive: false
  },
  auto: {
    className: 'grid auto-rows-min',
    itemClassName: '',
    containerClassName: 'space-y-0',
    responsive: true
  }
}

const GAP_CLASSES = {
  sm: 'gap-2',
  md: 'gap-4', 
  lg: 'gap-6'
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function UniversalTileRenderer({
  workspaceId,
  organizationId,
  actorUserId,
  className,
  layout = 'auto',
  columns,
  gap = 'md',
  maxHeight,
  showHeader = true,
  showControls = true,
  showSearch = true,
  showFilter = true,
  enableDragDrop = false,
  autoRefresh = true,
  refreshInterval = 60000,
  virtualized = false,
  onTileClick,
  onTileActionExecute,
  onLayoutChange,
  onTileReorder
}: UniversalTileRendererProps) {

  // State management
  const [currentLayout, setCurrentLayout] = useState(layout)
  const [filter, setFilter] = useState<TileFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [hiddenTiles, setHiddenTiles] = useState<Set<string>>(new Set())
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set())

  // Data fetching
  const { 
    tiles, 
    isLoading, 
    isError, 
    error, 
    refresh, 
    isRefreshing 
  } = useResolvedTiles({
    workspaceId,
    organizationId,
    refetchInterval: autoRefresh ? refreshInterval : undefined
  })

  // Telemetry
  const { trackAction, trackError } = useTileTelemetry({
    tileId: `workspace-${workspaceId}`,
    organizationId,
    actorUserId,
    workspaceId
  })

  // Filter and search tiles
  const filteredTiles = useMemo(() => {
    let result = tiles.filter(tile => !hiddenTiles.has(tile.tileId))
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(tile => 
        tile.ui.title.toLowerCase().includes(query) ||
        tile.ui.subtitle?.toLowerCase().includes(query) ||
        tile.tileType.toLowerCase().includes(query) ||
        tile.operationCategory.toLowerCase().includes(query)
      )
    }
    
    // Apply filters
    if (filter.tileType?.length) {
      result = result.filter(tile => filter.tileType!.includes(tile.tileType))
    }
    
    if (filter.operationCategory?.length) {
      result = result.filter(tile => filter.operationCategory!.includes(tile.operationCategory))
    }
    
    if (filter.hasActions !== undefined) {
      result = result.filter(tile => (tile.actions.length > 0) === filter.hasActions)
    }
    
    if (filter.hasStats !== undefined) {
      result = result.filter(tile => (tile.stats.length > 0) === filter.hasStats)
    }
    
    if (filter.isActive !== undefined) {
      result = result.filter(tile => tile.enabled === filter.isActive)
    }
    
    // Sort by position, then by creation
    return result.sort((a, b) => {
      if (a.layout.position !== b.layout.position) {
        return (a.layout.position || 999) - (b.layout.position || 999)
      }
      return a.ui.title.localeCompare(b.ui.title)
    })
  }, [tiles, hiddenTiles, searchQuery, filter])

  // Layout configuration
  const layoutConfig = LAYOUT_CONFIGS[currentLayout] || LAYOUT_CONFIGS.auto
  const gapClass = GAP_CLASSES[gap]

  // Grid columns for responsive layouts
  const gridColumns = useMemo(() => {
    if (!layoutConfig.responsive || currentLayout === 'list') return ''
    
    if (columns) {
      return `grid-cols-${columns}`
    }
    
    // Auto-responsive columns based on content
    const tileCount = filteredTiles.length
    if (tileCount <= 2) return 'grid-cols-1 md:grid-cols-2'
    if (tileCount <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    if (tileCount <= 8) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
  }, [currentLayout, columns, filteredTiles.length, layoutConfig.responsive])

  // Event handlers
  const handleLayoutChange = (newLayout: string) => {
    setCurrentLayout(newLayout)
    onLayoutChange?.(newLayout)
    
    trackAction({
      tileId: `workspace-${workspaceId}`,
      actionId: 'layout_change',
      organizationId,
      actorUserId,
      executionTime: 0,
      status: 'success',
      parameters: { newLayout, oldLayout: currentLayout }
    })
  }

  const handleTileClick = (tile: ResolvedTileConfig) => {
    trackAction({
      tileId: tile.tileId,
      actionId: 'tile_click_from_workspace',
      organizationId,
      actorUserId,
      executionTime: 0,
      status: 'success',
      parameters: { workspaceId, tileType: tile.tileType }
    })
    
    onTileClick?.(tile)
  }

  const handleTileActionExecute = (tileId: string, actionId: string, result: any) => {
    trackAction({
      tileId,
      actionId: `workspace_delegated_${actionId}`,
      organizationId,
      actorUserId,
      executionTime: 0,
      status: 'success',
      parameters: { workspaceId, originalActionId: actionId }
    })
    
    onTileActionExecute?.(tileId, actionId, result)
  }

  const handleTileToggleVisibility = (tileId: string) => {
    setHiddenTiles(prev => {
      const newHidden = new Set(prev)
      if (newHidden.has(tileId)) {
        newHidden.delete(tileId)
      } else {
        newHidden.add(tileId)
      }
      return newHidden
    })
  }

  const handleRefresh = async () => {
    try {
      await refresh()
      trackAction({
        tileId: `workspace-${workspaceId}`,
        actionId: 'workspace_refresh',
        organizationId,
        actorUserId,
        executionTime: 0,
        status: 'success',
        parameters: { tileCount: tiles.length }
      })
    } catch (error) {
      trackError({
        tileId: `workspace-${workspaceId}`,
        organizationId,
        actorUserId,
        error: error as Error,
        context: { action: 'workspace_refresh' }
      })
    }
  }

  // Loading state
  if (isLoading) {
    return <UniversalTileRendererSkeleton layout={currentLayout} />
  }

  // Error state
  if (isError) {
    return <UniversalTileRendererError error={error} onRetry={handleRefresh} />
  }

  return (
    <div className={cn('w-full h-full', className)}>
      {/* Header */}
      {showHeader && (
        <WorkspaceHeader
          workspaceId={workspaceId}
          tileCount={filteredTiles.length}
          totalTileCount={tiles.length}
          hiddenCount={hiddenTiles.size}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Controls */}
      {showControls && (
        <WorkspaceControls
          layout={currentLayout}
          onLayoutChange={handleLayoutChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filter={filter}
          onFilterChange={setFilter}
          showSearch={showSearch}
          showFilter={showFilter}
          tiles={tiles}
          selectedTiles={selectedTiles}
          onSelectedTilesChange={setSelectedTiles}
        />
      )}

      {/* Tiles Container */}
      <div 
        className={cn(
          'w-full overflow-auto',
          layoutConfig.containerClassName,
          {
            [`h-[${maxHeight}]`]: maxHeight,
            'h-full': !maxHeight
          }
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <div className={cn(
          layoutConfig.className,
          gapClass,
          gridColumns
        )}>
          {filteredTiles.map((tile, index) => (
            <div
              key={tile.tileId}
              className={cn(
                layoutConfig.itemClassName,
                'relative group'
              )}
            >
              {/* Tile Visibility Toggle */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTileToggleVisibility(tile.tileId)
                  }}
                  className="p-1 bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700"
                  title={hiddenTiles.has(tile.tileId) ? 'Show tile' : 'Hide tile'}
                >
                  {hiddenTiles.has(tile.tileId) ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Dynamic Tile */}
              <Suspense fallback={<TileSkeleton />}>
                <DynamicTile
                  tile={tile}
                  organizationId={organizationId}
                  actorUserId={actorUserId}
                  workspacePath={`/workspaces/${workspaceId}`}
                  size={tile.layout.size}
                  onClick={() => handleTileClick(tile)}
                  onActionExecute={(actionId, result) => 
                    handleTileActionExecute(tile.tileId, actionId, result)
                  }
                />
              </Suspense>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTiles.length === 0 && (
          <WorkspaceEmptyState
            hasSearch={!!searchQuery}
            hasFilter={Object.keys(filter).length > 0}
            onClearSearch={() => setSearchQuery('')}
            onClearFilter={() => setFilter({})}
          />
        )}
      </div>
    </div>
  )
}

// ================================================================================
// HEADER COMPONENT
// ================================================================================

interface WorkspaceHeaderProps {
  workspaceId: string
  tileCount: number
  totalTileCount: number
  hiddenCount: number
  isRefreshing: boolean
  onRefresh: () => void
}

function WorkspaceHeader({
  workspaceId,
  tileCount,
  totalTileCount,
  hiddenCount,
  isRefreshing,
  onRefresh
}: WorkspaceHeaderProps) {
  // Glass effect configuration for header
  const headerGlassConfig: GlassConfig = {
    intensity: 'medium',
    variant: 'default',
    enableShine: false,
    enableDepth: true
  }
  
  const { styles: headerGlassStyles, className: headerGlassClassName } = useGlassEffect(headerGlassConfig)

  return (
    <motion.div 
      className={cn(
        "flex items-center justify-between p-6 border-b border-white/20 backdrop-blur-xl",
        headerGlassClassName
      )}
      style={headerGlassStyles}
      variants={fadeSlide()}
      initial="initial"
      animate="animate"
    >
      {/* Enhanced glass background */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] via-transparent to-white/[0.05] pointer-events-none" />
      
      <div className="relative z-10">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 drop-shadow-sm">
          Workspace Dashboard
        </h2>
        <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">{tileCount} visible tiles</span>
          {hiddenCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {hiddenCount} hidden
            </span>
          )}
          <span className="text-slate-400">•</span>
          <span className="font-medium">{totalTileCount} total</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 relative z-10">
        <motion.button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 disabled:opacity-50 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 hover:border-white/30 transition-all duration-200 shadow-lg hover:shadow-xl"
          title="Refresh workspace"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className={cn("w-5 h-5", { "animate-spin": isRefreshing })} />
        </motion.button>
        
        <motion.button 
          className="p-2.5 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 hover:border-white/30 transition-all duration-200 shadow-lg hover:shadow-xl"
          title="Workspace settings"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ================================================================================
// CONTROLS COMPONENT
// ================================================================================

interface WorkspaceControlsProps {
  layout: string
  onLayoutChange: (layout: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  filter: TileFilter
  onFilterChange: (filter: TileFilter) => void
  showSearch: boolean
  showFilter: boolean
  tiles: ResolvedTileConfig[]
  selectedTiles: Set<string>
  onSelectedTilesChange: (selected: Set<string>) => void
}

function WorkspaceControls({
  layout,
  onLayoutChange,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  showSearch,
  showFilter,
  tiles
}: WorkspaceControlsProps) {
  // Glass effect configuration for controls
  const controlsGlassConfig: GlassConfig = {
    intensity: 'medium',
    variant: 'default',
    enableShine: false,
    enableDepth: false
  }
  
  const { styles: controlsGlassStyles, className: controlsGlassClassName } = useGlassEffect(controlsGlassConfig)

  return (
    <motion.div 
      className={cn(
        "flex flex-wrap items-center gap-4 p-6 border-b border-white/10 backdrop-blur-lg",
        controlsGlassClassName
      )}
      style={controlsGlassStyles}
      variants={fadeSlide(0.1)}
      initial="initial"
      animate="animate"
    >
      {/* Enhanced glass background */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.03] pointer-events-none" />
      
      {/* Layout Switcher with glass effect */}
      <div className="flex bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-1 shadow-lg relative z-10">
        {[
          { id: 'auto', icon: LayoutGrid, label: 'Auto' },
          { id: 'grid', icon: Grid, label: 'Grid' },
          { id: 'list', icon: List, label: 'List' }
        ].map(({ id, icon: Icon, label }) => (
          <motion.button
            key={id}
            onClick={() => onLayoutChange(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              {
                'bg-blue-500 text-white shadow-lg': layout === id,
                'text-slate-700 dark:text-slate-200 hover:bg-white/20': layout !== id,
              }
            )}
            title={`${label} layout`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Search with glass effect */}
      {showSearch && (
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tiles..."
            className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:bg-white/15 transition-all duration-200 shadow-lg"
          />
        </div>
      )}

      {/* Filter */}
      {showFilter && (
        <WorkspaceFilter
          filter={filter}
          onFilterChange={onFilterChange}
          tiles={tiles}
        />
      )}
    </motion.div>
  )
}

// ================================================================================
// FILTER COMPONENT
// ================================================================================

interface WorkspaceFilterProps {
  filter: TileFilter
  onFilterChange: (filter: TileFilter) => void
  tiles: ResolvedTileConfig[]
}

function WorkspaceFilter({ filter, onFilterChange, tiles }: WorkspaceFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const uniqueTileTypes = Array.from(new Set(tiles.map(t => t.tileType)))
  const uniqueCategories = Array.from(new Set(tiles.map(t => t.operationCategory)))
  
  const activeFilterCount = Object.keys(filter).length
  
  // Glass effect configuration for filter dropdown
  const filterGlassConfig: GlassConfig = {
    intensity: 'strong',
    variant: 'default',
    enableShine: false,
    enableDepth: true
  }
  
  const { styles: filterGlassStyles, className: filterGlassClassName } = useGlassEffect(filterGlassConfig)
  
  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 text-sm border border-white/20 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 shadow-lg transition-all duration-200",
          {
            'border-blue-400/50 bg-blue-500/20': activeFilterCount > 0
          }
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        <span className="font-medium text-slate-800 dark:text-slate-100">Filter</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full font-medium shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </motion.button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <motion.div 
            className={cn(
              "absolute top-full right-0 mt-3 w-80 rounded-2xl shadow-2xl border border-white/20 p-6 z-20",
              filterGlassClassName
            )}
            style={filterGlassStyles}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Enhanced glass background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.05] pointer-events-none rounded-2xl" />
            
            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Filter Tiles</h3>
                <button
                  onClick={() => {
                    onFilterChange({})
                    setIsOpen(false)
                  }}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-md hover:bg-white/10 transition-all duration-150"
                >
                  Clear all
                </button>
              </div>

              {/* Tile Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Tile Type
                </label>
                <div className="space-y-2">
                  {uniqueTileTypes.map(type => (
                    <label key={type} className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filter.tileType?.includes(type) || false}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const currentTypes = filter.tileType || []
                          const newTypes = checked
                            ? [...currentTypes, type]
                            : currentTypes.filter(t => t !== type)
                          
                          onFilterChange({
                            ...filter,
                            tileType: newTypes.length > 0 ? newTypes : undefined
                          })
                        }}
                        className="rounded border-white/30 bg-white/5 text-blue-600 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                      <span className="ml-3 text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-50 transition-colors">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Category
                </label>
                <div className="space-y-2">
                  {uniqueCategories.map(category => (
                    <label key={category} className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filter.operationCategory?.includes(category) || false}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const currentCategories = filter.operationCategory || []
                          const newCategories = checked
                            ? [...currentCategories, category]
                            : currentCategories.filter(c => c !== category)
                          
                          onFilterChange({
                            ...filter,
                            operationCategory: newCategories.length > 0 ? newCategories : undefined
                          })
                        }}
                        className="rounded border-white/30 bg-white/5 text-blue-600 focus:ring-blue-500/50 focus:border-blue-500/50"
                      />
                      <span className="ml-3 text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-50 transition-colors capitalize">
                        {category.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Feature Filters */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Features
                </label>
                <div className="space-y-2">
                  <label className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filter.hasActions === true}
                      onChange={(e) => onFilterChange({
                        ...filter,
                        hasActions: e.target.checked ? true : undefined
                      })}
                      className="rounded border-white/30 bg-white/5 text-blue-600 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                    <span className="ml-3 text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-50 transition-colors">
                      Has Actions
                    </span>
                  </label>
                  
                  <label className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filter.hasStats === true}
                      onChange={(e) => onFilterChange({
                        ...filter,
                        hasStats: e.target.checked ? true : undefined
                      })}
                      className="rounded border-white/30 bg-white/5 text-blue-600 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                    <span className="ml-3 text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-50 transition-colors">
                      Has Statistics
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

// ================================================================================
// UTILITY COMPONENTS
// ================================================================================

function UniversalTileRendererSkeleton({ layout }: { layout: string }) {
  const skeletonCount = layout === 'list' ? 3 : 6
  
  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-9 w-9 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        
        <div className={cn(
          'grid gap-4',
          {
            'grid-cols-1': layout === 'list',
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': layout !== 'list'
          }
        )}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <TileSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TileSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div>
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-12 bg-gray-200 rounded mt-1" />
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>
      
      <div>
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded mt-1" />
      </div>
      
      <div className="space-y-2">
        <div className="h-8 w-16 bg-gray-200 rounded mx-auto" />
        <div className="h-3 w-12 bg-gray-200 rounded mx-auto" />
      </div>
      
      <div className="flex gap-2">
        <div className="h-7 w-16 bg-gray-200 rounded" />
        <div className="h-7 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

function UniversalTileRendererError({ 
  error, 
  onRetry 
}: { 
  error: Error | null
  onRetry: () => void 
}) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Failed to load workspace
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

function WorkspaceEmptyState({
  hasSearch,
  hasFilter,
  onClearSearch,
  onClearFilter
}: {
  hasSearch: boolean
  hasFilter: boolean
  onClearSearch: () => void
  onClearFilter: () => void
}) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <LayoutGrid className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasSearch || hasFilter ? 'No tiles match your criteria' : 'No tiles found'}
      </h3>
      
      <p className="text-gray-600 mb-6">
        {hasSearch || hasFilter 
          ? 'Try adjusting your search or filter settings.'
          : 'This workspace doesn\'t have any tiles configured yet.'
        }
      </p>
      
      {(hasSearch || hasFilter) && (
        <div className="flex items-center justify-center gap-3">
          {hasSearch && (
            <button
              onClick={onClearSearch}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          )}
          {hasFilter && (
            <button
              onClick={onClearFilter}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Export the component
export default UniversalTileRenderer