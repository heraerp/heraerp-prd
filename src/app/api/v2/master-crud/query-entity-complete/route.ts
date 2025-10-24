/**
 * Master CRUD v2 - Query Entity Complete
 * GET/POST /api/v2/master-crud/query-entity-complete
 * 
 * Efficient retrieval: Entity + dynamic data + relationships with filtering
 * Target: 60ms response time for queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { masterCrudV2 } from '@/lib/master-crud-v2/core'
import { QueryEntityCompleteRequest, isQueryEntityCompleteRequest } from '@/types/master-crud-v2.types'

export const runtime = 'nodejs'

/**
 * GET handler for simple queries using URL parameters
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(req.url)
    
    // Build request from URL parameters
    const request: QueryEntityCompleteRequest = {
      organizationId: searchParams.get('organizationId') || '',
      entityId: searchParams.get('entityId') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      smartCode: searchParams.get('smartCode') || undefined,
      includeDynamicData: searchParams.get('includeDynamicData') === 'true',
      includeRelationships: searchParams.get('includeRelationships') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      orderBy: searchParams.get('orderBy') || undefined,
      orderDirection: searchParams.get('orderDirection') as 'asc' | 'desc' || undefined
    }

    // Validate required fields
    if (!request.organizationId) {
      return NextResponse.json(
        {
          api_version: 'v2',
          success: false,
          error: 'invalid_request',
          message: 'organizationId is required',
          required_fields: ['organizationId']
        },
        { status: 400 }
      )
    }

    // Handle entity IDs array
    if (searchParams.get('entityIds')) {
      request.entityIds = searchParams.get('entityIds')!.split(',').filter(Boolean)
    }

    // Handle entity types array
    if (searchParams.get('entityTypes')) {
      request.entityTypes = searchParams.get('entityTypes')!.split(',').filter(Boolean)
    }

    // Handle smart codes array
    if (searchParams.get('smartCodes')) {
      request.smartCodes = searchParams.get('smartCodes')!.split(',').filter(Boolean)
    }

    // Add performance logging
    console.log(`[Master CRUD v2] Querying entities: ${request.entityType || 'all'} (org: ${request.organizationId})`)

    // Execute query
    const result = await masterCrudV2.queryEntityComplete(request)

    // Add request timing to response
    const totalTime = Date.now() - startTime
    result.performance.executionTimeMs = totalTime

    // Log performance for monitoring
    if (totalTime > 100) {
      console.warn(`[Master CRUD v2] Slow query: ${totalTime}ms for ${result.entities.length} entities`)
    } else {
      console.log(`[Master CRUD v2] Fast query: ${totalTime}ms for ${result.entities.length} entities`)
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Master CRUD v2] Query entities failed:', {
      error: error.message,
      duration: totalTime
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
 * POST handler for complex queries with body parameters
 */
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
    if (!isQueryEntityCompleteRequest(body)) {
      return NextResponse.json(
        {
          api_version: 'v2',
          success: false,
          error: 'invalid_request',
          message: 'Missing required field: organizationId',
          required_fields: ['organizationId']
        },
        { status: 400 }
      )
    }

    // Add performance logging
    const entityInfo = body.entityId ? `ID:${body.entityId}` : 
                      body.entityType ? `type:${body.entityType}` : 
                      body.smartCode ? `smart:${body.smartCode}` : 'all'
    console.log(`[Master CRUD v2] Complex query: ${entityInfo} (org: ${body.organizationId})`)

    // Execute query
    const result = await masterCrudV2.queryEntityComplete(body as QueryEntityCompleteRequest)

    // Add request timing to response
    const totalTime = Date.now() - startTime
    result.performance.executionTimeMs = totalTime

    // Log performance for monitoring
    if (totalTime > 100) {
      console.warn(`[Master CRUD v2] Slow complex query: ${totalTime}ms for ${result.entities.length} entities`)
    } else {
      console.log(`[Master CRUD v2] Fast complex query: ${totalTime}ms for ${result.entities.length} entities`)
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Master CRUD v2] Complex query failed:', {
      error: error.message,
      duration: totalTime
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
      methods: ['GET', 'POST'],
      description: 'Query entities with dynamic data and relationships efficiently'
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