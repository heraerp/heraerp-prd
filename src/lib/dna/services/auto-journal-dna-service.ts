// ================================================================================
// HERA AUTO-JOURNAL DNA SERVICE
// Universal auto-journal service that works with any business type
// Integrates with HERA DNA system for configuration-driven behavior
// Smart Code: HERA.FIN.AUTO.JOURNAL.DNA.SERVICE.v1
// ================================================================================

import { supabase } from '@/src/lib/supabase'
import {
  processTransactionForJournal,
  runBatchProcessing,
  checkJournalRelevance,
  generateJournalEntry
} from '@/src/lib/auto-journal-engine'

// ================================================================================
// INTERFACES
// ================================================================================

export interface AutoJournalConfig {
  thresholds: {
    immediate_processing: number
    batch_small_transactions: number
    batch_minimum_count: number
    batch_summary_threshold: number
  }
  journal_rules: JournalRule[]
  batch_strategies: string[]
  tax_handling?: TaxConfig
  multi_currency?: MultiCurrencyConfig
  compliance?: ComplianceConfig
  costing?: CostingConfig
  revenue_recognition?: RevenueRecognitionConfig
}

export interface JournalRule {
  transaction_type: string
  smart_code_pattern: string
  debit_accounts: string[]
  credit_accounts: string[]
  split_tax?: boolean
  inventory_impact?: boolean
  insurance_split?: boolean
  track_lot_numbers?: boolean
  wip_tracking?: boolean
  variance_analysis?: boolean
  wip_recognition?: boolean
  client_billable?: boolean
}

export interface TaxConfig {
  default_rate: number
  tax_accounts: {
    sales_tax: string
    input_tax: string
  }
}

export interface MultiCurrencyConfig {
  enabled: boolean
  gain_loss_account: string
}

export interface ComplianceConfig {
  hipaa_compliant?: boolean
  audit_retention_years?: number
}

export interface CostingConfig {
  method: 'standard_costing' | 'actual_costing' | 'average_costing'
  variance_accounts: {
    material_variance: string
    labor_variance: string
    overhead_variance: string
  }
}

export interface RevenueRecognitionConfig {
  method: 'point_in_time' | 'percentage_of_completion' | 'completed_contract'
  wip_account: string
  deferred_revenue: string
}

export interface BatchingStrategy {
  name: string
  description: string
  grouping_field: string
  applicable_to: string[]
}

// ================================================================================
// AUTO-JOURNAL DNA SERVICE CLASS
// ================================================================================

export class AutoJournalDNAService {
  private organizationId: string
  private industryType: string
  private config: AutoJournalConfig | null = null
  private batchingStrategies: BatchingStrategy[] = []
  private aiPatterns: any = null

  constructor(organizationId: string, industryType: string = 'universal') {
    this.organizationId = organizationId
    this.industryType = industryType
  }

  /**
   * Initialize the service by loading configuration from DNA system
   */
  async initialize(): Promise<void> {
    // Load configuration from DNA system
    this.config = await this.loadAutoJournalConfig()

    // Load batching strategies
    this.batchingStrategies = await this.loadBatchingStrategies()

    // Load AI patterns
    this.aiPatterns = await this.loadAIPatterns()

    console.log(`🤖 Auto-Journal DNA Service initialized for ${this.industryType} industry`)
  }

  /**
   * Load auto-journal configuration from DNA system
   */
  private async loadAutoJournalConfig(): Promise<AutoJournalConfig> {
    // Call the database function to get configuration
    const { data, error } = await supabase.rpc('get_auto_journal_config', {
      p_organization_id: this.organizationId,
      p_industry_type: this.industryType
    })

    if (error) {
      console.error('Failed to load auto-journal config:', error)
      // Return default configuration
      return this.getDefaultConfig()
    }

    return data as AutoJournalConfig
  }

  /**
   * Load batching strategies from DNA system
   */
  private async loadBatchingStrategies(): Promise<BatchingStrategy[]> {
    const { data } = await supabase
      .from('core_dynamic_data')
      .select('field_value_json')
      .eq('smart_code', 'HERA.DNA.AUTO.JOURNAL.BATCH.STRATEGIES.v1')
      .single()

    if (data?.field_value_json?.strategies) {
      return data.field_value_json.strategies
    }

    return []
  }

  /**
   * Load AI classification patterns from DNA system
   */
  private async loadAIPatterns(): Promise<any> {
    const { data } = await supabase
      .from('core_dynamic_data')
      .select('field_value_json')
      .eq('smart_code', 'HERA.DNA.AUTO.JOURNAL.AI.PATTERNS.v1')
      .single()

    return data?.field_value_json || {}
  }

