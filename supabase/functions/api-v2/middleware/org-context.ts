// HERA v2.3 API Gateway - Organization Context Middleware
// Smart Code: HERA.API.V2.MIDDLEWARE.ORG_CONTEXT.v1

import type { 
  MiddlewareFunction, 
  Actor, 
  OrgContext, 
  RequestContext 
} from '../types/middleware.ts';
import { executeMiddleware } from './chain.ts';

/**
 * Organization context middleware - resolves organization context from headers or actor memberships
 */
export const orgContextMiddleware: MiddlewareFunction<{ orgContext: OrgContext }> = async (req, context) => {
  return executeMiddleware('org-context', async () => {
    const actor = (context as Partial<RequestContext>)?.actor;
    if (!actor) {
      throw new Error('500:Auth middleware must run before org-context middleware');
    }

    // 1. Try X-Organization-Id header first (explicit organization selection)
    const headerOrgId = req.headers.get('X-Organization-Id');
    
    if (headerOrgId) {
      // Validate that actor is a member of the specified organization
      const membership = actor.memberships.find(m => m.org_id === headerOrgId);
      
      if (!membership) {
        throw new Error(
          `403:Actor ${actor.id.slice(0, 8)} is not a member of organization ${headerOrgId.slice(0, 8)}`
        );
      }

      if (!membership.is_active) {
        throw new Error(
          `403:Actor membership in organization ${headerOrgId.slice(0, 8)} is inactive`
        );
      }

      console.log(`[${context?.requestId?.slice(0, 8)}] Using explicit org from header: ${headerOrgId.slice(0, 8)}`);
      
      return {
        org_id: headerOrgId,
        roles: membership.roles,
        org_name: undefined // Could be resolved if needed
      };
    }

    // 2. No explicit header - use default (first active membership)
    const activeMemberships = actor.memberships.filter(m => m.is_active);
    
    if (activeMemberships.length === 0) {
      throw new Error('400:Actor has no active organization memberships');
    }

    // Use first active membership as default
    const defaultMembership = activeMemberships[0];
    
    console.log(`[${context?.requestId?.slice(0, 8)}] Using default org: ${defaultMembership.org_id.slice(0, 8)} (${activeMemberships.length} available)`);

    return {
      org_id: defaultMembership.org_id,
      roles: defaultMembership.roles,
      org_name: undefined
    };
  }, context);
};

/**
 * Validate that a specific organization ID is accessible by the actor
 */
export function validateOrgAccess(actor: Actor, orgId: string): boolean {
  return actor.memberships.some(m => 
    m.org_id === orgId && m.is_active
  );
}

/**
 * Get all accessible organizations for an actor
 */
export function getAccessibleOrgs(actor: Actor): Array<{ org_id: string; roles: string[] }> {
  return actor.memberships
    .filter(m => m.is_active)
    .map(m => ({
      org_id: m.org_id,
      roles: m.roles
    }));
}

/**
 * Check if actor has specific role in organization
 */
export function hasRole(orgContext: OrgContext, role: string): boolean {
  return orgContext.roles.includes(role);
}

/**
 * Check if actor has any of the specified roles in organization
 */
export function hasAnyRole(orgContext: OrgContext, roles: string[]): boolean {
  return roles.some(role => orgContext.roles.includes(role));
}

/**
 * Check if actor is admin in the organization
 */
export function isAdmin(orgContext: OrgContext): boolean {
  return hasAnyRole(orgContext, ['admin', 'owner', 'super_admin']);
}