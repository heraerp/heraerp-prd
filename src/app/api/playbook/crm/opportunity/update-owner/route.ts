import { NextResponse } from 'next/server'
import { OppUpdateOwnerSchema } from '../../_schemas'
import { updateOpportunityOwner } from '@/lib/playbook/crm/write-service'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = OppUpdateOwnerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const result = await updateOpportunityOwner(parsed.data)
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update owner' }, { status: 500 })
  }
}
