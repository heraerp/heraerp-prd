/**
 * Smart Code Normalizer
 * Ensures all smart codes comply with HERA guardrail regex requirements
 */

const SMART_CODE_REGEX = /^HERA\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.v\d+$/

/**
 * Normalize smart code to match guardrail requirements
 * - Converts V1 → v1 (lowercase v)
 * - Validates against official regex
 */
export function normalizeSmartCode(code: string): string {
  if (!code) {
    throw new Error('Smart code is required')
  }

  // Fix common casing issue: V1 → v1
  const normalized = code.replace(/\.V(\d+)$/, '.v$1')

  // Validate against guardrail regex
  if (!SMART_CODE_REGEX.test(normalized)) {
    throw new Error(
      `Invalid smart code format: ${code}. Expected: HERA.DOMAIN.SUBDOMAIN.ACTION.TYPE.v[version]`
    )
  }

  return normalized
}

/**
 * Validate smart code without normalizing
 */
export function isValidSmartCode(code: string): boolean {
  return SMART_CODE_REGEX.test(code)
}

/**
 * Extract smart code components
 */
export function parseSmartCode(code: string): {
  domain: string
  subdomain: string
  action: string
  type: string
  version: number
} {
  const normalized = normalizeSmartCode(code)
  const parts = normalized.split('.')

  return {
    domain: parts[1],
    subdomain: parts[2],
    action: parts[3],
    type: parts[4],
    version: parseInt(parts[5].substring(1)) // Remove 'v' prefix
  }
}

/**
 * Smart code family matcher for RBAC
 */
export function matchesSmartCodeFamily(code: string, pattern: string): boolean {
  const normalized = normalizeSmartCode(code)

  // Convert pattern to regex (e.g., HERA.FIN.* → HERA\.FIN\..*)
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')

  return new RegExp(`^${regexPattern}$`).test(normalized)
}
