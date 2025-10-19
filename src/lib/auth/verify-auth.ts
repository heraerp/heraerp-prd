/**
 * Auth verification for API routes
 * - Validates JWT
 * - Resolves allowed orgs via RPC (RLS-safe)
 * - Picks org by precedence: header > jwt > resolved
 * - Ensures chosen org ∈ memberships
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { jwtService, type JWTPayload } from './jwt-service'

export interface AuthUser {
  id: string
  email?: string
  organizationId?: string
  roles?: string[]
  permissions?: string[]
}

export interface ActorContext {
  actor_user_id: string
  organization_id: string
  user_email?: string
  roles?: string[]
}

const ROLE_PERMS: Record<string, string[]> = {
  OWNER: [
    'entities:read',
    'entities:write',
    'relationships:read',
    'relationships:write',
    'transactions:read',
    'transactions:write'
  ],
  MANAGER: ['entities:read', 'entities:write', 'relationships:read', 'transactions:read'],
  STAFF: ['entities:read', 'transactions:read']
}

function expandPermissions(roles: string[]) {
  const set = new Set<string>()
  for (const r of roles) (ROLE_PERMS[r] || []).forEach(p => set.add(p))
  return [...set]
}

function supabaseForToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  )
}

async function withTimeout<T>(p: Promise<T>, ms = 2000): Promise<T> {
  let to: any
  const t = new Promise<never>((_, rej) => {
    to = setTimeout(() => rej(new Error('INTROSPECT_TIMEOUT')), ms)
  })
  try {
    return (await Promise.race([p, t])) as T
  } finally {
    clearTimeout(to)
  }
}

/**
 * Verify authentication from request headers
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)

    // Demo tokens (unchanged)
    if (token === 'demo-token-salon-receptionist') {
      return {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@herasalon.com',
        organizationId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        roles: ['receptionist'],
        permissions: ['read:services', 'write:services']
      }
    }
    if (token === 'demo-token-jewelry-admin') {
      return {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'admin@luxejewelry.com',
        organizationId: '80e6659c-3dfb-4fc8-b13a-70423ac4a9ce',
        roles: ['admin'],
        permissions: ['*']
      }
    }

    // Real JWT validation (signature/exp/etc.)
    const validation = await jwtService.validateToken(token)
    if (!validation.valid || !validation.payload) {
      console.warn('[verifyAuth] Token validation failed:', validation.error)
      return null
    }
    const payload = validation.payload as JWTPayload

    // Resolve identity + memberships via RPC (RLS-safe under user's JWT)
    const sb = supabaseForToken(token)
    const { data: ident } = await withTimeout(sb.rpc('resolve_user_identity_v1'))
    const allowedOrgs: string[] = (ident?.[0]?.organization_ids ?? []).filter(Boolean)

    // Choose org by precedence: header > jwt > resolved (but only if ∈ allowed)
    const headerOrg = request.headers.get('x-hera-org-id') || undefined
    const jwtOrg = (payload as any).organization_id as string | undefined

    let organizationId: string | undefined
    let organizationIdSource: 'header' | 'jwt' | 'resolved' | 'none' = 'none'

    if (headerOrg && allowedOrgs.includes(headerOrg)) {
      organizationId = headerOrg
      organizationIdSource = 'header'
    } else if (jwtOrg && allowedOrgs.includes(jwtOrg)) {
      organizationId = jwtOrg
      organizationIdSource = 'jwt'
    } else if (allowedOrgs.length) {
      organizationId = allowedOrgs[0]
      organizationIdSource = 'resolved'
    }

    // No valid org membership → unauthorized (enforce org-scoping invariant)
    if (!organizationId) {
      console.warn('[verifyAuth] No valid org membership', {
        userId: payload.sub,
        jwtOrg,
        headerOrg,
        allowedOrgs
      })
      return null
    }

    // Roles within chosen org
    let roles: string[] = []
    try {
      const { data: roleArr } = await withTimeout(
        sb.rpc('resolve_user_roles_in_org', { p_org: organizationId })
      )
      // Handle different possible return formats from RPC
      if (Array.isArray(roleArr) && roleArr.length > 0) {
        roles = roleArr
          .map((r: any) => {
            if (typeof r === 'string') return r.toUpperCase()
            if (r && typeof r.role_name === 'string') return r.role_name.toUpperCase()
            return null
          })
          .filter(Boolean)
      } else {
        // Fallback: get role directly from relationship data
        const { data: relationship } = await sb
          .from('core_relationships')
          .select('relationship_data')
          .eq('from_entity_id', payload.sub)
          .eq('to_entity_id', organizationId)
          .eq('relationship_type', 'MEMBER_OF')
          .eq('is_active', true)
          .maybeSingle()
        
        if (relationship?.relationship_data?.role) {
          roles = [relationship.relationship_data.role.toUpperCase()]
        }
      }
    } catch (e) {
      console.warn('[verifyAuth] resolve_user_roles_in_org failed:', e)
      roles = []
    }

    const permissions = expandPermissions(roles)

    console.log('[verifyAuth] Token validated successfully:', {
      userId: payload.sub,
      email: (payload as any).email,
      organizationId,
      organizationIdSource,
      hasOrganizationId: !!organizationId,
      roles,
      allowedOrgs
    })

    return {
      id: payload.sub,
      email: (payload as any).email,
      organizationId,
      roles,
      permissions
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

/**
 * Require authentication for an API route
 */
