/**
 * HERA Auto-Posting Engine (APE)
 * 
 * Processes Universal Finance Events (UFE) and generates balanced GL entries
 * Uses policy-as-data posting rules stored in core_dynamic_data
 * 
 * Flow: UFE → Rules Lookup → Line Generation → GL Validation → UT + UTL Creation
 */

import { z } from 'zod'
import { UniversalFinanceEvent, UniversalFinanceEventSchema, UFEProcessingResult, FiscalPeriod } from '@/types/universal-finance-event'
import { heraCode } from '@/lib/smart-codes'

export interface PostingLine {
  account_code: string
  account_name?: string
  debit_amount?: number
  credit_amount?: number
  description: string
  smart_code: string
  line_number: number
  entity_id?: string
  cost_center?: string
  department?: string
}

export interface BalancedJournalEntry {
  transaction_id: string
  organization_id: string
  posting_period: string
  total_debits: number
  total_credits: number
  currency_code: string
  exchange_rate: number
  lines: PostingLine[]
  is_balanced: boolean
  source_ufe: UniversalFinanceEvent
}

/**
 * Auto-Posting Engine Service
 * Core business logic for UFE → GL processing
 */
export class AutoPostingEngine {
  private organizationId: string
  
  constructor(organizationId: string) {
    this.organizationId = organizationId
  }
  
  /**
   * Process UFE and generate balanced journal entry
   */
  async processUFE(ufe: UniversalFinanceEvent): Promise<UFEProcessingResult> {
    try {
      console.log(`[APE] Processing UFE: ${ufe.smart_code}`)
      
      // 1. Validate UFE structure
      const validationResult = await this.validateUFE(ufe)
      if (!validationResult.isValid) {
        return {
          success: false,
          validation_errors: validationResult.errors,
          message: 'UFE validation failed'
        }
      }
      
      // 2. Check fiscal period
      const fiscalValidation = await this.validateFiscalPeriod(ufe.transaction_date)
      if (!fiscalValidation.isValid) {
        return {
          success: false,
          posting_errors: [fiscalValidation.error || 'Fiscal period validation failed'],
          message: 'Cannot post to closed period'
        }
      }
      
      // 3. Load posting rules for this smart code
      const postingRules = await this.loadPostingRules(ufe.smart_code)
      if (!postingRules) {
        return {
          success: false,
          posting_errors: [`No posting rules found for smart code: ${ufe.smart_code}`],
          message: 'Missing posting configuration'
        }
      }
      
      // 4. Generate GL lines based on rules
      const glLines = await this.generateGLLines(ufe, postingRules)
      if (glLines.length === 0) {
        return {
          success: false,
          posting_errors: ['No GL lines generated - check posting rules'],
          message: 'Line generation failed'
        }
      }
      
      // 5. Validate GL balancing
      const balanceValidation = this.validateGLBalance(glLines, ufe.transaction_currency_code)
      if (!balanceValidation.isBalanced) {
        return {
          success: false,
          posting_errors: [`GL entry not balanced: ${balanceValidation.error}`],
          message: 'GL balancing failed',
          gl_lines: glLines.map(l => ({
            account_code: l.account_code,
            account_name: l.account_name || '',
            debit_amount: l.debit_amount,
            credit_amount: l.credit_amount,
            description: l.description
          }))
        }
      }
      
      // 6. Create Universal Transaction + Lines
      const journalResult = await this.createJournalEntry(ufe, glLines, fiscalValidation.period!)
      if (!journalResult.success) {
        return {
          success: false,
          posting_errors: [journalResult.error || 'Journal creation failed'],
          message: 'Failed to create journal entry'
        }
      }
      
      console.log(`[APE] ✅ Successfully processed UFE: ${journalResult.transaction_id}`)
      
      return {
        success: true,
        transaction_id: journalResult.transaction_id,
        journal_entry_id: journalResult.journal_entry_id,
        posting_period: fiscalValidation.period!.period_code,
        gl_lines: glLines.map(l => ({
          account_code: l.account_code,
          account_name: l.account_name || '',
          debit_amount: l.debit_amount,
          credit_amount: l.credit_amount,
          description: l.description
        })),
        message: 'Journal entry created successfully'
      }
      
    } catch (error) {
      console.error('[APE] Error processing UFE:', error)
      return {
        success: false,
        posting_errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Internal processing error'
      }
    }
  }
  
  /**
   * Validate UFE structure and business rules
   */
  private async validateUFE(ufe: UniversalFinanceEvent): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []
    
