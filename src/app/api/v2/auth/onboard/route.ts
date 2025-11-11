import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '@/lib/auth/verify-auth'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * HERA User Onboarding API
 * Calls hera_onboard_user_v1 to add user to organization
 * POST /api/v2/auth/onboard
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
      email,
      full_name,
      role = 'USER',
      permissions = [],
      metadata = {}
    } = await request.json()

    // Validate required fields
    if (!actor_user_id || !organization_id || !email) {
      return NextResponse.json(
        { error: 'actor_user_id, organization_id, and email are required' },
        { status: 400 }
      )
    }

    // First, verify actor has permission to onboard users
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
    const canOnboard = actorRoles.includes('ORG_OWNER') || actorRoles.includes('ORG_ADMIN')

    if (!canOnboard) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          details: 'Only ORG_OWNER or ORG_ADMIN can onboard users',
          actor_roles: actorRoles
        },
        { status: 403 }
      )
    }

    // Call HERA onboard RPC
    const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
      p_actor_user_id: actor_user_id,
      p_organization_id: organization_id,
      p_email: email,
      p_full_name: full_name || email.split('@')[0],
      p_role: role,
      p_permissions: permissions,
      p_metadata: metadata
    })

    if (error) {
      console.error('HERA onboard error:', error)
      return NextResponse.json(
        { error: 'User onboarding failed', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user_created: data,
      organization_id,
      role,
      permissions,
      actor_user_id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Onboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}