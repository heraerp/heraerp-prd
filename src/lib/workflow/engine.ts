/**
 * HERA Workflow Engine
 * Smart Code: HERA.WORKFLOW.ENGINE.CORE.v1
 *
 * Core workflow execution engine using the sacred 6-table architecture
 * All workflow state is stored in universal tables with smart codes
 */

import { universalApi } from '@/src/lib/universal-api'
import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStep,
  WorkflowAction,
  WorkflowStepExecution,
  Guardrail
} from './types'

export class WorkflowEngine {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
    universalApi.setOrganizationId(organizationId)
  }

  /**
   * Execute a workflow
   */
  async execute(params: {
    workflow: WorkflowDefinition
    context: Record<string, any>
  }): Promise<WorkflowInstance> {
    const { workflow, context } = params

    // Create workflow instance in universal_transactions
    const instance = await this.createWorkflowInstance(workflow, context)

    try {
      // Execute steps sequentially (simplified for demo)
      for (const step of workflow.steps) {
        const result = await this.executeStep(step, instance)

        if (result.status === 'failed') {
          await this.handleStepFailure(step, instance, result.error)
          break
        }
      }

      // Mark workflow as completed
      await this.updateWorkflowStatus(instance.id, 'completed')
    } catch (error) {
      await this.updateWorkflowStatus(instance.id, 'failed', error.message)
      throw error
    }

    return instance
  }

  /**
   * Create workflow instance in universal_transactions
   */
  private async createWorkflowInstance(
    workflow: WorkflowDefinition,
    context: Record<string, any>
  ): Promise<WorkflowInstance> {
    const instanceData = {
      id: `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflow_id: workflow.id,
      organization_id: this.organizationId,
      status: 'running' as const,
      current_step_id: workflow.steps[0]?.id || '',
      variables: { ...workflow.variables, ...context },
      started_at: new Date(),
      started_by: context.started_by || 'system'
    }

    // Store in universal_transactions
    const txn = await universalApi.createTransaction({
      transaction_type: 'WORKFLOW_INSTANCE',
      smart_code: `HERA.WORKFLOW.INSTANCE.${workflow.id.toUpperCase()}.v1`,
      reference_number: instanceData.id,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      metadata: instanceData,
      organization_id: this.organizationId
    })

    return {
      ...instanceData,
      id: txn.data?.id || instanceData.id
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    instance: WorkflowInstance
  ): Promise<WorkflowStepExecution> {
    const execution: WorkflowStepExecution = {
      id: `STEP-${Date.now()}`,
      instance_id: instance.id,
      step_id: step.id,
      status: 'running',
      started_at: new Date()
    }

    try {
      // Check guardrails
      if (step.guardrail) {
        await this.checkGuardrail(step.guardrail, instance)
      }

      // Execute actions based on step type
      switch (step.type) {
        case 'action':
          await this.executeActions(step.actions || [], instance)
          break

        case 'user_action':
          await this.createUserTask(step, instance)
          break

        case 'conditional':
          if (this.evaluateCondition(step.condition || '', instance)) {
            await this.executeActions(step.actions || [], instance)
          }
          break

        case 'wait':
          await this.scheduleWait(step, instance)
          break
      }

      execution.status = 'completed'
      execution.completed_at = new Date()
    } catch (error) {
      execution.status = 'failed'
      execution.error = error.message
      throw error
    }

    // Store execution record
    await this.storeStepExecution(execution)

    return execution
  }

  /**
   * Execute workflow actions
   */
  private async executeActions(
    actions: WorkflowAction[],
    instance: WorkflowInstance
  ): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'create_entity':
          await universalApi.createEntity({
            entity_type: action.entity_type,
            entity_name: action.entity_name,
            smart_code: action.smart_code,
            organization_id: this.organizationId,
            metadata: action.metadata
          })
          break

        case 'create_relationship':
          await universalApi.createRelationship({
            from_entity_id: this.resolveVariable(action.from_entity_id, instance),
            to_entity_id: this.resolveVariable(action.to_entity_id, instance),
            relationship_type: action.relationship_type,
            smart_code: action.smart_code,
            is_active: action.is_active ?? true,
            effective_date: action.effective_date || new Date().toISOString(),
            organization_id: this.organizationId
          })
          break

        case 'update_status':
          // This is a special case that updates status via relationships
          await this.updateEntityStatus(
            this.resolveVariable(action.entity_id || instance.variables.appointment_id, instance),
            action.new_status
          )
          break

        case 'create_transaction':
          await universalApi.createTransaction({
            transaction_type: action.transaction_type,
            smart_code: action.smart_code,
            source_entity_id: this.resolveVariable(action.source_entity_id, instance),
            target_entity_id: this.resolveVariable(action.target_entity_id, instance),
            total_amount: this.resolveVariable(action.total_amount || 0, instance),
            transaction_date: new Date().toISOString(),
            organization_id: this.organizationId,
            metadata: action.metadata
          })
          break

        case 'send_notification':
          // This would integrate with notification service
          console.log(`Sending ${action.channel} notification to ${action.recipient}`)
          break

        // Add more action types as needed
      }
    }
  }

  /**
   * Update entity status using relationships
   */
  private async updateEntityStatus(entityId: string, newStatusSmartCode: string): Promise<void> {
    // Expire current status relationships
    const currentStatusRel = await universalApi.getRelationships({
      from_entity_id: entityId,
      relationship_type: 'HAS_STATUS',
      is_active: true,
      organization_id: this.organizationId
    })

    if (currentStatusRel.data && currentStatusRel.data.length > 0) {
      for (const rel of currentStatusRel.data) {
        await universalApi.updateRelationship(
          rel.id,
          {
            is_active: false,
            expiration_date: new Date().toISOString()
          },
          this.organizationId
        )
      }
    }

    // Get new status entity
    const statusEntity = await universalApi.getEntities('appointment_status', this.organizationId)
    const newStatus = statusEntity.data?.find(s => s.smart_code === newStatusSmartCode)

    if (newStatus) {
      // Create new status relationship
      await universalApi.createRelationship({
        from_entity_id: entityId,
        to_entity_id: newStatus.id,
        relationship_type: 'HAS_STATUS',
        smart_code: 'HERA.WORKFLOW.REL.HAS_STATUS.v1',
        is_active: true,
        effective_date: new Date().toISOString(),
        organization_id: this.organizationId
      })
    }
  }

  /**
   * Check guardrail conditions
   */
  private async checkGuardrail(guardrail: any, instance: WorkflowInstance): Promise<void> {
    if (guardrail.type === 'payment_required') {
      // Check for approved payment linked to appointment
      const appointmentId = instance.variables.appointment_id
      const paymentRels = await universalApi.getRelationships({
        from_entity_id: appointmentId,
        relationship_type: 'APPOINTMENT_LINKED_TO_PAYMENT',
        organization_id: this.organizationId
      })

      if (!paymentRels.data || paymentRels.data.length === 0) {
        throw new Error('Payment required before proceeding')
      }

      // Check payment status
      const paymentIds = paymentRels.data.map(r => r.to_entity_id)
      const payments = await universalApi.getTransactionsByIds(paymentIds, this.organizationId)

      const hasApprovedPayment = payments.data?.some(
        p => p.transaction_status === 'approved' || p.transaction_status === 'settled'
      )

      if (!hasApprovedPayment) {
        throw new Error('No approved payment found')
      }
    }
  }

  /**
   * Helper to resolve variables in action parameters
   */
  private resolveVariable(value: string, instance: WorkflowInstance): any {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const varName = value.slice(2, -1)
      return instance.variables[varName] || value
    }
    return value
  }

  /**
   * Evaluate conditions
   */
  private evaluateCondition(condition: string, instance: WorkflowInstance): boolean {
    // Simple evaluation - in production use a proper expression evaluator
    if (condition.includes('==')) {
      const [left, right] = condition.split('==').map(s => s.trim())
      const leftValue = this.resolveVariable(left, instance)
      const rightValue = this.resolveVariable(right, instance)
      return leftValue == rightValue
    }
    return true
  }

  /**
   * Create user task for manual actions
   */
  private async createUserTask(step: WorkflowStep, instance: WorkflowInstance): Promise<void> {
    // Create task entity
    await universalApi.createEntity({
      entity_type: 'workflow_task',
      entity_name: step.name,
      smart_code: `HERA.WORKFLOW.TASK.${step.id.toUpperCase()}.v1`,
      organization_id: this.organizationId,
      metadata: {
        workflow_instance_id: instance.id,
        step_id: step.id,
        assigned_to: step.assigned_to,
        due_date: step.timeout ? this.calculateDueDate(step.timeout.duration) : null
      }
    })
  }

  /**
   * Schedule wait step
   */
  private async scheduleWait(step: WorkflowStep, instance: WorkflowInstance): Promise<void> {
    // In production, this would create a scheduled job
    console.log(`Scheduling wait until ${step.wait_until || step.delay}`)
  }

  /**
   * Handle step failures
   */
  private async handleStepFailure(
    step: WorkflowStep,
    instance: WorkflowInstance,
    error?: string
  ): Promise<void> {
    if (step.error_handler && error) {
      const handlerStepId = step.error_handler[error] || step.error_handler['default']
      if (handlerStepId) {
        // Execute error handler step
        console.log(`Executing error handler: ${handlerStepId}`)
      }
    }
  }

  /**
   * Update workflow status
   */
  private async updateWorkflowStatus(
    instanceId: string,
    status: WorkflowInstance['status'],
    error?: string
  ): Promise<void> {
    // Update the workflow transaction
    console.log(`Updating workflow ${instanceId} status to ${status}`)
  }

  /**
   * Store step execution record
   */
  private async storeStepExecution(execution: WorkflowStepExecution): Promise<void> {
    // Store in universal_transactions
    await universalApi.createTransaction({
      transaction_type: 'WORKFLOW_STEP_EXECUTION',
      smart_code: `HERA.WORKFLOW.STEP.${execution.step_id.toUpperCase()}.v1`,
      reference_number: execution.id,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      metadata: execution,
      organization_id: this.organizationId
    })
  }

  /**
   * Calculate due date from duration string
   */
  private calculateDueDate(duration: string): Date {
    const now = new Date()
    const match = duration.match(/(\d+)([mhd])/)
    if (match) {
      const [, amount, unit] = match
      const value = parseInt(amount)
      switch (unit) {
        case 'm':
          now.setMinutes(now.getMinutes() + value)
          break
        case 'h':
          now.setHours(now.getHours() + value)
          break
        case 'd':
          now.setDate(now.getDate() + value)
          break
      }
    }
    return now
  }
}

// Export singleton instance
export async function execute(params: {
  workflow: WorkflowDefinition
  context: Record<string, any>
}): Promise<WorkflowInstance> {
  const engine = new WorkflowEngine(
    params.context.organization_id || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID!
  )
  return engine.execute(params)
}
