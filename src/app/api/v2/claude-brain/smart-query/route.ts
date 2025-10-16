/**
 * Claude Brain API - Smart Query Processing
 * POST /api/v2/claude-brain/smart-query
 * 
 * Advanced natural language to structured query processing
 * Target: 150ms response time for complex queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { claudeBrainService } from '@/lib/claude-brain/claude-api'
import { businessContextManager } from '@/lib/claude-brain/business-context'
import { SmartQueryRequest } from '@/types/claude-brain.types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse request body
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body'
        },
        { status: 400 }
      )
    }

    // Validate required fields
    const { organizationId, naturalLanguage, userId } = body
    if (!organizationId || !naturalLanguage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: organizationId, naturalLanguage',
          required_fields: ['organizationId', 'naturalLanguage']
        },
        { status: 400 }
      )
    }

    // Get business context
    const context = await businessContextManager.getBusinessContext(organizationId, userId)

    // Build smart query request
    const smartQueryRequest: SmartQueryRequest = {
      naturalLanguage,
      organizationId,
      userId: userId || 'anonymous',
      context,
      includeInsights: body.includeInsights ?? true,
      maxResults: body.maxResults || 50,
      responseFormat: body.responseFormat || 'table'
    }

    console.log(`[Claude Brain] Smart query: "${naturalLanguage.substring(0, 100)}..."`)

    // Process smart query
    const result = await claudeBrainService.smartQuery(smartQueryRequest)

    // Add performance logging
    const totalTime = Date.now() - startTime
    result.performance.totalTimeMs = totalTime

    if (totalTime > 200) {
      console.warn(`[Claude Brain] Slow smart query: ${totalTime}ms`)
    } else {
      console.log(`[Claude Brain] Fast smart query: ${totalTime}ms`)
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Claude Brain] Smart query failed:', {
      error: error.message,
      duration: totalTime,
      query: body?.naturalLanguage?.substring(0, 100)
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Smart query processing failed',
        performance: {
          totalTimeMs: totalTime,
          failedAt: 'smart_query_processing'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler for simple smart queries via URL parameters
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(req.url)
    
    const organizationId = searchParams.get('organizationId')
    const query = searchParams.get('q') || searchParams.get('query')
    const userId = searchParams.get('userId')
    const includeInsights = searchParams.get('includeInsights') === 'true'
    const maxResults = parseInt(searchParams.get('maxResults') || '20')

    if (!organizationId || !query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: organizationId, q (or query)'
        },
        { status: 400 }
      )
    }

    // Get business context
    const context = await businessContextManager.getBusinessContext(organizationId, userId || undefined)

    // Build smart query request
    const smartQueryRequest: SmartQueryRequest = {
      naturalLanguage: query,
      organizationId,
      userId: userId || 'anonymous',
      context,
      includeInsights,
      maxResults,
      responseFormat: 'table'
    }

    console.log(`[Claude Brain] GET smart query: "${query.substring(0, 100)}..."`)

    // Process smart query
    const result = await claudeBrainService.smartQuery(smartQueryRequest)

    // Add performance logging
    const totalTime = Date.now() - startTime
    result.performance.totalTimeMs = totalTime

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Claude Brain] GET smart query failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Smart query processing failed',
        performance: {
          totalTimeMs: totalTime,
          failedAt: 'smart_query_processing'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return NextResponse.json(
    {
      methods: ['GET', 'POST'],
      description: 'Advanced natural language to structured query processing',
      examples: {
        get_example: '/api/v2/claude-brain/smart-query?organizationId=uuid&q=show active customers&includeInsights=true',
        post_example: {
          organizationId: 'uuid',
          naturalLanguage: 'Find customers who placed orders in the last 30 days',
          includeInsights: true,
          maxResults: 50,
          responseFormat: 'table'
        }
      }
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hera-api-version'
      }
    }
  )
}