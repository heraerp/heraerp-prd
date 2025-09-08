/**
 * HERA MCP Accounting Tools
 * Smart Code: HERA.MCP.ACCOUNTING.TOOLS.v1
 * 
 * Provides Claude with direct database access for intelligent accounting operations
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Tool definitions for Claude
export const accountingTools = {
  // Query GL accounts and balances
  queryGLAccounts: {
    description: "Query general ledger accounts with optional filters. Returns account details and current balances.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "Organization ID (required)" },
        accountCode: { type: "string", description: "Specific account code to query" },
        accountType: { type: "string", description: "Filter by account type (asset, liability, equity, revenue, expense)" },
        includeBalance: { type: "boolean", description: "Calculate and include current balance" }
      },
      required: ["organizationId"]
    }
  },

  // Create journal entries
  createJournalEntry: {
    description: "Create a journal entry with debits and credits. Automatically validates that debits equal credits.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "Organization ID (required)" },
        date: { type: "string", description: "Transaction date (YYYY-MM-DD)" },
        description: { type: "string", description: "Journal entry description" },
        lines: {
          type: "array",
          description: "Journal entry lines",
          items: {
            type: "object",
            properties: {
              accountCode: { type: "string", description: "GL account code" },
              debit: { type: "number", description: "Debit amount (0 if credit)" },
              credit: { type: "number", description: "Credit amount (0 if debit)" },
              memo: { type: "string", description: "Line memo" }
            }
          }
        },
        smartCode: { type: "string", description: "Smart code for the transaction" }
      },
      required: ["organizationId", "lines"]
    }
  },

  // Record salon transactions
  recordSalonTransaction: {
    description: "Record a salon-specific transaction (sale, expense, commission). Handles VAT calculation and categorization.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "Organization ID (required)" },
        type: { type: "string", enum: ["sale", "expense", "commission"], description: "Transaction type" },
        amount: { type: "number", description: "Transaction amount" },
        description: { type: "string", description: "Transaction description" },
        clientName: { type: "string", description: "Client name (for sales)" },
        vendorName: { type: "string", description: "Vendor name (for expenses)" },
        staffName: { type: "string", description: "Staff name (for commissions)" },
        serviceType: { type: "string", description: "Service type (for sales)" },
        expenseCategory: { type: "string", description: "Expense category" },
        commissionRate: { type: "number", description: "Commission percentage" },
        includeVAT: { type: "boolean", description: "Whether amount includes VAT", default: true }
      },
      required: ["organizationId", "type", "amount"]
    }
  },

  // Get transaction history
  getTransactionHistory: {
    description: "Retrieve transaction history with filters. Useful for summaries, reports, and finding specific transactions.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "Organization ID (required)" },
        startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
        transactionType: { type: "string", description: "Filter by transaction type" },
        minAmount: { type: "number", description: "Minimum transaction amount" },
        maxAmount: { type: "number", description: "Maximum transaction amount" },
        searchTerm: { type: "string", description: "Search in descriptions and metadata" },
        limit: { type: "number", description: "Maximum number of results", default: 50 }
      },
      required: ["organizationId"]
    }
  },

  // Calculate daily summary
  calculateDailySummary: {
    description: "Calculate daily summary including revenue, expenses, commissions, and net profit for a salon.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "Organization ID (required)" },
        date: { type: "string", description: "Date to summarize (YYYY-MM-DD), defaults to today" },
        includeDetails: { type: "boolean", description: "Include transaction details", default: false }
      },
      required: ["organizationId"]
    }
  },

  // Process commission payment
  processCommissionPayment: {
    description: "Process a commission payment for staff. Updates pending commission to paid status.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "Organization ID (required)" },
        transactionId: { type: "string", description: "Commission transaction ID to process" },
        staffName: { type: "string", description: "Staff name (if no transaction ID)" },
        paymentMethod: { type: "string", enum: ["cash", "bank_transfer", "check"], default: "cash" }
      },
      required: ["organizationId"]
    }
  },

  // Post transaction to GL
  postTransactionToGL: {
    description: "Post a draft transaction to the general ledger. Creates journal entries and updates GL balances.",
    inputSchema: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "Organization ID (required)" },
        transactionId: { type: "string", description: "Transaction ID to post" },
        postingDate: { type: "string", description: "GL posting date (YYYY-MM-DD)" }
      },
      required: ["organizationId", "transactionId"]
    }
  }
}

// Tool implementations
export async function executeAccountingTool(toolName, input) {
  try {
    switch (toolName) {
      case 'queryGLAccounts':
        return await queryGLAccountsImpl(input)
      
      case 'createJournalEntry':
        return await createJournalEntryImpl(input)
      
      case 'recordSalonTransaction':
        return await recordSalonTransactionImpl(input)
      
      case 'getTransactionHistory':
        return await getTransactionHistoryImpl(input)
      
      case 'calculateDailySummary':
        return await calculateDailySummaryImpl(input)
      
      case 'processCommissionPayment':
        return await processCommissionPaymentImpl(input)
      
      case 'postTransactionToGL':
        return await postTransactionToGLImpl(input)
      
      default:
        throw new Error(`Unknown accounting tool: ${toolName}`)
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error)
    return {
      success: false,
      error: error.message,
      toolName
    }
  }
}

// Implementation functions
async function queryGLAccountsImpl({ organizationId, accountCode, accountType, includeBalance }) {
  let query = supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'gl_account')
    .neq('status', 'deleted')
  
  if (accountCode) {
    query = query.eq('entity_code', accountCode)
  }
  
  if (accountType) {
    query = query.eq('metadata->account_type', accountType)
  }
  
  const { data: accounts, error } = await query
  
  if (error) throw error
  
  // Calculate balances if requested
  if (includeBalance && accounts) {
    for (const account of accounts) {
      account.currentBalance = await calculateAccountBalance(account.id, organizationId)
    }
  }
  
  return {
    success: true,
    accounts,
    count: accounts?.length || 0
  }
}

async function createJournalEntryImpl({ organizationId, date, description, lines, smartCode }) {
  // Validate debits equal credits
  const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error(`Journal entry not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`)
  }
  
  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'journal_entry',
      transaction_code: `JE-${Date.now()}`,
      transaction_date: date || new Date().toISOString(),
      total_amount: totalDebits,
      description: description || 'Manual Journal Entry',
      smart_code: smartCode || 'HERA.FIN.GL.JE.MANUAL.v1',
      metadata: {
        source: 'MCP Accounting Tools',
        created_by: 'Claude'
      }
    })
    .select()
    .single()
  
  if (txError) throw txError
  
  // Create transaction lines
  const lineItems = lines.map((line, index) => ({
    organization_id: organizationId,
    transaction_id: transaction.id,
    line_number: index + 1,
    line_type: 'journal_line',
    description: line.memo || '',
    quantity: 1,
    unit_amount: line.debit || line.credit,
    line_amount: line.debit || line.credit,
    metadata: {
      account_code: line.accountCode,
      debit: line.debit || 0,
      credit: line.credit || 0
    }
  }))
  
  const { error: lineError } = await supabase
    .from('universal_transaction_lines')
    .insert(lineItems)
  
  if (lineError) throw lineError
  
  return {
    success: true,
    transaction,
    message: `Journal entry ${transaction.transaction_code} created successfully`
  }
}

async function recordSalonTransactionImpl(input) {
  const { 
    organizationId, type, amount, description,
    clientName, vendorName, staffName, serviceType,
    expenseCategory, commissionRate, includeVAT = true
  } = input
  
  // Calculate VAT if applicable
  const vatRate = 0.05
  let baseAmount = amount
  let vatAmount = 0
  
  if (includeVAT && type !== 'commission') {
    baseAmount = amount / (1 + vatRate)
    vatAmount = amount - baseAmount
  }
  
  // Build metadata based on transaction type
  const metadata = {
    source: 'MCP Accounting Tools',
    created_by: 'Claude',
    includes_vat: includeVAT,
    vat_amount: vatAmount,
    base_amount: baseAmount
  }
  
  let smartCode = ''
  
  switch (type) {
    case 'sale':
      metadata.client_name = clientName
      metadata.service_type = serviceType
      smartCode = 'HERA.SALON.SALE.POSTED.v1'
      break
    
    case 'expense':
      metadata.vendor_name = vendorName
      metadata.expense_category = expenseCategory
      smartCode = 'HERA.SALON.EXPENSE.POSTED.v1'
      break
    
    case 'commission':
      metadata.staff_name = staffName
      metadata.commission_rate = commissionRate
      metadata.payment_type = 'commission'
      metadata.status = 'pending'
      smartCode = 'HERA.SALON.PAYROLL.COMMISSION.v1'
      break
  }
  
  // Create transaction
  const { data: transaction, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: type === 'commission' ? 'payment' : type,
      transaction_code: `${type.toUpperCase()}-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: amount,
      description: description || `${type} transaction`,
      smart_code: smartCode,
      metadata
    })
    .select()
    .single()
  
  if (error) throw error
  
  return {
    success: true,
    transaction,
    message: `${type} recorded successfully`,
    details: {
      amount,
      baseAmount,
      vatAmount: includeVAT ? vatAmount : 0
    }
  }
}

async function getTransactionHistoryImpl(input) {
  const {
    organizationId, startDate, endDate, transactionType,
    minAmount, maxAmount, searchTerm, limit = 50
  } = input
  
  let query = supabase
    .from('universal_transactions')
    .select('*, universal_transaction_lines(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (startDate) {
    query = query.gte('transaction_date', startDate)
  }
  
  if (endDate) {
    query = query.lte('transaction_date', endDate)
  }
  
  if (transactionType) {
    query = query.eq('transaction_type', transactionType)
  }
  
  if (minAmount !== undefined) {
    query = query.gte('total_amount', minAmount)
  }
  
  if (maxAmount !== undefined) {
    query = query.lte('total_amount', maxAmount)
  }
  
  if (searchTerm) {
    query = query.or(`description.ilike.%${searchTerm}%,metadata.ilike.%${searchTerm}%`)
  }
  
  const { data: transactions, error } = await query
  
  if (error) throw error
  
  return {
    success: true,
    transactions,
    count: transactions?.length || 0
  }
}

async function calculateDailySummaryImpl({ organizationId, date, includeDetails }) {
  const targetDate = date || new Date().toISOString().split('T')[0]
  const startOfDay = `${targetDate}T00:00:00`
  const endOfDay = `${targetDate}T23:59:59`
  
  // Get all transactions for the day
  const { data: transactions, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .in('transaction_type', ['sale', 'expense', 'payment'])
  
  if (error) throw error
  
  // Calculate totals
  let totalRevenue = 0
  let totalExpenses = 0
  let totalCommissions = 0
  const clientSet = new Set()
  const serviceCount = {}
  
  transactions?.forEach(tx => {
    if (tx.transaction_type === 'sale') {
      totalRevenue += tx.total_amount
      if (tx.metadata?.client_name) {
        clientSet.add(tx.metadata.client_name)
      }
      const service = tx.metadata?.service_type || 'General'
      serviceCount[service] = (serviceCount[service] || 0) + 1
    } else if (tx.transaction_type === 'expense') {
      totalExpenses += tx.total_amount
    } else if (tx.transaction_type === 'payment' && tx.metadata?.payment_type === 'commission') {
      totalCommissions += tx.total_amount
    }
  })
  
  const netProfit = totalRevenue - totalExpenses - totalCommissions
  
  const summary = {
    success: true,
    date: targetDate,
    totalRevenue,
    totalExpenses,
    totalCommissions,
    netProfit,
    clientCount: clientSet.size,
    topServices: Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([service, count]) => ({ service, count }))
  }
  
  if (includeDetails) {
    summary.transactions = transactions
  }
  
  return summary
}

async function processCommissionPaymentImpl({ organizationId, transactionId, staffName, paymentMethod = 'cash' }) {
  let commission
  
  if (transactionId) {
    // Find by ID
    const { data, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('organization_id', organizationId)
      .single()
    
    if (error) throw error
    commission = data
  } else if (staffName) {
    // Find recent pending commission for staff
    const { data, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'payment')
      .eq('metadata->payment_type', 'commission')
      .eq('metadata->status', 'pending')
      .ilike('metadata->staff_name', staffName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) throw error
    commission = data
  } else {
    throw new Error('Either transactionId or staffName is required')
  }
  
  if (!commission) {
    throw new Error('No pending commission found')
  }
  
  // Update to paid status
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        ...commission.metadata,
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod
      }
    })
    .eq('id', commission.id)
  
  if (updateError) throw updateError
  
  return {
    success: true,
    message: `Commission paid to ${commission.metadata.staff_name}`,
    details: {
      amount: commission.total_amount,
      staffName: commission.metadata.staff_name,
      paymentMethod,
      transactionCode: commission.transaction_code
    }
  }
}

async function postTransactionToGLImpl({ organizationId, transactionId, postingDate }) {
  // Get transaction
  const { data: transaction, error } = await supabase
    .from('universal_transactions')
    .select('*, universal_transaction_lines(*)')
    .eq('id', transactionId)
    .eq('organization_id', organizationId)
    .single()
  
  if (error) throw error
  
  if (!transaction) {
    throw new Error('Transaction not found')
  }
  
  // Check if already posted
  if (transaction.metadata?.gl_posted) {
    return {
      success: true,
      message: 'Transaction already posted to GL',
      alreadyPosted: true
    }
  }
  
  // Generate GL entries based on transaction type
  const glEntries = await generateGLEntries(transaction)
  
  // Create journal entry
  const journalResult = await createJournalEntryImpl({
    organizationId,
    date: postingDate || transaction.transaction_date,
    description: `GL Posting: ${transaction.description || transaction.transaction_type}`,
    lines: glEntries,
    smartCode: 'HERA.FIN.GL.POST.AUTO.v1'
  })
  
  // Update transaction as posted
  await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        ...transaction.metadata,
        gl_posted: true,
        gl_posted_at: new Date().toISOString(),
        gl_journal_id: journalResult.transaction.id
      }
    })
    .eq('id', transactionId)
  
  return {
    success: true,
    message: `Transaction posted to GL successfully`,
    journalEntry: journalResult.transaction
  }
}

// Helper functions
async function calculateAccountBalance(accountId, organizationId) {
  // This is simplified - in production, you'd calculate from all posted journal entries
  const { data: lines, error } = await supabase
    .from('universal_transaction_lines')
    .select('metadata')
    .eq('organization_id', organizationId)
    .or(`metadata->account_id.eq.${accountId},metadata->account_code.eq.${accountId}`)
  
  if (error) return 0
  
  let balance = 0
  lines?.forEach(line => {
    balance += (line.metadata?.debit || 0) - (line.metadata?.credit || 0)
  })
  
  return balance
}

async function generateGLEntries(transaction) {
  // Generate GL entries based on transaction type
  // This is simplified - in production, use smart code mappings
  const entries = []
  
  switch (transaction.transaction_type) {
    case 'sale':
      entries.push({
        accountCode: '1100', // Cash/Bank
        debit: transaction.total_amount,
        credit: 0,
        memo: 'Sales receipt'
      })
      entries.push({
        accountCode: '4000', // Sales Revenue
        debit: 0,
        credit: transaction.total_amount,
        memo: 'Sales revenue'
      })
      break
    
    case 'expense':
      entries.push({
        accountCode: '6000', // Operating Expenses
        debit: transaction.total_amount,
        credit: 0,
        memo: 'Expense'
      })
      entries.push({
        accountCode: '1100', // Cash/Bank
        debit: 0,
        credit: transaction.total_amount,
        memo: 'Payment'
      })
      break
    
    case 'payment':
      if (transaction.metadata?.payment_type === 'commission') {
        entries.push({
          accountCode: '6300', // Commission Expense
          debit: transaction.total_amount,
          credit: 0,
          memo: 'Commission payment'
        })
        entries.push({
          accountCode: '1100', // Cash/Bank
          debit: 0,
          credit: transaction.total_amount,
          memo: 'Commission paid'
        })
      }
      break
  }
  
  return entries
}

export default { accountingTools, executeAccountingTool }