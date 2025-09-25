import { post } from './base-client'

/**
 * HERA V2 API - Relationship Client
 * Complete CRUD operations for core_relationships table
 */

// TypeScript interfaces
export interface RelationshipUpsertPayload {
  organization_id: string
  id?: string
  from_entity_id: string
  to_entity_id: string
  relationship_type: string
  relationship_subtype?: string
  relationship_name?: string
  relationship_code?: string
  smart_code: string
  is_active?: boolean
  effective_date?: string
  expiration_date?: string
  relationship_data?: Record<string, any>
  metadata?: Record<string, any>
}

export interface RelationshipReadPayload {
  organization_id: string
  relationship_id: string
}

export interface RelationshipQueryPayload {
  organization_id: string
  entity_id?: string
  side?: 'either' | 'from' | 'to'
  relationship_type?: string
  active_only?: boolean
  effective_from?: string
  effective_to?: string
  limit?: number
  offset?: number
}

export interface RelationshipDeletePayload {
  organization_id: string
  relationship_id: string
  expiration_date?: string
}

export interface RelationshipBatchPayload {
  organization_id: string
  rows: Omit<RelationshipUpsertPayload, 'organization_id'>[]
}

/**
 * Relationship Client V2
 * Uses Sacred Six tables only - no schema changes
 */
export const relationshipClientV2 = {
  /**
   * Upsert a single relationship
   */
  upsert: (payload: RelationshipUpsertPayload) =>
    post('/api/v2/universal/relationship-upsert', payload),

  /**
   * Read a single relationship by ID
   */
  read: (organization_id: string, relationship_id: string) =>
    post('/api/v2/universal/relationship-read', {
      organization_id,
      relationship_id
    } as RelationshipReadPayload),

  /**
   * Query relationships with flexible filters
   */
  query: (filters: RelationshipQueryPayload) =>
    post('/api/v2/universal/relationship-query', filters),

  /**
   * Soft delete a relationship (sets is_active=false and expiration_date)
   */
  delete: (organization_id: string, relationship_id: string, expiration_date?: string) =>
    post('/api/v2/universal/relationship-delete', {
      organization_id,
      relationship_id,
      expiration_date
    } as RelationshipDeletePayload),

  /**
   * Batch upsert multiple relationships (207 Multi-Status)
   */
  upsertBatch: (organization_id: string, rows: RelationshipBatchPayload['rows']) =>
    post('/api/v2/universal/relationship-upsert-batch', {
      organization_id,
      rows
    } as RelationshipBatchPayload)
}

// Export convenience functions for common patterns
export const relationshipHelpers = {
  /**
   * Create a status relationship (workflow pattern)
   */
  createStatusRelationship: (
    organization_id: string,
    entity_id: string,
    status_entity_id: string,
    smart_code: string = 'HERA.WORKFLOW.STATUS.ASSIGN.v1'
  ) => {
    return relationshipClientV2.upsert({
      organization_id,
      from_entity_id: entity_id,
      to_entity_id: status_entity_id,
      relationship_type: 'has_status',
      smart_code,
      metadata: {
        assigned_at: new Date().toISOString()
      }
    })
  },

  /**
   * Query all relationships for an entity
   */
  getEntityRelationships: (
    organization_id: string,
    entity_id: string,
    active_only: boolean = true
  ) => {
    return relationshipClientV2.query({
      organization_id,
      entity_id,
      active_only
    })
  },

  /**
   * Query parent-child relationships
   */
  getParentChildRelationships: (
    organization_id: string,
    parent_id: string,
    relationship_type: string = 'parent_of'
  ) => {
    return relationshipClientV2.query({
      organization_id,
      entity_id: parent_id,
      side: 'from',
      relationship_type,
      active_only: true
    })
  },

  /**
   * Expire a relationship (soft delete with timestamp)
   */
  expireRelationship: (organization_id: string, relationship_id: string) => {
    return relationshipClientV2.delete(organization_id, relationship_id, new Date().toISOString())
  }
}
