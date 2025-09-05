/**
 * GL Balance Validator
 * Enforces balanced journal entries for GL transactions
 */

import { UniversalTransactionLine } from '@/types/database'

interface BalanceValidationResult {
  is_balanced: boolean
  total_debits: number
  total_credits: number
  difference: number
  errors: string[]
}

/**
 * Validate GL transaction lines are balanced
 */
export function validateGLBalance(
  lines: Partial<UniversalTransactionLine>[],
  smartCode: string
): BalanceValidationResult {
  const result: BalanceValidationResult = {
    is_balanced: false,
    total_debits: 0,
    total_credits: 0,
    difference: 0,
    errors: []
  }

  // Only validate GL transactions
  if (!smartCode.includes('.GL.')) {
    result.is_balanced = true
    return result
  }

  // Calculate totals
  lines.forEach((line, index) => {
    if (!line.line_amount || !line.metadata?.posting_type) {
      result.errors.push(`Line ${index + 1}: Missing amount or posting type`)
      return
    }

    const amount = Math.abs(line.line_amount)
    const postingType = line.metadata.posting_type as string

    if (postingType === 'debit' || postingType === 'DR') {
      result.total_debits += amount
    } else if (postingType === 'credit' || postingType === 'CR') {
      result.total_credits += amount
    } else {
      result.errors.push(`Line ${index + 1}: Invalid posting type '${postingType}'`)
    }
  })

  // Check balance
  result.difference = Math.abs(result.total_debits - result.total_credits)
  result.is_balanced = result.difference < 0.01 // Allow for rounding

  if (!result.is_balanced) {
    result.errors.push(
      `Unbalanced entry: Debits=${result.total_debits.toFixed(2)}, Credits=${result.total_credits.toFixed(2)}, Difference=${result.difference.toFixed(2)}`
    )
  }

  return result
}

/**
 * Normalize GL account references
 */
export function normalizeGLAccount(entityType: string): string {
  // Enforce 'account' instead of 'gl_account'
  if (entityType === 'gl_account') {
    return 'account'
  }
  return entityType
}

/**
 * Validate GL account entity
 */
export function validateGLAccountEntity(entity: {
  entity_type: string
  metadata?: any
}): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check entity type
  if (entity.entity_type === 'gl_account') {
    errors.push("Use entity_type='account' instead of 'gl_account'")
  }

  // Check required metadata
  if (!entity.metadata?.ledger_type) {
    errors.push("GL accounts must have metadata.ledger_type")
  }

  if (!entity.metadata?.account_category) {
    errors.push("GL accounts must have metadata.account_category")
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Create balanced GL lines helper
 */
export function createBalancedGLLines(params: {
  debitAccount: string
  creditAccount: string
  amount: number
  description: string
  smartCodePrefix: string
}): Partial<UniversalTransactionLine>[] {
  const { debitAccount, creditAccount, amount, description, smartCodePrefix } = params

  return [
    {
      line_entity_id: debitAccount,
      line_number: 1,
      line_amount: amount,
      smart_code: `${smartCodePrefix}.DEBIT.v1`,
      metadata: {
        posting_type: 'debit',
        description,
        gl_account: debitAccount
      }
    },
    {
      line_entity_id: creditAccount,
      line_number: 2,
      line_amount: amount,
      smart_code: `${smartCodePrefix}.CREDIT.v1`,
      metadata: {
        posting_type: 'credit',
        description,
        gl_account: creditAccount
      }
    }
  ]
}