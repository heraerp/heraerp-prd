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

    const authUserId = user.id
    const userEmail = user.email

    console.log(`[resolve-membership] Resolving membership for auth user ${authUserId} (${userEmail})`)

    const supabaseService = getSupabaseService()

    // ✅ ENTERPRISE FIX: Check auth metadata FIRST (faster + handles hera_onboard_user_v1 users)
    let userEntityId = user.user_metadata?.hera_user_entity_id

    if (userEntityId) {
      console.log(`[resolve-membership] ✅ Found hera_user_entity_id in auth metadata: ${userEntityId}`)
    } else {
      // ✅ FALLBACK: Map auth UID to user entity ID by looking up metadata->supabase_user_id
      console.log(`[resolve-membership] No hera_user_entity_id in auth metadata, looking up USER entity by supabase_user_id...`)
      const { data: userEntities, error: lookupError } = await supabaseService
        .from('core_entities')
        .select('id, entity_name')
        .eq('entity_type', 'USER')
        .contains('metadata', { supabase_user_id: authUserId })
        .limit(1)

      if (lookupError) {
        console.error('[resolve-membership] User entity lookup error:', lookupError)
      }

      // Use user entity ID if found, otherwise fall back to auth UID (direct match case)
      userEntityId = userEntities?.[0]?.id || authUserId

      if (userEntities?.[0]) {
        console.log(`[resolve-membership] ✅ Mapped auth UID to user entity via metadata lookup: ${userEntityId} (${userEntities[0].entity_name})`)
      } else {
        console.log(`[resolve-membership] ⚠️ No USER entity found with supabase_user_id, using auth UID as fallback: ${authUserId}`)
      }
    }

    // ✅ OPTIMIZED: Single RPC call gets ALL organizations with roles and metadata
    const { data: authContext, error: introspectError } = await supabaseService.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: userEntityId
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
      console.log('[resolve-membership] Auth context:', JSON.stringify(authContext, null, 2))
      return NextResponse.json({
        error: 'no_membership',
        message: 'User has no organization memberships'
      }, { status: 404 })
    }

    // ✅ DIAGNOSTIC: Log RAW organizations data from RPC
    console.log('[resolve-membership] 📊 RAW RPC RESPONSE - Organizations:')
    authContext.organizations.forEach((org: any, idx: number) => {
      console.log(`  [${idx + 1}] ${org.name} (${org.code})`)
      console.log(`      Org ID: ${org.id}`)
      console.log(`      Role: ${org.primary_role}`)
      console.log(`      Apps: ${JSON.stringify(org.apps || [])}`)
    })

    // ✅ FIX: Get organization settings to retrieve applications
    console.log('[resolve-membership] 📱 Fetching organization settings for applications...')
    
    const orgIds = authContext.organizations.map((org: any) => org.id)
    const { data: orgsWithSettings, error: settingsError } = await supabaseService
      .from('core_organizations')
      .select('id, settings')
      .in('id', orgIds)
    
    if (settingsError) {
      console.warn('[resolve-membership] Could not fetch org settings:', settingsError)
    }
    
    // Create a map of org ID to settings
    const orgSettingsMap = new Map()
    orgsWithSettings?.forEach(org => {
      orgSettingsMap.set(org.id, org.settings)
    })
    
    // Transform introspect response to match existing API format
    const validOrgs = authContext.organizations.map((org: any) => {
      const settings = orgSettingsMap.get(org.id)
      const apps = settings?.available_apps || []
      
      console.log(`[resolve-membership] Org ${org.name}: ${apps.length} apps from settings`)
      
      return {
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
        org_entity_id: org.id, // Use org ID as fallback
        apps: apps, // ✅ FIX: Use apps from organization settings
        settings: settings // ✅ Include full settings for client use
      }
    })

    const defaultOrg = validOrgs[0] // First organization (sorted by joined_at DESC)

    console.log(`[resolve-membership] ⚡ OPTIMIZED: Single RPC resolved ${validOrgs.length} organization(s) for user ${userEntityId}`)
    console.log(`[resolve-membership] Default org: ${defaultOrg.id} (${defaultOrg.name}) - Role: ${defaultOrg.primary_role}`)

    // ✅ DIAGNOSTIC: Log TRANSFORMED organizations data
    console.log('[resolve-membership] 📊 TRANSFORMED API RESPONSE - Organizations:')
    validOrgs.forEach((org: any, idx: number) => {
      console.log(`  [${idx + 1}] ${org.name} (${org.code})`)
      console.log(`      Org ID: ${org.id}`)
      console.log(`      Role: ${org.primary_role}`)
      console.log(`      Apps: ${JSON.stringify(org.apps || [])}`)
    })

    return NextResponse.json({
      success: true,
      user_id: authUserId, // Auth UID from Supabase auth
      user_entity_id: userEntityId, // USER entity ID from core_entities
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
