import type { Request, Response, NextFunction } from 'express'
import { getEnterpriseAuthContext, type GuardOptions, checkRBAC } from '@/lib/auth/enterprise-auth'

declare global {
  namespace Express {
    interface Request {
      heraAuth?: {
        userId: string
        organizationId: string
        roles: string[]
        permissions: string[]
      }
    }
  }
}

export function heraAuthMiddleware(opts?: GuardOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ctx = await getEnterpriseAuthContext(req as unknown as Request)
    if (!ctx) return res.status(401).json({ error: 'unauthorized' })
    if (opts?.requireOrg && !ctx.organizationId) return res.status(401).json({ error: 'org_required' })
    const rbac = checkRBAC(ctx, opts)
    if (!rbac.ok) return res.status(403).json({ error: 'forbidden', reason: rbac.reason })
    req.heraAuth = {
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      roles: ctx.roles,
      permissions: ctx.permissions
    }
    next()
  }
}

