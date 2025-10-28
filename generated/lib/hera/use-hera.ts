/**
 * useHera Hook - React Client SDK
 * Smart Code: HERA.LIB.HOOKS.USE_HERA.v1
 * 
 * Provides convenient React interface for HERA API v2 commands
 */

import { useState, useCallback } from 'react'

export interface UseHeraOptions {
  baseUrl?: string
  timeout?: number
}

export interface CommandResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  actor_user_id?: string
  organization_id?: string
  request_id?: string
}

export interface UseHeraState {
  loading: boolean
  error: string | null
  lastResponse: CommandResponse | null
}

/**
 * React hook for HERA API v2 commands
 */
export function useHera(options: UseHeraOptions = {}) {
  const [state, setState] = useState<UseHeraState>({
    loading: false,
    error: null,
    lastResponse: null
  })

  const command = useCallback(async <T = any>(
    cmd: string,
    payload: any,
    orgId?: string
  ): Promise<CommandResponse<T>> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Get auth token from your auth provider
      const token = await getAuthToken() // Implement based on your auth system
      
      if (!token) {
        throw new Error('No authentication token available')
      }

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Add organization context if provided
      if (orgId) {
        headers['X-Organization-Id'] = orgId
      }

      // Make API request
      const response = await fetch(`${options.baseUrl || ''}/api/v2/command`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command: cmd, payload }),
        signal: AbortSignal.timeout(options.timeout || 30000)
      })

      const result: CommandResponse<T> = await response.json()

      setState(prev => ({
        ...prev,
        loading: false,
        lastResponse: result,
        error: result.success ? null : result.error?.message || 'Command failed'
      }))

      return result

    } catch (error: any) {
      const errorMessage = error.message || 'Network error'
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastResponse: null
      }))

      return {
        success: false,
        error: {
          code: 'client_error',
          message: errorMessage
        }
      }
    }
  }, [options.baseUrl, options.timeout])

  // Convenience methods for common operations
  const createEntity = useCallback((entityData: any, orgId?: string) => {
    return command('entity.create', { entity: entityData }, orgId)
  }, [command])

  const updateEntity = useCallback((entityId: string, updates: any, orgId?: string) => {
    return command('entity.update', { 
      entity: { id: entityId, ...updates } 
    }, orgId)
  }, [command])

  const deleteEntity = useCallback((entityId: string, orgId?: string) => {
    return command('entity.delete', { entity: { id: entityId } }, orgId)
  }, [command])

  const readEntities = useCallback((filters: any, orgId?: string) => {
    return command('entity.read', { filters }, orgId)
  }, [command])

  const createTransaction = useCallback((transactionData: any, lines: any[], orgId?: string) => {
    return command('transaction.create', { 
      transaction: transactionData, 
      lines 
    }, orgId)
  }, [command])

  const setDynamicField = useCallback((entityId: string, fieldName: string, value: any, fieldType: string, smartCode: string, orgId?: string) => {
    return command('dynamic.set', {
      entity_id: entityId,
      fields: [{
        field_name: fieldName,
        field_value_text: fieldType === 'text' ? value : undefined,
        field_value_number: fieldType === 'number' ? value : undefined,
        field_value_boolean: fieldType === 'boolean' ? value : undefined,
        field_value_json: fieldType === 'json' ? value : undefined,
        field_type: fieldType,
        smart_code: smartCode
      }]
    }, orgId)
  }, [command])

  const createRelationship = useCallback((sourceId: string, targetId: string, relationshipType: string, smartCode: string, orgId?: string) => {
    return command('relationship.create', {
      source_entity_id: sourceId,
      relationship: {
        target_entity_id: targetId,
        relationship_type: relationshipType,
        smart_code: smartCode
      }
    }, orgId)
  }, [command])

  return {
    // State
    loading: state.loading,
    error: state.error,
    lastResponse: state.lastResponse,

    // Core command interface
    command,

    // Convenience methods
    createEntity,
    updateEntity,
    deleteEntity,
    readEntities,
    createTransaction,
    setDynamicField,
    createRelationship
  }
}

/**
 * Get authentication token from your auth system
 * This should be implemented based on your authentication provider
 */
async function getAuthToken(): Promise<string | null> {
  // Example implementation for Supabase
  // const { data: { session } } = await supabase.auth.getSession()
  // return session?.access_token || null
  
  // For now, return null - implement based on your auth system
  console.warn('getAuthToken not implemented - please configure your auth provider')
  return null
}

/**
 * Type-safe command helpers
 */
export const HeraCommands = {
  // Entity commands
  ENTITY_CREATE: 'entity.create' as const,
  ENTITY_READ: 'entity.read' as const,
  ENTITY_UPDATE: 'entity.update' as const,
  ENTITY_DELETE: 'entity.delete' as const,

  // Transaction commands
  TRANSACTION_CREATE: 'transaction.create' as const,
  TRANSACTION_READ: 'transaction.read' as const,
  TRANSACTION_UPDATE: 'transaction.update' as const,
  TRANSACTION_DELETE: 'transaction.delete' as const,
  TRANSACTION_POST: 'transaction.post' as const,

  // Dynamic data commands
  DYNAMIC_SET: 'dynamic.set' as const,
  DYNAMIC_GET: 'dynamic.get' as const,
  DYNAMIC_DELETE: 'dynamic.delete' as const,

  // Relationship commands
  RELATIONSHIP_CREATE: 'relationship.create' as const,
  RELATIONSHIP_DELETE: 'relationship.delete' as const
} as const

export type HeraCommand = typeof HeraCommands[keyof typeof HeraCommands]

/**
 * Example usage:
 * 
 * const { loading, error, createEntity, setDynamicField } = useHera()
 * 
 * // Create customer entity
 * const customer = await createEntity({
 *   entity_type: 'CUSTOMER',
 *   entity_name: 'Acme Corp',
 *   smart_code: 'HERA.ENTERPRISE.CUSTOMER.v1'
 * }, orgId)
 * 
 * // Set dynamic field
 * await setDynamicField(
 *   customer.data.id,
 *   'email',
 *   'contact@acme.com',
 *   'text',
 *   'HERA.ENTERPRISE.CUSTOMER.FIELD.EMAIL.v1',
 *   orgId
 * )
 */