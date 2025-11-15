/**
 * HERA Universal Tile System - Dynamic Tile Component
 * Core tile component with responsive design and automatic functionality
 * Smart Code: HERA.PLATFORM.UI.COMPONENT.DYNAMIC_TILE.v1
 */

'use client'

import React, { Suspense, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ResolvedTileConfig } from '@/lib/tiles/resolved-tile-config'
import { useTileStats } from '@/lib/tiles/use-tile-stats'
import { useTileActions } from '@/lib/tiles/use-tile-actions'
import { useTileTelemetry } from '@/lib/tiles/tile-telemetry'
import { useGlassEffect, GlassConfig, glassClasses } from '@/lib/dna/design-system/glass-effects-2.0'
import { fadeSlide } from '@/components/ui-kit/design-tokens'
import { 
  Database, Receipt, Workflow, Network, BarChart3, 
  Plus, Eye, Settings, RefreshCw, MoreVertical,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react'

// ================================================================================
// TYPES
// ================================================================================

export interface DynamicTileProps {
  tile: ResolvedTileConfig
  organizationId: string
  actorUserId: string
  workspacePath?: string
  
  // Layout options
  className?: string
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall'
  interactive?: boolean
  showStats?: boolean
  showActions?: boolean
  
  // Glass effect options
  glassIntensity?: 'subtle' | 'medium' | 'strong' | 'ultra'
  glassVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'premium'
  enableShine?: boolean
  enableAnimations?: boolean
  
  // Event handlers
  onClick?: (tile: ResolvedTileConfig) => void
  onActionExecute?: (actionId: string, result: any) => void
  onStatsRefresh?: () => void
}

interface TileIconMap {
  [key: string]: React.ElementType
}

// ================================================================================
// ICON MAPPING
// ================================================================================

const TILE_ICON_MAP: TileIconMap = {
  Database,
  Receipt, 
  Workflow,
  Network,
  BarChart3,
  Plus,
  Eye,
  Settings,
  RefreshCw,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Minus
}

function getTileIcon(iconName: string): React.ElementType {
  return TILE_ICON_MAP[iconName] || Database
}

// ================================================================================
// DYNAMIC TILE COMPONENT
// ================================================================================

export function DynamicTile({
  tile,
  organizationId,
  actorUserId,
  workspacePath,
  className,
  size,
  interactive = true,
  showStats = true,
  showActions = true,
  glassIntensity,
  glassVariant = 'default',
  enableShine = false,
  enableAnimations = true,
  onClick,
  onActionExecute,
  onStatsRefresh
}: DynamicTileProps) {
  
  // Automatic telemetry tracking
  const { trackAction, trackError } = useTileTelemetry({
    tileId: tile.tileId,
    organizationId,
    actorUserId,
    workspaceId: tile.workspaceId
  })

  // Determine tile size (from prop, config, or default)
  const tileSize = size || tile.layout.size || 'medium'
  
  // Determine glass effect intensity based on tile importance and type
  const autoGlassIntensity = useMemo(() => {
    if (glassIntensity) return glassIntensity
    
    // Auto-assign glass intensity based on tile characteristics
    if (tile.operationCategory === 'analytics' || tile.operationCategory === 'reporting') return 'strong'
    if (tile.operationCategory === 'crud' || tile.operationCategory === 'workflow') return 'medium' 
    if (tile.tileType === 'quick-action' || tileSize === 'small') return 'subtle'
    return 'medium'
  }, [glassIntensity, tile.operationCategory, tile.tileType, tileSize])
  
  // Auto-assign glass variant based on tile context
  const autoGlassVariant = useMemo(() => {
    if (glassVariant !== 'default') return glassVariant
    
    if (tile.operationCategory === 'analytics') return 'primary'
    if (tile.operationCategory === 'reporting') return 'success'  
    if (tile.operationCategory === 'admin') return 'warning'
    if (tile.tileType === 'premium' || tile.tileType === 'enterprise') return 'premium'
    return 'default'
  }, [glassVariant, tile.operationCategory, tile.tileType])
  
  // Configure glass effect
  const glassConfig: GlassConfig = {
    intensity: autoGlassIntensity,
    variant: autoGlassVariant,
    enableShine: enableShine || tile.ui.enableEffects,
    enableDepth: tileSize === 'large' || tileSize === 'tall'
  }
  
  // Get glass effect styles and classes
  const { styles: glassStyles, className: glassClassName } = useGlassEffect(glassConfig)
  
  // Handle tile click
  const handleTileClick = () => {
    if (!interactive) return
    
    try {
      trackAction({
        tileId: tile.tileId,
        actionId: 'tile_click',
        organizationId,
        actorUserId,
        executionTime: 0,
        status: 'success',
        parameters: { tileType: tile.tileType }
      })
      
      onClick?.(tile)
    } catch (error) {
      trackError({
        tileId: tile.tileId,
        organizationId,
        actorUserId,
        error: error as Error,
        context: { action: 'tile_click' }
      })
    }
  }

  // Animation variants for Framer Motion
  const animationVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.3, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      } 
    },
    hover: {
      y: -4,
      scale: tileSize === 'small' ? 1.02 : 1.01,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  }

  return (
    <motion.div
      className={cn(
        // Base glassmorphism styles
        'relative rounded-2xl overflow-hidden',
        glassClassName,
        
        // Size variants
        {
          'min-h-[180px]': tileSize === 'small',
          'min-h-[260px]': tileSize === 'medium', 
          'min-h-[340px]': tileSize === 'large',
          'min-h-[260px] col-span-2': tileSize === 'wide',
          'min-h-[380px] row-span-2': tileSize === 'tall',
        },
        
        // Interactive styles
        {
          'cursor-pointer': interactive,
        },
        
        // Enhanced transitions
        'transition-all duration-300 ease-out',
        
        className
      )}
      style={glassStyles}
      variants={enableAnimations ? animationVariants : undefined}
      initial={enableAnimations ? 'initial' : undefined}
      animate={enableAnimations ? 'animate' : undefined}
      whileHover={interactive && enableAnimations ? 'hover' : undefined}
      whileTap={interactive && enableAnimations ? 'tap' : undefined}
      onClick={handleTileClick}
    >
      {/* Enhanced Glassmorphism Background */}
      {tile.ui.gradient && (
        <div 
          className={cn(
            "absolute inset-0 opacity-10",
            `bg-gradient-to-br ${tile.ui.gradient}`
          )}
        />
      )}
      
      {/* Shine Effect */}
      {enableShine && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      )}
      
      {/* Glass Reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none" />
      
      {/* Header Section */}
      <TileHeader 
        tile={tile}
        showActions={showActions}
        organizationId={organizationId}
        actorUserId={actorUserId}
        workspacePath={workspacePath}
        onActionExecute={onActionExecute}
      />
      
      {/* Content Section */}
      <div className="relative p-5 pt-3 space-y-4">
        {/* Title and Description */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-tight drop-shadow-sm">
            {tile.ui.title}
          </h3>
          {tile.ui.subtitle && (
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
              {tile.ui.subtitle}
            </p>
          )}
        </div>
        
        {/* Statistics Section */}
        {showStats && tile.stats.length > 0 && (
          <Suspense fallback={<TileStatsLoading count={tile.stats.length} />}>
            <TileStatsDisplay 
              tile={tile}
              organizationId={organizationId}
              onRefresh={onStatsRefresh}
            />
          </Suspense>
        )}
        
        {/* Quick Actions */}
        {showActions && tile.actions.length > 0 && (
          <TileQuickActions
            tile={tile}
            organizationId={organizationId}
            actorUserId={actorUserId}
            workspacePath={workspacePath}
            onActionExecute={onActionExecute}
          />
        )}
      </div>
      
      {/* Footer with metadata */}
      <TileFooter tile={tile} />
    </motion.div>
  )
}

