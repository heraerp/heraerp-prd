/**
 * HERA Finance DNA - Daily Sales to GL Journal Posting
 *
 * Aggregates daily POS sales by branch and creates balanced GL journals
 * using Finance DNA's Account Derivation Engine and Auto-Posting Engine.
 */

import { universalApi } from '@/lib/universal-api-v2'

interface DailySalesSummary {
  organization_id: string
  branch_id: string
  day: string
  currency: string
  totals: {
    serviceNet: number
    productNet: number
    vat: number
    discounts: number
    tips: number
    cash: number
    card: number
    gift: number
    returns: number
  }
  transactionCount: number
}

interface SalesPostingPolicy {
  accounts: {
    service_revenue: string
    product_revenue: string
    vat_liability: string
    discounts_contra: string
    tips_payable: string
    cash_clearing: string
    card_clearing: string
    giftcard_liability: string
    rounding_diff: string
  }
  grouping: {
    by_branch: boolean
    by_tax_rate: boolean
  }
  include_cogs_from_inventory: boolean
}

interface JournalLine {
  account_id: string
  debit: number
  credit: number
  dr?: number
  cr?: number
}

interface DailyJournalPayload {
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
      day: string
      account_type: string
    }
  }>
}

/**
 * Summarizes sales by branch and day from POS transactions
 */
