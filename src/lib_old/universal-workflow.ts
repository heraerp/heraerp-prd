/**
 * Universal Workflow Engine for HERA
 * Provides workflow management for any transaction type
 */

import { universalApi } from './universal-api'

export interface WorkflowStage {
  code: string
  name: string
  order: number
  isInitial?: boolean
  isFinal?: boolean
  color?: string
  icon?: string
}

export interface WorkflowTransition {
  from: string
  to: string
  requiresApproval?: boolean
  automatic?: boolean
  requiresAction?: string
  requiresConfirmation?: boolean
}

export interface WorkflowTemplate {
  name: string
  code: string
  stages: WorkflowStage[]
  transitions: WorkflowTransition[]
  entityTypes?: string[]
  autoAssign?: boolean
}

export class UniversalWorkflow {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Create a workflow template with stages and transitions
   */
  async createWorkflowTemplate(config: WorkflowTemplate) {
    try {
      // Create workflow entity
      const workflow = await universalApi.createEntity({
        entity_type: 'workflow_template',
        entity_name: config.name,
        entity_code: config.code,
        smart_code: `HERA.WORKFLOW.TEMPLATE.${config.code.toUpperCase()}.v1`,
        organization_id: this.organizationId,
        metadata: {
          entity_types: config.entityTypes,
          auto_assign: config.autoAssign,
          transitions: config.transitions
        }
      })

      // Create status entities for each stage
      const statusMap = new Map<string, string>()

      for (const stage of config.stages) {
        const status = await universalApi.createEntity({
          entity_type: 'workflow_status',
          entity_name: stage.name,
          entity_code: `STATUS-${stage.code}`,
          smart_code: `HERA.WORKFLOW.STATUS.${stage.code.toUpperCase()}.v1`,
          organization_id: this.organizationId,
          metadata: {
            color: stage.color || this.getDefaultColor(stage.order),
            icon: stage.icon || 'circle',
            order: stage.order,
            is_initial: stage.isInitial || false,
            is_final: stage.isFinal || false
          }
        })

        statusMap.set(stage.code, status.id)

        // Link status to workflow
        await universalApi.createRelationship({
          from_entity_id: workflow.id,
          to_entity_id: status.id,
          relationship_type: 'has_stage',
          organization_id: this.organizationId,
          smart_code: 'HERA.WORKFLOW.STAGE.LINK.v1',
          relationship_data: {
            order: stage.order,
            is_initial: stage.isInitial,
            is_final: stage.isFinal
          }
        })
      }

      // Create transition relationships
      for (const transition of config.transitions) {
        const fromStatusId = statusMap.get(transition.from)
        const toStatusId = statusMap.get(transition.to)

        if (fromStatusId && toStatusId) {
          await universalApi.createRelationship({
            from_entity_id: fromStatusId,
            to_entity_id: toStatusId,
            relationship_type: 'can_transition_to',
            organization_id: this.organizationId,
            smart_code: 'HERA.WORKFLOW.TRANSITION.ALLOWED.v1',
            relationship_data: {
              requires_approval: transition.requiresApproval || false,
              automatic: transition.automatic || false,
              requires_action: transition.requiresAction,
              requires_confirmation: transition.requiresConfirmation || false
            }
          })
        }
      }

      return workflow
    } catch (error) {
      console.error('Failed to create workflow template:', error)
      throw error
    }
  }

  /**
   * Assign workflow to a transaction
   */
  async assignWorkflow(transactionId: string, workflowTemplateId: string) {
    try {
      // Get initial status
      const initialStatus = await this.getInitialStatus(workflowTemplateId)

      if (!initialStatus) {
        throw new Error('No initial status found for workflow')
      }

      // Create relationship
      await universalApi.createRelationship({
        from_entity_id: transactionId,
        to_entity_id: initialStatus.id,
        relationship_type: 'has_workflow_status',
        organization_id: this.organizationId,
        smart_code: 'HERA.WORKFLOW.ASSIGN.INITIAL.v1',
        relationship_data: {
          workflow_template_id: workflowTemplateId,
          started_at: new Date().toISOString(),
          is_active: true
        }
      })

      return initialStatus
    } catch (error) {
      console.error('Failed to assign workflow:', error)
      throw error
    }
  }

