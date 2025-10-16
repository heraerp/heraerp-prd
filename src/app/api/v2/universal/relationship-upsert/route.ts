import { NextRequest, NextResponse } from 'next/server'
import { SMARTCODE_REGEX, validateRelationshipUpsert } from '@/lib/guardrail'
import { selectValue } from '@/lib/db'
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
    const errs = validateRelationshipUpsert(b)
    if (errs.length)
      return NextResponse.json({ error: 'guardrail_failed', details: errs }, { status: 400 })

    // ✅ HERA v2.2 ACTOR STAMPING: Build actor context
    const supabase = getSupabaseService()
    const actor = await buildActorContext(supabase, userId, organizationId)

    const sql = `
      select hera_relationship_upsert_v1(
        $1::uuid, $2::uuid, $3::uuid, $4::text, $5::text,
        $6::text, $7::numeric, $8::jsonb, $9::text, $10::numeric,
        $11::text, $12::jsonb, $13::jsonb, $14::jsonb, $15::boolean,
        $16::timestamptz, $17::timestamptz, $18::uuid
      ) as relationship_id;
    `
    const params = [
      b.organization_id,
      b.from_entity_id,
      b.to_entity_id,
      b.relationship_type,
      b.smart_code,
      b.relationship_direction ?? 'forward',
      b.relationship_strength ?? 1,
      b.relationship_data ?? {},
      b.smart_code_status ?? 'DRAFT',
      b.ai_confidence ?? 0,
      b.ai_classification ?? null,
      b.ai_insights ?? {},
      b.business_logic ?? {},
      b.validation_rules ?? {},
      b.is_active ?? true,
      b.effective_date ?? new Date().toISOString(),
      b.expiration_date ?? null,
      actor.actor_user_id // ✅ HERA v2.2 ACTOR STAMPING: Use resolved actor
    ]

    const relationship_id = await selectValue<string>(sql, params)

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
