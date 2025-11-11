/**
 * HERA Transaction Service (Singleton)
 * Smart Code: HERA.UNIVERSAL.SERVICE.TRANSACTION_SINGLETON.v1
 * 
 * Global singleton service for transaction management
 * Wraps existing production-ready useUniversalTransactionV1 and transactionCRUD
 * Can be used in both React and non-React contexts (API routes, middleware, etc.)
 */

import { transactionCRUD } from '@/lib/universal-api-v2-client'
import type { 
  UniversalTransaction, 
  TransactionLine, 
  UseUniversalTransactionV1Config 
} from '@/hooks/useUniversalTransactionV1'

export interface TransactionServiceConfig {
  defaultCacheStaleTime?: number // milliseconds
  defaultIncludeLines?: boolean
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
  batchLimit?: number
}

export interface TransactionCreateRequest {
  transaction_type: string
  smart_code: string
  transaction_date?: string
  source_entity_id?: string | null
  target_entity_id?: string | null
  total_amount?: number
  transaction_status?: string
  metadata?: Record<string, any>
  business_context?: Record<string, any>
  lines?: TransactionLine[]
}

export interface TransactionUpdateRequest extends Partial<TransactionCreateRequest> {
  id: string
}

export interface TransactionQueryOptions {
  transaction_type?: string
  smart_code?: string
  source_entity_id?: string
  target_entity_id?: string
  transaction_status?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
  include_lines?: boolean
  include_deleted?: boolean
}

export interface TransactionServiceResponse<T = any> {
  success: boolean
  data: T | null
  error?: string
  metadata?: {
    actor_user_id: string
    organization_id: string
    operation: string
    timestamp: string
  }
}

export interface TransactionBatchRequest {
  organizationId: string
  actorUserId: string
  transactions: Array<{
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'QUERY'
    data: TransactionCreateRequest | TransactionUpdateRequest | TransactionQueryOptions
    options?: any
  }>
}

// In-memory cache for transactions (5m TTL as per HERA guidelines)
class TransactionCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): { size: number; keys: string[] } {
    const keys = Array.from(this.cache.keys())
    return {
      size: keys.length,
      keys: keys.slice(0, 10) // Show first 10 keys for debugging
    }
  }
}

class TransactionService {
  private config: TransactionServiceConfig
  private cache = new TransactionCache()
  private static instance: TransactionService | null = null

  private constructor(config: TransactionServiceConfig = {}) {
    this.config = {
      defaultCacheStaleTime: 5 * 60 * 1000, // 5 minutes
      defaultIncludeLines: true,
      logLevel: 'info',
      batchLimit: 50,
      ...config
    }
  }

