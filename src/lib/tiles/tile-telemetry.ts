/**
 * HERA Universal Tile System - Telemetry & Monitoring
 * Comprehensive telemetry system for tile interactions and performance
 * Smart Code: HERA.PLATFORM.UI.TELEMETRY.v1
 */

import { supabase } from '@/lib/supabase'

// ================================================================================
// TELEMETRY TYPES
// ================================================================================

export interface TileTelemetryEvent {
  eventType: 'tile_viewed' | 'tile_action_executed' | 'tile_stats_loaded' | 'tile_error' | 'tile_performance'
  eventId: string
  timestamp: string
  
  // Context
  tileId: string
  organizationId: string
  actorUserId: string
  workspaceId?: string
  sessionId?: string
  
  // Event-specific data
  data?: Record<string, any>
  
  // Performance metrics
  timing?: {
    duration: number
    startTime: number
    endTime: number
  }
  
  // Error information
  error?: {
    code: string
    message: string
    stack?: string
  }
}

export interface TileUsageMetrics {
  tileId: string
  tileName: string
  
  // Usage counts
  totalViews: number
  totalActions: number
  totalErrors: number
  
  // Time periods
  viewsLast24h: number
  actionsLast24h: number
  errorsLast24h: number
  
  // Performance
  avgLoadTime: number
  avgActionTime: number
  
  // Top actions
  topActions: Array<{
    actionId: string
    count: number
    avgExecutionTime: number
  }>
  
  // Error breakdown
  errorBreakdown: Array<{
    errorCode: string
    count: number
    lastOccurrence: string
  }>
}

export interface WorkspaceTelemetryDashboard {
  workspaceId: string
  organizationId: string
  
  // Overview
  totalTiles: number
  activeTiles: number
  totalInteractions: number
  
  // Time-series data
  dailyUsage: Array<{
    date: string
    views: number
    actions: number
    errors: number
  }>
  
  // Tile rankings
  mostViewedTiles: Array<{
    tileId: string
    tileName: string
    views: number
    lastViewed: string
  }>
  
  mostUsedActions: Array<{
    actionId: string
    tileId: string
    tileName: string
    count: number
    avgExecutionTime: number
  }>
  
  // Performance insights
  performanceMetrics: {
    avgTileLoadTime: number
    avgActionExecutionTime: number
    errorRate: number
    uptime: number
  }
}

// ================================================================================
// TELEMETRY CLIENT
// ================================================================================

export class TileTelemetryClient {
  private supabase: any
  private sessionId: string
  private batchBuffer: TileTelemetryEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null
  
  constructor() {
    this.supabase = supabase
    this.sessionId = this.generateSessionId()
    
    // Auto-flush buffer every 10 seconds
    this.flushInterval = setInterval(() => {
      this.flushBuffer()
    }, 10000)
  }