  /**
   * Transition to a new status
   */
  async transitionStatus(
    transactionId: string,
    newStatusId: string,
    context: {
      reason?: string
      userId: string
      metadata?: any
    }
  ) {
    try {
      // Get current status
      const currentStatus = await this.getCurrentStatus(transactionId)

      if (!currentStatus) {
        throw new Error('No current status found')
      }

      // Validate transition
      const canTransition = await this.validateTransition(currentStatus.id, newStatusId)

      if (!canTransition) {
        throw new Error('Invalid status transition')
      }

      // End current status relationship
      await this.endCurrentStatus(transactionId, currentStatus.id)

      // Create new status relationship
      await universalApi.createRelationship({
        from_entity_id: transactionId,
        to_entity_id: newStatusId,
        relationship_type: 'has_workflow_status',
        organization_id: this.organizationId,
        smart_code: 'HERA.WORKFLOW.TRANSITION.v1',
        relationship_data: {
          previous_status_id: currentStatus.id,
          transitioned_by: context.userId,
          reason: context.reason,
          transitioned_at: new Date().toISOString(),
          is_active: true,
          ...context.metadata
        }
      })

      // Trigger any automated actions
      await this.triggerWorkflowActions(transactionId, newStatusId)

      return newStatusId
    } catch (error) {
      console.error('Failed to transition status:', error)
      throw error
    }
  }

  /**
   * Get current workflow status
   */
  async getCurrentStatus(transactionId: string) {
    try {
      const relationships = await universalApi.query({
        table: 'core_relationships',
        filters: {
          from_entity_id: transactionId,
          relationship_type: 'has_workflow_status',
          'relationship_data->is_active': true
        },
        limit: 1
      })

      if (!relationships || relationships.length === 0) {
        return null
      }

      // Get the status entity
      const status = await universalApi.getEntity(relationships[0].to_entity_id)
      return status
    } catch (error) {
      console.error('Failed to get current status:', error)
      return null
    }
  }

  /**
   * Get workflow history
   */
  async getWorkflowHistory(transactionId: string) {
    try {
      const relationships = await universalApi.query({
        table: 'core_relationships',
        filters: {
          from_entity_id: transactionId,
          relationship_type: 'has_workflow_status'
        },
        orderBy: { created_at: 'desc' }
      })

      const history = []

      for (const rel of relationships) {
        const status = await universalApi.getEntity(rel.to_entity_id)
        history.push({
          statusId: rel.to_entity_id,
          statusName: status.entity_name,
          statusCode: status.entity_code,
          assignedAt: rel.relationship_data?.transitioned_at || rel.created_at,
          assignedBy: rel.relationship_data?.transitioned_by || rel.relationship_data?.assigned_by,
          reason: rel.relationship_data?.reason,
          isActive: rel.relationship_data?.is_active || false,
          metadata: rel.relationship_data
        })
      }

      return history
    } catch (error) {
      console.error('Failed to get workflow history:', error)
      return []
    }
  }

  /**
   * Get available transitions from current status
   */
  async getAvailableTransitions(transactionId: string) {
    try {
      const currentStatus = await this.getCurrentStatus(transactionId)

      if (!currentStatus) {
        return []
      }

      // Get allowed transitions
      const transitions = await universalApi.query({
        table: 'core_relationships',
        filters: {
          from_entity_id: currentStatus.id,
          relationship_type: 'can_transition_to'
        }
      })

      const availableStatuses = []

      for (const transition of transitions) {
        const status = await universalApi.getEntity(transition.to_entity_id)
        availableStatuses.push({
          id: status.id,
          name: status.entity_name,
          code: status.entity_code,
          metadata: {
            ...status.metadata,
            transition: transition.relationship_data
          }
        })
      }

      return availableStatuses
    } catch (error) {
      console.error('Failed to get available transitions:', error)
      return []
    }
  }

  /**
   * Private helper methods
   */

  private async getInitialStatus(workflowTemplateId: string) {
    const stages = await universalApi.query({
      table: 'core_relationships',
      filters: {
        from_entity_id: workflowTemplateId,
        relationship_type: 'has_stage',
        'relationship_data->is_initial': true
      },
      limit: 1
    })

    if (!stages || stages.length === 0) {
      return null
    }

    return await universalApi.getEntity(stages[0].to_entity_id)
  }

  private async validateTransition(fromStatusId: string, toStatusId: string) {
    const transitions = await universalApi.query({
      table: 'core_relationships',
      filters: {
        from_entity_id: fromStatusId,
        to_entity_id: toStatusId,
        relationship_type: 'can_transition_to'
      }
    })

    return transitions && transitions.length > 0
  }

  private async endCurrentStatus(transactionId: string, statusId: string) {
    // Update the current active status to inactive
    const relationships = await universalApi.query({
      table: 'core_relationships',
      filters: {
        from_entity_id: transactionId,
        to_entity_id: statusId,
        relationship_type: 'has_workflow_status',
        'metadata->is_active': true
      }
    })

    for (const rel of relationships) {
      await universalApi.updateRelationship(rel.id, {
        relationship_data: {
          ...rel.relationship_data,
          is_active: false,
          ended_at: new Date().toISOString()
        }
      })
    }
  }

