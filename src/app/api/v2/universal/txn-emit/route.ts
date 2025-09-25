import { NextRequest, NextResponse } from 'next/server'
import { validateEvent, preflight } from '@/lib/guardrail'
import { selectValue } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

  // JSON Schema validation
  const valid = validateEvent(body)
  if (!valid) {
    return NextResponse.json(
      { error: 'schema_validation_failed', details: (validateEvent as any).errors },
      { status: 400 }
    )
  }

  // Guardrail checks
  const checks = preflight(body)
  if (checks.length) {
    return NextResponse.json({ error: 'guardrail_failed', details: checks }, { status: 400 })
  }

  // DB call: hera_txn_emit_v1
  const sql = `
    select hera_txn_emit_v1(
      $1::uuid, $2::text, $3::text, $4::timestamptz,
      $5::uuid, $6::uuid, $7::jsonb, $8::jsonb
    ) as transaction_id;
  `
  const params = [
    body.organization_id,
    body.transaction_type,
    body.smart_code,
    body.transaction_date,
    body.source_entity_id ?? null,
    body.target_entity_id ?? null,
    body.business_context ?? {},
    body.lines ?? []
  ]

  try {
    const transaction_id = await selectValue<string>(sql, params)

    return NextResponse.json(
      {
        api_version: 'v2',
        transaction_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in txn-emit:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
