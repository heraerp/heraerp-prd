/**
 * HERA Audit System Type Definitions
 * Based on GSPU 2025 Framework and Universal Architecture
 */

// Client Management Types
export interface AuditClient {
  id: string
  organization_id: string // Each client is a separate organization
  entity_type: 'audit_client'
  entity_code: string
  entity_name: string
  smart_code: 'HERA.AUD.CLI.ENT.PROF.V1'
  status: 'active' | 'inactive' | 'prospective'
  metadata: {
    client_type: 'public' | 'private' | 'non_profit' | 'government'
    risk_rating: 'low' | 'moderate' | 'high' | 'very_high'
    industry_code: string
    annual_revenue: number
    total_assets: number
    public_interest_entity: boolean
    previous_auditor?: string
    audit_history: AuditHistory[]
    // Compliance fields
    partners_id?: string
    sijilat_verification?: string
    credit_rating?: string
    aml_risk_score?: number
    zigram_assessment?: {
      score: number
      factors: string[]
      date: string
    }
  }
  created_at: string
  updated_at: string
}

export interface AuditHistory {
  year: string
  auditor: string
  opinion_type: 'unqualified' | 'qualified' | 'adverse' | 'disclaimer'
  key_matters?: string[]
  fees?: number
}

// Document Management Types
export interface DocumentRequisition {
  id: string
  organization_id: string // Audit firm's organization
  transaction_type: 'document_requisition'
  smart_code: 'HERA.AUD.DOC.TXN.REQ.V1'
  reference_number: string
  client_id: string
  audit_year: string
  requisition_date: string
  due_date: string
  status: 'draft' | 'sent' | 'partial' | 'complete' | 'overdue'
  workflow_state:
    | 'requisition_preparation'
    | 'client_notification'
    | 'document_collection'
    | 'review_complete'
  metadata: {
    total_documents: number
    documents_received: number
    documents_approved: number
    categories: DocumentCategory[]
    reminder_sent_dates: string[]
    client_portal_access: boolean
  }
}

export type DocumentCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface DocumentLineItem {
  id: string
  requisition_id: string
  document_code: string // e.g., "A.1", "B.2"
  document_name: string
  category: DocumentCategory
  subcategory: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status:
    | 'pending'
    | 'received'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'resubmission_required'
  due_date: string
  received_date?: string
  reviewed_by?: string
  approved_by?: string
  remarks?: string
  file_attachments: FileAttachment[]
  metadata: {
    document_type: string
    file_size_limit?: number
    required_format?: string[]
    validation_rules?: string[]
    retention_period_years: number
  }
}

export interface FileAttachment {
  id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_date: string
  uploaded_by: string
  version: number
  checksum: string
}

// Audit Procedures Types
export interface AuditProcedure {
  id: string
  organization_id: string
  transaction_type: 'audit_procedure'
  smart_code: 'HERA.AUD.PROC.TXN.TEST.V1'
  reference_number: string
  client_id: string
  audit_area: AuditArea
  procedure_type: ProcedureType
  testing_approach: 'risk_based' | 'controls_based' | 'substantive_only'
  status: 'planned' | 'in_progress' | 'completed' | 'reviewed' | 'signed_off'
  metadata: {
    materiality_threshold: number
    sample_size: number
    sampling_method: 'random' | 'stratified' | 'systematic' | 'judgmental'
    population_size: number
    confidence_level: number
    expected_error_rate: number
    actual_error_rate?: number
    exceptions_noted: number
    testing_conclusion: 'satisfactory' | 'unsatisfactory' | 'qualified'
  }
  assigned_to: string
  reviewer: string
  performed_date: string
  review_date?: string
}

export type AuditArea =
  | 'cash_bank'
  | 'accounts_receivable'
  | 'inventory'
  | 'fixed_assets'
  | 'investments'
  | 'accounts_payable'
  | 'loans_borrowings'
  | 'equity'
  | 'revenue'
  | 'purchases'
  | 'payroll'
  | 'operating_expenses'
  | 'tax'
  | 'related_parties'
  | 'subsequent_events'
  | 'going_concern'

export type ProcedureType =
  | 'walkthrough'
  | 'control_testing'
  | 'substantive_analytical'
  | 'substantive_detail'
  | 'confirmation'
  | 'observation'
  | 'inquiry'
  | 'recalculation'
  | 'reperformance'

// Working Paper Types
export interface WorkingPaper {
  id: string
  organization_id: string
  entity_type: 'working_paper'
  smart_code: 'HERA.AUD.WP.ENT.MASTER.V1'
  paper_reference: string // e.g., "A.1.1", "B.2.3"
  paper_title: string
  audit_area: AuditArea
  client_id: string
  audit_year: string
  status: 'draft' | 'completed' | 'under_review' | 'reviewed' | 'signed_off'
  metadata: {
    paper_type: 'lead_schedule' | 'supporting_schedule' | 'test_documentation' | 'permanent_file'
    preparer: string
    prepare_date: string
    reviewer?: string
    review_date?: string
    partner_reviewer?: string
    partner_review_date?: string
    indexing_references: string[]
    tick_marks_used: TickMark[]
    cross_references: string[]
    source_documents: string[]
    conclusions: string
    adjustments_proposed?: AuditAdjustment[]
  }
  content: WorkingPaperContent
}

