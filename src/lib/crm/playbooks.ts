/**
 * HERA CRM Playbooks System
 * Smart Code: HERA.CRM.PLAYBOOKS.ENGINE.V1
 * 
 * Automated workflows and business rule engine for CRM operations
 * Triggers actions based on entity changes, relationship updates, and time-based events
 */

import { CRM_ENTITY_CODES, CRM_TRANSACTION_CODES, CRM_RELATIONSHIP_CODES } from './smart-codes'
import { CRMClient } from './api'

export type PlaybookTrigger = 
  | 'entity_created'
  | 'entity_updated'
  | 'relationship_created'
  | 'field_changed'
  | 'stage_changed'
  | 'time_based'
  | 'score_threshold'

export type PlaybookCondition = {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'not_exists'
  value: any
  entity_type?: string
}

export type PlaybookAction = {
  type: 'create_task' | 'send_email' | 'update_field' | 'create_activity' | 'assign_owner' | 'add_to_sequence' | 'webhook' | 'score_update'
  config: Record<string, any>
  delay_minutes?: number
}

export interface CRMPlaybook {
  id: string
  name: string
  description: string
  trigger: PlaybookTrigger
  entity_type: keyof typeof CRM_ENTITY_CODES
  conditions: PlaybookCondition[]
  actions: PlaybookAction[]
  enabled: boolean
  priority: number
  created_by: string
  created_at: string
  last_executed?: string
  execution_count: number
}

/**
 * Built-in CRM Playbooks
 */
