/**
 * HERA Universal API v2 Hooks
 * Generic hooks for entities, relationships, and transactions using canonical v2 client
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiV2, guardedApiV2 } from './client'

interface EntityFilters {
  entity_type?: string
  entity_id?: string
  status?: string
  limit?: number
  offset?: number
  include_dynamic?: boolean
}

interface RelationshipFilters {
  entity_id?: string
  relationship_type?: string
  from_entity_id?: string
  to_entity_id?: string
  limit?: number
  offset?: number
}

interface TransactionFilters {
  transaction_type?: string
  txn_id?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

/**
 * Hook for fetching a single entity by ID
 */
export function useEntity(entityId: string, organizationId: string) {
  return useQuery({
    queryKey: ['entity', entityId, organizationId],
    queryFn: async () => {
      const { data, error } = await guardedApiV2.get('/entities', {
        entity_id: entityId,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to fetch entity')
      return data
    },
    enabled: !!entityId && !!organizationId
  })
}

/**
 * Hook for fetching multiple entities with filters
 */
export function useEntities(filters: EntityFilters, organizationId: string) {
  return useQuery({
    queryKey: ['entities', filters, organizationId],
    queryFn: async () => {
      const { data, error } = await guardedApiV2.get('/entities', {
        ...filters,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to fetch entities')
      return data
    },
    enabled: !!organizationId
  })
}

/**
 * Hook for upserting entities
 */
export function useUpsertEntity(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (entityData: any) => {
      const { data, error } = await guardedApiV2.post('/entities', {
        ...entityData,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to upsert entity')
      return data
    },
    onSuccess: () => {
      // Invalidate entity queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      queryClient.invalidateQueries({ queryKey: ['entity'] })
    }
  })
}

/**
 * Hook for fetching relationships with filters
 */
export function useRelationships(filters: RelationshipFilters, organizationId: string) {
  return useQuery({
    queryKey: ['relationships', filters, organizationId],
    queryFn: async () => {
      const { data, error } = await guardedApiV2.get('/relationships', {
        ...filters,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to fetch relationships')
      return data
    },
    enabled: !!organizationId
  })
}

/**
 * Hook for upserting relationships
 */
export function useUpsertRelationship(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (relationshipData: any) => {
      const { data, error } = await guardedApiV2.post('/relationships', {
        ...relationshipData,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to upsert relationship')
      return data
    },
    onSuccess: () => {
      // Invalidate relationship queries
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
    }
  })
}

/**
 * Hook for fetching transactions with filters
 */
export function useTransactions(filters: TransactionFilters, organizationId: string) {
  return useQuery({
    queryKey: ['transactions', filters, organizationId],
    queryFn: async () => {
      const { data, error } = await guardedApiV2.get('/transactions', {
        ...filters,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to fetch transactions')
      return data
    },
    enabled: !!organizationId
  })
}

/**
 * Hook for fetching a single transaction by ID
 */
export function useTransaction(transactionId: string, organizationId: string) {
  return useQuery({
    queryKey: ['transaction', transactionId, organizationId],
    queryFn: async () => {
      const { data, error } = await guardedApiV2.get('/transactions', {
        txn_id: transactionId,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to fetch transaction')
      return data
    },
    enabled: !!transactionId && !!organizationId
  })
}

/**
 * Hook for emitting transactions
 */
export function useEmitTransaction(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (transactionData: any) => {
      const { data, error } = await guardedApiV2.post('/transactions', {
        ...transactionData,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to emit transaction')
      return data
    },
    onSuccess: () => {
      // Invalidate transaction queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction'] })
    }
  })
}

/**
 * Hook for reversing transactions
 */
export function useReverseTransaction(organizationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (reverseData: any) => {
      const { data, error } = await guardedApiV2.post('/transactions?action=reverse', {
        ...reverseData,
        organization_id: organizationId
      })
      if (error) throw new Error(error.message || 'Failed to reverse transaction')
      return data
    },
    onSuccess: () => {
      // Invalidate transaction queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction'] })
    }
  })
}

/**
 * Generic hook for custom v2 API calls with path validation
 */
export function useUniversalV2Api() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callApi = useCallback(async (method: 'get' | 'post' | 'put' | 'delete' | 'patch', path: string, params?: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: apiError } = await guardedApiV2[method](path, params)
      if (apiError) throw new Error(apiError.message || 'API call failed')
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    callApi,
    clearError: () => setError(null)
  }
}

// Rules registry functionality (maintained for compatibility)
interface RuleHandler {
  pattern: RegExp
  handler: (data: any, context: any) => any
}

const rulesRegistry = new Map<string, RuleHandler[]>()

export function registerRules(prefix: string, rules: RuleHandler[]) {
  rulesRegistry.set(prefix, rules)
}

export function findRules(smartCode: string): RuleHandler[] {
  for (const [prefix, rules] of rulesRegistry.entries()) {
    if (smartCode.startsWith(prefix)) {
      return rules
    }
  }
  return []
}