/**
 * Universal Entity List Integration
 * Smart Code: HERA.MICRO_APPS.UNIVERSAL.ENTITY_LIST_INTEGRATION.v1
 * 
 * Integration component for HERA Universal Tile System
 * Provides tile-based navigation to entity lists with workspace context
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Database,
  Users,
  Package,
  FileText,
  Building,
  Receipt,
  Settings,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

// HERA Components
import { GlassCard } from '@/components/ui-kit/primitives'
import { HERATile } from '@/components/hera/shared/HERATile'

// Services and Types
import { UniversalEntityListRegistry, type WorkspaceEntityContext } from '@/lib/micro-apps/UniversalEntityListRegistry'
import { EntityListService } from '@/lib/micro-apps/EntityListService'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Utils
import { cn } from '@/lib/utils'
import { fadeSlide, staggerChildren } from '@/components/ui-kit/design-tokens'

interface EntityListTile {
  entityType: string
  label: string
  labelPlural: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  count: number
  recentActivity: number
  gradient: string
  href: string
  actions: Array<{
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    href: string
  }>
}

interface UniversalEntityListIntegrationProps {
  workspaceContext: WorkspaceEntityContext
  showQuickActions?: boolean
  showStatistics?: boolean
  maxTiles?: number
  tileSize?: 'small' | 'medium' | 'large'
  layout?: 'grid' | 'list' | 'compact'
  className?: string
}

/**
 * Universal Entity List Integration with Tile System
 */