    try {
      // Schema validation
      UniversalFinanceEventSchema.parse(ufe)
      
      // Business validation
      if (ufe.organization_id !== this.organizationId) {
        errors.push('Organization ID mismatch')
      }
      
      if (ufe.lines.length > 0) {
        errors.push('Lines array must be empty - APE generates lines from rules')
      }
      
      if (ufe.total_amount <= 0) {
        errors.push('Total amount must be positive')
      }
      
      // Currency validation
      if (ufe.exchange_rate <= 0) {
        errors.push('Exchange rate must be positive')
      }
      
      return {
        isValid: errors.length === 0,
        errors
      }
      
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        errors.push(...zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`))
      } else {
        errors.push('Schema validation failed')
      }
      
      return {
        isValid: false,
        errors
      }
    }
  }
  
  /**
   * Validate fiscal period and check if posting is allowed
   */
  private async validateFiscalPeriod(transactionDate: string): Promise<{ 
    isValid: boolean; 
    error?: string; 
    period?: FiscalPeriod 
  }> {
    try {
      // For now, implement basic validation
      // In full implementation, this would query fiscal calendar
      const currentDate = new Date()
      const txnDate = new Date(transactionDate)
      
      // Don't allow future dates beyond current month
      if (txnDate > new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)) {
        return {
          isValid: false,
          error: 'Cannot post to future periods'
        }
      }
      
      // Don't allow dates older than 2 years
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(currentDate.getFullYear() - 2)
      if (txnDate < twoYearsAgo) {
        return {
          isValid: false,
          error: 'Cannot post to periods older than 2 years'
        }
      }
      
      // Generate period code (YYYY-MM format)
      const year = txnDate.getFullYear()
      const month = String(txnDate.getMonth() + 1).padStart(2, '0')
      const periodCode = `${year}-${month}`
      
      const period: FiscalPeriod = {
        period_code: periodCode,
        period_name: `${year} Month ${month}`,
        start_date: `${year}-${month}-01`,
        end_date: new Date(year, txnDate.getMonth() + 1, 0).toISOString().split('T')[0],
        status: 'open',
        fiscal_year: year.toString()
      }
      
      return {
        isValid: true,
        period
      }
      
    } catch (error) {
      return {
        isValid: false,
        error: 'Fiscal period validation error'
      }
    }
  }
  
  /**
   * Load posting rules for smart code from core_dynamic_data
   */
  private async loadPostingRules(smartCode: string): Promise<any> {
    try {
      const { apiV2 } = await import('@/lib/client/fetchV2')
      
      // Find finance config entity for this organization
      const { data: configEntities } = await apiV2.get('entities', {
        organization_id: this.organizationId,
        entity_type: 'finance_config'
      })
      
      if (!configEntities?.data || configEntities.data.length === 0) {
        console.error('[APE] No finance config entity found')
        return null
      }
      
      const configEntityId = configEntities.data[0].id
      
      // Load posting rules configuration
      const { data: rulesData } = await apiV2.get('entities/dynamic-data', {
        entity_id: configEntityId,
        field_name: 'posting_rules_config'
      })
      
      if (!rulesData?.data || rulesData.data.length === 0) {
        console.error('[APE] No posting rules configuration found')
        return null
      }
      
      const rulesConfig = rulesData.data[0].field_value_json
      
      // Find matching rule for smart code
      const matchingRule = rulesConfig.posting_rules.find((rule: any) => 
        rule.smart_code === smartCode
      )
      
      if (matchingRule) {
        return {
          rule: matchingRule,
          vat_config: rulesConfig.vat_config,
          account_mapping: rulesConfig.account_mapping
        }
      }
      
      console.error(`[APE] No posting rule found for smart code: ${smartCode}`)
      return null
      
    } catch (error) {
      console.error('[APE] Error loading posting rules:', error)
      return null
    }
  }
  
  /**
   * Generate GL lines based on posting rules and UFE data
   */
  private async generateGLLines(ufe: UniversalFinanceEvent, postingRules: any): Promise<PostingLine[]> {
    const lines: PostingLine[] = []
    const rule = postingRules.rule
    const vatConfig = postingRules.vat_config
    const accountMapping = postingRules.account_mapping
    
    try {
      // Handle POS Daily Summary (complex multi-line posting)
      if (ufe.smart_code.includes('POS.DAILY_SUMMARY')) {
        return this.generatePOSLines(ufe, rule, vatConfig, accountMapping)
      }
      
      // Handle simple expense postings
      if (ufe.smart_code.includes('EXPENSE')) {
        return this.generateExpenseLines(ufe, rule, vatConfig, accountMapping)
      }
      
      // Handle revenue postings
      if (ufe.smart_code.includes('REVENUE')) {
        return this.generateRevenueLines(ufe, rule, vatConfig, accountMapping)
      }
      
      // Handle bank fees
      if (ufe.smart_code.includes('BANK.FEE')) {
        return this.generateBankFeeLines(ufe, rule, accountMapping)
      }
      
      // Generic posting (debit/credit based on rule)
      return this.generateGenericLines(ufe, rule, accountMapping)
      
    } catch (error) {
      console.error('[APE] Error generating GL lines:', error)
      return []
    }
  }
  
  /**
   * Generate POS daily summary lines with VAT, tips, fees breakdown
   */
  private generatePOSLines(ufe: UniversalFinanceEvent, rule: any, vatConfig: any, accountMapping: any): PostingLine[] {
    const lines: PostingLine[] = []
    const totals = ufe.totals
    
    if (!totals) {
      throw new Error('POS totals required for daily summary posting')
    }
    
    let lineNumber = 1
    
    // Cash collected → Cash account
    if (totals.cash_collected && totals.cash_collected > 0) {
      lines.push({
        account_code: accountMapping.cash,
        account_name: 'Cash on Hand',
        debit_amount: totals.cash_collected,
        description: 'Daily cash sales collection',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.CASH.V1'),
        line_number: lineNumber++
      })
    }
    
    // Card settlement → Bank account
    if (totals.card_settlement && totals.card_settlement > 0) {
      lines.push({
        account_code: accountMapping.bank,
        account_name: 'Bank Account',
        debit_amount: totals.card_settlement,
        description: 'Daily card sales settlement',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.BANK.V1'),
        line_number: lineNumber++
      })
    }
    
    // Processing fees → Expense
    if (totals.fees && totals.fees > 0) {
      lines.push({
        account_code: accountMapping.card_processing_fees,
        account_name: 'Card Processing Fees',
        debit_amount: totals.fees,
        description: 'Daily card processing fees',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.FEES.V1'),
        line_number: lineNumber++
      })
    }
    
    // Sales revenue (ex-VAT) → Credit
    const grossSales = totals.gross_sales || 0
    const vatAmount = totals.vat || 0
    const salesExVat = grossSales - vatAmount
    
    if (salesExVat > 0) {
      lines.push({
        account_code: accountMapping.service_revenue,
        account_name: 'Service Revenue',
        credit_amount: salesExVat,
        description: 'Daily service sales (ex-VAT)',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.REVENUE.V1'),
        line_number: lineNumber++
      })
    }
    
    // VAT → Credit
    if (vatAmount > 0) {
      lines.push({
        account_code: accountMapping.vat_payable,
        account_name: 'VAT Payable',
        credit_amount: vatAmount,
        description: 'Daily sales VAT',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.VAT.V1'),
        line_number: lineNumber++
      })
    }
    
    // Tips → Credit
    if (totals.tips && totals.tips > 0) {
      lines.push({
        account_code: accountMapping.tips_payable,
        account_name: 'Tips Payable',
        credit_amount: totals.tips,
        description: 'Daily tips collected',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.TIPS.V1'),
        line_number: lineNumber++
      })
    }
    
    return lines
  }
  
  /**
   * Generate expense posting lines (Dr Expense, Cr Bank/AP)
   */
  private generateExpenseLines(ufe: UniversalFinanceEvent, rule: any, vatConfig: any, accountMapping: any): PostingLine[] {
    const lines: PostingLine[] = []
    let lineNumber = 1
    
    const expenseAmount = ufe.total_amount
    const hasVAT = rule.vat_handling && rule.vat_handling.vat_rate > 0
    
    if (hasVAT) {
      // Calculate VAT component
      const vatInclusive = rule.vat_handling.vat_inclusive
      let netAmount: number
      let vatAmount: number
      
      if (vatInclusive) {
        // Total includes VAT: split out
        vatAmount = expenseAmount * (rule.vat_handling.vat_rate / (1 + rule.vat_handling.vat_rate))
        netAmount = expenseAmount - vatAmount
      } else {
        // Total excludes VAT: add VAT
        netAmount = expenseAmount
        vatAmount = expenseAmount * rule.vat_handling.vat_rate
      }
      
      // Expense (net)
      lines.push({
        account_code: rule.debit_accounts[0],
        debit_amount: netAmount,
        description: `${ufe.business_context.note || 'Expense'} (ex-VAT)`,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.EXPENSE.V1'),
        line_number: lineNumber++
      })
      
      // VAT Recoverable
      lines.push({
        account_code: rule.vat_handling.vat_account,
        account_name: 'VAT Recoverable',
        debit_amount: vatAmount,
        description: 'Input VAT',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.VAT_INPUT.V1'),
        line_number: lineNumber++
      })
      
      // Bank/Payable (total)
      lines.push({
        account_code: rule.credit_accounts[0],
        credit_amount: vatInclusive ? expenseAmount : expenseAmount + vatAmount,
        description: `Payment for ${ufe.business_context.note || 'expense'}`,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.PAYMENT.V1'),
        line_number: lineNumber++
      })
      
    } else {
      // Simple expense without VAT
      lines.push({
        account_code: rule.debit_accounts[0],
        debit_amount: expenseAmount,
        description: ufe.business_context.note || 'Expense payment',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.EXPENSE.V1'),
        line_number: lineNumber++
      })
      
      lines.push({
        account_code: rule.credit_accounts[0],
        credit_amount: expenseAmount,
        description: `Payment for ${ufe.business_context.note || 'expense'}`,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.PAYMENT.V1'),
        line_number: lineNumber++
      })
    }
    
    return lines
  }
  
  /**
   * Generate revenue posting lines (Dr Cash/Bank, Cr Revenue + VAT)
   */
  private generateRevenueLines(ufe: UniversalFinanceEvent, rule: any, vatConfig: any, accountMapping: any): PostingLine[] {
    const lines: PostingLine[] = []
    let lineNumber = 1
    
    const totalAmount = ufe.total_amount
    const hasVAT = rule.vat_handling && rule.vat_handling.vat_rate > 0
    
    if (hasVAT) {
      // Calculate VAT component
      const vatInclusive = rule.vat_handling.vat_inclusive
      let netAmount: number
      let vatAmount: number
      
      if (vatInclusive) {
        // Total includes VAT
        vatAmount = totalAmount * (rule.vat_handling.vat_rate / (1 + rule.vat_handling.vat_rate))
        netAmount = totalAmount - vatAmount
      } else {
        // Total excludes VAT
        netAmount = totalAmount
        vatAmount = totalAmount * rule.vat_handling.vat_rate
      }
      
      // Cash/Bank (total received)
      lines.push({
        account_code: rule.debit_accounts[0],
        debit_amount: vatInclusive ? totalAmount : totalAmount + vatAmount,
        description: `${ufe.business_context.note || 'Service'} payment received`,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.RECEIPT.V1'),
        line_number: lineNumber++
      })
      
      // Revenue (net)
      lines.push({
        account_code: rule.credit_accounts[0],
        credit_amount: netAmount,
        description: `${ufe.business_context.note || 'Service'} revenue (ex-VAT)`,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.REVENUE.V1'),
        line_number: lineNumber++
      })
      
      // VAT Payable
      lines.push({
        account_code: rule.vat_handling.vat_account,
        credit_amount: vatAmount,
        description: 'Output VAT',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.VAT_OUTPUT.V1'),
        line_number: lineNumber++
      })
      
    } else {
      // Simple revenue without VAT
      lines.push({
        account_code: rule.debit_accounts[0],
        debit_amount: totalAmount,
        description: `${ufe.business_context.note || 'Service'} payment received`,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.RECEIPT.V1'),
        line_number: lineNumber++
      })
      
      lines.push({
        account_code: rule.credit_accounts[0],
        credit_amount: totalAmount,
        description: `${ufe.business_context.note || 'Service'} revenue`,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.REVENUE.V1'),
        line_number: lineNumber++
      })
    }
    
    return lines
  }
  
  /**
   * Generate bank fee lines (Dr Bank Charges, Cr Bank)
   */
  private generateBankFeeLines(ufe: UniversalFinanceEvent, rule: any, accountMapping: any): PostingLine[] {
    return [
      {
        account_code: rule.debit_accounts[0],
        debit_amount: ufe.total_amount,
        description: ufe.business_context.note || 'Bank fees',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.BANK_FEE.V1'),
        line_number: 1
      },
      {
        account_code: rule.credit_accounts[0],
        credit_amount: ufe.total_amount,
        description: 'Bank fee deduction',
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.BANK_DEDUCT.V1'),
        line_number: 2
      }
    ]
  }
  
  /**
   * Generate generic lines based on rule debit/credit accounts
   */
  private generateGenericLines(ufe: UniversalFinanceEvent, rule: any, accountMapping: any): PostingLine[] {
    const lines: PostingLine[] = []
    let lineNumber = 1
    
    // Simple debit/credit based on rule
    if (rule.debit_accounts && rule.debit_accounts.length > 0) {
      lines.push({
        account_code: rule.debit_accounts[0],
        debit_amount: ufe.total_amount,
        description: ufe.business_context.note || rule.description,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.GENERIC_DR.V1'),
        line_number: lineNumber++
      })
    }
    
    if (rule.credit_accounts && rule.credit_accounts.length > 0) {
      lines.push({
        account_code: rule.credit_accounts[0],
        credit_amount: ufe.total_amount,
        description: ufe.business_context.note || rule.description,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.LINE.GENERIC_CR.V1'),
        line_number: lineNumber++
      })
    }
    
    return lines
  }
  
  /**
   * Validate GL balancing per currency
   */
  private validateGLBalance(lines: PostingLine[], currencyCode: string): { 
    isBalanced: boolean; 
    error?: string; 
    totalDebits?: number; 
    totalCredits?: number 
  } {
    const totalDebits = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
    const totalCredits = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)
    
    // Allow small rounding differences (0.01)
    const difference = Math.abs(totalDebits - totalCredits)
    const isBalanced = difference < 0.01
    
    return {
      isBalanced,
      error: isBalanced ? undefined : `Debits (${totalDebits}) != Credits (${totalCredits}), difference: ${difference}`,
      totalDebits,
      totalCredits
    }
  }
  
  /**
   * Create Universal Transaction + Transaction Lines via RPC
   */
  private async createJournalEntry(
    ufe: UniversalFinanceEvent, 
    lines: PostingLine[], 
    fiscalPeriod: FiscalPeriod
  ): Promise<{ success: boolean; transaction_id?: string; journal_entry_id?: string; error?: string }> {
    try {
      const { apiV2 } = await import('@/lib/client/fetchV2')
      
      // Create Universal Transaction header
      const { data: transaction } = await apiV2.post('transactions', {
        organization_id: this.organizationId,
        transaction_type: ufe.transaction_type,
        transaction_date: ufe.transaction_date,
        total_amount: ufe.total_amount,
        currency: ufe.transaction_currency_code,
        smart_code: heraCode('HERA.SALON.FINANCE.JE.AUTO.POSTING.V1'),
        description: `Auto-posted: ${ufe.business_context.note || ufe.smart_code}`,
        source_entity_id: ufe.source_entity_id,
        metadata: {
          ...ufe.metadata,
          posting_period: fiscalPeriod.period_code,
          base_currency: ufe.base_currency_code,
          exchange_rate: ufe.exchange_rate,
          source_ufe_smart_code: ufe.smart_code,
          auto_posted: true
        }
      })
      
      if (!transaction?.id) {
        return { success: false, error: 'Failed to create transaction header' }
      }
      
      const transactionId = transaction.id
      
      // Create Transaction Lines
      for (const line of lines) {
        const { data: transactionLine } = await apiV2.post('transaction-lines', {
          transaction_id: transactionId,
          organization_id: this.organizationId,
          line_description: line.description,
          line_order: line.line_number,
          quantity: 1,
          unit_price: line.debit_amount || line.credit_amount || 0,
          line_amount: line.debit_amount || line.credit_amount || 0,
          gl_account_code: line.account_code,
          smart_code: line.smart_code,
          metadata: {
            debit_amount: line.debit_amount || 0,
            credit_amount: line.credit_amount || 0,
            posting_side: line.debit_amount ? 'debit' : 'credit'
          }
        })
        
        if (!transactionLine?.id) {
          console.error(`[APE] Failed to create transaction line: ${line.account_code}`)
        }
      }
      
      console.log(`[APE] ✅ Created journal entry: ${transactionId}`)
      
      return {
        success: true,
        transaction_id: transactionId,
        journal_entry_id: transactionId // Same for journal entries
      }
      
    } catch (error) {
      console.error('[APE] Error creating journal entry:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Journal creation failed'
      }
    }
  }
}

/**
 * Factory function to create APE instance
 */
export function createAutoPostingEngine(organizationId: string): AutoPostingEngine {
  return new AutoPostingEngine(organizationId)
}

/**
 * Main entry point for UFE processing
 */
export async function processUniversalFinanceEvent(
  organizationId: string, 
  ufe: UniversalFinanceEvent
): Promise<UFEProcessingResult> {
  const ape = createAutoPostingEngine(organizationId)
  return await ape.processUFE(ufe)
}