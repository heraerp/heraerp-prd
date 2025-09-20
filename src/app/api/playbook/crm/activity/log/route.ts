import { NextResponse } from 'next/server'
import { ActivityLogSchema } from '../../_schemas'
import { logActivity } from '@/lib/playbook/crm/write-service'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = ActivityLogSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const result = await logActivity(parsed.data)
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to log activity' }, { status: 500 })
  }
}
