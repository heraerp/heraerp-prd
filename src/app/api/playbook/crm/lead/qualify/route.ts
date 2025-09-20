import { NextResponse } from 'next/server'
import { LeadQualifySchema } from '../../_schemas'
import { qualifyLead } from '@/lib/playbook/crm/write-service'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = LeadQualifySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const result = await qualifyLead(parsed.data)
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to qualify lead' }, { status: 500 })
  }
}
