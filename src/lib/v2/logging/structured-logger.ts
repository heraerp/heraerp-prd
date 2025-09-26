/**
 * HERA V2 API - Structured Logging for Transaction Operations
 * Observability: Log all txn-emit|read|query|reverse operations
 */

interface TxnLogEntry {
  operation: 'txn-emit' | 'txn-read' | 'txn-query' | 'txn-reverse'
  organization_id: string
  transaction_id?: string
  smart_code?: string
  transaction_type?: string
  timestamp: string
  duration_ms?: number
  status: 'success' | 'error' | 'validation_failed'
  error_message?: string
  request_id?: string
  user_agent?: string
  ip?: string
  metadata?: Record<string, any>
}

class StructuredTxnLogger {
  private static instance: StructuredTxnLogger

  static getInstance(): StructuredTxnLogger {
    if (!StructuredTxnLogger.instance) {
      StructuredTxnLogger.instance = new StructuredTxnLogger()
    }
    return StructuredTxnLogger.instance
  }

  /**
   * Log transaction operation with structured data
   */
  logTxnOperation(entry: TxnLogEntry): void {
    const structuredLog = {
      level: entry.status === 'error' ? 'error' : 'info',
      message: `HERA-V2-TXN: ${entry.operation}`,
      ...entry,
      service: 'hera-v2-api',
      version: '2.0.0'
    }

    if (entry.status === 'error') {
      console.error(JSON.stringify(structuredLog))
    } else {
      console.log(JSON.stringify(structuredLog))
    }
  }

  /**
   * Create transaction logger for a specific operation
   */
  createOperationLogger(
    operation: TxnLogEntry['operation'],
    organization_id: string,
    request?: NextRequest
  ) {
    const startTime = Date.now()
    const request_id = request?.headers.get('x-request-id') || crypto.randomUUID()
    const user_agent = request?.headers.get('user-agent') || undefined
    const ip = request?.ip || request?.headers.get('x-forwarded-for') || undefined

    return {
      logSuccess: (data: {
        transaction_id?: string
        smart_code?: string
        transaction_type?: string
        metadata?: Record<string, any>
      }) => {
        this.logTxnOperation({
          operation,
          organization_id,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          status: 'success',
          request_id,
          user_agent,
          ip,
          ...data
        })
      },

      logError: (error: string, metadata?: Record<string, any>) => {
        this.logTxnOperation({
          operation,
          organization_id,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          status: 'error',
          error_message: error,
          request_id,
          user_agent,
          ip,
          metadata
        })
      },

      logValidationFailed: (error: string, metadata?: Record<string, any>) => {
        this.logTxnOperation({
          operation,
          organization_id,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          status: 'validation_failed',
          error_message: error,
          request_id,
          user_agent,
          ip,
          metadata
        })
      }
    }
  }

  /**
   * Log aggregated statistics (can be called periodically)
   */
  logOperationStats(stats: {
    operation: TxnLogEntry['operation']
    period_minutes: number
    total_calls: number
    success_count: number
    error_count: number
    avg_duration_ms: number
    organizations_active: number
  }): void {
    const structuredLog = {
      level: 'info',
      message: `HERA-V2-TXN-STATS: ${stats.operation}`,
      ...stats,
      timestamp: new Date().toISOString(),
      service: 'hera-v2-api',
      version: '2.0.0'
    }

    console.log(JSON.stringify(structuredLog))
  }
}

export const structuredTxnLogger = StructuredTxnLogger.getInstance()

/**
 * Middleware wrapper for transaction endpoints
 */
export function withTxnLogging<T extends Record<string, any>>(
  operation: TxnLogEntry['operation'],
  handler: (
    payload: T,
    logger: ReturnType<StructuredTxnLogger['createOperationLogger']>
  ) => Promise<any>
) {
  return async (request: NextRequest) => {
    let payload: T
    let logger: ReturnType<StructuredTxnLogger['createOperationLogger']>

    try {
      payload = await request.json()

      if (!payload.organization_id) {
        const tempLogger = structuredTxnLogger.createOperationLogger(operation, 'unknown', request)
        tempLogger.logValidationFailed('Missing organization_id in payload')
        return NextResponse.json(
          { success: false, error: 'organization_id is required' },
          { status: 400 }
        )
      }

      logger = structuredTxnLogger.createOperationLogger(
        operation,
        payload.organization_id,
        request
      )

      const result = await handler(payload, logger)

      logger.logSuccess({
        transaction_id: payload.transaction_id || result?.transaction_id,
        smart_code: payload.smart_code || result?.smart_code,
        transaction_type: payload.transaction_type,
        metadata: {
          response_size: JSON.stringify(result).length,
          include_lines: payload.include_lines
        }
      })

      return NextResponse.json({
        api_version: 'v2',
        ...result
      })
    } catch (error: any) {
      if (logger!) {
        logger.logError(error.message, {
          stack: error.stack,
          error_type: error.constructor.name
        })
      } else {
        // Fallback logging
        console.error(`HERA-V2-TXN-ERROR: ${operation}`, {
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }

      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
}

export type { TxnLogEntry }
