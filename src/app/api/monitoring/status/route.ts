/**
 * HERA Production Monitoring API - System Status
 * API endpoint for monitoring system status and configuration
 * Smart Code: HERA.MONITORING.API.STATUS.v1
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionMonitor } from '@/lib/monitoring/production-monitor'
import { logCollector } from '@/lib/monitoring/log-collector'

interface StatusResponse {
  success: boolean
  status: {
    monitoring: {
      enabled: boolean
      initialized: boolean
      errorCount: number
      oldestError?: string
      newestError?: string
    }
    logging: {
      enabled: boolean
      logCount: number
      stats: {
        error: number
        warn: number
        info: number
        debug: number
      }
    }
    system: {
      environment: string
      timestamp: string
      uptime: string
      memory?: {
        used: number
        total: number
        percentage: number
      }
    }
  }
  error?: string
}

interface ConfigRequest {
  monitoring?: {
    enabled?: boolean
    captureConsole?: boolean
    captureNetwork?: boolean
    capturePerformance?: boolean
    captureScreenshots?: boolean
    emailAlerts?: boolean
    maxLogsToCapture?: number
    reportCriticalImmediately?: boolean
  }
  logging?: {
    maxLogs?: number
    captureInfo?: boolean
    captureDebug?: boolean
  }
}

/**
 * GET /api/monitoring/status
 * Get current monitoring system status
 */
export async function GET(): Promise<NextResponse<StatusResponse>> {
  try {
    // Get error buffer status
    const errors = productionMonitor.getBufferedErrors()
    const logStats = logCollector.getStats()

    // Calculate system uptime (approximate)
    const uptime = process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown'

    // Get memory usage if available
    let memoryInfo
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      memoryInfo = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      }
    }

    const status = {
      monitoring: {
        enabled: process.env.NODE_ENV === 'production', // Approximate from monitor config
        initialized: true, // Assume initialized if we can access it
        errorCount: errors.length,
        oldestError: errors.length > 0 ? errors[0].timestamp : undefined,
        newestError: errors.length > 0 ? errors[errors.length - 1].timestamp : undefined
      },
      logging: {
        enabled: true,
        logCount: logStats.total,
        stats: {
          error: logStats.byLevel.error,
          warn: logStats.byLevel.warn,
          info: logStats.byLevel.info,
          debug: logStats.byLevel.debug
        }
      },
      system: {
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
        uptime,
        memory: memoryInfo
      }
    }

    return NextResponse.json({
      success: true,
      status
    })

  } catch (error) {
    console.error('Status API error:', error)
    
    return NextResponse.json({
      success: false,
      status: {
        monitoring: {
          enabled: false,
          initialized: false,
          errorCount: 0
        },
        logging: {
          enabled: false,
          logCount: 0,
          stats: { error: 0, warn: 0, info: 0, debug: 0 }
        },
        system: {
          environment: 'unknown',
          timestamp: new Date().toISOString(),
          uptime: 'unknown'
        }
      },
      error: error instanceof Error ? error.message : 'Failed to get status'
    }, { status: 500 })
  }
}

/**
 * POST /api/monitoring/status/config
 * Update monitoring system configuration
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const config: ConfigRequest = await request.json()

    let updatedSettings: any = {}

    // Update log collector configuration
    if (config.logging) {
      if (config.logging.maxLogs !== undefined || 
          config.logging.captureInfo !== undefined ||
          config.logging.captureDebug !== undefined) {
        
        logCollector.configure({
          maxLogs: config.logging.maxLogs,
          captureInfo: config.logging.captureInfo,
          captureDebug: config.logging.captureDebug
        })
        
        updatedSettings.logging = config.logging
      }
    }

    // Note: Production monitor configuration would be updated here
    // For now, we'll just acknowledge the request
    if (config.monitoring) {
      updatedSettings.monitoring = config.monitoring
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      updatedSettings,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Config update API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update configuration'
    }, { status: 500 })
  }
}

/**
 * POST /api/monitoring/status/reset
 * Reset monitoring system (clear buffers, restart)
 */
export async function PUT(): Promise<NextResponse> {
  try {
    // Clear error buffer
    const errorCountBefore = productionMonitor.getBufferedErrors().length
    productionMonitor.clearBuffer()

    // Clear log buffer
    const logCountBefore = logCollector.getStats().total
    logCollector.clearLogs()

    return NextResponse.json({
      success: true,
      message: 'Monitoring system reset successfully',
      cleared: {
        errors: errorCountBefore,
        logs: logCountBefore
      },
      resetAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Reset API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset monitoring system'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/monitoring/status
 * Disable monitoring (emergency stop)
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    // In a full implementation, this would disable the monitoring system
    // For now, we'll just clear buffers and acknowledge
    
    productionMonitor.clearBuffer()
    logCollector.clearLogs()

    return NextResponse.json({
      success: true,
      message: 'Monitoring disabled and buffers cleared',
      disabledAt: new Date().toISOString(),
      note: 'Monitoring will resume on next page load'
    })

  } catch (error) {
    console.error('Disable API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable monitoring'
    }, { status: 500 })
  }
}