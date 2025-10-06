import { NextRequest, NextResponse } from 'next/server'
import { getEnterpriseAuthContext } from '@/lib/auth/enterprise-auth'

export async function GET(req: NextRequest) {
  const ctx = await getEnterpriseAuthContext(req)
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({
    ok: true,
    user_id: ctx.userId,
    email: ctx.email,
    organization_id: ctx.organizationId,
    roles: ctx.roles,
    permissions: ctx.permissions
  })
}

