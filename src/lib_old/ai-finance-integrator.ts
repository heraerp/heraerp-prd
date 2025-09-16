/**
 * HERA AI-Powered Finance Integrator
 * Modern TypeScript integration layer for automatic journal posting
 */

import { supabase } from '@/lib/supabase/client'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BusinessTransactionEvent {
  id?: string
  organization_id: string
  transaction_type: string
  smart_code: string
  reference_number: string
  total_amount: number
  transaction_metadata?: Record<string, any>
  source_module: string
  source_document_id?: string
}

export interface AIGLMapping {
  journal_entries: JournalEntry[]
  balance_check: number
  posting_rules: {
    auto_post: boolean
    requires_approval: boolean
    source_document: string
  }
}

export interface JournalEntry {
  account_code: string
  account_name: string
  debit_amount: number
  credit_amount: number
  description: string
}

export interface AIClassificationResult {
  gl_mapping: AIGLMapping
  confidence: number
}

export interface AIPostingMetrics {
  period_days: number
  total_transactions: number
  auto_posted_count: number
  pending_review_count: number
  manual_required_count: number
  auto_posting_rate: number
  average_confidence_score: number
  ai_effectiveness: number
}

export interface SmartCodePerformance {
  smart_code: string
  transaction_count: number
  auto_posted_count: number
  auto_posting_rate: number
  avg_confidence: number
  most_common_accounts: Array<{
    account_code: string
    account_name: string
  }>
}

// ============================================================================
// AI FINANCE INTEGRATOR CLASS
// ============================================================================

export class AIFinanceIntegrator {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  // ========================================================================
  // BUSINESS MODULE INTEGRATIONS
  // ========================================================================

  /**
   * Procurement: Process Goods Receipt
   */
  async processGoodsReceipt(goodsReceiptData: {
    grNumber: string
    poNumber: string
    vendorId: string
    totalValue: number
    items: Array<{
      itemId: string
      quantity: number
      unitCost: number
      itemType?: string
    }>
  }): Promise<string> {
    const transactionData: BusinessTransactionEvent = {
      organization_id: this.organizationId,
      transaction_type: 'goods_receipt',
      smart_code: 'HERA.PROC.GR.AUTO.v1',
      reference_number: goodsReceiptData.grNumber,
      total_amount: goodsReceiptData.totalValue,
      source_module: 'procurement',
      transaction_metadata: {
        po_number: goodsReceiptData.poNumber,
        vendor_id: goodsReceiptData.vendorId,
        line_items: goodsReceiptData.items,
        item_type: goodsReceiptData.items[0]?.itemType || 'materials'
      }
    }

    return this.createUniversalTransaction(transactionData)
  }

  /**
   * Sales: Process Sales Invoice
   */
  async processSalesInvoice(invoiceData: {
    invoiceNumber: string
    customerId: string
    netAmount: number
    taxAmount?: number
    paymentTerms?: string
    items: Array<{
      itemId: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }>
  }): Promise<string> {
    const totalAmount = invoiceData.netAmount + (invoiceData.taxAmount || 0)

    const transactionData: BusinessTransactionEvent = {
      organization_id: this.organizationId,
      transaction_type: 'sales_invoice',
      smart_code: 'HERA.SALES.INV.AUTO.v1',
      reference_number: invoiceData.invoiceNumber,
      total_amount: totalAmount,
      source_module: 'sales',
      transaction_metadata: {
        customer_id: invoiceData.customerId,
        net_amount: invoiceData.netAmount,
        tax_amount: invoiceData.taxAmount || 0,
        payment_terms: invoiceData.paymentTerms || 'NET30',
        line_items: invoiceData.items
      }
    }

    return this.createUniversalTransaction(transactionData)
  }

  /**
   * HR: Process Payroll Run
   */
  async processPayrollRun(payrollData: {
    payPeriod: string
    employeeCount: number
    grossPayroll: number
    taxWithholdings: {
      federal: number
      state: number
      fica: number
    }
    benefitDeductions: {
      health: number
      retirement: number
    }
  }): Promise<string> {
    const transactionData: BusinessTransactionEvent = {
      organization_id: this.organizationId,
      transaction_type: 'payroll_run',
      smart_code: 'HERA.HR.PAYROLL.AUTO.v1',
      reference_number: `PAYROLL-${payrollData.payPeriod}`,
      total_amount: payrollData.grossPayroll,
      source_module: 'hr',
      transaction_metadata: {
        pay_period: payrollData.payPeriod,
        employee_count: payrollData.employeeCount,
        gross_payroll: payrollData.grossPayroll,
        tax_withholdings: payrollData.taxWithholdings,
        benefit_deductions: payrollData.benefitDeductions
      }
    }

    return this.createUniversalTransaction(transactionData)
  }