export const DEFAULT_CRM_PLAYBOOKS: Omit<CRMPlaybook, 'id' | 'created_by' | 'created_at' | 'last_executed' | 'execution_count'>[] = [
  // Lead Qualification Playbook
  {
    name: 'Auto-Qualify High-Value Leads',
    description: 'Automatically qualify leads with budget > $50k and mark as hot',
    trigger: 'entity_created',
    entity_type: 'LEAD',
    conditions: [
      { field: 'budget', operator: 'greater_than', value: 50000 }
    ],
    actions: [
      {
        type: 'update_field',
        config: {
          field: 'status',
          value: 'Qualified'
        }
      },
      {
        type: 'score_update',
        config: {
          field: 'score',
          value: 85
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Follow up with high-value lead',
          due_hours: 24,
          priority: 'High',
          description: 'This lead has a budget over $50k - prioritize immediate follow-up'
        }
      }
    ],
    enabled: true,
    priority: 1
  },

  // Lead Nurturing Sequence
  {
    name: 'Lead Nurturing Sequence',
    description: 'Start nurturing sequence for new leads without immediate qualification',
    trigger: 'entity_created',
    entity_type: 'LEAD',
    conditions: [
      { field: 'status', operator: 'equals', value: 'New' },
      { field: 'budget', operator: 'less_than', value: 25000 }
    ],
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Send welcome email to new lead',
          due_hours: 2,
          priority: 'Normal'
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Schedule qualification call',
          due_hours: 72,
          priority: 'Normal'
        },
        delay_minutes: 1440 // 24 hours later
      },
      {
        type: 'add_to_sequence',
        config: {
          sequence_name: 'lead_nurturing_30_days',
          start_delay_hours: 48
        }
      }
    ],
    enabled: true,
    priority: 2
  },

  // Opportunity Stage Automation
  {
    name: 'Proposal Stage Actions',
    description: 'Auto-create tasks when opportunity reaches proposal stage',
    trigger: 'field_changed',
    entity_type: 'OPPORTUNITY',
    conditions: [
      { field: 'stage', operator: 'equals', value: 'Proposal' }
    ],
    actions: [
      {
        type: 'update_field',
        config: {
          field: 'probability',
          value: 75
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Prepare and send proposal',
          due_hours: 48,
          priority: 'High',
          description: 'Create customized proposal for this opportunity'
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Schedule proposal review meeting',
          due_hours: 72,
          priority: 'Normal'
        }
      },
      {
        type: 'create_activity',
        config: {
          type: 'Note',
          subject: 'Opportunity moved to Proposal stage',
          description: 'Opportunity has progressed to proposal stage - next steps automated'
        }
      }
    ],
    enabled: true,
    priority: 1
  },

  // Overdue Opportunity Alert
  {
    name: 'Overdue Opportunity Alert',
    description: 'Alert when opportunities pass their close date without being closed',
    trigger: 'time_based',
    entity_type: 'OPPORTUNITY',
    conditions: [
      { field: 'stage', operator: 'not_equals', value: 'Closed Won' },
      { field: 'stage', operator: 'not_equals', value: 'Closed Lost' },
      { field: 'close_date', operator: 'less_than', value: 'TODAY' }
    ],
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Update overdue opportunity',
          due_hours: 4,
          priority: 'Urgent',
          description: 'This opportunity is past its close date - update status or extend timeline'
        }
      },
      {
        type: 'send_email',
        config: {
          template: 'overdue_opportunity_alert',
          to: 'opportunity_owner',
          subject: 'Overdue Opportunity Alert'
        }
      }
    ],
    enabled: true,
    priority: 1
  },

  // Contact Role Assignment
  {
    name: 'Decision Maker Follow-up',
    description: 'Create high-priority tasks for decision maker contacts',
    trigger: 'field_changed',
    entity_type: 'CONTACT',
    conditions: [
      { field: 'contact_role', operator: 'equals', value: 'Decision Maker' }
    ],
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Schedule meeting with decision maker',
          due_hours: 48,
          priority: 'High',
          description: 'This contact is identified as a decision maker - prioritize engagement'
        }
      },
      {
        type: 'score_update',
        config: {
          field: 'importance',
          value: 95
        }
      }
    ],
    enabled: true,
    priority: 1
  },

  // Account Value Tracking
  {
    name: 'High-Value Account Alert',
    description: 'Flag high-value accounts for executive attention',
    trigger: 'entity_created',
    entity_type: 'ACCOUNT',
    conditions: [
      { field: 'annual_revenue', operator: 'greater_than', value: 10000000 }
    ],
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Executive review for high-value account',
          due_hours: 24,
          priority: 'High',
          description: 'This account has >$10M revenue - requires executive engagement'
        }
      },
      {
        type: 'update_field',
        config: {
          field: 'rating',
          value: 'Hot'
        }
      },
      {
        type: 'assign_owner',
        config: {
          owner_type: 'senior_sales_rep'
        }
      }
    ],
    enabled: true,
    priority: 1
  },

  // Lead Scoring Update
  {
    name: 'Dynamic Lead Scoring',
    description: 'Update lead scores based on engagement and profile data',
    trigger: 'entity_updated',
    entity_type: 'LEAD',
    conditions: [],
    actions: [
      {
        type: 'score_update',
        config: {
          scoring_rules: {
            email_provided: 10,
            phone_provided: 15,
            company_size_large: 20,
            budget_high: 30,
            timeline_immediate: 25,
            source_referral: 20,
            industry_match: 15
          }
        }
      }
    ],
    enabled: true,
    priority: 3
  }
]

/**
 * Playbook Engine
 */
export class CRMPlaybookEngine {
  private playbooks: CRMPlaybook[] = []
  private crmClient: CRMClient

  constructor(crmClient: CRMClient) {
    this.crmClient = crmClient
    this.loadPlaybooks()
  }

  private loadPlaybooks() {
    // In a real implementation, this would load from database
    this.playbooks = DEFAULT_CRM_PLAYBOOKS.map((pb, index) => ({
      ...pb,
      id: `playbook_${index + 1}`,
      created_by: 'system',
      created_at: new Date().toISOString(),
      execution_count: 0
    }))
  }

