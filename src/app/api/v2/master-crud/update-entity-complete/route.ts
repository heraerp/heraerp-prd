/**
 * Master CRUD v2 - Update Entity Complete
 * PUT /api/v2/master-crud/update-entity-complete
 * 
 * Atomic operation: Update entity + dynamic data + relationships in single transaction
 * Target: 75ms response time for updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { masterCrudV2 } from '@/lib/master-crud-v2/core'
import { UpdateEntityCompleteRequest, isUpdateEntityCompleteRequest } from '@/types/master-crud-v2.types'

export const runtime = 'nodejs'

export async function PUT(req: NextRequest) {
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
    if (!isUpdateEntityCompleteRequest(body)) {
      return NextResponse.json(
        {
          api_version: 'v2',
          success: false,
          error: 'invalid_request',
          message: 'Missing required fields: entityId, organizationId',
          required_fields: ['entityId', 'organizationId']
        },
        { status: 400 }
      )
    }

    // Add performance logging
    console.log(`[Master CRUD v2] Updating entity: ${body.entityId}`)

    // Execute atomic operation
    const result = await masterCrudV2.updateEntityComplete(body as UpdateEntityCompleteRequest)

    // Add request timing to response
    const totalTime = Date.now() - startTime
    result.performance.executionTimeMs = totalTime

    // Log performance for monitoring
    if (totalTime > 100) {
      console.warn(`[Master CRUD v2] Slow update: ${totalTime}ms for entity ${body.entityId}`)
    } else {
      console.log(`[Master CRUD v2] Fast update: ${totalTime}ms for entity ${body.entityId}`)
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Master CRUD v2] Update entity failed:', {
      error: error.message,
      duration: totalTime,
      entityId: body?.entityId
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
      methods: ['PUT'],
      description: 'Update entity with dynamic data and relationships atomically'
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hera-api-version'
      }
    }
  )
}