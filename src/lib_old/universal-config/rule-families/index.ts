/**
 * HERA Universal Configuration - Rule Families Index
 *
 * Central export for all rule family definitions
 */

// Import all rule families
export * from './booking-rules'
export * from './notification-rules'
export * from './pricing-rules'

// Import family definitions
import { BookingRuleFamily } from './booking-rules'
import { NotificationRuleFamily } from './notification-rules'
import { PricingRuleFamily } from './pricing-rules'

// Rule family registry
export const RuleFamilyRegistry = {
  // Core rule families
  [BookingRuleFamily.family]: BookingRuleFamily,
  [NotificationRuleFamily.family]: NotificationRuleFamily,
  [PricingRuleFamily.family]: PricingRuleFamily,

  // Sub-family mappings for quick lookup
  subFamilies: {
    // Booking sub-families
    ...Object.entries(BookingRuleFamily.subFamilies).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [value]: { family: BookingRuleFamily.family, subFamily: key }
      }),
      {}
    ),

    // Notification sub-families
    ...Object.entries(NotificationRuleFamily.subFamilies).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [value]: { family: NotificationRuleFamily.family, subFamily: key }
      }),
      {}
    ),

    // Pricing sub-families
    ...Object.entries(PricingRuleFamily.subFamilies).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [value]: { family: PricingRuleFamily.family, subFamily: key }
      }),
      {}
    )
  }
} as const

// Helper to get family from smart code
export function getRuleFamilyFromSmartCode(smartCode: string): string | null {
  // Extract family prefix (e.g., HERA.UNIV.CONFIG.BOOKING from HERA.UNIV.CONFIG.BOOKING.GENERAL.v1)
  const parts = smartCode.split('.')
  if (parts.length >= 4 && parts[0] === 'HERA' && parts[1] === 'UNIV' && parts[2] === 'CONFIG') {
    return parts.slice(0, 4).join('.')
  }
  return null
}

// Helper to validate rule against its family
export function validateRule(rule: any): {
  isValid: boolean
  errors: string[]
  family?: string
} {
  const family = getRuleFamilyFromSmartCode(rule.smart_code)
  if (!family) {
    return {
      isValid: false,
      errors: ['Invalid smart code format']
    }
  }

  const familyDef = RuleFamilyRegistry[family]
  if (!familyDef) {
    return {
      isValid: false,
      errors: [`Unknown rule family: ${family}`]
    }
  }

  const errors = familyDef.validate(rule)
  return {
    isValid: errors.length === 0,
    errors,
    family
  }
}

// Type exports for convenience
export type RuleFamily =
  | typeof BookingRuleFamily
  | typeof NotificationRuleFamily
  | typeof PricingRuleFamily

export type RuleFamilyName = keyof typeof RuleFamilyRegistry

// Smart code patterns by family
export const SmartCodePatterns = {
  booking: /^HERA\.UNIV\.CONFIG\.BOOKING\./,
  notification: /^HERA\.UNIV\.CONFIG\.NOTIFICATION\./,
  pricing: /^HERA\.UNIV\.CONFIG\.PRICING\./
} as const

// Default priority by family (can be overridden)
export const DefaultPriorities = {
  'HERA.UNIV.CONFIG.BOOKING': 100,
  'HERA.UNIV.CONFIG.NOTIFICATION': 50,
  'HERA.UNIV.CONFIG.PRICING': 150
} as const

// Merge strategies
export type MergeStrategy =
  | 'first' // First matching rule wins
  | 'last' // Last matching rule wins
  | 'highest' // Highest priority wins
  | 'stack' // Stack/combine multiple rules
  | 'restrictive' // Most restrictive rule wins
  | 'permissive' // Most permissive rule wins
  | 'combine' // Combine payloads from all rules

// Get merge strategy for a family
export function getMergeStrategy(family: string): MergeStrategy {
  const familyDef = RuleFamilyRegistry[family]
  return familyDef?.mergeStrategy || 'highest'
}

// Template helpers
export function getRuleTemplates(family: string): Record<string, any> {
  const familyDef = RuleFamilyRegistry[family]
  return familyDef?.templates || {}
}

export function getRuleTemplate(family: string, templateName: string): any {
  const templates = getRuleTemplates(family)
  return templates[templateName]
}

// Context validation
export function validateContext(family: string, context: any): string[] {
  const familyDef = RuleFamilyRegistry[family]
  if (!familyDef || !familyDef.requiredContext) {
    return []
  }

  const errors: string[] = []
  for (const field of familyDef.requiredContext) {
    if (context[field] === undefined) {
      errors.push(`Missing required context field: ${field}`)
    }
  }

  return errors
}
