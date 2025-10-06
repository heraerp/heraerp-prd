/**
 * HERA Auth MCP Tools
 * Exposes minimal auth operations to MCP for cross-app enforcement.
 */
import { getEnterpriseAuthContext } from '@/lib/auth/enterprise-auth'

export const HERA_AUTH_MCP = {
  async introspect(req: Request) {
    const ctx = await getEnterpriseAuthContext(req)
    if (!ctx) return { ok: false }
    return {
      ok: true,
      user_id: ctx.userId,
      organization_id: ctx.organizationId,
      roles: ctx.roles,
      permissions: ctx.permissions
    }
  }
}

export type HERAAuthMCP = typeof HERA_AUTH_MCP

