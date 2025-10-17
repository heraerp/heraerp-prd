import { NextRequest, NextResponse } from 'next/server'
import { preflight } from '@/lib/guardrail'
import { callFunction } from '@/lib/db'
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
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

    // ✅ HERA v2.2 ACTOR STAMPING: Build actor context
    const supabase = getSupabaseService()
    const actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[txn-emit] Processing transaction with actor context:', {
      user_id: userId?.substring(0, 8),
      organization_id: organizationId?.substring(0, 8),
      actor_user_id: actor?.actor_user_id?.substring(0, 8),
      transaction_type: body.transaction_type
    })

    // Guardrail checks
    const checks = preflight(body)
    if (checks.length) {
      return NextResponse.json({ error: 'guardrail_failed', details: checks }, { status: 400 })
    }

    // Prepare transaction payload for HERA v2.2
    const transactionPayload = {
      organization_id: organizationId,
      transaction_type: body.transaction_type,
      smart_code: body.smart_code,
      transaction_number: body.transaction_number ?? `TXN-${Date.now()}`,
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

    const linesPayload = body.lines ?? []

    console.log('[txn-emit] Calling hera_transactions_post_v2 with actor stamping:', {
      transaction_type: transactionPayload.transaction_type,
      total_amount: transactionPayload.total_amount,
      lines_count: linesPayload.length,
      actor_user_id: actor.actor_user_id
    })

    const { data: result, error } = await supabase.rpc('hera_transactions_post_v2', {
      p_transaction: transactionPayload,
      p_lines: linesPayload,
      p_actor_user_id: actor.actor_user_id
    })

    if (error || !result?.success) {
      console.error('[txn-emit] Database error:', error || result)
      throw new Error(error?.message || result?.error || 'Transaction posting failed')
    }

    console.log('[txn-emit] Transaction created successfully with actor stamping:', result.transaction_id)

    return NextResponse.json(
      {
        api_version: 'v2',
        transaction_id: result.transaction_id,
        actor_stamped: true, // ✅ Indicates actor stamping was applied
        actor_user_id: actor.actor_user_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[txn-emit] Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      params: {
        org_id: organizationId?.substring(0, 8),
        user_id: userId?.substring(0, 8),
        actor_user_id: actor?.actor_user_id?.substring(0, 8)
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