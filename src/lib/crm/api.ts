/**
 * HERA CRM API Client
 * Smart Code: HERA.CRM.CORE.API.CLIENT.V1
 * 
 * Universal API v2 extensions for CRM operations
 * Builds on Sacred Six architecture with full organization_id isolation
 */

import { apiV2 } from '@/lib/client/fetchV2'
import { callRPC } from '@/lib/universal-api-v2-client'
import { CRM_ENTITY_CODES, CRM_DYNAMIC_FIELD_CODES, CRM_TRANSACTION_CODES, CRM_RELATIONSHIP_CODES } from './smart-codes'
import { CRM_ENTITY_DEFINITIONS, getCRMEntityDefinition } from './entity-definitions'
import type { UniversalEntity } from '@/hooks/useUniversalEntity'

export interface CRMEntityInput {
  entity_type: keyof typeof CRM_ENTITY_CODES
  entity_name: string
  dynamic_fields?: Record<string, {
    value: any
    type: 'text' | 'number' | 'boolean' | 'date' | 'json'
  }>
  metadata?: Record<string, any>
}

export interface CRMRelationshipInput {
  source_entity_id: string
  target_entity_id: string
  relationship_type: keyof typeof CRM_RELATIONSHIP_CODES
  relationship_data?: Record<string, any>
}

export interface CRMTransactionInput {
  transaction_type: keyof typeof CRM_TRANSACTION_CODES
  source_entity_id: string
  target_entity_id?: string
  transaction_data?: Record<string, any>
  transaction_amount?: number
}

/**
 * CRM Entity Operations
 */
export class CRMEntityAPI {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Create a CRM entity using the two-step Universal API v2 pattern
   */
  async createEntity(input: CRMEntityInput): Promise<{ entity_id: string; entity: UniversalEntity }> {
    const definition = getCRMEntityDefinition(input.entity_type)
    
    // Step 1: Create core entity
    const entityResult = await callRPC('hera_entity_upsert_v1', {
      p_organization_id: this.organizationId,
      p_entity_type: input.entity_type,
      p_entity_name: input.entity_name,
      p_smart_code: definition.smart_code,
      p_metadata: input.metadata || {}
    })

    if (!entityResult.success || !entityResult.data) {
      throw new Error(`Failed to create ${input.entity_type}: ${entityResult.error}`)
    }

    const entityId = entityResult.data

    // Step 2: Add dynamic fields if provided
    if (input.dynamic_fields && Object.keys(input.dynamic_fields).length > 0) {
      const fields = Object.entries(input.dynamic_fields).map(([fieldName, fieldData]) => {
        const fieldDef = definition.dynamic_fields.find(f => f.field_name === fieldName)
        return {
          field_name: fieldName,
          field_type: fieldData.type,
          field_value_text: fieldData.type === 'text' ? fieldData.value : null,
          field_value_number: fieldData.type === 'number' ? fieldData.value : null,
          field_value_boolean: fieldData.type === 'boolean' ? fieldData.value : null,
          field_value_date: fieldData.type === 'date' ? fieldData.value : null,
          field_value_json: fieldData.type === 'json' ? fieldData.value : null,
          smart_code: fieldDef?.smart_code || `${definition.smart_code}.DYN.${fieldName.toUpperCase()}.V1`
        }
      })

      await callRPC('hera_dynamic_data_batch_v1', {
        p_organization_id: this.organizationId,
        p_entity_id: entityId,
        p_fields: fields
      })
    }

    // Return the created entity
    const entity = await this.getEntity(entityId)
    return { entity_id: entityId, entity }
  }

  /**
   * Get CRM entity with dynamic fields
   */
  async getEntity(entityId: string): Promise<UniversalEntity> {
    const { data } = await apiV2.get(`entities/${entityId}`, {
      organization_id: this.organizationId,
      include_dynamic_fields: true,
      include_relationships: true
    })

    return data
  }

  /**
   * Get CRM entities by type
   */
  async getEntities(entityType: keyof typeof CRM_ENTITY_CODES, filters?: Record<string, any>): Promise<UniversalEntity[]> {
    const { data } = await apiV2.get('entities', {
      entity_type: entityType,
      organization_id: this.organizationId,
      include_dynamic_fields: true,
      include_relationships: true,
      ...filters
    })

    return data || []
  }