export function requireAuth(handler: (req: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (req: NextRequest) => {
    const user = await verifyAuth(req)
    if (!user) return new Response('Unauthorized', { status: 401 })
    return handler(req, user)
  }
}

/**
 * Build actor context for HERA v2.2 actor stamping
 * Ensures USER entity exists and returns actor_user_id for stamping
 */
export async function buildActorContext(
  supabase: any,
  supabaseUserId: string,
  organizationId?: string
): Promise<ActorContext> {
  try {
    console.log('[buildActorContext] 🔍 Building actor context for:', {
      supabaseUserId,
      organizationId
    })

    // Try to resolve user identity via RPC first
    const { data: ident, error: identError } = await withTimeout(supabase.rpc('resolve_user_identity_v1'))

    if (identError) {
      console.error('[buildActorContext] ❌ RPC resolve_user_identity_v1 failed:', identError)
    }

    console.log('[buildActorContext] 📊 RPC response:', {
      hasData: !!ident,
      isArray: Array.isArray(ident),
      length: Array.isArray(ident) ? ident.length : 0,
      firstItem: ident?.[0]
    })

    const userContext = ident?.[0]

    if (userContext?.user_entity_id) {
      console.log('[buildActorContext] ✅ USER entity found:', {
        user_entity_id: userContext.user_entity_id,
        email: userContext.email,
        organization_ids: userContext.organization_ids
      })

      return {
        actor_user_id: userContext.user_entity_id,
        organization_id: organizationId || userContext.organization_ids?.[0],
        user_email: userContext.email,
        roles: userContext.roles || []
      }
    }

    // Fallback: Use Supabase user ID as actor_user_id
    // This handles cases where USER entity might not exist yet
    console.warn('[buildActorContext] ⚠️ No USER entity found, using Supabase ID as fallback:', {
      supabaseUserId,
      organizationId
    })

    return {
      actor_user_id: supabaseUserId,
      organization_id: organizationId || '',
      user_email: undefined,
      roles: []
    }
  } catch (error) {
    console.error('[buildActorContext] ❌ Error building actor context:', error)

    // Ultimate fallback
    console.warn('[buildActorContext] ⚠️ Using ultimate fallback - Supabase ID:', supabaseUserId)

    return {
      actor_user_id: supabaseUserId,
      organization_id: organizationId || '',
      user_email: undefined,
      roles: []
    }
  }
}
