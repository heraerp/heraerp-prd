// Playbook status enum
export type PlaybookStatus = 'draft' | 'active' | 'archived'

// Playbook category enum
export type PlaybookCategory = 'constituent' | 'grants' | 'service' | 'case' | 'outreach'

// Playbook list item (for listing pages)
export interface PlaybookListItem {
  id: string
  name: string
  description: string | null
  status: PlaybookStatus
  category: PlaybookCategory
  steps_count: number
  total_runs: number | null
  success_rate: number | null
  last_run_at: string | null
  services?: Array<{ id: string; name: string }>
  programs?: Array<{ id: string; name: string }>
  created_at: string
  updated_at: string
}

// Playbook step types
export type PlaybookStepType =
  | 'form'
  | 'approval'
  | 'notification'
  | 'action'
  | 'condition'
  | 'integration'

// Playbook step definition
export interface PlaybookStep {
  id: string
  sequence: number
  name: string
  description: string | null
  step_type: PlaybookStepType
  config: Record<string, any>
  conditions: Record<string, any> | null
  on_success: string | null
  on_failure: string | null
}

// Playbook detail (full playbook data)
export interface PlaybookDetail extends PlaybookListItem {
  version: string
  steps: PlaybookStep[]
  relationships: {
    services: Array<{
      id: string
      name: string
      entity_code: string
    }>
    programs: Array<{
      id: string
      name: string
      entity_code: string
    }>
  }
}

// KPI data structure
export interface PlaybookKpis {
  active: number
  draft: number
  archived: number
  total_runs: number
  avg_duration_hours: number
  success_rate: number
}

// Filter options
export interface PlaybookFilters {
  q?: string
  status?: PlaybookStatus
  category?: PlaybookCategory
  service_id?: string
  page?: number
  pageSize?: number
}

// Create playbook payload
export interface CreatePlaybookPayload {
  name: string
  description?: string
  status: 'draft' | 'active'
  category: PlaybookCategory
  steps: Omit<PlaybookStep, 'id'>[]
  service_ids?: string[]
  program_ids?: string[]
}

// Update playbook payload
export interface UpdatePlaybookPayload {
  name?: string
  description?: string
  status?: PlaybookStatus
  category?: PlaybookCategory
  steps?: Omit<PlaybookStep, 'id'>[]
  service_ids?: string[]
  program_ids?: string[]
}

// Export formats
export type PlaybookExportFormat = 'json' | 'yaml' | 'pdf'

// Backward compatibility exports
export interface PlaybookDef {
  id: string
  name: string
  version: string
  description?: string
  category?: string
  tags?: string[]
  steps?: PlaybookStepDef[]
  metadata?: Record<string, any>
  organization_id: string
  created_at: string
  updated_at: string
}

export interface PlaybookStepDef {
  id?: string
  sequence: number
  name: string
  description?: string
  step_type: string
  config?: Record<string, any>
  conditions?: Record<string, any>
  on_success?: string
  on_failure?: string
}
