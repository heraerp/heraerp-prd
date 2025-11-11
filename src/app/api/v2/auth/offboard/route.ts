import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '@/lib/auth/verify-auth'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * HERA User Offboarding API
 * Calls hera_offboard_user_v2 to remove user from organization
 * POST /api/v2/auth/offboard
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth?.id || !auth?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      actor_user_id,
      organization_id,
      target_supabase_user_id,
      target_user_entity_id,
      reason = 'Administrative action',
      hard_delete = false,
      expire_at
    } = await request.json()

    // Validate required fields
    if (!actor_user_id || !organization_id) {
      return NextResponse.json(
        { error: 'actor_user_id and organization_id are required' },
        { status: 400 }
      )
    }

    if (!target_supabase_user_id && !target_user_entity_id) {
      return NextResponse.json(
        { error: 'Either target_supabase_user_id or target_user_entity_id is required' },
        { status: 400 }
      )
    }

    // First, verify actor has permission to offboard users
    const { data: introspectData, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: actor_user_id
    })

    if (introspectError || !introspectData) {
      return NextResponse.json(
        { error: 'Failed to verify actor permissions', details: introspectError?.message },
        { status: 403 }
      )
    }

    // Check if actor has ORG_OWNER or ORG_ADMIN role
    const actorRoles = introspectData.roles || []
    const canOffboard = actorRoles.includes('ORG_OWNER') || actorRoles.includes('ORG_ADMIN')

    if (!canOffboard) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          details: 'Only ORG_OWNER or ORG_ADMIN can offboard users',
          actor_roles: actorRoles
        },
        { status: 403 }
      )
    }

    // Call HERA offboard RPC
    const { data, error } = await supabase.rpc('hera_offboard_user_v2', {
      p_organization_id: organization_id,
      p_actor_user_id: actor_user_id,
      p_supabase_user_id: target_supabase_user_id || null,
      p_user_entity_id: target_user_entity_id || null,
      p_reason: reason,
      p_hard_delete: hard_delete,
      p_expire_at: expire_at ? new Date(expire_at).toISOString() : null
    })

    if (error) {
      console.error('HERA offboard error:', error)
      return NextResponse.json(
        { error: 'User offboarding failed', details: error.message },
        { status: 500 }
      )
    }

    // Return the result with standardized format {ok, mode, reason, at}
    return NextResponse.json({
      ok: true,
      mode: hard_delete ? 'hard_delete' : 'soft_offboard',
      reason: reason,
      at: new Date().toISOString(),
      result: data,
      actor_user_id,
      organization_id
    })

  } catch (error) {
    console.error('Offboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}