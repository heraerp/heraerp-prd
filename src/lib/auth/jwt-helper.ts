/**
 * JWT Helper for HERA Authentication
 * Ensures JWT tokens have proper organization context
 */

import { User } from '@supabase/supabase-js'

export interface HERAJWTPayload {
  sub: string
  organization_id?: string
  entity_id?: string
  role?: string
  app_metadata?: {
    organization_id?: string
    entity_id?: string
    role?: string
  }
}

/**
 * Ensure JWT has proper organization context
 */
export function ensureOrganizationInJWT(user: User | null, organizationId?: string): User | null {
  if (!user || !organizationId) return user

  // Ensure app_metadata exists
  if (!user.app_metadata) {
    user.app_metadata = {}
  }

  // Set organization_id in app_metadata
  user.app_metadata.organization_id = organizationId

  // Also set in user_metadata for compatibility
  if (!user.user_metadata) {
    user.user_metadata = {}
  }
  user.user_metadata.organization_id = organizationId

  return user
}

/**
 * Extract organization ID from JWT claims
 */
export function getOrganizationFromJWT(jwt: any): string | null {
  if (!jwt) return null

  // Check direct claim first
  if (jwt.organization_id) return jwt.organization_id

  // Check app_metadata
  if (jwt.app_metadata?.organization_id) return jwt.app_metadata.organization_id

  // Check user_metadata
  if (jwt.user_metadata?.organization_id) return jwt.user_metadata.organization_id

  return null
}

/**
 * Get entity ID from JWT claims
 */
export function getEntityFromJWT(jwt: any): string | null {
  if (!jwt) return null

  // Check direct claim first
  if (jwt.entity_id) return jwt.entity_id

  // Check app_metadata
  if (jwt.app_metadata?.entity_id) return jwt.app_metadata.entity_id

  // Check user_metadata
  if (jwt.user_metadata?.entity_id) return jwt.user_metadata.entity_id

  return null
}