export async function summarizeSalesByBranchDay({
  organization_id,
  branch_id,
  dayStart,
  dayEnd
}: {
  organization_id: string
  branch_id: string
  dayStart: string
  dayEnd: string
}): Promise<DailySalesSummary> {
  try {
    universalApi.setOrganizationId(organization_id)

    // Query POS transactions for the day
    const salesResponse = await universalApi.read({
      table: 'universal_transactions',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        {
          field: 'smart_code',
          operator: 'in',
          value: [
            'HERA.SALON.SALES.ORDER.SERVICE.V1',
            'HERA.SALON.SALES.ORDER.PRODUCT.V1',
            'HERA.SALON.POS.SALE.HEADER.V1'
          ]
        },
        { field: 'when_ts', operator: 'gte', value: dayStart },
        { field: 'when_ts', operator: 'lt', value: dayEnd },
        { field: 'status', operator: 'eq', value: 'posted' }
      ]
    })

    const transactions = salesResponse?.data || []

    // Get transaction lines for all sales
    const transactionIds = transactions.map(t => t.id)
    let lines: any[] = []

    if (transactionIds.length > 0) {
      const linesResponse = await universalApi.read({
        table: 'universal_transaction_lines',
        filters: [
          { field: 'organization_id', operator: 'eq', value: organization_id },
          { field: 'transaction_id', operator: 'in', value: transactionIds }
        ]
      })
      lines = linesResponse?.data || []
    }

    // Initialize totals
    const totals = {
      serviceNet: 0,
      productNet: 0,
      vat: 0,
      discounts: 0,
      tips: 0,
      cash: 0,
      card: 0,
      gift: 0,
      returns: 0
    }

    // Process each transaction
    transactions.forEach(transaction => {
      const transactionLines = lines.filter(l => l.transaction_id === transaction.id)

      transactionLines.forEach(line => {
        const amount = line.line_amount || 0
        const metadata = line.metadata || {}

        // Categorize based on smart codes and metadata
        switch (line.smart_code) {
          case 'HERA.SALON.SVC.LINE.STANDARD.V1':
            totals.serviceNet += amount
            break
          case 'HERA.SALON.PROD.LINE.RETAIL.V1':
            totals.productNet += amount
            break
          case 'HERA.SALON.POS.ADJUST.DISCOUNT.V1':
            totals.discounts += Math.abs(amount) // Discounts are negative
            break
          case 'HERA.SALON.GL.LINE.TIP.V1':
            totals.tips += amount
            break
          case 'HERA.ACCOUNTING.GL.LINE.CASH.V1':
            totals.cash += amount
            break
          case 'HERA.ACCOUNTING.GL.LINE.CARD.V1':
            totals.card += amount
            break
          case 'HERA.ACCOUNTING.GL.LINE.VOUCHER.V1':
            totals.gift += amount
            break
        }

        // Handle VAT from metadata
        if (metadata.vat_amount) {
          totals.vat += parseFloat(metadata.vat_amount)
        }

        // Handle returns (negative amounts)
        if (amount < 0 && !line.smart_code.includes('DISCOUNT')) {
          totals.returns += Math.abs(amount)
        }
      })
    })

    // Get organization currency
    const orgResponse = await universalApi.read({
      table: 'core_entities',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'entity_type', operator: 'eq', value: 'organization' },
        { field: 'id', operator: 'eq', value: organization_id }
      ]
    })

    const currency = orgResponse?.data?.[0]?.currency || 'AED'

    return {
      organization_id,
      branch_id,
      day: dayStart.slice(0, 10),
      currency,
      totals,
      transactionCount: transactions.length
    }
  } catch (error) {
    console.error('Error summarizing daily sales:', error)
    throw new Error(
      `Failed to summarize sales: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Builds balanced GL journal payload from sales summary
 */
export function buildDailyJournalPayload(
  summary: DailySalesSummary,
  policy: SalesPostingPolicy,
  postingDate: string
): DailyJournalPayload {
  const lines: JournalLine[] = []
  const { totals } = summary

  // Helper to create GL line
  const GL = {
    dr: (account_id: string, amount: number) => ({
      account_id,
      debit: amount,
      credit: 0,
      dr: amount
    }),
    cr: (account_id: string, amount: number) => ({
      account_id,
      debit: 0,
      credit: amount,
      cr: amount
    })
  }

  // Payment clearings (debit - money coming in)
  if (totals.cash > 0) {
    lines.push(GL.dr(policy.accounts.cash_clearing, totals.cash))
  }
  if (totals.card > 0) {
    lines.push(GL.dr(policy.accounts.card_clearing, totals.card))
  }
  if (totals.gift > 0) {
    // Gift card sales create liability (credit)
    lines.push(GL.cr(policy.accounts.giftcard_liability, totals.gift))
  }

  // Revenue (credit - income earned)
  if (totals.serviceNet > 0) {
    lines.push(GL.cr(policy.accounts.service_revenue, totals.serviceNet))
  }
  if (totals.productNet > 0) {
    lines.push(GL.cr(policy.accounts.product_revenue, totals.productNet))
  }

  // VAT liability (credit - owed to government)
  if (totals.vat > 0) {
    lines.push(GL.cr(policy.accounts.vat_liability, totals.vat))
  }

  // Discounts (debit - contra revenue)
  if (totals.discounts > 0) {
    lines.push(GL.dr(policy.accounts.discounts_contra, totals.discounts))
  }

  // Tips payable (credit - liability to staff)
  if (totals.tips > 0) {
    lines.push(GL.cr(policy.accounts.tips_payable, totals.tips))
  }

  // Balance check and rounding
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0)
  const difference = totalDebits - totalCredits

  if (Math.abs(difference) > 0.01) {
    // Add rounding difference
    if (difference > 0) {
      lines.push(GL.cr(policy.accounts.rounding_diff, Math.abs(difference)))
    } else {
      lines.push(GL.dr(policy.accounts.rounding_diff, Math.abs(difference)))
    }
  }

  // Calculate final total
  const finalTotal = lines.reduce((sum, line) => sum + Math.max(line.debit, line.credit), 0)

  return {
    header: {
      organization_id: summary.organization_id,
      transaction_type: 'journal',
      smart_code: 'HERA.FINANCE.JOURNAL.DAILY_SALES.v1',
      when_ts: postingDate,
      branch_id: summary.branch_id,
      transaction_currency_code: summary.currency,
      status: 'posted',
      total_amount: finalTotal,
      memo: `Daily sales journal for ${summary.day} - ${summary.transactionCount} transactions`
    },
    lines: lines.map((line, index) => ({
      line_number: index + 1,
      smart_code: 'HERA.FINANCE.JOURNAL.LINE.GL.V1',
      entity_id: line.account_id,
      debit: line.debit,
      credit: line.credit,
      line_amount: line.debit || line.credit,
      metadata: {
        source: 'daily-sales',
        day: summary.day,
        account_type: 'gl'
      }
    }))
  }
}

/**
 * Posts daily sales journal to universal tables
 */
export async function postDailySalesJournal(payload: DailyJournalPayload): Promise<{
  success: boolean
  transaction_id?: string
  error?: string
}> {
  try {
    universalApi.setOrganizationId(payload.header.organization_id)

    // Check if journal already exists for this branch/day
    const existingResponse = await universalApi.read({
      table: 'universal_transactions',
      filters: [
        { field: 'organization_id', operator: 'eq', value: payload.header.organization_id },
        { field: 'smart_code', operator: 'eq', value: 'HERA.FINANCE.JOURNAL.DAILY_SALES.v1' },
        { field: 'branch_id', operator: 'eq', value: payload.header.branch_id },
        {
          field: 'when_ts',
          operator: 'gte',
          value: payload.header.when_ts.slice(0, 10) + 'T00:00:00Z'
        },
        {
          field: 'when_ts',
          operator: 'lt',
          value: payload.header.when_ts.slice(0, 10) + 'T23:59:59Z'
        }
      ]
    })

    if (existingResponse?.data && existingResponse.data.length > 0) {
      return {
        success: true,
        transaction_id: existingResponse.data[0].id,
        error: 'Journal already exists for this branch/day'
      }
    }

    // Check fiscal period status
    const fiscalCheck = await checkFiscalPeriodOpen(
      payload.header.organization_id,
      payload.header.when_ts.slice(0, 10)
    )

    if (!fiscalCheck.isOpen) {
      throw new Error(`Cannot post to closed fiscal period: ${fiscalCheck.reason}`)
    }

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
    console.error('Error posting daily sales journal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
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
    // Get fiscal periods for the organization
    const periodsResponse = await universalApi.read({
      table: 'core_entities',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'entity_type', operator: 'eq', value: 'fiscal_period' }
      ]
    })

    const periods = periodsResponse?.data || []

    // Find period containing the date
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

    return {
      isOpen: false,
      reason: 'No fiscal period found for the specified date'
    }
  } catch (error) {
    console.error('Error checking fiscal period:', error)
    return {
      isOpen: false,
      reason: 'Error checking fiscal period status'
    }
  }
}

/**
 * Get daily posting status for multiple days and branches
 */
export async function getDailyPostingStatus({
  organization_id,
  branch_ids,
  days
}: {
  organization_id: string
  branch_ids: string[]
  days: string[]
}): Promise<
  Array<{
    branch_id: string
    day: string
    posted: boolean
    total_amount?: number
    transaction_count?: number
    transaction_id?: string
  }>
> {
  try {
    universalApi.setOrganizationId(organization_id)

    const results = []

    for (const branch_id of branch_ids) {
      for (const day of days) {
        // Check if journal exists
        const journalResponse = await universalApi.read({
          table: 'universal_transactions',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organization_id },
            { field: 'smart_code', operator: 'eq', value: 'HERA.FINANCE.JOURNAL.DAILY_SALES.v1' },
            { field: 'branch_id', operator: 'eq', value: branch_id },
            { field: 'when_ts', operator: 'gte', value: day + 'T00:00:00Z' },
            { field: 'when_ts', operator: 'lt', value: day + 'T23:59:59Z' }
          ]
        })

        const journal = journalResponse?.data?.[0]

        if (journal) {
          results.push({
            branch_id,
            day,
            posted: true,
            total_amount: journal.total_amount,
            transaction_id: journal.id
          })
        } else {
          // Get sales summary to show potential totals
          const dayStart = day + 'T00:00:00Z'
          const dayEnd = day + 'T23:59:59Z'

          try {
            const summary = await summarizeSalesByBranchDay({
              organization_id,
              branch_id,
              dayStart,
              dayEnd
            })

            results.push({
              branch_id,
              day,
              posted: false,
              total_amount: Object.values(summary.totals).reduce((sum, val) => sum + val, 0),
              transaction_count: summary.transactionCount
            })
          } catch {
            results.push({
              branch_id,
              day,
              posted: false,
              total_amount: 0,
              transaction_count: 0
            })
          }
        }
      }
    }

    return results
  } catch (error) {
    console.error('Error getting daily posting status:', error)
    throw error
  }
}
