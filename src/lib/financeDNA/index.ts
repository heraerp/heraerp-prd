/**
 * HERA Finance DNA - Main Registry
 * Central registration for all domain-specific finance rules
 */

import { applyJewelryFinanceRules } from './packs/jewelry'
import type { GLEntry, FinanceContext } from './types'

// Define types for consistency
export interface TransactionHeader {
  transaction_type: string
  smart_code: string
  total_amount: number
  business_context: Record<string, any>
}

export interface TransactionLine {
  line_number: number
  line_entity_id?: string
  line_amount: number
  smart_code: string
  quantity?: number
  unit_price?: number
  [key: string]: any // Allow domain-specific fields
}

export interface FinanceRuleResult {
  glEntries: GLEntry[]
  errors: string[]
}

export type FinanceRuleProcessor = (
  header: TransactionHeader,
  lines: TransactionLine[],
  orgCtx: FinanceContext
) => FinanceRuleResult

// Registry of all finance rule processors
const FINANCE_RULES_REGISTRY: Map<string, FinanceRuleProcessor> = new Map()

/**
 * Register finance rules for a domain
 */
export function registerFinanceRules(domain: string, processor: FinanceRuleProcessor): void {
  FINANCE_RULES_REGISTRY.set(domain, processor)
  console.log(`[Finance DNA] Registered rules for domain: ${domain}`)
}

/**
 * Process transaction through appropriate finance rules
 */
export function processTransactionFinance(
  header: TransactionHeader,
  lines: TransactionLine[],
  orgCtx: FinanceContext
): FinanceRuleResult {
  // Determine domain from smart code
  const smartCodeParts = header.smart_code.split('.')
  if (smartCodeParts.length < 3) {
    return { glEntries: [], errors: ['Invalid smart code format'] }
  }

  const domain = smartCodeParts[1] // HERA.JEWELRY.SALE.POS.V1 -> JEWELRY
  const processor = FINANCE_RULES_REGISTRY.get(domain)

  if (!processor) {
    return { glEntries: [], errors: [`No finance rules registered for domain: ${domain}`] }
  }

  try {
    return processor(header, lines, orgCtx)
  } catch (error) {
    return {
      glEntries: [],
      errors: [`Finance processing error: ${error instanceof Error ? error.message : error}`]
    }
  }
}

/**
 * Get all registered domains
 */
export function getRegisteredDomains(): string[] {
  return Array.from(FINANCE_RULES_REGISTRY.keys())
}

// Register all available finance rules
registerFinanceRules('JEWELRY', applyJewelryFinanceRules)

// Export commonly used types and functions
export { GLEntry, FinanceContext } from './types'
export { applyJewelryFinanceRules } from './packs/jewelry'