  /**
   * Update CRM entity dynamic field
   */
  async updateDynamicField(entityId: string, fieldName: string, value: any, type: 'text' | 'number' | 'boolean' | 'date' | 'json'): Promise<void> {
    await apiV2.post('entities/dynamic-data', {
      entity_id: entityId,
      field_name: fieldName,
      field_type: type,
      [`field_value_${type}`]: value,
      organization_id: this.organizationId
    })
  }

  /**
   * Update multiple dynamic fields at once
   */
  async updateDynamicFields(entityId: string, fields: Record<string, { value: any; type: 'text' | 'number' | 'boolean' | 'date' | 'json' }>): Promise<void> {
    const fieldArray = Object.entries(fields).map(([fieldName, fieldData]) => ({
      field_name: fieldName,
      field_type: fieldData.type,
      [`field_value_${fieldData.type}`]: fieldData.value
    }))

    await callRPC('hera_dynamic_data_batch_v1', {
      p_organization_id: this.organizationId,
      p_entity_id: entityId,
      p_fields: fieldArray
    })
  }

  /**
   * Delete CRM entity
   */
  async deleteEntity(entityId: string): Promise<void> {
    await apiV2.delete(`entities/${entityId}`, {
      organization_id: this.organizationId
    })
  }

  /**
   * Search CRM entities
   */
  async searchEntities(query: string, entityTypes?: Array<keyof typeof CRM_ENTITY_CODES>): Promise<UniversalEntity[]> {
    const { data } = await apiV2.get('entities/search', {
      q: query,
      entity_types: entityTypes,
      organization_id: this.organizationId,
      include_dynamic_fields: true
    })

    return data || []
  }
}

/**
 * CRM Relationship Operations
 */
export class CRMRelationshipAPI {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Create CRM relationship
   */
  async createRelationship(input: CRMRelationshipInput): Promise<{ relationship_id: string }> {
    const result = await apiV2.post('relationships', {
      source_entity_id: input.source_entity_id,
      target_entity_id: input.target_entity_id,
      relationship_type: input.relationship_type,
      smart_code: CRM_RELATIONSHIP_CODES[input.relationship_type],
      relationship_data: input.relationship_data || {},
      organization_id: this.organizationId
    })

    return { relationship_id: result.data.relationship_id }
  }

  /**
   * Get relationships for an entity
   */
  async getEntityRelationships(entityId: string, relationshipType?: keyof typeof CRM_RELATIONSHIP_CODES): Promise<any[]> {
    const { data } = await apiV2.get(`relationships/entity/${entityId}`, {
      relationship_type: relationshipType,
      organization_id: this.organizationId
    })

    return data || []
  }

  /**
   * Delete relationship
   */
  async deleteRelationship(relationshipId: string): Promise<void> {
    await apiV2.delete(`relationships/${relationshipId}`, {
      organization_id: this.organizationId
    })
  }
}

/**
 * CRM Transaction Operations
 */
export class CRMTransactionAPI {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Log CRM transaction
   */
  async logTransaction(input: CRMTransactionInput): Promise<{ transaction_id: string }> {
    const result = await apiV2.post('transactions', {
      transaction_type: input.transaction_type,
      smart_code: CRM_TRANSACTION_CODES[input.transaction_type],
      source_entity_id: input.source_entity_id,
      target_entity_id: input.target_entity_id,
      transaction_data: input.transaction_data || {},
      transaction_amount: input.transaction_amount || 0,
      organization_id: this.organizationId
    })

    return { transaction_id: result.data.transaction_id }
  }

  /**
   * Get transaction history for entity
   */
  async getEntityTransactions(entityId: string, transactionType?: keyof typeof CRM_TRANSACTION_CODES): Promise<any[]> {
    const { data } = await apiV2.get(`transactions/entity/${entityId}`, {
      transaction_type: transactionType,
      organization_id: this.organizationId
    })

    return data || []
  }
}

/**
 * Specialized CRM Operations
 */

/**
 * Lead Management
 */
