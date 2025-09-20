import { NextRequest, NextResponse } from 'next/server'
import { parseCRMQuery } from '../_shared'
import { listLeads } from '@/lib/playbook/crm/service'
import { CRMQuerySchema, LeadSchema, PageResult } from '../_schemas'

export async function GET(req: NextRequest) {
  const q = parseCRMQuery(req)
  const parsed = CRMQuerySchema.safeParse(q)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const result = await listLeads(parsed.data)
  const shape = PageResult(LeadSchema)
  const ok = shape.safeParse(result)
  if (!ok.success) return NextResponse.json({ error: ok.error.flatten() }, { status: 500 })
  return NextResponse.json(result)
}
