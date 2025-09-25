import { z } from 'zod'

/**
 * HERA V2 API - Transaction Validation Schemas (Zod)
 * Event-sourced CRUD: Create (txn-emit) + Read + Query + Reverse
 * Sacred Six tables only - enforces HERA DNA principles
 */

// Smart code pattern validation (UPPERCASE, 6+ segments, .V#)
const SmartCodePattern = /^HERA\.[A-Z0-9]+(\.[A-Z0-9]+){4,}\.V[0-9]+$/
const SmartCode = z
  .string()
  .regex(
    SmartCodePattern,
    'Invalid HERA smart code format - must be UPPERCASE with 6+ segments ending in .V#'
  )

// ================================================
// TXN-READ SCHEMAS
// ================================================

export const TxnReadSchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID format'),
  transaction_id: z.string().uuid('Invalid transaction ID format'),
  include_lines: z.boolean().optional().default(true)
})

export const TxnReadResponseSchema = z.object({
  api_version: z.literal('v2'),
  transaction: z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    transaction_type: z.string(),
    transaction_code: z.string().optional(),
    transaction_date: z.string().datetime(),
    source_entity_id: z.string().uuid().optional().nullable(),
    target_entity_id: z.string().uuid().optional().nullable(),
    total_amount: z.number().optional().nullable(),
    currency: z.string().optional().nullable(),
    smart_code: SmartCode,
    reference: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    business_context: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
    ai_confidence: z.number().min(0).max(1).optional(),
    ai_insights: z.record(z.any()).optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    version: z.number(),
    lines: z
      .array(
        z.object({
          id: z.string().uuid(),
          line_number: z.number(),
          line_type: z.string(),
          line_entity_id: z.string().uuid().optional().nullable(),
          quantity: z.number().optional().nullable(),
          unit_price: z.number().optional().nullable(),
          line_amount: z.number().optional().nullable(),
          discount_amount: z.number().optional().nullable(),
          tax_amount: z.number().optional().nullable(),
          total_amount: z.number().optional().nullable(),
          currency: z.string().optional().nullable(),
          dr_cr: z.enum(['DR', 'CR', 'dr', 'cr']).optional().nullable(),
          smart_code: SmartCode.optional().nullable(),
          description: z.string().optional().nullable(),
          status: z.string().optional().nullable(),
          metadata: z.record(z.any()).optional(),
          ai_confidence: z.number().min(0).max(1).optional(),
          created_at: z.string().datetime(),
          updated_at: z.string().datetime(),
          version: z.number()
        })
      )
      .optional()
  })
})

// ================================================
// TXN-QUERY SCHEMAS
// ================================================

export const TxnQuerySchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID format'),
  source_entity_id: z.string().uuid('Invalid source entity ID format').optional(),
  target_entity_id: z.string().uuid('Invalid target entity ID format').optional(),
  transaction_type: z.string().min(1).optional(),
  smart_code_like: z.string().min(1).optional(),
  date_from: z.string().datetime('Invalid date format').optional(),
  date_to: z.string().datetime('Invalid date format').optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().min(0).optional(),
  include_lines: z.boolean().optional()
})

export const TxnQueryResponseSchema = z.object({
  api_version: z.literal('v2'),
  transactions: z.array(
    z.object({
      id: z.string().uuid(),
      organization_id: z.string().uuid(),
      transaction_type: z.string(),
      transaction_code: z.string().optional().nullable(),
      transaction_date: z.string().datetime(),
      source_entity_id: z.string().uuid().optional().nullable(),
      target_entity_id: z.string().uuid().optional().nullable(),
      total_amount: z.number().optional().nullable(),
      currency: z.string().optional().nullable(),
      smart_code: SmartCode,
      reference: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      status: z.string().optional().nullable(),
      business_context: z.record(z.any()).optional(),
      metadata: z.record(z.any()).optional(),
      ai_confidence: z.number().min(0).max(1).optional(),
      ai_insights: z.record(z.any()).optional(),
      created_at: z.string().datetime(),
      updated_at: z.string().datetime(),
      version: z.number(),
      lines: z.array(z.any()).optional() // Lines are optional in query response
    })
  ),
  total: z.number().int().min(0),
  limit: z.number().int().positive(),
  offset: z.number().int().min(0)
})

// ================================================
// TXN-REVERSE SCHEMAS
// ================================================

export const TxnReverseSchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID format'),
  original_transaction_id: z.string().uuid('Invalid transaction ID format'),
  smart_code: SmartCode,
  reason: z.string().min(1, 'Reversal reason is required').trim()
})

export const TxnReverseResponseSchema = z.object({
  api_version: z.literal('v2'),
  reversal_transaction_id: z.string().uuid(),
  original_transaction_id: z.string().uuid(),
  lines_reversed: z.number().int().min(0),
  reversal_reason: z.string()
})

// ================================================
// TXN-EMIT SCHEMAS (for completeness - already exists)
// ================================================

