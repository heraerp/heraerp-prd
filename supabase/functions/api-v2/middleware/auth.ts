// HERA v2.3 API Gateway - Auth Middleware
// Smart Code: HERA.API.V2.MIDDLEWARE.AUTH.v1

import type { MiddlewareFunction, MiddlewareResult, Actor } from '../types/middleware.ts';
import { validateJWT, createServiceRoleClient } from '../lib/supabase-client.ts';
import { getFromCache, setInCache } from '../lib/cache.ts';
import { executeMiddleware } from './chain.ts';

/**
 * Authentication middleware - validates JWT and resolves actor identity
 */
export const authMiddleware: MiddlewareFunction<{ actor: Actor }> = async (req, context) => {
  return executeMiddleware('auth', async () => {
    // 1. Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('401:Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('401:Empty bearer token');
    }

    // 2. Validate JWT with Supabase
    const jwtValidation = await validateJWT(token);
    if (!jwtValidation.valid || !jwtValidation.user) {
      throw new Error(`401:${jwtValidation.error || 'Invalid JWT token'}`);
    }

    const user = jwtValidation.user;

    // 3. Check cache for actor identity (5-minute TTL)
    const cacheKey = `actor_identity:${user.id}`;
    let cachedIdentity = await getFromCache<Actor>(cacheKey);
    
    if (cachedIdentity) {
      console.log(`[${context?.requestId?.slice(0, 8)}] Actor identity cache HIT for ${user.id.slice(0, 8)}`);
      return cachedIdentity;
    }

    // 4. Cache miss - resolve identity via RPC
    console.log(`[${context?.requestId?.slice(0, 8)}] Actor identity cache MISS for ${user.id.slice(0, 8)}, resolving...`);
    
    const supabase = createServiceRoleClient();
    
    const { data: identity, error: identityError } = await supabase
      .rpc('resolve_user_identity_v1', { p_auth_uid: user.id });
    
    if (identityError || !identity) {
      console.error('Identity resolution failed:', identityError);
      throw new Error(`401:User identity not found: ${identityError?.message || 'Unknown error'}`);
    }

    // 5. Build actor object
    const actor: Actor = {
      id: identity.user_entity_id,
      email: identity.email || user.email || '',
      memberships: (identity.memberships || []).map((m: any) => ({
        org_id: m.organization_id,
        roles: Array.isArray(m.role) ? m.role : (m.role ? [m.role] : []),
        is_active: m.is_active ?? true,
        membership_type: m.membership_type || 'MEMBER_OF'
      }))
    };

    // Validate actor has at least one membership
    if (actor.memberships.length === 0) {
      throw new Error('401:Actor has no organization memberships');
    }

    // 6. Cache the resolved identity for 5 minutes
    await setInCache(cacheKey, actor, 300);
    console.log(`[${context?.requestId?.slice(0, 8)}] Cached actor identity for ${user.id.slice(0, 8)}`);

    return actor;
  }, context);
};

/**
 * Extract bearer token from request
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}

/**
 * Check if request has valid auth header format
 */
export function hasValidAuthHeader(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  return !!(authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7);
}