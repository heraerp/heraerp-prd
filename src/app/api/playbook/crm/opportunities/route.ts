import { NextRequest, NextResponse } from 'next/server'
import { parseCRMQuery } from '../_shared'
import { listOpportunities } from '@/lib/playbook/crm/service'
import { CRMQuerySchema, OpportunitySchema, PageResult } from '../_schemas'

export async function GET(req: NextRequest) {
  try {
    const q = parseCRMQuery(req)
    const parsed = CRMQuerySchema.safeParse(q)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const result = await listOpportunities(parsed.data)
    const shape = PageResult(OpportunitySchema)
    const ok = shape.safeParse(result)
    if (!ok.success) {
      return NextResponse.json({ error: ok.error.flatten() }, { status: 500 })
    }
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[CRM Opportunities] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
