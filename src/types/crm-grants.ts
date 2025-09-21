export interface GrantKpis {
  open_rounds: number
  in_review: number
  approval_rate: number
  avg_award: number
  updated_at: string
}

export interface GrantApplicationListItem {
  id: string
  applicant: {
    id: string
    type: 'constituent' | 'ps_org'
    name: string
  }
  round: {
    id: string
    round_code: string
  }
  program: {
    id: string
    title: string
    code: string
  }
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'awarded' | 'closed'
  amount_requested?: number
  amount_awarded?: number
  score?: number
  last_action_at?: string
  smart_code: string
  created_at: string
}

export interface GrantApplicationDetail extends GrantApplicationListItem {
  summary?: string
  documents?: string[]
  tags?: string[]
  scoring?: {
    need: number
    impact: number
    feasibility: number
    total: number
  }
  pending_step?: {
    run_id: string
    step_sequence: number
    step_name: string
    awaiting_input: boolean
  }
}

export type GrantReviewAction = 'approve' | 'reject' | 'award'

export interface CreateGrantRequest {
  applicant: {
    type: 'constituent' | 'ps_org'
    id: string
  }
  round_id: string
  summary?: string
  amount_requested?: number
  tags?: string[]
  start_run?: boolean
}

export interface ReviewGrantRequest {
  action: GrantReviewAction
  amount_awarded?: number
  notes?: string
}

export interface GrantFilters {
  q?: string
  status?: ('draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'awarded' | 'closed')[]
  round_id?: string
  program_id?: string
  amount_min?: number
  amount_max?: number
  tags?: string[]
  page?: number
  page_size?: number
}

export interface ExportGrantsRequest {
  filters: GrantFilters
  format: 'csv' | 'json'
}

export interface PaginatedGrants {
  items: GrantApplicationListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
