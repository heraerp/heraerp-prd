/**
 * HERA Finance DNA - Owner Expenses Management
 * 
 * Handles owner expense capture with attachments and automatic GL posting
 * using Finance DNA's Account Derivation Engine.
 */

import { universalApi } from '@/lib/universal-api-v2'

interface ExpenseLine {
  account_id: string
  amount: number
  tax_rate?: number
  description?: string
  attachment_url?: string
}

interface CreateExpenseRequest {
  organization_id: string
  branch_id: string
  when_ts: string
  currency: string
  vendor?: string
  memo: string
  payment_method: 'cash' | 'bank' | 'credit_card' | 'pay_later'
  payment_account_id?: string // Required for cash/bank/credit_card
  lines: ExpenseLine[]
}

interface ExpenseJournalPayload {
  header: {
    organization_id: string
    transaction_type: string
    smart_code: string
    when_ts: string
    branch_id: string
    transaction_currency_code: string
    status: string
    total_amount: number
    memo?: string
    vendor?: string
  }
  lines: Array<{
    line_number: number
    smart_code: string
    entity_id: string
    debit: number
    credit: number
    line_amount: number
    metadata: {
      source: string
      account_type: string
      tax_rate?: number
      attachment_url?: string
      description?: string
    }
  }>
}

/**
 * Creates an expense with automatic GL posting
 */
