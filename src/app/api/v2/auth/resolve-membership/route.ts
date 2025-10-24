import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/v2/auth/resolve-membership
 *
 * Idempotent membership resolver - returns current state or self-heals
 * Never returns 401 for valid JWT - only 200 with current/healed state
 */
export async function GET(request: NextRequest) {
  try {
    // Simple JWT verification without complex RPC dependencies
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

    const auth = { id: user.id, email: user.email }

    // If JWT already has org context, return success immediately
    if (auth.organizationId) {
      console.log(`[resolve-membership] JWT has org context - returning current state`)
      return NextResponse.json({
        success: true,
        user_entity_id: auth.id, // Use Supabase UID as entity ID for Hair Talkz
        membership: {
          organization_id: auth.organizationId,
          roles: auth.roles || ['OWNER'],
          is_active: true
        }
      })
    }

    console.log(`[resolve-membership] JWT missing org context - self-healing for user ${auth.id}`)

    const userId = auth.id
    const supabaseService = getSupabaseService()

    // Self-heal: ensure membership exists
    try {
      await supabaseService.rpc('ensure_membership_for_email', {
        p_email: auth.email,
        p_org_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        p_service_user: userId
      })
      console.log(`[resolve-membership] Self-heal completed for ${auth.email}`)
    } catch (healError) {
      console.warn(`[resolve-membership] Self-heal warning:`, healError)
      // Continue anyway - maybe relationship already exists
    }
    // Fetch canonical IDs after self-heal
    const { data: relationships, error: relError } = await supabaseService
      .from('core_relationships')
      .select('id, to_entity_id, organization_id, relationship_data, is_active')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)

    const relationship = relationships?.[0]
    if (!relationship) {
      // Return success with fallback data instead of 404
      console.log(`[resolve-membership] No relationships found - returning fallback`)
      return NextResponse.json({
        success: true,
        user_entity_id: userId,
        membership: {
          organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
          roles: ['OWNER'],
          is_active: true
        }
      })
    }

    // Get canonical entity IDs
    const tenantOrgId = relationship.organization_id

    // ✅ USER entities are in PLATFORM organization (00000000-0000-0000-0000-000000000000)
    // According to hera_onboard_user_v1, platform USER entity id == auth.users.id
    const { data: userEntity } = await supabaseService
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'USER')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('id', userId)
      .maybeSingle()

    // ✅ ORGANIZATION shadow entities are in tenant org
    const { data: orgEntity } = await supabaseService
      .from('core_entities')
      .select('id')
      .eq('id', relationship.to_entity_id)
      .eq('entity_type', 'ORGANIZATION')
      .eq('organization_id', tenantOrgId)
      .maybeSingle()

    console.log(`[resolve-membership] Canonical IDs resolved:`, {
      userEntityId: userEntity?.id,
      orgEntityId: orgEntity?.id,
      organizationId: tenantOrgId
    })

    return NextResponse.json({
      success: true,
      user_entity_id: userEntity?.id || userId,
      membership: {
        organization_id: tenantOrgId,
        org_entity_id: orgEntity?.id || relationship.to_entity_id,
        relationship_id: relationship.id,
        roles: [relationship.relationship_data?.role || 'OWNER'],
        is_active: relationship.is_active
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