// GET /api/v1/transactions?...  (query/list)
// POST /api/v1/transactions      (create/emit)
import { NextRequest, NextResponse } from 'next/server'
import { callRPC } from '@/lib/universal/supabase'
import { z } from 'zod'

// ---------- GET: query/list ----------
const Query = z.object({
  transaction_type: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'completed', 'cancelled']).optional(),
  smart_code: z.string().optional(),
  source_entity_id: z.string().uuid().optional(),
  target_entity_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  fiscal_year: z.coerce.number().optional(),
  fiscal_period: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0)
})

export async function GET(req: NextRequest) {
  const orgId = req.headers.get('x-hera-org')
  if (!orgId) {
    return NextResponse.json({ error: 'Missing x-hera-org header' }, { status: 400 })
  }

  const raw = Object.fromEntries(new URL(req.url).searchParams.entries())
  const parsed = Query.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.format() },
      { status: 422 }
    )
  }

  const { data, error } = await callRPC<any>('hera_txn_query_v1', {
    p_org_id: orgId,
    p_filters: parsed.data
  })

  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 400 })
  }
  return NextResponse.json(data ?? [])
}

// ---------- POST: create/emit ----------
const Body = z.object({
  transaction_type: z.string().min(1),
  smart_code: z.string().min(1),
  transaction_date: z.string().datetime(),
  total_amount: z.number(),

  source_entity_id: z.string().uuid().nullable().optional(),
  target_entity_id: z.string().uuid().nullable().optional(),

  // Finance DNA
  transaction_currency_code: z.string().length(3),
  base_currency_code: z.string().length(3).optional(),
  exchange_rate: z.number().positive().optional(),
  exchange_rate_date: z.string().datetime().optional(),
  exchange_rate_type: z.string().optional(),

  reference_number: z.string().optional().nullable(),
  status: z.enum(['draft', 'pending', 'approved', 'completed', 'cancelled']).optional(),
  fiscal_year: z.number().optional(),
  fiscal_period: z.number().optional(),
  metadata: z.any().optional().nullable(),

  line_items: z
    .array(
      z.object({
        smart_code: z.string(),
        line_number: z.number().int().min(1),
        line_type: z.string().min(1),
        description: z.string().optional(),
        quantity: z.number().optional(),
        unit_amount: z.number().optional(),
        line_amount: z.number(),
        entity_id: z.string().uuid().optional(),
        account_id: z.string().uuid().optional(),
        tax_code: z.string().optional(),
        tax_amount: z.number().optional(),
        discount_amount: z.number().optional()
      })
    )
    .optional()
})

export async function POST(req: NextRequest) {
  const orgId = req.headers.get('x-hera-org')
  if (!orgId) {
    return NextResponse.json({ error: 'Missing x-hera-org header' }, { status: 400 })
  }

  const json = await req.json()
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.format() },
      { status: 422 }
    )
  }
  const b = parsed.data

  const params = {
    p_organization_id: orgId,
    p_transaction_type: b.transaction_type,
    p_smart_code: b.smart_code,
    p_transaction_code: null,
    p_transaction_date: b.transaction_date,
    p_source_entity_id: b.source_entity_id ?? null,
    p_target_entity_id: b.target_entity_id ?? null,
    p_total_amount: b.total_amount,
    p_transaction_status: b.status ?? 'pending',
    p_reference_number: b.reference_number ?? null,
    p_external_reference: null,
    p_business_context: {},
    p_metadata: b.metadata ?? {},
    p_approval_required: false,
    p_approved_by: null,
    p_approved_at: null,
    // Finance DNA
    p_transaction_currency_code: b.transaction_currency_code,
    p_base_currency_code: b.base_currency_code ?? null,
    p_exchange_rate: b.exchange_rate ?? null,
    p_exchange_rate_date: b.exchange_rate_date ?? null,
    p_exchange_rate_type: b.exchange_rate_type ?? null,
    // Fiscal
    p_fiscal_period_entity_id: null,
    p_fiscal_year: b.fiscal_year ?? null,
    p_fiscal_period: b.fiscal_period ?? null,
    p_posting_period_code: null,
    // Lines & actor
    p_lines: (b.line_items ?? []) as any,
    p_actor_user_id: null
  }

  const { data, error } = await callRPC<string>('hera_txn_emit_v1', params)
  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 400 })
  }
  // hera_txn_emit_v1 returns the new transaction UUID
  return NextResponse.json({ id: data }, { status: 201 })
}
