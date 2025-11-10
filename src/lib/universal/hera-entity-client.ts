/**
 * HERA Entity Client - Universal Entity List Builder
 * Smart Code: HERA.UNIVERSAL.LIB.ENTITY_CLIENT.v1
 * 
 * Client for interacting with hera_entities_crud_v1 RPC function
 * Provides type-safe entity operations with proper error handling
 */

import { createClient } from '@supabase/supabase-js'
import type { EntityTypeConfig } from '@/lib/config/entity-types'

// Create Supabase client with error handling
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', {
      url: !!url,
      key: !!key
    })
    throw new Error('Supabase configuration is missing')
  }
  
  return createClient(url, key)
}

const supabase = createSupabaseClient()

export interface HERAEntityData {
  id?: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  organization_id: string
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface HERADynamicField {
  field_name: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'json'
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_date?: string
  field_value_json?: any
  smart_code: string
}

export interface HERAEntityRelationship {
  source_entity_id: string
  target_entity_id: string
  relationship_type: string
  effective_date?: string
  expiry_date?: string
  smart_code?: string
}

export interface HERAEntityRequest {
  p_action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  p_actor_user_id: string
  p_organization_id: string
  p_entity?: HERAEntityData
  p_dynamic?: HERADynamicField[]
  p_relationships?: HERAEntityRelationship[]
  p_options?: {
    limit?: number
    offset?: number
    filters?: Record<string, any>
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
    include_dynamic?: boolean
    include_relationships?: boolean
  }
}

export interface HERAEntityResponse {
  success: boolean
  data: {
    items?: HERAEntityData[]
    total_count?: number
    has_more?: boolean
    entity?: HERAEntityData
  }
  error?: string
  metadata?: {
    actor_user_id: string
    organization_id: string
    operation: string
    timestamp: string
  }
}

export class HERAEntityClient {
  private actorUserId: string
  private organizationId: string

  constructor(actorUserId: string, organizationId: string) {
    this.actorUserId = actorUserId
    this.organizationId = organizationId
  }

