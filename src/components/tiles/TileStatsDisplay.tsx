/**
 * HERA Universal Tile System - Tile Statistics Display
 * Advanced statistics component with real-time updates and visualizations
 * Smart Code: HERA.PLATFORM.UI.COMPONENT.TILE_STATS.v1
 */

'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ResolvedTileConfig } from '@/lib/tiles/resolved-tile-config'
import { useTileStats, TileStatResult } from '@/lib/tiles/use-tile-stats'
import { 
  RefreshCw, TrendingUp, TrendingDown, Minus, Clock,
  DollarSign, Hash, Percent, Timer, Calendar, AlertCircle
} from 'lucide-react'

// ================================================================================
// TYPES
// ================================================================================

export interface TileStatsDisplayProps {
  tile: ResolvedTileConfig
  organizationId: string
  
  // Display options
  layout?: 'compact' | 'standard' | 'detailed'
  showRefresh?: boolean
  showTrends?: boolean
  showErrors?: boolean
  maxStats?: number
  
  // Auto-refresh
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Event handlers
  onRefresh?: () => void
  onStatClick?: (stat: TileStatResult) => void
}

interface StatDisplayConfig {
  icon: React.ElementType
  color: string
  bgColor: string
}

// ================================================================================
// FORMAT CONFIGURATIONS
// ================================================================================

