/**
 * Smart Code validation utilities
 */

export const SMARTCODE_RE = new RegExp(
  '^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$'
)

export function isSmartCode(x: string): boolean {
  return SMARTCODE_RE.test(x)
}

export function validateSmartCode(code: string): { valid: boolean; error?: string } {
  if (!code) {
    return { valid: false, error: 'Smart code is required' }
  }

  if (!isSmartCode(code)) {
    return {
      valid: false,
      error:
        'Invalid smart code format. Expected: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}'
    }
  }

  return { valid: true }
}

export function extractModuleFromSmartCode(code: string): string {
  const parts = code.split('.')
  if (parts.length >= 4) {
    return parts[3]
  }
  return 'UNKNOWN'
}

export function extractVersionFromSmartCode(code: string): string {
  const versionMatch = code.match(/\.v(\d+)$/)
  return versionMatch ? versionMatch[1] : '0'
}
