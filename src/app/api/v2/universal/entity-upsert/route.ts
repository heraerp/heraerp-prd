import { NextRequest, NextResponse } from 'next/server'
import { SMARTCODE_REGEX, validateEntityUpsert } from '@/lib/guardrail'
import { selectValue } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

  // Guardrail validation
  const errs = validateEntityUpsert(b)
  if (errs.length)
    return NextResponse.json({ error: 'guardrail_failed', details: errs }, { status: 400 })

  const sql = `
    select hera_entity_upsert_v1(
      $1::uuid, $2::text, $3::text, $4::text,
      $5::uuid, $6::text, $7::text, $8::uuid, $9::text, $10::text[],
      $11::text, $12::jsonb, $13::jsonb, $14::numeric, $15::text, $16::jsonb, $17::jsonb, $18::uuid
    ) as entity_id;
  `
  const params = [
    b.organization_id,
    b.entity_type,
    b.entity_name,
    b.smart_code,
    b.entity_id ?? null,
    b.entity_code ?? null,
    b.entity_description ?? null,
    b.parent_entity_id ?? null,
    b.status ?? 'active',
    b.tags ?? null,
    b.smart_code_status ?? 'DRAFT',
    b.business_rules ?? {},
    b.metadata ?? {},
    b.ai_confidence ?? 0,
    b.ai_classification ?? null,
    b.ai_insights ?? {},
    b.attributes ?? {},
    b.actor_user_id ?? null
  ]

  try {
    const entity_id = await selectValue<string>(sql, params)

    return NextResponse.json(
      {
        api_version: 'v2',
        entity_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in entity-upsert:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
