/**
 * HERA SDK Utilities - Helper Functions and Constants
 * Smart Code: HERA.SDK.UTILS.CORE.v1
 */

import { HeraClientOptions } from '../types'
import { HeraClient } from '../client/HeraClient'
import { HeraMCPClient } from '../client/HeraMCPClient'
import { HeraAIClient } from '../client/HeraAIClient'
import { HERA_SMART_CODE_REGEX, validateOrganizationId } from '../validation'

export { HERA_SMART_CODE_REGEX }

/**
 * Create HERA Client with validation
 */
export function createHeraClient(options: HeraClientOptions): HeraClient {
  validateClientOptions(options)
  return new HeraClient(options)
}

/**
 * Create HERA MCP Client
 */
export function createHeraMCPClient(options: HeraClientOptions): HeraMCPClient {
  validateClientOptions(options)
  return new HeraMCPClient(options)
}

/**
 * Create HERA AI Client
 */
export function createHeraAIClient(options: HeraClientOptions): HeraAIClient {
  validateClientOptions(options)
  return new HeraAIClient(options)
}

/**
 * Validate client options
 */
function validateClientOptions(options: HeraClientOptions): void {
  if (!options.supabaseUrl) {
    throw new Error('Supabase URL is required')
  }
  
  if (!options.supabaseAnonKey) {
    throw new Error('Supabase anon key is required')
  }
  
  if (!validateOrganizationId(options.organizationId)) {
    throw new Error('Valid organization ID is required')
  }
  
  if (!options.supabaseUrl.includes('supabase.co')) {
    throw new Error('Invalid Supabase URL format')
  }
}

/**
 * Check if response is error
 */
export function isHeraError(response: any): response is { 
  success: false, 
  error: string,
  violations?: string[],
  suggestions?: string[]
} {
  return response && response.success === false && typeof response.error === 'string'
}

/**
 * Format HERA error for display
 */
export function formatHeraError(response: any): string {
  if (!isHeraError(response)) {
    return 'Unknown error'
  }
  
  let message = response.error
  
  if (response.violations && response.violations.length > 0) {
    message += '\nViolations:\n' + response.violations.map((v: string) => `- ${v}`).join('\n')
  }
  
  if (response.suggestions && response.suggestions.length > 0) {
    message += '\nSuggestions:\n' + response.suggestions.map((s: string) => `- ${s}`).join('\n')
  }
  
  return message
}

/**
 * Generate request ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID()
}

/**
 * Validate environment
 */
export function validateEnvironment(environment?: string): 'development' | 'staging' | 'production' {
  const validEnvironments = ['development', 'staging', 'production'] as const
  
  if (!environment) {
    return 'development'
  }
  
  if (validEnvironments.includes(environment as any)) {
    return environment as 'development' | 'staging' | 'production'
  }
  
  throw new Error(`Invalid environment: ${environment}. Must be one of: ${validEnvironments.join(', ')}`)
}

/**
 * Get default timeout based on environment
 */
export function getDefaultTimeout(environment: string): number {
  switch (environment) {
    case 'production':
      return 30000 // 30 seconds
    case 'staging':
      return 45000 // 45 seconds
    default:
      return 60000 // 60 seconds for development
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount)
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        break
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any
  }
  
  if (typeof obj === 'object') {
    const cloned: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * Sanitize data for logging (remove sensitive fields)
 */
export function sanitizeForLogging(data: any): any {
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'authorization',
    'ssn', 'social_security', 'credit_card', 'cvv', 'pin'
  ]
  
  const sanitized = deepClone(data)
  
  function sanitizeObject(obj: any): void {
    if (typeof obj !== 'object' || obj === null) {
      return
    }
    
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]'
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key])
      }
    }
  }
  
  sanitizeObject(sanitized)
  return sanitized
}

/**
 * Performance measurement utilities
 */
export class PerformanceTracker {
  private startTime: number
  private markers: Map<string, number> = new Map()
  
  constructor() {
    this.startTime = performance.now()
  }
  
  mark(name: string): void {
    this.markers.set(name, performance.now())
  }
  
  measure(name: string): number {
    const markTime = this.markers.get(name)
    if (!markTime) {
      throw new Error(`Mark '${name}' not found`)
    }
    return markTime - this.startTime
  }
  
  getElapsedTime(): number {
    return performance.now() - this.startTime
  }
  
  getAllMeasures(): Record<string, number> {
    const measures: Record<string, number> = {}
    for (const [name, time] of this.markers) {
      measures[name] = time - this.startTime
    }
    return measures
  }
}

/**
 * Cache with TTL support
 */
export class TTLCache<K, V> {
  private cache: Map<K, { value: V, expiry: number }> = new Map()
  
  set(key: K, value: V, ttl: number): void {
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return undefined
    }
    
    return entry.value
  }
  
  has(key: K): boolean {
    return this.get(key) !== undefined
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    // Clean expired entries first
    const now = Date.now()
    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
    return this.cache.size
  }
}