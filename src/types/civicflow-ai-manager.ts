// AI Manager Types for CivicFlow Access CRM & Grants
import { z } from 'zod'

// Core Object Types
export interface Organisation {
  id: string
  name: string
  reg_no?: string
  type: 'charity' | 'social_enterprise' | 'business' | 'foundation' | 'public_sector'
  sector: string
  geo_lsoa?: string
  geo_msoa?: string
  imd_decile?: number
  edi_flags: string[]
  linkedin_url?: string
  website?: string
  priority_tier: 'tier1' | 'tier2' | 'tier3'
  account_manager?: string
  journey_stage: 'prospect' | 'applicant' | 'investee' | 'alumni' | 'partner'
}

export interface Contact {
  id: string
  name: string
  role: string
  emails: string[]
  linkedin_url?: string
  consent_flags: {
    email: boolean
    phone: boolean
    linkedin_outreach: boolean
  }
  affiliation_history: Array<{
    org_id: string
    role: string
    start_date: string
    end_date?: string
  }>
}

export interface Programme {
  id: string
  name: string
  type: 'blended_finance' | 'enterprise_grants' | 'market_dev' | 'technical_assistance'
  status: 'planning' | 'active' | 'complete' | 'paused'
  governance_bodies: string[]
  start_date: string
  end_date?: string
  kpi_targets: KPITarget[]
  partner_ids: string[]
}

export interface Fund {
  id: string
  name: string
  programme_id: string
  target_size: number
  committed: number
  invested: number
  instrument_mix: {
    loans: number
    grants: number
    equity: number
  }
  sectors: string[]
  geo_focus: string[]
  imd_targets: number[]
}

export interface Application {
  id: string
  org_id: string
  programme_id: string
  fund_id?: string
  status: 'draft' | 'submitted' | 'reviewing' | 'clarifications' | 'ic_review' | 'approved' | 'rejected' | 'withdrawn'
  stage_history: Array<{
    stage: string
    date: string
    outcome?: string
    notes?: string
  }>
  requested_amount: number
  matched_finance: number
  approval_conditions: string[]
}

export interface Agreement {
  id: string
  application_id: string
  org_id: string
  status: 'negotiating' | 'signed' | 'active' | 'complete' | 'terminated'
  signed_date?: string
  start_date: string
  end_date: string
  total_commitment: number
  drawdown_schedule: DrawdownSchedule[]
  kpi_framework: KPITarget[]
  variations: Variation[]
}

export interface DrawdownSchedule {
  date: string
  amount: number
  milestone?: string
  status: 'scheduled' | 'requested' | 'approved' | 'paid' | 'delayed'
  evidence_required: string[]
  actual_date?: string
}

export interface KPITarget {
  name: string
  category: 'impact' | 'financial' | 'operational' | 'esg'
  target_value: number
  current_value: number
  unit: string
  reporting_frequency: 'monthly' | 'quarterly' | 'annual'
  last_updated: string
  rag_status: '🟢' | '🟡' | '🔴'
}

export interface Variation {
  id: string
  requested_date: string
  type: 'timeline' | 'budget' | 'kpi' | 'scope'
  description: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approval_date?: string
}

export interface Event {
  id: string
  name: string
  type: 'workshop' | 'conference' | 'networking' | 'training' | 'webinar'
  date: string
  attendee_ids: string[]
  org_ids: string[]
  follow_ups: Array<{
    type: 'meeting' | 'email' | 'application' | 'partnership'
    date: string
    outcome?: string
  }>
}

// Tool Contract Types
export const CRMSearchParamsSchema = z.object({
  entity_type: z.enum(['organisation', 'contact', 'programme', 'fund', 'application', 'agreement', 'event']),
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  sort_by: z.string().optional(),
  limit: z.number().optional()
})

export const KPIQueryParamsSchema = z.object({
  programme_id: z.string().optional(),
  fund_id: z.string().optional(),
  org_id: z.string().optional(),
  category: z.enum(['impact', 'financial', 'operational', 'esg']).optional(),
  time_range: z.enum(['mtd', 'qtd', 'ytd', 'all']).optional()
})

export const EngagementQueryParamsSchema = z.object({
  channel: z.enum(['email', 'linkedin', 'event', 'website', 'newsletter']).optional(),
  segment: z.string().optional(),
  time_range: z.enum(['7d', '30d', '90d', '1y']).optional(),
  org_ids: z.array(z.string()).optional()
})

// Tool Definitions
export interface Tool {
  name: string
  description: string
  parameters: z.ZodType<any>
  execute: (params: any, context: any) => Promise<any>
}

// Query Intent Types
export type QueryIntent = 
  | 'programme_tracking'
  | 'risk_compliance'
  | 'engagement_analytics'
  | 'committee_briefing'
  | 'partner_search'
  | 'impact_reporting'
  | 'pipeline_analysis'
  | 'general_query'

// Response Types
export interface AIManagerResponse {
  answer: string[]
  metrics: Record<string, any>
  insights: string[]
  recommended_actions: Array<{
    action: string
    owner?: string
    eta?: string
    priority?: 'high' | 'medium' | 'low'
  }>
  sources: string[]
  confidence?: number
  query_understanding?: {
    intent: QueryIntent
    entities_detected: string[]
    time_context?: string
  }
}

export interface ToolResult {
  tool_name: string
  data: any
  error?: string
  execution_time_ms: number
}