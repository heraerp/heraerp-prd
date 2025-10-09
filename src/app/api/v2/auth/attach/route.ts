import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

/**
 * POST /api/v2/auth/attach
 * Idempotently ensures:
 * - The authenticated user exists as a USER entity in core_entities
 * - The organization exists as an ORG entity in core_entities (id = org id)
 * - A USER_MEMBER_OF_ORG relationship links user -> org entity
 *
 * Notes
 * - Org is derived strictly from JWT. Client cannot supply org.
 * - Smart codes follow universal pattern; values are stable but not validated here.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || !auth.id || !auth.organizationId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const userId = auth.id
  const orgId = auth.organizationId
  const platformOrgId = '00000000-0000-0000-0000-000000000000'

  const supabase = getSupabaseService()

  try {
    // Normalize pre-existing user entity to uppercase type if present
    const { data: preUser } = await supabase
      .from('core_entities')
      .select('id, entity_type')
      .eq('id', userId)
      .eq('organization_id', platformOrgId)
      .maybeSingle()

    if (preUser && preUser.entity_type !== 'USER') {
      const { error: upErr } = await supabase
        .from('core_entities')
        .update({ entity_type: 'USER' })
        .eq('id', userId)
        .eq('organization_id', platformOrgId)
      if (upErr) {
        return NextResponse.json(
          { error: 'normalize_failed', details: upErr.message },
          { status: 500 }
        )
      }
    }

    // Upsert USER entity via RPC to honor all guardrails
    const userName = auth.email?.split('@')[0] || 'User'
    const { data: userUpsert, error: userRpcErr } = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: platformOrgId,
      p_entity_type: 'USER',
      p_entity_name: userName,
      p_smart_code: 'HERA.SYSTEM.USER.ENTITY.PERSON.V1',
      p_entity_id: userId,
      p_entity_code: `USER-${userId.substring(0, 8)}`,
      p_entity_description: null,
      p_parent_entity_id: null,
      p_status: 'active',
      p_tags: null,
      p_smart_code_status: 'ACTIVE',
      p_business_rules: {},
      p_metadata: { email: auth.email },
      p_ai_confidence: 1.0,
      p_ai_classification: null,
      p_ai_insights: {},
      p_attributes: {},
      p_actor_user_id: userId
    })
    if (userRpcErr) {
      // Fallback to direct upsert if RPC not available
      const { error: insErr } = await supabase.from('core_entities').upsert(
        [
          {
            id: userId,
            organization_id: platformOrgId,
            entity_type: 'USER',
            entity_name: userName,
            entity_code: `USER-${userId.substring(0, 8)}`,
            smart_code: 'HERA.SYSTEM.USER.ENTITY.PERSON.V1',
            status: 'active',
            metadata: { email: auth.email }
          }
        ],
        { onConflict: 'id' }
      )
      if (insErr) {
        return NextResponse.json(
          { error: 'user_upsert_failed', details: userRpcErr.message || insErr.message },
          { status: 500 }
        )
      }
    }

    // Ensure ORG entity exists using RPC upsert as well
    const { data: orgRow } = await supabase
      .from('core_organizations')
      .select('organization_name, organization_code')
      .eq('id', orgId)
      .single()

    const { error: orgRpcErr } = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: orgId,
      p_entity_type: 'ORG',
      p_entity_name: orgRow?.organization_name || 'Organization',
      p_smart_code: 'HERA.SYSTEM.ORG.ENTITY.ORGANIZATION.V1',
      p_entity_id: orgId,
      p_entity_code: orgRow?.organization_code || `ORG-${orgId.substring(0, 8)}`,
      p_entity_description: null,
      p_parent_entity_id: null,
      p_status: 'active',
      p_tags: null,
      p_smart_code_status: 'ACTIVE',
      p_business_rules: {},
      p_metadata: {},
      p_ai_confidence: 1.0,
      p_ai_classification: null,
      p_ai_insights: {},
      p_attributes: {},
      p_actor_user_id: userId
    })
    if (orgRpcErr) {
      const { error: orgInsErr } = await supabase.from('core_entities').upsert(
        [
          {
            id: orgId,
            organization_id: orgId,
            entity_type: 'ORG',
            entity_name: orgRow?.organization_name || 'Organization',
            entity_code: orgRow?.organization_code || `ORG-${orgId.substring(0, 8)}`,
            smart_code: 'HERA.SYSTEM.ORG.ENTITY.ORGANIZATION.V1',
            status: 'active'
          }
        ],
        { onConflict: 'id' }
      )
      if (orgInsErr) {
        return NextResponse.json(
          { error: 'org_upsert_failed', details: orgRpcErr.message || orgInsErr.message },
          { status: 500 }
        )
      }
    }

    // Upsert relationship via RPC
    const { error: relRpcErr } = await supabase.rpc('hera_relationship_upsert_v1', {
      p_organization_id: orgId,
      p_from_entity_id: userId,
      p_to_entity_id: orgId,
      p_relationship_type: 'USER_MEMBER_OF_ORG',
      p_smart_code: 'HERA.SYSTEM.USER.REL.MEMBER_OF_ORG.V1',
      p_relationship_direction: 'forward',
      p_relationship_strength: 1,
      p_relationship_data: {},
      p_smart_code_status: 'ACTIVE',
      p_ai_confidence: 1.0,
      p_ai_classification: null,
      p_ai_insights: {},
      p_business_logic: {},
      p_validation_rules: {},
      p_is_active: true,
      p_effective_date: new Date().toISOString(),
      p_expiration_date: null,
      p_actor_user_id: userId
    })
    if (relRpcErr) {
      const { error: relInsErr } = await supabase.from('core_relationships').upsert(
        [
          {
            organization_id: orgId,
            from_entity_id: userId,
            to_entity_id: orgId,
            relationship_type: 'USER_MEMBER_OF_ORG',
            smart_code: 'HERA.SYSTEM.USER.REL.MEMBER_OF_ORG.V1',
            is_active: true
          }
        ],
        { onConflict: 'organization_id,from_entity_id,to_entity_id,relationship_type' }
      )
      if (relInsErr) {
        return NextResponse.json(
          { error: 'relationship_upsert_failed', details: relRpcErr.message || relInsErr.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ ok: true, organization_id: orgId, user_entity_id: userId })
  } catch (e: any) {
    console.error('[auth/attach] error', e)
    return NextResponse.json({ error: 'internal_error', message: e?.message }, { status: 500 })
  }
}
