/**
 * 🧾 HERA Digital Accountant Type Definitions
 *
 * Enterprise-grade accounting automation types for HERA's universal architecture
 * Follows sacred 6-table principles with smart code intelligence
 *
 * Smart Code: HERA.FIN.ACCT.DIGITAL.TYPES.v1
 */

import {
  CoreEntities,
  CoreDynamicData,
  CoreRelationships,
  UniversalTransactions,
  UniversalTransactionLines
} from './hera-database.types'

// ================================================================================
// CORE ACCOUNTING INTERFACES
// ================================================================================

/**
 * Digital Accountant operation types
 */
export type AccountingOperation =
  | 'journal_post'
  | 'reconcile'
  | 'close_period'
  | 'generate_report'
  | 'validate_balance'
  | 'batch_process'
  | 'audit_trail'
  | 'compliance_check'

/**
 * Journal entry status workflow
 */
export type JournalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'posted'
  | 'reversed'
  | 'cancelled'

/**
 * Accounting period status
 */
export type PeriodStatus = 'open' | 'soft_closed' | 'hard_closed' | 'archived'

// ================================================================================
// JOURNAL ENTRY INTERFACES
// ================================================================================

/**
 * Journal entry header (stored as entity)
 */
export interface JournalEntry extends Partial<CoreEntities> {
  entity_type: 'journal_entry'
  smart_code: string // HERA.FIN.GL.JE.*
  metadata: {
    journal_date: string
    posting_date: string
    period_code: string
    fiscal_year: number
    reference_number: string
    description: string
    source_transaction_id?: string
    reversal_of?: string
    auto_generated: boolean
    ai_confidence?: number
    validation_status: 'valid' | 'warning' | 'error'
    approval_workflow?: ApprovalWorkflow
  }
}

/**
 * Journal line (stored as transaction line)
 */
export interface JournalLine extends Partial<UniversalTransactionLines> {
  gl_account_id: string
  debit_amount: number
  credit_amount: number
  description: string
  cost_center_id?: string
  project_id?: string
  smart_code: string // HERA.FIN.GL.JE.LINE.*
  metadata: {
    reconciliation_status?: 'unreconciled' | 'partially_reconciled' | 'reconciled'
    reconciliation_date?: string
    source_document_type?: string
    source_document_id?: string
    analytics_dimensions?: Record<string, string>
  }
}

// ================================================================================
// POSTING RULES ENGINE
// ================================================================================

/**
 * Posting rule definition
 */
export interface PostingRule {
  id: string
  rule_code: string
  rule_name: string
  priority: number
  conditions: PostingCondition[]
  actions: PostingAction[]
  smart_code_pattern: string
  is_active: boolean
  metadata: {
    created_by: string
    last_modified: string
    usage_count: number
    success_rate: number
  }
}

/**
 * Conditions for posting rule activation
 */
export interface PostingCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  join_operator?: 'AND' | 'OR'
}

/**
 * Actions to perform when rule matches
 */
export interface PostingAction {
  action_type: 'create_journal_line' | 'update_field' | 'call_function' | 'send_notification'
  gl_account_code?: string
  debit_credit: 'debit' | 'credit'
  amount_formula: string // e.g., "transaction.total_amount * 0.15" for tax
  description_template: string
  smart_code_template: string
}

// ================================================================================
// RECONCILIATION INTERFACES
// ================================================================================

/**
 * Bank reconciliation session
 */
export interface ReconciliationSession {
  id: string
  organization_id: string
  gl_account_id: string // Bank GL account
  statement_date: string
  statement_balance: number
  reconciled_balance: number
  difference: number
  status: 'in_progress' | 'completed' | 'abandoned'
  items: ReconciliationItem[]
  metadata: {
    started_by: string
    started_at: string
    completed_at?: string
    auto_matched_count: number
    manual_matched_count: number
  }
}

/**
 * Individual reconciliation item
 */
export interface ReconciliationItem {
  id: string
  source_type: 'bank_statement' | 'gl_transaction'
  source_id: string
  date: string
  amount: number
  description: string
  matched_to?: string
  match_confidence?: number
  match_method?: 'exact' | 'fuzzy' | 'manual' | 'ai_suggested'
  is_reconciled: boolean
}

// ================================================================================
// APPROVAL WORKFLOWS
// ================================================================================

/**
 * Approval workflow configuration
 */
export interface ApprovalWorkflow {
  workflow_id: string
  current_step: number
  total_steps: number
  steps: ApprovalStep[]
  status: 'active' | 'completed' | 'rejected' | 'cancelled'
}

/**
 * Individual approval step
 */
export interface ApprovalStep {
  step_number: number
  approver_role: string
  approver_entity_id?: string
  approval_threshold?: number
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  approved_by?: string
  approved_at?: string
  comments?: string
}

// ================================================================================
// FINANCIAL REPORTING
// ================================================================================

/**
 * Financial report definition
 */
