/**
 * HERA UI Binder - Query DSL Parser
 * Simple query parsing without external dependencies
 */

import type { QueryDSLParams, ParsedQuery } from './types'

/**
 * Parse query parameters into normalized format
 */
export function parseQuery(params: QueryDSLParams): ParsedQuery {
  const { filter, order = 'created_at desc', pageSize = 50, page = 1, search } = params

  // Calculate pagination
  const limit = Math.max(1, Math.min(1000, pageSize)) // Clamp between 1-1000
  const offset = Math.max(0, (page - 1) * limit)

  // Parse order clause
  let orderBy = 'created_at desc'
  if (order) {
    const orderParts = order.trim().split(/\s+/)
    if (orderParts.length >= 1) {
      const column = orderParts[0]
      const direction = orderParts[1]?.toLowerCase() === 'asc' ? 'asc' : 'desc'

      // Validate column name (simple alphanumeric + underscore)
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
        orderBy = `${column} ${direction}`
      }
    }
  }

  // Parse filter expression (simple key:value pairs)
  let filters: Record<string, any> = {}
  if (filter) {
    try {
      filters = parseSimpleFilter(filter)
    } catch (error) {
      console.warn('Failed to parse filter expression:', filter, error)
    }
  }

  return {
    limit,
    offset,
    orderBy,
    search: search?.trim() || undefined,
    filters: Object.keys(filters).length > 0 ? filters : undefined
  }
}

/**
 * Parse simple filter expressions like "status:active,category:jewelry"
 */
function parseSimpleFilter(filterStr: string): Record<string, any> {
  const filters: Record<string, any> = {}

  if (!filterStr?.trim()) {
    return filters
  }

  // Split by comma for multiple filters
  const filterPairs = filterStr.split(',')

  for (const pair of filterPairs) {
    const trimmedPair = pair.trim()
    if (!trimmedPair) continue

    // Split by colon for key:value
    const colonIndex = trimmedPair.indexOf(':')
    if (colonIndex === -1) continue

    const key = trimmedPair.substring(0, colonIndex).trim()
    const value = trimmedPair.substring(colonIndex + 1).trim()

    if (!key || !value) continue

    // Validate key (alphanumeric + underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) continue

    // Parse value based on content
    filters[key] = parseFilterValue(value)
  }

  return filters
}

/**
 * Parse individual filter values with type detection
 */
function parseFilterValue(value: string): any {
  // Remove quotes if present
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  // Boolean values
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false

  // Null value
  if (value.toLowerCase() === 'null') return null

  // Numeric values
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10)
  }

  if (/^-?\d*\.\d+$/.test(value)) {
    return parseFloat(value)
  }

  // Range expressions like "100..200"
  if (/^\d+\.\.\d+$/.test(value)) {
    const [min, max] = value.split('..').map(Number)
    return { min, max }
  }

  // Array expressions like "[a,b,c]"
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      const innerValue = value.slice(1, -1)
      if (!innerValue.trim()) return []

      return innerValue.split(',').map(item => parseFilterValue(item.trim()))
    } catch {
      return value // Return as string if parsing fails
    }
  }

  // Default to string
  return value
}

/**
 * Build SQL WHERE clause from parsed filters (for server-side filtering)
 */
export function buildWhereClause(filters: Record<string, any>): {
  clause: string
  params: any[]
} {
  if (!filters || Object.keys(filters).length === 0) {
    return { clause: '', params: [] }
  }

  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(filters)) {
    if (value === null) {
      conditions.push(`${key} IS NULL`)
    } else if (Array.isArray(value)) {
      const placeholders = value.map(() => `$${paramIndex++}`).join(',')
      conditions.push(`${key} IN (${placeholders})`)
      params.push(...value)
    } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
      conditions.push(`${key} BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
      params.push(value.min, value.max)
      paramIndex += 2
    } else {
      conditions.push(`${key} = $${paramIndex}`)
      params.push(value)
      paramIndex++
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  }
}

/**
 * Apply client-side filtering to data array
 */
export function applyClientFilters<T extends Record<string, any>>(
  data: T[],
  filters: Record<string, any>
): T[] {
  if (!filters || Object.keys(filters).length === 0) {
    return data
  }

  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      const itemValue = getNestedValue(item, key)

      if (value === null) {
        return itemValue === null || itemValue === undefined
      }

      if (Array.isArray(value)) {
        return value.includes(itemValue)
      }

      if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        const numValue = Number(itemValue)
        return !isNaN(numValue) && numValue >= value.min && numValue <= value.max
      }

      return itemValue === value
    })
  })
}

/**
 * Get nested object value by key path (supports dot notation)
 */
function getNestedValue(obj: any, path: string): any {
  if (!path) return obj

  return path.split('.').reduce((current, key) => {
    return current?.[key]
  }, obj)
}

/**
 * Apply client-side sorting to data array
 */
export function applyClientSort<T extends Record<string, any>>(data: T[], orderBy: string): T[] {
  if (!orderBy) return data

  const [column, direction = 'asc'] = orderBy.split(/\s+/)
  const isDesc = direction.toLowerCase() === 'desc'

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, column)
    const bValue = getNestedValue(b, column)

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return isDesc ? 1 : -1
    if (bValue == null) return isDesc ? -1 : 1

    // Compare values
    let comparison = 0
    if (aValue < bValue) comparison = -1
    else if (aValue > bValue) comparison = 1

    return isDesc ? -comparison : comparison
  })
}

/**
 * Apply client-side search to data array
 */
export function applyClientSearch<T extends Record<string, any>>(
  data: T[],
  search: string,
  searchFields: string[] = ['entity_name', 'entity_code', 'name', 'code']
): T[] {
  if (!search?.trim()) return data

  const searchTerm = search.toLowerCase().trim()

  return data.filter(item => {
    return searchFields.some(field => {
      const value = getNestedValue(item, field)
      return value?.toString().toLowerCase().includes(searchTerm)
    })
  })
}
