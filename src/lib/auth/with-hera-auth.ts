import { NextRequest, NextResponse } from 'next/server'
import {
  getEnterpriseAuthContext,
  checkRBAC,
  type EnterpriseAuthContext,
  type GuardOptions
} from '@/lib/auth/enterprise-auth'

type NextHandler = (req: NextRequest, auth: EnterpriseAuthContext) => Promise<Response>

export function withHERAAuth(handler: NextHandler, opts?: GuardOptions) {
  return async (req: NextRequest) => {
    const auth = await getEnterpriseAuthContext(req)
    if (!auth) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    if (opts?.requireOrg && !auth.organizationId) {
      return NextResponse.json({ error: 'org_required' }, { status: 401 })
    }

    const rbac = checkRBAC(auth, opts)
    if (!rbac.ok) {
      return NextResponse.json({ error: 'forbidden', reason: rbac.reason }, { status: 403 })
    }

    return handler(req, auth)
  }
}