export interface TickMark {
  symbol: string
  description: string
  standard: boolean // Whether it's a standard tick mark or custom
}

export interface WorkingPaperContent {
  objectives: string
  procedures_performed: string[]
  findings: string
  exceptions?: string[]
  conclusion: string
  recommendations?: string[]
}

export interface AuditAdjustment {
  id: string
  description: string
  debit_account: string
  credit_account: string
  amount: number
  type: 'proposed' | 'passed' | 'recorded'
  material: boolean
  discussed_with_client: boolean
  client_agreement: boolean
}

// Review Workflow Types
export interface AuditReview {
  id: string
  organization_id: string
  transaction_type: 'audit_review'
  smart_code:
    | 'HERA.AUD.REV.TXN.MANAGER.V1'
    | 'HERA.AUD.REV.TXN.PARTNER.V1'
    | 'HERA.AUD.REV.TXN.EQCR.V1'
  reference_number: string
  review_level: ReviewLevel
  reviewer_id: string
  reviewer_name: string
  review_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'returned_for_revision'
  metadata: {
    working_papers_reviewed: string[]
    areas_reviewed: AuditArea[]
    time_spent_hours: number
    review_notes: ReviewNote[]
    critical_issues: CriticalIssue[]
    sign_off_status: 'unsigned' | 'signed' | 'conditional_approval'
    eqcr_required: boolean
    eqcr_justification?: string
  }
}

export type ReviewLevel = 'associate' | 'senior' | 'manager' | 'partner' | 'eqcr'

export interface ReviewNote {
  id: string
  working_paper_reference: string
  note_type: 'question' | 'comment' | 'issue' | 'recommendation'
  description: string
  severity: 'minor' | 'moderate' | 'significant' | 'material'
  raised_by: string
  raised_date: string
  assigned_to: string
  due_date: string
  status: 'open' | 'resolved' | 'deferred' | 'closed'
  response?: string
  resolved_by?: string
  resolved_date?: string
}

export interface CriticalIssue {
  id: string
  issue_type:
    | 'control_deficiency'
    | 'misstatement'
    | 'disclosure'
    | 'going_concern'
    | 'fraud_risk'
    | 'compliance'
  description: string
  financial_impact?: number
  affected_accounts: string[]
  management_response?: string
  auditor_conclusion: string
  report_impact: 'none' | 'emphasis_of_matter' | 'qualification' | 'adverse' | 'disclaimer'
}

// Reporting Types
export interface AuditReport {
  id: string
  organization_id: string
  entity_type: 'audit_report'
  smart_code: 'HERA.AUD.RPT.ENT.REPORT.V1'
  report_type: 'audit_opinion' | 'management_letter' | 'internal_control' | 'agreed_upon_procedures'
  client_id: string
  audit_year: string
  status: 'draft' | 'under_review' | 'approved' | 'issued'
  metadata: {
    opinion_type: 'unqualified' | 'qualified' | 'adverse' | 'disclaimer'
    emphasis_of_matter?: string[]
    key_audit_matters?: KeyAuditMatter[]
    other_matter_paragraphs?: string[]
    report_date: string
    financial_statement_date: string
    subsequent_events_date: string
    management_representation_date: string
    board_approval_date?: string
    issuance_date?: string
    addressee: string
    signing_partner: string
    eqcr_partner?: string
  }
  content: {
    opinion_paragraph: string
    basis_for_opinion: string
    responsibilities_management: string
    responsibilities_auditor: string
    other_information?: string
    report_on_other_requirements?: string
  }
}

export interface KeyAuditMatter {
  title: string
  description: string
  how_matter_addressed: string
  reference_to_financials?: string
}

// Compliance Types
export interface ComplianceCheck {
  id: string
  organization_id: string
  check_type: 'independence' | 'aml' | 'conflict' | 'quality_control' | 'cpd' | 'licensing'
  entity_id: string // Client or staff member
  entity_type: 'client' | 'staff' | 'engagement'
  check_date: string
  performed_by: string
  status: 'passed' | 'failed' | 'requires_review' | 'exemption_granted'
  metadata: {
    check_details: Record<string, any>
    findings?: string[]
    actions_required?: string[]
    exemption_reason?: string
    approved_by?: string
    next_check_date?: string
  }
}

// GSPU 2025 Audit Phases
export interface AuditPhase {
  phase_number: number
  phase_name: string
  status: 'not_started' | 'in_progress' | 'completed'
  start_date?: string
  end_date?: string
  completion_percentage: number
  key_deliverables: string[]
  responsible_team_members: string[]
}

