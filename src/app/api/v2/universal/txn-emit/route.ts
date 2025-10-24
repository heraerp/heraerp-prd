import { NextRequest, NextResponse } from 'next/server'
import { preflight } from '@/lib/guardrail'
import { callFunction } from '@/lib/db'
import { verifyAuth, buildActorContext } from '@/lib/auth/verify-auth'
import { getSupabaseService } from '@/lib/supabase-service'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Declare variables at function scope so they're available in catch block
  let organizationId: string | undefined
  let userId: string | undefined
  let actor: any

  try {
    // ✅ HERA v2.2 ACTOR STAMPING: Verify authentication
    const authResult = await verifyAuth(req)
    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    organizationId = authResult.organizationId
    userId = authResult.id
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

    // ✅ HERA v2.2 ACTOR STAMPING: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

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
      // ✅ FIX: RPC expects transaction_code (not transaction_number)
      transaction_code: body.transaction_code || body.transaction_number || `TXN-${Date.now()}`,
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
      approved_at: body.approved_at ?? null
      // ✅ FIX: Remove currency fields - currencies table doesn't exist
      // transaction_currency_code: body.transaction_currency_code ?? 'AED',
      // base_currency_code: body.base_currency_code ?? 'AED',
      // exchange_rate: body.exchange_rate ?? 1.0,
      // exchange_rate_date: body.exchange_rate_date ?? null,
      // exchange_rate_type: body.exchange_rate_type ?? null,
      // fiscal_period_entity_id: body.fiscal_period_entity_id ?? null,
      // fiscal_year: body.fiscal_year ?? new Date().getFullYear(),
      // fiscal_period: body.fiscal_period ?? new Date().getMonth() + 1,
      // posting_period_code: body.posting_period_code ?? null
    }

    const linesPayload = body.lines ?? []

    console.log('[txn-emit] Calling hera_txn_create_v1 with actor stamping:', {
      transaction_type: transactionPayload.transaction_type,
      total_amount: transactionPayload.total_amount,
      lines_count: linesPayload.length,
      actor_user_id: actor.actor_user_id
    })

    // ✅ FIX: Use correct RPC function signature with only 3 parameters
    // Database hint: public.hera_txn_create_v1(p_actor_user_id, p_header, p_lines)
    const { data: result, error } = await supabase.rpc('hera_txn_create_v1', {
      p_actor_user_id: actor.actor_user_id,
      p_header: transactionPayload,
      p_lines: linesPayload
    })

    // ✅ FIX: Handle response correctly - check for RPC error OR ok:false in result
    if (error) {
      console.error('[txn-emit] RPC error:', error)
      throw new Error(error?.message || 'Transaction RPC call failed')
    }

    if (!result || result.ok === false) {
      console.error('[txn-emit] Transaction failed:', result)
      throw new Error(result?.error || 'Transaction posting failed')
    }

    console.log('[txn-emit] Transaction created successfully with actor stamping:', {
      transaction_id: result.transaction_id,
      status: result.status,
      lines_count: result.lines_count
    })

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