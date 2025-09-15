/**
 * HERA Universal Helpers
 * Reusable patterns discovered during restaurant payment implementation
 */

import { universalApi, ApiResponse } from './universal-api'

/**
 * Safely extract data array from API response
 * Handles both direct arrays and ApiResponse format
 */
export function extractData<T>(response: T[] | ApiResponse<T[]> | undefined | null): T[] {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (typeof response === 'object' && 'data' in response) {
    return response.data || []
  }
  return []
}

/**
 * Ensure default entities exist for a given type
 * Creates them if missing, returns all entities of that type
 */
export async function ensureDefaultEntities<T extends Record<string, any>>(
  entityType: string,
  defaults: Array<{
    entity_name: string
    entity_code: string
    metadata?: T
  }>,
  smartCode: string,
  organizationId?: string
): Promise<any[]> {
  // Check existing entities
  const response = await universalApi.getEntities()
  const existing = extractData(response).filter(e => e.entity_type === entityType)

  // Create defaults if none exist
  if (existing.length === 0) {
    for (const item of defaults) {
      await universalApi.createEntity(
        {
          entity_type: entityType,
          smart_code: smartCode,
          ...item
        },
        organizationId
      )
    }

    // Fetch again to get created entities
    const newResponse = await universalApi.getEntities()
    return extractData(newResponse).filter(e => e.entity_type === entityType)
  }

  return existing
}

/**
 * Calculate period-based statistics from transactions
 */
export function calculatePeriodStats(
  transactions: any[],
  period: 'today' | 'week' | 'month' | 'year' = 'today'
) {
  const now = new Date()
  const startOfPeriod = new Date()

  switch (period) {
    case 'today':
      startOfPeriod.setHours(0, 0, 0, 0)
      break
    case 'week':
      startOfPeriod.setDate(now.getDate() - 7)
      break
    case 'month':
      startOfPeriod.setMonth(now.getMonth() - 1)
      break
    case 'year':
      startOfPeriod.setFullYear(now.getFullYear() - 1)
      break
  }

  const filtered = transactions.filter(t => {
    const txDate = new Date(t.transaction_date || t.created_at)
    return txDate >= startOfPeriod
  })

  const total = filtered.reduce((sum, t) => sum + (t.total_amount || 0), 0)

  // Group by type
  const byType = filtered.reduce(
    (acc, t) => {
      const type = t.transaction_type || 'unknown'
      if (!acc[type]) acc[type] = { count: 0, total: 0 }
      acc[type].count++
      acc[type].total += t.total_amount || 0
      return acc
    },
    {} as Record<string, { count: number; total: number }>
  )

  return {
    count: filtered.length,
    total,
    average: filtered.length > 0 ? total / filtered.length : 0,
    byType,
    transactions: filtered
  }
}

/**
 * Generate HERA smart code following naming convention
 */
export function generateSmartCode(
  module: string,
  subdomain: string,
  entity: string,
  action: string,
  version: number = 1
): string {
  const parts = [module, subdomain, entity, action].map(p => p.toUpperCase())
  return `HERA.${parts.join('.')}.v${version}`
}

/**
 * Create transaction with line items in one operation
 */
export async function createTransactionWithLines(
  transaction: {
    transaction_type: string
    transaction_code?: string
    smart_code: string
    total_amount: number
    metadata?: any
  },
  lines: Array<{
    line_amount: number
    smart_code: string
    metadata?: any
    line_entity_id?: string
    quantity?: number
    unit_price?: number
  }>,
  organizationId?: string
) {
  // Create main transaction
  const txResponse = await universalApi.createTransaction(transaction, organizationId)

  if (!txResponse.success || !txResponse.data) {
    throw new Error(txResponse.error || 'Failed to create transaction')
  }

  const transactionId = txResponse.data.id

  // Create line items
  const linePromises = lines.map((line, index) =>
    universalApi.createTransactionLine(
      {
        transaction_id: transactionId,
        line_number: index + 1,
        ...line
      },
      organizationId
    )
  )

  const lineResults = await Promise.all(linePromises)

  return {
    transaction: txResponse.data,
    lines: lineResults.map(r => r.data).filter(Boolean)
  }
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDate(
  transactions: any[],
  startDate: string | Date,
  endDate?: string | Date
): any[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : new Date()

  return transactions.filter(t => {
    const txDate = new Date(t.transaction_date || t.created_at)
    return txDate >= start && txDate <= end
  })
}

/**
 * Group items by a key
 */
export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce(
    (groups, item) => {
      const groupKey = String(item[key])
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(item)
      return groups
    },
    {} as Record<string, T[]>
  )
}

/**
 * Format currency with proper decimals
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Standard error handler for async operations
 */
export async function handleApiOperation<T>(
  operation: () => Promise<T>,
  options?: {
    onError?: (error: Error) => void
    errorMessage?: string
    throwOnError?: boolean
  }
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error')
    const message = options?.errorMessage || error.message

    console.error('API operation error:', error)

    if (options?.onError) {
      options.onError(error)
    }

    if (options?.throwOnError) {
      throw error
    }

    return { success: false, error: message }
  }
}
