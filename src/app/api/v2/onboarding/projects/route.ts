import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveUserIdentity } from '@/lib/auth/user-identity-resolver'

/**
 * HERA Onboarding DNA v3.0 - Project Management API
 * 
 * Provides comprehensive CRUD operations for onboarding projects
 * following API v2 security pipeline with actor stamping and organization isolation.
 */

interface OnboardingProjectRequest {
  operation: 'create' | 'read' | 'update' | 'delete'
  project?: {
    project_name: string
    project_description?: string
    project_type?: 'NEW_CUSTOMER' | 'UPGRADE' | 'MIGRATION'
    target_go_live_date: string
    estimated_days?: number
    micro_app_bundle_codes?: string[]
    partner_org_id?: string
    primary_contact_email?: string
    ai_copilot_enabled?: boolean
  }
  project_id?: string
}

interface OnboardingProjectResponse {
  success: boolean
  project_id?: string
  project?: any
  phases_created?: number
  message?: string
  error_code?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<OnboardingProjectResponse>> {
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

    // Initialize Supabase client with service role for RPC calls
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Resolve user identity (WHO is making the request)
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
    const body: OnboardingProjectRequest = await request.json()
    
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
      p_project: null,
      p_options: {}
    }

    // Add operation-specific parameters
    switch (body.operation) {
      case 'create':
        if (!body.project) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST',
              message: 'project data required for create operation'
            },
            { status: 400 }
          )
        }
        rpcParams.p_project = body.project
        break
        
      case 'read':
        if (!body.project_id) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST', 
              message: 'project_id required for read operation'
            },
            { status: 400 }
          )
        }
        rpcParams.p_options = { project_id: body.project_id }
        break
        
      case 'update':
        if (!body.project_id || !body.project) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST',
              message: 'project_id and project data required for update operation'
            },
            { status: 400 }
          )
        }
        rpcParams.p_project = body.project
        rpcParams.p_options = { project_id: body.project_id }
        break
        
      case 'delete':
        if (!body.project_id) {
          return NextResponse.json(
            {
              success: false,
              error_code: 'INVALID_REQUEST',
              message: 'project_id required for delete operation'
            },
            { status: 400 }
          )
        }
        rpcParams.p_options = { project_id: body.project_id }
        break
        
      default:
        return NextResponse.json(
          {
            success: false,
            error_code: 'INVALID_OPERATION',
            message: 'operation must be one of: create, read, update, delete'
          },
          { status: 400 }
        )
    }

    // Execute RPC function
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('hera_onboarding_project_crud_v1', rpcParams)

    if (rpcError) {
      console.error('RPC Error:', rpcError)
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

    // Return successful response with actor confirmation
    const response: OnboardingProjectResponse = {
      success: true,
      message: rpcResult.message || 'Operation completed successfully'
    }

    // Add operation-specific data
    if (rpcResult.project_id) response.project_id = rpcResult.project_id
    if (rpcResult.project) response.project = rpcResult.project
    if (rpcResult.phases_created) response.phases_created = rpcResult.phases_created

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Actor-User-Id': identity.user_entity_id,
        'X-Organization-Id': organizationId,
        'X-Request-Id': crypto.randomUUID()
      }
    })

  } catch (error) {
    console.error('Onboarding Projects API Error:', error)
    
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
  // GET endpoint for listing projects (read-only)
  try {
    const authHeader = request.headers.get('authorization')
    const orgHeader = request.headers.get('x-organization-id')
    
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

    // Query all onboarding projects for organization
    const { data: projects, error } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_code,
        entity_name,
        entity_description,
        status,
        created_at,
        updated_at,
        dynamic_data:core_dynamic_data(field_name, field_value_text, field_value_date, field_value_number)
      `)
      .eq('entity_type', 'ONBOARDING_PROJECT')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Query Error:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      projects: projects || [],
      count: projects?.length || 0
    })

  } catch (error) {
    console.error('GET Projects Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}