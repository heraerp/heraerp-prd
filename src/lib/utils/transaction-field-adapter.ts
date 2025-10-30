/**
 * 🔧 Transaction Field Adapter - Emergency Fix
 * 
 * Transforms legacy debit_amount/credit_amount fields to unit_amount + debit_credit
 * This ensures compatibility with the actual database schema.
 * 
 * Smart Code: HERA.UTILS.FIELD.ADAPTER.TRANSACTION.V1
 */

interface LegacyTransactionLine {
  debit_amount?: number
  credit_amount?: number
  unit_amount?: number
  debit_credit?: 'debit' | 'credit'
  [key: string]: any
}

interface ModernTransactionLine {
  unit_amount: number
  debit_credit?: 'debit' | 'credit'
  metadata?: {
    debit_amount?: number
    credit_amount?: number
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Transforms a single transaction line from legacy format to modern format
 */
export function adaptTransactionLine(line: LegacyTransactionLine): ModernTransactionLine {
  const { debit_amount, credit_amount, unit_amount, debit_credit, ...rest } = line

  // If already in modern format, return as-is
  if (unit_amount !== undefined && debit_credit !== undefined) {
    return line as ModernTransactionLine
  }

  // If already has unit_amount but no debit_credit, infer direction
  if (unit_amount !== undefined) {
    return {
      ...rest,
      unit_amount,
      debit_credit: unit_amount >= 0 ? 'debit' : 'credit',
      metadata: {
        ...rest.metadata,
        debit_amount: unit_amount >= 0 ? unit_amount : 0,
        credit_amount: unit_amount < 0 ? Math.abs(unit_amount) : 0
      }
    }
  }

  // Transform from legacy debit_amount/credit_amount format
  const hasDebit = debit_amount && debit_amount > 0
  const hasCredit = credit_amount && credit_amount > 0

  if (hasDebit && hasCredit) {
    throw new Error('Line cannot have both debit_amount and credit_amount')
  }

  const amount = hasDebit ? debit_amount! : (hasCredit ? credit_amount! : 0)
  const direction = hasDebit ? 'debit' : 'credit'

  return {
    ...rest,
    unit_amount: amount,
    debit_credit: direction,
    metadata: {
      ...rest.metadata,
      debit_amount: debit_amount || 0,
      credit_amount: credit_amount || 0
    }
  }
}

/**
 * Transforms an array of transaction lines
 */
export function adaptTransactionLines(lines: LegacyTransactionLine[]): ModernTransactionLine[] {
  return lines.map(adaptTransactionLine)
}

/**
 * Transforms a complete transaction object with lines
 */
export function adaptTransactionData(transaction: {
  lines?: LegacyTransactionLine[]
  [key: string]: any
}): any {
  if (!transaction.lines) {
    return transaction
  }

  return {
    ...transaction,
    lines: adaptTransactionLines(transaction.lines)
  }
}

/**
 * Reverses the transformation - converts modern format back to legacy
 * Useful for backward compatibility with existing components
 */
export function toLegacyFormat(line: ModernTransactionLine): LegacyTransactionLine {
  const { unit_amount, debit_credit, metadata, ...rest } = line

  return {
    ...rest,
    debit_amount: debit_credit === 'debit' ? unit_amount : 0,
    credit_amount: debit_credit === 'credit' ? unit_amount : 0,
    unit_amount, // Keep for compatibility
    debit_credit, // Keep for compatibility
    metadata
  }
}

/**
 * Validates that a line has correct field structure for database
 */
export function validateModernLine(line: any): boolean {
  return (
    typeof line.unit_amount === 'number' &&
    (line.debit_credit === 'debit' || line.debit_credit === 'credit' || line.debit_credit === undefined)
  )
}

/**
 * Helper to calculate totals from modern format lines
 */
export function calculateTotals(lines: ModernTransactionLine[]) {
  const totalDebits = lines
    .filter(line => line.debit_credit === 'debit')
    .reduce((sum, line) => sum + line.unit_amount, 0)

  const totalCredits = lines
    .filter(line => line.debit_credit === 'credit')
    .reduce((sum, line) => sum + line.unit_amount, 0)

  return {
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
  }
}