  /**
   * List entities with filtering and pagination
   */
  async listEntities(
    entityType: string,
    options: {
      limit?: number
      offset?: number
      filters?: Record<string, any>
      sort?: { field: string; direction: 'asc' | 'desc' }
      search?: string
      searchFields?: string[]
    } = {}
  ): Promise<HERAEntityResponse> {
    try {
      const rpcOptions: any = {
        limit: options.limit || 50,
        offset: options.offset || 0,
        include_dynamic: true,
        include_relationships: false
      }

      // Add filters
      if (options.filters && Object.keys(options.filters).length > 0) {
        rpcOptions.filters = options.filters
      }

      // Add sorting
      if (options.sort) {
        rpcOptions.sort_by = options.sort.field
        rpcOptions.sort_direction = options.sort.direction
      }

      // For search, we'll filter on the client side for now
      // In a real implementation, this would be handled by the RPC
      const request: HERAEntityRequest = {
        p_action: 'READ',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: {
          entity_type: entityType,
          entity_name: '',
          smart_code: '',
          organization_id: this.organizationId
        },
        p_options: rpcOptions
      }

      console.log('🔍 HERA Entity List Request:', request)

      const { data, error } = await supabase.rpc('hera_entities_crud_v1', request)

      if (error) {
        console.error('❌ HERA Entity List Error:', error)
        return {
          success: false,
          error: error.message || 'Failed to list entities',
          data: { items: [], total_count: 0 }
        }
      }

      console.log('✅ HERA Entity List Response:', data)

      // Transform response to expected format
      const entities = Array.isArray(data?.items) ? data.items : []
      
      // Apply client-side search if provided
      let filteredEntities = entities
      if (options.search && options.searchFields) {
        const searchTerm = options.search.toLowerCase()
        filteredEntities = entities.filter(entity =>
          options.searchFields!.some(field =>
            String(entity[field] || '').toLowerCase().includes(searchTerm)
          )
        )
      }

      return {
        success: true,
        data: {
          items: filteredEntities,
          total_count: filteredEntities.length,
          has_more: false
        },
        metadata: {
          actor_user_id: this.actorUserId,
          organization_id: this.organizationId,
          operation: 'LIST',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('❌ HERA Entity List Exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: { items: [], total_count: 0 }
      }
    }
  }

  /**
   * Create a new entity
   */
  async createEntity(
    config: EntityTypeConfig,
    entityData: Record<string, any>
  ): Promise<HERAEntityResponse> {
    try {
      // Generate smart code
      const smartCode = `${config.smart_code_prefix}.${entityData.entity_code || 'ENTITY'}.v1`

      // Prepare entity data
      const entity: HERAEntityData = {
        entity_type: config.id,
        entity_name: entityData.entity_name || entityData.name || `New ${config.name}`,
        entity_code: entityData.entity_code || this.generateEntityCode(config.id),
        smart_code: smartCode,
        organization_id: this.organizationId
      }

      // Prepare dynamic fields
      const dynamicFields: HERADynamicField[] = []
      config.fields.forEach(fieldConfig => {
        const value = entityData[fieldConfig.name]
        if (value !== undefined && value !== null && value !== '') {
          const dynamicField: HERADynamicField = {
            field_name: fieldConfig.name,
            field_type: this.mapFieldType(fieldConfig.type),
            smart_code: `${smartCode}.FIELD.${fieldConfig.name.toUpperCase()}.v1`
          }

          // Set appropriate value based on type
          switch (dynamicField.field_type) {
            case 'number':
              dynamicField.field_value_number = Number(value)
              break
            case 'boolean':
              dynamicField.field_value_boolean = Boolean(value)
              break
            case 'date':
              dynamicField.field_value_date = new Date(value).toISOString()
              break
            default:
              dynamicField.field_value_text = String(value)
          }

          dynamicFields.push(dynamicField)
        }
      })

      const request: HERAEntityRequest = {
        p_action: 'CREATE',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: entity,
        p_dynamic: dynamicFields,
        p_relationships: [],
        p_options: {}
      }

      console.log('🔨 HERA Entity Create Request:', request)

      const { data, error } = await supabase.rpc('hera_entities_crud_v1', request)

      if (error) {
        console.error('❌ HERA Entity Create Error:', error)
        return {
          success: false,
          error: error.message || 'Failed to create entity',
          data: {}
        }
      }

      console.log('✅ HERA Entity Create Response:', data)

      return {
        success: true,
        data: {
          entity: data?.entity || entity
        },
        metadata: {
          actor_user_id: this.actorUserId,
          organization_id: this.organizationId,
          operation: 'CREATE',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('❌ HERA Entity Create Exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {}
      }
    }
  }

  /**
   * Update an existing entity
   */
  async updateEntity(
    entityId: string,
    config: EntityTypeConfig,
    entityData: Record<string, any>
  ): Promise<HERAEntityResponse> {
    try {
      // Prepare entity data
      const entity: HERAEntityData = {
        id: entityId,
        entity_type: config.id,
        entity_name: entityData.entity_name || entityData.name,
        organization_id: this.organizationId
      }

      // Prepare dynamic fields (only changed ones)
      const dynamicFields: HERADynamicField[] = []
      config.fields.forEach(fieldConfig => {
        const value = entityData[fieldConfig.name]
        if (value !== undefined) { // Include undefined to allow clearing fields
          const smartCode = `${config.smart_code_prefix}.${entityData.entity_code || 'ENTITY'}.v1`
          const dynamicField: HERADynamicField = {
            field_name: fieldConfig.name,
            field_type: this.mapFieldType(fieldConfig.type),
            smart_code: `${smartCode}.FIELD.${fieldConfig.name.toUpperCase()}.v1`
          }

          // Set appropriate value based on type
          if (value === null || value === '') {
            // Clear the field
            dynamicField.field_value_text = null
          } else {
            switch (dynamicField.field_type) {
              case 'number':
                dynamicField.field_value_number = Number(value)
                break
              case 'boolean':
                dynamicField.field_value_boolean = Boolean(value)
                break
              case 'date':
                dynamicField.field_value_date = new Date(value).toISOString()
                break
              default:
                dynamicField.field_value_text = String(value)
            }
          }

          dynamicFields.push(dynamicField)
        }
      })

      const request: HERAEntityRequest = {
        p_action: 'UPDATE',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: entity,
        p_dynamic: dynamicFields,
        p_relationships: [],
        p_options: {}
      }

      console.log('📝 HERA Entity Update Request:', request)

      const { data, error } = await supabase.rpc('hera_entities_crud_v1', request)

      if (error) {
        console.error('❌ HERA Entity Update Error:', error)
        return {
          success: false,
          error: error.message || 'Failed to update entity',
          data: {}
        }
      }

      console.log('✅ HERA Entity Update Response:', data)

      return {
        success: true,
        data: {
          entity: data?.entity || entity
        },
        metadata: {
          actor_user_id: this.actorUserId,
          organization_id: this.organizationId,
          operation: 'UPDATE',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('❌ HERA Entity Update Exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {}
      }
    }
  }

  /**
   * Delete an entity
   */
  async deleteEntity(entityId: string, entityType: string): Promise<HERAEntityResponse> {
    try {
      const request: HERAEntityRequest = {
        p_action: 'DELETE',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: {
          id: entityId,
          entity_type: entityType,
          entity_name: '',
          smart_code: '',
          organization_id: this.organizationId
        },
        p_options: {}
      }

      console.log('🗑️ HERA Entity Delete Request:', request)

      const { data, error } = await supabase.rpc('hera_entities_crud_v1', request)

      if (error) {
        console.error('❌ HERA Entity Delete Error:', error)
        return {
          success: false,
          error: error.message || 'Failed to delete entity',
          data: {}
        }
      }

      console.log('✅ HERA Entity Delete Response:', data)

      return {
        success: true,
        data: {},
        metadata: {
          actor_user_id: this.actorUserId,
          organization_id: this.organizationId,
          operation: 'DELETE',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('❌ HERA Entity Delete Exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {}
      }
    }
  }

  /**
   * Bulk delete entities
   */
  async bulkDeleteEntities(entityIds: string[], entityType: string): Promise<HERAEntityResponse> {
    try {
      const results = await Promise.all(
        entityIds.map(id => this.deleteEntity(id, entityType))
      )

      const failures = results.filter(r => !r.success)
      if (failures.length > 0) {
        return {
          success: false,
          error: `Failed to delete ${failures.length} entities`,
          data: {}
        }
      }

      return {
        success: true,
        data: {},
        metadata: {
          actor_user_id: this.actorUserId,
          organization_id: this.organizationId,
          operation: 'BULK_DELETE',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('❌ HERA Bulk Delete Exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {}
      }
    }
  }

  /**
   * Map entity field types to HERA dynamic field types
   */
  private mapFieldType(fieldType: string): HERADynamicField['field_type'] {
    switch (fieldType) {
      case 'number':
        return 'number'
      case 'checkbox':
        return 'boolean'
      case 'date':
      case 'datetime':
        return 'date'
      case 'email':
        return 'email'
      case 'phone':
        return 'phone'
      case 'url':
        return 'url'
      default:
        return 'text'
    }
  }

  /**
   * Generate entity code
   */
  private generateEntityCode(entityType: string): string {
    const prefix = entityType.toUpperCase().substring(0, 3)
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${timestamp}`
  }
}

/**
 * Factory function to create HERA Entity Client
 */
export function createHERAEntityClient(actorUserId: string, organizationId: string): HERAEntityClient {
  if (!actorUserId || !organizationId) {
    throw new Error(`Invalid HERA client parameters: actorUserId=${!!actorUserId}, organizationId=${!!organizationId}`)
  }
  
  try {
    return new HERAEntityClient(actorUserId, organizationId)
  } catch (error) {
    console.error('Failed to create HERA Entity Client:', error)
    throw error
  }
}

export default HERAEntityClient