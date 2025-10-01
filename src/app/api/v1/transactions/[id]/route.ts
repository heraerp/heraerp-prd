// GET /api/v1/transactions/:id?include_lines=true|false
import { NextRequest, NextResponse } from 'next/server'
import { callRPC } from '@/lib/universal/supabase'
import { z } from 'zod'

const Params = z.object({ id: z.string().uuid() })

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orgId = req.headers.get('x-hera-org')
  if (!orgId) {
    return NextResponse.json({ error: 'Missing x-hera-org header' }, { status: 400 })
  }

  const { id } = Params.parse(params)
  const { searchParams } = new URL(req.url)
  const includeLines = (searchParams.get('include_lines') ?? 'true') === 'true'

  const { data, error } = await callRPC<any>('hera_txn_read_v1', {
    p_org_id: orgId,
    p_transaction_id: id,
    p_include_lines: includeLines
  })

  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 400 })
  }
  return NextResponse.json(data ?? null)
}
