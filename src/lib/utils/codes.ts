/**
 * Utility functions for generating codes
 */

/**
 * Generate a transaction code with prefix
 */
export function generateTransactionCode(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`.toUpperCase()
}

/**
 * Generate an entity code with prefix and sequence
 */
export function generateEntityCode(prefix: string, sequence?: number): string {
  const seq = sequence ? sequence.toString().padStart(6, '0') : Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 5)
  return `${prefix}-${seq}-${random}`.toUpperCase()
}

/**
 * Generate a smart code
 */
export function generateSmartCode(
  industry: string,
  module: string,
  type: string,
  subtype?: string,
  version: string = 'v1'
): string {
  const parts = ['HERA', industry.toUpperCase(), module.toUpperCase(), type.toUpperCase()]
  if (subtype) {
    parts.push(subtype.toUpperCase())
  }
  parts.push(version)
  return parts.join('.')
}