  // Singleton pattern
  public static getInstance(config?: TransactionServiceConfig): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService(config)
    }
    return TransactionService.instance
  }

  // Update configuration
  public updateConfig(config: Partial<TransactionServiceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // Get current configuration
  public getConfig(): TransactionServiceConfig {
    return { ...this.config }
  }

  /**
   * Create a new transaction
   */
  public async createTransaction(
    request: TransactionCreateRequest,
    options: {
      organizationId: string
      actorUserId: string
      idempotencyKey?: string
    }
  ): Promise<TransactionServiceResponse<{ transaction_id: string; lines_created: number }>> {
    this.log('info', `🔨 Creating transaction: ${request.transaction_type}`, {
      organizationId: options.organizationId?.slice(0, 8) + '...',
      actorUserId: options.actorUserId?.slice(0, 8) + '...',
      linesCount: request.lines?.length || 0
    })

    try {
      const result = await transactionCRUD({
        p_action: 'CREATE',
        p_actor_user_id: options.actorUserId,
        p_organization_id: options.organizationId,
        p_transaction: {
          transaction_type: request.transaction_type,
          smart_code: request.smart_code,
          transaction_date: request.transaction_date || new Date().toISOString(),
          source_entity_id: request.source_entity_id,
          target_entity_id: request.target_entity_id,
          total_amount: request.total_amount,
          transaction_status: request.transaction_status || 'ACTIVE',
          metadata: request.metadata,
          business_context: request.business_context
        },
        p_lines: request.lines || [],
        p_options: {
          idempotency_key: options.idempotencyKey
        }
      })

      if (result.success) {
        this.log('info', `✅ Transaction created: ${result.data?.transaction_id}`)
        
        // Invalidate relevant caches
        this.invalidateTransactionCache(options.organizationId)
        
        return {
          success: true,
          data: result.data,
          metadata: {
            actor_user_id: options.actorUserId,
            organization_id: options.organizationId,
            operation: 'CREATE',
            timestamp: new Date().toISOString()
          }
        }
      } else {
        this.log('error', `❌ Transaction creation failed: ${result.error}`)
        return {
          success: false,
          data: null,
          error: result.error || 'Unknown error occurred'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', `🚨 Transaction creation exception: ${errorMessage}`, { error })
      
      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }
  }

  /**
   * Query/list transactions with caching
   */
  public async queryTransactions(
    query: TransactionQueryOptions,
    options: {
      organizationId: string
      actorUserId: string
      useCache?: boolean
    }
  ): Promise<TransactionServiceResponse<UniversalTransaction[]>> {
    const cacheKey = `txn-query:${options.organizationId}:${JSON.stringify(query)}`
    
    // Check cache first
    if (options.useCache !== false) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        this.log('debug', `📦 Retrieved transactions from cache: ${cacheKey}`)
        return {
          success: true,
          data: cached,
          metadata: {
            actor_user_id: options.actorUserId,
            organization_id: options.organizationId,
            operation: 'QUERY_CACHED',
            timestamp: new Date().toISOString()
          }
        }
      }
    }

    this.log('info', `🔍 Querying transactions`, {
      organizationId: options.organizationId?.slice(0, 8) + '...',
      filters: query
    })

    try {
      const result = await transactionCRUD({
        p_action: 'QUERY',
        p_actor_user_id: options.actorUserId,
        p_organization_id: options.organizationId,
        p_transaction: null,
        p_lines: [],
        p_options: {
          filters: query,
          include_lines: query.include_lines ?? this.config.defaultIncludeLines,
          limit: query.limit || 50,
          offset: query.offset || 0
        }
      })

      if (result.success) {
        const transactions = result.data?.items || []
        this.log('info', `✅ Found ${transactions.length} transactions`)
        
        // Cache the results
        this.cache.set(cacheKey, transactions)
        
        return {
          success: true,
          data: transactions,
          metadata: {
            actor_user_id: options.actorUserId,
            organization_id: options.organizationId,
            operation: 'QUERY',
            timestamp: new Date().toISOString()
          }
        }
      } else {
        this.log('warn', `❌ Transaction query failed: ${result.error}`)
        return {
          success: false,
          data: null,
          error: result.error || 'Query failed'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', `🚨 Transaction query exception: ${errorMessage}`, { error })
      
      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }
  }

  /**
   * Get single transaction by ID with caching
   */
  public async getTransaction(
    transactionId: string,
    options: {
      organizationId: string
      actorUserId: string
      includeLines?: boolean
      useCache?: boolean
    }
  ): Promise<TransactionServiceResponse<UniversalTransaction>> {
    const cacheKey = `txn:${options.organizationId}:${transactionId}`
    
    // Check cache first
    if (options.useCache !== false) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        this.log('debug', `📦 Retrieved transaction from cache: ${transactionId}`)
        return {
          success: true,
          data: cached,
          metadata: {
            actor_user_id: options.actorUserId,
            organization_id: options.organizationId,
            operation: 'READ_CACHED',
            timestamp: new Date().toISOString()
          }
        }
      }
    }

    this.log('info', `🔍 Getting transaction: ${transactionId}`)

    try {
      const result = await transactionCRUD({
        p_action: 'READ',
        p_actor_user_id: options.actorUserId,
        p_organization_id: options.organizationId,
        p_transaction: { id: transactionId },
        p_lines: [],
        p_options: {
          include_lines: options.includeLines ?? this.config.defaultIncludeLines
        }
      })

      if (result.success && result.data) {
        this.log('info', `✅ Retrieved transaction: ${transactionId}`)
        
        // Cache the transaction
        this.cache.set(cacheKey, result.data)
        
        return {
          success: true,
          data: result.data,
          metadata: {
            actor_user_id: options.actorUserId,
            organization_id: options.organizationId,
            operation: 'READ',
            timestamp: new Date().toISOString()
          }
        }
      } else {
        this.log('warn', `❌ Transaction not found: ${transactionId}`)
        return {
          success: false,
          data: null,
          error: result.error || 'Transaction not found'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', `🚨 Get transaction exception: ${errorMessage}`, { error })
      
      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }
  }

  /**
   * Update an existing transaction
   */
  public async updateTransaction(
    request: TransactionUpdateRequest,
    options: {
      organizationId: string
      actorUserId: string
    }
  ): Promise<TransactionServiceResponse<UniversalTransaction>> {
    this.log('info', `📝 Updating transaction: ${request.id}`)

    try {
      const result = await transactionCRUD({
        p_action: 'UPDATE',
        p_actor_user_id: options.actorUserId,
        p_organization_id: options.organizationId,
        p_transaction: request,
        p_lines: request.lines || [],
        p_options: {}
      })

      if (result.success) {
        this.log('info', `✅ Transaction updated: ${request.id}`)
        
        // Invalidate caches
        this.cache.invalidate(request.id)
        this.invalidateTransactionCache(options.organizationId)
        
        return {
          success: true,
          data: result.data,
          metadata: {
            actor_user_id: options.actorUserId,
            organization_id: options.organizationId,
            operation: 'UPDATE',
            timestamp: new Date().toISOString()
          }
        }
      } else {
        this.log('error', `❌ Transaction update failed: ${result.error}`)
        return {
          success: false,
          data: null,
          error: result.error || 'Update failed'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', `🚨 Transaction update exception: ${errorMessage}`, { error })
      
      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }
  }

  /**
   * Delete/void a transaction
   */
  public async deleteTransaction(
    transactionId: string,
    options: {
      organizationId: string
      actorUserId: string
      reason?: string
    }
  ): Promise<TransactionServiceResponse<{ deleted: boolean }>> {
    this.log('info', `🗑️ Deleting transaction: ${transactionId}`)

    try {
      const result = await transactionCRUD({
        p_action: 'DELETE',
        p_actor_user_id: options.actorUserId,
        p_organization_id: options.organizationId,
        p_transaction: { id: transactionId },
        p_lines: [],
        p_options: {
          reason: options.reason || 'Deleted via service'
        }
      })

      if (result.success) {
        this.log('info', `✅ Transaction deleted: ${transactionId}`)
        
        // Invalidate caches
        this.cache.invalidate(transactionId)
        this.invalidateTransactionCache(options.organizationId)
        
        return {
          success: true,
          data: { deleted: true },
          metadata: {
            actor_user_id: options.actorUserId,
            organization_id: options.organizationId,
            operation: 'DELETE',
            timestamp: new Date().toISOString()
          }
        }
      } else {
        this.log('error', `❌ Transaction delete failed: ${result.error}`)
        return {
          success: false,
          data: null,
          error: result.error || 'Delete failed'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', `🚨 Transaction delete exception: ${errorMessage}`, { error })
      
      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }
  }

  /**
   * Batch operations for multiple transactions
   */
  public async batchOperations(
    request: TransactionBatchRequest
  ): Promise<Array<{
    success: boolean
    data?: any
    error?: string
    action: string
    index: number
  }>> {
    if (request.transactions.length > this.config.batchLimit!) {
      throw new Error(`Batch limit exceeded: ${request.transactions.length} > ${this.config.batchLimit}`)
    }

    this.log('info', `🔄 Processing batch of ${request.transactions.length} operations`)

    const results = await Promise.allSettled(
      request.transactions.map(async (txnRequest, index) => {
        const { action, data, options = {} } = txnRequest
        const commonOptions = {
          organizationId: request.organizationId,
          actorUserId: request.actorUserId,
          ...options
        }

        switch (action) {
          case 'CREATE':
            return {
              ...(await this.createTransaction(data as TransactionCreateRequest, commonOptions)),
              action,
              index
            }
          case 'READ':
          case 'QUERY':
            return {
              ...(await this.queryTransactions(data as TransactionQueryOptions, commonOptions)),
              action,
              index
            }
          case 'UPDATE':
            return {
              ...(await this.updateTransaction(data as TransactionUpdateRequest, commonOptions)),
              action,
              index
            }
          case 'DELETE':
            const deleteData = data as { id: string; reason?: string }
            return {
              ...(await this.deleteTransaction(deleteData.id, {
                ...commonOptions,
                reason: deleteData.reason
              })),
              action,
              index
            }
          default:
            return {
              success: false,
              data: null,
              error: `Unknown action: ${action}`,
              action,
              index
            }
        }
      })
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          success: false,
          data: null,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          action: request.transactions[index].action,
          index
        }
      }
    })
  }

  // Cache management
  public invalidateTransactionCache(pattern: string): void {
    this.log('info', `🗑️ Invalidating transaction cache pattern: ${pattern}`)
    this.cache.invalidate(pattern)
  }

  public clearTransactionCache(): void {
    this.log('info', '🗑️ Clearing entire transaction cache')
    this.cache.clear()
  }

  public getTransactionCacheStats(): { size: number; keys: string[] } {
    const stats = this.cache.getStats()
    this.log('debug', `📊 Transaction cache stats: ${stats.size} entries`)
    return stats
  }

  // Health check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    cache: { size: number }
    config: TransactionServiceConfig
    timestamp: string
  }> {
    try {
      const cacheStats = this.getTransactionCacheStats()
      
      return {
        status: 'healthy',
        cache: { size: cacheStats.size },
        config: this.getConfig(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        cache: { size: 0 },
        config: this.getConfig(),
        timestamp: new Date().toISOString()
      }
    }
  }

  // Logging utility
  private log(level: string, message: string, metadata?: any): void {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 }
    const configLevel = levels[this.config.logLevel!] || 2
    const messageLevel = levels[level as keyof typeof levels] || 2

    if (messageLevel <= configLevel) {
      const logData = { level, message, timestamp: new Date().toISOString(), ...metadata }
      
      if (level === 'error') {
        console.error('[TransactionService]', logData)
      } else if (level === 'warn') {
        console.warn('[TransactionService]', logData)
      } else {
        console.log('[TransactionService]', logData)
      }
    }
  }
}

// Export singleton instance
export const transactionService = TransactionService.getInstance()

// Export class for custom instances if needed
export { TransactionService }

// Export helper functions for common patterns
export const createTransactionService = (config?: TransactionServiceConfig) => {
  return TransactionService.getInstance(config)
}

export const createTransactionFromService = async (
  transactionData: TransactionCreateRequest,
  organizationId: string,
  actorUserId: string,
  options?: { idempotencyKey?: string }
) => {
  return transactionService.createTransaction(transactionData, {
    organizationId,
    actorUserId,
    ...options
  })
}

export const queryTransactionsFromService = async (
  query: TransactionQueryOptions,
  organizationId: string,
  actorUserId: string,
  options?: { useCache?: boolean }
) => {
  return transactionService.queryTransactions(query, {
    organizationId,
    actorUserId,
    ...options
  })
}

export default transactionService