  /**
   * Execute playbooks based on trigger event
   */
  async executeTrigger(
    trigger: PlaybookTrigger,
    entityType: keyof typeof CRM_ENTITY_CODES,
    entityData: any,
    context: {
      organizationId: string
      userId?: string
      changedFields?: string[]
      oldValues?: Record<string, any>
    }
  ): Promise<void> {
    const applicablePlaybooks = this.playbooks.filter(pb => 
      pb.enabled &&
      pb.trigger === trigger &&
      pb.entity_type === entityType
    ).sort((a, b) => a.priority - b.priority)

    for (const playbook of applicablePlaybooks) {
      try {
        if (await this.evaluateConditions(playbook.conditions, entityData, context)) {
          await this.executeActions(playbook.actions, entityData, context)
          
          // Update execution count
          playbook.execution_count++
          playbook.last_executed = new Date().toISOString()
        }
      } catch (error) {
        console.error(`Playbook execution failed for ${playbook.name}:`, error)
      }
    }
  }

  /**
   * Evaluate playbook conditions
   */
  private async evaluateConditions(
    conditions: PlaybookCondition[],
    entityData: any,
    context: any
  ): Promise<boolean> {
    if (conditions.length === 0) return true

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(entityData, condition.field)
      
      if (!this.evaluateCondition(condition, fieldValue)) {
        return false
      }
    }

