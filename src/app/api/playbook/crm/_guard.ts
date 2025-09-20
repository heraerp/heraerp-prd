import { NextResponse } from 'next/server'

export function badRequest(error: unknown) {
  return NextResponse.json({ ok: false, error }, { status: 400 })
}

export function serverError(error: unknown) {
  return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
}

export function assertOrgSmart(body: any) {
  if (!body?.orgId) throw new Error('Missing orgId')
  const sc = body?.smart_code
  if (!sc || !/^HERA\.CRM\.[A-Z0-9._]+\.v\d+$/i.test(sc)) {
    throw new Error('Invalid smart_code (expected HERA.CRM.*.v#)')
  }
}