// ================================================================================
// TILE HEADER COMPONENT
// ================================================================================

interface TileHeaderProps {
  tile: ResolvedTileConfig
  showActions: boolean
  organizationId: string
  actorUserId: string
  workspacePath?: string
  onActionExecute?: (actionId: string, result: any) => void
}

function TileHeader({
  tile,
  showActions,
  organizationId,
  actorUserId,
  workspacePath,
  onActionExecute
}: TileHeaderProps) {
  const IconComponent = getTileIcon(tile.ui.icon)
  
  return (
    <div className="flex items-center justify-between p-4 pb-2">
      {/* Icon and Type Badge */}
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ 
            backgroundColor: tile.ui.color + '20',
            color: tile.ui.color 
          }}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex flex-col gap-1">
          <span 
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ 
              backgroundColor: tile.ui.color + '15',
              color: tile.ui.color 
            }}
          >
            {tile.tileType}
          </span>
          <span className="text-xs text-gray-500">
            {tile.operationCategory}
          </span>
        </div>
      </div>
      
      {/* Actions Menu */}
      {showActions && (
        <TileActionsMenu
          tile={tile}
          organizationId={organizationId}
          actorUserId={actorUserId}
          workspacePath={workspacePath}
          onActionExecute={onActionExecute}
        />
      )}
    </div>
  )
}

// ================================================================================
// TILE STATS DISPLAY
// ================================================================================

interface TileStatsDisplayProps {
  tile: ResolvedTileConfig
  organizationId: string
  onRefresh?: () => void
}

