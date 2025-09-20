import { NextResponse } from 'next/server'
import { OppUpdateStageSchema } from '../../_schemas'
import { updateOpportunityStage } from '@/lib/playbook/crm/write-service'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = OppUpdateStageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const result = await updateOpportunityStage(parsed.data)
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update stage' }, { status: 500 })
  }
}
