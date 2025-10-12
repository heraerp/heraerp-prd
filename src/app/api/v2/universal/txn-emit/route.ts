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

  // DB call: hera_txn_emit_v1 using direct RPC
  const rpcParams = {
    p_organization_id: body.organization_id,
    p_transaction_type: body.transaction_type,
    p_smart_code: body.smart_code,
    p_transaction_code: body.transaction_number ?? `TXN-${Date.now()}`,
    p_transaction_date: body.transaction_date,
    p_source_entity_id: body.source_entity_id ?? null,
    p_target_entity_id: body.target_entity_id ?? null,
    p_total_amount: body.total_amount ?? 0,
    p_transaction_status: body.transaction_status ?? 'draft', // ✅ FIXED: Default to 'draft' instead of 'pending'
    p_reference_number: body.reference_number ?? null,
    p_external_reference: body.external_reference ?? null,
    p_business_context: body.business_context ?? {},
    p_metadata: body.metadata ?? {},
    p_approval_required: body.approval_required ?? false,
    p_approved_by: body.approved_by ?? null,
    p_approved_at: body.approved_at ?? null,
    p_transaction_currency_code: body.transaction_currency_code ?? 'AED',
    p_base_currency_code: body.base_currency_code ?? 'AED',
    p_exchange_rate: body.exchange_rate ?? 1.0,
    p_exchange_rate_date: body.exchange_rate_date ?? null,
    p_exchange_rate_type: body.exchange_rate_type ?? null,
    p_fiscal_period_entity_id: body.fiscal_period_entity_id ?? null,
    p_fiscal_year: body.fiscal_year ?? new Date().getFullYear(),
    p_fiscal_period: body.fiscal_period ?? new Date().getMonth() + 1,
    p_posting_period_code: body.posting_period_code ?? null,
    p_lines: body.lines ?? [],
    p_actor_user_id: body.actor_user_id ?? null
  }

  try {
    console.log('[txn-emit] Calling hera_txn_emit_v1 with params:', {
      organization_id: rpcParams.p_organization_id,
      transaction_type: rpcParams.p_transaction_type,
      smart_code: rpcParams.p_smart_code,
      total_amount: rpcParams.p_total_amount,
      lines_count: rpcParams.p_lines?.length || 0
    })

    const transaction_id = await callFunction('hera_txn_emit_v1', rpcParams)

    console.log('[txn-emit] Transaction created successfully:', transaction_id)

    return NextResponse.json(
      {
        api_version: 'v2',
        transaction_id: transaction_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[txn-emit] Database error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      params: {
        org_id: rpcParams.p_organization_id?.substring(0, 8),
        txn_type: rpcParams.p_transaction_type,
        smart_code: rpcParams.p_smart_code
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
