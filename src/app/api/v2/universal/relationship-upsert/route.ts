import { NextRequest, NextResponse } from 'next/server'
import { SMARTCODE_REGEX, validateRelationshipUpsert } from '@/lib/guardrail'
import { selectValue } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

  // Guardrail validation
  const errs = validateRelationshipUpsert(b)
  if (errs.length)
    return NextResponse.json({ error: 'guardrail_failed', details: errs }, { status: 400 })

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
    b.actor_user_id ?? null
  ]

  try {
    const relationship_id = await selectValue<string>(sql, params)

    return NextResponse.json(
      {
        api_version: 'v2',
        relationship_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in relationship-upsert:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
