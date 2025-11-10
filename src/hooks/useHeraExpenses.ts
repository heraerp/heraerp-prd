/**
 * HERA Expenses Hook V3 - Finance DNA v2 Integration
 *
 * ✅ Enterprise-grade expense management using universal_transactions
 * ✅ Proper double-entry GL accounting with DR/CR
 * ✅ Integrates with Chart of Accounts
 * ✅ Automatic P&L and Cash Flow integration
 * ✅ Finance DNA v2 integration with payment status workflow
 * ✅ Accounts Payable tracking for pending expenses
 *
 * Payment Status Workflow:
 * 1. CREATE EXPENSE (pending): DR Expense (6xxx), CR Accounts Payable (2100)
 * 2. MARK AS PAID: DR Accounts Payable (2100), CR Cash/Bank (1xxx)
 *
 * BREAKING CHANGE from V2:
 * - Expenses now automatically post to Finance DNA v2 GL
 * - Payment status workflow: pending → paid
 * - Accounts Payable tracking for unpaid expenses
 */

import { useMemo } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import {
  generatePendingExpenseGLLines,
  generateExpensePaymentGLLines,
  getExpenseGLAccount,
  getPaymentGLAccount,
  EXPENSE_CATEGORY_TO_GL
} from '@/lib/finance/gl-account-mapping'
import {
  postExpenseToFinance,
  markExpenseAsPaid as markExpenseAsPaidService
} from '@/services/expense-finance-integration'

export interface ExpenseTransaction {
  id: string
  transaction_code: string
  transaction_date: string
  transaction_type: 'EXPENSE'
  total_amount: number
  smart_code: string

  // Metadata fields
  vendor?: string
  expense_category?: string
  payment_method?: string
  status?: string
  description?: string
  receipt_url?: string
  reference_number?: string

  // Relationships
  source_entity_id?: string  // Vendor entity
  target_entity_id?: string  // Branch/Cost Center

  // GL Lines
  lines?: Array<{
    line_number: number
    line_type: string
    line_amount: number
    line_data: any
  }>

  created_at: string
  updated_at: string
}

export interface UseHeraExpensesOptions {
  organizationId?: string
  filters?: {
    limit?: number
    offset?: number
    status?: string
    search?: string
    category?: string
    date_from?: string
    date_to?: string
    include_lines?: boolean
  }
}

