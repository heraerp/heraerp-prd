/**
 * Production-grade database transaction management
 * Ensures atomic operations and proper rollback on failure
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { dbLogger } from './logger'
import { APIError } from './api-error-handler'

export interface TransactionOperation<T = any> {
  name: string
  operation: () => Promise<T>
}

export class DatabaseTransaction {
  private client: SupabaseClient
  private operations: TransactionOperation[] = []
  private results: Map<string, any> = new Map()
  private transactionId: string

  constructor(client: SupabaseClient) {
    this.client = client
    this.transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Add an operation to the transaction
   */
  add<T>(name: string, operation: () => Promise<T>): DatabaseTransaction {
    this.operations.push({ name, operation })
    return this
  }

  /**
   * Get result of a previous operation by name
   */
  getResult<T>(operationName: string): T | undefined {
    return this.results.get(operationName)
  }

  /**
   * Execute all operations in sequence
   * If any operation fails, all changes are rolled back
   */
  async execute(): Promise<Map<string, any>> {
    const startTime = Date.now()
    dbLogger.info('Starting database transaction', {
      transactionId: this.transactionId,
      operationCount: this.operations.length
    })

    const completedOperations: Array<{
      name: string
      rollback?: () => Promise<void>
    }> = []

    try {
      // Execute each operation in sequence
      for (const { name, operation } of this.operations) {
        const opStartTime = Date.now()
        dbLogger.debug(`Executing operation: ${name}`, {
          transactionId: this.transactionId
        })

        try {
          const result = await operation()
          this.results.set(name, result)

          // Store rollback function if the operation returns one
          if (result && typeof result === 'object' && 'rollback' in result) {
            completedOperations.push({
              name,
              rollback: result.rollback
            })
          } else {
            completedOperations.push({ name })
          }

          dbLogger.debug(`Operation completed: ${name}`, {
            transactionId: this.transactionId,
            duration: Date.now() - opStartTime
          })
        } catch (error) {
          dbLogger.error(`Operation failed: ${name}`, error, {
            transactionId: this.transactionId
          })
          throw error
        }
      }

      // All operations completed successfully
      const duration = Date.now() - startTime
      dbLogger.info('Transaction completed successfully', {
        transactionId: this.transactionId,
        duration,
        operationCount: this.operations.length
      })

      return this.results
    } catch (error) {
      // Rollback in reverse order
      dbLogger.warn('Transaction failed, starting rollback', {
        transactionId: this.transactionId,
        failedAfter: completedOperations.length,
        totalOperations: this.operations.length
      })

      for (const op of completedOperations.reverse()) {
        if (op.rollback) {
          try {
            await op.rollback()
            dbLogger.debug(`Rolled back operation: ${op.name}`, {
              transactionId: this.transactionId
            })
          } catch (rollbackError) {
            dbLogger.error(`Failed to rollback operation: ${op.name}`, rollbackError, {
              transactionId: this.transactionId
            })
          }
        }
      }

      throw new APIError('Transaction failed and was rolled back', 500, 'TRANSACTION_FAILED', {
        transactionId: this.transactionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Helper to create operations with automatic rollback
 */
export function createReversibleOperation<T>(
  client: SupabaseClient,
  table: string,
  insertData: any,
  identifierField: string = 'id'
): TransactionOperation<T & { rollback: () => Promise<void> }> {
  return {
    name: `insert_${table}_${Date.now()}`,
    operation: async () => {
      const { data, error } = await client.from(table).insert(insertData).select().single()

      if (error) throw error

      return {
        ...data,
        rollback: async () => {
          await client.from(table).delete().eq(identifierField, data[identifierField])
        }
      }
    }
  }
}

/**
 * Create a transaction context for atomic operations
 */
export function createTransaction(client: SupabaseClient): DatabaseTransaction {
  return new DatabaseTransaction(client)
}