  /**
   * Process a transaction for auto-journal creation
   */
  async processTransaction(transactionId: string): Promise<{
    success: boolean
    journal_created: boolean
    journal_id?: string
    processing_mode: 'immediate' | 'batched' | 'skipped'
    message: string
  }> {
    if (!this.config) {
      await this.initialize()
    }

    try {
      // Load transaction details
      const transaction = await this.loadTransaction(transactionId)

      if (!transaction) {
        return {
          success: false,
          journal_created: false,
          processing_mode: 'skipped',
          message: 'Transaction not found'
        }
      }

      // Check if transaction amount exceeds immediate processing threshold
      const processingMode = this.determineProcessingMode(transaction)

      if (processingMode === 'immediate') {
        // Process immediately
        const result = await processTransactionForJournal(transactionId, this.organizationId)

        return {
          success: true,
          journal_created: result.journal_created,
          journal_id: result.journal_id,
          processing_mode: 'immediate',
          message: `Journal entry created immediately for transaction ${transaction.transaction_code}`
        }
      } else {
        // Mark for batch processing
        await this.markForBatchProcessing(transactionId)

        return {
          success: true,
          journal_created: false,
          processing_mode: 'batched',
          message: `Transaction ${transaction.transaction_code} queued for batch processing`
        }
      }
    } catch (error: any) {
      console.error('Error processing transaction:', error)
      return {
        success: false,
        journal_created: false,
        processing_mode: 'skipped',
        message: error.message
      }
    }
  }

  /**
   * Run batch processing for the organization
   */
  async runBatchProcessing(): Promise<{
    success: boolean
    batched_count: number
    journals_created: number
    message: string
  }> {
    if (!this.config) {
      await this.initialize()
    }

    try {
      const result = await runBatchProcessing(this.organizationId)

      // Apply industry-specific batching strategies
      const enhancedResult = await this.applyBatchingStrategies(result)

      return {
        success: true,
        batched_count: enhancedResult.batched,
        journals_created: enhancedResult.journals_created,
        message: `Batch processing completed: ${enhancedResult.batched} transactions processed, ${enhancedResult.journals_created} journals created`
      }
    } catch (error: any) {
      console.error('Error in batch processing:', error)
      return {
        success: false,
        batched_count: 0,
        journals_created: 0,
        message: error.message
      }
    }
  }

  /**
   * Get auto-journal statistics
   */
  async getStatistics(days: number = 7): Promise<{
    automation_rate: number
    total_transactions: number
    journals_created: number
    immediate_journals: number
    batch_journals: number
    processing_time_saved: number
    cost_savings: number
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Get all transactions
    const { data: transactions } = await supabase
      .from('universal_transactions')
      .select('id')
      .eq('organization_id', this.organizationId)
      .gte('transaction_date', startDate)
      .neq('transaction_type', 'journal_entry')

    // Get auto-generated journals
    const { data: journals } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('transaction_type', 'journal_entry')
      .eq('metadata->auto_generated', true)
      .gte('transaction_date', startDate)

    const totalTransactions = transactions?.length || 0
    const journalsCreated = journals?.length || 0
    const batchJournals = journals?.filter(j => (j.metadata as any)?.batch_journal)?.length || 0
    const immediateJournals = journalsCreated - batchJournals

    // Calculate metrics
    const automationRate = totalTransactions > 0 ? (journalsCreated / totalTransactions) * 100 : 0
    const avgTimePerManualEntry = 5 // minutes
    const processingTimeSaved = journalsCreated * avgTimePerManualEntry
    const hourlyRate = 40 // $40/hour for bookkeeper
    const costSavings = (processingTimeSaved / 60) * hourlyRate

    return {
      automation_rate: Number(automationRate.toFixed(1)),
      total_transactions: totalTransactions,
      journals_created: journalsCreated,
      immediate_journals: immediateJournals,
      batch_journals: batchJournals,
      processing_time_saved: processingTimeSaved,
      cost_savings: Number(costSavings.toFixed(2))
    }
  }

  /**
   * Configure auto-journal settings for the organization
   */
  async updateConfiguration(updates: Partial<AutoJournalConfig>): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Store organization-specific configuration overrides
      await supabase.from('core_dynamic_data').upsert({
        organization_id: this.organizationId,
        entity_id: this.organizationId,
        field_name: 'auto_journal_config_override',
        field_type: 'json',
        field_value_json: updates,
        smart_code: `HERA.FIN.AUTO.JOURNAL.CONFIG.${this.organizationId}.v1`
      })

