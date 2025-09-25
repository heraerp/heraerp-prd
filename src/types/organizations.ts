// Types for CivicFlow Organization Profile

export interface OrgProfile {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  organization_id: string
  created_at: string
  updated_at: string

  // Dynamic fields
  type?: 'funder' | 'partner' | 'government' | 'investee' | 'other'
  status?: 'active' | 'inactive' | 'prospective' | 'archived'
  sector?: string
  sub_sector?: string
  registry_no?: string
  website?: string
  address?: string
  tags?: string[]
  edi_flags?: {
    minority_owned?: boolean
    women_owned?: boolean
    disability_owned?: boolean
    veteran_owned?: boolean
    lgbtq_owned?: boolean
  }

  // Relationships
  manager?: OrgManager
  primary_contact?: OrgContact
  engagement?: OrgEngagementSummary

  // Metrics
  metrics?: OrgOverviewKpis
}

export interface OrgManager {
  user_id: string
  user_name: string
  user_email: string
  avatar_url?: string
  assigned_at: string
}

export interface OrgContact {
  id: string
  constituent_id: string
  constituent_name: string
  email?: string
  phone?: string
  role: string
  is_primary: boolean
  linked_at: string
}

export interface OrgEngagementSummary {
  journey_id?: string
  stage: string
  stage_ordinal: number
  score: number
  score_trend: 'up' | 'down' | 'stable'
  last_activity: string
  next_best_actions: string[]
}

export interface OrgOverviewKpis {
  last_contact_at?: string
  total_events_attended: number
  messages_last_30d: number
  open_cases_count: number
  active_grants_count: number
  total_funding_received: number
  programs_enrolled: number
}

export interface OrgFundingRow {
  id: string
  grant_name: string
  grant_code: string
  status: 'applied' | 'awarded' | 'active' | 'completed' | 'rejected'
  amount_requested?: number
  amount_awarded?: number
  start_date?: string
  end_date?: string
  program?: string
  case_id?: string
}

export interface OrgEventRow {
  id: string
  event_id: string
  event_name: string
  event_type: string
  event_date: string
  status: 'invited' | 'registered' | 'attended' | 'no_show' | 'cancelled'
  registration_date?: string
  attendance_confirmed?: boolean
}

export interface OrgCommRow {
  id: string
  message_id: string
  direction: 'inbound' | 'outbound'
  channel: 'email' | 'sms' | 'whatsapp' | 'voice' | 'print' | 'social'
  subject?: string
  preview?: string
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
  provider_id?: string
  last_event_at: string
  created_at: string
}

export interface OrgCaseRow {
  id: string
  case_code: string
  case_title: string
  case_type: string
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  assigned_to?: string
  rag_status?: 'red' | 'amber' | 'green'
  created_at: string
}

export interface OrgDocument {
  id: string
  document_name: string
  document_type: 'case_study' | 'report' | 'contract' | 'evidence' | 'other'
  file_url?: string
  file_size?: number
  mime_type?: string
  description?: string
  tags?: string[]
  uploaded_by?: string
  uploaded_at: string
}

export interface OrgActivity {
  id: string
  transaction_code: string
  smart_code: string
  activity_type: string
  description: string
  metadata?: Record<string, any>
  actor_name?: string
  created_at: string
}

// Filter and sort types
export interface OrgContactFilters {
  search?: string
  role?: string
  primary_only?: boolean
}

export interface OrgFundingFilters {
  status?: string
  program?: string
  year?: number
}

export interface OrgEventFilters {
  status?: string
  event_type?: string
  date_from?: string
  date_to?: string
}

export interface OrgCommFilters {
  direction?: 'inbound' | 'outbound'
  channel?: string
  status?: string
  date_from?: string
  date_to?: string
}

export interface OrgCaseFilters {
  status?: string
  priority?: string
  assigned_to?: string
  overdue_only?: boolean
}

export interface OrgDocumentFilters {
  document_type?: string
  tags?: string[]
  uploaded_by?: string
}

export interface OrgActivityFilters {
  activity_type?: string
  date_from?: string
  date_to?: string
  actor?: string
}

export interface ExportRequest {
  sections: (
    | 'overview'
    | 'contacts'
    | 'funding'
    | 'events'
    | 'comms'
    | 'cases'
    | 'files'
    | 'activity'
  )[]
  format: 'csv' | 'pdf' | 'zip'
  date_range?: {
    from: string
    to: string
  }
}