    return true
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: PlaybookCondition, fieldValue: any): boolean {
    const { operator, value } = condition

    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'not_equals':
        return fieldValue !== value
      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > value
      case 'less_than':
        if (value === 'TODAY' && typeof fieldValue === 'string') {
          return new Date(fieldValue) < new Date()
        }
        return typeof fieldValue === 'number' && fieldValue < value
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(value)
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined || fieldValue === ''
      default:
        return false
    }
  }

  /**
   * Execute playbook actions
   */
  private async executeActions(
    actions: PlaybookAction[],
    entityData: any,
    context: { organizationId: string; userId?: string }
  ): Promise<void> {
    for (const action of actions) {
      try {
        if (action.delay_minutes && action.delay_minutes > 0) {
          // Schedule action for later execution
          await this.scheduleAction(action, entityData, context, action.delay_minutes)
        } else {
          await this.executeAction(action, entityData, context)
        }
      } catch (error) {
        console.error(`Action execution failed:`, error)
      }
    }
  }

  /**
   * Execute individual action
   */
  private async executeAction(
    action: PlaybookAction,
    entityData: any,
    context: { organizationId: string; userId?: string }
  ): Promise<void> {
    const { type, config } = action

    switch (type) {
      case 'create_task':
        await this.createTask(config, entityData, context)
        break

      case 'update_field':
        await this.updateField(config, entityData, context)
        break

      case 'create_activity':
        await this.createActivity(config, entityData, context)
        break

      case 'score_update':
        await this.updateScore(config, entityData, context)
        break

      case 'send_email':
        await this.sendEmail(config, entityData, context)
        break

      case 'assign_owner':
        await this.assignOwner(config, entityData, context)
        break

      case 'add_to_sequence':
        await this.addToSequence(config, entityData, context)
        break

      case 'webhook':
        await this.callWebhook(config, entityData, context)
        break

      default:
        console.warn(`Unknown action type: ${type}`)
    }
  }

  /**
   * Action implementations
   */
  private async createTask(
    config: any,
    entityData: any,
    context: { organizationId: string; userId?: string }
  ): Promise<void> {
    const dueDate = new Date()
    if (config.due_hours) {
      dueDate.setHours(dueDate.getHours() + config.due_hours)
    }

    await this.crmClient.activities.createTask({
      entity_name: config.title,
      due_date: dueDate.toISOString().split('T')[0],
      priority: config.priority || 'Normal',
      relatedEntityId: entityData.entity_id,
      relatedEntityType: this.getEntityTypeFromData(entityData)
    })
  }

  private async updateField(
    config: any,
    entityData: any,
    context: { organizationId: string }
  ): Promise<void> {
    await this.crmClient.entities.updateDynamicField(
      entityData.entity_id,
      config.field,
      config.value,
      this.getFieldType(config.value)
    )
  }

  private async createActivity(
    config: any,
    entityData: any,
    context: { organizationId: string }
  ): Promise<void> {
    await this.crmClient.activities.logActivity({
      entity_name: config.subject,
      type: config.type || 'Note',
      direction: 'Outbound',
      relatedEntityId: entityData.entity_id,
      relatedEntityType: this.getEntityTypeFromData(entityData)
    })
  }

  private async updateScore(
    config: any,
    entityData: any,
    context: { organizationId: string }
  ): Promise<void> {
    if (config.field && config.value) {
      // Simple score update
      await this.crmClient.entities.updateDynamicField(
        entityData.entity_id,
        config.field,
        config.value,
        'number'
      )
    } else if (config.scoring_rules) {
      // Dynamic scoring based on rules
      let score = 0
      const rules = config.scoring_rules

      // Apply scoring rules
      if (entityData.dynamic_fields?.email?.value && rules.email_provided) {
        score += rules.email_provided
      }
      if (entityData.dynamic_fields?.phone?.value && rules.phone_provided) {
        score += rules.phone_provided
      }
      if (entityData.dynamic_fields?.employee_count?.value > 1000 && rules.company_size_large) {
        score += rules.company_size_large
      }
      if (entityData.dynamic_fields?.budget?.value > 100000 && rules.budget_high) {
        score += rules.budget_high
      }
      if (entityData.dynamic_fields?.timeline?.value === 'Immediate' && rules.timeline_immediate) {
        score += rules.timeline_immediate
      }
      if (entityData.dynamic_fields?.source?.value === 'Referral' && rules.source_referral) {
        score += rules.source_referral
      }

      // Cap score at 100
      score = Math.min(score, 100)

      await this.crmClient.entities.updateDynamicField(
        entityData.entity_id,
        'score',
        score,
        'number'
      )
    }
  }

  private async sendEmail(
    config: any,
    entityData: any,
    context: { organizationId: string }
  ): Promise<void> {
    // Email sending would be implemented here
    console.log(`Email would be sent:`, config)
  }

  private async assignOwner(
    config: any,
    entityData: any,
    context: { organizationId: string }
  ): Promise<void> {
    // Owner assignment logic would be implemented here
    console.log(`Owner would be assigned:`, config)
  }

  private async addToSequence(
    config: any,
    entityData: any,
    context: { organizationId: string }
  ): Promise<void> {
    // Email sequence logic would be implemented here
    console.log(`Would add to sequence:`, config)
  }

  private async callWebhook(
    config: any,
    entityData: any,
    context: { organizationId: string }
  ): Promise<void> {
    // Webhook calling logic would be implemented here
    console.log(`Webhook would be called:`, config)
  }

  /**
   * Schedule action for delayed execution
   */
  private async scheduleAction(
    action: PlaybookAction,
    entityData: any,
    context: { organizationId: string; userId?: string },
    delayMinutes: number
  ): Promise<void> {
    // In a real implementation, this would use a job queue
    setTimeout(async () => {
      await this.executeAction(action, entityData, context)
    }, delayMinutes * 60 * 1000)
  }

  /**
   * Helper methods
   */
  private getFieldValue(entityData: any, fieldPath: string): any {
    if (fieldPath.includes('.')) {
      const parts = fieldPath.split('.')
      let value = entityData
      for (const part of parts) {
        value = value?.[part]
      }
      return value
    }

    // Check dynamic fields first
    if (entityData.dynamic_fields?.[fieldPath]?.value !== undefined) {
      return entityData.dynamic_fields[fieldPath].value
    }

    // Check direct properties
    return entityData[fieldPath]
  }

  private getEntityTypeFromData(entityData: any): 'ACCOUNT' | 'CONTACT' | 'OPPORTUNITY' | 'LEAD' | 'ACTIVITY' | 'TASK' {
    // This would be determined from the entity's smart_code or entity_type
    return entityData.entity_type || 'ACCOUNT'
  }

  private getFieldType(value: any): 'text' | 'number' | 'boolean' | 'date' | 'json' {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) return 'date'
    if (typeof value === 'object') return 'json'
    return 'text'
  }

  /**
   * Public API methods
   */
  public async addPlaybook(playbook: Omit<CRMPlaybook, 'id' | 'created_at' | 'execution_count'>): Promise<string> {
    const id = `custom_${Date.now()}`
    this.playbooks.push({
      ...playbook,
      id,
      created_at: new Date().toISOString(),
      execution_count: 0
    })
    return id
  }

  public getPlaybooks(): CRMPlaybook[] {
    return [...this.playbooks]
  }

  public getPlaybook(id: string): CRMPlaybook | undefined {
    return this.playbooks.find(pb => pb.id === id)
  }

  public async updatePlaybook(id: string, updates: Partial<CRMPlaybook>): Promise<boolean> {
    const index = this.playbooks.findIndex(pb => pb.id === id)
    if (index === -1) return false

    this.playbooks[index] = { ...this.playbooks[index], ...updates }
    return true
  }

  public async deletePlaybook(id: string): Promise<boolean> {
    const index = this.playbooks.findIndex(pb => pb.id === id)
    if (index === -1) return false

    this.playbooks.splice(index, 1)
    return true
  }

  public async enablePlaybook(id: string): Promise<boolean> {
    return this.updatePlaybook(id, { enabled: true })
  }

  public async disablePlaybook(id: string): Promise<boolean> {
    return this.updatePlaybook(id, { enabled: false })
  }

  public getPlaybookStats(): {
    total: number
    enabled: number
    totalExecutions: number
    mostActivePlaybook?: CRMPlaybook
  } {
    const enabled = this.playbooks.filter(pb => pb.enabled).length
    const totalExecutions = this.playbooks.reduce((sum, pb) => sum + pb.execution_count, 0)
    const mostActive = this.playbooks.reduce((max, pb) => 
      pb.execution_count > (max?.execution_count || 0) ? pb : max, undefined as CRMPlaybook | undefined
    )

    return {
      total: this.playbooks.length,
      enabled,
      totalExecutions,
      mostActivePlaybook: mostActive
    }
  }
}

