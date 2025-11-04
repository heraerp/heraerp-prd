/**
 * HERA Expenses Hook V2
 *
 * ✅ Enterprise-grade expense management using universal_transactions
 * ✅ Proper double-entry GL accounting with DR/CR
 * ✅ Integrates with Chart of Accounts
 * ✅ Automatic P&L and Cash Flow integration
 *
 * BREAKING CHANGE from V1:
 * - Expenses now stored as transactions (not entities)
 * - Automatic GL entries for every expense
 * - Payment method affects GL accounts
 */

import { useMemo } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import {
  generateExpenseGLLines,
  getExpenseGLAccount,
  getPaymentGLAccount,
  EXPENSE_CATEGORY_TO_GL
} from '@/lib/finance/gl-account-mapping'

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

  // Helper to create expense with GL accounting
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
  }) => {
    const category = data.category
    const paymentMethod = data.payment_method || 'Cash'
    const amount = data.amount

    // Validate category and payment method
    const expenseAccount = getExpenseGLAccount(category)
    const paymentAccount = getPaymentGLAccount(paymentMethod)

    if (!expenseAccount) {
      throw new Error(`Invalid expense category: ${category}`)
    }
    if (!paymentAccount) {
      throw new Error(`Invalid payment method: ${paymentMethod}`)
    }

    // Generate GL lines (DR Expense, CR Payment Account)
    const glLines = generateExpenseGLLines(
      category,
      paymentMethod,
      amount,
      data.branch_id
    )

    // Build transaction payload
    const transactionPayload = {
      transaction_type: 'EXPENSE',
      transaction_date: data.expense_date,
      total_amount: amount,
      smart_code: `HERA.SALON.TXN.EXPENSE.${category.toUpperCase()}.v1`,

      // Store expense details in metadata
      metadata: {
        expense_category: category,
        vendor_name: data.vendor,
        payment_method: paymentMethod,
        payment_status: data.status || 'pending',
        payment_date: data.status === 'paid' ? data.expense_date : undefined,
        description: data.description,
        invoice_number: data.reference_number,
        receipt_url: data.receipt_url,
        notes: data.name
      },

      // Relationships (if vendor/branch entities exist)
      source_entity_id: undefined, // TODO: Link to vendor entity if exists
      target_entity_id: data.branch_id,

      // GL Lines
      lines: glLines
    }

    return baseCreate(transactionPayload as any)
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

  return {
    expenses: filteredExpenses,
    isLoading,
    error,
    refetch,
    createExpense,
    updateExpense,
    deleteExpense,
    calculateExpenseTotals,
    isCreating,
    isUpdating,
    isDeleting
  }
}

// Alias for backward compatibility
export { useHeraExpenses as useExpenses }