export async function createExpense(request: CreateExpenseRequest): Promise<{
  success: boolean
  transaction_id?: string
  error?: string
}> {
  try {
    universalApi.setOrganizationId(request.organization_id)

    // Validate request
    const validation = validateExpenseRequest(request)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Check fiscal period
    const fiscalCheck = await checkFiscalPeriodOpen(
      request.organization_id,
      request.when_ts.slice(0, 10)
    )
    
    if (!fiscalCheck.isOpen) {
      throw new Error(`Cannot post to closed fiscal period: ${fiscalCheck.reason}`)
    }

    // Build journal payload
    const journalPayload = await buildExpenseJournalPayload(request)

    // Post to universal tables
    const result = await postExpenseJournal(journalPayload)

    if (result.success && result.transaction_id) {
      // Store attachment URLs in core_dynamic_data
      await storeAttachments(request.organization_id, result.transaction_id, request.lines)
    }

    return result

  } catch (error) {
    console.error('Error creating expense:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validates expense request
 */
function validateExpenseRequest(request: CreateExpenseRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!request.organization_id) {
    errors.push('Organization ID is required')
  }

  if (!request.branch_id) {
    errors.push('Branch ID is required')
  }

  if (!request.when_ts) {
    errors.push('Date is required')
  }

  if (!request.currency) {
    errors.push('Currency is required')
  }

  if (!request.memo?.trim()) {
    errors.push('Memo is required')
  }

  if (!request.lines || request.lines.length === 0) {
    errors.push('At least one expense line is required')
  }

  if (['cash', 'bank', 'credit_card'].includes(request.payment_method) && !request.payment_account_id) {
    errors.push('Payment account is required for cash/bank/credit card payments')
  }

  // Validate lines
  request.lines?.forEach((line, index) => {
    if (!line.account_id) {
      errors.push(`Line ${index + 1}: Account is required`)
    }
    if (!line.amount || line.amount <= 0) {
      errors.push(`Line ${index + 1}: Amount must be greater than zero`)
    }
    if (line.tax_rate && (line.tax_rate < 0 || line.tax_rate > 100)) {
      errors.push(`Line ${index + 1}: Tax rate must be between 0 and 100`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Builds expense journal payload
 */
async function buildExpenseJournalPayload(request: CreateExpenseRequest): Promise<ExpenseJournalPayload> {
  const lines = []
  let totalAmount = 0
  let lineNumber = 1

  // Add expense lines (debit)
  for (const expenseLine of request.lines) {
    const grossAmount = expenseLine.amount
    const taxRate = expenseLine.tax_rate || 0
    const taxAmount = grossAmount * (taxRate / 100)
    const netAmount = grossAmount - taxAmount

    // Expense line (debit)
    lines.push({
      line_number: lineNumber++,
      smart_code: 'HERA.FINANCE.JOURNAL.LINE.GL.v1',
      entity_id: expenseLine.account_id,
      debit: netAmount,
      credit: 0,
      line_amount: netAmount,
      metadata: {
        source: 'expense',
        account_type: 'expense',
        description: expenseLine.description || '',
        attachment_url: expenseLine.attachment_url || ''
      }
    })

    totalAmount += netAmount

    // VAT recoverable line (debit) if applicable
    if (taxAmount > 0) {
      const vatAccount = await getVATRecoverableAccount(request.organization_id)
      if (vatAccount) {
        lines.push({
          line_number: lineNumber++,
          smart_code: 'HERA.FINANCE.JOURNAL.LINE.GL.v1',
          entity_id: vatAccount,
          debit: taxAmount,
          credit: 0,
          line_amount: taxAmount,
          metadata: {
            source: 'expense',
            account_type: 'vat_recoverable',
            tax_rate: taxRate,
            description: `VAT recoverable @ ${taxRate}%`
          }
        })

        totalAmount += taxAmount
      }
    }
  }

  // Payment line (credit)
  if (request.payment_method === 'pay_later') {
    // Create accounts payable liability
    const apAccount = await getAccountsPayableAccount(request.organization_id)
    if (apAccount) {
      lines.push({
        line_number: lineNumber++,
        smart_code: 'HERA.FINANCE.JOURNAL.LINE.GL.v1',
        entity_id: apAccount,
        debit: 0,
        credit: totalAmount,
        line_amount: totalAmount,
        metadata: {
          source: 'expense',
          account_type: 'liability',
          description: `AP - ${request.vendor || 'Vendor'}`
        }
      })
    }
  } else {
    // Direct payment from cash/bank/credit card
    lines.push({
      line_number: lineNumber++,
      smart_code: 'HERA.FINANCE.JOURNAL.LINE.GL.v1',
      entity_id: request.payment_account_id!,
      debit: 0,
      credit: totalAmount,
      line_amount: totalAmount,
      metadata: {
        source: 'expense',
        account_type: 'asset',
        description: `Payment via ${request.payment_method}`
      }
    })
  }

  return {
    header: {
      organization_id: request.organization_id,
      transaction_type: 'expense',
      smart_code: 'HERA.FINANCE.EXPENSE.CAPTURE.v1',
      when_ts: request.when_ts,
      branch_id: request.branch_id,
      transaction_currency_code: request.currency,
      status: 'posted',
      total_amount: totalAmount,
      memo: request.memo,
      vendor: request.vendor
    },
    lines
  }
}

/**
 * Posts expense journal to universal tables
 */
async function postExpenseJournal(payload: ExpenseJournalPayload): Promise<{
  success: boolean
  transaction_id?: string
  error?: string
}> {
  try {
    // Create transaction header
    const headerResponse = await universalApi.create({
      table: 'universal_transactions',
      data: payload.header
    })

    if (!headerResponse?.data?.id) {
      throw new Error('Failed to create transaction header')
    }

    const transactionId = headerResponse.data.id

    // Create transaction lines
    for (const line of payload.lines) {
      await universalApi.create({
        table: 'universal_transaction_lines',
        data: {
          ...line,
          transaction_id: transactionId,
          organization_id: payload.header.organization_id
        }
      })
    }

    return {
      success: true,
      transaction_id: transactionId
    }

  } catch (error) {
    console.error('Error posting expense journal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Stores attachment URLs in core_dynamic_data
 */
async function storeAttachments(
  organization_id: string,
  transaction_id: string,
  lines: ExpenseLine[]
): Promise<void> {
  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.attachment_url) {
        await universalApi.create({
          table: 'core_dynamic_data',
          data: {
            organization_id,
            entity_id: transaction_id,
            field_name: `attachment_line_${i + 1}`,
            field_value_file_url: line.attachment_url,
            smart_code: 'HERA.FINANCE.EXPENSE.ATTACHMENT.v1'
          }
        })
      }
    }
  } catch (error) {
    console.error('Error storing attachments:', error)
    // Don't throw - attachments are supplementary
  }
}

/**
 * Helper functions to get account IDs from policy
 */
async function getVATRecoverableAccount(organization_id: string): Promise<string | null> {
  try {
    const policyResponse = await universalApi.read({
      table: 'core_dynamic_data',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'smart_code', operator: 'eq', value: 'HERA.FINANCE.POLICY.EXPENSE_POSTING.v1' },
        { field: 'field_name', operator: 'eq', value: 'vat_recoverable_account' }
      ]
    })

    return policyResponse?.data?.[0]?.field_value_text || null
  } catch {
    return null
  }
}

async function getAccountsPayableAccount(organization_id: string): Promise<string | null> {
  try {
    const policyResponse = await universalApi.read({
      table: 'core_dynamic_data',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'smart_code', operator: 'eq', value: 'HERA.FINANCE.POLICY.EXPENSE_POSTING.v1' },
        { field: 'field_name', operator: 'eq', value: 'accounts_payable_account' }
      ]
    })

    return policyResponse?.data?.[0]?.field_value_text || null
  } catch {
    return null
  }
}

/**
 * Check if fiscal period is open for posting
 */
async function checkFiscalPeriodOpen(
  organization_id: string,
  date: string
): Promise<{ isOpen: boolean; reason?: string }> {
  try {
    const periodsResponse = await universalApi.read({
      table: 'core_entities',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'entity_type', operator: 'eq', value: 'fiscal_period' }
      ]
    })

    const periods = periodsResponse?.data || []
    
    for (const period of periods) {
      const dynamicResponse = await universalApi.read({
        table: 'core_dynamic_data',
        filters: [
          { field: 'organization_id', operator: 'eq', value: organization_id },
          { field: 'entity_id', operator: 'eq', value: period.id },
          { field: 'field_name', operator: 'in', value: ['start_date', 'end_date', 'status'] }
        ]
      })

      const dynamicFields = dynamicResponse?.data || []
      const fields: any = {}
      
      dynamicFields.forEach(field => {
        fields[field.field_name] = field.field_value_text || field.field_value_date
      })

      if (date >= fields.start_date && date <= fields.end_date) {
        if (fields.status === 'closed') {
          return {
            isOpen: false,
            reason: `Fiscal period ${fields.start_date} to ${fields.end_date} is closed`
          }
        }
        return { isOpen: true }
      }
    }

    return { isOpen: true } // Default to open if no periods configured

  } catch (error) {
    console.error('Error checking fiscal period:', error)
    return { isOpen: true } // Default to open on error
  }
}

/**
 * Get expense history for display
 */
export async function getExpenseHistory({
  organization_id,
  branch_id,
  limit = 50,
  offset = 0
}: {
  organization_id: string
  branch_id?: string
  limit?: number
  offset?: number
}): Promise<{
  expenses: Array<{
    id: string
    date: string
    vendor?: string
    memo: string
    total_amount: number
    currency: string
    status: string
    line_count: number
  }>
  total: number
}> {
  try {
    universalApi.setOrganizationId(organization_id)

    const filters = [
      { field: 'organization_id', operator: 'eq', value: organization_id },
      { field: 'smart_code', operator: 'eq', value: 'HERA.FINANCE.EXPENSE.CAPTURE.v1' }
    ]

    if (branch_id) {
      filters.push({ field: 'branch_id', operator: 'eq', value: branch_id })
    }

    const response = await universalApi.read({
      table: 'universal_transactions',
      filters,
      limit,
      offset,
      orderBy: [{ field: 'when_ts', direction: 'desc' }]
    })

    const expenses = response?.data || []

    // Get line counts for each expense
    const expensesWithCounts = await Promise.all(
      expenses.map(async (expense) => {
        const linesResponse = await universalApi.read({
          table: 'universal_transaction_lines',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organization_id },
            { field: 'transaction_id', operator: 'eq', value: expense.id }
          ]
        })

        return {
          id: expense.id,
          date: expense.when_ts.slice(0, 10),
          vendor: expense.vendor,
          memo: expense.memo || '',
          total_amount: expense.total_amount || 0,
          currency: expense.transaction_currency_code || 'AED',
          status: expense.status || 'draft',
          line_count: linesResponse?.data?.length || 0
        }
      })
    )

    return {
      expenses: expensesWithCounts,
      total: expenses.length
    }

  } catch (error) {
    console.error('Error getting expense history:', error)
    return {
      expenses: [],
      total: 0
    }
  }
}