import { NextRequest, NextResponse } from 'next/server'
import { parseCRMQuery } from '../_shared'
import { funnel } from '@/lib/playbook/crm/service'
import { CRMQuerySchema, FunnelSchema } from '../_schemas'

export async function GET(req: NextRequest) {
  const q = parseCRMQuery(req)
  const parsed = CRMQuerySchema.safeParse(q)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const result = await funnel(parsed.data)
  const ok = FunnelSchema.safeParse(result)
  if (!ok.success) return NextResponse.json({ error: ok.error.flatten() }, { status: 500 })
  return NextResponse.json(result)
}
