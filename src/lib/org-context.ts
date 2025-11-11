/**
 * Organization Context Resolution
 * 
 * Resolves organization context from multiple sources with priority:
 * 1. X-Organization-Id header (explicit request)
 * 2. JWT organization_id claim (token metadata)
 * 3. memberships[0] (first resolved membership)
 * 4. Error if no context found
 */

import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

// Cache organization context for 5 minutes
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface OrganizationContext {
  id: string
  name: string
  settings: Record<string, any>
  ui_overrides: Record<string, any>
}

interface ActorMembership {
  organization_id: string
  organization_name: string
  role: string
  status: 'active' | 'inactive'
}

// Cached org context resolver
export const resolveOrganizationContext = cache(async (
  authToken: string,
  organizationIdHeader?: string
): Promise<OrganizationContext> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    }
  )

  // Priority 1: Explicit header
  if (organizationIdHeader) {
    const { data: org, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name, settings')
      .eq('id', organizationIdHeader)
      .single()

    if (error) {
      throw new Error(`Organization not found: ${organizationIdHeader}`)
    }

    return {
      id: org.id,
      name: org.organization_name,
      settings: org.settings || {},
      ui_overrides: org.settings?.ui_overrides || {}
    }
  }

  // Priority 2 & 3: JWT claim or membership resolution
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  // Check JWT claims first
  const jwtOrgId = user.user_metadata?.organization_id
  if (jwtOrgId) {
    const { data: org, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name, settings')
      .eq('id', jwtOrgId)
      .single()

    if (!error && org) {
      return {
        id: org.id,
        name: org.organization_name,
        settings: org.settings || {},
        ui_overrides: org.settings?.ui_overrides || {}
      }
    }
  }

  // Fall back to membership resolution
  const memberships = await resolveActorMemberships(authToken)
  if (memberships.length === 0) {
    throw new Error('No organization memberships found')
  }

  // Use first active membership
  const activeMembership = memberships.find(m => m.status === 'active') || memberships[0]
  
  const { data: org, error } = await supabase
    .from('core_organizations')
    .select('id, organization_name, settings')
    .eq('id', activeMembership.organization_id)
    .single()

  if (error) {
    throw new Error(`Organization not found: ${activeMembership.organization_id}`)
  }

  return {
    id: org.id,
    name: org.organization_name,
    settings: org.settings || {},
    ui_overrides: org.settings?.ui_overrides || {}
  }
})

// Resolve actor memberships via RPC
export const resolveActorMemberships = async (
  authToken: string
): Promise<ActorMembership[]> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    }
  )

  // Use RPC to resolve actor identity and memberships
  const { data, error } = await supabase.rpc('resolve_user_identity_v1')

  if (error) {
    throw new Error(`Failed to resolve actor identity: ${error.message}`)
  }

  return data?.memberships || []
}

// Validate actor membership in organization
export const validateActorMembership = async (
  authToken: string,
  organizationId: string
): Promise<boolean> => {
  try {
    const memberships = await resolveActorMemberships(authToken)
    return memberships.some(
      m => m.organization_id === organizationId && m.status === 'active'
    )
  } catch (error) {
    console.error('Membership validation failed:', error)
    return false
  }
}

// Extract organization ID from various sources
export const extractOrganizationId = (
  headers: Headers,
  jwtPayload?: any
): string | null => {
  // Priority 1: X-Organization-Id header
  const headerOrgId = headers.get('X-Organization-Id')
  if (headerOrgId) {
    return headerOrgId
  }

  // Priority 2: JWT claim
  const jwtOrgId = jwtPayload?.organization_id
  if (jwtOrgId) {
    return jwtOrgId
  }

  return null
}

// Middleware helper to inject organization context
export const injectOrganizationHeader = (
  request: Request,
  organizationId: string
): Request => {
  const headers = new Headers(request.headers)
  headers.set('X-Organization-Id', organizationId)
  
  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body
  })
}

// Error types for organization context resolution
export class OrganizationContextError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'NOT_MEMBER' | 'NO_CONTEXT' | 'INVALID_TOKEN',
    public organizationId?: string
  ) {
    super(message)
    this.name = 'OrganizationContextError'
  }
}

export const createOrganizationError = (
  code: OrganizationContextError['code'],
  organizationId?: string
): OrganizationContextError => {
  const messages = {
    NOT_FOUND: `Organization not found: ${organizationId}`,
    NOT_MEMBER: `Actor not member of organization: ${organizationId}`,
    NO_CONTEXT: 'No organization context available',
    INVALID_TOKEN: 'Invalid or expired authentication token'
  }

  return new OrganizationContextError(messages[code], code, organizationId)
}