      // Reload configuration
      await this.initialize()

      return {
        success: true,
        message: 'Auto-journal configuration updated successfully'
      }
    } catch (error: any) {
      console.error('Error updating configuration:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  // ================================================================================
  // PRIVATE HELPER METHODS
  // ================================================================================

  private async loadTransaction(transactionId: string): Promise<any> {
    const { data } = await supabase
      .from('universal_transactions')
      .select(
        `
        *,
        lines:universal_transaction_lines(*)
      `
      )
      .eq('id', transactionId)
      .single()

    return data
  }

  private determineProcessingMode(transaction: any): 'immediate' | 'batched' {
    if (!this.config) return 'immediate'

    const { thresholds } = this.config
    const amount = transaction.total_amount

    // Check transaction type for critical transactions
    if (
      transaction.transaction_type.includes('payment') ||
      transaction.transaction_type.includes('receipt') ||
      transaction.smart_code.includes('.CRITICAL.')
    ) {
      return 'immediate'
    }

    // Check amount threshold
    if (amount >= thresholds.immediate_processing) {
      return 'immediate'
    }

    // Small transactions go to batch
    if (amount <= thresholds.batch_small_transactions) {
      return 'batched'
    }

    // Default to immediate for safety
    return 'immediate'
  }

  private async markForBatchProcessing(transactionId: string): Promise<void> {
    await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          batch_pending: true,
          batch_marked_at: new Date().toISOString()
        }
      })
      .eq('id', transactionId)
  }

  private async applyBatchingStrategies(result: any): Promise<any> {
    // Apply industry-specific batching strategies
    const applicableStrategies = this.batchingStrategies.filter(
      strategy =>
        strategy.applicable_to.includes(this.industryType) || strategy.applicable_to.includes('all')
    )

    // Enhancement based on strategies would go here
    // For now, return the original result
    return result
  }

  private getDefaultConfig(): AutoJournalConfig {
    return {
      thresholds: {
        immediate_processing: 1000,
        batch_small_transactions: 100,
        batch_minimum_count: 5,
        batch_summary_threshold: 500
      },
      journal_rules: [
        {
          transaction_type: 'sale',
          smart_code_pattern: '.SAL.',
          debit_accounts: ['1200'],
          credit_accounts: ['4000']
        },
        {
          transaction_type: 'purchase',
          smart_code_pattern: '.PUR.',
          debit_accounts: ['1300'],
          credit_accounts: ['2000']
        }
      ],
      batch_strategies: ['by_transaction_type', 'by_date']
    }
  }
}

// ================================================================================
// FACTORY FUNCTION
// ================================================================================

/**
 * Create an auto-journal service instance for an organization
 */
export async function createAutoJournalService(
  organizationId: string,
  industryType?: string
): Promise<AutoJournalDNAService> {
  // Determine industry type if not provided
  if (!industryType) {
    const { data: org } = await supabase
      .from('core_organizations')
      .select('industry_classification')
      .eq('id', organizationId)
      .single()

    industryType = org?.industry_classification || 'universal'
  }

  const service = new AutoJournalDNAService(organizationId, industryType)
  await service.initialize()

  return service
}

// ================================================================================
// UNIVERSAL API INTEGRATION
// ================================================================================

/**
 * Extension to universal API for auto-journal functionality
 */
export const autoJournalExtensions = {
  /**
   * Process transaction with auto-journal
   */
  async createTransactionWithAutoJournal(transactionData: any, organizationId: string) {
    // Create the transaction first
    const { data: transaction, error } = await supabase
      .from('universal_transactions')
      .insert(transactionData)
      .select()
      .single()

    if (error || !transaction) {
      throw new Error(`Failed to create transaction: ${error?.message}`)
    }

    // Process for auto-journal
    const service = await createAutoJournalService(organizationId)
    const journalResult = await service.processTransaction(transaction.id)

    return {
      transaction,
      journal_result: journalResult
    }
  },

  /**
   * Get auto-journal configuration
   */
  async getAutoJournalConfig(organizationId: string) {
    const service = await createAutoJournalService(organizationId)
    return service['config'] // Access private property for API
  },

  /**
   * Get auto-journal statistics
   */
  async getAutoJournalStatistics(organizationId: string, days: number = 7) {
    const service = await createAutoJournalService(organizationId)
    return service.getStatistics(days)
  }
}
