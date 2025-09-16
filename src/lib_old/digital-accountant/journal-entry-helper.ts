/**
 * HERA Digital Accountant - Journal Entry Helper
 * Smart Code: HERA.DIGITAL.ACCOUNTANT.JOURNAL.HELPER.v1
 *
 * Demonstrates how natural language transforms into complete journal entries
 */

import { universalApi } from '@/lib/universal-api'

export interface UniversalFinanceEvent {
  organization_id: string
  event_type: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'EXPENSE' | 'JOURNAL_ENTRY'
  event_id: string
  event_timestamp: string
  document: {
    document_date: string
    reference?: string
  }
  parties?: {
    customer_id?: string
    vendor_id?: string
  }
  amounts: {
    currency: string
    gross_amount: number
    net_amount?: number
    tax_amount?: number
    tax_code?: string
  }
  payment?: {
    method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK'
    processor_ref?: string
  }
  lines: Array<{
    description: string
    quantity: number
    unit_amount: number
    smart_code: string
  }>
  posting: {
    policy: 'AUTO' | 'MANUAL' | 'APPROVAL_REQUIRED'
    desired_period?: string
  }
  metadata: {
    source_app: string
    captured_by: string
    utterance: string
  }
}

export interface JournalEntryHeader {
  organization_id: string
  transaction_type: 'JOURNAL_ENTRY'
  transaction_date: string
  reference_number?: string
  smart_code: string
  fiscal_year: number
  fiscal_period: number
  posting_period_code: string
  transaction_currency_code: string
  base_currency_code: string
  exchange_rate: number
  total_amount: number
  ai_confidence: number
  ai_insights: {
    posting_recipe: string
    source_event_id: string
    natural_language_input: string
  }
  business_context?: any
  metadata: {
    source_app: string
    finance_dna_version: string
  }
}

export interface JournalEntryLine {
  organization_id: string
  transaction_id: string
  line_number: number
  line_type: 'DEBIT' | 'CREDIT' | 'TAX'
  entity_id: string // Account ID from core_entities
  description: string
  line_amount: number
  smart_code: string
}

export class DigitalAccountantHelper {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Transform natural language input into a structured journal entry
   */
  async processNaturalLanguageEntry(
    utterance: string,
    context: {
      businessType?: 'salon' | 'restaurant' | 'retail' | 'professional'
      autoPost?: boolean
      desiredPeriod?: string
    } = {}
  ): Promise<{
    event: UniversalFinanceEvent
    header: JournalEntryHeader
    lines: JournalEntryLine[]
    posting_result: any
  }> {
    // 1. Parse natural language input
    const event = await this.parseNaturalLanguage(utterance, context)

    // 2. Generate journal entry structure
    const { header, lines } = await this.generateJournalEntry(event)

    // 3. Post to universal tables if auto-posting enabled
    let posting_result = null
    if (context.autoPost !== false) {
      posting_result = await this.postJournalEntry(header, lines)
    }

    return {
      event,
      header,
      lines,
      posting_result
    }
  }

