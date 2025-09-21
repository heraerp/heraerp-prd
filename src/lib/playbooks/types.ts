/**
 * HERA Playbook System Type Definitions
 *
 * These types map to HERA's 6 sacred tables:
 * - Playbook definitions → core_entities
 * - Playbook runs → universal_transactions
 * - Step executions → universal_transaction_lines
 * - Relationships → core_relationships
 * - Extended properties → core_dynamic_data
 */

export interface CreatePlaybookRequest {
  organization_id: string
  industry: string
  module: string
  name: string
  version: string // V1, V2, etc.
  description?: string
  inputs: Record<string, any> // JSON Schema
  outputs: Record<string, any> // JSON Schema
  policies?: Record<string, any>
  sla_hours?: number
  permissions_required?: string[]
  steps: CreateStepDefinition[]
}

export interface CreateStepDefinition {
  name: string
  sequence: number
  description?: string
  worker_type: 'human' | 'ai' | 'system' | 'external'
  service_endpoint?: string // Required for system/external
  input_contract: Record<string, any> // JSON Schema
  output_contract: Record<string, any> // JSON Schema
  retry_policy?: {
    max_attempts?: number
    backoff_seconds?: number[]
  }
  sla_seconds?: number
  permissions_required?: string[]
  idempotency_key_rule?: string
  ai_model_preference?: 'gpt-4' | 'claude-3' | 'gemini-pro'
  human_skills_required?: string[]
}

export interface StartRunRequest {
  organization_id: string
  playbook_id: string
  subject_entity_id?: string // Optional business object
  inputs: Record<string, any>
  correlation_id?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export interface SignalRequest {
  type:
    | 'STEP_READY'
    | 'TIMEOUT_WARNING'
    | 'ESCALATION_REQUIRED'
    | 'EXTERNAL_UPDATE'
    | 'PAUSE_REQUESTED'
    | 'RESUME_REQUESTED'
  payload?: Record<string, any>
  timestamp?: string
}

export interface CompleteStepRequest {
  outputs: Record<string, any>
  ai_confidence?: number // 0-1
  ai_insights?: string
  worker_notes?: string
  actual_duration_ms?: number
}

export interface PlaybookResponse {
  id: string
  organization_id: string
  entity_code: string
  smart_code: string // e.g., HERA.GENERAL.PLAYBOOK.DEF.CUSTOMER_ONBOARDING.V1
  name: string
  version: string
  status: 'draft' | 'published' | 'archived'
  description?: string
  created_at: string
  updated_at: string
  published_at?: string
  metadata: Record<string, any>
}

export interface PlaybookDetailResponse extends PlaybookResponse {
  inputs: Record<string, any>
  outputs: Record<string, any>
  policies?: Record<string, any>
  sla_hours?: number
  permissions_required?: string[]
  steps: StepDefinitionResponse[]
}

export interface StepDefinitionResponse {
  id: string
  smart_code: string
  name: string
  sequence: number
  description?: string
  worker_type: string
  service_endpoint?: string
  input_contract: Record<string, any>
  output_contract: Record<string, any>
  sla_seconds?: number
  permissions_required?: string[]
}

export interface RunResponse {
  id: string
  organization_id: string
  transaction_code: string
  smart_code: string // e.g., HERA.GENERAL.PLAYBOOK.RUN.CUSTOMER_ONBOARDING.V1
  playbook_id: string
  playbook_name: string
  subject_entity_id?: string
  subject_entity_name?: string
  status: PlaybookRunStatus
  priority?: string
  total_steps: number
  completed_steps: number
  current_step_sequence?: number
  correlation_id?: string
  started_at?: string
  completed_at?: string
  metadata: Record<string, any>
}

export interface RunDetailResponse extends RunResponse {
  inputs: Record<string, any>
  outputs?: Record<string, any>
  error?: Record<string, any>
  blocked_reason?: string
  total_cost?: number
  ai_confidence?: number
  ai_insights?: string
  steps: StepExecutionResponse[]
}

export interface StepExecutionResponse {
  id: string
  sequence: number
  step_definition_id: string
  step_name: string
  smart_code: string // e.g., HERA.GENERAL.PLAYBOOK.STEP.EXEC.VERIFY_IDENTITY.V1
  status: StepExecutionStatus
  worker_type: string
  assignee?: string
  inputs: Record<string, any>
  outputs?: Record<string, any>
  error?: Record<string, any>
  attempt: number
  latency_ms?: number
  cost?: number
  started_at?: string
  completed_at?: string
  due_at?: string
  ai_confidence?: number
  ai_insights?: string
}

export type PlaybookRunStatus =
  | 'queued'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type StepExecutionStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'skipped'

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
    request_id?: string
  }
}

