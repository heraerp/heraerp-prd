import { NextRequest, NextResponse } from 'next/server'
import type { CRMQuery } from '@/lib/playbook/crm/types'

export function parseCRMQuery(req: NextRequest): CRMQuery {
  const sp = req.nextUrl.searchParams
  const orgId = sp.get('orgId') || sp.get('organization_id') || ''
  const owner = sp.get('owner') || undefined
  const stage = sp.getAll('stage').length ? sp.getAll('stage') : (sp.get('stage') || undefined)
  const type = sp.get('type') || undefined
  const status = sp.get('status') || undefined
  const from = sp.get('from') || undefined
  const to = sp.get('to') || undefined
  const q = sp.get('q') || undefined
  const page = sp.get('page') ? parseInt(sp.get('page')!) : undefined
  const pageSize = sp.get('pageSize') ? parseInt(sp.get('pageSize')!) : undefined
  return { orgId, owner, stage, type, status, from, to, q, page, pageSize }
}

export function json(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, init)
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 })
}
