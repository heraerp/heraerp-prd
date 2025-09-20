/**
 * 🧾 HERA Digital Accountant Contracts
 *
 * Repository and service contracts for enterprise accounting operations
 * Enforces sacred 6-table architecture with multi-tenant isolation
 *
 * Smart Code: HERA.FIN.ACCT.DIGITAL.CONTRACTS.V1
 */

import {
  JournalEntry,
  JournalLine,
  JournalStatus,
  PostingRule,
  ReconciliationSession,
  ReconciliationItem,
  FinancialReport,
  AuditEntry,
  ValidationResult,
  AccountingOperation,
  AccountingMetrics,
  AccountingToolResponse,
  AccountingQuery
} from '@/types/digital-accountant.types'

// ================================================================================
// REPOSITORY INTERFACES
// ================================================================================

/**
 * Journal entry repository contract
 */
export interface IJournalRepository {
  // Create operations
  createJournalEntry(entry: Partial<JournalEntry>): Promise<JournalEntry>
  createJournalLines(journalId: string, lines: Partial<JournalLine>[]): Promise<JournalLine[]>

  // Read operations
  getJournalEntry(id: string, organizationId: string): Promise<JournalEntry | null>
  getJournalsByPeriod(organizationId: string, periodCode: string): Promise<JournalEntry[]>
  getJournalsByStatus(organizationId: string, status: JournalStatus): Promise<JournalEntry[]>
  getJournalLines(journalId: string, organizationId: string): Promise<JournalLine[]>

  // Update operations
  updateJournalStatus(id: string, status: JournalStatus, organizationId: string): Promise<void>
  updateJournalMetadata(
    id: string,
    metadata: Partial<JournalEntry['metadata']>,
    organizationId: string
  ): Promise<void>

  // Posting operations
  postJournal(
    id: string,
    organizationId: string,
    validationOverrides?: string[]
  ): Promise<AccountingToolResponse>
  reverseJournal(
    id: string,
    organizationId: string,
    reversalDate: string,
    reason: string
  ): Promise<JournalEntry>

  // Validation
  validateJournal(entry: JournalEntry): Promise<ValidationResult>
  validateBalance(lines: JournalLine[]): Promise<boolean>
}

/**
 * Posting rules repository contract
 */
export interface IPostingRulesRepository {
  // CRUD operations
  createRule(rule: Partial<PostingRule>): Promise<PostingRule>
  getRule(ruleCode: string): Promise<PostingRule | null>
  getRulesBySmartCode(smartCodePattern: string): Promise<PostingRule[]>
  updateRule(ruleCode: string, updates: Partial<PostingRule>): Promise<void>
  deleteRule(ruleCode: string): Promise<void>

  // Rule execution
  findMatchingRules(transaction: any): Promise<PostingRule[]>
  executeRule(rule: PostingRule, transaction: any): Promise<JournalLine[]>

  // Rule management
  activateRule(ruleCode: string): Promise<void>
  deactivateRule(ruleCode: string): Promise<void>
  getActiveRules(): Promise<PostingRule[]>
}

/**
 * Reconciliation repository contract
 */
export interface IReconciliationRepository {
  // Session management
  createSession(session: Partial<ReconciliationSession>): Promise<ReconciliationSession>
  getSession(sessionId: string, organizationId: string): Promise<ReconciliationSession | null>
  updateSession(
    sessionId: string,
    updates: Partial<ReconciliationSession>,
    organizationId: string
  ): Promise<void>

  // Item matching
  addItems(sessionId: string, items: ReconciliationItem[]): Promise<void>
  matchItems(
    sessionId: string,
    sourceId: string,
    targetId: string,
    confidence: number
  ): Promise<void>
  unmatchItem(sessionId: string, itemId: string): Promise<void>

  // Auto-matching
  autoMatchItems(
    sessionId: string,
    threshold: number
  ): Promise<{ matched: number; unmatched: number }>
  suggestMatches(sessionId: string, itemId: string): Promise<ReconciliationItem[]>

  // Completion
  completeReconciliation(sessionId: string, organizationId: string): Promise<void>
}

/**
 * Financial reporting repository contract
 */
