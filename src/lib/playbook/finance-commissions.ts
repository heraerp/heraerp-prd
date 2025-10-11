'use client'

import { universalApi } from '@/lib/universal-api-v2'
import { heraCode } from '@/lib/smart-codes'
import { flags } from '@/config/flags'
import { getOrgSettings } from '@/lib/playbook/org-finance-utils'
import { resolveBranchEntityId } from '@/lib/playbook/branch-resolver'

interface TransactionLine {
  line_entity_id?: string
  line_number: number
  quantity?: number
  unit_price?: number
  line_amount: number
  smart_code: string
  line_data?: any
}

interface PosTransactionData {
  organization_id: string
  transaction_type: string
  smart_code: string
  total_amount: number
  business_context: {
    branch_id: string
    source: string
    customer_id?: string
    appointment_id?: string
    [key: string]: any
  }
  line_items: TransactionLine[]
}

interface CommissionRule {
  stylist_id: string
  service_types?: string[]
  commission_rate: number
  commission_type: 'percentage' | 'fixed'
  min_amount?: number
  max_amount?: number
}

interface ValidationError {
  code: string
  message: string
  field?: string
}

/**
 * Post an event with branch enforcement
 * Ensures branch_id is present in business_context and mirrored to all line_data
 */
export async function postEventWithBranch(transactionData: PosTransactionData): Promise<{
  success: boolean
  transaction_id?: string
  transaction_code?: string
  error?: string
}> {
  try {
    // Validate branch enforcement
    const branchValidation = assertBranchOnEvent(transactionData)
    if (!branchValidation.isValid) {
      throw new Error(`Branch validation failed: ${branchValidation.errors.join(', ')}`)
    }

    // Set organization context
    universalApi.setOrganizationId(transactionData.organization_id)

    // Resolve branch entity ID
    const resolvedBranchId = await resolveBranchEntityId(
      transactionData.organization_id,
      transactionData.business_context.branch_id
    )

    // Create transaction header - STRICT columns only
    const transactionHeader = {
      organization_id: transactionData.organization_id,
      transaction_type: transactionData.transaction_type, // Use the transaction type from input data
      transaction_date: new Date().toISOString(),
      smart_code: heraCode(transactionData.smart_code), // Ensure .v1 format
      total_amount: Number(transactionData.total_amount) || 0,
      transaction_code: generateTransactionCode(transactionData.transaction_type),
      source_entity_id: resolvedBranchId, // Valid branch entity or null
      target_entity_id: transactionData.business_context.customer_id || null,
      business_context: {
        branch_id: resolvedBranchId || transactionData.business_context.branch_id,
        ticket_id: transactionData.business_context.ticket_id,
        source: transactionData.business_context.source || 'POS',
        customer_id: transactionData.business_context.customer_id,
        appointment_id: transactionData.business_context.appointment_id,
        cashier_id: transactionData.business_context.cashier_id,
        till_id: transactionData.business_context.till_id
      },
      metadata: {
        ui: 'pos',
        cashier_id: transactionData.business_context.cashier_id,
        till_id: transactionData.business_context.till_id
      }
    }

    console.debug('POS header payload →', transactionHeader)

    const transactionResponse = await universalApi.createTransaction(transactionHeader)

    if (!transactionResponse.success || !transactionResponse.data) {
      console.error('DB header insert error →', transactionResponse.error)
      throw new Error(
        `createTransaction failed: ${transactionResponse.error?.message || transactionResponse.error || 'Unknown error'}`
      )
    }

    const transactionId = transactionResponse.data.id
    const transactionCode = transactionResponse.data.transaction_code

    // Create transaction lines with STRICT columns
    let lineNumber = 1
    for (const line of transactionData.line_items) {
      const lineData = {
        organization_id: transactionData.organization_id,
        transaction_id: transactionId,
        line_number: lineNumber++,
        line_type: line.line_data?.entity_type?.toUpperCase() || 'SERVICE',
        entity_id: line.line_entity_id || null,
        description: line.line_data?.entity_name || '',
        quantity: Number(line.quantity) || 1,
        unit_amount: Number(line.unit_price || line.line_amount) || 0,
        line_amount: Number(line.line_amount) || 0,
        smart_code: heraCode(line.smart_code), // Ensure .v1 format
        line_data: line.line_data || {}
      }

      console.debug('Creating transaction line:', lineData)

      const lineResponse = await universalApi.createTransactionLine(lineData)

      if (!lineResponse.success) {
        console.error('DB line insert error →', lineResponse.error, lineData)
        throw new Error(
          `createTransactionLine failed: ${lineResponse.error?.message || lineResponse.error || 'Unknown error'}`
        )
      }
    }

    return {
      success: true,
      transaction_id: transactionId,
      transaction_code: transactionCode
    }
  } catch (error) {
    console.error('Error posting event with branch:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Post a POS sale with automatic commission calculation
 * Appends commission expense and payable lines for each stylist
 */
export async function postPosSaleWithCommission(transactionData: PosTransactionData): Promise<{
  success: boolean
  transaction_id?: string
  transaction_code?: string
  commission_lines?: TransactionLine[]
  error?: string
}> {
  try {
    // Commission gating
    const org = await getOrgSettings(transactionData.organization_id)
    const commissionsEnabled =
      flags.ENABLE_COMMISSIONS && (org?.salon?.commissions?.enabled ?? true)

    // Skip commission lines when disabled
    let commissionLines: TransactionLine[] = []
    let enhancedTransactionData = transactionData

    if (commissionsEnabled) {
      // Validate commission requirements
      const commissionValidation = await assertCommissionOnPosSale(transactionData)
      if (!commissionValidation.isValid) {
        throw new Error(`Commission validation failed: ${commissionValidation.errors.join(', ')}`)
      }

      // Calculate commissions for each stylist
      commissionLines = await calculateCommissions(transactionData)

      // Create enhanced transaction data with commission lines
      enhancedTransactionData = {
        ...transactionData,
        line_items: [...transactionData.line_items, ...commissionLines]
      }
    }

    // Validate that lines are balanced
    const balanceValidation = validateBalancedLines(enhancedTransactionData)
    if (!balanceValidation.isValid) {
      throw new Error(`Balance validation failed: ${balanceValidation.errors.join(', ')}`)
    }

    // Post the transaction with all lines
    const result = await postEventWithBranch(enhancedTransactionData)

    return {
      ...result,
      commission_lines: commissionLines
    }
  } catch (error) {
    console.error('Error posting POS sale with commission:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate commission lines for a POS transaction
 */
async function calculateCommissions(
  transactionData: PosTransactionData
): Promise<TransactionLine[]> {
  const commissionLines: TransactionLine[] = []

  // Group service lines by stylist
  const serviceLinesByStylist = new Map<string, TransactionLine[]>()

  for (const line of transactionData.line_items) {
    if (line.smart_code.includes('SVC.') || line.smart_code.includes('SERVICE')) {
      const stylistId =
        line.line_data?.stylist_entity_id ||
        line.line_data?.stylist_id ||
        line.line_data?.performer_entity_id
      if (stylistId) {
        if (!serviceLinesByStylist.has(stylistId)) {
          serviceLinesByStylist.set(stylistId, [])
        }
        serviceLinesByStylist.get(stylistId)!.push(line)
      }
    }
  }

  // Calculate commission for each stylist
  let commissionLineNumber = transactionData.line_items.length + 1

  for (const [stylistId, lines] of serviceLinesByStylist) {
    const totalServiceAmount = lines.reduce((sum, line) => sum + line.line_amount, 0)

    // Get commission rule for stylist (in production, this would come from database)
    const commissionRule = await getCommissionRule(stylistId, transactionData.organization_id)

    if (commissionRule && totalServiceAmount >= (commissionRule.min_amount || 0)) {
      let commissionAmount: number

      if (commissionRule.commission_type === 'percentage') {
        commissionAmount = totalServiceAmount * (commissionRule.commission_rate / 100)
      } else {
        commissionAmount = commissionRule.commission_rate
      }

      // Apply max amount if specified
      if (commissionRule.max_amount && commissionAmount > commissionRule.max_amount) {
        commissionAmount = commissionRule.max_amount
      }

      // Commission expense line (debit)
      commissionLines.push({
        line_number: commissionLineNumber++,
        line_amount: commissionAmount,
        smart_code: heraCode('HERA.SALON.POS.LINE.COMMISSION.EXPENSE.V1'),
        line_data: {
          branch_id: transactionData.business_context.branch_id,
          stylist_id: stylistId,
          commission_rate: commissionRule.commission_rate,
          commission_type: commissionRule.commission_type,
          service_amount: totalServiceAmount
        }
      })

      // Commission payable line (credit)
      commissionLines.push({
        line_number: commissionLineNumber++,
        line_amount: -commissionAmount, // Negative for credit
        smart_code: heraCode('HERA.SALON.POS.LINE.COMMISSION.PAYABLE.V1'),
        line_data: {
          branch_id: transactionData.business_context.branch_id,
          stylist_id: stylistId,
          commission_rate: commissionRule.commission_rate,
          commission_type: commissionRule.commission_type,
          service_amount: totalServiceAmount
        }
      })
    }
  }

  return commissionLines
}

/**
 * Get commission rule for a stylist (mock implementation)
 * In production, this would query the database
 */
async function getCommissionRule(
  stylistId: string,
  organizationId: string
): Promise<CommissionRule | null> {
  // Mock commission rules - in production, these would be stored in core_dynamic_data
  const mockRules: CommissionRule[] = [
    {
      stylist_id: 'stylist-1',
      commission_rate: 40, // 40%
      commission_type: 'percentage',
      min_amount: 10
    },
    {
      stylist_id: 'stylist-2',
      commission_rate: 35, // 35%
      commission_type: 'percentage',
      min_amount: 10
    },
    {
      stylist_id: 'stylist-3',
      commission_rate: 45, // 45%
      commission_type: 'percentage',
      min_amount: 10
    }
  ]

  return (
    mockRules.find(rule => rule.stylist_id === stylistId) || {
      stylist_id: stylistId,
      commission_rate: 30, // Default 30%
      commission_type: 'percentage',
      min_amount: 10
    }
  )
}

/**
 * Assert that event has consistent branch_id across business_context and all lines
 */
export function assertBranchOnEvent(transactionData: PosTransactionData): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check that branch_id exists in business_context
  if (!transactionData.business_context?.branch_id) {
    errors.push('branch_id is required in business_context')
  }

  const expectedBranchId = transactionData.business_context?.branch_id

  // Check that all lines have matching branch_id in line_data
  for (const line of transactionData.line_items) {
    if (line.line_data?.branch_id && line.line_data.branch_id !== expectedBranchId) {
      errors.push(
        `Line ${line.line_number} has mismatched branch_id: expected ${expectedBranchId}, got ${line.line_data.branch_id}`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Assert that POS sale has proper commission accrual lines
 */
export async function assertCommissionOnPosSale(transactionData: PosTransactionData): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // ✅ FIXED: Check for SALE transaction (supports both old POS.SALE and new TXN.SALE patterns)
  const isSaleTransaction =
    transactionData.smart_code.includes('TXN.SALE.') ||
    transactionData.smart_code.includes('POS.SALE.') ||
    transactionData.transaction_type === 'SALE'

  if (!isSaleTransaction) {
    errors.push('Transaction must be a SALE transaction to require commission validation')
    return { isValid: false, errors }
  }

  // Commission gating
  const org = await getOrgSettings(transactionData.organization_id)
  const commissionsEnabled = flags.ENABLE_COMMISSIONS && (org?.salon?.commissions?.enabled ?? true)

  if (!commissionsEnabled) {
    return { isValid: true, errors: [] }
  }

  // Check that there are service lines with stylists
  const serviceLines = transactionData.line_items.filter(
    line => line.smart_code.includes('SVC.') || line.smart_code.includes('SERVICE')
  )

  if (serviceLines.length > 0) {
    const stylistLines = serviceLines.filter(
      line =>
        line.line_data?.stylist_entity_id ||
        line.line_data?.stylist_id ||
        line.line_data?.performer_entity_id
    )

    if (stylistLines.length === 0) {
      errors.push('POS sale must have at least one service line with assigned stylist')
    }
  }

  // Validate each service line has proper structure
  const stylistLines = serviceLines.filter(
    line =>
      line.line_data?.stylist_entity_id ||
      line.line_data?.stylist_id ||
      line.line_data?.performer_entity_id
  )

  for (const line of stylistLines) {
    const hasStylist =
      line.line_data?.stylist_entity_id ||
      line.line_data?.stylist_id ||
      line.line_data?.performer_entity_id
    if (!hasStylist) {
      errors.push(`Service line ${line.line_number} must have stylist_entity_id in line_data`)
    }
    if (!line.line_amount || line.line_amount <= 0) {
      errors.push(`Service line ${line.line_number} must have positive line_amount`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate that transaction lines are balanced (sum to zero for GL postings)
 */
function validateBalancedLines(transactionData: PosTransactionData): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Group lines by currency
  const currencyTotals = new Map<string, number>()

  for (const line of transactionData.line_items) {
    const currency = line.line_data?.currency || 'AED' // Default currency
    const currentTotal = currencyTotals.get(currency) || 0
    currencyTotals.set(currency, currentTotal + line.line_amount)
  }

  // Check that each currency balances to zero (within tolerance)
  const tolerance = 0.01 // 1 cent tolerance for rounding

  for (const [currency, total] of currencyTotals) {
    if (Math.abs(total) > tolerance) {
      errors.push(`Currency ${currency} does not balance: total = ${total.toFixed(2)}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate a transaction code based on transaction type
 */
function generateTransactionCode(transactionType: string): string {
  const prefix = transactionType.toUpperCase().slice(0, 4)
  const timestamp = Date.now().toString().slice(-6)
  return `${prefix}-${timestamp}`
}

/**
 * Validation helpers for testing
 */
export const validators = {
  assertBranchOnEvent,
  assertCommissionOnPosSale,
  validateBalancedLines
}