  /**
   * Inventory: Process Inventory Adjustment
   */
  async processInventoryAdjustment(adjustmentData: {
    adjustmentNumber: string
    adjustmentType: 'shrinkage' | 'damage' | 'obsolescence' | 'recount'
    reason: string
    items: Array<{
      itemId: string
      quantityChange: number
      unitCost: number
      valueChange: number
    }>
  }): Promise<string> {
    const totalValueChange = adjustmentData.items.reduce((sum, item) => sum + item.valueChange, 0)

    const transactionData: BusinessTransactionEvent = {
      organization_id: this.organizationId,
      transaction_type: 'inventory_adjustment',
      smart_code: 'HERA.INV.ADJ.AUTO.v1',
      reference_number: adjustmentData.adjustmentNumber,
      total_amount: Math.abs(totalValueChange),
      source_module: 'inventory',
      transaction_metadata: {
        adjustment_type: adjustmentData.adjustmentType,
        reason: adjustmentData.reason,
        total_value_change: totalValueChange,
        line_items: adjustmentData.items
      }
    }

    return this.createUniversalTransaction(transactionData)
  }

  /**
   * CRM: Process Payment Receipt
   */
  async processPaymentReceipt(paymentData: {
    paymentNumber: string
    customerId: string
    paymentAmount: number
    paymentMethod: 'cash' | 'check' | 'credit_card' | 'wire_transfer'
    invoiceNumbers?: string[]
  }): Promise<string> {
    const transactionData: BusinessTransactionEvent = {
      organization_id: this.organizationId,
      transaction_type: 'payment_receipt',
      smart_code: 'HERA.CRM.PAYMENT.AUTO.v1',
      reference_number: paymentData.paymentNumber,
      total_amount: paymentData.paymentAmount,
      source_module: 'crm',
      transaction_metadata: {
        customer_id: paymentData.customerId,
        payment_method: paymentData.paymentMethod,
        invoice_numbers: paymentData.invoiceNumbers || []
      }
    }

    return this.createUniversalTransaction(transactionData)
  }

  // ========================================================================
  // CORE TRANSACTION PROCESSING
  // ========================================================================

  /**
   * Create Universal Transaction with AI Auto-Posting
   */
  private async createUniversalTransaction(
    transactionData: BusinessTransactionEvent
  ): Promise<string> {
    try {
      // Insert transaction - AI trigger will automatically process it
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert([
          {
            organization_id: transactionData.organization_id,
            transaction_type: transactionData.transaction_type,
            smart_code: transactionData.smart_code,
            reference_number: transactionData.reference_number,
            total_amount: transactionData.total_amount,
            transaction_metadata: transactionData.transaction_metadata,
            source_module: transactionData.source_module,
            source_document_id: transactionData.source_document_id,
            transaction_date: new Date().toISOString(),
            status: 'active'
          }
        ])
        .select('id')
        .single()

      if (error) {
        throw new Error(`Failed to create transaction: ${error.message}`)
      }

      return data.id
    } catch (error) {
      console.error('AI Finance Integration Error:', error)
      throw error
    }
  }

  // ========================================================================
  // AI CLASSIFICATION AND MANUAL PROCESSING
  // ========================================================================

  /**
   * Get AI Classification for a Transaction
   */
  async classifyTransaction(
    smartCode: string,
    transactionMetadata: Record<string, any>
  ): Promise<AIClassificationResult | null> {
    try {
      const { data, error } = await supabase.rpc('ai_classify_transaction', {
        p_smart_code: smartCode,
        p_transaction_data: transactionMetadata,
        p_organization_id: this.organizationId
      })

      if (error) {
        console.error('AI Classification Error:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('AI Classification Error:', error)
      return null
    }
  }

  /**
   * Manual Journal Entry Creation
   */
  async createManualJournalEntry(
    transactionId: string,
    journalEntries: JournalEntry[]
  ): Promise<boolean> {
    try {
      // Validate balanced entry
      const totalDebits = journalEntries.reduce((sum, entry) => sum + entry.debit_amount, 0)
      const totalCredits = journalEntries.reduce((sum, entry) => sum + entry.credit_amount, 0)

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`Unbalanced journal entry: Debits ${totalDebits}, Credits ${totalCredits}`)
      }

      // Insert journal entry lines
      const journalLines = journalEntries.map((entry, index) => ({
        organization_id: this.organizationId,
        transaction_id: transactionId,
        line_number: (index + 1) * 10,
        account_code: entry.account_code,
        account_name: entry.account_name,
        debit_amount: entry.debit_amount,
        credit_amount: entry.credit_amount,
        description: entry.description,
        line_type: 'manual',
        ai_generated: false
      }))

      const { error } = await supabase.from('universal_transaction_lines').insert(journalLines)

      if (error) {
        throw new Error(`Failed to create journal entries: ${error.message}`)
      }

      // Update transaction status
      await supabase
        .from('universal_transactions')
        .update({
          posting_status: 'manually_posted',
          gl_posted_at: new Date().toISOString(),
          total_debit_amount: totalDebits,
          total_credit_amount: totalCredits
        })
        .eq('id', transactionId)

      return true
    } catch (error) {
      console.error('Manual Journal Entry Error:', error)
      throw error
    }
  }