export const GSPU_AUDIT_PHASES: AuditPhase[] = [
  {
    phase_number: 1,
    phase_name: 'Client Engagement & Acceptance',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: ['Risk screening', 'Independence checks', 'Engagement letter'],
    responsible_team_members: []
  },
  {
    phase_number: 2,
    phase_name: 'Audit Planning',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: ['Client understanding', 'Risk assessment', 'Materiality', 'Audit strategy'],
    responsible_team_members: []
  },
  {
    phase_number: 3,
    phase_name: 'Internal Controls Evaluation',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: ['System walkthroughs', 'Control testing', 'ITGC evaluation'],
    responsible_team_members: []
  },
  {
    phase_number: 4,
    phase_name: 'Fieldwork/Substantive Procedures',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: ['Testing details', 'Confirmations', 'Analytics'],
    responsible_team_members: []
  },
  {
    phase_number: 5,
    phase_name: 'Audit Documentation',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: ['Working papers', 'Standards compliance', 'Review notes'],
    responsible_team_members: []
  },
  {
    phase_number: 6,
    phase_name: 'Review & Supervision',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: ['Manager review', 'Partner review', 'EQCR', 'Issue resolution'],
    responsible_team_members: []
  },
  {
    phase_number: 7,
    phase_name: 'Audit Completion',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: ['Adjustments', 'Subsequent events', 'Going concern', 'Representations'],
    responsible_team_members: []
  },
  {
    phase_number: 8,
    phase_name: 'Reporting',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: [
      'Opinion formulation',
      'Financial statement review',
      'Governance communication'
    ],
    responsible_team_members: []
  },
  {
    phase_number: 9,
    phase_name: 'Post-Audit Activities',
    status: 'not_started',
    completion_percentage: 0,
    key_deliverables: ['Management letter', 'Feedback', 'Archiving'],
    responsible_team_members: []
  }
]

// Document Categories from GSPU Requisition Format
export const DOCUMENT_CATEGORIES = {
  A: {
    title: 'Company Formation Documents',
    items: [
      { code: 'A.1', name: 'Commercial registration certificate', priority: 'high' },
      { code: 'A.2', name: 'Memorandum of Association', priority: 'high' },
      { code: 'A.3', name: "Shareholders' CPR copy", priority: 'medium' },
      { code: 'A.4', name: "Shareholders' Passport copy", priority: 'medium' }
    ]
  },
  B: {
    title: 'Financial Documents',
    items: [
      { code: 'B.1', name: 'Audited Financial Statements (Prior Year)', priority: 'critical' },
      { code: 'B.2', name: 'Financial Statements (Current Year)', priority: 'critical' },
      { code: 'B.3', name: 'Trial Balance (Current Year)', priority: 'critical' }
    ]
  },
  C: {
    title: 'Audit Planning Documents',
    items: [
      { code: 'C.1', name: 'Audit Materiality Check', priority: 'high' },
      { code: 'C.2', name: 'Audit Timeline for execution', priority: 'high' },
      { code: 'C.3', name: 'Sampling percentage based on materiality', priority: 'high' },
      { code: 'C.4', name: 'Working papers and query documentation', priority: 'high' }
    ]
  },
  D: {
    title: 'Audit Execution Documents',
    items: [
      { code: 'D.1', name: 'Revenue documentation', priority: 'high' },
      { code: 'D.2', name: 'Other income details', priority: 'medium' },
      { code: 'D.3', name: 'Cost of Revenue', priority: 'high' },
      { code: 'D.4', name: 'Payroll documentation', priority: 'high' },
      { code: 'D.5', name: 'Utilities documentation', priority: 'medium' },
      { code: 'D.6', name: 'General and administrative expenses', priority: 'medium' },
      { code: 'D.7', name: 'Property, Plant and Equipment', priority: 'high' },
      { code: 'D.8', name: 'Inventory documentation', priority: 'high' },
      { code: 'D.9', name: 'Trade receivables', priority: 'high' },
      { code: 'D.10', name: 'Advances, deposits and prepayments', priority: 'medium' },
      { code: 'D.11', name: 'Cash and cash equivalent', priority: 'high' },
      { code: 'D.12', name: 'Trade Payables', priority: 'high' },
      { code: 'D.13', name: 'Provisions (leave pay, indemnity, air fare)', priority: 'medium' },
      { code: 'D.14', name: 'Other payables', priority: 'medium' },
      { code: 'D.15', name: 'Accrued expenses calculation basis', priority: 'medium' },
      { code: 'D.16', name: 'Facility letters for short-term borrowings', priority: 'high' },
      { code: 'D.17', name: 'Loan documentation', priority: 'high' }
    ]
  },
  E: {
    title: 'VAT Documentation',
    items: [
      { code: 'E.1', name: 'VAT registration certificate', priority: 'high' },
      { code: 'E.2', name: 'Quarterly VAT filings', priority: 'high' },
      { code: 'E.3', name: 'VAT calculation details', priority: 'high' }
    ]
  },
  F: {
    title: 'Related Parties Documentation',
    items: [
      { code: 'F.1', name: 'Related party details and relationships', priority: 'high' },
      { code: 'F.2', name: 'Outstanding balances with related parties', priority: 'high' },
      { code: 'F.3', name: 'Related party balance confirmations', priority: 'high' },
      { code: 'F.4', name: 'Transaction details during the year', priority: 'high' }
    ]
  }
}
