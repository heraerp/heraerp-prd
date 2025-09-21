/**
 * HERA Playbooks Data Access Layer
 *
 * Provides typed, organization-aware data access for all playbook operations
 * using HERA's universal 6-table architecture with smart code enforcement.
 */

import { universalApi } from '@/lib/universal-api'
import { playbookAuthService } from '../auth/playbook-auth'
import { PlaybookSmartCodes } from '../smart-codes/playbook-smart-codes'

// Core Types
export interface PlaybookDefinition {
  id: string
  organization_id: string
  smart_code: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'deprecated'
  version: string
  ai_confidence: number
  ai_insights: string
  metadata: {
    industry: string
    module: string
    estimated_duration_hours: number
    worker_types: string[]
    step_count: number
    input_schema_ref: string
    output_schema_ref: string
    created_by: string
    last_modified: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

export interface StepDefinition {
  id: string
  organization_id: string
  smart_code: string
  name: string
  status: 'active' | 'deprecated'
  version: string
  ai_confidence: number
  ai_insights: string
  metadata: {
    step_number: number
    step_type: 'human' | 'system' | 'ai' | 'external'
    worker_type: string
    estimated_duration_minutes: number
    required_roles: string[]
    input_schema_ref?: string
    output_schema_ref?: string
    description: string
    business_rules: string[]
    next_steps: string[]
    error_handling: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

export interface PlaybookRun {
  id: string
  organization_id: string
  smart_code: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  subject_entity_id: string // Reference to playbook definition
  occurred_at: string
  ai_confidence: number
  ai_insights: string
  metadata: {
    run_type: string
    priority: 'low' | 'normal' | 'high' | 'critical'
    correlation_id: string
    initiated_by: string
    current_step: number
    current_step_id: string
    estimated_completion: string
    inputs: Record<string, any>
    step_outputs: Record<string, any>
    contract_validations: Record<string, any>
    performance_metrics: Record<string, any>
    [key: string]: any
  }
}

export interface StepExecution {
  id: string
  organization_id: string
  transaction_id: string // Parent run ID
  sequence: number
  smart_code: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  step_entity_id: string // Reference to step definition
  inputs_json: Record<string, any>
  outputs_json: Record<string, any>
  ai_confidence: number
  ai_insights: string
  latency_ms: number
  cost: number
  metadata: {
    executed_by: string
    worker_type: string
    started_at: string
    completed_at?: string
    retry_count: number
    validation_results: Record<string, any>
    performance_notes: string
    [key: string]: any
  }
}

export interface PlaybookContract {
  id: string
  organization_id: string
  entity_id: string // Playbook or step ID
  code: string // Contract type
  value_json: Record<string, any> // JSON Schema
  data_type: string
  validation_rule: string // Smart code
  created_at: string
  updated_at: string
}

export interface PlaybookRelationship {
  id: string
  organization_id: string
  from_entity_id: string
  to_entity_id: string
  smart_code: string
  metadata: Record<string, any>
}

// Query Options
export interface PlaybookQueryOptions {
  filters?: Record<string, any>
  sort?: { field: string; direction: 'asc' | 'desc' }
  limit?: number
  offset?: number
  include_metadata?: boolean
}

export interface PlaybookDataResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

/**
 * HERA Playbooks Data Access Layer
 */
export class PlaybookDataLayer {
  private organizationId: string | null = null

  constructor() {
    // Initialize with current organization
    this.setOrganizationContext()
  }

  /**
   * Set organization context for all operations
   */
  setOrganizationContext(orgId?: string): void {
    this.organizationId = orgId || (playbookAuthService?.getOrganizationId?.() ?? null)

    if (this.organizationId) {
      universalApi.setOrganizationId(this.organizationId)
    }
  }

  /**
   * Ensure organization context is set
   */
  private ensureOrganizationContext(): void {
    if (!this.organizationId) {
      throw new Error('Organization context not set. Call setOrganizationContext() first.')
    }
  }

  // PLAYBOOK DEFINITIONS

  /**
   * Create playbook definition
   */
  async createPlaybookDefinition(
    data: Omit<PlaybookDefinition, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
  ): Promise<PlaybookDefinition> {
    this.ensureOrganizationContext()

    const entity = await universalApi.createEntity({
      entity_type: 'playbook_definition',
      entity_name: data.name,
      entity_code: data.name.toUpperCase().replace(/\s+/g, '_'),
      smart_code: data.smart_code,
      organization_id: this.organizationId!,
      status: data.status,
      metadata: {
        ...data.metadata,
        version: data.version,
        ai_confidence: data.ai_confidence,
        ai_insights: data.ai_insights
      }
    })

    return this.mapEntityToPlaybookDefinition(entity)
  }

  /**
   * Get playbook definition by ID
   */
  async getPlaybookDefinition(id: string): Promise<PlaybookDefinition | null> {
    this.ensureOrganizationContext()

    try {
      const entity = await universalApi.getEntity(id)
      return this.mapEntityToPlaybookDefinition(entity)
    } catch (error) {
      return null
    }
  }

  /**
   * Query playbook definitions
   */
  async queryPlaybookDefinitions(
    options: PlaybookQueryOptions = {}
  ): Promise<PlaybookDataResult<PlaybookDefinition>> {
    this.ensureOrganizationContext()

    const result = await universalApi.queryEntities({
      filters: {
        entity_type: 'playbook_definition',
        organization_id: this.organizationId!,
        ...options.filters
      },
      sort: options.sort,
      limit: options.limit,
      offset: options.offset
    })

    const data = result.data?.map(entity => this.mapEntityToPlaybookDefinition(entity)) || []

    return {
      data,
      total: result.total || 0,
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit || 20,
      has_more: (result.total || 0) > (options.offset || 0) + (options.limit || 20)
    }
  }

  /**
   * Update playbook definition
   */
  async updatePlaybookDefinition(
    id: string,
    updates: Partial<PlaybookDefinition>
  ): Promise<PlaybookDefinition> {
    this.ensureOrganizationContext()

    const updated = await universalApi.updateEntity(id, {
      entity_name: updates.name,
      smart_code: updates.smart_code,
      status: updates.status,
      metadata: updates.metadata
    })

    return this.mapEntityToPlaybookDefinition(updated)
  }

  // STEP DEFINITIONS

  /**
   * Create step definition
   */
  async createStepDefinition(
    data: Omit<StepDefinition, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
  ): Promise<StepDefinition> {
    this.ensureOrganizationContext()

    const entity = await universalApi.createEntity({
      entity_type: 'step_definition',
      entity_name: data.name,
      entity_code: data.name.toUpperCase().replace(/\s+/g, '_'),
      smart_code: data.smart_code,
      organization_id: this.organizationId!,
      status: data.status,
      metadata: {
        ...data.metadata,
        version: data.version,
        ai_confidence: data.ai_confidence,
        ai_insights: data.ai_insights
      }
    })

    return this.mapEntityToStepDefinition(entity)
  }

  /**
   * Get step definition by ID
   */
  async getStepDefinition(id: string): Promise<StepDefinition | null> {
    this.ensureOrganizationContext()

    try {
      const entity = await universalApi.getEntity(id)
      return this.mapEntityToStepDefinition(entity)
    } catch (error) {
      return null
    }
  }

  /**
   * Query step definitions
   */
  async queryStepDefinitions(
    options: PlaybookQueryOptions = {}
  ): Promise<PlaybookDataResult<StepDefinition>> {
    this.ensureOrganizationContext()

    const result = await universalApi.queryEntities({
      filters: {
        entity_type: 'step_definition',
        organization_id: this.organizationId!,
        ...options.filters
      },
      sort: options.sort,
      limit: options.limit,
      offset: options.offset
    })

    const data = result.data?.map(entity => this.mapEntityToStepDefinition(entity)) || []

    return {
      data,
      total: result.total || 0,
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit || 20,
      has_more: (result.total || 0) > (options.offset || 0) + (options.limit || 20)
    }
  }

  // PLAYBOOK RUNS

  /**
   * Create playbook run
   */
  async createPlaybookRun(data: Omit<PlaybookRun, 'id' | 'organization_id'>): Promise<PlaybookRun> {
    this.ensureOrganizationContext()

    const transaction = await universalApi.createTransaction({
      transaction_type: 'playbook_run',
      transaction_code: `RUN-${Date.now()}`,
      smart_code: data.smart_code,
      organization_id: this.organizationId!,
      reference_entity_id: data.subject_entity_id,
      status: data.status,
      total_amount: 0,
      metadata: {
        ...data.metadata,
        ai_confidence: data.ai_confidence,
        ai_insights: data.ai_insights,
        occurred_at: data.occurred_at
      }
    })

    return this.mapTransactionToPlaybookRun(transaction)
  }

  /**
   * Get playbook run by ID
   */
  async getPlaybookRun(id: string): Promise<PlaybookRun | null> {
    this.ensureOrganizationContext()

    try {
      const transaction = await universalApi.getTransaction(id)
      return this.mapTransactionToPlaybookRun(transaction)
    } catch (error) {
      return null
    }
  }

  /**
   * Query playbook runs
   */
  async queryPlaybookRuns(
    options: PlaybookQueryOptions = {}
  ): Promise<PlaybookDataResult<PlaybookRun>> {
    this.ensureOrganizationContext()

    const result = await universalApi.queryTransactions({
      filters: {
        transaction_type: 'playbook_run',
        organization_id: this.organizationId!,
        ...options.filters
      },
      sort: options.sort,
      limit: options.limit,
      offset: options.offset
    })

    const data =
      result.data?.map(transaction => this.mapTransactionToPlaybookRun(transaction)) || []

    return {
      data,
      total: result.total || 0,
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit || 20,
      has_more: (result.total || 0) > (options.offset || 0) + (options.limit || 20)
    }
  }

  /**
   * Update playbook run
   */
  async updatePlaybookRun(id: string, updates: Partial<PlaybookRun>): Promise<PlaybookRun> {
    this.ensureOrganizationContext()

    const updated = await universalApi.updateTransaction(id, {
      status: updates.status,
      metadata: updates.metadata
    })

    return this.mapTransactionToPlaybookRun(updated)
  }

  // STEP EXECUTIONS

  /**
   * Create step execution
   */
  async createStepExecution(
    data: Omit<StepExecution, 'id' | 'organization_id'>
  ): Promise<StepExecution> {
    this.ensureOrganizationContext()

    const line = await universalApi.createTransactionLine({
      transaction_id: data.transaction_id,
      line_number: data.sequence,
      line_entity_id: data.step_entity_id,
      smart_code: data.smart_code,
      organization_id: this.organizationId!,
      status: data.status,
      line_amount: data.cost,
      quantity: 1,
      metadata: {
        ...data.metadata,
        inputs_json: data.inputs_json,
        outputs_json: data.outputs_json,
        ai_confidence: data.ai_confidence,
        ai_insights: data.ai_insights,
        latency_ms: data.latency_ms
      }
    })

    return this.mapTransactionLineToStepExecution(line)
  }

  /**
   * Get step execution by ID
   */
  async getStepExecution(id: string): Promise<StepExecution | null> {
    this.ensureOrganizationContext()

    try {
      const line = await universalApi.getTransactionLine(id)
      return this.mapTransactionLineToStepExecution(line)
    } catch (error) {
      return null
    }
  }

  /**
   * Query step executions
   */
  async queryStepExecutions(
    options: PlaybookQueryOptions = {}
  ): Promise<PlaybookDataResult<StepExecution>> {
    this.ensureOrganizationContext()

    const result = await universalApi.queryTransactionLines({
      filters: {
        organization_id: this.organizationId!,
        ...options.filters
      },
      sort: options.sort,
      limit: options.limit,
      offset: options.offset
    })

    const data = result.data?.map(line => this.mapTransactionLineToStepExecution(line)) || []

    return {
      data,
      total: result.total || 0,
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit || 20,
      has_more: (result.total || 0) > (options.offset || 0) + (options.limit || 20)
    }
  }

  // CONTRACTS & DYNAMIC DATA

  /**
   * Create or update contract
   */
  async saveContract(
    data: Omit<PlaybookContract, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
  ): Promise<PlaybookContract> {
    this.ensureOrganizationContext()

    const dynamicData = await universalApi.setDynamicField(
      data.entity_id,
      data.code,
      data.value_json,
      {
        data_type: data.data_type,
        smart_code: data.validation_rule
      }
    )

    return this.mapDynamicDataToContract(dynamicData)
  }

  /**
   * Get contract by entity and code
   */
  async getContract(entityId: string, code: string): Promise<PlaybookContract | null> {
    this.ensureOrganizationContext()

    try {
      const dynamicData = await universalApi.getDynamicField(entityId, code)
      if (dynamicData) {
        return this.mapDynamicDataToContract(dynamicData)
      }
      return null
    } catch (error) {
      return null
    }
  }

  // RELATIONSHIPS

  /**
   * Create relationship between entities
   */
  async createRelationship(
    data: Omit<PlaybookRelationship, 'id' | 'organization_id'>
  ): Promise<PlaybookRelationship> {
    this.ensureOrganizationContext()

    const relationship = await universalApi.createRelationship({
      from_entity_id: data.from_entity_id,
      to_entity_id: data.to_entity_id,
      relationship_type: data.smart_code,
      organization_id: this.organizationId!,
      metadata: data.metadata
    })

    return this.mapRelationship(relationship)
  }

  /**
   * Query relationships
   */
  async queryRelationships(
    options: PlaybookQueryOptions = {}
  ): Promise<PlaybookDataResult<PlaybookRelationship>> {
    this.ensureOrganizationContext()

    const result = await universalApi.queryRelationships({
      filters: {
        organization_id: this.organizationId!,
        ...options.filters
      },
      limit: options.limit,
      offset: options.offset
    })

    const data = result.data?.map(rel => this.mapRelationship(rel)) || []

    return {
      data,
      total: result.total || 0,
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit || 20,
      has_more: (result.total || 0) > (options.offset || 0) + (options.limit || 20)
    }
  }

  // UTILITY METHODS

  /**
   * Get steps for a playbook
   */
  async getPlaybookSteps(playbookId: string): Promise<StepDefinition[]> {
    const relationships = await this.queryRelationships({
      filters: {
        from_entity_id: playbookId,
        smart_code: PlaybookSmartCodes.forRelationship('CONTAINS.STEP')
      }
    })

    const stepIds = relationships.data.map(rel => rel.to_entity_id)
    const steps: StepDefinition[] = []

    for (const stepId of stepIds) {
      const step = await this.getStepDefinition(stepId)
      if (step) {
        steps.push(step)
      }
    }

    // Sort by step number
    return steps.sort((a, b) => a.metadata.step_number - b.metadata.step_number)
  }

  /**
   * Get run executions for a playbook run
   */
  async getRunExecutions(runId: string): Promise<StepExecution[]> {
    const executions = await this.queryStepExecutions({
      filters: {
        transaction_id: runId
      },
      sort: { field: 'sequence', direction: 'asc' }
    })

    return executions.data
  }

  // PRIVATE MAPPING METHODS

  private mapEntityToPlaybookDefinition(entity: any): PlaybookDefinition {
    return {
      id: entity.id,
      organization_id: entity.organization_id,
      smart_code: entity.smart_code,
      name: entity.entity_name,
      status: entity.status,
      version: entity.metadata?.version || '1',
      ai_confidence: entity.metadata?.ai_confidence || 0,
      ai_insights: entity.metadata?.ai_insights || '',
      metadata: entity.metadata || {},
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }
  }

  private mapEntityToStepDefinition(entity: any): StepDefinition {
    return {
      id: entity.id,
      organization_id: entity.organization_id,
      smart_code: entity.smart_code,
      name: entity.entity_name,
      status: entity.status,
      version: entity.metadata?.version || '1',
      ai_confidence: entity.metadata?.ai_confidence || 0,
      ai_insights: entity.metadata?.ai_insights || '',
      metadata: entity.metadata || {},
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }
  }

  private mapTransactionToPlaybookRun(transaction: any): PlaybookRun {
    return {
      id: transaction.id,
      organization_id: transaction.organization_id,
      smart_code: transaction.smart_code,
      status: transaction.status,
      subject_entity_id: transaction.reference_entity_id,
      occurred_at: transaction.metadata?.occurred_at || transaction.created_at,
      ai_confidence: transaction.metadata?.ai_confidence || 0,
      ai_insights: transaction.metadata?.ai_insights || '',
      metadata: transaction.metadata || {}
    }
  }

  private mapTransactionLineToStepExecution(line: any): StepExecution {
    return {
      id: line.id,
      organization_id: line.organization_id,
      transaction_id: line.transaction_id,
      sequence: line.line_number,
      smart_code: line.smart_code,
      status: line.status,
      step_entity_id: line.line_entity_id,
      inputs_json: line.metadata?.inputs_json || {},
      outputs_json: line.metadata?.outputs_json || {},
      ai_confidence: line.metadata?.ai_confidence || 0,
      ai_insights: line.metadata?.ai_insights || '',
      latency_ms: line.metadata?.latency_ms || 0,
      cost: line.line_amount || 0,
      metadata: line.metadata || {}
    }
  }

  private mapDynamicDataToContract(dynamicData: any): PlaybookContract {
    return {
      id: dynamicData.id,
      organization_id: dynamicData.organization_id,
      entity_id: dynamicData.entity_id,
      code: dynamicData.field_name,
      value_json:
        typeof dynamicData.field_value_text === 'string'
          ? JSON.parse(dynamicData.field_value_text)
          : dynamicData.field_value_text,
      data_type: dynamicData.data_type || 'json',
      validation_rule: dynamicData.smart_code || '',
      created_at: dynamicData.created_at,
      updated_at: dynamicData.updated_at
    }
  }

  private mapRelationship(relationship: any): PlaybookRelationship {
    return {
      id: relationship.id,
      organization_id: relationship.organization_id,
      from_entity_id: relationship.from_entity_id,
      to_entity_id: relationship.to_entity_id,
      smart_code: relationship.relationship_type,
      metadata: relationship.metadata || {}
    }
  }
}

// Singleton instance
export const playbookDataLayer = new PlaybookDataLayer()

/**
 * Hook for using playbook data layer with automatic organization context
 */
export function usePlaybookDataLayer() {
  // Update organization context when auth changes
  const authState = playbookAuthService.getState()

  if (authState.organization?.id) {
    playbookDataLayer.setOrganizationContext(authState.organization.id)
  }

  return playbookDataLayer
}