  /**
   * Provide Feedback on AI Posting
   */
  async provideFeedback(
    transactionId: string,
    feedbackType: 'approved' | 'corrected' | 'rejected',
    userCorrection?: AIGLMapping
  ): Promise<void> {
    try {
      await supabase.from('ai_posting_feedback').insert([
        {
          transaction_id: transactionId,
          feedback_type: feedbackType,
          user_correction: userCorrection,
          created_at: new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error('Feedback Error:', error)
    }
  }

  // ========================================================================
  // ANALYTICS AND REPORTING
  // ========================================================================

  /**
   * Get AI Posting Performance Metrics
   */
  async getPostingMetrics(daysBack: number = 30): Promise<AIPostingMetrics | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_posting_metrics', {
        p_organization_id: this.organizationId,
        p_days_back: daysBack
      })

      if (error) {
        console.error('Metrics Error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Metrics Error:', error)
      return null
    }
  }

  /**
   * Get Smart Code Performance Analysis
   */
  async getSmartCodePerformance(daysBack: number = 30): Promise<SmartCodePerformance[]> {
    try {
      const { data, error } = await supabase.rpc('get_smart_code_performance', {
        p_organization_id: this.organizationId,
        p_days_back: daysBack
      })

      if (error) {
        console.error('Smart Code Performance Error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Smart Code Performance Error:', error)
      return []
    }
  }

  /**
   * Get Pending Review Transactions
   */
  async getPendingReviewTransactions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('universal_transactions')
        .select(
          `
          id,
          transaction_type,
          smart_code,
          reference_number,
          total_amount,
          ai_confidence_score,
          ai_suggested_mapping,
          created_at
        `
        )
        .eq('organization_id', this.organizationId)
        .eq('posting_status', 'pending_review')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Pending Review Error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Pending Review Error:', error)
      return []
    }
  }

  // ========================================================================
  // SETUP AND CONFIGURATION
  // ========================================================================

  /**
   * Setup AI Finance Integration for Organization
   */
  static async setupOrganization(organizationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('setup_ai_finance_integration', {
        p_organization_id: organizationId
      })

      if (error) {
        console.error('Setup Error:', error)
        return false
      }

      return data?.status === 'success'
    } catch (error) {
      console.error('Setup Error:', error)
      return false
    }
  }

  /**
   * Test AI Classification (Development)
   */
  async testAIClassification(
    testCases: Array<{
      smart_code: string
      transaction_data: Record<string, any>
      expected_accounts?: string[]
    }>
  ): Promise<
    Array<{
      smart_code: string
      classification: AIClassificationResult | null
      test_passed: boolean
    }>
  > {
    const results = []

    for (const testCase of testCases) {
      const classification = await this.classifyTransaction(
        testCase.smart_code,
        testCase.transaction_data
      )

      const testPassed = classification ? classification.confidence > 0.7 : false

      results.push({
        smart_code: testCase.smart_code,
        classification,
        test_passed: testPassed
      })
    }

    return results
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format Currency for Display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Calculate Posting Accuracy Percentage
 */
export function calculatePostingAccuracy(metrics: AIPostingMetrics): number {
  if (metrics.total_transactions === 0) return 0
  return Math.round((metrics.auto_posted_count / metrics.total_transactions) * 100)
}

/**
 * Get Confidence Level Description
 */
export function getConfidenceDescription(confidence: number): string {
  if (confidence >= 0.9) return 'Very High'
  if (confidence >= 0.8) return 'High'
  if (confidence >= 0.7) return 'Medium'
  if (confidence >= 0.6) return 'Low'
  return 'Very Low'
}

/**
 * Validate Journal Entry Balance
 */
export function validateJournalBalance(entries: JournalEntry[]): {
  isBalanced: boolean
  totalDebits: number
  totalCredits: number
  difference: number
} {
  const totalDebits = entries.reduce((sum, entry) => sum + entry.debit_amount, 0)
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credit_amount, 0)
  const difference = Math.abs(totalDebits - totalCredits)

  return {
    isBalanced: difference < 0.01,
    totalDebits,
    totalCredits,
    difference
  }
}

// ============================================================================
// EXPORT DEFAULT FACTORY
// ============================================================================

/**
 * Create AI Finance Integrator Instance
 */
export function createAIFinanceIntegrator(organizationId: string): AIFinanceIntegrator {
  return new AIFinanceIntegrator(organizationId)
}

export default AIFinanceIntegrator
