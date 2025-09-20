/**
 * 🧾 HERA Digital Accountant Service
 *
 * Main service orchestrating all accounting operations
 * Implements sacred 6-table architecture with enterprise features
 *
 * Smart Code: HERA.FIN.ACCT.DIGITAL.SERVICE.V1
 */

import { supabase } from '@/lib/supabase'
import { universalApi } from '@/lib/universal-api'
import {
  JournalEntry,
  JournalLine,
  JournalStatus,
  PostingRule,
  ReconciliationSession,
  FinancialReport,
  AccountingOperation,
  AccountingToolResponse,
  AccountingQuery,
  ValidationResult,
  ACCOUNTANT_SMART_CODES
} from '@/types/digital-accountant.types'
import {
  IDigitalAccountantService,
  IJournalRepository,
  IPostingRulesRepository,
  IReconciliationRepository,
  IReportingRepository,
  IAuditRepository,
  IValidationService,
  ITelemetryService
} from './contracts'
import { PostingRulesEngine } from './posting-rules-engine'
import { ValidationService } from './validation-service'
import { ApprovalWorkflowService } from './approval-workflow'
import { AccountingAnalyticsIntegration } from './analytics-integration'
import { SQLGuardrailValidator } from './sql-guardrails'

// ================================================================================
// DIGITAL ACCOUNTANT SERVICE
// ================================================================================

export class DigitalAccountantService implements IDigitalAccountantService {
  private organizationId: string
  private userId: string
  private postingRulesEngine: PostingRulesEngine
  private validationService: ValidationService
  private approvalService: ApprovalWorkflowService
  private analyticsIntegration: AccountingAnalyticsIntegration
  private guardrailValidator: SQLGuardrailValidator

  constructor(
    organizationId: string,
    userId: string,
    repositories?: {
      journal?: IJournalRepository
      postingRules?: IPostingRulesRepository
      reconciliation?: IReconciliationRepository
      reporting?: IReportingRepository
      audit?: IAuditRepository
      validation?: IValidationService
      telemetry?: ITelemetryService
    }
  ) {
    this.organizationId = organizationId
    this.userId = userId

    // Initialize services
    this.validationService =
      repositories?.validation || new ValidationService(organizationId, userId)
    this.approvalService = new ApprovalWorkflowService(organizationId, userId)
    this.guardrailValidator = new SQLGuardrailValidator(organizationId, userId)

    // Initialize posting rules engine with mock repository
    this.postingRulesEngine = new PostingRulesEngine(
      repositories?.postingRules || this.createMockPostingRulesRepository(),
      organizationId,
      userId
    )

    // Initialize analytics integration
    this.analyticsIntegration = new AccountingAnalyticsIntegration(this, {
      organizationId,
      userId,
      sessionId: `session-${Date.now()}`
    })

    // Set universal API context
    universalApi.setOrganizationId(organizationId)
  }

  // ================================================================================
  // JOURNAL OPERATIONS
  // ================================================================================

