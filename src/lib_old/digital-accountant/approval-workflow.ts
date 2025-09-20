/**
 * 🔐 HERA Digital Accountant Approval Workflow
 *
 * Enterprise-grade approval workflows for accounting operations
 * Supports multi-level approvals with role-based routing
 *
 * Smart Code: HERA.FIN.ACCT.APPROVAL.v1
 */

import { supabase } from '@/lib/supabase'
import {
  ApprovalWorkflow,
  ApprovalStep,
  JournalEntry,
  JournalStatus,
  ValidationResult,
  ValidationError,
  ACCOUNTANT_SMART_CODES
} from '@/types/digital-accountant.types'
import { universalApi } from '@/lib/universal-api'

// ================================================================================
// APPROVAL WORKFLOW TYPES
// ================================================================================

export interface ApprovalRule {
  id: string
  rule_name: string
  entity_type: 'journal_entry' | 'payment' | 'adjustment'
  conditions: ApprovalCondition[]
  workflow_steps: WorkflowStepTemplate[]
  is_active: boolean
  priority: number
}

export interface ApprovalCondition {
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'contains'
  value: any
  join_operator?: 'AND' | 'OR'
}

export interface WorkflowStepTemplate {
  step_number: number
  approver_type: 'role' | 'user' | 'dynamic'
  approver_value: string // role name, user id, or dynamic rule
  approval_threshold?: number
  auto_approve_conditions?: ApprovalCondition[]
  escalation_hours?: number
  skip_conditions?: ApprovalCondition[]
}

export interface ApprovalRequest {
  entity_type: string
  entity_id: string
  requestor_id: string
  request_reason?: string
  metadata?: any
}

export interface ApprovalDecision {
  workflow_id: string
  step_number: number
  decision: 'approve' | 'reject' | 'return'
  comments: string
  approver_id: string
}

// ================================================================================
// STANDARD APPROVAL RULES
// ================================================================================

export const STANDARD_APPROVAL_RULES: ApprovalRule[] = [
  {
    id: 'journal_small_auto',
    rule_name: 'Small Journal Auto-Approval',
    entity_type: 'journal_entry',
    conditions: [{ field: 'metadata.total_debits', operator: 'less_than', value: 1000 }],
    workflow_steps: [
      {
        step_number: 1,
        approver_type: 'role',
        approver_value: 'system',
        auto_approve_conditions: [
          { field: 'metadata.validation_status', operator: 'equals', value: 'valid' }
        ]
      }
    ],
    is_active: true,
    priority: 100
  },
  {
    id: 'journal_medium_single',
    rule_name: 'Medium Journal Single Approval',
    entity_type: 'journal_entry',
    conditions: [
      { field: 'metadata.total_debits', operator: 'greater_than', value: 1000 },
      { field: 'metadata.total_debits', operator: 'less_than', value: 10000, join_operator: 'AND' }
    ],
    workflow_steps: [
      {
        step_number: 1,
        approver_type: 'role',
        approver_value: 'accountant',
        escalation_hours: 24
      }
    ],
    is_active: true,
    priority: 90
  },
  {
    id: 'journal_large_multi',
    rule_name: 'Large Journal Multi-Level Approval',
    entity_type: 'journal_entry',
    conditions: [{ field: 'metadata.total_debits', operator: 'greater_than', value: 10000 }],
    workflow_steps: [
      {
        step_number: 1,
        approver_type: 'role',
        approver_value: 'senior_accountant',
        escalation_hours: 12
      },
      {
        step_number: 2,
        approver_type: 'role',
        approver_value: 'finance_manager',
        approval_threshold: 50000,
        skip_conditions: [{ field: 'metadata.total_debits', operator: 'less_than', value: 50000 }]
      },
      {
        step_number: 3,
        approver_type: 'role',
        approver_value: 'cfo',
        approval_threshold: 100000,
        skip_conditions: [{ field: 'metadata.total_debits', operator: 'less_than', value: 100000 }]
      }
    ],
    is_active: true,
    priority: 80
  },
  {
    id: 'journal_adjustment_special',
    rule_name: 'Adjustment Entry Special Approval',
    entity_type: 'journal_entry',
    conditions: [{ field: 'smart_code', operator: 'contains', value: '.ADJUST.' }],
    workflow_steps: [
      {
        step_number: 1,
        approver_type: 'role',
        approver_value: 'controller',
        escalation_hours: 8
      }
    ],
    is_active: true,
    priority: 95
  }
]