export class CRMLeadAPI extends CRMEntityAPI {
  /**
   * Create lead with standard fields
   */
  async createLead(data: {
    entity_name: string
    source: string
    company?: string
    email?: string
    phone?: string
    budget?: number
    timeline?: string
  }): Promise<{ entity_id: string; entity: UniversalEntity }> {
    const dynamicFields: Record<string, { value: any; type: any }> = {
      source: { value: data.source, type: 'text' }
    }

    if (data.company) dynamicFields.company = { value: data.company, type: 'text' }
    if (data.email) dynamicFields.email = { value: data.email, type: 'text' }
    if (data.phone) dynamicFields.phone = { value: data.phone, type: 'text' }
    if (data.budget) dynamicFields.budget = { value: data.budget, type: 'number' }
    if (data.timeline) dynamicFields.timeline = { value: data.timeline, type: 'text' }

    return this.createEntity({
      entity_type: 'LEAD',
      entity_name: data.entity_name,
      dynamic_fields: dynamicFields
    })
  }

  /**
   * Convert lead to account/contact/opportunity
   */
  async convertLead(leadId: string, conversionData: {
    createAccount?: boolean
    accountName?: string
    createContact?: boolean
    contactName?: string
    createOpportunity?: boolean
    opportunityName?: string
    opportunityAmount?: number
  }): Promise<{
    accountId?: string
    contactId?: string
    opportunityId?: string
  }> {
    const result: any = {}
    const relationshipAPI = new CRMRelationshipAPI(this.organizationId)
    const transactionAPI = new CRMTransactionAPI(this.organizationId)

    // Create Account
    if (conversionData.createAccount && conversionData.accountName) {
      const accountResult = await this.createEntity({
        entity_type: 'ACCOUNT',
        entity_name: conversionData.accountName
      })
      result.accountId = accountResult.entity_id

      // Create relationship
      await relationshipAPI.createRelationship({
        source_entity_id: leadId,
        target_entity_id: result.accountId,
        relationship_type: 'LEAD_CONVERTED_TO_ACCOUNT'
      })
    }

    // Create Contact
    if (conversionData.createContact && conversionData.contactName) {
      const contactResult = await this.createEntity({
        entity_type: 'CONTACT',
        entity_name: conversionData.contactName
      })
      result.contactId = contactResult.entity_id

      // Create relationship
      await relationshipAPI.createRelationship({
        source_entity_id: leadId,
        target_entity_id: result.contactId,
        relationship_type: 'LEAD_CONVERTED_TO_CONTACT'
      })
    }

    // Create Opportunity
    if (conversionData.createOpportunity && conversionData.opportunityName) {
      const opportunityResult = await this.createEntity({
        entity_type: 'OPPORTUNITY',
        entity_name: conversionData.opportunityName,
        dynamic_fields: {
          stage: { value: 'Prospecting', type: 'text' },
          amount: { value: conversionData.opportunityAmount || 0, type: 'number' },
          close_date: { value: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], type: 'date' }
        }
      })
      result.opportunityId = opportunityResult.entity_id

      // Create relationship
      await relationshipAPI.createRelationship({
        source_entity_id: leadId,
        target_entity_id: result.opportunityId,
        relationship_type: 'LEAD_CONVERTED_TO_OPPORTUNITY'
      })
    }

    // Log conversion transaction
    await transactionAPI.logTransaction({
      transaction_type: 'LEAD_CONVERTED',
      source_entity_id: leadId,
      transaction_data: {
        converted_to: {
          account: result.accountId,
          contact: result.contactId,
          opportunity: result.opportunityId
        }
      }
    })

    return result
  }
}

/**
 * Opportunity Pipeline Management
 */
export class CRMOpportunityAPI extends CRMEntityAPI {
  /**
   * Create opportunity with pipeline stage
   */
  async createOpportunity(data: {
    entity_name: string
    stage: string
    amount: number
    close_date: string
    probability?: number
    accountId?: string
    contactId?: string
  }): Promise<{ entity_id: string; entity: UniversalEntity }> {
    const result = await this.createEntity({
      entity_type: 'OPPORTUNITY',
      entity_name: data.entity_name,
      dynamic_fields: {
        stage: { value: data.stage, type: 'text' },
        amount: { value: data.amount, type: 'number' },
        close_date: { value: data.close_date, type: 'date' },
        probability: { value: data.probability || 0, type: 'number' }
      }
    })

    const relationshipAPI = new CRMRelationshipAPI(this.organizationId)

    // Link to account if provided
    if (data.accountId) {
      await relationshipAPI.createRelationship({
        source_entity_id: result.entity_id,
        target_entity_id: data.accountId,
        relationship_type: 'OPPORTUNITY_OF_ACCOUNT'
      })
    }

    // Link to contact if provided
    if (data.contactId) {
      await relationshipAPI.createRelationship({
        source_entity_id: result.entity_id,
        target_entity_id: data.contactId,
        relationship_type: 'OPPORTUNITY_OF_CONTACT'
      })
    }

    return result
  }

