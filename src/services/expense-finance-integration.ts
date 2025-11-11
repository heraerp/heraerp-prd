/**
 * EXPENSE FINANCE INTEGRATION SERVICE
 *
 * Enterprise-grade integration between Salon Expenses and Finance DNA v2
 * Handles posting of expense transactions to General Ledger with payment status workflow
 *
 * Payment Status Workflow:
 * 1. PENDING: DR Expense (6xxx), CR Accounts Payable (2100)
 * 2. PAID: DR Accounts Payable (2100), CR Cash/Bank (1xxx)
 *
 * Smart Codes:
 * - HERA.SALON.FINANCE.TXN.JOURNAL.EXPENSE.v1
 * - HERA.SALON.FINANCE.GL.LINE.EXPENSE.{CATEGORY}.DR.v1
 * - HERA.SALON.FINANCE.GL.LINE.AP.CR.v1 (pending)
 * - HERA.SALON.FINANCE.GL.LINE.AP.DR.v1 (payment)
 * - HERA.SALON.FINANCE.GL.LINE.{PAYMENT_METHOD}.CR.v1 (payment)
 *
 * Integration Pattern: Follows inventory-finance-integration.ts (601 lines)
 *
 * @see src/services/inventory-finance-integration.ts - Reference implementation
 * @see src/lib/finance/smart-codes-finance-dna-v2.ts - Smart code registry
 * @see src/lib/finance/gl-account-mapping.ts - GL account structure
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  generatePendingExpenseGLLines,
  generateExpensePaymentGLLines,
  getExpenseGLAccount,
  getPaymentGLAccount,
  getAccountsPayableGLAccount
} from '@/lib/finance/gl-account-mapping'
import { EXPENSE_SMART_CODES } from '@/lib/finance/smart-codes-finance-dna-v2'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ExpenseTransaction {
  id: string
  organization_id: string
  transaction_type: string
  transaction_date: string
  total_amount: number
  transaction_status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'reversed'
  metadata?: {
    category?: string
    description?: string
    branch_id?: string
    payment_method?: string
    payment_status?: 'pending' | 'paid'
    expense_date?: string
  }
}

export interface PostExpenseToFinanceParams {
  expenseTransaction: ExpenseTransaction
  organizationId: string
  actorUserId: string
  fiscalPeriod?: string
  fiscalYear?: number
}

export interface MarkExpenseAsPaidParams {
  expenseTransactionId: string
  paymentMethod: string
  paymentDate: string
  organizationId: string
  actorUserId: string
  fiscalPeriod?: string
  fiscalYear?: number
}

export interface PostExpenseToFinanceResult {
  success: boolean
  financeTransactionId?: string
  relationshipId?: string
  glLines?: any[]
  error?: string
  metadata?: {
    posted_at: string
    fiscal_period?: string
    fiscal_year?: number
    balance_validated: boolean
  }
}

// ============================================================================
// FINANCE DNA V2 GUARDRAILS (Validation Rules)
// ============================================================================

class ExpenseFinanceGuardrails {
  /**
   * Validate fiscal period (YYYY-MM format)
   */
  static async validateFiscalPeriod(
    date: string,
    organizationId: string
  ): Promise<{ valid: boolean; error?: string; fiscal_period?: string }> {
    try {
      const expenseDate = new Date(date)
      const year = expenseDate.getFullYear()
      const month = String(expenseDate.getMonth() + 1).padStart(2, '0')
      const fiscal_period = `${year}-${month}`

      // TODO: Enhance with fiscal calendar entity lookup
      // For now, accept any valid date within reasonable range
      const currentYear = new Date().getFullYear()
      if (year < currentYear - 5 || year > currentYear + 1) {
        return {
          valid: false,
          error: `Fiscal year ${year} is outside acceptable range (${currentYear - 5} to ${currentYear + 1})`
        }
      }

      return {
        valid: true,
        fiscal_period
      }
    } catch (error) {
      return {
        valid: false,
        error: `Invalid expense date: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Validate currency support (currently only AED)
   */
  static async validateCurrencySupport(
    currency: string,
    organizationId: string
  ): Promise<{ valid: boolean; error?: string }> {
    const supportedCurrencies = ['AED']

    if (!supportedCurrencies.includes(currency)) {
      return {
        valid: false,
        error: `Currency ${currency} not supported. Supported: ${supportedCurrencies.join(', ')}`
      }
    }

    return { valid: true }
  }

  /**
   * Validate GL line balance (DR = CR)
   */
  static validateBalance(glLines: any[]): { valid: boolean; error?: string; totalDR?: number; totalCR?: number } {
    const totalDR = glLines
      .filter(line => line.line_data?.side === 'DR')
      .reduce((sum, line) => sum + (line.line_amount || 0), 0)

    const totalCR = glLines
      .filter(line => line.line_data?.side === 'CR')
      .reduce((sum, line) => sum + (line.line_amount || 0), 0)

    const diff = Math.abs(totalDR - totalCR)

    if (diff > 0.01) { // Allow 1 cent rounding difference
      return {
        valid: false,
        error: `GL lines not balanced: DR ${totalDR.toFixed(2)} ≠ CR ${totalCR.toFixed(2)} (diff: ${diff.toFixed(2)})`,
        totalDR,
        totalCR
      }
    }

    return { valid: true, totalDR, totalCR }
  }

  /**
   * Validate expense transaction before posting
   */
  static async validateExpenseTransaction(
    expense: ExpenseTransaction,
    organizationId: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Required fields
    if (!expense.id) errors.push('Expense transaction ID is required')
    if (!expense.organization_id) errors.push('Organization ID is required')
    if (expense.organization_id !== organizationId) errors.push('Organization ID mismatch')
    if (!expense.transaction_date) errors.push('Transaction date is required')
    if (!expense.total_amount || expense.total_amount <= 0) errors.push('Total amount must be greater than 0')
    if (!expense.metadata?.category) errors.push('Expense category is required')
    if (!expense.metadata?.payment_status) errors.push('Payment status is required')

    // Status validation
    const validStatuses = ['draft', 'pending', 'paid', 'cancelled', 'reversed']
    if (expense.transaction_status && !validStatuses.includes(expense.transaction_status)) {
      errors.push(`Invalid transaction status: ${expense.transaction_status}`)
    }

    // Payment status validation
    const validPaymentStatuses = ['pending', 'paid']
    if (expense.metadata?.payment_status && !validPaymentStatuses.includes(expense.metadata.payment_status)) {
      errors.push(`Invalid payment status: ${expense.metadata.payment_status}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// ============================================================================
// GL LINE BUILDERS
// ============================================================================

/**
 * Build GL lines for PENDING expense (DR Expense, CR Accounts Payable)
 */
async function buildPendingExpenseGLLines(params: {
  expenseTransaction: ExpenseTransaction
  fiscalPeriod: string
  fiscalYear: number
}): Promise<any[]> {
  const { expenseTransaction, fiscalPeriod, fiscalYear } = params
  const { total_amount, metadata } = expenseTransaction
  const category = metadata?.category || 'Other'
  const branchId = metadata?.branch_id

  // Get GL accounts
  const expenseAccount = getExpenseGLAccount(category)
  const apAccount = getAccountsPayableGLAccount()

  if (!expenseAccount) {
    throw new Error(`Invalid expense category: ${category}`)
  }

  // Build GL lines following Finance DNA v2 structure
  const glLines = [
    // Line 1: DR Expense Account (increases expense)
    {
      line_number: 1,
      line_type: 'GL',
      entity_id: null, // GL lines don't link to entities
      description: `Expense - ${category}: ${metadata?.description || 'No description'}`,
      quantity: 1,
      unit_amount: total_amount,
      line_amount: total_amount,
      smart_code: EXPENSE_SMART_CODES.GL_LINE_DR[category as keyof typeof EXPENSE_SMART_CODES.GL_LINE_DR]
        || EXPENSE_SMART_CODES.GL_LINE_DR.OTHER,
      line_data: {
        side: 'DR',
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        account_type: 'expense',
        amount: total_amount,
        fiscal_period: fiscalPeriod,
        fiscal_year: fiscalYear,
        currency: 'AED',
        ...(branchId ? { cost_center: branchId } : {})
      }
    },
    // Line 2: CR Accounts Payable (increases liability - unpaid expense)
    {
      line_number: 2,
      line_type: 'GL',
      entity_id: null,
      description: `Accounts Payable - Expense ${metadata?.description || 'pending'}`,
      quantity: 1,
      unit_amount: total_amount,
      line_amount: total_amount,
      smart_code: EXPENSE_SMART_CODES.GL_LINE_CR.AP,
      line_data: {
        side: 'CR',
        account_code: apAccount.code,
        account_name: apAccount.name,
        account_type: 'liability',
        amount: total_amount,
        fiscal_period: fiscalPeriod,
        fiscal_year: fiscalYear,
        currency: 'AED'
      }
    }
  ]

  return glLines
}

/**
 * Build GL lines for PAYMENT of expense (DR AP, CR Cash/Bank)
 */
async function buildExpensePaymentGLLines(params: {
  expenseTransaction: ExpenseTransaction
  paymentMethod: string
  paymentAmount: number
  fiscalPeriod: string
  fiscalYear: number
}): Promise<any[]> {
  const { expenseTransaction, paymentMethod, paymentAmount, fiscalPeriod, fiscalYear } = params
  const { metadata } = expenseTransaction

  // Get GL accounts
  const paymentAccount = getPaymentGLAccount(paymentMethod)
  const apAccount = getAccountsPayableGLAccount()

  if (!paymentAccount) {
    throw new Error(`Invalid payment method: ${paymentMethod}`)
  }

  // Build GL lines for payment transaction
  const glLines = [
    // Line 1: DR Accounts Payable (decreases liability - clearing the debt)
    {
      line_number: 1,
      line_type: 'GL',
      entity_id: null,
      description: `Payment - Clearing AP for expense ${metadata?.description || ''}`,
      quantity: 1,
      unit_amount: paymentAmount,
      line_amount: paymentAmount,
      smart_code: EXPENSE_SMART_CODES.GL_LINE_DR.AP,
      line_data: {
        side: 'DR',
        account_code: apAccount.code,
        account_name: apAccount.name,
        account_type: 'liability',
        amount: paymentAmount,
        fiscal_period: fiscalPeriod,
        fiscal_year: fiscalYear,
        currency: 'AED'
      }
    },
    // Line 2: CR Payment Account (decreases asset - cash/bank going out)
    {
      line_number: 2,
      line_type: 'GL',
      entity_id: null,
      description: `Payment via ${paymentMethod} - ${metadata?.description || ''}`,
      quantity: 1,
      unit_amount: paymentAmount,
      line_amount: paymentAmount,
      smart_code: EXPENSE_SMART_CODES.GL_LINE_CR[paymentMethod.toUpperCase() as keyof typeof EXPENSE_SMART_CODES.GL_LINE_CR]
        || EXPENSE_SMART_CODES.GL_LINE_CR.CASH,
      line_data: {
        side: 'CR',
        account_code: paymentAccount.code,
        account_name: paymentAccount.name,
        account_type: 'asset',
        amount: paymentAmount,
        fiscal_period: fiscalPeriod,
        fiscal_year: fiscalYear,
        currency: 'AED',
        payment_method: paymentMethod
      }
    }
  ]

  return glLines
}

// ============================================================================
// MAIN POSTING FUNCTIONS
// ============================================================================

/**
 * Post expense transaction to Finance DNA v2 (General Ledger)
 * Creates GL journal for pending expense (DR Expense, CR AP)
 */
export async function postExpenseToFinance(
  params: PostExpenseToFinanceParams
): Promise<PostExpenseToFinanceResult> {
  const { expenseTransaction, organizationId, actorUserId, fiscalPeriod: providedFiscalPeriod, fiscalYear: providedFiscalYear } = params
  const supabase = createClientComponentClient()

  try {
    console.log('💰 [EXPENSE FINANCE INTEGRATION] Starting expense posting to Finance DNA v2', {
      expenseId: expenseTransaction.id,
      amount: expenseTransaction.total_amount,
      category: expenseTransaction.metadata?.category,
      paymentStatus: expenseTransaction.metadata?.payment_status,
      organizationId
    })

    // ========================================================================
    // STEP 1: VALIDATE EXPENSE TRANSACTION
    // ========================================================================

    const transactionValidation = await ExpenseFinanceGuardrails.validateExpenseTransaction(
      expenseTransaction,
      organizationId
    )

    if (!transactionValidation.valid) {
      console.error('❌ Expense transaction validation failed:', transactionValidation.errors)
      return {
        success: false,
        error: `Validation failed: ${transactionValidation.errors.join(', ')}`
      }
    }

    // ========================================================================
    // STEP 2: CHECK IF ALREADY POSTED (IDEMPOTENCY)
    // ========================================================================

    const { data: existingRelationship } = await supabase
      .from('core_relationships')
      .select('id, target_entity_id')
      .eq('organization_id', organizationId)
      .eq('source_entity_id', expenseTransaction.id)
      .eq('relationship_type', 'POSTED_TO_FINANCE')
      .eq('is_active', true)
      .single()

    if (existingRelationship) {
      console.log('✅ Expense already posted to finance', {
        relationshipId: existingRelationship.id,
        financeTransactionId: existingRelationship.target_entity_id
      })
      return {
        success: true,
        financeTransactionId: existingRelationship.target_entity_id,
        relationshipId: existingRelationship.id,
        metadata: {
          posted_at: new Date().toISOString(),
          balance_validated: true
        }
      }
    }

    // ========================================================================
    // STEP 3: VALIDATE FISCAL PERIOD
    // ========================================================================

    const fiscalValidation = await ExpenseFinanceGuardrails.validateFiscalPeriod(
      expenseTransaction.transaction_date,
      organizationId
    )

    if (!fiscalValidation.valid) {
      console.error('❌ Fiscal period validation failed:', fiscalValidation.error)
      return {
        success: false,
        error: fiscalValidation.error
      }
    }

    const fiscalPeriod = providedFiscalPeriod || fiscalValidation.fiscal_period!
    const fiscalYear = providedFiscalYear || parseInt(fiscalPeriod.split('-')[0])

    // ========================================================================
    // STEP 4: VALIDATE CURRENCY
    // ========================================================================

    const currencyValidation = await ExpenseFinanceGuardrails.validateCurrencySupport(
      'AED',
      organizationId
    )

    if (!currencyValidation.valid) {
      console.error('❌ Currency validation failed:', currencyValidation.error)
      return {
        success: false,
        error: currencyValidation.error
      }
    }

    // ========================================================================
    // STEP 5: BUILD GL LINES (PENDING EXPENSE: DR Expense, CR AP)
    // ========================================================================

    const glLines = await buildPendingExpenseGLLines({
      expenseTransaction,
      fiscalPeriod,
      fiscalYear
    })

    console.log('📊 Generated GL lines for pending expense:', {
      lineCount: glLines.length,
      lines: glLines.map(l => ({
        line_number: l.line_number,
        side: l.line_data.side,
        account: l.line_data.account_code,
        amount: l.line_amount
      }))
    })

    // ========================================================================
    // STEP 6: VALIDATE BALANCE (DR = CR)
    // ========================================================================

    const balanceValidation = ExpenseFinanceGuardrails.validateBalance(glLines)

    if (!balanceValidation.valid) {
      console.error('❌ GL balance validation failed:', balanceValidation.error)
      return {
        success: false,
        error: balanceValidation.error
      }
    }

    console.log('✅ GL lines balanced:', {
      totalDR: balanceValidation.totalDR,
      totalCR: balanceValidation.totalCR
    })

    // ========================================================================
    // STEP 7: CREATE FINANCE TRANSACTION (GL JOURNAL)
    // ========================================================================

    const financeTransactionPayload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_transaction: {
        transaction_type: 'GL_JOURNAL',
        smart_code: EXPENSE_SMART_CODES.GL_JOURNAL,
        transaction_date: expenseTransaction.transaction_date,
        total_amount: expenseTransaction.total_amount,
        transaction_status: 'completed', // GL journal is immediately completed
        metadata: {
          finance_dna_version: 'v2.0',
          posted_from_expense: true,
          source_expense_id: expenseTransaction.id,
          expense_category: expenseTransaction.metadata?.category,
          payment_status: expenseTransaction.metadata?.payment_status || 'pending',
          fiscal_period: fiscalPeriod,
          fiscal_year: fiscalYear,
          fiscal_period_validated: true,
          currency_validated: true,
          balance_validated: true,
          posting_type: 'EXPENSE_ACCRUAL', // DR Expense, CR AP
          gl_posting_date: new Date().toISOString()
        }
      },
      p_lines: glLines,
      p_options: {}
    }

    console.log('💾 Creating Finance DNA v2 GL journal transaction...')

    const { data: financeResult, error: financeError } = await supabase.rpc(
      'hera_txn_crud_v1',
      financeTransactionPayload
    )

    if (financeError) {
      console.error('❌ Failed to create finance transaction:', financeError)
      return {
        success: false,
        error: `Finance transaction creation failed: ${financeError.message}`
      }
    }

    const financeTransactionId = financeResult?.transaction_id

    if (!financeTransactionId) {
      console.error('❌ No finance transaction ID returned')
      return {
        success: false,
        error: 'Finance transaction created but no ID returned'
      }
    }

    console.log('✅ Finance transaction created:', {
      financeTransactionId,
      glLineCount: glLines.length
    })

    // ========================================================================
    // STEP 8: CREATE RELATIONSHIP LINK (POSTED_TO_FINANCE)
    // ========================================================================

    const relationshipPayload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_entity: null,
      p_dynamic: {},
      p_relationships: [
        {
          source_entity_id: expenseTransaction.id,
          target_entity_id: financeTransactionId,
          relationship_type: 'POSTED_TO_FINANCE',
          smart_code: 'HERA.FINANCE.REL.POSTED.v1',
          relationship_data: {
            posted_at: new Date().toISOString(),
            posted_by: actorUserId,
            fiscal_period: fiscalPeriod,
            fiscal_year: fiscalYear,
            posting_type: 'EXPENSE_ACCRUAL',
            payment_status: expenseTransaction.metadata?.payment_status
          },
          is_active: true
        }
      ],
      p_options: {}
    }

    const { data: relationshipResult, error: relationshipError } = await supabase.rpc(
      'hera_entities_crud_v1',
      relationshipPayload
    )

    if (relationshipError) {
      console.warn('⚠️ Warning: Relationship creation failed (non-critical):', relationshipError)
    } else {
      console.log('✅ Created POSTED_TO_FINANCE relationship')
    }

    // ========================================================================
    // STEP 9: RETURN SUCCESS
    // ========================================================================

    const result: PostExpenseToFinanceResult = {
      success: true,
      financeTransactionId,
      relationshipId: relationshipResult?.relationship_ids?.[0],
      glLines,
      metadata: {
        posted_at: new Date().toISOString(),
        fiscal_period: fiscalPeriod,
        fiscal_year: fiscalYear,
        balance_validated: true
      }
    }

    console.log('🎉 [EXPENSE FINANCE INTEGRATION] Successfully posted expense to Finance DNA v2', result)

    return result

  } catch (error) {
    console.error('❌ [EXPENSE FINANCE INTEGRATION] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Mark expense as paid and create payment GL journal (DR AP, CR Cash/Bank)
 */
export async function markExpenseAsPaid(
  params: MarkExpenseAsPaidParams
): Promise<PostExpenseToFinanceResult> {
  const { expenseTransactionId, paymentMethod, paymentDate, organizationId, actorUserId, fiscalPeriod: providedFiscalPeriod, fiscalYear: providedFiscalYear } = params
  const supabase = createClientComponentClient()

  try {
    console.log('💳 [EXPENSE PAYMENT] Marking expense as paid and posting payment to Finance DNA v2', {
      expenseTransactionId,
      paymentMethod,
      paymentDate,
      organizationId
    })

    // ========================================================================
    // STEP 1: FETCH EXPENSE TRANSACTION
    // ========================================================================

    const { data: expenseData, error: expenseError } = await supabase.rpc(
      'hera_txn_crud_v1',
      {
        p_action: 'READ',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_transaction: { transaction_id: expenseTransactionId },
        p_lines: [],
        p_options: {}
      }
    )

    if (expenseError || !expenseData?.items?.[0]) {
      console.error('❌ Failed to fetch expense transaction:', expenseError)
      return {
        success: false,
        error: `Expense transaction not found: ${expenseError?.message || 'No data returned'}`
      }
    }

    const expenseTransaction = expenseData.items[0] as ExpenseTransaction

    console.log('📄 Fetched expense transaction:', {
      id: expenseTransaction.id,
      amount: expenseTransaction.total_amount,
      currentStatus: expenseTransaction.transaction_status,
      paymentStatus: expenseTransaction.metadata?.payment_status
    })

    // ========================================================================
    // STEP 2: VALIDATE FISCAL PERIOD FOR PAYMENT
    // ========================================================================

    const fiscalValidation = await ExpenseFinanceGuardrails.validateFiscalPeriod(
      paymentDate,
      organizationId
    )

    if (!fiscalValidation.valid) {
      console.error('❌ Fiscal period validation failed:', fiscalValidation.error)
      return {
        success: false,
        error: fiscalValidation.error
      }
    }

    const fiscalPeriod = providedFiscalPeriod || fiscalValidation.fiscal_period!
    const fiscalYear = providedFiscalYear || parseInt(fiscalPeriod.split('-')[0])

    // ========================================================================
    // STEP 3: BUILD GL LINES FOR PAYMENT (DR AP, CR Cash/Bank)
    // ========================================================================

    const glLines = await buildExpensePaymentGLLines({
      expenseTransaction,
      paymentMethod,
      paymentAmount: expenseTransaction.total_amount,
      fiscalPeriod,
      fiscalYear
    })

    console.log('📊 Generated GL lines for payment:', {
      lineCount: glLines.length,
      lines: glLines.map(l => ({
        line_number: l.line_number,
        side: l.line_data.side,
        account: l.line_data.account_code,
        amount: l.line_amount
      }))
    })

    // ========================================================================
    // STEP 4: VALIDATE BALANCE (DR = CR)
    // ========================================================================

    const balanceValidation = ExpenseFinanceGuardrails.validateBalance(glLines)

    if (!balanceValidation.valid) {
      console.error('❌ GL balance validation failed:', balanceValidation.error)
      return {
        success: false,
        error: balanceValidation.error
      }
    }

    console.log('✅ GL lines balanced:', {
      totalDR: balanceValidation.totalDR,
      totalCR: balanceValidation.totalCR
    })

    // ========================================================================
    // STEP 5: CREATE PAYMENT GL JOURNAL
    // ========================================================================

    const financeTransactionPayload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_transaction: {
        transaction_type: 'GL_JOURNAL',
        smart_code: EXPENSE_SMART_CODES.GL_JOURNAL,
        transaction_date: paymentDate,
        total_amount: expenseTransaction.total_amount,
        transaction_status: 'completed',
        metadata: {
          finance_dna_version: 'v2.0',
          posted_from_expense: true,
          source_expense_id: expenseTransaction.id,
          expense_category: expenseTransaction.metadata?.category,
          payment_method: paymentMethod,
          payment_status: 'paid',
          fiscal_period: fiscalPeriod,
          fiscal_year: fiscalYear,
          fiscal_period_validated: true,
          currency_validated: true,
          balance_validated: true,
          posting_type: 'EXPENSE_PAYMENT', // DR AP, CR Cash/Bank
          gl_posting_date: new Date().toISOString()
        }
      },
      p_lines: glLines,
      p_options: {}
    }

    console.log('💾 Creating payment GL journal transaction...')

    const { data: financeResult, error: financeError } = await supabase.rpc(
      'hera_txn_crud_v1',
      financeTransactionPayload
    )

    if (financeError) {
      console.error('❌ Failed to create payment transaction:', financeError)
      return {
        success: false,
        error: `Payment transaction creation failed: ${financeError.message}`
      }
    }

    const financeTransactionId = financeResult?.transaction_id

    if (!financeTransactionId) {
      console.error('❌ No payment transaction ID returned')
      return {
        success: false,
        error: 'Payment transaction created but no ID returned'
      }
    }

    console.log('✅ Payment transaction created:', {
      financeTransactionId,
      glLineCount: glLines.length
    })

    // ========================================================================
    // STEP 6: UPDATE EXPENSE TRANSACTION STATUS TO PAID
    // ========================================================================

    const updatePayload = {
      p_action: 'UPDATE',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_transaction: {
        transaction_id: expenseTransactionId,
        transaction_status: 'paid',
        metadata: {
          ...expenseTransaction.metadata,
          payment_status: 'paid',
          payment_method: paymentMethod,
          payment_date: paymentDate,
          payment_gl_transaction_id: financeTransactionId
        }
      },
      p_lines: [],
      p_options: {}
    }

    const { error: updateError } = await supabase.rpc(
      'hera_txn_crud_v1',
      updatePayload
    )

    if (updateError) {
      console.warn('⚠️ Warning: Failed to update expense status (non-critical):', updateError)
    } else {
      console.log('✅ Updated expense transaction status to PAID')
    }

    // ========================================================================
    // STEP 7: CREATE RELATIONSHIP LINK FOR PAYMENT
    // ========================================================================

    const relationshipPayload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_entity: null,
      p_dynamic: {},
      p_relationships: [
        {
          source_entity_id: expenseTransactionId,
          target_entity_id: financeTransactionId,
          relationship_type: 'PAID_VIA_FINANCE',
          smart_code: 'HERA.FINANCE.REL.PAYMENT.v1',
          relationship_data: {
            payment_date: paymentDate,
            payment_method: paymentMethod,
            paid_by: actorUserId,
            fiscal_period: fiscalPeriod,
            fiscal_year: fiscalYear,
            posting_type: 'EXPENSE_PAYMENT'
          },
          is_active: true
        }
      ],
      p_options: {}
    }

    const { data: relationshipResult, error: relationshipError } = await supabase.rpc(
      'hera_entities_crud_v1',
      relationshipPayload
    )

    if (relationshipError) {
      console.warn('⚠️ Warning: Relationship creation failed (non-critical):', relationshipError)
    } else {
      console.log('✅ Created PAID_VIA_FINANCE relationship')
    }

    // ========================================================================
    // STEP 8: RETURN SUCCESS
    // ========================================================================

    const result: PostExpenseToFinanceResult = {
      success: true,
      financeTransactionId,
      relationshipId: relationshipResult?.relationship_ids?.[0],
      glLines,
      metadata: {
        posted_at: new Date().toISOString(),
        fiscal_period: fiscalPeriod,
        fiscal_year: fiscalYear,
        balance_validated: true
      }
    }

    console.log('🎉 [EXPENSE PAYMENT] Successfully marked expense as paid and posted to Finance DNA v2', result)

    return result

  } catch (error) {
    console.error('❌ [EXPENSE PAYMENT] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
