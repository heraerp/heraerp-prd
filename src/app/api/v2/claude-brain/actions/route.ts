/**
 * Claude Brain API - Business Actions
 * GET/POST /api/v2/claude-brain/actions
 * 
 * AI-powered business action suggestions and execution
 * Target: 100ms for action suggestions, 150ms for action execution
 */

import { NextRequest, NextResponse } from 'next/server'
import { claudeBrainService } from '@/lib/claude-brain/claude-api'
import { businessContextManager } from '@/lib/claude-brain/business-context'
import { aiSuggestionsEngine } from '@/lib/claude-brain/ai-suggestions'
import { masterCrudV2Client } from '@/lib/master-crud-v2'
import { BusinessAction, isBusinessAction } from '@/types/claude-brain.types'

export const runtime = 'nodejs'

/**
 * GET - Suggest business actions based on context
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(req.url)
    
    const organizationId = searchParams.get('organizationId')
    const userId = searchParams.get('userId')
    const entityType = searchParams.get('entityType')
    const includeContext = searchParams.get('includeContext') === 'true'

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: organizationId'
        },
        { status: 400 }
      )
    }

    console.log(`[Claude Brain] Generating action suggestions for org: ${organizationId}`)

    // Get business context
    const context = await businessContextManager.getBusinessContext(organizationId, userId || undefined)

    // Get relevant entities for context
    let entities: any[] = []
    if (entityType) {
      const entityResults = await masterCrudV2Client.findEntities(organizationId, entityType, {
        includeDynamicData: true,
        limit: 20
      })
      entities = entityResults
    } else {
      // Get recent entities across all types
      const entityResults = await masterCrudV2Client.queryEntityComplete({
        organizationId,
        includeDynamicData: false,
        includeRelationships: false,
        limit: 50,
        orderBy: 'updated_at',
        orderDirection: 'desc'
      })
      entities = entityResults.entities
    }

    // Generate action suggestions
    const actions = await claudeBrainService.suggestActions(context, entities)

    const totalTime = Date.now() - startTime

    const response = {
      success: true,
      actions,
      context: includeContext ? context : undefined,
      performance: {
        processingTimeMs: totalTime,
        actionsGenerated: actions.length
      },
      metadata: {
        organizationId,
        entityType: entityType || 'all',
        entitiesAnalyzed: entities.length
      }
    }

    if (totalTime > 150) {
      console.warn(`[Claude Brain] Slow action generation: ${totalTime}ms`)
    } else {
      console.log(`[Claude Brain] Fast action generation: ${totalTime}ms (${actions.length} actions)`)
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Claude Brain] Action suggestion failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate action suggestions',
        performance: {
          processingTimeMs: totalTime,
          failedAt: 'action_generation'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Execute business action
 */
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

    const { action, organizationId, userId } = body

    // Validate required fields
    if (!action || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: action, organizationId',
          required_fields: ['action', 'organizationId']
        },
        { status: 400 }
      )
    }

    // Validate action structure
    if (!isBusinessAction(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action structure',
          details: 'Action must have id, type, title, and estimation fields'
        },
        { status: 400 }
      )
    }

    console.log(`[Claude Brain] Executing action: ${action.title}`)

    // Get business context
    const context = await businessContextManager.getBusinessContext(organizationId, userId)

    // Execute the action
    const result = await claudeBrainService.executeBusinessAction(action, context)

    const totalTime = Date.now() - startTime

    const response = {
      success: true,
      execution: result,
      performance: {
        processingTimeMs: totalTime,
        actionExecutionTimeMs: result.executionTimeMs
      },
      metadata: {
        actionId: action.id,
        actionType: action.type,
        organizationId
      }
    }

    if (totalTime > 200) {
      console.warn(`[Claude Brain] Slow action execution: ${totalTime}ms`)
    } else {
      console.log(`[Claude Brain] Fast action execution: ${totalTime}ms`)
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Claude Brain] Action execution failed:', {
      error: error.message,
      duration: totalTime,
      actionId: body?.action?.id
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Action execution failed',
        execution: {
          actionId: body?.action?.id || 'unknown',
          success: false,
          executionTimeMs: totalTime,
          error: error.message
        },
        performance: {
          processingTimeMs: totalTime,
          failedAt: 'action_execution'
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
      description: 'AI-powered business action suggestions and execution',
      examples: {
        get_suggestions: '/api/v2/claude-brain/actions?organizationId=uuid&entityType=customer&includeContext=true',
        execute_action: {
          organizationId: 'uuid',
          userId: 'user-uuid',
          action: {
            id: 'action_123',
            type: 'create',
            title: 'Create Customer Contact',
            description: 'Add contact information for new customer',
            operation: {
              type: 'master_crud',
              operation: 'createEntityComplete',
              parameters: {
                entityType: 'contact',
                entityName: 'John Doe',
                organizationId: 'uuid'
              }
            },
            estimation: {
              timeMs: 80,
              impact: 'medium',
              reversible: true
            }
          }
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