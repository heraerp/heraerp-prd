import { NextRequest, NextResponse } from 'next/server'
import { parseCRMQuery } from '../../_shared'
import { pipelineSummary } from '@/lib/playbook/crm/service'
import { CRMQuerySchema, PipelineSummarySchema } from '../../_schemas'

export async function GET(req: NextRequest) {
  const q = parseCRMQuery(req)
  const parsed = CRMQuerySchema.safeParse(q)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const result = await pipelineSummary(parsed.data)
  const ok = PipelineSummarySchema.safeParse(result)
  if (!ok.success) return NextResponse.json({ error: ok.error.flatten() }, { status: 500 })
  return NextResponse.json(result)
}