  /**
   * Move opportunity to different stage
   */
  async moveOpportunityStage(opportunityId: string, newStage: string): Promise<void> {
    await this.updateDynamicField(opportunityId, 'stage', newStage, 'text')

    // Log stage change transaction
    const transactionAPI = new CRMTransactionAPI(this.organizationId)
    await transactionAPI.logTransaction({
      transaction_type: 'OPPORTUNITY_STAGE_CHANGE',
      source_entity_id: opportunityId,
      transaction_data: {
        new_stage: newStage,
        changed_at: new Date().toISOString()
      }
    })
  }
}

/**
 * Activity & Task Management
 */
export class CRMActivityAPI extends CRMEntityAPI {
  /**
   * Log activity
   */
  async logActivity(data: {
    entity_name: string
    type: string
    direction?: string
    outcome?: string
    duration?: number
    relatedEntityId?: string
    relatedEntityType?: 'ACCOUNT' | 'CONTACT' | 'OPPORTUNITY'
  }): Promise<{ entity_id: string; entity: UniversalEntity }> {
    const dynamicFields: Record<string, { value: any; type: any }> = {
      type: { value: data.type, type: 'text' }
    }

    if (data.direction) dynamicFields.direction = { value: data.direction, type: 'text' }
    if (data.outcome) dynamicFields.outcome = { value: data.outcome, type: 'text' }
    if (data.duration) dynamicFields.duration = { value: data.duration, type: 'number' }

    const result = await this.createEntity({
      entity_type: 'ACTIVITY',
      entity_name: data.entity_name,
      dynamic_fields: dynamicFields
    })

    // Link to related entity if provided
    if (data.relatedEntityId && data.relatedEntityType) {
      const relationshipAPI = new CRMRelationshipAPI(this.organizationId)
      const relationshipType = `ACTIVITY_OF_${data.relatedEntityType}` as keyof typeof CRM_RELATIONSHIP_CODES

      await relationshipAPI.createRelationship({
        source_entity_id: result.entity_id,
        target_entity_id: data.relatedEntityId,
        relationship_type: relationshipType
      })
    }

    return result
  }

  /**
   * Create task
   */
  async createTask(data: {
    entity_name: string
    due_date: string
    priority?: string
    relatedEntityId?: string
    relatedEntityType?: 'ACCOUNT' | 'CONTACT' | 'OPPORTUNITY'
  }): Promise<{ entity_id: string; entity: UniversalEntity }> {
    const result = await this.createEntity({
      entity_type: 'TASK',
      entity_name: data.entity_name,
      dynamic_fields: {
        due_date: { value: data.due_date, type: 'date' },
        priority: { value: data.priority || 'Normal', type: 'text' },
        status: { value: 'Not Started', type: 'text' }
      }
    })

    // Link to related entity if provided
    if (data.relatedEntityId && data.relatedEntityType) {
      const relationshipAPI = new CRMRelationshipAPI(this.organizationId)
      const relationshipType = `TASK_OF_${data.relatedEntityType}` as keyof typeof CRM_RELATIONSHIP_CODES

      await relationshipAPI.createRelationship({
        source_entity_id: result.entity_id,
        target_entity_id: data.relatedEntityId,
        relationship_type: relationshipType
      })
    }

    return result
  }
}

/**
 * Main CRM API Client
 */
export class CRMClient {
  public entities: CRMEntityAPI
  public relationships: CRMRelationshipAPI
  public transactions: CRMTransactionAPI
  public leads: CRMLeadAPI
  public opportunities: CRMOpportunityAPI
  public activities: CRMActivityAPI

  constructor(organizationId: string) {
    this.entities = new CRMEntityAPI(organizationId)
    this.relationships = new CRMRelationshipAPI(organizationId)
    this.transactions = new CRMTransactionAPI(organizationId)
    this.leads = new CRMLeadAPI(organizationId)
    this.opportunities = new CRMOpportunityAPI(organizationId)
    this.activities = new CRMActivityAPI(organizationId)
  }
}

/**
 * Hook for CRM API Client
 */
export function useCRMClient(organizationId: string): CRMClient {
  return new CRMClient(organizationId)
}