/**
 * HERA Production Monitoring API - Report Generation
 * API endpoint for generating and retrieving production error reports
 * Smart Code: HERA.MONITORING.API.REPORT.v1
 */

import { NextRequest, NextResponse } from 'next/server'
import { reportGenerator } from '@/lib/monitoring/report-generator'
import { productionMonitor } from '@/lib/monitoring/production-monitor'
import type { ProductionError } from '@/lib/monitoring/production-monitor'

interface ReportRequest {
  reportType: 'instant' | 'buffered' | 'timeRange'
  format: 'comprehensive' | 'summary' | 'technical' | 'business'
  includeUserContext?: boolean
  includePerformanceMetrics?: boolean
  includeLogs?: boolean
  includeNetworkRequests?: boolean
  maxLogEntries?: number
  timeRange?: {
    start: string
    end: string
  }
  errorIds?: string[]
}

interface ReportResponse {
  success: boolean
  reportId?: string
  report?: string
  format?: string
  size?: number
  generatedAt?: string
  error?: string
}

/**
 * POST /api/monitoring/report
 * Generate a new production error report
 */
export async function POST(request: NextRequest): Promise<NextResponse<ReportResponse>> {
  try {
    const body: ReportRequest = await request.json()
    
    // Validate request
    if (!body.reportType || !body.format) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: reportType and format'
      }, { status: 400 })
    }

    // Get errors based on report type
    let errors: ProductionError[] = []
    
    switch (body.reportType) {
      case 'instant':
        // Get errors from current buffer
        errors = productionMonitor.getBufferedErrors()
        break
        
      case 'buffered':
        // Get all buffered errors
        errors = productionMonitor.getBufferedErrors()
        break
        
      case 'timeRange':
        if (!body.timeRange) {
          return NextResponse.json({
            success: false,
            error: 'timeRange is required for timeRange report type'
          }, { status: 400 })
        }
        
        // Filter errors by time range
        const start = new Date(body.timeRange.start).getTime()
        const end = new Date(body.timeRange.end).getTime()
        
        errors = productionMonitor.getBufferedErrors().filter(error => {
          const errorTime = new Date(error.timestamp).getTime()
          return errorTime >= start && errorTime <= end
        })
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid reportType. Must be: instant, buffered, or timeRange'
        }, { status: 400 })
    }

    // Filter by specific error IDs if provided
    if (body.errorIds && body.errorIds.length > 0) {
      errors = errors.filter(error => body.errorIds!.includes(error.id))
    }

    // Check if we have errors to report
    if (errors.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No errors found matching the criteria'
      }, { status: 404 })
    }

    // Generate report
    const report = await reportGenerator.generateReport(errors, {
      includeUserContext: body.includeUserContext ?? true,
      includePerformanceMetrics: body.includePerformanceMetrics ?? true,
      includeLogs: body.includeLogs ?? true,
      includeNetworkRequests: body.includeNetworkRequests ?? true,
      format: body.format,
      maxLogEntries: body.maxLogEntries ?? 20
    })

    // Calculate report size
    const reportSize = new Blob([report]).size

    // Generate unique report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      success: true,
      reportId,
      report,
      format: body.format,
      size: reportSize,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Report generation API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * GET /api/monitoring/report?type=summary&format=json
 * Get a quick report summary
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const format = searchParams.get('format') || 'json'

    const errors = productionMonitor.getBufferedErrors()

    if (errors.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          errorCount: 0,
          message: 'No errors in buffer'
        }
      })
    }

    if (type === 'summary' && format === 'json') {
      // Return JSON summary
      const errorTypes = errors.reduce((acc, error) => {
        acc[error.error.type] = (acc[error.error.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const severityCounts = errors.reduce((acc, error) => {
        acc[error.error.severity] = (acc[error.error.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const timeRange = {
        start: Math.min(...errors.map(e => new Date(e.timestamp).getTime())),
        end: Math.max(...errors.map(e => new Date(e.timestamp).getTime()))
      }

      return NextResponse.json({
        success: true,
        summary: {
          errorCount: errors.length,
          timeRange: {
            start: new Date(timeRange.start).toISOString(),
            end: new Date(timeRange.end).toISOString()
          },
          errorTypes,
          severityCounts,
          affectedUsers: new Set(errors.map(e => e.user.session_id)).size,
          organizations: new Set(errors.map(e => e.user.organization_id)).size
        },
        generatedAt: new Date().toISOString()
      })
    }

    // For other types, generate full report
    const report = await reportGenerator.generateReport(errors, {
      includeUserContext: true,
      includePerformanceMetrics: false,
      includeLogs: false,
      includeNetworkRequests: false,
      format: type as any,
      maxLogEntries: 5
    })

    // Determine content type
    let contentType = 'text/plain'
    if (format === 'html' || type === 'comprehensive') {
      contentType = 'text/html'
    } else if (format === 'json' || type === 'technical') {
      contentType = 'application/json'
    } else if (format === 'markdown' || type === 'summary') {
      contentType = 'text/markdown'
    }

    return new NextResponse(report, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="hera-report-${Date.now()}.${format === 'html' ? 'html' : format === 'json' ? 'json' : 'md'}"`
      }
    })

  } catch (error) {
    console.error('Report GET API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/monitoring/report
 * Clear error buffer
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const errorCountBefore = productionMonitor.getBufferedErrors().length
    productionMonitor.clearBuffer()
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${errorCountBefore} errors from buffer`,
      clearedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Report DELETE API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}