  private async triggerWorkflowActions(transactionId: string, statusId: string) {
    // This could trigger notifications, automated processes, etc.
    // For now, just log the transition
    console.log(`Workflow action triggered for transaction ${transactionId} to status ${statusId}`)
  }

  private getDefaultColor(order: number): string {
    const colors = [
      '#6B7280', // gray
      '#3B82F6', // blue
      '#8B5CF6', // violet
      '#06B6D4', // cyan
      '#10B981', // emerald
      '#F59E0B', // amber
      '#EF4444', // red
      '#EC4899' // pink
    ]

    return colors[order % colors.length]
  }
}

/**
 * Predefined workflow templates
 */
export const WORKFLOW_TEMPLATES = {
  SALES_ORDER: {
    name: 'Sales Order Workflow',
    code: 'SALES-ORDER',
    stages: [
      { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true, color: '#6B7280' },
      { code: 'SUBMITTED', name: 'Submitted', order: 2, color: '#3B82F6' },
      { code: 'APPROVED', name: 'Approved', order: 3, color: '#10B981' },
      { code: 'PROCESSING', name: 'Processing', order: 4, color: '#F59E0B' },
      { code: 'SHIPPED', name: 'Shipped', order: 5, color: '#8B5CF6' },
      { code: 'DELIVERED', name: 'Delivered', order: 6, isFinal: true, color: '#10B981' }
    ],
    transitions: [
      { from: 'DRAFT', to: 'SUBMITTED' },
      { from: 'SUBMITTED', to: 'APPROVED', requiresApproval: true },
      { from: 'SUBMITTED', to: 'REJECTED' },
      { from: 'APPROVED', to: 'PROCESSING', automatic: true },
      { from: 'PROCESSING', to: 'SHIPPED' },
      { from: 'SHIPPED', to: 'DELIVERED' }
    ]
  },

  APPOINTMENT: {
    name: 'Appointment Workflow',
    code: 'APPOINTMENT',
    stages: [
      { code: 'SCHEDULED', name: 'Scheduled', order: 1, isInitial: true, color: '#6B7280' },
      { code: 'CONFIRMED', name: 'Confirmed', order: 2, color: '#3B82F6' },
      { code: 'CHECKED_IN', name: 'Checked In', order: 3, color: '#06B6D4' },
      { code: 'IN_SERVICE', name: 'In Service', order: 4, color: '#F59E0B' },
      { code: 'COMPLETED', name: 'Completed', order: 5, color: '#10B981' },
      { code: 'PAID', name: 'Paid', order: 6, isFinal: true, color: '#10B981' },
      { code: 'CANCELLED', name: 'Cancelled', order: 7, isFinal: true, color: '#EF4444' },
      { code: 'NO_SHOW', name: 'No Show', order: 8, isFinal: true, color: '#EF4444' }
    ],
    transitions: [
      { from: 'SCHEDULED', to: 'CONFIRMED' },
      { from: 'SCHEDULED', to: 'CANCELLED' },
      { from: 'CONFIRMED', to: 'CHECKED_IN' },
      { from: 'CONFIRMED', to: 'NO_SHOW' },
      { from: 'CHECKED_IN', to: 'IN_SERVICE' },
      { from: 'IN_SERVICE', to: 'COMPLETED' },
      { from: 'COMPLETED', to: 'PAID' }
    ]
  },

  INVOICE: {
    name: 'Invoice Workflow',
    code: 'INVOICE',
    stages: [
      { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true, color: '#6B7280' },
      { code: 'SENT', name: 'Sent', order: 2, color: '#3B82F6' },
      { code: 'VIEWED', name: 'Viewed', order: 3, color: '#8B5CF6' },
      { code: 'PARTIALLY_PAID', name: 'Partially Paid', order: 4, color: '#F59E0B' },
      { code: 'PAID', name: 'Paid', order: 5, isFinal: true, color: '#10B981' },
      { code: 'OVERDUE', name: 'Overdue', order: 6, color: '#EF4444' },
      { code: 'VOID', name: 'Void', order: 7, isFinal: true, color: '#6B7280' }
    ],
    transitions: [
      { from: 'DRAFT', to: 'SENT' },
      { from: 'SENT', to: 'VIEWED' },
      { from: 'VIEWED', to: 'PARTIALLY_PAID' },
      { from: 'VIEWED', to: 'PAID' },
      { from: 'PARTIALLY_PAID', to: 'PAID' },
      { from: 'SENT', to: 'OVERDUE' },
      { from: 'VIEWED', to: 'OVERDUE' },
      { from: 'DRAFT', to: 'VOID' }
    ]
  }
}