export function useHeraExpenses(options?: UseHeraExpensesOptions) {
  // 🔍 DEBUG: Log what we're fetching
  if (process.env.NODE_ENV === 'development') {
    console.log('[useHeraExpenses] 🔍 Fetching expenses (transaction-based):', {
      organizationId: options?.organizationId,
      transaction_type: 'EXPENSE',
      filters: options?.filters
    })
  }

  const {
    transactions: expenseTransactions,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalTransactionV1({
    organizationId: options?.organizationId,
    filters: {
      transaction_type: 'EXPENSE',
      include_lines: options?.filters?.include_lines !== false, // Default to true
      limit: options?.filters?.limit || 100,
      offset: options?.filters?.offset || 0,
      date_from: options?.filters?.date_from,
      date_to: options?.filters?.date_to
    }
  })

  // 🔍 DEBUG: Log what we got
  if (process.env.NODE_ENV === 'development') {
    console.log('[useHeraExpenses] 📦 Expenses loaded:', {
      count: expenseTransactions?.length || 0,
      isLoading,
      hasError: !!error,
      organizationId: options?.organizationId
    })
  }

  // Map transactions to expense format with flattened metadata
  const expenses = useMemo(() => {
    if (!expenseTransactions) return [] as ExpenseTransaction[]

    return expenseTransactions.map(txn => {
      const metadata = txn.metadata || {}

      return {
        id: txn.id,
        transaction_code: txn.transaction_code,
        transaction_date: txn.transaction_date,
        transaction_type: 'EXPENSE' as const,
        total_amount: txn.total_amount || 0,
        smart_code: txn.smart_code,

        // Flatten metadata
        vendor: metadata.vendor_name || metadata.vendor,
        expense_category: metadata.expense_category || metadata.category,
        payment_method: metadata.payment_method,
        status: metadata.payment_status || metadata.status || 'pending',
        description: metadata.description || metadata.notes,
        receipt_url: metadata.receipt_url,
        reference_number: metadata.invoice_number || metadata.reference_number,

        // Relationships
        source_entity_id: txn.source_entity_id,
        target_entity_id: txn.target_entity_id,

        // GL Lines
        lines: txn.lines,

        created_at: txn.created_at,
        updated_at: txn.updated_at
      } as ExpenseTransaction
    })
  }, [expenseTransactions])

  // Filter expenses by category, status, and search
  const filteredExpenses = useMemo(() => {
    if (!expenses) return expenses

    let filtered = expenses

    // Filter by category
    if (options?.filters?.category) {
      filtered = filtered.filter(e => e.expense_category === options.filters?.category)
    }

    // Filter by status
    if (options?.filters?.status) {
      filtered = filtered.filter(e => e.status === options.filters?.status)
    }

    // Filter by search term
    if (options?.filters?.search) {
      const searchLower = options.filters.search.toLowerCase()
      filtered = filtered.filter(e =>
        e.vendor?.toLowerCase().includes(searchLower) ||
        e.description?.toLowerCase().includes(searchLower) ||
        e.reference_number?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [expenses, options?.filters?.category, options?.filters?.status, options?.filters?.search])

  // Helper to create expense with Finance DNA v2 integration
  const createExpense = async (data: {
    name: string
    vendor: string
    amount: number
    expense_date: string
    category: string
    payment_method?: string
    status?: string
    description?: string
    receipt_url?: string
    reference_number?: string
    branch_id?: string
    actor_user_id?: string // Required for Finance DNA v2
  }) => {
    const category = data.category
    const paymentMethod = data.payment_method || 'Cash'
    const amount = data.amount
    const paymentStatus = data.status || 'pending'

    // Validate category
    const expenseAccount = getExpenseGLAccount(category)
    if (!expenseAccount) {
      throw new Error(`Invalid expense category: ${category}`)
    }

    // Generate GL lines based on payment status
    // PENDING: DR Expense, CR Accounts Payable
    // PAID: DR Expense, CR Cash/Bank (legacy, not recommended - use pending → paid workflow instead)
    const glLines = paymentStatus === 'pending'
      ? generatePendingExpenseGLLines(category, amount, data.branch_id)
      : generatePendingExpenseGLLines(category, amount, data.branch_id) // Always use pending workflow

    // Build transaction payload
    const transactionPayload = {
      transaction_type: 'EXPENSE',
      transaction_date: data.expense_date,
      total_amount: amount,
      transaction_status: paymentStatus === 'paid' ? 'paid' : 'pending',
      smart_code: `HERA.SALON.TXN.EXPENSE.${category.toUpperCase()}.v1`,

      // Store expense details in metadata (Finance DNA v2 compliant)
      metadata: {
        category: category, // Standardized field name
        expense_category: category, // Backward compatibility
        vendor_name: data.vendor,
        payment_method: paymentMethod,
        payment_status: paymentStatus, // pending | paid
        payment_date: paymentStatus === 'paid' ? data.expense_date : undefined,
        description: data.description,
        invoice_number: data.reference_number,
        receipt_url: data.receipt_url,
        notes: data.name,
        branch_id: data.branch_id,
        // Finance DNA v2 metadata
        finance_dna_version: 'v2.0',
        awaiting_finance_posting: true
      },

      // Relationships (if vendor/branch entities exist)
      source_entity_id: undefined, // TODO: Link to vendor entity if exists
      target_entity_id: data.branch_id,

      // GL Lines (will be posted to Finance DNA v2 separately)
      lines: glLines
    }

    console.log('💰 [useHeraExpenses] Creating expense transaction:', {
      amount,
      category,
      paymentStatus,
      paymentMethod
    })

    // Step 1: Create expense transaction
    const createResult = await baseCreate(transactionPayload as any)

    if (!createResult?.id) {
      throw new Error('Failed to create expense transaction')
    }

    console.log('✅ [useHeraExpenses] Expense transaction created:', createResult.id)

    // Step 2: Post to Finance DNA v2 (if pending)
    if (paymentStatus === 'pending' && data.actor_user_id && options?.organizationId) {
      try {
        console.log('📊 [useHeraExpenses] Posting expense to Finance DNA v2...')

        const financeResult = await postExpenseToFinance({
          expenseTransaction: {
            id: createResult.id,
            organization_id: options.organizationId,
            transaction_type: 'EXPENSE',
            transaction_date: data.expense_date,
            total_amount: amount,
            transaction_status: 'pending',
            metadata: transactionPayload.metadata
          },
          organizationId: options.organizationId,
          actorUserId: data.actor_user_id
        })

        if (financeResult.success) {
          console.log('✅ [useHeraExpenses] Successfully posted to Finance DNA v2:', {
            financeTransactionId: financeResult.financeTransactionId,
            relationshipId: financeResult.relationshipId
          })
        } else {
          console.error('⚠️ [useHeraExpenses] Finance posting failed (non-critical):', financeResult.error)
        }
      } catch (error) {
        console.error('⚠️ [useHeraExpenses] Finance posting error (non-critical):', error)
        // Non-blocking - expense still created successfully
      }
    }

    // Step 3: If paid immediately, mark as paid (creates payment GL journal)
    if (paymentStatus === 'paid' && data.actor_user_id && options?.organizationId) {
      try {
        console.log('💳 [useHeraExpenses] Marking expense as paid...')

        const paymentResult = await markExpenseAsPaidService({
          expenseTransactionId: createResult.id,
          paymentMethod,
          paymentDate: data.expense_date,
          organizationId: options.organizationId,
          actorUserId: data.actor_user_id
        })

        if (paymentResult.success) {
          console.log('✅ [useHeraExpenses] Successfully marked as paid in Finance DNA v2')
        } else {
          console.error('⚠️ [useHeraExpenses] Payment posting failed (non-critical):', paymentResult.error)
        }
      } catch (error) {
        console.error('⚠️ [useHeraExpenses] Payment posting error (non-critical):', error)
        // Non-blocking - expense still created successfully
      }
    }

    return createResult
  }

  // Helper to update expense
  const updateExpense = async (
    id: string,
    data: Partial<Parameters<typeof createExpense>[0]>
  ) => {
    const expense = expenses?.find(e => e.id === id)
    if (!expense) throw new Error('Expense not found')

    // Determine if amount/category/payment changed (requires new GL lines)
    const amountChanged = data.amount !== undefined && data.amount !== expense.total_amount
    const categoryChanged = data.category !== undefined && data.category !== expense.expense_category
    const paymentChanged = data.payment_method !== undefined && data.payment_method !== expense.payment_method

    const needsGLUpdate = amountChanged || categoryChanged || paymentChanged

    // Build metadata patch
    const metadataPatch: any = {}
    if (data.vendor) metadataPatch.vendor_name = data.vendor
    if (data.category) metadataPatch.expense_category = data.category
    if (data.payment_method) metadataPatch.payment_method = data.payment_method
    if (data.status) metadataPatch.payment_status = data.status
    if (data.description) metadataPatch.description = data.description
    if (data.receipt_url) metadataPatch.receipt_url = data.receipt_url
    if (data.reference_number) metadataPatch.invoice_number = data.reference_number
    if (data.name) metadataPatch.notes = data.name

    // Regenerate GL lines if needed
    let newLines = undefined
    if (needsGLUpdate) {
      const category = data.category || expense.expense_category || 'Other'
      const paymentMethod = data.payment_method || expense.payment_method || 'Cash'
      const amount = data.amount || expense.total_amount

      newLines = generateExpenseGLLines(category, paymentMethod, amount, data.branch_id)
    }

    const payload: any = {
      transaction_id: id,
      transaction_date: data.expense_date || expense.transaction_date,
      total_amount: data.amount || expense.total_amount,
      metadata_patch: metadataPatch,
      ...(newLines ? { lines: newLines } : {})
    }

    return baseUpdate(payload)
  }

  // Helper to delete expense
  const deleteExpense = async (id: string): Promise<{
    success: boolean
    archived: boolean
    message?: string
  }> => {
    const expense = expenses?.find(e => e.id === id)
    if (!expense) throw new Error('Expense not found')

    try {
      await baseDelete({
        transaction_id: id,
        hard_delete: true,
        cascade: true,
        reason: 'Permanently delete expense',
        smart_code: 'HERA.SALON.TXN.EXPENSE.DELETE.v1'
      })

      return {
        success: true,
        archived: false
      }
    } catch (error: any) {
      // If delete fails due to GL integrity, mark as cancelled instead
      const is409Conflict =
        error.message?.includes('409') ||
        error.message?.includes('Conflict') ||
        error.message?.includes('referenced') ||
        error.message?.includes('foreign key')

      if (is409Conflict) {
        await updateExpense(id, { status: 'cancelled' })

        return {
          success: true,
          archived: true,
          message: 'Expense is referenced in GL and cannot be deleted. It has been cancelled instead.'
        }
      }

      throw error
    }
  }

  // Helper to mark expense as paid (Finance DNA v2 workflow)
  const markAsPaid = async (params: {
    expense_id: string
    payment_method: string
    payment_date: string
    actor_user_id: string
  }): Promise<{
    success: boolean
    financeTransactionId?: string
    error?: string
  }> => {
    const { expense_id, payment_method, payment_date, actor_user_id } = params

    if (!options?.organizationId) {
      return {
        success: false,
        error: 'Organization ID is required'
      }
    }

    const expense = expenses?.find(e => e.id === expense_id)
    if (!expense) {
      return {
        success: false,
        error: 'Expense not found'
      }
    }

    // Validate payment method
    const paymentAccount = getPaymentGLAccount(payment_method)
    if (!paymentAccount) {
      return {
        success: false,
        error: `Invalid payment method: ${payment_method}`
      }
    }

    try {
      console.log('💳 [useHeraExpenses] Marking expense as paid:', {
        expense_id,
        payment_method,
        payment_date
      })

      // Call Finance DNA v2 service
      const result = await markExpenseAsPaidService({
        expenseTransactionId: expense_id,
        paymentMethod: payment_method,
        paymentDate: payment_date,
        organizationId: options.organizationId,
        actorUserId: actor_user_id
      })

      if (result.success) {
        console.log('✅ [useHeraExpenses] Successfully marked as paid in Finance DNA v2')

        // Refresh expenses to show updated status
        await refetch()

        return {
          success: true,
          financeTransactionId: result.financeTransactionId
        }
      } else {
        console.error('❌ [useHeraExpenses] Failed to mark as paid:', result.error)
        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      console.error('❌ [useHeraExpenses] Mark as paid error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Helper to calculate expense totals by category
  const calculateExpenseTotals = () => {
    if (!filteredExpenses) return { total: 0, byCategory: {} }

    const total = filteredExpenses.reduce((sum, e) => sum + (e.total_amount || 0), 0)
    const byCategory: Record<string, number> = {}

    filteredExpenses.forEach(e => {
      const category = e.expense_category || 'Uncategorized'
      byCategory[category] = (byCategory[category] || 0) + (e.total_amount || 0)
    })

    return { total, byCategory }
  }

  // Helper to get pending expenses (unpaid, awaiting payment)
  const getPendingExpenses = () => {
    return filteredExpenses?.filter(e => e.status === 'pending') || []
  }

  // Helper to get paid expenses
  const getPaidExpenses = () => {
    return filteredExpenses?.filter(e => e.status === 'paid') || []
  }

  // Helper to get total accounts payable (pending expenses)
  const getTotalAccountsPayable = () => {
    return getPendingExpenses().reduce((sum, e) => sum + (e.total_amount || 0), 0)
  }

  return {
    expenses: filteredExpenses,
    isLoading,
    error,
    refetch,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid, // NEW: Mark expense as paid (Finance DNA v2)
    calculateExpenseTotals,
    getPendingExpenses, // NEW: Get unpaid expenses
    getPaidExpenses, // NEW: Get paid expenses
    getTotalAccountsPayable, // NEW: Get total AP balance
    isCreating,
    isUpdating,
    isDeleting
  }
}

// Alias for backward compatibility
export { useHeraExpenses as useExpenses }
