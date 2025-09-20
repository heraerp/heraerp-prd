import { NextRequest, NextResponse } from 'next/server'
import { runProcedure } from '@/lib/playbook-adapter'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const body = await req.json()
  const { organization_id, patch } = body || {}
  const { section } = await params
  
  if (!organization_id) return NextResponse.json({ error: 'organization_id required'}, { status: 400 })
  
  try {
    const out = await runProcedure('HERA.SALON.CONFIG.UPSERT.V1',
      { organization_id, section, patch },
      { idempotencyKey: req.headers.get('Idempotency-Key') ?? undefined }
    )
    return NextResponse.json({ _mode: 'playbook', success: true, section, version: out?.version ?? null })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to update settings',
      _mode: 'playbook'
    }, { status: 500 })
  }
}