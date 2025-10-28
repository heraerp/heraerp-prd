import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/v2/auth/resolve-membership
 *
 * OPTIMIZED: Uses hera_auth_introspect_v1 RPC for single-call authentication
 * Returns user's organization membership with complete role context
 *
 * Performance: Single RPC call vs. O(N) calls per organization
 */
export async function GET(request: NextRequest) {
  try {
    // JWT verification
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify token with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('[resolve-membership] Auth failed:', authError)
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const userEmail = user.email

    console.log(`[resolve-membership] Resolving membership for user ${userId} (${userEmail})`)

    const supabaseService = getSupabaseService()

    // ✅ OPTIMIZED: Single RPC call gets ALL organizations with roles and metadata
    const { data: authContext, error: introspectError } = await supabaseService.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: userId
    })

    if (introspectError) {
      console.error('[resolve-membership] Introspect error:', introspectError)
      return NextResponse.json({
        error: 'database_error',
        message: 'Failed to resolve user authentication context'
      }, { status: 500 })
    }

    if (!authContext || !authContext.organizations || authContext.organizations.length === 0) {
      console.log('[resolve-membership] No active memberships found')
      return NextResponse.json({
        error: 'no_membership',
        message: 'User has no organization memberships'
      }, { status: 404 })
    }

    // Transform introspect response to match existing API format
    const validOrgs = authContext.organizations.map((org: any) => ({
      id: org.id,
      code: org.code,
      name: org.name,
      status: org.status,
      joined_at: org.joined_at,
      primary_role: org.primary_role,
      roles: org.roles,
      is_owner: org.is_owner,
      is_admin: org.is_admin,
      relationship_id: null, // Not available in introspect, but not critical
      org_entity_id: org.id // Use org ID as fallback
    }))

    const defaultOrg = validOrgs[0] // First organization (sorted by joined_at DESC)

    console.log(`[resolve-membership] ⚡ OPTIMIZED: Single RPC resolved ${validOrgs.length} organization(s) for user ${userId}`)
    console.log(`[resolve-membership] Default org: ${defaultOrg.id} (${defaultOrg.name}) - Role: ${defaultOrg.primary_role}`)

    return NextResponse.json({
      success: true,
      user_id: userId,
      user_entity_id: userId, // Platform USER entity id = auth.users.id
      organization_count: authContext.organization_count,
      default_organization_id: authContext.default_organization_id,
      organizations: validOrgs,
      is_platform_admin: authContext.is_platform_admin,
      introspected_at: authContext.introspected_at,
      // ✅ Legacy support for existing client code (salon-access page)
      membership: {
        organization_id: defaultOrg.id,
        org_entity_id: defaultOrg.id,
        relationship_id: defaultOrg.relationship_id,
        roles: defaultOrg.roles,
        role: defaultOrg.primary_role,
        primary_role: defaultOrg.primary_role,
        is_active: true,
        is_owner: defaultOrg.is_owner,
        is_admin: defaultOrg.is_admin,
        organization_name: defaultOrg.name // Add for convenience
      }
    })

  } catch (error: any) {
    console.error('[resolve-membership] Unexpected error:', error)
    return NextResponse.json({
      error: 'internal_error',
      message: error.message
    }, { status: 500 })
  }
}
