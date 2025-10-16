/**
 * Master CRUD v2 - Create Entity Complete
 * POST /api/v2/master-crud/create-entity-complete
 * 
 * Atomic operation: Entity + Dynamic Data + Relationships in single transaction
 * Target: 80ms response time (73% improvement from 300ms)
 */

import { NextRequest, NextResponse } from 'next/server'
import { masterCrudV2 } from '@/lib/master-crud-v2/core'
import { CreateEntityCompleteRequest, isCreateEntityCompleteRequest } from '@/types/master-crud-v2.types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse request body
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { 
          api_version: 'v2',
          success: false,
          error: 'invalid_json',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      )
    }

    // Validate request structure
    if (!isCreateEntityCompleteRequest(body)) {
      return NextResponse.json(
        {
          api_version: 'v2',
          success: false,
          error: 'invalid_request',
          message: 'Missing required fields: entityType, entityName, organizationId',
          required_fields: ['entityType', 'entityName', 'organizationId']
        },
        { status: 400 }
      )
    }

    // Add performance logging
    console.log(`[Master CRUD v2] Creating entity: ${body.entityType}/${body.entityName}`)

    // Execute atomic operation
    const result = await masterCrudV2.createEntityComplete(body as CreateEntityCompleteRequest)

    // Add request timing to response
    const totalTime = Date.now() - startTime
    result.performance.executionTimeMs = totalTime

    // Log performance for monitoring
    if (totalTime > 100) {
      console.warn(`[Master CRUD v2] Slow operation: ${totalTime}ms for entity creation`)
    } else {
      console.log(`[Master CRUD v2] Fast operation: ${totalTime}ms for entity creation`)
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Master CRUD v2] Create entity failed:', {
      error: error.message,
      duration: totalTime,
      body: req.body
    })

    // Handle Master CRUD v2 structured errors
    if (error.api_version === 'v2') {
      return NextResponse.json(error, { status: 500 })
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        api_version: 'v2',
        success: false,
        error: 'internal_error',
        message: error.message || 'An unexpected error occurred',
        performance: {
          executionTimeMs: totalTime,
          failedAt: 'request_processing'
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
      api_version: 'v2',
      methods: ['POST'],
      description: 'Create entity with dynamic data and relationships atomically'
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