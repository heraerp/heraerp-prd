import { NextResponse } from 'next/server'
import { LeadCreateSchema } from '../../_schemas'
import { createLead } from '@/lib/playbook/crm/write-service'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = LeadCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const result = await createLead(parsed.data)
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create lead' }, { status: 500 })
  }
}
