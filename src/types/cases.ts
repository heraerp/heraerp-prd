/**
 * Cases module type definitions
 * Follows HERA's 6-table architecture with multi-tenancy
 */

export type CaseStatus = 'new' | 'in_review' | 'active' | 'on_hold' | 'breach' | 'closed'
export type CasePriority = 'low' | 'medium' | 'high' | 'critical'
export type CaseRag = 'R' | 'A' | 'G'
export type CaseActionType = 'approve' | 'vary' | 'waive' | 'breach' | 'close'

export interface CaseListItem {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  status: CaseStatus
  priority: CasePriority
  rag: CaseRag
  due_date: string | null
  owner: string | null
  tags: string[]

  // Related entities
  program_id: string | null
  program_name: string | null
  subject_id: string | null
  subject_name: string | null
  subject_type: 'constituent' | 'ps_org' | null

  // Metadata
  created_at: string
  updated_at: string
  last_action_at: string | null
  last_action_type: string | null
}

export interface CaseDetail extends CaseListItem {
  // Additional dynamic fields
  description: string | null
  resolution_notes: string | null
  attachments: Array<{
    name: string
    url: string
    uploaded_at: string
  }>

  // Dynamic attributes
  attributes: Record<string, any>

  // Relationships
  relationships: {
    program?: {
      id: string
      name: string
    }
    subject?: {
      id: string
      name: string
      type: 'constituent' | 'ps_org'
    }
    agreement?: {
      id: string
      name: string
      signed_at: string | null
    }
  }

  // Computed fields
  age_days: number
  is_overdue: boolean
  time_to_due: string | null
}

export interface CaseKpis {
  open: number
  due_this_week: number
  breaches: number
  total: number
  avg_resolution_days: number
  on_time_pct: number
}

export interface CaseFilters {
  q?: string
  status?: CaseStatus[]
  priority?: CasePriority[]
  rag?: CaseRag[]
  owner?: string
  programId?: string
  due_from?: string
  due_to?: string
  tags?: string[]
  page?: number
  pageSize?: number
}

export interface CaseTimelineEvent {
  id: string
  transaction_code: string
  transaction_type: string
  smart_code: string
  description: string
  created_at: string
  created_by: string | null
  metadata: Record<string, any>
}

// Action payloads for case workflows
export interface CaseActionApprovePayload {
  case_id: string
  approval_notes: string
  approved_by: string
  conditions?: string[]
}

export interface CaseActionVaryPayload {
  case_id: string
  variation_type: string
  variation_details: string
  new_terms?: Record<string, any>
  effective_date?: string
}

export interface CaseActionWaivePayload {
  case_id: string
  waiver_reason: string
  waiver_period?: string
  conditions?: string[]
}

export interface CaseActionBreachPayload {
  case_id: string
  breach_type: string
  breach_details: string
  severity: 'minor' | 'major' | 'critical'
  remediation_required?: string
}

export interface CaseActionClosePayload {
  case_id: string
  close_reason: string
  outcome: 'resolved' | 'cancelled' | 'escalated'
  resolution_notes?: string
}

export interface CreateCasePayload {
  entity_name: string
  priority: CasePriority
  rag: CaseRag
  due_date: string
  owner: string
  description?: string
  tags?: string[]
  program_id?: string
  subject_id?: string
}

export type CaseExportFormat = 'csv' | 'pdf' | 'zip'

export interface ExportCasesPayload {
  filters: CaseFilters
  format: CaseExportFormat
  include_timeline?: boolean
}

export interface CaseListResponse {
  items: CaseListItem[]
  total: number
  page: number
  pageSize: number
}

// Component prop types
export interface CaseFilterBarProps {
  filters: CaseFilters
  onFiltersChange: (filters: CaseFilters) => void
  onClear: () => void
}