function TileStatsDisplay({ tile, organizationId, onRefresh }: TileStatsDisplayProps) {
  const { stats, isLoading, refresh, isRefreshing } = useTileStats({
    tileId: tile.tileId,
    organizationId,
    refetchInterval: 60000 // 1 minute
  })

  const handleRefresh = async () => {
    await refresh()
    onRefresh?.()
  }

  if (isLoading) {
    return <TileStatsLoading count={tile.stats.length} />
  }

  const primaryStat = stats.find(s => s.statId === tile.stats.find(ts => ts.isPrivate)?.statId)
  const secondaryStats = stats.filter(s => s !== primaryStat).slice(0, 3)

  return (
    <div className="space-y-3">
      {/* Primary Stat */}
      {primaryStat && (
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {primaryStat.formattedValue}
          </div>
          <div className="text-sm text-gray-600">{primaryStat.label}</div>
          {primaryStat.trend && (
            <TrendIndicator trend={primaryStat.trend} />
          )}
        </div>
      )}
      
      {/* Secondary Stats Grid */}
      {secondaryStats.length > 0 && (
        <div className={cn(
          "grid gap-2",
          {
            'grid-cols-1': secondaryStats.length === 1,
            'grid-cols-2': secondaryStats.length === 2,
            'grid-cols-3': secondaryStats.length === 3,
          }
        )}>
          {secondaryStats.map(stat => (
            <div key={stat.statId} className="text-center py-2">
              <div className="text-lg font-semibold text-gray-900">
                {stat.formattedValue}
              </div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 flex items-center gap-1"
        >
          <RefreshCw className={cn("w-3 h-3", { "animate-spin": isRefreshing })} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}

// ================================================================================
// LOADING STATES
// ================================================================================

function TileStatsLoading({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      <div className="text-center space-y-2">
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
      </div>
      
      {count > 1 && (
        <div className={cn(
          "grid gap-2",
          {
            'grid-cols-1': count === 2,
            'grid-cols-2': count === 3,
            'grid-cols-3': count > 3,
          }
        )}>
          {Array.from({ length: Math.min(count - 1, 3) }).map((_, i) => (
            <div key={i} className="text-center py-2 space-y-1">
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ================================================================================
// QUICK ACTIONS
// ================================================================================

interface TileQuickActionsProps {
  tile: ResolvedTileConfig
  organizationId: string
  actorUserId: string
  workspacePath?: string
  onActionExecute?: (actionId: string, result: any) => void
}

function TileQuickActions({
  tile,
  organizationId,
  actorUserId,
  workspacePath,
  onActionExecute
}: TileQuickActionsProps) {
  
  const { executeAction, isExecuting } = useTileActions({
    tileId: tile.tileId,
    organizationId,
    workspacePath,
    onActionComplete: (response) => {
      onActionExecute?.(response.actionId, response.result)
    }
  })

  // Show only primary actions or first 2 actions
  const quickActions = tile.actions.filter(a => a.isPrimary).slice(0, 2)
  if (quickActions.length === 0) {
    quickActions.push(...tile.actions.slice(0, 2))
  }

  const handleActionClick = async (actionId: string) => {
    try {
      await executeAction(actionId)
    } catch (error) {
      console.error('Quick action failed:', error)
    }
  }

  return (
    <div className="flex gap-2">
      {quickActions.map(action => {
        const ActionIcon = getTileIcon(action.icon)
        
        return (
          <button
            key={action.actionId}
            onClick={() => handleActionClick(action.actionId)}
            disabled={isExecuting}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              {
                'bg-blue-600 text-white hover:bg-blue-700': action.isPrimary,
                'bg-gray-100 text-gray-700 hover:bg-gray-200': !action.isPrimary,
              }
            )}
          >
            <ActionIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ================================================================================
// ACTIONS MENU
// ================================================================================

interface TileActionsMenuProps {
  tile: ResolvedTileConfig
  organizationId: string
  actorUserId: string
  workspacePath?: string
  onActionExecute?: (actionId: string, result: any) => void
}

function TileActionsMenu({
  tile,
  organizationId,
  actorUserId,
  workspacePath,
  onActionExecute
}: TileActionsMenuProps) {
  
  const [isOpen, setIsOpen] = React.useState(false)
  
  const { executeAction, isExecuting } = useTileActions({
    tileId: tile.tileId,
    organizationId,
    workspacePath,
    onActionComplete: (response) => {
      onActionExecute?.(response.actionId, response.result)
      setIsOpen(false)
    }
  })

  const handleActionClick = async (actionId: string) => {
    try {
      await executeAction(actionId)
    } catch (error) {
      console.error('Action execution failed:', error)
    }
  }

  if (tile.actions.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
            {tile.actions.map(action => {
              const ActionIcon = getTileIcon(action.icon)
              
              return (
                <button
                  key={action.actionId}
                  onClick={() => handleActionClick(action.actionId)}
                  disabled={isExecuting}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
                >
                  <ActionIcon className="w-4 h-4" />
                  {action.label}
                  {action.isPrimary && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ================================================================================
// UTILITY COMPONENTS
// ================================================================================

function TrendIndicator({ trend }: { trend: NonNullable<any>['trend'] }) {
  const TrendIcon = trend.direction === 'up' ? TrendingUp : 
                   trend.direction === 'down' ? TrendingDown : Minus
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1 text-xs px-1 py-0.5 rounded",
      {
        'text-green-700 bg-green-50': trend.direction === 'up',
        'text-red-700 bg-red-50': trend.direction === 'down',
        'text-gray-700 bg-gray-50': trend.direction === 'neutral',
      }
    )}>
      <TrendIcon className="w-3 h-3" />
      {Math.abs(trend.percentage).toFixed(1)}%
    </div>
  )
}

function TileFooter({ tile }: { tile: ResolvedTileConfig }) {
  return (
    <div className="px-4 pb-3">
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span>Updated: just now</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          Live
        </span>
      </div>
    </div>
  )
}

// Export the component
export default DynamicTile