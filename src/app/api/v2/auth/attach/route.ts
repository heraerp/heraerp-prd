import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

/**
 * POST /api/v2/auth/attach
 * Idempotently ensures:
 * - The authenticated user exists as a USER entity in core_entities
 * - The organization exists as an ORG entity in core_entities (id = org id)
 * - A MEMBER_OF relationship links user -> org entity
 *
 * Notes
 * - Org is derived strictly from JWT. Client cannot supply org.
 * - Smart codes follow universal pattern; values are stable but not validated here.
 */
export async function POST(request: NextRequest) {
  console.log('[auth/attach] Starting attach process')
  
  const auth = await verifyAuth(request)
  if (!auth || !auth.id || !auth.organizationId) {
    console.log('[auth/attach] Auth verification failed:', { auth })
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const userId = auth.id
  const orgId = auth.organizationId
  const platformOrgId = '00000000-0000-0000-0000-000000000000'

  console.log('[auth/attach] Processing for user:', { userId, orgId, platformOrgId })

  const supabase = getSupabaseService()

  try {
    // HERA v2.2 FIX: Create USER entity in TENANT organization, not platform
    // This aligns with canonical entity ID resolution architecture
    console.log('[auth/attach] Creating/updating user entity in tenant org:', orgId)
    const userName = auth.email?.split('@')[0] || 'User'
    
    // Check if USER entity already exists in tenant org
    const { data: existingUser } = await supabase
      .from('core_entities')
      .select('id')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
      .maybeSingle()

    let userInsErr: any = null
    
    if (existingUser) {
      // Update existing USER entity
      const { error } = await supabase
        .from('core_entities')
        .update({
          entity_name: userName,
          metadata: { 
            email: auth.email,
            supabase_uid: userId // ✅ Add supabase_uid for lookup
          },
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('organization_id', orgId)
      userInsErr = error
    } else {
      // Create new USER entity
      const { error } = await supabase.from('core_entities').insert([
        {
          id: userId,
          organization_id: orgId, // ✅ FIXED: Store in tenant org, not platform
          entity_type: 'USER',
          entity_name: userName,
          entity_code: `USER-${userId.substring(0, 8)}`,
          smart_code: 'HERA.SYSTEM.USER.ENTITY.PERSON.V1',
          metadata: { 
            email: auth.email,
            supabase_uid: userId // ✅ Add supabase_uid for lookup
          },
          // HERA v2.2 audit fields (required)
          created_by: userId,
          updated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      userInsErr = error
    }
    if (userInsErr) {
      console.error('[auth/attach] User entity upsert failed:', userInsErr)
      return NextResponse.json(
        { error: 'user_upsert_failed', details: userInsErr.message },
        { status: 500 }
      )
    }
    console.log('[auth/attach] User entity created/updated successfully')

    // Ensure ORG entity exists with proper HERA v2.2 audit fields
    console.log('[auth/attach] Getting organization data')
    const { data: orgRow, error: orgRowError } = await supabase
      .from('core_organizations')
      .select('organization_name, organization_code')
      .eq('id', orgId)
      .single()

    if (orgRowError) {
      console.error('[auth/attach] Failed to get organization data:', orgRowError)
      return NextResponse.json(
        { error: 'org_lookup_failed', details: orgRowError.message },
        { status: 500 }
      )
    }

    console.log('[auth/attach] Creating/updating organization entity')
    const { error: orgInsErr } = await supabase.from('core_entities').upsert(
      [
        {
          id: orgId,
          organization_id: orgId,
          entity_type: 'ORGANIZATION',
          entity_name: orgRow?.organization_name || 'Organization',
          entity_code: orgRow?.organization_code || `ORG-${orgId.substring(0, 8)}`,
          smart_code: 'HERA.SYSTEM.ORG.ENTITY.ORGANIZATION.V1',
          // HERA v2.2 audit fields (required)
          created_by: userId,
          updated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      { onConflict: 'id' }
    )
    if (orgInsErr) {
      console.error('[auth/attach] Organization entity upsert failed:', orgInsErr)
      return NextResponse.json(
        { error: 'org_upsert_failed', details: orgInsErr.message },
        { status: 500 }
      )
    }
    console.log('[auth/attach] Organization entity created/updated successfully')

    // Upsert MEMBER_OF relationship with proper HERA v2.2 audit fields
    console.log('[auth/attach] Creating/updating MEMBER_OF relationship')
    
    // First check if relationship already exists
    const { data: existingRel } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('organization_id', orgId)
      .eq('from_entity_id', userId)
      .eq('to_entity_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    let relInsErr: any = null
    
    if (existingRel) {
      // Update existing relationship
      const { error } = await supabase
        .from('core_relationships')
        .update({
          relationship_data: { role: 'OWNER', permissions: ['*'] },
          is_active: true,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRel.id)
      relInsErr = error
    } else {
      // Create new relationship
      const { error } = await supabase.from('core_relationships').insert([
        {
          organization_id: orgId,
          from_entity_id: userId,
          to_entity_id: orgId,
          relationship_type: 'MEMBER_OF',
          smart_code: 'HERA.CORE.USER.REL.MEMBER_OF.V1',
          relationship_data: { role: 'OWNER', permissions: ['*'] },
          is_active: true,
          // HERA v2.2 audit fields (required)
          created_by: userId,
          updated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      relInsErr = error
    }
    if (relInsErr) {
      console.error('[auth/attach] Relationship upsert failed:', relInsErr)
      return NextResponse.json(
        { error: 'relationship_upsert_failed', details: relInsErr.message },
        { status: 500 }
      )
    }
    console.log('[auth/attach] MEMBER_OF relationship created/updated successfully')

    console.log('[auth/attach] Attach process completed successfully')
    return NextResponse.json({ ok: true, organization_id: orgId, user_entity_id: userId })
  } catch (e: any) {
    console.error('[auth/attach] error', e)
    return NextResponse.json({ error: 'internal_error', message: e?.message }, { status: 500 })
  }
}
