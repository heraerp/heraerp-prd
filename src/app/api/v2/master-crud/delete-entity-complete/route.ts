/**
 * Master CRUD v2 - Delete Entity Complete
 * DELETE /api/v2/master-crud/delete-entity-complete
 * 
 * Atomic operation: Delete entity + cascade dynamic data + relationships
 * Target: 60ms response time for deletions
 */

import { NextRequest, NextResponse } from 'next/server'
import { masterCrudV2 } from '@/lib/master-crud-v2/core'
import { DeleteEntityCompleteRequest, isDeleteEntityCompleteRequest } from '@/types/master-crud-v2.types'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest) {
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
    if (!isDeleteEntityCompleteRequest(body)) {
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
    console.log(`[Master CRUD v2] Deleting entity: ${body.entityId} (mode: ${body.deleteMode || 'soft'})`)

    // Execute atomic operation
    const result = await masterCrudV2.deleteEntityComplete(body as DeleteEntityCompleteRequest)

    // Add request timing to response
    const totalTime = Date.now() - startTime
    result.performance.executionTimeMs = totalTime

    // Log performance for monitoring
    if (totalTime > 80) {
      console.warn(`[Master CRUD v2] Slow deletion: ${totalTime}ms for entity ${body.entityId}`)
    } else {
      console.log(`[Master CRUD v2] Fast deletion: ${totalTime}ms for entity ${body.entityId}`)
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Master CRUD v2] Delete entity failed:', {
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
 * POST handler as alternative for clients that don't support DELETE with body
 */
export async function POST(req: NextRequest) {
  return DELETE(req)
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return NextResponse.json(
    { 
      api_version: 'v2',
      methods: ['DELETE', 'POST'],
      description: 'Delete entity with cascade options atomically'
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hera-api-version'
      }
    }
  )
}