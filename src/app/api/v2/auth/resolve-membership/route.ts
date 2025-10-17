import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

/**
 * GET /api/v2/auth/resolve-membership
 * 
 * Resolves user's MEMBER_OF relationship using service role
 * This bypasses RLS issues while maintaining security through JWT validation
 */
export async function GET(request: NextRequest) {
  // Verify JWT first (no org required since we're resolving membership)
  const auth = await verifyAuth(request)
  if (!auth || !auth.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const userId = auth.id
  const supabase = getSupabaseService()

  try {
    // Use service role to lookup MEMBER_OF relationship with full details
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('id, to_entity_id, organization_id, relationship_data, is_active, from_entity_id, relationship_type')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .maybeSingle()

    if (relError) {
      console.error('[resolve-membership] Database error:', relError)
      return NextResponse.json({ error: 'database_error' }, { status: 500 })
    }

    if (!relationship) {
      return NextResponse.json({ 
        error: 'no_membership',
        message: 'No active MEMBER_OF relationship found'
      }, { status: 404 })
    }

    // Get the USER entity from the PLATFORM organization (HERA architecture)
    const tenantOrgId = relationship.organization_id
    const platformOrgId = '00000000-0000-0000-0000-000000000000'
    console.log(`[resolve-membership] Looking for USER entity in platform org: ${platformOrgId}`)
    
    // USER entities exist in platform organization only
    const { data: userEntity, error: userEntityError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, metadata')
      .eq('entity_type', 'USER')
      .eq('organization_id', platformOrgId)
      .eq('id', userId)
      .maybeSingle()
      
    console.log(`[resolve-membership] USER entity lookup result:`, { userEntity, userEntityError })

    if (!userEntity) {
      return NextResponse.json({ 
        error: 'user_entity_not_found',
        message: 'USER entity not found in tenant organization'
      }, { status: 404 })
    }

    // Get the ORG entity ID from tenant (relationship.to_entity_id should be the ORG entity)
    const { data: orgEntity, error: orgEntityError } = await supabase
      .from('core_entities')
      .select('id, entity_type')
      .eq('id', relationship.to_entity_id)
      .eq('entity_type', 'ORG')
      .eq('organization_id', tenantOrgId)
      .maybeSingle()

    console.log(`[resolve-membership] ORG entity lookup result:`, { orgEntity, orgEntityError })

    // Return canonical HERA v2.2 entity IDs
    return NextResponse.json({
      success: true,
      user_entity_id: userEntity.id,  // ✅ USER entity id in tenant
      membership: {
        organization_id: relationship.organization_id,     // tenant org uuid (row id)
        org_entity_id: orgEntity?.id || relationship.to_entity_id,  // ✅ ORG entity id in tenant
        relationship_id: relationship.id,                  // for audit trace
        relationship_type: relationship.relationship_type,
        roles: [relationship.relationship_data?.role || 'USER'],
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