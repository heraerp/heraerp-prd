import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const period = searchParams.get('period') || 'current_month'
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get GL accounts
    const { data: glAccounts, error: accountError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .order('entity_code')

    if (accountError) throw accountError

    // For each account, calculate balances
    const accountsWithBalances = await Promise.all(
      glAccounts.map(async (account) => {
        // Get period dates
        const { startDate, endDate } = getPeriodDates(period, parseInt(year))

        // Calculate balances from transactions
        const { data: lines } = await supabase
          .from('universal_transaction_lines')
          .select(`
            debit_amount,
            credit_amount,
            universal_transactions!inner(
              transaction_date,
              transaction_status
            )
          `)
          .eq('organization_id', organizationId)
          .eq('gl_account_code', account.entity_code)
          .eq('universal_transactions.transaction_status', 'posted')
          .gte('universal_transactions.transaction_date', startDate.toISOString())
          .lte('universal_transactions.transaction_date', endDate.toISOString())

        const currentBalance = lines?.reduce((acc, line) => {
          return acc + (line.debit_amount || 0) - (line.credit_amount || 0)
        }, 0) || 0

        // Get YTD balance
        const ytdStartDate = new Date(parseInt(year), 0, 1)
        const { data: ytdLines } = await supabase
          .from('universal_transaction_lines')
          .select(`
            debit_amount,
            credit_amount,
            universal_transactions!inner(
              transaction_date,
              transaction_status
            )
          `)
          .eq('organization_id', organizationId)
          .eq('gl_account_code', account.entity_code)
          .eq('universal_transactions.transaction_status', 'posted')
          .gte('universal_transactions.transaction_date', ytdStartDate.toISOString())
          .lte('universal_transactions.transaction_date', endDate.toISOString())

        const ytdBalance = ytdLines?.reduce((acc, line) => {
          return acc + (line.debit_amount || 0) - (line.credit_amount || 0)
        }, 0) || 0

        // Get account type from metadata or smart code
        const accountType = getAccountType(account.entity_code)

        return {
          account_code: account.entity_code,
          account_name: account.entity_name,
          account_type: accountType,
          current_balance: currentBalance,
          ytd_balance: ytdBalance,
          mtd_balance: period === 'current_month' ? currentBalance : 0,
          budget_amount: 0, // Would come from budget module
          variance: 0,
          variance_percent: 0
        }
      })
    )

    return NextResponse.json({
      accounts: accountsWithBalances,
      period,
      year
    })
  } catch (error: any) {
    console.error('GL balances API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getPeriodDates(period: string, year: number) {
  const now = new Date()
  let startDate: Date
  let endDate: Date

  switch (period) {
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    case 'current_quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
      break
    case 'ytd':
      startDate = new Date(year, 0, 1)
      endDate = now
      break
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0)
      break
    case 'last_quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1
      startDate = new Date(now.getFullYear(), lastQuarter * 3, 1)
      endDate = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  }

  return { startDate, endDate }
}

function getAccountType(accountCode: string): string {
  const firstDigit = accountCode.charAt(0)
  switch (firstDigit) {
    case '1': return 'asset'
    case '2': return 'liability'
    case '3': return 'equity'
    case '4': return 'revenue'
    case '5':
    case '6':
    case '7':
    case '8':
    case '9': return 'expense'
    default: return 'asset'
  }
}