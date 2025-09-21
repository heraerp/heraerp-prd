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

export interface PlaybookListItem {
  id: string
  name: string
  version: string
  description?: string
  category?: string
  tags?: string[]
  step_count?: number
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
