/**
 * Claude Brain API - Natural Language Query
 * POST /api/v2/claude-brain/query
 * 
 * Process natural language business queries with AI-powered responses
 * Target: 200ms total response time (100ms AI + 100ms operations)
 */

import { NextRequest, NextResponse } from 'next/server'
import { claudeBrainService } from '@/lib/claude-brain/claude-api'
import { ClaudeBrainRequest, isClaudeBrainRequest } from '@/types/claude-brain.types'

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
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
            type: 'validation'
          }
        },
        { status: 400 }
      )
    }

    // Validate request structure
    if (!isClaudeBrainRequest(body)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: organizationId, naturalLanguageQuery',
            type: 'validation',
            details: {
              required_fields: ['organizationId', 'naturalLanguageQuery'],
              provided_fields: Object.keys(body)
            }
          }
        },
        { status: 400 }
      )
    }

    // Performance logging
    console.log(`[Claude Brain] Processing query: "${body.naturalLanguageQuery.substring(0, 100)}..."`)

    // Process natural language query
    const result = await claudeBrainService.processNaturalQuery(body as ClaudeBrainRequest)

    // Add total request timing
    const totalTime = Date.now() - startTime
    result.performance.processingTimeMs = totalTime

    // Performance monitoring
    if (totalTime > 300) {
      console.warn(`[Claude Brain] Slow query processing: ${totalTime}ms`)
    } else {
      console.log(`[Claude Brain] Fast query processing: ${totalTime}ms`)
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Claude Brain] Query processing failed:', {
      error: error.message,
      duration: totalTime,
      query: body?.naturalLanguageQuery?.substring(0, 100)
    })

    // Handle Claude Brain structured errors
    if (error.success === false) {
      return NextResponse.json(error, { status: 500 })
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred during query processing',
          type: 'processing'
        },
        fallback: {
          suggestion: 'Please try rephrasing your question or contact support if the issue persists',
          manualAction: 'Use the manual interface to perform your desired operation'
        },
        performance: {
          processingTimeMs: totalTime,
          failedAt: 'query_processing'
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
      methods: ['POST'],
      description: 'Process natural language business queries with AI-powered responses',
      examples: {
        simple_query: {
          organizationId: 'uuid',
          naturalLanguageQuery: 'Show me all customers created this week'
        },
        complex_query: {
          organizationId: 'uuid',
          naturalLanguageQuery: 'Create a new customer named ACME Corp with email contact@acme.com',
          responseFormat: 'actionable',
          intentHints: ['create_customer']
        }
      }
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hera-api-version'
      }
    }
  )
}