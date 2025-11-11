/**
 * Universal Entity API - RPC Function Integration
 * Smart Code: HERA.PLATFORM.API.UNIVERSAL.ENTITY.v1
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ralywraqvuqgdezttfde.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjM0NzYsImV4cCI6MjA3NjkzOTQ3Nn0.M4dYgOzOCDWyOp3rSQYGn9QGx4DVzIIlqvBiC8s1sZk'

// Known working user for retail organization
const RETAIL_USER_ID = 'f7f778da-e629-40f2-a255-38825ed1db37'

export interface DynamicField {
  name: string
  type: 'text' | 'number' | 'boolean' | 'email' | 'date' | 'textarea' | 'select'
  value: string | number | boolean
  smartCode: string
}

export interface EntityCreationRequest {
  entityType: string
  entityName: string
  entityCode?: string
  entityDescription?: string
  organizationId: string
  smartCode: string
  dynamicFields: DynamicField[]
}

export interface EntityCreationResult {
  success: boolean
  entityId?: string
  error?: string
  context?: string
  data?: any
}

export class UniversalEntityAPI {
  private supabase

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  /**
   * Create entity using hera_entities_crud_v1 RPC function
   */
  async createEntity(request: EntityCreationRequest): Promise<EntityCreationResult> {
    try {
      console.log('🚀 Creating entity with Universal Entity API', {
        type: request.entityType,
        name: request.entityName,
        org: request.organizationId
      })

      // Build entity payload
      const entityPayload = {
        entity_type: request.entityType,
        entity_name: request.entityName,
        entity_code: request.entityCode || this.generateEntityCode(request.entityName),
        entity_description: request.entityDescription || '',
        smart_code: request.smartCode
      }

      // Build dynamic data payload
      const dynamicPayload = request.dynamicFields.reduce((acc, field) => {
        if (field.value !== '' && field.value !== null && field.value !== undefined) {
          // Determine field type and value key
          let fieldType: string
          let valueKey: string
          let fieldValue: any

          switch (field.type) {
            case 'number':
              fieldType = 'number'
              valueKey = 'field_value_number'
              fieldValue = Number(field.value)
              break
            case 'boolean':
              fieldType = 'boolean'
              valueKey = 'field_value_boolean'
              fieldValue = Boolean(field.value)
              break
            default:
              fieldType = 'text'
              valueKey = 'field_value_text'
              fieldValue = String(field.value)
          }

          acc[field.name] = {
            field_type: fieldType,
            [valueKey]: fieldValue,
            smart_code: field.smartCode
          }
        }
        return acc
      }, {} as Record<string, any>)

      console.log('📦 Entity Payload:', entityPayload)
      console.log('🔧 Dynamic Payload:', dynamicPayload)

      // Call the RPC function
      const result = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: RETAIL_USER_ID,
        p_organization_id: request.organizationId,
        p_entity: entityPayload,
        p_dynamic: dynamicPayload,
        p_relationships: [],
        p_options: {}
      })

      console.log('📥 RPC Response:', result)

      // Handle response
      if (result.error) {
        console.error('❌ Supabase Error:', result.error)
        return {
          success: false,
          error: `Database error: ${result.error.message}`
        }
      }

      if (result.data?.error) {
        console.error('❌ RPC Error:', result.data.error)
        return {
          success: false,
          error: result.data.error,
          context: result.data.context
        }
      }

      // Extract entity ID from response
      const entityId = result.data?.items?.[0]?.id || 
                      result.data?.entity_id ||
                      result.data?.id

      if (!entityId) {
        console.warn('⚠️ No entity ID in response:', result.data)
        return {
          success: true,
          error: 'Entity created but ID not returned',
          data: result.data
        }
      }

      console.log('✅ Entity created successfully:', entityId)
      
      return {
        success: true,
        entityId,
        data: result.data
      }

    } catch (error) {
      console.error('💥 Exception creating entity:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Generate entity code from name
   */
  private generateEntityCode(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20)
  }

  /**
   * Validate Smart Code format
   */
  validateSmartCode(smartCode: string): { valid: boolean; error?: string } {
    const pattern = /^HERA\.[A-Z_]+\.[A-Z_]+\.[A-Z_]+\.[A-Z_]+\.v\d+$/
    
    if (!pattern.test(smartCode)) {
      return {
        valid: false,
        error: 'Smart Code must follow pattern: HERA.{INDUSTRY}.{TYPE}.{CATEGORY}.{SUBCATEGORY}.v{VERSION}'
      }
    }

    return { valid: true }
  }

  /**
   * Generate Smart Code based on components
   */
  generateSmartCode(
    industry: string = 'SOFTWARE',
    entityType: string,
    category: string = 'GENERAL',
    subcategory: string = 'STANDARD'
  ): string {
    const cleanComponent = (component: string) => 
      component.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')

    return [
      'HERA',
      cleanComponent(industry),
      cleanComponent(entityType),
      cleanComponent(category),
      cleanComponent(subcategory),
      'v1'
    ].join('.')
  }

  /**
   * Get available organizations (for dropdown)
   */
  async getOrganizations(): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await this.supabase
        .from('core_organizations')
        .select('id, organization_name')
        .order('organization_name')

      if (error) {
        console.error('Error fetching organizations:', error)
        return []
      }

      return data.map(org => ({
        id: org.id,
        name: org.organization_name
      }))
    } catch (error) {
      console.error('Exception fetching organizations:', error)
      return []
    }
  }

  /**
   * Query entities for verification
   */
  async getEntitiesByOrganization(organizationId: string, entityType?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('core_entities')
        .select('id, entity_name, entity_code, entity_type, smart_code, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (entityType) {
        query = query.eq('entity_type', entityType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching entities:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception fetching entities:', error)
      return []
    }
  }
}

// Export singleton instance
export const universalEntityAPI = new UniversalEntityAPI()