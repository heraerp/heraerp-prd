/**
 * HERA Global Transaction Context
 * Smart Code: HERA.UNIVERSAL.SERVICE.TRANSACTION_CONTEXT.v1
 * 
 * React Context provider for global transaction state management
 * Integrates with TransactionService singleton for consistent data access
 * Compatible with existing useUniversalTransactionV1 hook patterns
 */

'use client'

import React, { createContext, useContext, useCallback, ReactNode } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  transactionService,
  type TransactionCreateRequest,
  type TransactionUpdateRequest,
  type TransactionQueryOptions,
  type TransactionServiceResponse,
  type TransactionBatchRequest
} from './transaction-service'
import type { UniversalTransaction } from '@/hooks/useUniversalTransactionV1'

export interface TransactionContextState {
  // Service instance
  service: typeof transactionService

  // Direct service methods with auth context injected
  createTransaction: (request: TransactionCreateRequest, options?: { idempotencyKey?: string }) => Promise<TransactionServiceResponse<{ transaction_id: string; lines_created: number }>>
  queryTransactions: (query: TransactionQueryOptions, options?: { useCache?: boolean }) => Promise<TransactionServiceResponse<UniversalTransaction[]>>
  getTransaction: (transactionId: string, options?: { includeLines?: boolean; useCache?: boolean }) => Promise<TransactionServiceResponse<UniversalTransaction>>
  updateTransaction: (request: TransactionUpdateRequest) => Promise<TransactionServiceResponse<UniversalTransaction>>
  deleteTransaction: (transactionId: string, options?: { reason?: string }) => Promise<TransactionServiceResponse<{ deleted: boolean }>>
  batchOperations: (operations: TransactionBatchRequest['transactions']) => Promise<Array<{ success: boolean; data?: any; error?: string; action: string; index: number }>>

  // Cache management
  invalidateCache: (pattern: string) => void
  clearCache: () => void
  getCacheStats: () => { size: number; keys: string[] }

  // Health and diagnostics
  healthCheck: () => Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; cache: { size: number }; config: any; timestamp: string }>

  // Authentication context
  organizationId: string | null
  actorUserId: string | null
  isAuthenticated: boolean
}

const TransactionContext = createContext<TransactionContextState | null>(null)

export interface TransactionProviderProps {
  children: ReactNode
}

/**
 * Global Transaction Provider
 * Wraps the singleton service with React Context for easy access
 */
export function TransactionProvider({ children }: TransactionProviderProps) {
  const { organization, user, isAuthenticated } = useHERAAuth()

  const organizationId = organization?.id || null
  // ✅ HERA v2.4: Use USER entity ID (not auth UID)
  const actorUserId = user?.entity_id || user?.id || null

  // Wrapper functions that inject auth context
  const createTransaction = useCallback(async (
    request: TransactionCreateRequest, 
    options?: { idempotencyKey?: string }
  ) => {
    if (!organizationId || !actorUserId) {
      return {
        success: false,
        data: null,
        error: 'Authentication required: missing organization or user context'
      }
    }

    return transactionService.createTransaction(request, {
      organizationId,
      actorUserId,
      ...options
    })
  }, [organizationId, actorUserId])

  const queryTransactions = useCallback(async (
    query: TransactionQueryOptions,
    options?: { useCache?: boolean }
  ) => {
    if (!organizationId || !actorUserId) {
      return {
        success: false,
        data: null,
        error: 'Authentication required: missing organization or user context'
      }
    }

    return transactionService.queryTransactions(query, {
      organizationId,
      actorUserId,
      ...options
    })
  }, [organizationId, actorUserId])

  const getTransaction = useCallback(async (
    transactionId: string,
    options?: { includeLines?: boolean; useCache?: boolean }
  ) => {
    if (!organizationId || !actorUserId) {
      return {
        success: false,
        data: null,
        error: 'Authentication required: missing organization or user context'
      }
    }

    return transactionService.getTransaction(transactionId, {
      organizationId,
      actorUserId,
      ...options
    })
  }, [organizationId, actorUserId])

  const updateTransaction = useCallback(async (request: TransactionUpdateRequest) => {
    if (!organizationId || !actorUserId) {
      return {
        success: false,
        data: null,
        error: 'Authentication required: missing organization or user context'
      }
    }

    return transactionService.updateTransaction(request, {
      organizationId,
      actorUserId
    })
  }, [organizationId, actorUserId])

  const deleteTransaction = useCallback(async (
    transactionId: string,
    options?: { reason?: string }
  ) => {
    if (!organizationId || !actorUserId) {
      return {
        success: false,
        data: null,
        error: 'Authentication required: missing organization or user context'
      }
    }

    return transactionService.deleteTransaction(transactionId, {
      organizationId,
      actorUserId,
      ...options
    })
  }, [organizationId, actorUserId])

  const batchOperations = useCallback(async (
    operations: TransactionBatchRequest['transactions']
  ) => {
    if (!organizationId || !actorUserId) {
      return operations.map((_, index) => ({
        success: false,
        data: null,
        error: 'Authentication required: missing organization or user context',
        action: operations[index]?.action || 'UNKNOWN',
        index
      }))
    }

    return transactionService.batchOperations({
      organizationId,
      actorUserId,
      transactions: operations
    })
  }, [organizationId, actorUserId])

  // Direct cache management methods
  const invalidateCache = useCallback((pattern: string) => {
    transactionService.invalidateTransactionCache(pattern)
  }, [])

  const clearCache = useCallback(() => {
    transactionService.clearTransactionCache()
  }, [])

  const getCacheStats = useCallback(() => {
    return transactionService.getTransactionCacheStats()
  }, [])

  const healthCheck = useCallback(() => {
    return transactionService.healthCheck()
  }, [])

  const contextValue: TransactionContextState = {
    service: transactionService,
    createTransaction,
    queryTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    batchOperations,
    invalidateCache,
    clearCache,
    getCacheStats,
    healthCheck,
    organizationId,
    actorUserId,
    isAuthenticated
  }

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  )
}

