import { z } from 'zod'

export const UUID = z.string().uuid()
export const SmartCode = z
  .string()
  .regex(/^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,7}\.[Vv][0-9]+$/)

export const requireOrg = (org?: string) => {
  if (!org) throw new Error('organization_id is required')
}

export const guardSmartCode = (code?: string) => {
  if (!code) throw new Error('smart_code is required')
  if (!SmartCode.safeParse(code).success) throw new Error('smart_code pattern invalid')
}

export interface SmartCodeParts {
  full: string
  prefix: string
  industry: string
  module: string
  segments: string[]
  version: string
}

export const parseSmartCode = (code: string): SmartCodeParts => {
  guardSmartCode(code)
  const parts = code.split('.')

  return {
    full: code,
    prefix: parts[0], // HERA
    industry: parts[1], // e.g., SALON, REST, HLTH
    module: parts[2], // e.g., SVC, PROD, POS
    segments: parts.slice(3, -1), // Middle segments
    version: parts[parts.length - 1] // v1, v2, etc.
  }
}
// compat re-exports
export {
  UuidZ,
  guardOrganization,
  normalizeEntityType,
  validateSmartCodeSegment
} from './guardrails-core'

// Direct export of GuardrailViolation type
export type { GuardrailViolation } from './guardrails-core'

// TEMP shim type re-export to satisfy imports
export type GuardrailViolation = {
  code: string;
  message: string;
  path?: string[];
}
