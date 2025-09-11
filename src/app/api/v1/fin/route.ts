/**
 * HERA FIN API Route Handler
 * Complete financial management API endpoints
 * Replaces SAP FI/CO with 98% cost savings
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// =============================================
// VALIDATION SCHEMAS
// =============================================

const GLAccountSchema = z.object({
  accountCode: z.string().regex(/^\d+$/, 'Account code must be numeric'),
  accountName: z.string().min(1).max(100),
  accountType: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  parentAccountCode: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().default('USD'),
  consolidationMethod: z.enum(['full', 'equity', 'proportional']).optional()
})

const JournalEntrySchema = z.object({
  description: z.string().min(1),
  date: z.string().datetime().optional(),
  reference: z.string().optional(),
  lines: z.array(z.object({
    accountCode: z.string(),
    debit: z.number().default(0),
    credit: z.number().default(0),
    costCenter: z.string().optional(),
    profitCenter: z.string().optional(),
    project: z.string().optional(),
    description: z.string().optional()
  })).min(2)
})

const ConsolidationSchema = z.object({
  consolidationDate: z.string().datetime(),
  companies: z.array(z.object({
    companyId: z.string().uuid(),
    ownershipPercent: z.number().min(0).max(100),
    consolidationMethod: z.enum(['full', 'equity', 'proportional'])
  })),
  eliminateIntercompany: z.boolean().default(true),
  includeCurrencyTranslation: z.boolean().default(true),
  reportingCurrency: z.string().default('USD')
})

const FinancialReportSchema = z.object({
  reportType: z.enum(['balance_sheet', 'income_statement', 'cash_flow', 'trial_balance']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  asOfDate: z.string().datetime().optional(),
  format: z.enum(['summary', 'detailed', 'comparative']).default('summary'),
  includeSubsidiaries: z.boolean().default(false)
})

// =============================================
// MAIN HANDLER
// =============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Get auth context
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = searchParams.get('organizationId') || session.user.user_metadata?.organization_id

    switch (action) {
      case 'list_accounts':
        return await listGLAccounts(supabase, organizationId, searchParams)

      case 'account_balance':
        return await getAccountBalance(supabase, organizationId, searchParams)

      case 'trial_balance':
        return await generateTrialBalance(supabase, organizationId, searchParams)

      case 'financial_ratios':
        return await calculateFinancialRatios(supabase, organizationId, searchParams)

      case 'cash_position':
        return await getCashPosition(supabase, organizationId, searchParams)

      case 'period_status':
        return await getPeriodStatus(supabase, organizationId, searchParams)

      case 'consolidation_structure':
        return await getConsolidationStructure(supabase, organizationId, searchParams)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('FIN API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await request.json()
    const { action, data, organizationId: orgId } = body

    // Get auth context
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = orgId || session.user.user_metadata?.organization_id

    switch (action) {
      case 'create_gl_account':
        return await createGLAccount(supabase, organizationId, data)

      case 'create_journal_entry':
        return await createJournalEntry(supabase, organizationId, session.user.id, data)

      case 'post_journal_entry':
        return await postJournalEntry(supabase, organizationId, data)

      case 'reverse_journal_entry':
        return await reverseJournalEntry(supabase, organizationId, session.user.id, data)

      case 'close_period':
        return await closePeriod(supabase, organizationId, session.user.id, data)

      case 'consolidate_companies':
        return await consolidateCompanies(supabase, organizationId, data)

      case 'generate_report':
        return await generateFinancialReport(supabase, organizationId, data)

      case 'import_journal_entries':
        return await importJournalEntries(supabase, organizationId, data)

      case 'create_budget':
        return await createBudget(supabase, organizationId, data)

      case 'allocate_costs':
        return await allocateCosts(supabase, organizationId, data)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('FIN API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================
// GL ACCOUNT FUNCTIONS
// =============================================

async function listGLAccounts(supabase: any, organizationId: string, params: URLSearchParams) {
  const accountType = params.get('accountType')
  const includeBalances = params.get('includeBalances') === 'true'
  const onlyActive = params.get('onlyActive') !== 'false'

  let query = supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'gl_account')

  if (accountType) {
    query = query.eq('metadata->account_type', accountType)
  }

  if (onlyActive) {
    query = query.eq('metadata->status', 'active')
  }

  const { data: accounts, error } = await query.order('entity_code')

  if (error) throw error

  // Get balances if requested
  if (includeBalances && accounts.length > 0) {
    const accountIds = accounts.map((a: any) => a.id)
    
    const { data: balances } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_number')
      .in('entity_id', accountIds)
      .like('field_name', 'period_balance_%')

    // Merge balances with accounts
    accounts.forEach((account: any) => {
      const balance = balances?.find((b: any) => b.entity_id === account.id)
      account.current_balance = balance?.field_value_number || 0
    })
  }

  // Build account hierarchy
  const accountTree = buildAccountHierarchy(accounts)

  return NextResponse.json({
    success: true,
    data: {
      accounts: accounts,
      hierarchy: accountTree,
      summary: {
        total: accounts.length,
        by_type: accounts.reduce((acc: any, a: any) => {
          const type = a.metadata.account_type
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {})
      }
    }
  })
}

async function createGLAccount(supabase: any, organizationId: string, data: any) {
  const validated = GLAccountSchema.parse(data)

  // Check if account code already exists
  const { data: existing } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'gl_account')
    .eq('entity_code', validated.accountCode)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Account code already exists' },
      { status: 400 }
    )
  }

  // Create GL account
  const { data: account, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: 'gl_account',
      entity_code: validated.accountCode,
      entity_name: validated.accountName,
      smart_code: 'HERA.FIN.GL.ACCOUNT.CREATE.v1',
      metadata: {
        account_type: validated.accountType,
        description: validated.description,
        currency: validated.currency,
        consolidation_method: validated.consolidationMethod,
        status: 'active',
        created_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create parent-child relationship if specified
  if (validated.parentAccountCode) {
    const { data: parent } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .eq('entity_code', validated.parentAccountCode)
      .single()

    if (parent) {
      await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: parent.id,
          to_entity_id: account.id,
          relationship_type: 'parent_of',
          smart_code: 'HERA.FIN.GL.ACCOUNT.HIERARCHY.v1',
          metadata: {
            hierarchy_type: 'gl_account'
          }
        })
    }
  }

  return NextResponse.json({
    success: true,
    data: account
  })
}

async function getAccountBalance(supabase: any, organizationId: string, params: URLSearchParams) {
  const accountCode = params.get('accountCode')
  const asOfDate = params.get('asOfDate') || new Date().toISOString()

  if (!accountCode) {
    return NextResponse.json(
      { error: 'Account code is required' },
      { status: 400 }
    )
  }

  // Get account
  const { data: account } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'gl_account')
    .eq('entity_code', accountCode)
    .single()

  if (!account) {
    return NextResponse.json(
      { error: 'Account not found' },
      { status: 404 }
    )
  }

  // Get current period balance
  const { data: balance } = await supabase
    .from('core_dynamic_data')
    .select('field_value_number, metadata')
    .eq('entity_id', account.id)
    .like('field_name', 'period_balance_%')
    .order('metadata->last_update', { ascending: false })
    .limit(1)
    .single()

  // Get transaction history
  const { data: transactions } = await supabase
    .from('universal_transaction_lines')
    .select(`
      *,
      transaction:universal_transactions(
        transaction_code,
        transaction_date,
        metadata
      )
    `)
    .eq('line_entity_id', account.id)
    .lte('transaction.transaction_date', asOfDate)
    .order('transaction.transaction_date', { ascending: false })
    .limit(10)

  return NextResponse.json({
    success: true,
    data: {
      account: {
        code: account.entity_code,
        name: account.entity_name,
        type: account.metadata.account_type,
        normal_balance: account.metadata.normal_balance
      },
      balance: {
        current: balance?.field_value_number || 0,
        as_of: asOfDate,
        last_updated: balance?.metadata?.last_update
      },
      recent_transactions: transactions || []
    }
  })
}

// =============================================
// JOURNAL ENTRY FUNCTIONS
// =============================================

async function createJournalEntry(supabase: any, organizationId: string, userId: string, data: any) {
  const validated = JournalEntrySchema.parse(data)

  // Validate lines balance
  const totalDebits = validated.lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredits = validated.lines.reduce((sum, line) => sum + line.credit, 0)

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return NextResponse.json(
      { error: `Journal entry must balance. Debits: ${totalDebits}, Credits: ${totalCredits}` },
      { status: 400 }
    )
  }

  // Generate journal number
  const journalNumber = `JE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`

  // Start transaction
  const { data: journal, error: journalError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'journal_entry',
      transaction_code: journalNumber,
      smart_code: 'HERA.FIN.GL.JOURNAL.MANUAL.v1',
      transaction_date: validated.date || new Date().toISOString(),
      total_amount: totalDebits,
      metadata: {
        description: validated.description,
        reference: validated.reference,
        created_by: userId,
        source: 'api',
        posting_status: 'pending'
      }
    })
    .select()
    .single()

  if (journalError) throw journalError

  // Create journal lines
  const linePromises = validated.lines.map(async (line, index) => {
    // Get GL account
    const { data: account } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .eq('entity_code', line.accountCode)
      .single()

    if (!account) {
      throw new Error(`GL account ${line.accountCode} not found`)
    }

    return supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: journal.id,
        line_number: index + 1,
        line_entity_id: account.id,
        line_amount: line.debit || line.credit,
        metadata: {
          entry_type: line.debit > 0 ? 'debit' : 'credit',
          gl_account_code: line.accountCode,
          gl_account_name: account.entity_name,
          cost_center: line.costCenter,
          profit_center: line.profitCenter,
          project: line.project,
          description: line.description
        }
      })
  })

  await Promise.all(linePromises)

  return NextResponse.json({
    success: true,
    data: {
      journal_id: journal.id,
      journal_number: journalNumber,
      status: 'pending',
      total_amount: totalDebits
    }
  })
}

async function postJournalEntry(supabase: any, organizationId: string, data: any) {
  const { journalId } = data

  // Get journal with lines
  const { data: journal, error: journalError } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      lines:universal_transaction_lines(*)
    `)
    .eq('id', journalId)
    .eq('organization_id', organizationId)
    .single()

  if (journalError || !journal) {
    return NextResponse.json(
      { error: 'Journal entry not found' },
      { status: 404 }
    )
  }

  if (journal.metadata.posting_status === 'posted') {
    return NextResponse.json(
      { error: 'Journal entry already posted' },
      { status: 400 }
    )
  }

  // Validate balance
  const totalDebits = journal.lines
    .filter((l: any) => l.metadata.entry_type === 'debit')
    .reduce((sum: number, l: any) => sum + l.line_amount, 0)
  
  const totalCredits = journal.lines
    .filter((l: any) => l.metadata.entry_type === 'credit')
    .reduce((sum: number, l: any) => sum + l.line_amount, 0)

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return NextResponse.json(
      { error: 'Journal entry does not balance' },
      { status: 400 }
    )
  }

  // Update posting status
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        ...journal.metadata,
        posting_status: 'posted',
        posted_at: new Date().toISOString()
      }
    })
    .eq('id', journalId)

  if (updateError) throw updateError

  // Trigger will handle GL balance updates

  return NextResponse.json({
    success: true,
    data: {
      journal_id: journalId,
      journal_number: journal.transaction_code,
      posted_at: new Date().toISOString()
    }
  })
}

async function reverseJournalEntry(supabase: any, organizationId: string, userId: string, data: any) {
  const { originalJournalId, reason, reversalDate } = data

  // Get original journal
  const { data: original, error: originalError } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      lines:universal_transaction_lines(*)
    `)
    .eq('id', originalJournalId)
    .eq('organization_id', organizationId)
    .single()

  if (originalError || !original) {
    return NextResponse.json(
      { error: 'Original journal entry not found' },
      { status: 404 }
    )
  }

  if (original.metadata.posting_status !== 'posted') {
    return NextResponse.json(
      { error: 'Can only reverse posted entries' },
      { status: 400 }
    )
  }

  // Create reversal
  const reversalNumber = `REV-${original.transaction_code}`

  const { data: reversal, error: reversalError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'journal_reversal',
      transaction_code: reversalNumber,
      smart_code: 'HERA.FIN.GL.JOURNAL.REVERSAL.v1',
      transaction_date: reversalDate || new Date().toISOString(),
      reference_entity_id: original.id,
      total_amount: original.total_amount,
      metadata: {
        description: `Reversal of ${original.transaction_code}: ${reason}`,
        original_journal_id: originalJournalId,
        reversal_reason: reason,
        created_by: userId,
        posting_status: 'pending'
      }
    })
    .select()
    .single()

  if (reversalError) throw reversalError

  // Create reversal lines (swap debits/credits)
  const reversalLines = original.lines.map((line: any) => ({
    transaction_id: reversal.id,
    line_number: line.line_number,
    line_entity_id: line.line_entity_id,
    line_amount: line.line_amount,
    metadata: {
      ...line.metadata,
      entry_type: line.metadata.entry_type === 'debit' ? 'credit' : 'debit'
    }
  }))

  await supabase
    .from('universal_transaction_lines')
    .insert(reversalLines)

  return NextResponse.json({
    success: true,
    data: {
      reversal_id: reversal.id,
      reversal_number: reversalNumber,
      original_journal: original.transaction_code,
      status: 'pending'
    }
  })
}

// =============================================
// FINANCIAL REPORTING FUNCTIONS
// =============================================

async function generateTrialBalance(supabase: any, organizationId: string, params: URLSearchParams) {
  const asOfDate = params.get('asOfDate') || new Date().toISOString()

  // Call the database function via edge function
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fin-dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'generate_trial_balance',
      organizationId,
      data: { asOfDate }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: result.data
  })
}

async function generateFinancialReport(supabase: any, organizationId: string, data: any) {
  const validated = FinancialReportSchema.parse(data)

  // Map report type to edge function action
  const actionMap: Record<string, string> = {
    balance_sheet: 'generate_balance_sheet',
    income_statement: 'generate_income_statement',
    cash_flow: 'generate_cash_flow',
    trial_balance: 'generate_trial_balance'
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fin-dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: actionMap[validated.reportType],
      organizationId,
      data: {
        startDate: validated.startDate,
        endDate: validated.endDate,
        asOfDate: validated.asOfDate,
        format: validated.format
      }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: result.data
  })
}

// =============================================
// CONSOLIDATION FUNCTIONS
// =============================================

async function getConsolidationStructure(supabase: any, organizationId: string, params: URLSearchParams) {
  // Get all subsidiary relationships
  const { data: subsidiaries, error } = await supabase
    .from('core_relationships')
    .select(`
      *,
      parent:from_entity_id(
        id,
        entity_name,
        entity_code
      ),
      subsidiary:to_entity_id(
        id,
        entity_name,
        entity_code,
        metadata
      )
    `)
    .eq('relationship_type', 'owns')
    .eq('from_entity_id', organizationId)

  if (error) throw error

  // Build consolidation tree
  const structure = {
    parent: {
      id: organizationId,
      name: 'Parent Company',
      consolidation_method: 'full'
    },
    subsidiaries: subsidiaries?.map((sub: any) => ({
      id: sub.to_entity_id,
      name: sub.subsidiary.entity_name,
      code: sub.subsidiary.entity_code,
      ownership_percent: (sub.metadata as any)?.ownership_percent || 100,
      consolidation_method: (sub.metadata as any)?.consolidation_method || 'full',
      currency: (sub.subsidiary.metadata as any)?.currency || 'USD'
    })) || []
  }

  return NextResponse.json({
    success: true,
    data: structure
  })
}

async function consolidateCompanies(supabase: any, organizationId: string, data: any) {
  const validated = ConsolidationSchema.parse(data)

  // Call consolidation edge function
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fin-dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'consolidate_companies',
      organizationId,
      data: validated
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Store consolidation results
  const { data: consolidation, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'consolidation',
      transaction_code: `CONSOL-${Date.now()}`,
      smart_code: 'HERA.FIN.CONSOL.REPORT.v1',
      transaction_date: validated.consolidationDate,
      metadata: {
        companies: validated.companies,
        results: result.data,
        parameters: validated
      }
    })
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    data: {
      consolidation_id: consolidation.id,
      consolidated_statements: result.data.consolidated_statements,
      eliminations: result.data.eliminations,
      currency_translations: result.data.currency_translations
    }
  })
}

// =============================================
// PERIOD OPERATIONS
// =============================================

async function closePeriod(supabase: any, organizationId: string, userId: string, data: any) {
  const { periodId } = data

  // Validate period exists and is open
  const { data: period, error: periodError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', periodId)
    .eq('organization_id', organizationId)
    .eq('entity_type', 'fiscal_period')
    .single()

  if (periodError || !period) {
    return NextResponse.json(
      { error: 'Period not found' },
      { status: 404 }
    )
  }

  if (period.metadata.status !== 'open') {
    return NextResponse.json(
      { error: 'Period is not open' },
      { status: 400 }
    )
  }

  // Call period close function
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fin-dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'close_period',
      organizationId,
      userId,
      data: { periodId }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: result.data
  })
}

async function getPeriodStatus(supabase: any, organizationId: string, params: URLSearchParams) {
  const includeHistory = params.get('includeHistory') === 'true'

  // Get current open periods
  const { data: openPeriods, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'fiscal_period')
    .eq('metadata->status', 'open')
    .order('metadata->start_date', { ascending: true })

  if (error) throw error

  let history = []
  if (includeHistory) {
    const { data: closedPeriods } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'fiscal_period')
      .eq('metadata->status', 'closed')
      .order('metadata->end_date', { ascending: false })
      .limit(12)

    history = closedPeriods || []
  }

  return NextResponse.json({
    success: true,
    data: {
      open_periods: openPeriods || [],
      closed_periods: history,
      current_period: openPeriods?.[0] || null
    }
  })
}

// =============================================
// FINANCIAL ANALYTICS
// =============================================

async function calculateFinancialRatios(supabase: any, organizationId: string, params: URLSearchParams) {
  const asOfDate = params.get('asOfDate') || new Date().toISOString()

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fin-dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'financial_ratios',
      organizationId,
      data: { asOfDate }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: result.data
  })
}

async function getCashPosition(supabase: any, organizationId: string, params: URLSearchParams) {
  const forecastDays = parseInt(params.get('forecastDays') || '0')

  // Get current cash balance
  const { data: cashAccounts } = await supabase
    .from('core_entities')
    .select(`
      *,
      balance:core_dynamic_data!inner(
        field_value_number
      )
    `)
    .eq('organization_id', organizationId)
    .eq('entity_type', 'gl_account')
    .eq('metadata->account_type', 'asset')
    .like('entity_code', '110%') // Cash accounts typically start with 110

  const currentCash = cashAccounts?.reduce((sum: number, acc: any) => 
    sum + (acc.balance?.[0]?.field_value_number || 0), 0) || 0

  let forecast = null
  if (forecastDays > 0) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fin-dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        action: 'forecast_cash_flow',
        organizationId,
        data: { forecastDays }
      })
    })

    const result = await response.json()
    if (result.success) {
      forecast = result.data
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      current_cash: currentCash,
      as_of: new Date().toISOString(),
      cash_accounts: cashAccounts?.map((acc: any) => ({
        code: acc.entity_code,
        name: acc.entity_name,
        balance: acc.balance?.[0]?.field_value_number || 0
      })) || [],
      forecast: forecast
    }
  })
}

// =============================================
// BUDGET FUNCTIONS
// =============================================

async function createBudget(supabase: any, organizationId: string, data: any) {
  const { budgetName, fiscalYear, budgetType = 'operating', budgetLines } = data

  // Create budget entity
  const { data: budget, error: budgetError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: 'budget',
      entity_name: budgetName,
      entity_code: `BUDGET-${fiscalYear}-${Date.now()}`,
      smart_code: 'HERA.FIN.BUDGET.CREATE.v1',
      metadata: {
        fiscal_year: fiscalYear,
        budget_type: budgetType,
        status: 'draft',
        created_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (budgetError) throw budgetError

  // Create budget lines
  if (budgetLines && budgetLines.length > 0) {
    const lines = budgetLines.map((line: any) => ({
      organization_id: organizationId,
      transaction_type: 'budget_line',
      reference_entity_id: budget.id,
      from_entity_id: line.accountId,
      total_amount: line.annualAmount,
      smart_code: 'HERA.FIN.BUDGET.LINE.v1',
      metadata: {
        account_code: line.accountCode,
        monthly_breakdown: line.monthlyBreakdown || Array(12).fill(line.annualAmount / 12),
        cost_center: line.costCenter,
        budget_method: line.budgetMethod || 'incremental'
      }
    }))

    await supabase
      .from('universal_transactions')
      .insert(lines)
  }

  return NextResponse.json({
    success: true,
    data: {
      budget_id: budget.id,
      budget_name: budgetName,
      fiscal_year: fiscalYear,
      line_count: budgetLines?.length || 0
    }
  })
}

// =============================================
// COST ALLOCATION FUNCTIONS
// =============================================

async function allocateCosts(supabase: any, organizationId: string, data: any) {
  const { allocationRuleId, period, preview = false } = data

  // Get allocation rule
  const { data: rule, error: ruleError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', allocationRuleId)
    .eq('organization_id', organizationId)
    .eq('entity_type', 'allocation_rule')
    .single()

  if (ruleError || !rule) {
    return NextResponse.json(
      { error: 'Allocation rule not found' },
      { status: 404 }
    )
  }

  // Calculate allocations
  const allocations = await calculateAllocations(supabase, organizationId, rule, period)

  if (preview) {
    return NextResponse.json({
      success: true,
      data: {
        preview: true,
        allocations: allocations,
        total_amount: allocations.reduce((sum: number, a: any) => sum + a.amount, 0)
      }
    })
  }

  // Create allocation journal entries
  const journalNumber = `ALLOC-${Date.now()}`
  
  const { data: journal, error: journalError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'journal_entry',
      transaction_code: journalNumber,
      smart_code: 'HERA.FIN.GL.POST.ALLOCATE.v1',
      transaction_date: new Date().toISOString(),
      metadata: {
        description: `Cost allocation: ${rule.entity_name}`,
        allocation_rule_id: allocationRuleId,
        period: period,
        auto_generated: true
      }
    })
    .select()
    .single()

  if (journalError) throw journalError

  // Create allocation lines
  const lines = []
  allocations.forEach((alloc: any, index: number) => {
    // Credit source
    lines.push({
      transaction_id: journal.id,
      line_number: index * 2 + 1,
      line_entity_id: alloc.source_account_id,
      line_amount: alloc.amount,
      metadata: {
        entry_type: 'credit',
        allocation: true
      }
    })
    
    // Debit target
    lines.push({
      transaction_id: journal.id,
      line_number: index * 2 + 2,
      line_entity_id: alloc.target_account_id,
      line_amount: alloc.amount,
      metadata: {
        entry_type: 'debit',
        allocation: true,
        cost_center: alloc.cost_center
      }
    })
  })

  await supabase
    .from('universal_transaction_lines')
    .insert(lines)

  return NextResponse.json({
    success: true,
    data: {
      journal_id: journal.id,
      journal_number: journalNumber,
      allocations: allocations.length,
      total_allocated: allocations.reduce((sum: number, a: any) => sum + a.amount, 0)
    }
  })
}

// =============================================
// IMPORT FUNCTIONS
// =============================================

async function importJournalEntries(supabase: any, organizationId: string, data: any) {
  const { entries, validateOnly = false } = data

  const validationResults = []
  const importResults = []

  for (const entry of entries) {
    try {
      // Validate entry
      const validation = await validateJournalEntry(entry)
      validationResults.push({
        row: entry.row || validationResults.length + 1,
        valid: validation.valid,
        errors: validation.errors
      })

      if (validation.valid && !validateOnly) {
        // Import entry
        const result = await createJournalEntry(
          supabase,
          organizationId,
          'import-user',
          entry
        )
        
        importResults.push({
          row: entry.row || importResults.length + 1,
          success: true,
          journal_id: result.data?.journal_id
        })
      }
    } catch (error) {
      validationResults.push({
        row: entry.row || validationResults.length + 1,
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      validation_results: validationResults,
      import_results: validateOnly ? [] : importResults,
      summary: {
        total: entries.length,
        valid: validationResults.filter(r => r.valid).length,
        imported: importResults.filter(r => r.success).length
      }
    }
  })
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function buildAccountHierarchy(accounts: any[]) {
  const accountMap = new Map(accounts.map(acc => [acc.entity_code, acc]))
  const roots: any[] = []

  accounts.forEach(account => {
    const parentCode = account.metadata.parent_account_code
    if (parentCode && accountMap.has(parentCode)) {
      const parent = accountMap.get(parentCode)
      if (!parent.children) parent.children = []
      parent.children.push(account)
    } else {
      roots.push(account)
    }
  })

  return roots
}

async function validateJournalEntry(entry: any) {
  const errors = []

  // Check required fields
  if (!entry.description) errors.push('Description is required')
  if (!entry.lines || entry.lines.length < 2) errors.push('At least 2 lines required')

  // Check balance
  const totalDebits = entry.lines?.reduce((sum: number, l: any) => sum + (l.debit || 0), 0) || 0
  const totalCredits = entry.lines?.reduce((sum: number, l: any) => sum + (l.credit || 0), 0) || 0
  
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    errors.push(`Entry does not balance. Debits: ${totalDebits}, Credits: ${totalCredits}`)
  }

  // Check account codes
  entry.lines?.forEach((line: any, index: number) => {
    if (!line.accountCode) {
      errors.push(`Line ${index + 1}: Account code is required`)
    }
    if (line.debit === 0 && line.credit === 0) {
      errors.push(`Line ${index + 1}: Either debit or credit must be specified`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

async function calculateAllocations(supabase: any, organizationId: string, rule: any, period: string) {
  // This is a simplified allocation calculation
  // In production, this would implement various allocation methods
  
  const allocations = []
  const { source_accounts, target_accounts, allocation_basis } = rule.metadata

  // Get source costs
  const { data: sourceCosts } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('from_entity_id', source_accounts)
    .gte('transaction_date', `${period}-01`)
    .lte('transaction_date', `${period}-31`)

  const totalCost = sourceCosts?.reduce((sum: number, t: any) => sum + t.total_amount, 0) || 0

  // Allocate to targets based on allocation basis
  if (allocation_basis === 'equal') {
    const perTarget = totalCost / target_accounts.length
    target_accounts.forEach((target: any) => {
      allocations.push({
        source_account_id: source_accounts[0],
        target_account_id: target,
        amount: perTarget,
        cost_center: target.cost_center
      })
    })
  }

  return allocations
}