  /**
   * Track tile view event
   */
  trackTileView({
    tileId,
    organizationId,
    actorUserId,
    workspaceId,
    loadTime,
    metadata
  }: {
    tileId: string
    organizationId: string
    actorUserId: string
    workspaceId?: string
    loadTime?: number
    metadata?: Record<string, any>
  }) {
    this.trackEvent({
      eventType: 'tile_viewed',
      tileId,
      organizationId,
      actorUserId,
      workspaceId,
      timing: loadTime ? {
        duration: loadTime,
        startTime: Date.now() - loadTime,
        endTime: Date.now()
      } : undefined,
      data: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null,
        ...metadata
      }
    })
  }

  /**
   * Track action execution
   */
  trackActionExecution({
    tileId,
    actionId,
    organizationId,
    actorUserId,
    workspaceId,
    executionTime,
    status,
    parameters,
    result
  }: {
    tileId: string
    actionId: string
    organizationId: string
    actorUserId: string
    workspaceId?: string
    executionTime: number
    status: 'success' | 'error' | 'cancelled'
    parameters?: Record<string, any>
    result?: any
  }) {
    this.trackEvent({
      eventType: 'tile_action_executed',
      tileId,
      organizationId,
      actorUserId,
      workspaceId,
      timing: {
        duration: executionTime,
        startTime: Date.now() - executionTime,
        endTime: Date.now()
      },
      data: {
        actionId,
        status,
        parameters,
        result: status === 'success' ? result : undefined
      }
    })
  }

  /**
   * Track stats loading
   */
  trackStatsLoad({
    tileId,
    organizationId,
    actorUserId,
    statsCount,
    executionTime,
    cacheHit
  }: {
    tileId: string
    organizationId: string
    actorUserId: string
    statsCount: number
    executionTime: number
    cacheHit: boolean
  }) {
    this.trackEvent({
      eventType: 'tile_stats_loaded',
      tileId,
      organizationId,
      actorUserId,
      timing: {
        duration: executionTime,
        startTime: Date.now() - executionTime,
        endTime: Date.now()
      },
      data: {
        statsCount,
        cacheHit
      }
    })
  }

  /**
   * Track error
   */
  trackError({
    tileId,
    organizationId,
    actorUserId,
    workspaceId,
    error,
    context
  }: {
    tileId: string
    organizationId: string
    actorUserId: string
    workspaceId?: string
    error: Error | { code: string; message: string; stack?: string }
    context?: Record<string, any>
  }) {
    this.trackEvent({
      eventType: 'tile_error',
      tileId,
      organizationId,
      actorUserId,
      workspaceId,
      error: {
        code: 'code' in error ? error.code : 'UNKNOWN_ERROR',
        message: error.message,
        stack: 'stack' in error ? error.stack : undefined
      },
      data: {
        context,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformance({
    tileId,
    organizationId,
    actorUserId,
    metrics
  }: {
    tileId: string
    organizationId: string
    actorUserId: string
    metrics: {
      renderTime?: number
      queryTime?: number
      actionTime?: number
      memoryUsage?: number
      networkLatency?: number
    }
  }) {
    this.trackEvent({
      eventType: 'tile_performance',
      tileId,
      organizationId,
      actorUserId,
      data: {
        metrics,
        deviceInfo: typeof window !== 'undefined' ? {
          userAgent: window.navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          connection: (navigator as any).connection ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink
          } : null
        } : null
      }
    })
  }

  /**
   * Core event tracking method
   */
  private trackEvent(eventData: Omit<TileTelemetryEvent, 'eventId' | 'timestamp' | 'sessionId'>) {
    const event: TileTelemetryEvent = {
      ...eventData,
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    }

    // Add to buffer for batch processing
    this.batchBuffer.push(event)

    // Flush immediately for critical events
    if (event.eventType === 'tile_error' || this.batchBuffer.length >= 50) {
      this.flushBuffer()
    }
  }

  /**
   * Flush buffered events to database
   */
  private async flushBuffer() {
    if (this.batchBuffer.length === 0) return

    const events = [...this.batchBuffer]
    this.batchBuffer = []

    try {
      // Store events as transactions for queryability
      const transactions = events.map(event => ({
        transaction_type: 'TILE_TELEMETRY',
        smart_code: `HERA.PLATFORM.TELEMETRY.${event.eventType.toUpperCase()}.v1`,
        organization_id: event.organizationId,
        source_entity_id: event.tileId,
        created_by: event.actorUserId,
        updated_by: event.actorUserId,
        metadata: {
          event_id: event.eventId,
          event_type: event.eventType,
          session_id: event.sessionId,
          workspace_id: event.workspaceId,
          timing: event.timing,
          error: event.error,
          data: event.data
        }
      }))

      const { error } = await this.supabase
        .from('universal_transactions')
        .insert(transactions)

      if (error) {
        console.error('Failed to flush telemetry buffer:', error)
        // Re-add events to buffer for retry
        this.batchBuffer.unshift(...events)
      }
    } catch (error) {
      console.error('Error flushing telemetry:', error)
    }
  }

  /**
   * Get usage metrics for a tile
   */
  async getTileUsageMetrics({
    tileId,
    organizationId,
    timeRange = '30d'
  }: {
    tileId: string
    organizationId: string
    timeRange?: '24h' | '7d' | '30d' | '90d'
  }): Promise<TileUsageMetrics | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_tile_usage_metrics', {
        p_tile_id: tileId,
        p_organization_id: organizationId,
        p_time_range: timeRange
      })

      if (error) {
        console.error('Error fetching tile usage metrics:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error in getTileUsageMetrics:', error)
      return null
    }
  }

  /**
   * Get workspace telemetry dashboard
   */
  async getWorkspaceTelemetryDashboard({
    workspaceId,
    organizationId,
    timeRange = '30d'
  }: {
    workspaceId: string
    organizationId: string
    timeRange?: '7d' | '30d' | '90d'
  }): Promise<WorkspaceTelemetryDashboard | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_workspace_telemetry_dashboard', {
        p_workspace_id: workspaceId,
        p_organization_id: organizationId,
        p_time_range: timeRange
      })

      if (error) {
        console.error('Error fetching workspace telemetry dashboard:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error in getWorkspaceTelemetryDashboard:', error)
      return null
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flushBuffer() // Final flush
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
  }
}