// Helper types for HERA table mappings

export interface PlaybookEntity {
  id: string
  organization_id: string
  entity_type: 'playbook_definition'
  entity_name: string
  entity_code: string
  smart_code: string
  metadata: {
    status: 'draft' | 'published' | 'archived'
    version: number
    owner?: string
    description?: string
    tags?: string[]
    created_at: string
    published_at?: string
  }
}

export interface StepEntity {
  id: string
  organization_id: string
  entity_type: 'playbook_step_definition'
  entity_name: string
  entity_code: string
  smart_code: string
  metadata: {
    playbook_id: string
    sequence: number
    description?: string
    critical?: boolean
    parallel_allowed?: boolean
  }
}

export interface PlaybookRunTransaction {
  id: string
  organization_id: string
  transaction_type: 'playbook_run'
  transaction_code: string
  smart_code: string
  reference_entity_id: string // playbook definition
  subject_entity_id?: string // business object
  total_amount?: number // total cost
  status: PlaybookRunStatus
  metadata: {
    inputs: Record<string, any>
    started_at?: string
    blocked_reason?: string
    error?: Record<string, any>
    ai_confidence?: number
    ai_insights?: string
  }
}

export interface StepExecutionLine {
  id: string
  transaction_id: string // playbook run
  line_number: number
  line_entity_id: string // step definition
  smart_code: string
  quantity: number // always 1
  unit_price?: number // cost per execution
  line_amount?: number // total cost
  metadata: {
    inputs: Record<string, any>
    outputs?: Record<string, any>
    status: StepExecutionStatus
    attempt: number
    error?: Record<string, any>
    latency_ms?: number
    worker_id?: string
    assignee?: string
    started_at?: string
    completed_at?: string
    due_at?: string
    ai_confidence?: number
    ai_insights?: string
  }
}

// Smart Code Patterns
export const PlaybookSmartCodes = {
  // Definition patterns
  playbookDef: (industry: string, name: string, version: string) =>
    `HERA.${industry}.PLAYBOOK.DEF.${name}.${version}`,

  stepDef: (industry: string, playbook: string, step: string, version: string) =>
    `HERA.${industry}.PLAYBOOK.STEP.DEF.${playbook}.${step}.${version}`,

  // Execution patterns
  playbookRun: (industry: string, playbook: string, defVersion: string) =>
    `HERA.${industry}.PLAYBOOK.RUN.${playbook}.${defVersion}`,

  stepExec: (industry: string, step: string, stepVersion: string) =>
    `HERA.${industry}.PLAYBOOK.STEP.EXEC.${step}.${stepVersion}`,

  // Relationship patterns (no industry prefix)
  relationships: {
    target: 'HERA.PLAYBOOK.TARGET.V1',
    hasStep: 'HERA.PLAYBOOK.HAS_STEP.V1',
    versionOf: 'HERA.PLAYBOOK.VERSION_OF.V1',
    runOf: 'HERA.PLAYBOOK.RUN_OF.V1',
    stepExecutes: 'HERA.PLAYBOOK.STEP.EXECUTES.V1'
  }
} as const
