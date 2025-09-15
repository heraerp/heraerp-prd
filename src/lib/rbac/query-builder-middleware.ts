/**
 * Row-Level Security Query Builder Middleware
 * Automatically injects organization_id filtering on all queries
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface RLSContext {
  organization_id: string
  user_id: string
  roles: string[]
  bypass_rls?: boolean // Only for system operations
}

export class RLSQueryBuilder {
  private static contextStore = new Map<string, RLSContext>()

  /**
   * Set RLS context for current request
   */
  static setContext(requestId: string, context: RLSContext): void {
    this.contextStore.set(requestId, context)
  }

  /**
   * Clear RLS context after request
   */
  static clearContext(requestId: string): void {
    this.contextStore.delete(requestId)
  }

  /**
   * Get current context
   */
  static getContext(requestId: string): RLSContext | undefined {
    return this.contextStore.get(requestId)
  }

  /**
   * Wrap Supabase client with RLS enforcement
   */
  static wrapClient(supabase: SupabaseClient, requestId: string): SupabaseClient {
    const context = this.getContext(requestId)
    if (!context || context.bypass_rls) {
      return supabase // Return unwrapped for system operations
    }

    // Create proxy to intercept queries
    return new Proxy(supabase, {
      get(target, prop) {
        if (prop === 'from') {
          return function (table: string) {
            const query = target.from(table)

            // Automatically add organization_id filter
            if (shouldFilterTable(table)) {
              return wrapQuery(query, context.organization_id)
            }

            return query
          }
        }
        return (target as any)[prop]
      }
    }) as SupabaseClient
  }
}

/**
 * Tables that require organization filtering
 */
const FILTERED_TABLES = [
  'core_entities',
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
]

/**
 * Check if table should be filtered
 */
function shouldFilterTable(table: string): boolean {
  return FILTERED_TABLES.includes(table)
}

/**
 * Wrap query builder to inject organization filter
 */
function wrapQuery(query: any, organizationId: string): any {
  // Store original methods
  const originalSelect = query.select?.bind(query)
  const originalInsert = query.insert?.bind(query)
  const originalUpdate = query.update?.bind(query)
  const originalUpsert = query.upsert?.bind(query)
  const originalDelete = query.delete?.bind(query)

  // Override select
  if (originalSelect) {
    query.select = function (...args: any[]) {
      const result = originalSelect(...args)
      // Always add organization filter
      return result.eq('organization_id', organizationId)
    }
  }

  // Override insert
  if (originalInsert) {
    query.insert = function (values: any | any[], options?: any) {
      // Ensure organization_id is set
      if (Array.isArray(values)) {
        values = values.map(v => ({
          ...v,
          organization_id: v.organization_id || organizationId
        }))
      } else {
        values = {
          ...values,
          organization_id: values.organization_id || organizationId
        }
      }

      // Validate organization_id matches context
      const validateOrgId = (v: any) => {
        if (v.organization_id && v.organization_id !== organizationId) {
          throw new Error(`Organization mismatch: ${v.organization_id} != ${organizationId}`)
        }
      }

      if (Array.isArray(values)) {
        values.forEach(validateOrgId)
      } else {
        validateOrgId(values)
      }

      return originalInsert(values, options)
    }
  }

  // Override update
  if (originalUpdate) {
    query.update = function (values: any, options?: any) {
      // Prevent updating organization_id
      if (values.organization_id && values.organization_id !== organizationId) {
        throw new Error('Cannot update organization_id')
      }

      const result = originalUpdate(values, options)
      // Ensure update only affects current org
      return result.eq('organization_id', organizationId)
    }
  }

  // Override upsert
  if (originalUpsert) {
    query.upsert = function (values: any | any[], options?: any) {
      // Ensure organization_id is set
      if (Array.isArray(values)) {
        values = values.map(v => ({
          ...v,
          organization_id: v.organization_id || organizationId
        }))
      } else {
        values = {
          ...values,
          organization_id: values.organization_id || organizationId
        }
      }

      return originalUpsert(values, options)
    }
  }

  // Override delete
  if (originalDelete) {
    query.delete = function (options?: any) {
      const result = originalDelete(options)
      // Ensure delete only affects current org
      return result.eq('organization_id', organizationId)
    }
  }

  return query
}

/**
 * Express/Next.js middleware to set RLS context
 */
export function rlsMiddleware(req: any, res: any, next: any) {
  const requestId = req.headers['x-request-id'] || generateRequestId()

  // Extract context from JWT or session
  const context: RLSContext = {
    organization_id: req.session?.organization_id || req.jwt?.organization_id,
    user_id: req.session?.user_id || req.jwt?.sub,
    roles: req.session?.roles || req.jwt?.roles || ['USER']
  }

  // Validate context
  if (!context.organization_id) {
    return res.status(403).json({
      type: 'https://hera.app/errors/missing-organization',
      title: 'Missing Organization Context',
      status: 403,
      detail: 'Request must include organization context'
    })
  }

  // Set context
  RLSQueryBuilder.setContext(requestId, context)

  // Store request ID for cleanup
  req.rlsRequestId = requestId

  // Cleanup after response
  res.on('finish', () => {
    RLSQueryBuilder.clearContext(requestId)
  })

  next()
}

/**
 * Get RLS-wrapped Supabase client
 */
export function getRLSSupabase(requestId: string) {
  const { getSupabase } = require('@/lib/supabase/client')
  const supabase = getSupabase()
  return RLSQueryBuilder.wrapClient(supabase, requestId)
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export types
export type { SupabaseClient }
