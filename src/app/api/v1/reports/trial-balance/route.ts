import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase-server'

interface GLAccount {
  id: string
  account_code: string
  account_name: string
  account_type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses' | 'cost_of_sales'
  account_level: number
  parent_account_code?: string
  normal_balance: 'debit' | 'credit'
  is_control_account: boolean
  ifrs_classification?: string
  statement_type?: string
}

interface TrialBalanceEntry {
  account: GLAccount
  opening_balance_debit: number
  opening_balance_credit: number
  period_debit: number
  period_credit: number
  closing_balance_debit: number
  closing_balance_credit: number
  ytd_debit: number
  ytd_credit: number
  children?: TrialBalanceEntry[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const currency = searchParams.get('currency') || 'AED'

    if (!organizationId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'organization_id, start_date, and end_date are required' },
        { status: 400 }
      )
    }

    // Get fiscal year start for YTD calculations
    const fiscalYearStart = new Date(startDate).getFullYear() + '-01-01'

    // 1. Fetch all GL accounts for the organization
    const { data: glAccounts, error: glError } = await supabaseAdmin
      .from('core_entities')
      .select(
        `
        id,
        entity_code,
        entity_name,
        status
      `
      )
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .neq('status', 'deleted')
      .order('entity_code')

    if (glError) throw glError

    // 2. Fetch GL account metadata from dynamic data
    const accountIds = glAccounts?.map(a => a.id) || []
    const { data: dynamicData, error: dynamicError } = await supabaseAdmin
      .from('core_dynamic_data')
      .select(
        `
        entity_id,
        field_name,
        field_value_text,
        field_value_number
      `
      )
      .eq('organization_id', organizationId)
      .in('entity_id', accountIds)
      .in('field_name', [
        'account_type',
        'account_level',
        'parent_account_code',
        'normal_balance',
        'is_control_account',
        'ifrs_classification',
        'statement_type'
      ])

    if (dynamicError) throw dynamicError

    // Build account metadata map
    const accountMetadata = new Map<string, any>()
    dynamicData?.forEach(field => {
      if (!accountMetadata.has(field.entity_id)) {
        accountMetadata.set(field.entity_id, {})
      }
      const meta = accountMetadata.get(field.entity_id)
      if (field.field_name === 'account_level' || field.field_name === 'is_control_account') {
        meta[field.field_name] = field.field_value_number || field.field_value_text === 'true'
      } else {
        meta[field.field_name] = field.field_value_text
      }
    })

    // 3. Fetch all journal entries (transactions) for the period
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('universal_transactions')
      .select(
        `
        id,
        transaction_code,
        transaction_date,
        transaction_type,
        total_amount,
        universal_transaction_lines (
          id,
          entity_id,
          line_number,
          line_amount,
          line_data
        )
      `
      )
      .eq('organization_id', organizationId)
      .in('transaction_type', ['journal_entry', 'sale', 'purchase', 'payment', 'receipt'])
      .gte('transaction_date', fiscalYearStart)
      .lte('transaction_date', endDate)

    if (txError) throw txError

    // 4. Calculate balances for each account
    const accountBalances = new Map<
      string,
      {
        opening_debit: number
        opening_credit: number
        period_debit: number
        period_credit: number
        ytd_debit: number
        ytd_credit: number
      }
    >()

    // Initialize all accounts with zero balances
    glAccounts?.forEach(account => {
      accountBalances.set(account.id, {
        opening_debit: 0,
        opening_credit: 0,
        period_debit: 0,
        period_credit: 0,
        ytd_debit: 0,
        ytd_credit: 0
      })
    })

    // Process transactions
    transactions?.forEach(tx => {
      const txDate = new Date(tx.transaction_date)
      const isPeriod = txDate >= new Date(startDate) && txDate <= new Date(endDate)
      const isBeforeStart = txDate < new Date(startDate)

      tx.universal_transaction_lines?.forEach(line => {
        if (!line.entity_id || !accountBalances.has(line.entity_id)) return

        const balance = accountBalances.get(line.entity_id)!
        const debitAmount = line.line_data?.debit || 0
        const creditAmount = line.line_data?.credit || 0

        if (isBeforeStart) {
          // Opening balance
          balance.opening_debit += debitAmount
          balance.opening_credit += creditAmount
        }

        if (isPeriod) {
          // Period activity
          balance.period_debit += debitAmount
          balance.period_credit += creditAmount
        }

        // YTD (all transactions from fiscal year start)
        balance.ytd_debit += debitAmount
        balance.ytd_credit += creditAmount
      })
    })

    // 5. Build hierarchical trial balance structure
    const entries: TrialBalanceEntry[] = []
    const accountMap = new Map<string, TrialBalanceEntry>()

    // First pass: create all entries
    glAccounts?.forEach(account => {
      const meta = accountMetadata.get(account.id) || {}
      const balance = accountBalances.get(account.id)!

      const glAccount: GLAccount = {
        id: account.id,
        account_code: account.entity_code,
        account_name: account.entity_name,
        account_type: meta.account_type || 'assets',
        account_level: meta.account_level || 1,
        parent_account_code: meta.parent_account_code,
        normal_balance: meta.normal_balance || 'debit',
        is_control_account: meta.is_control_account || false,
        ifrs_classification: meta.ifrs_classification,
        statement_type: meta.statement_type
      }

      // Calculate closing balances
      const closingDebit =
        balance.opening_debit +
        balance.period_debit -
        balance.opening_credit -
        balance.period_credit
      const closingCredit =
        balance.opening_credit +
        balance.period_credit -
        balance.opening_debit -
        balance.period_debit

      const entry: TrialBalanceEntry = {
        account: glAccount,
        opening_balance_debit: balance.opening_debit,
        opening_balance_credit: balance.opening_credit,
        period_debit: balance.period_debit,
        period_credit: balance.period_credit,
        closing_balance_debit: Math.max(0, closingDebit),
        closing_balance_credit: Math.max(0, -closingDebit),
        ytd_debit: balance.ytd_debit,
        ytd_credit: balance.ytd_credit,
        children: []
      }

      accountMap.set(account.entity_code, entry)
    })

    // Second pass: build hierarchy
    accountMap.forEach((entry, code) => {
      if (entry.account.parent_account_code) {
        const parent = accountMap.get(entry.account.parent_account_code)
        if (parent) {
          parent.children?.push(entry)
        } else {
          entries.push(entry)
        }
      } else if (entry.account.account_level === 1) {
        entries.push(entry)
      }
    })

    // Sort entries by account code within each level
    const sortEntries = (entries: TrialBalanceEntry[]) => {
      entries.sort((a, b) => a.account.account_code.localeCompare(b.account.account_code))
      entries.forEach(entry => {
        if (entry.children && entry.children.length > 0) {
          sortEntries(entry.children)
        }
      })
    }
    sortEntries(entries)

    // 6. Calculate totals
    const totals = {
      opening_debit: 0,
      opening_credit: 0,
      period_debit: 0,
      period_credit: 0,
      closing_debit: 0,
      closing_credit: 0,
      ytd_debit: 0,
      ytd_credit: 0
    }

    accountBalances.forEach((balance, accountId) => {
      const account = glAccounts?.find(a => a.id === accountId)
      if (!account) return

      const meta = accountMetadata.get(accountId) || {}
      // Only include detail accounts in totals (not control accounts)
      if (!meta.is_control_account) {
        totals.opening_debit += balance.opening_debit
        totals.opening_credit += balance.opening_credit
        totals.period_debit += balance.period_debit
        totals.period_credit += balance.period_credit
        totals.ytd_debit += balance.ytd_debit
        totals.ytd_credit += balance.ytd_credit

        const closingDebit =
          balance.opening_debit +
          balance.period_debit -
          balance.opening_credit -
          balance.period_credit
        totals.closing_debit += Math.max(0, closingDebit)
        totals.closing_credit += Math.max(0, -closingDebit)
      }
    })

    // 7. Get organization details
    const { data: orgData } = await supabaseAdmin
      .from('core_organizations')
      .select('organization_name')
      .eq('id', organizationId)
      .single()

    const response = {
      success: true,
      data: {
        organization: {
          id: organizationId,
          name: orgData?.organization_name || 'Unknown Organization',
          currency: currency,
          fiscal_year_start: fiscalYearStart
        },
        period: {
          from: startDate,
          to: endDate,
          fiscal_year: new Date(startDate).getFullYear(),
          fiscal_period: new Date(startDate).getMonth() + 1
        },
        entries,
        totals,
        generated_at: new Date().toISOString(),
        report_currency: currency
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Trial balance API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Export endpoint for PDF/Excel/CSV
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'

    // Get trial balance data first
    const response = await GET(request)
    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(data, { status: 400 })
    }

    // For now, return a simple CSV format
    // In production, you would use libraries like jsPDF, ExcelJS, etc.
    if (format === 'csv') {
      const csv = generateCSV(data.data)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=trial-balance-${new Date().toISOString().split('T')[0]}.csv`
        }
      })
    }

    // Placeholder for other formats
    return NextResponse.json({
      message: `Export format ${format} not yet implemented. CSV is currently available.`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateCSV(data: any): string {
  const rows: string[] = []

  // Header
  rows.push(`Trial Balance Report - ${data.organization.name}`)
  rows.push(`Period: ${data.period.from} to ${data.period.to}`)
  rows.push(`Currency: ${data.report_currency}`)
  rows.push('')

  // Column headers
  rows.push(
    'Account Code,Account Name,Opening Debit,Opening Credit,Period Debit,Period Credit,Closing Debit,Closing Credit'
  )

  // Recursive function to flatten entries
  const flattenEntries = (entries: TrialBalanceEntry[], level: number = 0): void => {
    entries.forEach(entry => {
      const indent = '  '.repeat(level)
      rows.push(
        [
          entry.account.account_code,
          `${indent}${entry.account.account_name}`,
          entry.opening_balance_debit.toFixed(2),
          entry.opening_balance_credit.toFixed(2),
          entry.period_debit.toFixed(2),
          entry.period_credit.toFixed(2),
          entry.closing_balance_debit.toFixed(2),
          entry.closing_balance_credit.toFixed(2)
        ].join(',')
      )

      if (entry.children && entry.children.length > 0) {
        flattenEntries(entry.children, level + 1)
      }
    })
  }

  flattenEntries(data.entries)

  // Totals
  rows.push('')
  rows.push(
    [
      'TOTAL',
      '',
      data.totals.opening_debit.toFixed(2),
      data.totals.opening_credit.toFixed(2),
      data.totals.period_debit.toFixed(2),
      data.totals.period_credit.toFixed(2),
      data.totals.closing_debit.toFixed(2),
      data.totals.closing_credit.toFixed(2)
    ].join(',')
  )

  return rows.join('\n')
}
