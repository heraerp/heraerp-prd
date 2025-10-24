import { NextRequest, NextResponse } from 'next/server'
import { validateRelationshipUpsert } from '@/lib/guardrail'
import { verifyAuth, buildActorContext } from '@/lib/auth/verify-auth'
import { getSupabaseService } from '@/lib/supabase-service'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // ✅ HERA v2.2 ACTOR STAMPING: Verify authentication
    const authResult = await verifyAuth(req)
    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, id: userId } = authResult
    const b = await req.json().catch(() => null)
    if (!b) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

    // Ensure organization_id is set from auth context
    b.organization_id = organizationId

    // Guardrail validation
    console.log('[relationship-upsert] 🔍 Validating relationship:', {
      organization_id: b.organization_id,
      from_entity_id: b.from_entity_id,
      to_entity_id: b.to_entity_id,
      relationship_type: b.relationship_type,
      smart_code: b.smart_code,
      full_body: b
    })

    const errs = validateRelationshipUpsert(b)
    if (errs.length) {
      console.error('[relationship-upsert] ❌ Validation failed:', errs)
      return NextResponse.json({ error: 'guardrail_failed', details: errs }, { status: 400 })
    }

    console.log('[relationship-upsert] ✅ Validation passed')

    // ✅ HERA v2.2 ACTOR STAMPING: Build actor context
    const supabase = getSupabaseService()
    const actor = await buildActorContext(supabase, userId, organizationId)

    // Call RPC function directly using Supabase
    const { data: relationship_id, error: rpcError } = await supabase.rpc('hera_relationship_upsert_v1', {
      p_organization_id: b.organization_id,
      p_from_entity_id: b.from_entity_id,
      p_to_entity_id: b.to_entity_id,
      p_relationship_type: b.relationship_type,
      p_smart_code: b.smart_code,
      p_relationship_direction: b.relationship_direction ?? 'forward',
      p_relationship_strength: b.relationship_strength ?? 1,
      p_relationship_data: b.relationship_data ?? {},
      p_smart_code_status: b.smart_code_status ?? 'DRAFT',
      p_ai_confidence: b.ai_confidence ?? 0,
      p_ai_classification: b.ai_classification ?? null,
      p_ai_insights: b.ai_insights ?? {},
      p_business_logic: b.business_logic ?? {},
      p_validation_rules: b.validation_rules ?? {},
      p_is_active: b.is_active ?? true,
      p_effective_date: b.effective_date ?? new Date().toISOString(),
      p_expiration_date: b.expiration_date ?? null,
      p_actor_user_id: actor.actor_user_id // ✅ HERA v2.2 ACTOR STAMPING: Use resolved actor
    })

    if (rpcError) {
      console.error('[relationship-upsert] ❌ RPC error:', rpcError)
      return NextResponse.json(
        { error: 'database_error', message: rpcError.message, details: rpcError },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        api_version: 'v2',
        relationship_id,
        actor_stamped: true, // ✅ Indicates actor stamping was applied
        actor_user_id: actor.actor_user_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in relationship-upsert:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