export interface IReportingRepository {
  // Report generation
  generateReport(
    reportType: string,
    organizationId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<FinancialReport>
  getReport(reportId: string, organizationId: string): Promise<FinancialReport | null>

  // Report templates
  getReportTemplates(organizationId: string): Promise<any[]>
  saveReportTemplate(template: any, organizationId: string): Promise<string>

  // Data queries
  getTrialBalance(organizationId: string, asOfDate: string): Promise<any[]>
  getGLBalances(organizationId: string, accountCodes: string[], periodCode: string): Promise<any[]>
  getTransactionSummary(
    organizationId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any>
}

/**
 * Audit repository contract
 */
export interface IAuditRepository {
  // Audit logging
  createAuditEntry(entry: Partial<AuditEntry>): Promise<AuditEntry>
  getAuditTrail(entityType: string, entityId: string, organizationId: string): Promise<AuditEntry[]>
  getAuditByUser(
    userId: string,
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<AuditEntry[]>

  // Compliance
  runComplianceCheck(organizationId: string, checkType: string): Promise<ValidationResult>
  getComplianceReport(organizationId: string, periodCode: string): Promise<any>

  // Risk assessment
  calculateRiskScore(entityType: string, entityId: string): Promise<number>
  flagHighRiskTransactions(organizationId: string, threshold: number): Promise<string[]>
}

// ================================================================================
// SERVICE INTERFACES
// ================================================================================

/**
 * Digital Accountant service contract
 */
export interface IDigitalAccountantService {
  // Journal operations
  createJournalEntry(entry: Partial<JournalEntry>): Promise<JournalEntry>
  postJournal(journalId: string, options?: any): Promise<AccountingToolResponse>
  reverseJournal(journalId: string, reason: string): Promise<JournalEntry>
  batchPostJournals(journalIds: string[]): Promise<AccountingToolResponse[]>

  // Transaction processing
  processTransaction(transactionId: string): Promise<JournalEntry>
  processTransactionBatch(transactionIds: string[]): Promise<AccountingToolResponse>

  // Reconciliation
  startReconciliation(glAccountId: string, statementDate: string): Promise<ReconciliationSession>
  performAutoMatch(sessionId: string): Promise<any>
  completeReconciliation(sessionId: string): Promise<void>

  // Reporting
  generateFinancialReport(reportType: string, period: string): Promise<FinancialReport>
  exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Buffer>

  // Period operations
  closePeriod(periodCode: string, soft: boolean): Promise<void>
  reopenPeriod(periodCode: string, reason: string): Promise<void>

  // Natural language interface
  processAccountingQuery(query: AccountingQuery): Promise<any>
  explainTransaction(transactionId: string): Promise<string>
  suggestJournalEntries(description: string): Promise<JournalEntry[]>
}

/**
 * Posting rules engine contract
 */
export interface IPostingRulesEngine {
  // Rule evaluation
  evaluateTransaction(transaction: any): Promise<PostingRule[]>
  generateJournalLines(rules: PostingRule[], transaction: any): Promise<JournalLine[]>

  // Rule management
  importRules(rules: PostingRule[]): Promise<void>
  exportRules(): Promise<PostingRule[]>
  validateRule(rule: PostingRule): Promise<ValidationResult>

  // Smart code mapping
  mapSmartCodeToAccounts(smartCode: string): Promise<{ debit: string; credit: string }>
  updateSmartCodeMapping(smartCode: string, accounts: any): Promise<void>
}

/**
 * Validation service contract
 */
export interface IValidationService {
  // Journal validation
  validateJournalEntry(entry: JournalEntry): Promise<ValidationResult>
  validateJournalBalance(lines: JournalLine[]): Promise<ValidationResult>
  validatePostingDate(date: string, organizationId: string): Promise<ValidationResult>

  // Account validation
  validateGLAccount(accountId: string, organizationId: string): Promise<boolean>
  validateAccountCombination(accounts: string[]): Promise<ValidationResult>

  // Period validation
  validatePeriod(periodCode: string, organizationId: string): Promise<ValidationResult>
  isPeriodOpen(periodCode: string, organizationId: string): Promise<boolean>

  // Business rules
  validateBusinessRules(entry: JournalEntry): Promise<ValidationResult>
  getApplicableRules(entry: JournalEntry): Promise<any[]>
}

/**
 * Telemetry service contract
 */
export interface ITelemetryService {
  // Metrics collection
  startOperation(operation: AccountingOperation, metadata: any): Promise<string>
  endOperation(operationId: string, success: boolean, result?: any): Promise<void>
  recordMetric(metric: AccountingMetrics): Promise<void>

  // Performance monitoring
  getOperationMetrics(operation: AccountingOperation, period: string): Promise<AccountingMetrics[]>
  getPerformanceReport(organizationId: string): Promise<any>

  // Error tracking
  recordError(operation: AccountingOperation, error: Error, context: any): Promise<void>
  getErrorReport(organizationId: string, period: string): Promise<any>
}

// ================================================================================
// FACTORY INTERFACE
// ================================================================================

/**
 * Digital Accountant factory for dependency injection
 */
export interface IDigitalAccountantFactory {
  // Repositories
  getJournalRepository(): IJournalRepository
  getPostingRulesRepository(): IPostingRulesRepository
  getReconciliationRepository(): IReconciliationRepository
  getReportingRepository(): IReportingRepository
  getAuditRepository(): IAuditRepository

  // Services
  getAccountantService(): IDigitalAccountantService
  getPostingRulesEngine(): IPostingRulesEngine
  getValidationService(): IValidationService
  getTelemetryService(): ITelemetryService

  // Configuration
  configure(config: any): void
  getConfiguration(): any
}
