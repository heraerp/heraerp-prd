import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/universal/supabase'
import { UuidZ } from '@/lib/universal/guardrails'
import { z } from 'zod'

const ReverseBody = z.object({
  p_reason: z.string().min(1),
  p_user_id: UuidZ,
  p_reversal_date: z.string().datetime().optional()
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transactionId = UuidZ.parse(params.id)
    const orgId = req.headers.get('x-organization-id')
    if (!orgId || !UuidZ.safeParse(orgId).success) {
      return NextResponse.json({ error: 'Missing or invalid organization ID' }, { status: 400 })
    }

    const body = ReverseBody.parse(await req.json())
    const sb = serverSupabase()

    const { data, error } = await sb.rpc('hera_txn_reverse_v1', {
      p_organization_id: orgId,
      p_transaction_id: transactionId,
      ...body
    } as any)

    if (error) throw error
    return NextResponse.json({ reversal_transaction_id: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
