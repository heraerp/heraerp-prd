import { NextRequest, NextResponse } from 'next/server'
import { runProcedure } from '@/lib/playbook-adapter'

export async function GET(req: NextRequest) {
  const org = req.nextUrl.searchParams.get('organization_id')
  const section = req.nextUrl.searchParams.get('section') || undefined
  if (!org) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

  try {
    const out = await runProcedure('HERA.SALON.CONFIG.READ.V1', { organization_id: org, section })
    return NextResponse.json({ _mode: 'playbook', settings: out.settings ?? out })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to read settings',
        _mode: 'playbook'
      },
      { status: 500 }
    )
  }
}