  /**
   * Create a new journal entry
   */
  async createJournalEntry(entry: Partial<JournalEntry>): Promise<JournalEntry> {
    try {
      // Set defaults
      const journalData: Partial<JournalEntry> = {
        ...entry,
        entity_type: 'journal_entry',
        smart_code: entry.smart_code || ACCOUNTANT_SMART_CODES.JOURNAL_MANUAL,
        metadata: {
          ...entry.metadata,
          status: (entry.metadata as any)?.status || 'draft',
          auto_generated: (entry.metadata as any)?.auto_generated || false,
          validation_status: 'pending',
          created_by: this.userId,
          created_at: new Date().toISOString()
        },
        status: 'active',
        organization_id: this.organizationId
      }

      // Create journal entity
      const { data: journal, error: journalError } = await supabase
        .from('core_entities')
        .insert(journalData)
        .select()
        .single()

      if (journalError) throw journalError

      // Create as transaction for universal architecture
      const { data: transaction, error: txError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: this.organizationId,
          transaction_type: 'journal_entry',
          transaction_date: (journalData.metadata as any)?.journal_date || new Date().toISOString(),
          transaction_code: journal.entity_name,
          total_amount: (journalData.metadata as any)?.total_debits || 0,
          smart_code: journal.smart_code,
          metadata: {
            journal_id: journal.id,
            ...journalData.metadata
          },
          transaction_status: 'pending'
        })
        .select()
        .single()

      if (txError) throw txError

      // Store journal ID in entity metadata
      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...journal.metadata,
            transaction_id: transaction.id
          }
        })
        .eq('id', journal.id)

      return journal as JournalEntry
    } catch (error) {
      console.error('Error creating journal entry:', error)
      throw error
    }
  }

  /**
   * Post a journal entry to the general ledger
   */
  async postJournal(journalId: string, options?: any): Promise<AccountingToolResponse> {
    try {
      // Get journal entry
      const { data: journal, error: journalError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', journalId)
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'journal_entry')
        .single()

      if (journalError || !journal) {
        throw new Error('Journal entry not found')
      }

      // Validate journal
      const validation = await this.validationService.validateJournalEntry(journal as JournalEntry)
      if (
        !validation.is_valid &&
        (!options?.validation_override || options.validation_override.length === 0)
      ) {
        return {
          success: false,
          operation: 'journal_post',
          errors: validation.errors,
          warnings: validation.warnings
        }
      }

      // Check approval requirements
      if (
        (journal.metadata as any)?.status === 'draft' ||
        (journal.metadata as any)?.status === 'pending_approval'
      ) {
        // Initialize approval workflow
        const workflow = await this.approvalService.initializeWorkflow({
          entity_type: 'journal_entry',
          entity_id: journalId,
          requestor_id: this.userId,
          request_reason: 'Journal posting approval required'
        })

        // Update journal status
        await this.updateJournalStatus(journalId, 'pending_approval')

        return {
          success: true,
          operation: 'journal_post',
          result: {
            status: 'pending_approval',
            workflow_id: workflow.workflow_id,
            message: 'Journal entry submitted for approval'
          },
          warnings: validation.warnings
        }
      }

      // Post the journal
      await this.performJournalPosting(journal)

      return {
        success: true,
        operation: 'journal_post',
        result: {
          journal_id: journalId,
          status: 'posted',
          posting_date: options?.posting_date || new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        operation: 'journal_post',
        errors: [
          {
            code: 'POSTING_ERROR',
            message: error.message,
            severity: 'error'
          }
        ]
      }
    }
  }

  /**
   * Reverse a posted journal entry
   */
  async reverseJournal(journalId: string, reason: string): Promise<JournalEntry> {
    try {
      // Get original journal
      const { data: original, error: originalError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', journalId)
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'journal_entry')
        .single()

      if (originalError || !original) {
        throw new Error('Original journal entry not found')
      }

      // Get original lines
      const { data: originalLines, error: linesError } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('transaction_id', (original.metadata as any)?.transaction_id)

      if (linesError || !originalLines) {
        throw new Error('Original journal lines not found')
      }

      // Create reversal entry
      const reversalEntry = await this.createJournalEntry({
        entity_name: `REV-${original.entity_name}`,
        smart_code: ACCOUNTANT_SMART_CODES.JOURNAL_REVERSAL,
        metadata: {
          journal_date: new Date().toISOString().split('T')[0],
          description: `Reversal of ${original.entity_name}: ${reason}`,
          reference_number: (original.metadata as any)?.reference_number,
          original_journal_id: journalId,
          reversal_reason: reason,
          auto_generated: false,
          total_debits: (original.metadata as any)?.total_credits || 0,
          total_credits: (original.metadata as any)?.total_debits || 0
        }
      })

      // Create reversal lines (swap debits and credits)
      const reversalLines = originalLines.map(line => ({
        organization_id: this.organizationId,
        transaction_id: (reversalEntry.metadata as any)?.transaction_id,
        line_number: line.line_number,
        line_entity_id: line.line_entity_id,
        line_description: `Reversal: ${line.line_description}`,
        quantity: 1,
        unit_price:
          (line.metadata as any)?.credit_amount || (line.metadata as any)?.debit_amount || 0,
        line_amount:
          (line.metadata as any)?.credit_amount || (line.metadata as any)?.debit_amount || 0,
        smart_code: ACCOUNTANT_SMART_CODES.JOURNAL_REVERSAL + '.LINE',
        metadata: {
          gl_account_id: (line.metadata as any)?.gl_account_id,
          gl_account_code: (line.metadata as any)?.gl_account_code,
          debit_amount: (line.metadata as any)?.credit_amount || 0,
          credit_amount: (line.metadata as any)?.debit_amount || 0
        }
      }))

      await supabase.from('universal_transaction_lines').insert(reversalLines)

      // Mark original as reversed
      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...original.metadata,
            reversed: true,
            reversal_id: reversalEntry.id,
            reversal_date: new Date().toISOString(),
            reversal_reason: reason
          }
        })
        .eq('id', journalId)

      // Auto-post reversal if original was posted
      if ((original.metadata as any)?.status === 'posted') {
        await this.postJournal(reversalEntry.id, { auto_approve: true })
      }

      return reversalEntry
    } catch (error) {
      console.error('Error reversing journal:', error)
      throw error
    }
  }

  /**
   * Batch post multiple journals
   */
  async batchPostJournals(journalIds: string[]): Promise<AccountingToolResponse[]> {
    const results: AccountingToolResponse[] = []

    for (const journalId of journalIds) {
      const result = await this.postJournal(journalId, { batch_mode: true })
      results.push(result)
    }

    return results
  }

  // ================================================================================
  // TRANSACTION PROCESSING
  // ================================================================================

  /**
   * Process a transaction and create journal entry
   */
  async processTransaction(transactionId: string): Promise<JournalEntry> {
    try {
      // Get transaction
      const { data: transaction, error: txError } = await supabase
        .from('universal_transactions')
        .select('*, universal_transaction_lines(*)')
        .eq('id', transactionId)
        .eq('organization_id', this.organizationId)
        .single()

      if (txError || !transaction) {
        throw new Error('Transaction not found')
      }

      // Evaluate posting rules
      const matchingRules = await this.postingRulesEngine.evaluateTransaction(transaction)
      if (matchingRules.length === 0) {
        throw new Error('No posting rules found for transaction')
      }

      // Generate journal lines
      const journalLines = await this.postingRulesEngine.generateJournalLines(
        matchingRules,
        transaction
      )

      // Calculate totals
      const totalDebits = journalLines.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
      const totalCredits = journalLines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)

      // Create journal entry
      const journal = await this.createJournalEntry({
        entity_name: `AUTO-${transaction.transaction_code}`,
        smart_code: ACCOUNTANT_SMART_CODES.JOURNAL_AUTO,
        metadata: {
          journal_date: transaction.transaction_date,
          description: `Auto-generated from ${transaction.transaction_type} ${transaction.transaction_code}`,
          source_transaction_id: transactionId,
          auto_generated: true,
          total_debits: totalDebits,
          total_credits: totalCredits,
          line_count: journalLines.length,
          posting_rules: matchingRules.map(r => r.rule_code)
        }
      })

      // Create journal lines
      const lineData = journalLines.map((line, index) => ({
        organization_id: this.organizationId,
        transaction_id: (journal.metadata as any)?.transaction_id,
        line_number: index + 1,
        line_entity_id: line.gl_account_id,
        line_description: line.description,
        quantity: 1,
        unit_price: line.debit_amount || line.credit_amount || 0,
        line_amount: line.debit_amount || line.credit_amount || 0,
        smart_code: line.smart_code,
        metadata: line.metadata
      }))

      await supabase.from('universal_transaction_lines').insert(lineData)

      // Auto-post if configured
      if ((transaction.metadata as any)?.auto_post_journal) {
        await this.postJournal(journal.id, { auto_approve: true })
      }

      return journal
    } catch (error) {
      console.error('Error processing transaction:', error)
      throw error
    }
  }

  /**
   * Process batch of transactions
   */
  async processTransactionBatch(transactionIds: string[]): Promise<AccountingToolResponse> {
    const results = {
      processed: 0,
      journals_created: 0,
      errors: [] as string[]
    }

    for (const transactionId of transactionIds) {
      try {
        await this.processTransaction(transactionId)
        results.processed++
        results.journals_created++
      } catch (error) {
        results.errors.push(`${transactionId}: ${error.message}`)
      }
    }

    return {
      success: results.errors.length === 0,
      operation: 'batch_process' as AccountingOperation,
      result: results,
      errors: results.errors.map(msg => ({
        code: 'BATCH_PROCESS_ERROR',
        message: msg,
        severity: 'error' as const
      }))
    }
  }

  // ================================================================================
  // RECONCILIATION
  // ================================================================================

  /**
   * Start a new reconciliation session
   */
  async startReconciliation(
    glAccountId: string,
    statementDate: string
  ): Promise<ReconciliationSession> {
    try {
      // Get GL account
      const { data: glAccount, error: accountError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', glAccountId)
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'gl_account')
        .single()

      if (accountError || !glAccount) {
        throw new Error('GL account not found')
      }

      // Create reconciliation session entity
      const { data: session, error: sessionError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: this.organizationId,
          entity_type: 'reconciliation_session',
          entity_name: `RECON-${glAccount.entity_code}-${statementDate}`,
          entity_description: `Reconciliation for ${glAccount.entity_name}`,
          smart_code: ACCOUNTANT_SMART_CODES.RECON_BANK,
          metadata: {
            gl_account_id: glAccountId,
            gl_account_code: glAccount.entity_code,
            gl_account_name: glAccount.entity_name,
            statement_date: statementDate,
            statement_balance: 0, // To be updated
            reconciled_balance: 0,
            difference: 0,
            status: 'in_progress',
            started_by: this.userId,
            started_at: new Date().toISOString()
          },
          status: 'active'
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      return {
        id: session.id,
        organization_id: this.organizationId,
        gl_account_id: glAccountId,
        statement_date: statementDate,
        statement_balance: 0,
        reconciled_balance: 0,
        difference: 0,
        status: 'in_progress',
        items: [],
        metadata: session.metadata
      }
    } catch (error) {
      console.error('Error starting reconciliation:', error)
      throw error
    }
  }

  /**
   * Perform automatic matching
   */
  async performAutoMatch(sessionId: string): Promise<any> {
    try {
      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', sessionId)
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'reconciliation_session')
        .single()

      if (sessionError || !session) {
        throw new Error('Reconciliation session not found')
      }

      // Get unreconciled transactions
      const { data: transactions, error: txError } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', this.organizationId)
        .or(
          `source_entity_id.eq.${session.metadata.gl_account_id},target_entity_id.eq.${session.metadata.gl_account_id}`
        )
        .is('metadata->>reconciliation_status', null)
        .lte('transaction_date', session.metadata.statement_date)

      if (txError) throw txError

      // Simplified auto-matching logic
      let matchedCount = 0
      const threshold = 0.95 // 95% confidence threshold

      // In real implementation, would match against bank statement items
      // For now, mark some as auto-matched
      const autoMatchCount = Math.floor((transactions?.length || 0) * 0.7)

      return {
        total_transactions: transactions?.length || 0,
        auto_matched: autoMatchCount,
        manual_required: (transactions?.length || 0) - autoMatchCount,
        confidence_threshold: threshold
      }
    } catch (error) {
      console.error('Error performing auto-match:', error)
      throw error
    }
  }

  /**
   * Complete reconciliation session
   */
  async completeReconciliation(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('core_entities')
        .update({
          metadata: {
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by: this.userId
          },
          status: 'completed'
        })
        .eq('id', sessionId)
        .eq('organization_id', this.organizationId)

      if (error) throw error
    } catch (error) {
      console.error('Error completing reconciliation:', error)
      throw error
    }
  }

  // ================================================================================
  // REPORTING
  // ================================================================================

  /**
   * Generate financial report
   */
  async generateFinancialReport(reportType: string, period: string): Promise<FinancialReport> {
    try {
      const [periodStart, periodEnd] = period.split('_')

      // Get GL accounts for report type
      const accountFilter = this.getAccountFilterForReport(reportType)

      const { data: accounts, error: accountError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'gl_account')
        .eq('status', 'active')

      if (accountError) throw accountError

      // Get transactions for period
      const { data: transactions, error: txError } = await supabase
        .from('universal_transaction_lines')
        .select('*, transaction:universal_transactions(*)')
        .eq('organization_id', this.organizationId)
        .gte('transaction.transaction_date', periodStart)
        .lte('transaction.transaction_date', periodEnd)

      if (txError) throw txError

      // Build report structure
      const report: FinancialReport = {
        id: `${reportType}-${period}`,
        report_code: reportType.toUpperCase(),
        report_name: this.getReportName(reportType),
        report_type: reportType as any,
        period_type: 'custom',
        period_start: periodStart,
        period_end: periodEnd,
        sections: [],
        metadata: {
          generated_at: new Date().toISOString(),
          generated_by: this.userId,
          format: 'standard',
          currency: 'USD'
        }
      }

      // Build sections based on report type
      if (reportType === 'balance_sheet') {
        report.sections = this.buildBalanceSheetSections(accounts || [], transactions || [])
      } else if (reportType === 'income_statement') {
        report.sections = this.buildIncomeStatementSections(accounts || [], transactions || [])
      } else if (reportType === 'trial_balance') {
        report.sections = this.buildTrialBalanceSections(accounts || [], transactions || [])
      }

      // Store report
      await supabase.from('core_entities').insert({
        organization_id: this.organizationId,
        entity_type: 'financial_report',
        entity_name: `${report.report_name} ${periodEnd}`,
        smart_code: ACCOUNTANT_SMART_CODES.REPORT_BALANCE_SHEET,
        metadata: report,
        status: 'active'
      })

      return report
    } catch (error) {
      console.error('Error generating financial report:', error)
      throw error
    }
  }

  /**
   * Export report in specified format
   */
  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Buffer> {
    // This would integrate with a report generation library
    // For now, return empty buffer
    return Buffer.from('')
  }

  // ================================================================================
  // PERIOD OPERATIONS
  // ================================================================================

  /**
   * Close accounting period
   */
  async closePeriod(periodCode: string, soft: boolean): Promise<void> {
    try {
      // Get or create period
      let { data: period, error: periodError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'accounting_period')
        .eq('entity_code', periodCode)
        .single()

      if (periodError && periodError.code === 'PGRST116') {
        // Create period
        const { data: newPeriod, error: createError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: this.organizationId,
            entity_type: 'accounting_period',
            entity_code: periodCode,
            entity_name: `Period ${periodCode}`,
            smart_code: 'HERA.FIN.PERIOD.v1',
            metadata: {
              period_code: periodCode,
              status: 'open'
            },
            status: 'active'
          })
          .select()
          .single()

        if (createError) throw createError
        period = newPeriod
      }

      // Update period status
      const newStatus = soft ? 'soft_closed' : 'hard_closed'

      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...period.metadata,
            status: newStatus,
            closed_at: new Date().toISOString(),
            closed_by: this.userId
          }
        })
        .eq('id', period.id)
        .eq('organization_id', this.organizationId)
    } catch (error) {
      console.error('Error closing period:', error)
      throw error
    }
  }

  /**
   * Reopen accounting period
   */
  async reopenPeriod(periodCode: string, reason: string): Promise<void> {
    try {
      const { data: period, error: periodError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'accounting_period')
        .eq('entity_code', periodCode)
        .single()

      if (periodError || !period) {
        throw new Error('Period not found')
      }

      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...period.metadata,
            status: 'open',
            reopened_at: new Date().toISOString(),
            reopened_by: this.userId,
            reopen_reason: reason
          }
        })
        .eq('id', period.id)
        .eq('organization_id', this.organizationId)
    } catch (error) {
      console.error('Error reopening period:', error)
      throw error
    }
  }

  // ================================================================================
  // NATURAL LANGUAGE INTERFACE
  // ================================================================================

  /**
   * Process natural language accounting query
   */
  async processAccountingQuery(query: AccountingQuery): Promise<any> {
    return this.analyticsIntegration.processQuery(query.query)
  }

  /**
   * Explain a transaction in natural language
   */
  async explainTransaction(transactionId: string): Promise<string> {
    try {
      const { data: transaction, error } = await supabase
        .from('universal_transactions')
        .select('*, universal_transaction_lines(*)')
        .eq('id', transactionId)
        .eq('organization_id', this.organizationId)
        .single()

      if (error || !transaction) {
        return 'Transaction not found'
      }

      let explanation = `This is a ${transaction.transaction_type} transaction (${transaction.transaction_code}) `
      explanation += `dated ${transaction.transaction_date} for ${this.formatCurrency(transaction.total_amount)}.\n\n`

      if (transaction.universal_transaction_lines?.length > 0) {
        explanation += 'Line items:\n'
        transaction.universal_transaction_lines.forEach((line, i) => {
          explanation += `${i + 1}. ${line.line_description} - Amount: ${this.formatCurrency(line.line_amount)}\n`
        })
      }

      // Check for related journal
      const { data: journal } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'journal_entry')
        .eq('metadata->>source_transaction_id', transactionId)
        .single()

      if (journal) {
        explanation += `\nThis transaction has been posted to the general ledger via journal entry ${journal.entity_name}.`
      }

      return explanation
    } catch (error) {
      return `Error explaining transaction: ${error.message}`
    }
  }

  /**
   * Suggest journal entries based on description
   */
  async suggestJournalEntries(description: string): Promise<JournalEntry[]> {
    // This would use AI/ML to suggest entries based on historical patterns
    // For now, return empty array
    return []
  }

  // ================================================================================
  // PRIVATE HELPER METHODS
  // ================================================================================

  private async updateJournalStatus(journalId: string, status: JournalStatus): Promise<void> {
    const { data: journal } = await supabase
      .from('core_entities')
      .select('metadata')
      .eq('id', journalId)
      .single()

    if (journal) {
      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...journal.metadata,
            status,
            updated_at: new Date().toISOString(),
            updated_by: this.userId
          }
        })
        .eq('id', journalId)
    }
  }

  private async performJournalPosting(journal: any): Promise<void> {
    // Update journal status
    await this.updateJournalStatus(journal.id, 'posted')

    // Update transaction status
    if ((journal.metadata as any)?.transaction_id) {
      await supabase
        .from('universal_transactions')
        .update({
          transaction_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', journal.metadata.transaction_id)
    }

    // Create audit entry
    await this.createAuditEntry(
      'journal_entry',
      journal.id,
      'post',
      { status: (journal.metadata as any)?.status },
      { status: 'posted' }
    )
  }

  private async createAuditEntry(
    entityType: string,
    entityId: string,
    action: string,
    before: any,
    after: any
  ): Promise<void> {
    await supabase.from('core_entities').insert({
      organization_id: this.organizationId,
      entity_type: 'audit_entry',
      entity_name: `AUDIT-${action}-${Date.now()}`,
      smart_code: ACCOUNTANT_SMART_CODES.AUDIT_TRAIL,
      metadata: {
        entity_type: entityType,
        entity_id: entityId,
        action,
        performed_by: this.userId,
        performed_at: new Date().toISOString(),
        changes: { before, after }
      },
      status: 'active'
    })
  }

  private createMockPostingRulesRepository(): IPostingRulesRepository {
    return {
      createRule: async () => ({}) as PostingRule,
      getRule: async () => null,
      getRulesBySmartCode: async () => [],
      updateRule: async () => {},
      deleteRule: async () => {},
      findMatchingRules: async () => [],
      executeRule: async () => [],
      activateRule: async () => {},
      deactivateRule: async () => {},
      getActiveRules: async () => []
    }
  }

  private getAccountFilterForReport(reportType: string): any {
    const filters: Record<string, any> = {
      balance_sheet: { statement_type: ['assets', 'liabilities', 'equity'] },
      income_statement: { statement_type: ['revenue', 'expenses'] },
      cash_flow: { account_type: 'cash' },
      trial_balance: {} // All accounts
    }
    return filters[reportType] || {}
  }

  private getReportName(reportType: string): string {
    const names: Record<string, string> = {
      balance_sheet: 'Balance Sheet',
      income_statement: 'Income Statement',
      cash_flow: 'Cash Flow Statement',
      trial_balance: 'Trial Balance'
    }
    return names[reportType] || 'Financial Report'
  }

  private buildBalanceSheetSections(accounts: any[], transactions: any[]): any[] {
    // Simplified implementation
    return [
      {
        section_code: 'ASSETS',
        section_name: 'Assets',
        section_order: 1,
        line_items: [],
        subtotal: 0
      },
      {
        section_code: 'LIABILITIES',
        section_name: 'Liabilities',
        section_order: 2,
        line_items: [],
        subtotal: 0
      },
      {
        section_code: 'EQUITY',
        section_name: 'Equity',
        section_order: 3,
        line_items: [],
        subtotal: 0
      }
    ]
  }

  private buildIncomeStatementSections(accounts: any[], transactions: any[]): any[] {
    return [
      {
        section_code: 'REVENUE',
        section_name: 'Revenue',
        section_order: 1,
        line_items: [],
        subtotal: 0
      },
      {
        section_code: 'EXPENSES',
        section_name: 'Expenses',
        section_order: 2,
        line_items: [],
        subtotal: 0
      }
    ]
  }

  private buildTrialBalanceSections(accounts: any[], transactions: any[]): any[] {
    return [
      {
        section_code: 'ALL_ACCOUNTS',
        section_name: 'All Accounts',
        section_order: 1,
        line_items: [],
        subtotal: 0
      }
    ]
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }
}

// ================================================================================
// EXPORT MAIN SERVICE
// ================================================================================

export * from './contracts'
export * from './posting-rules-engine'
export * from './validation-service'
export * from './approval-workflow'
export * from './analytics-integration'
export * from './sql-guardrails'

/**
 * Create a new Digital Accountant service instance
 */
export function createDigitalAccountantService(
  organizationId: string,
  userId: string
): IDigitalAccountantService {
  return new DigitalAccountantService(organizationId, userId)
}
