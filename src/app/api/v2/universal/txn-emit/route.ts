import { NextRequest, NextResponse } from 'next/server'
import { preflight } from '@/lib/guardrail'
import { callFunction } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

  // Guardrail checks (JSON Schema validation removed - was using wrong schema for Eventbrite events)
  const checks = preflight(body)
  if (checks.length) {
    return NextResponse.json({ error: 'guardrail_failed', details: checks }, { status: 400 })
  }

  // ✅ DB call: hera_txn_create_v1 for regular transactions (appointments, sales, etc.)
  // Function signature: hera_txn_create_v1(p_header jsonb, p_lines jsonb, p_actor_user_id uuid)
  const p_header = {
    organization_id: body.organization_id,
    transaction_type: body.transaction_type,
    smart_code: body.smart_code,
    transaction_code: body.transaction_number ?? `TXN-${Date.now()}`,
    transaction_date: body.transaction_date ?? new Date().toISOString(),
    source_entity_id: body.source_entity_id ?? null,
    target_entity_id: body.target_entity_id ?? null,
    total_amount: body.total_amount ?? 0,
    transaction_status: body.transaction_status ?? 'draft',
    reference_number: body.reference_number ?? null,
    external_reference: body.external_reference ?? null,
    business_context: body.business_context ?? {},
    metadata: body.metadata ?? {},
    approval_required: body.approval_required ?? false,
    approved_by: body.approved_by ?? null,
    approved_at: body.approved_at ?? null,
    transaction_currency_code: body.transaction_currency_code ?? 'AED',
    base_currency_code: body.base_currency_code ?? 'AED',
    exchange_rate: body.exchange_rate ?? 1.0,
    exchange_rate_date: body.exchange_rate_date ?? null,
    exchange_rate_type: body.exchange_rate_type ?? null,
    fiscal_period_entity_id: body.fiscal_period_entity_id ?? null,
    fiscal_year: body.fiscal_year ?? new Date().getFullYear(),
    fiscal_period: body.fiscal_period ?? new Date().getMonth() + 1,
    posting_period_code: body.posting_period_code ?? null
  }

  const p_lines = body.lines ?? []
  const p_actor_user_id = body.actor_user_id ?? null

  const rpcParams = {
    p_header,
    p_lines,
    p_actor_user_id
  }

  try {
    console.log('[txn-emit] Calling hera_txn_create_v1 with params:', {
      organization_id: p_header.organization_id,
      transaction_type: p_header.transaction_type,
      smart_code: p_header.smart_code,
      total_amount: p_header.total_amount,
      lines_count: p_lines?.length || 0
    })

    const result = await callFunction('hera_txn_create_v1', rpcParams)
    const transaction_id = result?.transaction_id || result

    console.log('[txn-emit] Transaction created successfully:', transaction_id)

    return NextResponse.json(
      {
        api_version: 'v2',
        transaction_id: transaction_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[txn-emit] Database error calling hera_txn_create_v1:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      params: {
        org_id: p_header.organization_id?.substring(0, 8),
        txn_type: p_header.transaction_type,
        smart_code: p_header.smart_code,
        lines_count: p_lines?.length || 0
      }
    })
    return NextResponse.json({
      error: 'database_error',
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    }, { status: 500 })
  }
}