/**
 * Hook to access the global transaction service with auth context
 */
export function useTransactionService(): TransactionContextState {
  const context = useContext(TransactionContext)
  
  if (!context) {
    throw new Error('useTransactionService must be used within a TransactionProvider')
  }
  
  return context
}

/**
 * Higher-order hook for loading transactions with the global service
 * Compatible with existing useUniversalTransactionV1 patterns
 */
export function useTransactionLoader(query: TransactionQueryOptions = {}, options: { useCache?: boolean } = {}) {
  const { queryTransactions, organizationId, actorUserId, isAuthenticated } = useTransactionService()

  const loadTransactions = useCallback(async () => {
    if (!isAuthenticated || !organizationId || !actorUserId) {
      throw new Error('Authentication required for transaction loading')
    }

    const result = await queryTransactions(query, options)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load transactions')
    }

    return result.data || []
  }, [queryTransactions, query, options, isAuthenticated, organizationId, actorUserId])

  return {
    loadTransactions,
    isReady: isAuthenticated && !!organizationId && !!actorUserId
  }
}

/**
 * Transaction creator hook with built-in error handling
 */
export function useTransactionCreator() {
  const { createTransaction, isAuthenticated } = useTransactionService()

  const createTransactionWithHandling = useCallback(async (
    transaction: TransactionCreateRequest,
    options?: { idempotencyKey?: string; onSuccess?: (result: any) => void; onError?: (error: string) => void }
  ) => {
    if (!isAuthenticated) {
      const error = 'Must be authenticated to create transactions'
      options?.onError?.(error)
      throw new Error(error)
    }

    try {
      const result = await createTransaction(transaction, {
        idempotencyKey: options?.idempotencyKey
      })

      if (result.success) {
        options?.onSuccess?.(result.data)
        return result.data
      } else {
        const error = result.error || 'Transaction creation failed'
        options?.onError?.(error)
        throw new Error(error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      options?.onError?.(errorMessage)
      throw error
    }
  }, [createTransaction, isAuthenticated])

  return {
    createTransaction: createTransactionWithHandling,
    isReady: isAuthenticated
  }
}

/**
 * Batch operations hook for multiple transaction operations
 */
export function useTransactionBatch() {
  const { batchOperations, isAuthenticated } = useTransactionService()

  const executeBatch = useCallback(async (
    operations: TransactionBatchRequest['transactions'],
    options?: { 
      onProgress?: (completed: number, total: number) => void
      onSuccess?: (results: any[]) => void
      onError?: (errors: string[]) => void
    }
  ) => {
    if (!isAuthenticated) {
      const error = 'Must be authenticated to execute batch operations'
      options?.onError?.([error])
      throw new Error(error)
    }

    try {
      const results = await batchOperations(operations)
      
      const successes = results.filter(r => r.success)
      const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error')

      options?.onProgress?.(results.length, results.length)
      
      if (errors.length > 0) {
        options?.onError?.(errors)
      } else {
        options?.onSuccess?.(successes.map(s => s.data))
      }

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch operation failed'
      options?.onError?.([errorMessage])
      throw error
    }
  }, [batchOperations, isAuthenticated])

  return {
    executeBatch,
    isReady: isAuthenticated
  }
}

// Export types for consumers
export type {
  TransactionCreateRequest,
  TransactionUpdateRequest,
  TransactionQueryOptions,
  TransactionServiceResponse,
  UniversalTransaction
} from './transaction-service'

export default TransactionProvider