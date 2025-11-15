import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveUserIdentity } from '@/lib/auth/user-identity-resolver'

/**
 * HERA Onboarding DNA v3.0 - Checkpoint Management API
 * 
 * Provides comprehensive checkpoint operations for onboarding projects
 * including validation gates, rollback assessment, and snapshot management.
 */

interface CheckpointRequest {
  operation: 'create' | 'read' | 'validate_rollback' | 'delete'
  checkpoint?: {
    project_id: string
    checkpoint_step: string
    checkpoint_name?: string
    checkpoint_description?: string
    checkpoint_type?: 'FULL_ORG' | 'PARTIAL_SCOPE' | 'CONFIG_ONLY' | 'DATA_ONLY'
    checkpoint_trigger?: 'MANUAL' | 'AUTO_PRE_PHASE' | 'AUTO_DAILY'
    retention_days?: number
    scope_filter?: {
      entity_types?: string[]
      transaction_smart_codes?: string[]
      relationships?: boolean
      dynamic_data?: boolean
    }
  }
  checkpoint_id?: string
}

interface CheckpointResponse {
  success: boolean
  checkpoint_id?: string
  checkpoint?: any
  rollback_assessment?: any
  snapshot_manifest?: any
  can_rollback_to?: boolean
  message?: string
  error_code?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<CheckpointResponse>> {
  try {
    // Extract headers for API v2 security pipeline
    const authHeader = request.headers.get('authorization')
    const orgHeader = request.headers.get('x-organization-id')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error_code: 'UNAUTHORIZED',
          message: 'Bearer token required' 
        },
        { status: 401 }
      )
    }

    if (!orgHeader) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'NO_ORGANIZATION_CONTEXT', 
          message: 'X-Organization-Id header required'
        },
        { status: 400 }
      )
    }

    const token = authHeader.substring(7)
    const organizationId = orgHeader

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Resolve user identity
    const identity = await resolveUserIdentity(token, supabase)
    if (!identity.success || !identity.user_entity_id) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'IDENTITY_RESOLUTION_FAILED',
          message: 'Could not resolve user identity'
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body: CheckpointRequest = await request.json()
    
    // Validate request structure
    if (!body.operation) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'INVALID_REQUEST',
          message: 'operation field is required'
        },
        { status: 400 }
      )
    }

    // Map operation to RPC action
    const rpcAction = body.operation.toUpperCase()
    
    // Build RPC parameters
    const rpcParams: any = {
      p_action: rpcAction,
      p_actor_user_id: identity.user_entity_id,
      p_organization_id: organizationId,
      p_checkpoint: null,
      p_options: {}
    }

    // Add operation-specific parameters
    switch (body.operation) {
      case 'create':
        if (!body.checkpoint) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST',
              message: 'checkpoint data required for create operation'
            },
            { status: 400 }
          )
        }
        
        // Validate required fields for checkpoint creation
        if (!body.checkpoint.project_id || !body.checkpoint.checkpoint_step) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST',
              message: 'project_id and checkpoint_step are required for checkpoint creation'
            },
            { status: 400 }
          )
        }
        
        rpcParams.p_checkpoint = body.checkpoint
        break
        
      case 'read':
        if (!body.checkpoint_id) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST', 
              message: 'checkpoint_id required for read operation'
            },
            { status: 400 }
          )
        }
        rpcParams.p_options = { checkpoint_id: body.checkpoint_id }
        break
        
      case 'validate_rollback':
        if (!body.checkpoint_id) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST',
              message: 'checkpoint_id required for rollback validation'
            },
            { status: 400 }
          )
        }
        rpcParams.p_options = { checkpoint_id: body.checkpoint_id }
        break
        
      case 'delete':
        if (!body.checkpoint_id) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST',
              message: 'checkpoint_id required for delete operation'
            },
            { status: 400 }
          )
        }
        rpcParams.p_options = { checkpoint_id: body.checkpoint_id }
        break
        
      default:
        return NextResponse.json(
          {
            success: false,
            error_code: 'INVALID_OPERATION',
            message: 'operation must be one of: create, read, validate_rollback, delete'
          },
          { status: 400 }
        )
    }

    // Execute RPC function
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('hera_onboarding_checkpoint_crud_v1', rpcParams)

    if (rpcError) {
      console.error('Checkpoint RPC Error:', rpcError)
      return NextResponse.json(
        {
          success: false,
          error_code: 'RPC_EXECUTION_ERROR',
          message: `Database operation failed: ${rpcError.message}`
        },
        { status: 500 }
      )
    }

    // Handle RPC response
    if (!rpcResult?.success) {
      return NextResponse.json(
        {
          success: false,
          error_code: rpcResult?.error_code || 'UNKNOWN_ERROR',
          message: rpcResult?.message || 'Operation failed'
        },
        { status: 400 }
      )
    }

    // Build successful response
    const response: CheckpointResponse = {
      success: true,
      message: rpcResult.message || 'Checkpoint operation completed successfully'
    }

    // Add operation-specific data
    if (rpcResult.checkpoint_id) response.checkpoint_id = rpcResult.checkpoint_id
    if (rpcResult.checkpoint) response.checkpoint = rpcResult.checkpoint
    if (rpcResult.rollback_assessment) response.rollback_assessment = rpcResult.rollback_assessment
    if (rpcResult.snapshot_manifest) response.snapshot_manifest = rpcResult.snapshot_manifest
    if (rpcResult.can_rollback_to !== undefined) response.can_rollback_to = rpcResult.can_rollback_to

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Actor-User-Id': identity.user_entity_id,
        'X-Organization-Id': organizationId,
        'X-Request-Id': crypto.randomUUID()
      }
    })

  } catch (error) {
    console.error('Onboarding Checkpoints API Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // GET endpoint for listing checkpoints by project
  try {
    const authHeader = request.headers.get('authorization')
    const orgHeader = request.headers.get('x-organization-id')
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    
    if (!authHeader?.startsWith('Bearer ') || !orgHeader) {
      return NextResponse.json(
        { error: 'Authentication and organization context required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const organizationId = orgHeader

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    )

    // Resolve identity
    const identity = await resolveUserIdentity(token, supabase)
    if (!identity.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('core_entities')
      .select(`
        id,
        entity_code,
        entity_name,
        entity_description,
        parent_entity_id,
        status,
        created_at,
        updated_at,
        dynamic_data:core_dynamic_data(field_name, field_value_text, field_value_date, field_value_number, field_value_boolean, field_value_json)
      `)
      .eq('entity_type', 'ONBOARDING_CHECKPOINT')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Filter by project if specified
    if (projectId) {
      query = query.eq('parent_entity_id', projectId)
    }

    const { data: checkpoints, error } = await query

    if (error) {
      console.error('Query Error:', error)
      return NextResponse.json({ error: 'Failed to fetch checkpoints' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      checkpoints: checkpoints || [],
      count: checkpoints?.length || 0,
      project_id: projectId
    })

  } catch (error) {
    console.error('GET Checkpoints Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}