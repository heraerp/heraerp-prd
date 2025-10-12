import { NextRequest, NextResponse } from 'next/server'
import { validateEvent, preflight } from '@/lib/guardrail'
import { callFunction } from '@/lib/db'
import { adaptTransactionData } from '@/lib/utils/transaction-field-adapter'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

  // ✅ EMERGENCY FIX: Transform legacy debit_amount/credit_amount to unit_amount
  const adaptedBody = adaptTransactionData(body)

  // JSON Schema validation
  const valid = validateEvent(adaptedBody)
  if (!valid) {
    return NextResponse.json(
      { error: 'schema_validation_failed', details: (validateEvent as any).errors },
      { status: 400 }
    )
  }

  // Guardrail checks
  const checks = preflight(adaptedBody)
  if (checks.length) {
    return NextResponse.json({ error: 'guardrail_failed', details: checks }, { status: 400 })
  }

  // DB call: hera_txn_emit_v1 using direct RPC with adapted data
  const rpcParams = {
    p_organization_id: adaptedBody.organization_id,
    p_transaction_type: adaptedBody.transaction_type,
    p_smart_code: adaptedBody.smart_code,
    p_transaction_number: adaptedBody.transaction_number ?? `TXN-${Date.now()}`, // ✅ Match RPC parameter name
    p_transaction_date: adaptedBody.transaction_date,
    p_source_entity_id: adaptedBody.source_entity_id ?? null,
    p_target_entity_id: adaptedBody.target_entity_id ?? null,
    p_total_amount: adaptedBody.total_amount ?? 0,
    p_transaction_status: adaptedBody.transaction_status ?? 'draft', // ✅ FIXED: Default to 'draft' instead of 'pending'
    p_reference_number: adaptedBody.reference_number ?? null,
    p_external_reference: adaptedBody.external_reference ?? null,
    p_business_context: adaptedBody.business_context ?? {},
    p_metadata: adaptedBody.metadata ?? {},
    p_approval_required: adaptedBody.approval_required ?? false,
    p_approved_by: adaptedBody.approved_by ?? null,
    p_approved_at: adaptedBody.approved_at ?? null,
    p_transaction_currency_code: adaptedBody.transaction_currency_code ?? 'AED',
    p_base_currency_code: adaptedBody.base_currency_code ?? 'AED',
    p_exchange_rate: adaptedBody.exchange_rate ?? 1.0,
    p_exchange_rate_date: adaptedBody.exchange_rate_date ?? null,
    p_exchange_rate_type: adaptedBody.exchange_rate_type ?? null,
    p_fiscal_period_entity_id: adaptedBody.fiscal_period_entity_id ?? null,
    p_fiscal_year: adaptedBody.fiscal_year ?? new Date().getFullYear(),
    p_fiscal_period: adaptedBody.fiscal_period ?? new Date().getMonth() + 1,
    p_posting_period_code: adaptedBody.posting_period_code ?? null,
    p_lines: adaptedBody.lines ?? [], // ✅ Now uses adapted lines with unit_amount
    p_actor_user_id: adaptedBody.actor_user_id ?? null
  }

  try {
    const transaction_id = await callFunction('hera_txn_emit_v1', rpcParams)

    return NextResponse.json(
      {
        api_version: 'v2',
        transaction_id: transaction_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in txn-emit:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