// ================================================================================
// REACT HOOKS FOR TELEMETRY
// ================================================================================

import { useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook for automatic tile telemetry tracking
 */
export function useTileTelemetry({
  tileId,
  organizationId,
  actorUserId,
  workspaceId,
  enabled = true
}: {
  tileId: string
  organizationId: string
  actorUserId: string
  workspaceId?: string
  enabled?: boolean
}) {
  const telemetryClient = useMemo(
    () => new TileTelemetryClient(),
    []
  )

  // Track tile view on mount
  useEffect(() => {
    if (!enabled || !tileId || !organizationId || !actorUserId) return

    const startTime = Date.now()
    
    // Track view after component is ready
    const viewTimer = setTimeout(() => {
      const loadTime = Date.now() - startTime
      telemetryClient.trackTileView({
        tileId,
        organizationId,
        actorUserId,
        workspaceId,
        loadTime
      })
    }, 100) // Small delay to ensure component is rendered

    return () => {
      clearTimeout(viewTimer)
    }
  }, [tileId, organizationId, actorUserId, workspaceId, enabled, telemetryClient])

  // Cleanup telemetry client on unmount
  useEffect(() => {
    return () => {
      telemetryClient.destroy()
    }
  }, [telemetryClient])

  return {
    trackAction: telemetryClient.trackActionExecution.bind(telemetryClient),
    trackStats: telemetryClient.trackStatsLoad.bind(telemetryClient),
    trackError: telemetryClient.trackError.bind(telemetryClient),
    trackPerformance: telemetryClient.trackPerformance.bind(telemetryClient),
    client: telemetryClient
  }
}

/**
 * Hook for tile usage metrics
 */
export function useTileUsageMetrics({
  tileId,
  organizationId,
  timeRange = '30d',
  enabled = true
}: {
  tileId: string
  organizationId: string
  timeRange?: '24h' | '7d' | '30d' | '90d'
  enabled?: boolean
}) {
  const telemetryClient = useMemo(
    () => new TileTelemetryClient(),
    []
  )

  return useQuery({
    queryKey: ['tile-usage-metrics', tileId, organizationId, timeRange],
    queryFn: () => telemetryClient.getTileUsageMetrics({
      tileId,
      organizationId,
      timeRange
    }),
    enabled: enabled && !!tileId && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for workspace telemetry dashboard
 */
export function useWorkspaceTelemetryDashboard({
  workspaceId,
  organizationId,
  timeRange = '30d',
  enabled = true
}: {
  workspaceId: string
  organizationId: string
  timeRange?: '7d' | '30d' | '90d'
  enabled?: boolean
}) {
  const telemetryClient = useMemo(
    () => new TileTelemetryClient(),
    []
  )

  return useQuery({
    queryKey: ['workspace-telemetry-dashboard', workspaceId, organizationId, timeRange],
    queryFn: () => telemetryClient.getWorkspaceTelemetryDashboard({
      workspaceId,
      organizationId,
      timeRange
    }),
    enabled: enabled && !!workspaceId && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  })
}

// ================================================================================
// GLOBAL TELEMETRY INSTANCE
// ================================================================================

// Global singleton for use outside of React components
export const globalTileTelemetry = new TileTelemetryClient()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalTileTelemetry.destroy()
  })
}

// Export everything
export default TileTelemetryClient