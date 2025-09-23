import { heraCode } from '@/lib/smart-codes'
import { pb, extractList, withBranch, pbLog } from './client'

export async function getDailyPostingSummary(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  date: string // YYYY-MM-DD
  includeLineDetails?: boolean
}) {
  try {
    const query = withBranch(
      {
        organization_id: params.organization_id,
        transaction_date: params.date,
        smart_code_prefix: 'HERA.FIN.GL.TXN.JE', // Journal entries
        sort: 'created_at:desc',
        limit: 100
      },
      params.branch_id
    )

    pbLog('getDailyPostingSummary request:', query)

    const json = await pb('/universal_transactions', { query })
    const result = extractList(json)

    // If line details requested, fetch them
    if (params.includeLineDetails && result.items.length > 0) {
      const transactionIds = result.items.map((t: any) => t.id)
      const linesQuery = {
        transaction_id_in: transactionIds.join(','),
        sort: 'line_number:asc',
        limit: 1000
      }

      pbLog('getDailyPostingSummary lines request:', linesQuery)

      const linesJson = await pb('/universal_transaction_lines', { query: linesQuery })
      const linesResult = extractList(linesJson)

      // Group lines by transaction
      const linesByTransaction = linesResult.items.reduce((acc: any, line: any) => {
        if (!acc[line.transaction_id]) {
          acc[line.transaction_id] = []
        }
        acc[line.transaction_id].push(line)
        return acc
      }, {})

      // Attach lines to transactions
      result.items = result.items.map((transaction: any) => ({
        ...transaction,
        lines: linesByTransaction[transaction.id] || []
      }))
    }

    pbLog('getDailyPostingSummary success:', {
      count: result.items.length,
      total: result.total
    })

    return { ok: true, data: result } as const
  } catch (error) {
    pbLog('getDailyPostingSummary error:', error)
    return {
      ok: false,
      data: { items: [], total: 0 },
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function getAccountBalances(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  account_codes?: string[]
  as_of_date?: string
}) {
  try {
    const query = withBranch(
      {
        entity_type: 'gl_account',
        organization_id: params.organization_id,
        ...(params.account_codes?.length
          ? {
              entity_code_in: params.account_codes.join(',')
            }
          : {})
      },
      params.branch_id
    )

    pbLog('getAccountBalances request:', query)

    // Get GL accounts
    const json = await pb('/entities', { query })
    const result = extractList(json)

    if (result.items.length === 0) {
      return { ok: true, data: { accounts: [] } } as const
    }

    // Get balances from dynamic data
    const entityIds = result.items.map((acc: any) => acc.id)
    const balanceData = await getDD(entityIds, 'HERA.FIN.GL.BALANCE.V1')

    pbLog('getAccountBalances balances:', {
      accounts: entityIds.length,
      balances: Object.keys(balanceData).length
    })

    // Merge balance data with accounts
    const accounts = result.items.map((account: any) => ({
      ...account,
      balance: balanceData[account.id] || {
        debit: 0,
        credit: 0,
        balance: 0,
        as_of: params.as_of_date || new Date().toISOString()
      }
    }))

    pbLog('getAccountBalances success:', {
      count: accounts.length
    })

    return { ok: true, data: { accounts } } as const
  } catch (error) {
    pbLog('getAccountBalances error:', error)
    return {
      ok: false,
      data: { accounts: [] },
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function getIncomeStatement(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  start_date: string
  end_date: string
  comparison_period?: {
    start_date: string
    end_date: string
  }
}) {
  try {
    const query = withBranch(
      {
        organization_id: params.organization_id,
        transaction_date_gte: params.start_date,
        transaction_date_lte: params.end_date,
        smart_code_prefix: 'HERA.FIN.GL',
        sort: 'transaction_date:asc',
        limit: 10000 // Large limit for financial reports
      },
      params.branch_id
    )

    pbLog('getIncomeStatement request:', query)

    const json = await pb('/universal_transactions', { query })
    const result = extractList(json)

    // Calculate totals by account type
    const summary = {
      revenue: 0,
      cost_of_sales: 0,
      operating_expenses: 0,
      other_income: 0,
      other_expenses: 0,
      net_income: 0
    }

    // Process transactions to calculate income statement
    result.items.forEach((txn: any) => {
      const accountType = txn.metadata?.account_type || ''
      const amount = txn.total_amount || 0

      switch (accountType) {
        case 'revenue':
          summary.revenue += amount
          break
        case 'cost_of_sales':
          summary.cost_of_sales += amount
          break
        case 'operating_expense':
          summary.operating_expenses += amount
          break
        case 'other_income':
          summary.other_income += amount
          break
        case 'other_expense':
          summary.other_expenses += amount
          break
      }
    })

    // Calculate net income
    summary.net_income =
      summary.revenue -
      summary.cost_of_sales -
      summary.operating_expenses +
      summary.other_income -
      summary.other_expenses

    pbLog('getIncomeStatement success:', summary)

    return {
      ok: true,
      data: {
        period: { start_date: params.start_date, end_date: params.end_date },
        summary,
        transactions: result.items,
        total_transactions: result.total
      }
    } as const
  } catch (error) {
    pbLog('getIncomeStatement error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function getBalanceSheet(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  as_of_date: string
}) {
  try {
    // Get all GL accounts with their types
    const accountsQuery = withBranch(
      {
        entity_type: 'gl_account',
        organization_id: params.organization_id,
        sort: 'entity_code:asc'
      },
      params.branch_id
    )

    pbLog('getBalanceSheet accounts request:', accountsQuery)

    const accountsJson = await pb('/entities', { query: accountsQuery })
    const accountsResult = extractList(accountsJson)

    if (accountsResult.items.length === 0) {
      return {
        ok: true,
        data: {
          as_of_date: params.as_of_date,
          assets: { current: 0, non_current: 0, total: 0 },
          liabilities: { current: 0, non_current: 0, total: 0 },
          equity: { total: 0 }
        }
      } as const
    }

    // Get balances
    const entityIds = accountsResult.items.map((acc: any) => acc.id)
    const balanceData = await getDD(entityIds, 'HERA.FIN.GL.BALANCE.V1')

    // Calculate balance sheet sections
    const balanceSheet = {
      as_of_date: params.as_of_date,
      assets: { current: 0, non_current: 0, total: 0 },
      liabilities: { current: 0, non_current: 0, total: 0 },
      equity: { total: 0 }
    }

    accountsResult.items.forEach((account: any) => {
      const balance = balanceData[account.id]?.balance || 0
      const accountType = account.metadata?.account_type || ''
      const isCurrentAsset = account.metadata?.is_current || false
      const isCurrentLiability = account.metadata?.is_current || false

      if (accountType.startsWith('asset')) {
        if (isCurrentAsset) {
          balanceSheet.assets.current += balance
        } else {
          balanceSheet.assets.non_current += balance
        }
        balanceSheet.assets.total += balance
      } else if (accountType.startsWith('liability')) {
        if (isCurrentLiability) {
          balanceSheet.liabilities.current += balance
        } else {
          balanceSheet.liabilities.non_current += balance
        }
        balanceSheet.liabilities.total += balance
      } else if (accountType.startsWith('equity')) {
        balanceSheet.equity.total += balance
      }
    })

    pbLog('getBalanceSheet success:', balanceSheet)

    return { ok: true, data: balanceSheet } as const
  } catch (error) {
    pbLog('getBalanceSheet error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function getCashFlow(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  start_date: string
  end_date: string
}) {
  try {
    const query = withBranch(
      {
        organization_id: params.organization_id,
        transaction_date_gte: params.start_date,
        transaction_date_lte: params.end_date,
        transaction_type_in: 'payment,receipt,transfer',
        sort: 'transaction_date:asc'
      },
      params.branch_id
    )

    pbLog('getCashFlow request:', query)

    const json = await pb('/universal_transactions', { query })
    const result = extractList(json)

    // Calculate cash flows by category
    const cashFlow = {
      operating: { inflows: 0, outflows: 0, net: 0 },
      investing: { inflows: 0, outflows: 0, net: 0 },
      financing: { inflows: 0, outflows: 0, net: 0 },
      net_change: 0
    }

    result.items.forEach((txn: any) => {
      const amount = txn.total_amount || 0
      const category = txn.metadata?.cash_flow_category || 'operating'
      const isInflow = txn.transaction_type === 'receipt'

      if (isInflow) {
        cashFlow[category as keyof typeof cashFlow].inflows += amount
      } else {
        cashFlow[category as keyof typeof cashFlow].outflows += amount
      }
    })

    // Calculate net amounts
    Object.keys(cashFlow).forEach(category => {
      if (
        category !== 'net_change' &&
        typeof cashFlow[category as keyof typeof cashFlow] === 'object'
      ) {
        const cat = cashFlow[category as keyof typeof cashFlow]
        if ('inflows' in cat && 'outflows' in cat && 'net' in cat) {
          cat.net = cat.inflows - cat.outflows
          cashFlow.net_change += cat.net
        }
      }
    })

    pbLog('getCashFlow success:', cashFlow)

    return {
      ok: true,
      data: {
        period: { start_date: params.start_date, end_date: params.end_date },
        cash_flow: cashFlow,
        transactions: result.items,
        total_transactions: result.total
      }
    } as const
  } catch (error) {
    pbLog('getCashFlow error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function createJournalEntry(params: {
  organization_id: string
  branch_id?: string
  description: string
  date: string
  entries: Array<{
    account_id: string
    debit?: number
    credit?: number
    description?: string
  }>
  metadata?: any
}) {
  try {
    // Validate entries balance
    const totalDebit = params.entries.reduce((sum, e) => sum + (e.debit || 0), 0)
    const totalCredit = params.entries.reduce((sum, e) => sum + (e.credit || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entry must balance (total debits must equal total credits)')
    }

    const body = {
      organization_id: params.organization_id,
      branch_id: params.branch_id,
      smart_code: heraCode('HERA.FIN.GL.TXN.JE.MANUAL.V1'),
      transaction_type: 'journal_entry',
      transaction_date: params.date,
      description: params.description,
      total_amount: totalDebit,
      status: 'posted',
      metadata: {
        ...params.metadata,
        entry_type: 'manual',
        created_at: new Date().toISOString()
      }
    }

    pbLog('createJournalEntry request:', body)

    const json = await pb('/universal_transactions', {
      method: 'POST',
      body
    })

    // Create transaction lines
    const lines = params.entries.map((entry, index) => ({
      transaction_id: json.id,
      line_number: index + 1,
      line_entity_id: entry.account_id,
      debit_amount: entry.debit || 0,
      credit_amount: entry.credit || 0,
      description: entry.description || params.description,
      smart_code: heraCode('HERA.FIN.GL.TXN.LINE.JE.V1')
    }))

    const linesBody = {
      transaction_id: json.id,
      lines
    }

    pbLog('createJournalEntry lines request:', linesBody)

    const linesJson = await pb('/universal_transaction_lines/batch', {
      method: 'POST',
      body: linesBody
    })

    pbLog('createJournalEntry success:', {
      transaction_id: json.id,
      lines_created: lines.length
    })

    return { ok: true, data: { transaction: json, lines: linesJson } } as const
  } catch (error) {
    pbLog('createJournalEntry error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}