export interface FinancialReport {
  id: string
  report_code: string
  report_name: string
  report_type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'custom'
  period_type: 'month' | 'quarter' | 'year' | 'custom'
  period_start: string
  period_end: string
  sections: ReportSection[]
  metadata: {
    generated_at: string
    generated_by: string
    format: 'standard' | 'consolidated' | 'comparative'
    currency: string
    exchange_rate_date?: string
  }
}

/**
 * Report section (e.g., Assets, Liabilities)
 */
export interface ReportSection {
  section_code: string
  section_name: string
  section_order: number
  line_items: ReportLineItem[]
  subtotal: number
}

/**
 * Individual report line item
 */
export interface ReportLineItem {
  line_number: number
  gl_account_code: string
  gl_account_name: string
  amount: number
  budget_amount?: number
  variance?: number
  variance_percentage?: number
  drill_down_available: boolean
  notes?: string
}

// ================================================================================
// AUDIT & COMPLIANCE
// ================================================================================

/**
 * Audit trail entry
 */
export interface AuditEntry {
  id: string
  entity_type: 'journal' | 'transaction' | 'reconciliation' | 'report'
  entity_id: string
  action: 'create' | 'update' | 'approve' | 'post' | 'reverse' | 'delete'
  performed_by: string
  performed_at: string
  ip_address?: string
  user_agent?: string
  changes: AuditChange[]
  metadata: {
    risk_score?: number
    compliance_flags?: string[]
    requires_review?: boolean
  }
}

/**
 * Individual field change in audit
 */
export interface AuditChange {
  field_name: string
  old_value: any
  new_value: any
  change_reason?: string
}

// ================================================================================
// VALIDATION & ERROR HANDLING
// ================================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  is_valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  info: ValidationInfo[]
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string
  field?: string
  message: string
  severity: 'critical' | 'error'
  suggestion?: string
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string
  field?: string
  message: string
  can_override: boolean
}

/**
 * Validation info
 */
export interface ValidationInfo {
  code: string
  message: string
  help_url?: string
}

// ================================================================================
// SMART CODE PATTERNS
// ================================================================================

/**
 * Digital Accountant smart code patterns
 */
export const ACCOUNTANT_SMART_CODES = {
  // Journal entries
  JOURNAL_MANUAL: 'HERA.FIN.GL.JE.MANUAL.v1',
  JOURNAL_AUTO: 'HERA.FIN.GL.JE.AUTO.v1',
  JOURNAL_REVERSAL: 'HERA.FIN.GL.JE.REVERSAL.v1',
  JOURNAL_ADJUSTMENT: 'HERA.FIN.GL.JE.ADJUST.v1',
  JOURNAL_CLOSING: 'HERA.FIN.GL.JE.CLOSING.v1',

  // Reconciliation
  RECON_BANK: 'HERA.FIN.RECON.BANK.v1',
  RECON_INTERCOMPANY: 'HERA.FIN.RECON.INTERCO.v1',
  RECON_CUSTOMER: 'HERA.FIN.RECON.CUSTOMER.v1',
  RECON_VENDOR: 'HERA.FIN.RECON.VENDOR.v1',

  // Reports
  REPORT_BALANCE_SHEET: 'HERA.FIN.REPORT.BS.v1',
  REPORT_INCOME: 'HERA.FIN.REPORT.PL.v1',
  REPORT_CASH_FLOW: 'HERA.FIN.REPORT.CF.v1',
  REPORT_TRIAL_BALANCE: 'HERA.FIN.REPORT.TB.v1',

  // Audit
  AUDIT_TRAIL: 'HERA.FIN.AUDIT.TRAIL.v1',
  AUDIT_COMPLIANCE: 'HERA.FIN.AUDIT.COMPLIANCE.v1',
  AUDIT_RISK: 'HERA.FIN.AUDIT.RISK.v1'
} as const

// ================================================================================
// TELEMETRY & METRICS
// ================================================================================

/**
 * Accounting operation metrics
 */
export interface AccountingMetrics {
  operation: AccountingOperation
  start_time: string
  end_time: string
  duration_ms: number
  success: boolean
  error_code?: string
  records_processed: number
  ai_confidence?: number
  metadata: {
    organization_id: string
    user_id: string
    session_id: string
    performance_score: number
  }
}

// ================================================================================
// MCP TOOL INTERFACES
// ================================================================================

/**
 * MCP tool request for journal posting
 */
export interface JournalPostRequest {
  organization_id: string
  journal_entry_id: string
  validation_override?: string[]
  posting_date?: string
  batch_mode?: boolean
}

/**
 * MCP tool response
 */
export interface AccountingToolResponse {
  success: boolean
  operation: AccountingOperation
  result?: any
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  metrics?: AccountingMetrics
}

/**
 * Natural language accounting query
 */
export interface AccountingQuery {
  organization_id: string
  query: string
  context?: {
    period?: string
    gl_accounts?: string[]
    report_type?: string
  }
  format?: 'summary' | 'detailed' | 'visual'
}