export const TxnEmitLineSchema = z
  .object({
    line_number: z.number().int().positive().optional(), // Auto-generated if not provided
    line_type: z.string().min(1),
    smart_code: SmartCode, // REQUIRED - every line must have smart code
    entity_id: z.string().uuid().optional(),
    quantity: z.number().optional(),
    unit_price: z.number().optional(), // Primary field - matches database schema
    unit_amount: z.number().optional(), // Backward compatibility - will be normalized to unit_price
    line_amount: z.number().optional(),
    description: z.string().optional(),
    dr_cr: z.enum(['DR', 'CR', 'dr', 'cr']).optional(),
    metadata: z.record(z.any()).optional(),
    require_balance: z.boolean().optional() // For financial validation
  })
  .transform(data => {
    // Normalize unit_amount to unit_price for backward compatibility
    if (data.unit_amount !== undefined && data.unit_price === undefined) {
      data.unit_price = data.unit_amount
    }
    // Remove unit_amount from the final object
    const { unit_amount, ...normalizedData } = data
    return normalizedData
  })

export const TxnEmitSchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID format'),
  transaction_type: z.string().min(1),
  smart_code: SmartCode,
  transaction_date: z.string().datetime('Invalid transaction date format'),
  source_entity_id: z.string().uuid().optional().nullable(),
  target_entity_id: z.string().uuid().optional().nullable(),
  business_context: z.record(z.any()).optional().default({}),
  lines: z.array(TxnEmitLineSchema).min(1, 'At least one transaction line is required'),
  require_balance: z.boolean().optional().default(false), // For financial transactions
  idempotency_key: z.string().optional() // For deduplication
})

// ================================================
// TYPE EXPORTS
// ================================================

export type TxnRead = z.infer<typeof TxnReadSchema>
export type TxnReadResponse = z.infer<typeof TxnReadResponseSchema>
export type TxnQuery = z.infer<typeof TxnQuerySchema>
export type TxnQueryResponse = z.infer<typeof TxnQueryResponseSchema>
export type TxnReverse = z.infer<typeof TxnReverseSchema>
export type TxnReverseResponse = z.infer<typeof TxnReverseResponseSchema>
export type TxnEmit = z.infer<typeof TxnEmitSchema>
export type TxnEmitLine = z.infer<typeof TxnEmitLineSchema>

// ================================================
// UTILITY VALIDATORS
// ================================================

/**
 * Validate smart code format
 */
export const validateSmartCode = (code: string): boolean => {
  return SmartCodePattern.test(code)
}

/**
 * Validate financial balance (DR = CR per currency)
 */
export const validateFinancialBalance = (lines: TxnEmitLine[], tolerance = 0.01): boolean => {
  const balances: Record<string, { debits: number; credits: number }> = {}

  lines.forEach(line => {
    if (!line.dr_cr || !line.line_amount) return

    const currency = 'default' // Could be extracted from line if multi-currency
    if (!balances[currency]) {
      balances[currency] = { debits: 0, credits: 0 }
    }

    if (line.dr_cr.toUpperCase() === 'DR') {
      balances[currency].debits += line.line_amount
    } else if (line.dr_cr.toUpperCase() === 'CR') {
      balances[currency].credits += line.line_amount
    }
  })

  // Check balance for each currency
  return Object.values(balances).every(
    balance => Math.abs(balance.debits - balance.credits) <= tolerance
  )
}

/**
 * Generate reversal smart code from original
 */
export const generateReversalSmartCode = (originalSmartCode: string): string => {
  // Replace the last segment before version with REVERSE
  const parts = originalSmartCode.split('.')
  if (parts.length >= 2) {
    parts[parts.length - 2] = 'REVERSE'
  }
  return parts.join('.')
}

// ================================================
// GUARDRAIL VALIDATION
// ================================================

export const validateTxnGuardrails = {
  /**
   * Organization ID required (ORG-FILTER-REQUIRED)
   */
  organizationRequired: (data: any): boolean => {
    return !!data.organization_id
  },

  /**
   * Smart code present and valid (SMARTCODE-PRESENT)
   */
  smartCodeValid: (data: any): boolean => {
    return !!data.smart_code && validateSmartCode(data.smart_code)
  },

  /**
   * Transaction header required (TXN-HEADER-REQUIRED)
   */
  headerRequired: (data: any): boolean => {
    return !!(data.transaction_type && data.transaction_date)
  },

  /**
   * Transaction lines required (TXN-LINE-REQUIRED)
   */
  linesRequired: (data: any): boolean => {
    return Array.isArray(data.lines) && data.lines.length > 0
  },

  /**
   * GL balanced if financial transaction (GL-BALANCED)
   */
  glBalanced: (data: any): boolean => {
    if (!data.smart_code?.includes('.FIN.') && !data.smart_code?.includes('.GL.')) {
      return true // Not a financial transaction
    }
    return validateFinancialBalance(data.lines || [])
  }
}