/**
 * React hook for playbook management
 */
export function useCRMPlaybooks(crmClient: CRMClient) {
  const [engine] = React.useState(() => new CRMPlaybookEngine(crmClient))

  const addPlaybook = React.useCallback(
    (playbook: Omit<CRMPlaybook, 'id' | 'created_at' | 'execution_count'>) => {
      return engine.addPlaybook(playbook)
    },
    [engine]
  )

  const updatePlaybook = React.useCallback(
    (id: string, updates: Partial<CRMPlaybook>) => {
      return engine.updatePlaybook(id, updates)
    },
    [engine]
  )

  const deletePlaybook = React.useCallback(
    (id: string) => {
      return engine.deletePlaybook(id)
    },
    [engine]
  )

  const executeForEntity = React.useCallback(
    (trigger: PlaybookTrigger, entityType: keyof typeof CRM_ENTITY_CODES, entityData: any, context: any) => {
      return engine.executeTrigger(trigger, entityType, entityData, context)
    },
    [engine]
  )

  return {
    engine,
    playbooks: engine.getPlaybooks(),
    stats: engine.getPlaybookStats(),
    addPlaybook,
    updatePlaybook,
    deletePlaybook,
    executeForEntity,
    enablePlaybook: (id: string) => engine.enablePlaybook(id),
    disablePlaybook: (id: string) => engine.disablePlaybook(id)
  }
}

// For non-React environments
import React from 'react'