const STAT_FORMAT_CONFIGS: Record<string, StatDisplayConfig> = {
  currency: {
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  number: {
    icon: Hash,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  percentage: {
    icon: Percent,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  duration: {
    icon: Timer,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  relative_time: {
    icon: Calendar,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  }
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function TileStatsDisplay({
  tile,
  organizationId,
  layout = 'standard',
  showRefresh = true,
  showTrends = true,
  showErrors = true,
  maxStats,
  autoRefresh = true,
  refreshInterval = 60000,
  onRefresh,
  onStatClick
}: TileStatsDisplayProps) {
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today')
  
  const { 
    stats, 
    isLoading, 
    isError, 
    error, 
    refresh, 
    isRefreshing 
  } = useTileStats({
    tileId: tile.tileId,
    organizationId,
    refetchInterval: autoRefresh ? refreshInterval : undefined,
    context: { timeRange: selectedTimeRange }
  })

  const handleRefresh = async () => {
    await refresh()
    onRefresh?.()
  }

  const displayStats = maxStats ? stats.slice(0, maxStats) : stats
  const hasErrors = displayStats.some(stat => stat.error)

  if (isLoading) {
    return <StatsLoadingState layout={layout} count={tile.stats.length} />
  }

  if (isError && showErrors) {
    return <StatsErrorState error={error} onRetry={handleRefresh} />
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <StatsHeader
        tile={tile}
        selectedTimeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
        showRefresh={showRefresh}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Stats Display */}
      {layout === 'compact' && (
        <CompactStatsLayout
          stats={displayStats}
          showTrends={showTrends}
          showErrors={showErrors}
          onStatClick={onStatClick}
        />
      )}

      {layout === 'standard' && (
        <StandardStatsLayout
          stats={displayStats}
          showTrends={showTrends}
          showErrors={showErrors}
          onStatClick={onStatClick}
        />
      )}

      {layout === 'detailed' && (
        <DetailedStatsLayout
          stats={displayStats}
          showTrends={showTrends}
          showErrors={showErrors}
          onStatClick={onStatClick}
        />
      )}

      {/* Error Indicator */}
      {hasErrors && showErrors && (
        <StatsErrorIndicator stats={displayStats.filter(s => s.error)} />
      )}
    </div>
  )
}

// ================================================================================
// STATS HEADER
// ================================================================================

interface StatsHeaderProps {
  tile: ResolvedTileConfig
  selectedTimeRange: string
  onTimeRangeChange: (range: 'today' | 'week' | 'month') => void
  showRefresh: boolean
  isRefreshing: boolean
  onRefresh: () => void
}

function StatsHeader({
  tile,
  selectedTimeRange,
  onTimeRangeChange,
  showRefresh,
  isRefreshing,
  onRefresh
}: StatsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-medium text-gray-900">Statistics</h4>
      
      <div className="flex items-center gap-2">
        {/* Time Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                {
                  'bg-white text-gray-900 shadow-sm': selectedTimeRange === range,
                  'text-gray-600 hover:text-gray-900': selectedTimeRange !== range,
                }
              )}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        {showRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 rounded"
          >
            <RefreshCw className={cn("w-4 h-4", { "animate-spin": isRefreshing })} />
          </button>
        )}
      </div>
    </div>
  )
}

// ================================================================================
// LAYOUT COMPONENTS
// ================================================================================

interface StatsLayoutProps {
  stats: TileStatResult[]
  showTrends: boolean
  showErrors: boolean
  onStatClick?: (stat: TileStatResult) => void
}

function CompactStatsLayout({ stats, showTrends, onStatClick }: StatsLayoutProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.slice(0, 4).map(stat => (
        <StatCard
          key={stat.statId}
          stat={stat}
          variant="compact"
          showTrend={showTrends}
          onClick={() => onStatClick?.(stat)}
        />
      ))}
    </div>
  )
}

function StandardStatsLayout({ stats, showTrends, onStatClick }: StatsLayoutProps) {
  const primaryStat = stats.find(s => s.statId.includes('primary') || s.statId.includes('total'))
  const secondaryStats = stats.filter(s => s !== primaryStat)

  return (
    <div className="space-y-3">
      {/* Primary Stat - Full Width */}
      {primaryStat && (
        <StatCard
          stat={primaryStat}
          variant="primary"
          showTrend={showTrends}
          onClick={() => onStatClick?.(primaryStat)}
        />
      )}

      {/* Secondary Stats - Grid */}
      {secondaryStats.length > 0 && (
        <div className={cn(
          "grid gap-2",
          {
            'grid-cols-1': secondaryStats.length === 1,
            'grid-cols-2': secondaryStats.length === 2,
            'grid-cols-3': secondaryStats.length >= 3,
          }
        )}>
          {secondaryStats.map(stat => (
            <StatCard
              key={stat.statId}
              stat={stat}
              variant="secondary"
              showTrend={showTrends}
              onClick={() => onStatClick?.(stat)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DetailedStatsLayout({ stats, showTrends, showErrors, onStatClick }: StatsLayoutProps) {
  return (
    <div className="space-y-2">
      {stats.map(stat => (
        <StatCard
          key={stat.statId}
          stat={stat}
          variant="detailed"
          showTrend={showTrends}
          showError={showErrors}
          onClick={() => onStatClick?.(stat)}
        />
      ))}
    </div>
  )
}

// ================================================================================
// STAT CARD COMPONENT
// ================================================================================

interface StatCardProps {
  stat: TileStatResult
  variant: 'compact' | 'primary' | 'secondary' | 'detailed'
  showTrend?: boolean
  showError?: boolean
  onClick?: () => void
}

function StatCard({ stat, variant, showTrend, showError, onClick }: StatCardProps) {
  const formatConfig = STAT_FORMAT_CONFIGS[stat.format] || STAT_FORMAT_CONFIGS.number
  const FormatIcon = formatConfig.icon

  const hasError = !!stat.error
  const isClickable = !!onClick

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200",
        {
          // Base styles
          'p-3': variant === 'compact',
          'p-4': variant === 'primary' || variant === 'secondary',
          'p-3': variant === 'detailed',
          
          // Interactive styles
          'cursor-pointer hover:shadow-sm': isClickable && !hasError,
          
          // Error styles
          'border-red-200 bg-red-50': hasError,
          'border-gray-200 bg-white': !hasError,
          'hover:border-blue-300': isClickable && !hasError,
        }
      )}
      onClick={onClick}
    >
      {variant === 'compact' && (
        <CompactStatContent stat={stat} formatConfig={formatConfig} showTrend={showTrend} />
      )}
      
      {variant === 'primary' && (
        <PrimaryStatContent stat={stat} formatConfig={formatConfig} showTrend={showTrend} />
      )}
      
      {variant === 'secondary' && (
        <SecondaryStatContent stat={stat} formatConfig={formatConfig} showTrend={showTrend} />
      )}
      
      {variant === 'detailed' && (
        <DetailedStatContent 
          stat={stat} 
          formatConfig={formatConfig} 
          showTrend={showTrend}
          showError={showError}
        />
      )}
    </div>
  )
}

// ================================================================================
// STAT CONTENT VARIANTS
// ================================================================================

function CompactStatContent({ 
  stat, 
  formatConfig, 
  showTrend 
}: { 
  stat: TileStatResult
  formatConfig: StatDisplayConfig
  showTrend?: boolean 
}) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-gray-900">
        {stat.formattedValue}
      </div>
      <div className="text-xs text-gray-600">{stat.label}</div>
      {showTrend && stat.trend && (
        <TrendIndicator trend={stat.trend} size="sm" />
      )}
    </div>
  )
}

function PrimaryStatContent({ 
  stat, 
  formatConfig, 
  showTrend 
}: { 
  stat: TileStatResult
  formatConfig: StatDisplayConfig
  showTrend?: boolean 
}) {
  const FormatIcon = formatConfig.icon
  
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-2">
        <div className={cn("p-1 rounded", formatConfig.bgColor)}>
          <FormatIcon className={cn("w-4 h-4", formatConfig.color)} />
        </div>
        <span className="text-sm font-medium text-gray-700">{stat.label}</span>
      </div>
      
      <div className="text-3xl font-bold text-gray-900">
        {stat.formattedValue}
      </div>
      
      {showTrend && stat.trend && (
        <TrendIndicator trend={stat.trend} size="lg" />
      )}
    </div>
  )
}

function SecondaryStatContent({ 
  stat, 
  formatConfig, 
  showTrend 
}: { 
  stat: TileStatResult
  formatConfig: StatDisplayConfig
  showTrend?: boolean 
}) {
  return (
    <div className="text-center space-y-1">
      <div className="text-xl font-semibold text-gray-900">
        {stat.formattedValue}
      </div>
      <div className="text-sm text-gray-600">{stat.label}</div>
      {showTrend && stat.trend && (
        <TrendIndicator trend={stat.trend} size="sm" />
      )}
    </div>
  )
}

function DetailedStatContent({ 
  stat, 
  formatConfig, 
  showTrend,
  showError 
}: { 
  stat: TileStatResult
  formatConfig: StatDisplayConfig
  showTrend?: boolean
  showError?: boolean
}) {
  const FormatIcon = formatConfig.icon
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", formatConfig.bgColor)}>
          <FormatIcon className={cn("w-4 h-4", formatConfig.color)} />
        </div>
        
        <div>
          <div className="font-medium text-gray-900">{stat.label}</div>
          <div className="text-sm text-gray-500">
            Executed in {stat.executionTime}ms
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-xl font-semibold text-gray-900">
          {stat.formattedValue}
        </div>
        
        <div className="flex items-center gap-2">
          {showTrend && stat.trend && (
            <TrendIndicator trend={stat.trend} size="sm" />
          )}
          
          {showError && stat.error && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Error
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ================================================================================
// UTILITY COMPONENTS
// ================================================================================

function TrendIndicator({ 
  trend, 
  size = 'sm' 
}: { 
  trend: NonNullable<TileStatResult['trend']>
  size?: 'sm' | 'lg'
}) {
  const TrendIcon = trend.direction === 'up' ? TrendingUp : 
                   trend.direction === 'down' ? TrendingDown : Minus
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full",
      {
        'text-xs': size === 'sm',
        'text-sm': size === 'lg',
      },
      {
        'text-green-700 bg-green-100': trend.direction === 'up',
        'text-red-700 bg-red-100': trend.direction === 'down',
        'text-gray-700 bg-gray-100': trend.direction === 'neutral',
      }
    )}>
      <TrendIcon className={cn({
        'w-3 h-3': size === 'sm',
        'w-4 h-4': size === 'lg',
      })} />
      {Math.abs(trend.percentage).toFixed(1)}%
    </div>
  )
}

function StatsLoadingState({ layout, count }: { layout: string; count: number }) {
  if (layout === 'compact') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <div key={i} className="p-3 border rounded-lg">
            <div className="text-center space-y-2">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="p-4 border rounded-lg">
        <div className="text-center space-y-2">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  )
}

function StatsErrorState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
        <div className="text-sm font-medium text-red-900">
          Failed to load statistics
        </div>
        <div className="text-xs text-red-700">
          {error?.message || 'Unknown error occurred'}
        </div>
        <button
          onClick={onRetry}
          className="text-xs text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

function StatsErrorIndicator({ stats }: { stats: TileStatResult[] }) {
  return (
    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="text-xs text-yellow-800 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {stats.length} stat{stats.length !== 1 ? 's' : ''} failed to load
      </div>
    </div>
  )
}

// Export the component
export default TileStatsDisplay