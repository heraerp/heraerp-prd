/**
 * HERA Workflow Engine Types
 * Smart Code: HERA.WORKFLOW.ENGINE.TYPES.v1
 *
 * Type definitions for the HERA Workflow Engine
 * Built on the sacred 6-table architecture
 */

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  smart_code: string
  trigger: WorkflowTrigger
  variables: Record<string, WorkflowVariable>
  steps: WorkflowStep[]
  exception_handlers?: ExceptionHandler[]
  guardrails?: Guardrail[]
}

export interface WorkflowTrigger {
  type:
    | 'entity_created'
    | 'entity_updated'
    | 'transaction_created'
    | 'relationship_created'
    | 'scheduled'
    | 'manual'
  entity_type?: string
  transaction_type?: string
  relationship_type?: string
  smart_code_pattern?: string
  schedule?: string // cron expression
}

export interface WorkflowVariable {
  type: 'string' | 'number' | 'boolean' | 'datetime' | 'entity_id' | 'json'
  required: boolean
  default?: any
  validation?: string // regex or expression
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'action' | 'user_action' | 'conditional' | 'wait' | 'parallel' | 'loop'
  condition?: string // expression to evaluate
  actions?: WorkflowAction[]
  timeout?: {
    duration: string // e.g., '30m', '1h', '2d'
    action: string // step id to execute on timeout
    before?: boolean // execute before timeout
  }
  delay?: string // delay before executing step
  assigned_to?: string // for user_action steps
  error_handler?: Record<string, string> // error type -> handler step id
  guardrail?: StepGuardrail
}

export interface WorkflowAction {
  type:
    | 'create_entity'
    | 'update_entity'
    | 'create_relationship'
    | 'update_relationship'
    | 'create_transaction'
    | 'create_transaction_lines'
    | 'update_status'
    | 'send_notification'
    | 'process_payment'
    | 'capture_payment'
    | 'void_payment'
    | 'refund_payment'
    | 'call_api'
    | 'execute_script'
    | 'set_variable'

  // Action-specific parameters
  [key: string]: any
}

export interface ExceptionHandler {
  id: string
  trigger: string // event that triggers handler
  condition?: string // optional condition
  actions: WorkflowAction[]
  priority?: number
}

export interface Guardrail {
  id: string
  description: string
  condition: string // when to apply guardrail
  rule: string // rule to enforce
  action: 'block' | 'warn' | 'require_approval'
  error_message: string
  approval_roles?: string[] // for require_approval
}

export interface StepGuardrail {
  type: 'payment_required' | 'approval_required' | 'data_validation' | 'custom'
  [key: string]: any
}

export interface WorkflowInstance {
  id: string
  workflow_id: string
  organization_id: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'
  current_step_id: string
  variables: Record<string, any>
  started_at: Date
  completed_at?: Date
  started_by: string
  error?: string
}

export interface WorkflowStepExecution {
  id: string
  instance_id: string
  step_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  started_at?: Date
  completed_at?: Date
  result?: any
  error?: string
}

// Helper types for specific domains

export interface PaymentGuardrail extends StepGuardrail {
  type: 'payment_required'
  min_amount: string | number
  payment_types: ('preauth' | 'deposit' | 'full_payment')[]
  payment_methods?: ('card' | 'cash' | 'bank_transfer')[]
}

export interface ApprovalGuardrail extends StepGuardrail {
  type: 'approval_required'
  approval_roles: string[]
  min_approvals?: number
  escalation_after?: string // duration
}

export interface StatusTransition {
  from: string
  to: string
  allowed_roles?: string[]
  conditions?: string[]
  actions?: WorkflowAction[]
}