// ================================================================================
// APPROVAL WORKFLOW SERVICE
// ================================================================================

export class ApprovalWorkflowService {
  private organizationId: string
  private userId: string

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId
    this.userId = userId
  }

  /**
   * Initialize approval workflow for an entity
   */
  async initializeWorkflow(request: ApprovalRequest): Promise<ApprovalWorkflow> {
    try {
      // Get the entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', request.entity_id)
        .eq('organization_id', this.organizationId)
        .single()

      if (entityError || !entity) {
        throw new Error('Entity not found')
      }

      // Find matching approval rule
      const rule = await this.findMatchingRule(entity, request.entity_type)
      if (!rule) {
        throw new Error('No approval rule found for this entity')
      }

      // Create workflow instance
      const workflowId = await this.createWorkflowInstance(entity, rule, request)

      // Initialize workflow steps
      const steps = await this.initializeWorkflowSteps(workflowId, rule, entity)

      // Check for auto-approval on first step
      await this.checkAutoApproval(workflowId, steps[0], entity)

      return {
        workflow_id: workflowId,
        current_step: 1,
        total_steps: steps.length,
        steps,
        status: 'active'
      }
    } catch (error) {
      console.error('Error initializing workflow:', error)
      throw error
    }
  }

  /**
   * Process approval decision
   */
  async processApproval(decision: ApprovalDecision): Promise<void> {
    try {
      // Get workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', decision.workflow_id)
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'approval_workflow')
        .single()

      if (workflowError || !workflow) {
        throw new Error('Workflow not found')
      }

      // Validate approver
      const currentStep = workflow.metadata.steps[decision.step_number - 1]
      if (!(await this.validateApprover(decision.approver_id, currentStep))) {
        throw new Error('User is not authorized to approve this step')
      }

      // Update step status
      await this.updateStepStatus(
        decision.workflow_id,
        decision.step_number,
        decision.decision,
        decision.approver_id,
        decision.comments
      )

      // Process based on decision
      switch (decision.decision) {
        case 'approve':
          await this.handleApproval(workflow, decision)
          break

        case 'reject':
          await this.handleRejection(workflow, decision)
          break

        case 'return':
          await this.handleReturn(workflow, decision)
          break
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      throw error
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId: string): Promise<any[]> {
    try {
      // Get user's roles
      const userRoles = await this.getUserRoles(userId)

      // Query pending approvals
      const { data: pendingWorkflows, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'approval_workflow')
        .eq('metadata->>status', 'active')

      if (error || !pendingWorkflows) {
        return []
      }

      // Filter for user's pending items
      const userPendingApprovals = pendingWorkflows.filter(workflow => {
        const currentStep = workflow.metadata.steps[workflow.metadata.current_step - 1]

        // Check if user is the approver
        if (currentStep.status === 'pending') {
          if (currentStep.approver_entity_id === userId) {
            return true
          }

          // Check role-based approval
          if (currentStep.approver_role && userRoles.includes(currentStep.approver_role)) {
            return true
          }
        }

        return false
      })

      // Enrich with entity details
      const enrichedApprovals = await Promise.all(
        userPendingApprovals.map(async workflow => {
          const { data: entity } = await supabase
            .from('core_entities')
            .select('*')
            .eq('id', workflow.metadata.entity_id)
            .single()

          return {
            workflow_id: workflow.id,
            entity_type: workflow.metadata.entity_type,
            entity_id: workflow.metadata.entity_id,
            entity_details: entity,
            current_step: workflow.metadata.current_step,
            total_steps: workflow.metadata.total_steps,
            requested_by: workflow.metadata.requested_by,
            requested_at: workflow.created_at,
            priority: workflow.metadata.priority || 'normal'
          }
        })
      )

      return enrichedApprovals
    } catch (error) {
      console.error('Error getting pending approvals:', error)
      return []
    }
  }

  /**
   * Check workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<ApprovalWorkflow | null> {
    try {
      const { data: workflow, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', workflowId)
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'approval_workflow')
        .single()

      if (error || !workflow) {
        return null
      }

      return {
        workflow_id: workflow.id,
        current_step: workflow.metadata.current_step,
        total_steps: workflow.metadata.total_steps,
        steps: workflow.metadata.steps,
        status: workflow.metadata.status
      }
    } catch (error) {
      console.error('Error getting workflow status:', error)
      return null
    }
  }

  // ================================================================================
  // PRIVATE HELPER METHODS
  // ================================================================================

  private async findMatchingRule(entity: any, entityType: string): Promise<ApprovalRule | null> {
    // Get all active rules for entity type
    const rules = STANDARD_APPROVAL_RULES.filter(
      rule => rule.entity_type === entityType && rule.is_active
    ).sort((a, b) => b.priority - a.priority)

    // Find first matching rule
    for (const rule of rules) {
      if (await this.evaluateRuleConditions(rule.conditions, entity)) {
        return rule
      }
    }

    return null
  }

  private async evaluateRuleConditions(
    conditions: ApprovalCondition[],
    entity: any
  ): Promise<boolean> {
    let result = true
    let previousOperator: 'AND' | 'OR' = 'AND'

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, entity)

      if (previousOperator === 'AND') {
        result = result && conditionResult
      } else {
        result = result || conditionResult
      }

      previousOperator = condition.join_operator || 'AND'
    }

    return result
  }

  private evaluateCondition(condition: ApprovalCondition, entity: any): boolean {
    const fieldValue = this.getFieldValue(entity, condition.field)

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value

      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)

      case 'less_than':
        return Number(fieldValue) < Number(condition.value)

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)

      case 'contains':
        return String(fieldValue).includes(String(condition.value))

      default:
        return false
    }
  }

  private getFieldValue(object: any, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let value = object

    for (const part of parts) {
      value = value?.[part]
      if (value === undefined) break
    }

    return value
  }

  private async createWorkflowInstance(
    entity: any,
    rule: ApprovalRule,
    request: ApprovalRequest
  ): Promise<string> {
    const { data: workflow, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: this.organizationId,
        entity_type: 'approval_workflow',
        entity_name: `Approval for ${entity.entity_name}`,
        smart_code: 'HERA.FIN.ACCT.APPROVAL.WORKFLOW.V1',
        metadata: {
          entity_type: request.entity_type,
          entity_id: request.entity_id,
          rule_id: rule.id,
          rule_name: rule.rule_name,
          requested_by: request.requestor_id,
          request_reason: request.request_reason,
          current_step: 1,
          total_steps: rule.workflow_steps.length,
          status: 'active',
          steps: [],
          ...request.metadata
        },
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return workflow.id
  }

  private async initializeWorkflowSteps(
    workflowId: string,
    rule: ApprovalRule,
    entity: any
  ): Promise<ApprovalStep[]> {
    const steps: ApprovalStep[] = []

    for (const stepTemplate of rule.workflow_steps) {
      // Check skip conditions
      if (
        stepTemplate.skip_conditions &&
        (await this.evaluateRuleConditions(stepTemplate.skip_conditions, entity))
      ) {
        steps.push({
          step_number: stepTemplate.step_number,
          approver_role: stepTemplate.approver_value,
          approval_threshold: stepTemplate.approval_threshold,
          status: 'skipped',
          comments: 'Skipped based on conditions'
        })
        continue
      }

      // Resolve approver
      let approverEntityId: string | undefined
      let approverRole: string | undefined

      switch (stepTemplate.approver_type) {
        case 'role':
          approverRole = stepTemplate.approver_value
          // Could resolve to specific user if needed
          break

        case 'user':
          approverEntityId = stepTemplate.approver_value
          break

        case 'dynamic':
          // Resolve based on dynamic rule
          approverEntityId = await this.resolveDynamicApprover(stepTemplate.approver_value, entity)
          break
      }

      steps.push({
        step_number: stepTemplate.step_number,
        approver_role: approverRole || '',
        approver_entity_id: approverEntityId,
        approval_threshold: stepTemplate.approval_threshold,
        status: stepTemplate.step_number === 1 ? 'pending' : 'waiting',
        comments: ''
      })
    }

    // Update workflow with steps
    await supabase
      .from('core_entities')
      .update({
        metadata: {
          steps
        }
      })
      .eq('id', workflowId)
      .eq('organization_id', this.organizationId)

    return steps
  }

  private async checkAutoApproval(
    workflowId: string,
    step: ApprovalStep,
    entity: any
  ): Promise<void> {
    // Check if system auto-approval
    if (step.approver_role === 'system') {
      await this.processApproval({
        workflow_id: workflowId,
        step_number: step.step_number,
        decision: 'approve',
        comments: 'Auto-approved by system based on rules',
        approver_id: 'system'
      })
    }
  }

  private async validateApprover(approverId: string, step: ApprovalStep): Promise<boolean> {
    // System always valid
    if (approverId === 'system') return true

    // Check direct assignment
    if (step.approver_entity_id === approverId) return true

    // Check role assignment
    if (step.approver_role) {
      const userRoles = await this.getUserRoles(approverId)
      return userRoles.includes(step.approver_role)
    }

    return false
  }

  private async updateStepStatus(
    workflowId: string,
    stepNumber: number,
    status: string,
    approverId: string,
    comments: string
  ): Promise<void> {
    const { data: workflow } = await supabase
      .from('core_entities')
      .select('metadata')
      .eq('id', workflowId)
      .single()

    if (workflow) {
      const steps = workflow.metadata.steps
      steps[stepNumber - 1] = {
        ...steps[stepNumber - 1],
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        comments
      }

      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...workflow.metadata,
            steps
          }
        })
        .eq('id', workflowId)
    }
  }

  private async handleApproval(workflow: any, decision: ApprovalDecision): Promise<void> {
    const currentStep = decision.step_number
    const totalSteps = workflow.metadata.total_steps

    if (currentStep === totalSteps) {
      // Final approval - complete workflow
      await this.completeWorkflow(workflow.id, 'approved')

      // Update entity status
      await this.updateEntityStatus(
        workflow.metadata.entity_id,
        workflow.metadata.entity_type,
        'approved'
      )
    } else {
      // Move to next step
      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...workflow.metadata,
            current_step: currentStep + 1
          }
        })
        .eq('id', workflow.id)

      // Update next step to pending
      await this.updateStepStatus(workflow.id, currentStep + 1, 'pending', '', '')
    }
  }

  private async handleRejection(workflow: any, decision: ApprovalDecision): Promise<void> {
    // Complete workflow as rejected
    await this.completeWorkflow(workflow.id, 'rejected')

    // Update entity status
    await this.updateEntityStatus(
      workflow.metadata.entity_id,
      workflow.metadata.entity_type,
      'rejected'
    )
  }

  private async handleReturn(workflow: any, decision: ApprovalDecision): Promise<void> {
    // Set workflow status to returned
    await supabase
      .from('core_entities')
      .update({
        metadata: {
          ...workflow.metadata,
          status: 'returned',
          returned_by: decision.approver_id,
          returned_at: new Date().toISOString(),
          return_comments: decision.comments
        }
      })
      .eq('id', workflow.id)

    // Update entity status
    await this.updateEntityStatus(
      workflow.metadata.entity_id,
      workflow.metadata.entity_type,
      'draft'
    )
  }

  private async completeWorkflow(workflowId: string, finalStatus: string): Promise<void> {
    await supabase
      .from('core_entities')
      .update({
        metadata: {
          status: finalStatus,
          completed_at: new Date().toISOString()
        },
        status: 'completed'
      })
      .eq('id', workflowId)
  }

  private async updateEntityStatus(
    entityId: string,
    entityType: string,
    newStatus: string
  ): Promise<void> {
    if (entityType === 'journal_entry') {
      const statusMap: Record<string, JournalStatus> = {
        approved: 'approved',
        rejected: 'cancelled',
        draft: 'draft'
      }

      const { data: entity } = await supabase
        .from('core_entities')
        .select('metadata')
        .eq('id', entityId)
        .single()

      if (entity) {
        await supabase
          .from('core_entities')
          .update({
            metadata: {
              ...entity.metadata,
              status: statusMap[newStatus] || 'draft'
            }
          })
          .eq('id', entityId)
      }
    }
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    // Get user entity
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('metadata')
      .eq('id', userId)
      .eq('organization_id', this.organizationId)
      .single()

    if (userEntity?.metadata?.roles) {
      return userEntity.metadata.roles
    }

    // Get from relationships
    const { data: roleRelationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'has_role')
      .eq('organization_id', this.organizationId)

    if (roleRelationships) {
      // Would need to resolve role entities
      return ['user'] // Default role
    }

    return ['user']
  }

  private async resolveDynamicApprover(rule: string, entity: any): Promise<string> {
    // Implement dynamic approver resolution
    // e.g., "manager_of_creator", "department_head", etc.
    return 'system' // Fallback
  }
}