  /**
   * Parse natural language into structured event
   */
  private async parseNaturalLanguage(
    utterance: string,
    context: any
  ): Promise<UniversalFinanceEvent> {
    // Call Digital Accountant API for NLP processing
    const response = await fetch('/api/v1/digital-accountant/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        utterance,
        organizationId: this.organizationId,
        context
      })
    })

    if (!response.ok) {
      throw new Error('Failed to parse natural language input')
    }

    return await response.json()
  }

  /**
   * Generate complete journal entry from event
   */
  private async generateJournalEntry(
    event: UniversalFinanceEvent
  ): Promise<{ header: JournalEntryHeader; lines: JournalEntryLine[] }> {
    // Get current fiscal period
    const currentPeriod = await this.getCurrentFiscalPeriod()

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}`

    // Create header
    const header: JournalEntryHeader = {
      organization_id: this.organizationId,
      transaction_type: 'JOURNAL_ENTRY',
      transaction_date: event.document.document_date,
      reference_number: event.document.reference,
      smart_code: this.getJournalSmartCode(event.event_type),
      fiscal_year: currentPeriod.year,
      fiscal_period: currentPeriod.period,
      posting_period_code: currentPeriod.code,
      transaction_currency_code: event.amounts.currency,
      base_currency_code: event.amounts.currency, // Assume same for simplicity
      exchange_rate: 1.0,
      total_amount: event.amounts.gross_amount,
      ai_confidence: 0.95,
      ai_insights: {
        posting_recipe: this.getPostingRecipe(event),
        source_event_id: event.event_id,
        natural_language_input: event.metadata.utterance
      },
      business_context: event.parties,
      metadata: {
        source_app: event.metadata.source_app,
        finance_dna_version: 'v1'
      }
    }

    // Generate lines based on event type and payment method
    const lines = await this.generateJournalLines(event, transactionId)

    return { header, lines }
  }

  /**
   * Generate journal lines based on transaction type
   */
  private async generateJournalLines(
    event: UniversalFinanceEvent,
    transactionId: string
  ): Promise<JournalEntryLine[]> {
    const lines: JournalEntryLine[] = []
    let lineNumber = 1

    // Get accounts from COA
    const accounts = await this.getChartOfAccounts()

    switch (event.event_type) {
      case 'SALE':
        // Debit: Cash/Card Clearing
        const assetAccount =
          event.payment?.method === 'CASH' ? accounts.cash_on_hand : accounts.card_clearing

        lines.push({
          organization_id: this.organizationId,
          transaction_id: transactionId,
          line_number: lineNumber++,
          line_type: 'DEBIT',
          entity_id: assetAccount.id,
          description: `${event.payment?.method || 'Cash'} received - ${event.document.reference}`,
          line_amount: event.amounts.gross_amount,
          smart_code: this.getAccountSmartCode(assetAccount.account_type)
        })

        // Credit: Service Revenue (net amount if VAT)
        const revenueAmount = event.amounts.net_amount || event.amounts.gross_amount
        lines.push({
          organization_id: this.organizationId,
          transaction_id: transactionId,
          line_number: lineNumber++,
          line_type: 'CREDIT',
          entity_id: accounts.service_revenue.id,
          description: event.lines[0].description,
          line_amount: revenueAmount,
          smart_code: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.REVENUE.SERVICE.v1'
        })

        // Credit: VAT Output Tax (if applicable)
        if (event.amounts.tax_amount && event.amounts.tax_amount > 0) {
          lines.push({
            organization_id: this.organizationId,
            transaction_id: transactionId,
            line_number: lineNumber++,
            line_type: 'CREDIT',
            entity_id: accounts.vat_output_tax.id,
            description: `VAT ${event.amounts.tax_code} on ${event.document.reference}`,
            line_amount: event.amounts.tax_amount,
            smart_code: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.TAX.OUTPUT.VAT.v1'
          })
        }
        break

      case 'EXPENSE':
        // Debit: Expense Account
        lines.push({
          organization_id: this.organizationId,
          transaction_id: transactionId,
          line_number: lineNumber++,
          line_type: 'DEBIT',
          entity_id: accounts.operating_expenses.id,
          description: event.lines[0].description,
          line_amount: event.amounts.gross_amount,
          smart_code: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.EXPENSE.OPERATING.v1'
        })

        // Credit: Cash/Accounts Payable
        const liabilityAccount =
          event.payment?.method === 'CASH' ? accounts.cash_on_hand : accounts.accounts_payable

        lines.push({
          organization_id: this.organizationId,
          transaction_id: transactionId,
          line_number: lineNumber++,
          line_type: 'CREDIT',
          entity_id: liabilityAccount.id,
          description: `Payment - ${event.document.reference}`,
          line_amount: event.amounts.gross_amount,
          smart_code: this.getAccountSmartCode(liabilityAccount.account_type)
        })
        break

      // Add more transaction types as needed
    }

    return lines
  }

  /**
   * Post journal entry to universal tables
   */
  private async postJournalEntry(
    header: JournalEntryHeader,
    lines: JournalEntryLine[]
  ): Promise<any> {
    // Validate entries balance
    const debits = lines
      .filter(l => l.line_type === 'DEBIT')
      .reduce((sum, l) => sum + l.line_amount, 0)
    const credits = lines
      .filter(l => l.line_type === 'CREDIT')
      .reduce((sum, l) => sum + l.line_amount, 0)

    if (Math.abs(debits - credits) > 0.01) {
      throw new Error(`Journal entry not balanced: Debits ${debits} != Credits ${credits}`)
    }

    // Post header to universal_transactions
    const headerResult = await universalApi.createTransaction({
      organization_id: header.organization_id,
      transaction_type: 'journal_entry',
      transaction_date: header.transaction_date,
      total_amount: header.total_amount,
      smart_code: header.smart_code,
      metadata: header
    })

    // Post lines to universal_transaction_lines
    const linesResult = await Promise.all(
      lines.map(line =>
        universalApi.createTransactionLine({
          ...line,
          transaction_id: headerResult.id
        })
      )
    )

    return {
      header: headerResult,
      lines: linesResult,
      journal_entry_id: headerResult.id,
      posted_at: new Date().toISOString(),
      status: 'posted'
    }
  }

  /**
   * Helper methods for account and code resolution
   */
  private async getCurrentFiscalPeriod() {
    // In production, this would query fiscal period setup
    const now = new Date()
    return {
      year: now.getFullYear(),
      period: now.getMonth() + 1,
      code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
  }

  private async getChartOfAccounts() {
    // In production, this would query the organization's COA
    return {
      cash_on_hand: { id: 'acc_cash', account_type: 'asset' },
      card_clearing: { id: 'acc_card', account_type: 'asset' },
      service_revenue: { id: 'acc_revenue', account_type: 'revenue' },
      vat_output_tax: { id: 'acc_vat_out', account_type: 'liability' },
      operating_expenses: { id: 'acc_expenses', account_type: 'expense' },
      accounts_payable: { id: 'acc_payable', account_type: 'liability' }
    }
  }

  private getJournalSmartCode(eventType: string): string {
    const codeMap = {
      SALE: 'HERA.ACCOUNTING.GL.JOURNAL.SALES.v1',
      PURCHASE: 'HERA.ACCOUNTING.GL.JOURNAL.PURCHASE.v1',
      EXPENSE: 'HERA.ACCOUNTING.GL.JOURNAL.EXPENSE.v1',
      PAYMENT: 'HERA.ACCOUNTING.GL.JOURNAL.PAYMENT.v1'
    }
    return codeMap[eventType as keyof typeof codeMap] || 'HERA.ACCOUNTING.GL.JOURNAL.GENERAL.v1'
  }

  private getAccountSmartCode(accountType: string): string {
    const codeMap = {
      asset: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1',
      liability: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.LIABILITY.v1',
      revenue: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.REVENUE.v1',
      expense: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.EXPENSE.v1'
    }
    return (
      codeMap[accountType as keyof typeof codeMap] || 'HERA.ACCOUNTING.COA.ACCOUNT.GL.GENERAL.v1'
    )
  }

  private getPostingRecipe(event: UniversalFinanceEvent): string {
    if (event.event_type === 'SALE') {
      if (event.amounts.tax_amount && event.amounts.tax_amount > 0) {
        return event.payment?.method === 'CARD' ? 'CARD_SALE_WITH_VAT' : 'CASH_SALE_WITH_VAT'
      }
      return event.payment?.method === 'CARD' ? 'CARD_SALE_NO_TAX' : 'CASH_SALE_NO_TAX'
    }
    return 'GENERAL_JOURNAL'
  }
}

/**
 * Example usage for salon transactions
 */
export const salonJournalExamples = {
  // Simple cash sale
  async processCashSale(organizationId: string, amount: number, description: string) {
    const helper = new DigitalAccountantHelper(organizationId)
    return await helper.processNaturalLanguageEntry(
      `Client paid ${amount} cash for ${description}`,
      { businessType: 'salon', autoPost: true }
    )
  },

  // Card sale with VAT
  async processCardSaleWithVAT(organizationId: string, amount: number, description: string) {
    const helper = new DigitalAccountantHelper(organizationId)
    return await helper.processNaturalLanguageEntry(
      `Client paid ${amount} by card for ${description} including 5% VAT`,
      { businessType: 'salon', autoPost: true }
    )
  },

  // Commission payment
  async processCommissionPayment(
    organizationId: string,
    staffName: string,
    rate: number,
    baseAmount: number
  ) {
    const helper = new DigitalAccountantHelper(organizationId)
    const commissionAmount = baseAmount * (rate / 100)
    return await helper.processNaturalLanguageEntry(
      `Pay ${staffName} ${rate}% commission on ${baseAmount} revenue (${commissionAmount})`,
      { businessType: 'salon', autoPost: true }
    )
  },

  // Expense recording
  async processExpense(
    organizationId: string,
    vendor: string,
    amount: number,
    description: string
  ) {
    const helper = new DigitalAccountantHelper(organizationId)
    return await helper.processNaturalLanguageEntry(
      `Bought ${description} from ${vendor} for ${amount}`,
      { businessType: 'salon', autoPost: true }
    )
  }
}

// Export types for external use
export type { UniversalFinanceEvent, JournalEntryHeader, JournalEntryLine }