export function UniversalEntityListIntegration({
  workspaceContext,
  showQuickActions = true,
  showStatistics = true,
  maxTiles = 6,
  tileSize = 'medium',
  layout = 'grid',
  className = ''
}: UniversalEntityListIntegrationProps) {
  
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()

  // State management
  const [entityTiles, setEntityTiles] = useState<EntityListTile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load entity list configurations and generate tiles
   */
  useEffect(() => {
    if (!organization?.id || !isAuthenticated) return

    const loadEntityTiles = async () => {
      try {
        setLoading(true)
        console.log('🎯 Loading entity list integration tiles...')

        // Get available entity list configurations
        const { configs } = await UniversalEntityListRegistry.getAvailableEntityListConfigs({
          ...workspaceContext,
          organization_id: organization.id
        })

        // Generate tiles from configurations
        const tiles: EntityListTile[] = []

        for (const config of configs.slice(0, maxTiles)) {
          try {
            // Create service to get statistics
            const service = new EntityListService(config)
            const statistics = showStatistics ? 
              await service.getEntityStatistics(organization.id) : 
              { total: 0, recentlyCreated: 0, recentlyUpdated: 0, byStatus: {} }

            const tile: EntityListTile = {
              entityType: config.entityType,
              label: config.entityLabel,
              labelPlural: config.entityLabelPlural,
              description: `Manage ${config.entityLabelPlural.toLowerCase()} in your ${workspaceContext.domain} ${workspaceContext.section} workspace`,
              icon: getEntityIcon(config.entityType),
              count: statistics.total,
              recentActivity: statistics.recentlyCreated + statistics.recentlyUpdated,
              gradient: getEntityGradient(config.entityType),
              href: `/retail/domains/${workspaceContext.domain}/sections/${workspaceContext.section}/entities?type=${config.entityType}`,
              actions: [
                {
                  id: 'view-all',
                  label: 'View All',
                  icon: List,
                  href: `/retail/domains/${workspaceContext.domain}/sections/${workspaceContext.section}/entities?type=${config.entityType}&view=table`
                },
                {
                  id: 'create-new',
                  label: 'Create New',
                  icon: Plus,
                  href: `/retail/domains/${workspaceContext.domain}/sections/${workspaceContext.section}/entities/new?type=${config.entityType}`
                },
                {
                  id: 'analytics',
                  label: 'Analytics',
                  icon: BarChart3,
                  href: `/retail/domains/${workspaceContext.domain}/sections/${workspaceContext.section}/analytics?entity=${config.entityType}`
                }
              ]
            }

            tiles.push(tile)

          } catch (error) {
            console.warn(`⚠️ Failed to generate tile for ${config.entityType}:`, error)
          }
        }

        setEntityTiles(tiles)
        console.log(`✅ Generated ${tiles.length} entity list tiles`)

      } catch (error) {
        console.error('❌ Error loading entity list integration:', error)
        setError(error instanceof Error ? error.message : 'Failed to load entity lists')
      } finally {
        setLoading(false)
      }
    }

    loadEntityTiles()
  }, [workspaceContext, organization?.id, isAuthenticated, maxTiles, showStatistics])

  /**
   * Handle tile click navigation
   */
  const handleTileClick = useCallback((tile: EntityListTile) => {
    console.log('🎯 Navigating to entity list:', tile.entityType)
    router.push(tile.href)
  }, [router])

  /**
   * Handle quick action click
   */
  const handleActionClick = useCallback((e: React.MouseEvent, action: EntityListTile['actions'][0]) => {
    e.stopPropagation()
    console.log('⚡ Executing quick action:', action.id)
    router.push(action.href)
  }, [router])

  /**
   * Render tile based on layout and size
   */
  const renderTile = useCallback((tile: EntityListTile, index: number) => {
    const IconComponent = tile.icon

    if (layout === 'compact') {
      return (
        <motion.div
          key={tile.entityType}
          {...fadeSlide(index * 0.1)}
          className="group cursor-pointer"
          onClick={() => handleTileClick(tile)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <GlassCard className="p-4 border-white/30 hover:border-blue-300/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: tile.gradient }}
              >
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 truncate">{tile.labelPlural}</h3>
                <p className="text-sm text-slate-500">{tile.count} items</p>
              </div>
              {tile.recentActivity > 0 && (
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  +{tile.recentActivity}
                </Badge>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )
    }

    if (layout === 'list') {
      return (
        <motion.div
          key={tile.entityType}
          {...fadeSlide(index * 0.1)}
          className="group cursor-pointer"
          onClick={() => handleTileClick(tile)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <GlassCard className="p-6 border-white/30 hover:border-blue-300/50 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: tile.gradient }}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{tile.labelPlural}</h3>
                  <p className="text-sm text-slate-600 mb-3 max-w-md">{tile.description}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Database className="w-4 h-4" />
                      <span>{tile.count} total</span>
                    </div>
                    {tile.recentActivity > 0 && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>{tile.recentActivity} recent</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {showQuickActions && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tile.actions.slice(0, 2).map(action => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleActionClick(e, action)}
                      className="h-8 w-8 p-0 hover:bg-blue-100/50"
                    >
                      <action.icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )
    }

    // Grid layout (default)
    const sizeClasses = {
      small: 'p-4',
      medium: 'p-6',
      large: 'p-8'
    }

    return (
      <motion.div
        key={tile.entityType}
        {...fadeSlide(index * 0.1)}
        className="group cursor-pointer"
        onClick={() => handleTileClick(tile)}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <GlassCard className={cn(
          "border-white/30 hover:border-blue-300/50 transition-all duration-300 hover:shadow-lg",
          sizeClasses[tileSize]
        )}>
          {/* Tile Header */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: tile.gradient }}
            >
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            
            {tile.recentActivity > 0 && (
              <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                {tile.recentActivity}
              </Badge>
            )}
          </div>

          {/* Tile Content */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{tile.labelPlural}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">{tile.description}</p>
            </div>

            {/* Statistics */}
            {showStatistics && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Database className="w-4 h-4" />
                  <span>{tile.count} total</span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>Updated recently</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="mt-4 pt-4 border-t border-slate-200/50">
              <div className="flex items-center gap-2">
                {tile.actions.slice(0, 3).map(action => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleActionClick(e, action)}
                    className="flex-1 h-8 text-xs hover:bg-blue-100/50 transition-colors"
                  >
                    <action.icon className="w-3 h-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    )
  }, [layout, tileSize, showQuickActions, showStatistics, handleTileClick, handleActionClick])

  // Loading state
  if (loading) {
    const skeletonCount = layout === 'compact' ? 3 : layout === 'list' ? 2 : 4
    
    return (
      <div className={cn("space-y-4", className)}>
        <motion.div {...staggerChildren}>
          {[...Array(skeletonCount)].map((_, index) => (
            <motion.div key={index} {...fadeSlide(index * 0.1)}>
              <GlassCard className={cn(
                "animate-pulse",
                layout === 'compact' ? "p-4" : layout === 'list' ? "p-6" : "p-6"
              )}>
                <div className={cn(
                  "space-y-3",
                  layout === 'list' && "flex items-center gap-4 space-y-0"
                )}>
                  <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <GlassCard className="p-6 border-red-200/50">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Entity Lists</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  // Empty state
  if (entityTiles.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <GlassCard className="p-8 border-slate-200/50">
          <div className="text-center">
            <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Entity Data...</h3>
            <p className="text-slate-600 mb-4">
              Entity configurations are being loaded for this workspace. Please wait a moment.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  // Render tiles based on layout
  const gridClasses = {
    compact: "space-y-3",
    list: "space-y-4",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
  }

  return (
    <motion.div className={cn(className)} {...staggerChildren}>
      <div className={gridClasses[layout]}>
        {entityTiles.map((tile, index) => renderTile(tile, index))}
      </div>

      {/* Summary Footer */}
      {showStatistics && entityTiles.length > 0 && (
        <motion.div {...fadeSlide(0.5)} className="mt-8">
          <GlassCard className="p-4 border-white/30">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-4">
                <span>{entityTiles.length} entity type{entityTiles.length !== 1 ? 's' : ''} available</span>
                <span>•</span>
                <span>{entityTiles.reduce((sum, tile) => sum + tile.count, 0)} total entities</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Up to date</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  )
}

/**
 * Get appropriate icon for entity type
 */
function getEntityIcon(entityType: string): React.ComponentType<{ className?: string }> {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    customer: Users,
    product: Package,
    vendor: Building,
    invoice: Receipt,
    order: FileText,
    user: Users,
    analytics_report: BarChart3,
    operational_metric: TrendingUp
  }

  return iconMap[entityType.toLowerCase()] || Database
}

/**
 * Get appropriate gradient for entity type
 */
function getEntityGradient(entityType: string): string {
  const gradientMap: Record<string, string> = {
    customer: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    product: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    vendor: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    invoice: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    order: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    user: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    analytics_report: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    operational_metric: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)'
  }

  return gradientMap[entityType.toLowerCase()] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
}

export default UniversalEntityListIntegration