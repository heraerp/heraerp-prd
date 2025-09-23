/**
 * Unified Playbook API Client
 *
 * This client handles all communication with the Playbook API through our secure proxy.
 * It provides consistent error handling, response parsing, and timeout management.
 */

export type ListShape<T> = {
  items?: T[]
  rows?: T[]
  data?: T[]
  total?: number
  count?: number
}

/**
 * Extract items and total from various response shapes
 */
export function extractList<T>(json: ListShape<T>) {
  const items = json.items ?? json.rows ?? json.data ?? []
  const total = json.total ?? json.count ?? items.length
  return { items, total }
}

/**
 * Generate a correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `pb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Universal Playbook API client
 *
 * @param path - API path (e.g., '/entities', '/universal_transactions')
 * @param options - Request options
 * @returns Typed JSON response
 */
export async function pb<T = any>(
  path: string,
  {
    query,
    method = 'GET',
    body,
    timeoutMs = 12_000,
    correlationId
  }: {
    query?: Record<string, any>
    method?: string
    body?: any
    timeoutMs?: number
    correlationId?: string
  } = {}
) {
  // Generate correlation ID if not provided
  const corrId = correlationId || generateCorrelationId()
  // Build URL with query parameters
  const url = new URL(`/api/playbook${path}`, 'http://localhost') // relative for Next.js
  Object.entries(query || {}).forEach(([key, value]) => {
    if ((value ?? '') !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  // Setup timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  pbLog(`[${corrId}] Request:`, { path, method, query, hasBody: !!body })

  try {
    // Make the request
    const response = await fetch(url.pathname + url.search, {
      method,
      cache: 'no-store',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        'X-Correlation-ID': corrId
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Parse response
    const text = await response.text()
    const json = text ? JSON.parse(text) : {}

    pbLog(`[${corrId}] Response:`, { status: response.status, hasData: !!json })

    // Handle errors
    if (!response.ok) {
      pbLog(`[${corrId}] Error:`, { status: response.status, error: json })
      throw new Error(json?.error || json?.message || text || `HTTP ${response.status}`)
    }

    return json as T
  } catch (error) {
    clearTimeout(timeoutId)

    pbLog(`[${corrId}] Error:`, error)

    // Enhance error message
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Playbook request timeout after ${timeoutMs}ms`)
      }
      throw new Error(`Playbook proxy error: ${error.message}`)
    }
    throw new Error(`Playbook proxy error: ${String(error)}`)
  }
}

/**
 * Get dynamic data for entities
 */
export async function getDD(entity_ids: string[], smart_code: string, organization_id: string) {
  const result = await pb<{ data?: Record<string, Record<string, any>> }>('/dynamic_data/query', {
    method: 'POST',
    body: { entity_ids, smart_code, organization_id }
  })

  // The endpoint now returns data as a map of entity_id -> field_name -> field_data
  // We need to extract just the field we're looking for based on the smart_code
  const fieldName = smart_code.split('.').slice(-2, -1)[0].toUpperCase() // e.g., PRICE, TAX, COMMISSION

  const data: Record<string, any> = {}

  if (result.data && typeof result.data === 'object') {
    // For each entity, get the specific field data
    Object.entries(result.data).forEach(([entityId, fields]) => {
      if (fields && fields[fieldName]) {
        data[entityId] = fields[fieldName]
      }
    })
  }

  return data
}

/**
 * Helper to build query with optional branch filtering
 */
export function withBranch(
  query: Record<string, any>,
  branchId?: string | 'ALL'
): Record<string, any> {
  if (branchId && branchId !== 'ALL') {
    return { ...query, branch_id: branchId }
  }
  return query
}

// Debug flag
const debug = !!process.env.NEXT_PUBLIC_DEBUG_PLAYBOOK

/**
 * Debug logger
 */
export function pbLog(message: string, data?: any) {
  if (debug) {
    console.log(`[Playbook] ${message}`, data || '')
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries?: number
  retryDelay?: number
  retryOn?: (error: any) => boolean
  idempotent?: boolean
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: error => {
    // Retry on network errors and 5xx server errors
    if (error.name === 'AbortError') return false // Don't retry timeouts
    if (error.message?.includes('fetch failed')) return true
    if (error.message?.includes('HTTP 5')) return true
    return false
  },
  idempotent: false
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Universal Playbook API client with retry support
 *
 * @param path - API path (e.g., '/entities', '/universal_transactions')
 * @param options - Request options including retry configuration
 * @returns Typed JSON response
 */
export async function pbWithRetry<T = any>(
  path: string,
  options: {
    query?: Record<string, any>
    method?: string
    body?: any
    timeoutMs?: number
    retry?: RetryConfig
    correlationId?: string
  } = {}
): Promise<T> {
  const { retry = {}, ...pbOptions } = options
  const config = { ...defaultRetryConfig, ...retry }
  const corrId = pbOptions.correlationId || generateCorrelationId()

  // Only retry GET requests or explicitly marked idempotent operations
  const canRetry = pbOptions.method === 'GET' || config.idempotent
  const maxAttempts = canRetry ? (config.maxRetries ?? 0) + 1 : 1

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      pbLog(`[${corrId}] Attempt ${attempt}/${maxAttempts} for ${path}`)
      return await pb<T>(path, { ...pbOptions, correlationId: corrId })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      const shouldRetry = attempt < maxAttempts && canRetry && config.retryOn?.(lastError)

      if (shouldRetry) {
        const delay = config.retryDelay ?? 1000
        pbLog(`Retrying after ${delay}ms due to: ${lastError.message}`)
        await sleep(delay * attempt) // Exponential backoff
      } else {
        throw lastError
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}
