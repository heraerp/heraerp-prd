import { NextRequest } from 'next/server'
import { jwtService, type JWTPayload } from '@/lib/auth/jwt-service'

export type Role = string
export type Permission = string

export interface EnterpriseAuthContext {
  userId: string
  email?: string
  organizationId: string
  roles: Role[]
  permissions: Permission[]
  payload: JWTPayload
}

export interface GuardOptions {
  requireOrg?: boolean
  rolesAny?: Role[]
  rolesAll?: Role[]
  permsAny?: Permission[]
  permsAll?: Permission[]
}

export async function extractToken(request: NextRequest | Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.substring(7)
}

export async function getEnterpriseAuthContext(
  request: NextRequest | Request
): Promise<EnterpriseAuthContext | null> {
  const token = await extractToken(request)
  if (!token) return null
  const validation = await jwtService.validateToken(token)
  if (!validation.valid || !validation.payload) return null
  const p = validation.payload
  const orgId = p.organization_id
  if (!orgId) return null
  return {
    userId: p.sub,
    email: p.email,
    organizationId: orgId,
    roles: p.role ? [p.role] : [],
    permissions: p.permissions || [],
    payload: p
  }
}

function checkAny(haystack: string[], needles?: string[]) {
  if (!needles || needles.length === 0) return true
  return needles.some(n => haystack.includes(n))
}

function checkAll(haystack: string[], needles?: string[]) {
  if (!needles || needles.length === 0) return true
  return needles.every(n => haystack.includes(n))
}

export function checkRBAC(
  ctx: Pick<EnterpriseAuthContext, 'roles' | 'permissions'>,
  opts?: Pick<GuardOptions, 'rolesAny' | 'rolesAll' | 'permsAny' | 'permsAll'>
): { ok: boolean; reason?: string } {
  if (!opts) return { ok: true }
  if (!checkAny(ctx.roles, opts.rolesAny)) return { ok: false, reason: 'missing_required_role' }
  if (!checkAll(ctx.roles, opts.rolesAll)) return { ok: false, reason: 'missing_required_role' }
  if (!checkAny(ctx.permissions, opts.permsAny))
    return { ok: false, reason: 'missing_required_permission' }
  if (!checkAll(ctx.permissions, opts.permsAll))
    return { ok: false, reason: 'missing_required_permission' }
  return { ok: true }
}
