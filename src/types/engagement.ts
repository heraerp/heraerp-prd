// Engagement types for journey pipeline and stage management

export type EngagementStageStatus = 'active' | 'inactive' | 'archived'

export type ScoringAction =
  | 'email_open'
  | 'email_click'
  | 'email_bounce'
  | 'email_unsubscribe'
  | 'event_register'
  | 'event_attend'
  | 'event_no_show'
  | 'social_like'
  | 'social_share'
  | 'social_comment'
  | 'form_submit'
  | 'phone_call'
  | 'meeting_scheduled'

export interface EngagementStage {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  // Dynamic data fields
  ordinal: number
  description?: string
  color?: string
  icon?: string
  entry_criteria?: StageCriteria
  exit_criteria?: StageCriteria
  scoring_rules?: ScoringRule[]
  status: EngagementStageStatus
  created_at: string
  updated_at: string
}

export interface StageCriteria {
  min_score?: number
  max_score?: number
  required_actions?: ScoringAction[]
  days_in_previous_stage?: number
  custom_rules?: Record<string, any>
}

export interface ScoringRule {
  action: ScoringAction
  points: number
  max_per_day?: number
  decay_rate?: number // Points decay over time
}

export interface EngagementJourney {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  subject_id: string // constituent or organization
  subject_type: 'constituent' | 'organization'
  subject_name?: string
  program_ids?: string[]
  // Dynamic data fields
  current_stage_id: string
  current_stage_name?: string
  entered_at: string
  score: number
  score_history?: ScoreEvent[]
  next_best_action?: NextBestAction
  stage_history?: StageTransition[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScoreEvent {
  timestamp: string
  action: ScoringAction
  points: number
  metadata?: Record<string, any>
}

export interface StageTransition {
  from_stage_id?: string
  from_stage_name?: string
  to_stage_id: string
  to_stage_name: string
  transitioned_at: string
  reason?: string
  score_at_transition?: number
}

export interface NextBestAction {
  action_type: string
  description: string
  priority: 'high' | 'medium' | 'low'
  suggested_at: string
  expires_at?: string
  metadata?: Record<string, any>
}

export interface EngagementFunnel {
  stages: FunnelStage[]
  total_journeys: number
  conversion_rate: number
  avg_time_to_convert: number // in days
}

export interface FunnelStage {
  stage_id: string
  stage_name: string
  count: number
  percentage: number
  avg_time_in_stage: number // in days
  conversion_rate?: number // to next stage
}

export interface EngagementFilters {
  program_ids?: string[]
  stage_ids?: string[]
  subject_type?: 'constituent' | 'organization'
  tags?: string[]
  score_range?: { min: number; max: number }
  date_range?: { from: string; to: string }
  is_active?: boolean
  page?: number
  page_size?: number
}

export interface UpdateScoreRequest {
  journey_id: string
  action: ScoringAction
  points?: number // Override default points
  metadata?: Record<string, any>
}

export interface TransitionStageRequest {
  journey_id: string
  to_stage_id: string
  reason?: string
  skip_criteria_check?: boolean
}

// Default engagement stages for initial setup
export const DEFAULT_STAGES: Partial<EngagementStage>[] = [
  {
    entity_name: 'Discover',
    ordinal: 1,
    description: 'Initial awareness and discovery phase',
    color: 'bg-gray-500',
    icon: 'search',
    entry_criteria: {
      min_score: 0
    },
    scoring_rules: [
      { action: 'email_open', points: 5 },
      { action: 'email_click', points: 10 },
      { action: 'form_submit', points: 15 }
    ]
  },
  {
    entity_name: 'Nurture',
    ordinal: 2,
    description: 'Building relationship and interest',
    color: 'bg-blue-500',
    icon: 'heart',
    entry_criteria: {
      min_score: 25
    },
    scoring_rules: [
      { action: 'email_open', points: 5 },
      { action: 'email_click', points: 10 },
      { action: 'event_register', points: 20 },
      { action: 'social_like', points: 3 },
      { action: 'social_share', points: 8 }
    ]
  },
  {
    entity_name: 'Active',
    ordinal: 3,
    description: 'Actively engaged and participating',
    color: 'bg-green-500',
    icon: 'zap',
    entry_criteria: {
      min_score: 100,
      required_actions: ['event_attend']
    },
    scoring_rules: [
      { action: 'email_open', points: 3 },
      { action: 'email_click', points: 8 },
      { action: 'event_attend', points: 30 },
      { action: 'meeting_scheduled', points: 25 }
    ]
  },
  {
    entity_name: 'Champion',
    ordinal: 4,
    description: 'Advocates and ambassadors',
    color: 'bg-purple-500',
    icon: 'star',
    entry_criteria: {
      min_score: 250,
      required_actions: ['event_attend', 'social_share']
    },
    scoring_rules: [
      { action: 'email_open', points: 2 },
      { action: 'email_click', points: 5 },
      { action: 'event_attend', points: 20 },
      { action: 'social_share', points: 15 },
      { action: 'social_comment', points: 10 }
    ]
  }
]
