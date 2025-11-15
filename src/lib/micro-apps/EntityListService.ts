/**
 * Entity List Service
 * Smart Code: HERA.MICRO_APPS.UNIVERSAL.ENTITY_LIST_SERVICE.v1
 * 
 * Comprehensive service for entity listing operations
 * Handles data fetching, search, edit, delete with micro-app integration
 * 
 * 🚨 PERMANENT DEVELOPMENT RULE:
 * ================================
 * ALL ENTITY OPERATIONS MUST USE API v2 WITH hera_entities_crud_v1 RPC FUNCTION
 * - This is TESTED and PRODUCTION-READY
 * - Never use direct Supabase queries for entity operations
 * - Never use complex joins or nested selects
 * - Always use: apiV2.post('entities', { operation: 'read|create|update|delete' })
 * - This ensures proper security, validation, and organization isolation
 */

import { createClient } from '@supabase/supabase-js'
import { microAppClient } from './micro-app-client'
import { createEnvironmentAwareHeraClient } from '@/lib/hera/client'
import { apiV2 } from '@/lib/client/fetchV2'
import type { WorkspaceEntityContext, EntityListConfig } from './UniversalEntityListRegistry'

// Types for service operations
export interface EntityListQuery {
  entityType: string
  organizationId: string
  searchTerm?: string
  filters?: Record<string, any>
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
  includeDeleted?: boolean
}

export interface EntityListResponse {
  entities: any[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface EntitySearchResult {
  entity: any
  score: number
  matchedFields: string[]
  highlights: Record<string, string>
}

export interface EntityUpdatePayload {
  entityId: string
  entityType: string
  updates: Record<string, any>
  dynamicFields?: Record<string, any>
  actorUserId: string
  organizationId: string
}

export interface EntityDeleteResult {
  success: boolean
  action: 'deleted' | 'archived' | 'cancelled'
  reason?: string
  auditTrailPreserved: boolean
}

/**
 * Entity List Service for comprehensive data operations
 */
export class EntityListService {
  private supabase: any
  private heraClient: any
  private config: EntityListConfig
  private workspaceContext: WorkspaceEntityContext

  constructor(config: EntityListConfig, supabaseClient?: any) {
    this.config = config
    this.workspaceContext = config.workspaceContext
    
    // Use provided client or create new one for read operations
    this.supabase = supabaseClient || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // HERA Client for write operations (goes through API v2 gateway)
    this.heraClient = null // Will be initialized when needed
  }

  /**
   * Initialize HERA client for write operations
   */
  private async initializeHeraClient(token: string, organizationId: string) {
    if (!this.heraClient) {
      try {
        this.heraClient = await createEnvironmentAwareHeraClient(token, organizationId)
        console.log('✅ HERA Client initialized for API v2 operations')
      } catch (error) {
        console.error('❌ Failed to initialize HERA Client:', error)
        throw new Error('Failed to initialize secure API client')
      }
    }
    return this.heraClient
  }

  /**
   * Fetch entities with advanced query options (API v2 + hera_entities_crud_v1)
   */
  async fetchEntities(query: EntityListQuery): Promise<EntityListResponse> {
    try {
      console.log('🔐 Fetching entities via API v2:', query)

      const {
        entityType,
        organizationId,
        searchTerm,
        filters = {},
        sortField = this.config.defaultSort.field,
        sortOrder = this.config.defaultSort.order,
        page = 1,
        limit = 25,
        includeDeleted = false
      } = query

      // Get auth token for secure API v2 call
      const authToken = await this.getAuthToken()

      // ✅ USE API v2 GATEWAY WITH hera_entities_crud_v1 - TESTED & PRODUCTION-READY
      const entityData = {
        operation: 'read',
        entity_type: entityType,
        organization_id: organizationId,
        options: {
          include_deleted: includeDeleted,
          search_term: searchTerm,
          filters: filters,
          sort_field: sortField,
          sort_order: sortOrder,
          page: page,
          limit: limit
        }
      }

      // Use API v2 endpoint through secure gateway
      const result = await apiV2.post('entities', entityData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Organization-Id': organizationId
        }
      })

      if (!result.data) {
        throw new Error('Failed to fetch entities: No response data')
      }

      const { entities = [], total = 0 } = result.data

      console.log(`✅ Fetched ${entities.length} entities via API v2 (${total} total)`)

      // Calculate pagination info
      const offset = (page - 1) * limit
      
      return {
        entities: entities,
        total,
        page,
        limit,
        hasNextPage: offset + limit < total,
        hasPreviousPage: page > 1
      }

    } catch (error) {
      console.error('❌ Error fetching entities via API v2:', error)
      throw error
    }
  }

  /**
   * Advanced search with scoring and highlighting
   */
  async searchEntities(
    searchTerm: string,
    organizationId: string,
    options: {
      limit?: number
      includeScore?: boolean
      includeHighlights?: boolean
    } = {}
  ): Promise<EntitySearchResult[]> {
    try {
      console.log('🔎 Advanced search for:', searchTerm)

      const { limit = 20, includeScore = true, includeHighlights = true } = options

      // Fetch entities with search term
      const response = await this.fetchEntities({
        entityType: this.config.entityType,
        organizationId,
        searchTerm,
        limit
      })

      // Convert to search results with scoring
      const searchResults: EntitySearchResult[] = response.entities.map(entity => {
        const result: EntitySearchResult = {
          entity,
          score: 1.0, // Default score
          matchedFields: [],
          highlights: {}
        }

        if (includeScore || includeHighlights) {
          this.calculateSearchScore(entity, searchTerm, result)
        }

        return result
      })

      // Sort by score if scoring is enabled
      if (includeScore) {
        searchResults.sort((a, b) => b.score - a.score)
      }

      console.log(`✅ Search found ${searchResults.length} results`)
      return searchResults

    } catch (error) {
      console.error('❌ Error in searchEntities:', error)
      throw error
    }
  }

  /**
   * Get auth token from current Supabase session
   */
  private async getAuthToken(): Promise<string> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No active session or access token')
      }
      return session.access_token
    } catch (error) {
      console.error('❌ Failed to get auth token:', error)
      throw new Error('Authentication required for write operations')
    }
  }

  /**
   * Update entity with micro-app integration (API v2 compliant)
   */
  async updateEntity(payload: EntityUpdatePayload): Promise<any> {
    try {
      console.log('🔐 Updating entity via API v2:', payload.entityId)

      const { entityId, entityType, updates, dynamicFields, actorUserId, organizationId } = payload

      // Check if we should use micro-app update logic
      if (this.config.microAppConfig.app_code !== 'HERA_DEFAULT') {
        return this.updateEntityViaMicroApp(payload)
      }

      // Get auth token for secure API v2 call
      const authToken = await this.getAuthToken()

      // ✅ USE API v2 GATEWAY - No direct RPC calls allowed
      const entityData = {
        operation: 'update',
        entity_type: entityType,
        entity_id: entityId,
        entity_data: updates,
        dynamic_fields: this.formatDynamicFieldsForAPIv2(dynamicFields || {}),
        organization_id: organizationId
      }

      // Use API v2 endpoint through secure gateway
      const updateResult = await apiV2.post('entities', entityData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Organization-Id': organizationId
        }
      })

      if (!updateResult.data) {
        throw new Error('Update failed: No response data')
      }

      console.log('✅ Entity updated successfully via API v2')
      return updateResult.data

    } catch (error) {
      console.error('❌ Error updating entity via API v2:', error)
      throw error
    }
  }

  /**
   * Delete entity with intelligent handling
   */
  async deleteEntity(
    entityId: string,
    actorUserId: string,
    organizationId: string,
    options: {
      forceDelete?: boolean
      preserveAudit?: boolean
    } = {}
  ): Promise<EntityDeleteResult> {
    try {
      console.log('🗑️ Analyzing entity for deletion:', entityId)

      // First, analyze if entity can be safely deleted
      const analysis = await this.analyzeEntityForDeletion(entityId, organizationId)

      if (!analysis.canDelete && !options.forceDelete) {
        // Archive instead of delete
        return this.archiveEntity(entityId, actorUserId, organizationId, analysis.reason)
      }

      // Check if we should use micro-app deletion logic
      if (this.config.microAppConfig.app_code !== 'HERA_DEFAULT') {
        return this.deleteEntityViaMicroApp(entityId, actorUserId, organizationId, options)
      }

      // Get auth token for secure API v2 call
      const authToken = await this.getAuthToken()

      // ✅ USE API v2 GATEWAY - No direct RPC calls allowed
      const entityData = {
        operation: 'delete',
        entity_id: entityId,
        entity_type: this.config.entityType,
        organization_id: organizationId,
        options: {
          force_delete: options.forceDelete,
          preserve_audit: options.preserveAudit
        }
      }

      // Use API v2 endpoint through secure gateway
      const deleteResult = await apiV2.delete('entities', entityData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Organization-Id': organizationId
        }
      })

      if (!deleteResult.data) {
        throw new Error('Deletion failed: No response data')
      }

      console.log('✅ Entity deleted successfully via API v2')
      
      return {
        success: true,
        action: 'deleted',
        auditTrailPreserved: options.preserveAudit || false
      }

    } catch (error) {
      console.error('❌ Error deleting entity:', error)
      throw error
    }
  }

  /**
   * Get entity statistics for dashboard
   */
  async getEntityStatistics(organizationId: string): Promise<{
    total: number
    recentlyCreated: number
    recentlyUpdated: number
    byStatus: Record<string, number>
  }> {
    try {
      console.log('📊 Getting entity statistics')

      // Get total count
      const { count: total } = await this.supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', this.config.entityType)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      // Get recently created (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentlyCreated } = await this.supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', this.config.entityType)
        .eq('organization_id', organizationId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .is('deleted_at', null)

      // Get recently updated (last 7 days, excluding newly created)
      const { count: recentlyUpdated } = await this.supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', this.config.entityType)
        .eq('organization_id', organizationId)
        .gte('updated_at', sevenDaysAgo.toISOString())
        .lt('created_at', sevenDaysAgo.toISOString())
        .is('deleted_at', null)

      const statistics = {
        total: total || 0,
        recentlyCreated: recentlyCreated || 0,
        recentlyUpdated: recentlyUpdated || 0,
        byStatus: {} as Record<string, number>
      }

      console.log('✅ Entity statistics calculated')
      return statistics

    } catch (error) {
      console.error('❌ Error getting entity statistics:', error)
      return {
        total: 0,
        recentlyCreated: 0,
        recentlyUpdated: 0,
        byStatus: {}
      }
    }
  }

  /**
   * Export entities to various formats
   */
  async exportEntities(
    query: EntityListQuery,
    format: 'csv' | 'excel' | 'json' = 'csv'
  ): Promise<{
    data: string | Blob
    filename: string
    contentType: string
  }> {
    try {
      console.log(`📤 Exporting entities to ${format}`)

      // Fetch all entities (remove pagination for export)
      const response = await this.fetchEntities({
        ...query,
        limit: 10000, // Large limit for export
        page: 1
      })

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const filename = `${this.config.entityType}_export_${timestamp}`

      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(response.entities, null, 2),
            filename: `${filename}.json`,
            contentType: 'application/json'
          }

        case 'csv':
          const csvData = this.convertToCSV(response.entities)
          return {
            data: csvData,
            filename: `${filename}.csv`,
            contentType: 'text/csv'
          }

        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

    } catch (error) {
      console.error('❌ Error exporting entities:', error)
      throw error
    }
  }

  // Private helper methods

  private transformEntitiesWithDynamicData(entities: any[]): any[] {
    return entities.map(entity => {
      const transformed = { ...entity }

      // Convert dynamic data array to object
      if (entity.dynamic_data && Array.isArray(entity.dynamic_data)) {
        transformed.dynamic_data = {}
        
        entity.dynamic_data.forEach((field: any) => {
          const value = field.field_value_text || 
                       field.field_value_number || 
                       field.field_value_boolean || 
                       field.field_value_date || 
                       field.field_value_json

          transformed.dynamic_data[field.field_name] = value
        })
      }

      return transformed
    })
  }

  private calculateSearchScore(entity: any, searchTerm: string, result: EntitySearchResult): void {
    const term = searchTerm.toLowerCase()
    let score = 0
    const matchedFields: string[] = []
    const highlights: Record<string, string> = {}

    // Check entity name (highest weight)
    if (entity.entity_name && entity.entity_name.toLowerCase().includes(term)) {
      score += 10
      matchedFields.push('entity_name')
      highlights.entity_name = entity.entity_name.replace(
        new RegExp(term, 'gi'),
        `<mark>$&</mark>`
      )
    }

    // Check dynamic data fields
    if (entity.dynamic_data) {
      this.config.searchableFields.forEach(field => {
        if (field !== 'entity_name' && entity.dynamic_data[field]) {
          const value = entity.dynamic_data[field].toString().toLowerCase()
          if (value.includes(term)) {
            score += 5
            matchedFields.push(field)
            highlights[field] = entity.dynamic_data[field].toString().replace(
              new RegExp(term, 'gi'),
              `<mark>$&</mark>`
            )
          }
        }
      })
    }

    // Boost score for exact matches
    if (entity.entity_name && entity.entity_name.toLowerCase() === term) {
      score *= 2
    }

    result.score = score
    result.matchedFields = matchedFields
    result.highlights = highlights
  }

  private async updateEntityViaMicroApp(payload: EntityUpdatePayload): Promise<any> {
    try {
      // Execute micro-app update logic
      const result = await microAppClient.executeAppFunction(
        this.config.microAppConfig.app_code,
        'updateEntity',
        {
          entityId: payload.entityId,
          entityType: payload.entityType,
          updates: payload.updates,
          dynamicFields: payload.dynamicFields,
          actorUserId: payload.actorUserId,
          organizationId: payload.organizationId
        }
      )

      return result
    } catch (error) {
      console.error('Error updating entity via micro-app:', error)
      throw error
    }
  }

  private async deleteEntityViaMicroApp(
    entityId: string,
    actorUserId: string,
    organizationId: string,
    options: any
  ): Promise<EntityDeleteResult> {
    try {
      const result = await microAppClient.executeAppFunction(
        this.config.microAppConfig.app_code,
        'deleteEntity',
        {
          entityId,
          actorUserId,
          organizationId,
          options
        }
      )

      return result
    } catch (error) {
      console.error('Error deleting entity via micro-app:', error)
      throw error
    }
  }

  private async analyzeEntityForDeletion(
    entityId: string,
    organizationId: string
  ): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      // Check for relationships
      const { data: relationships } = await this.supabase
        .from('core_relationships')
        .select('id')
        .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .limit(1)

      if (relationships && relationships.length > 0) {
        return {
          canDelete: false,
          reason: 'Entity has active relationships'
        }
      }

      // Check for transactions
      const { data: transactions } = await this.supabase
        .from('universal_transactions')
        .select('id')
        .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
        .eq('organization_id', organizationId)
        .limit(1)

      if (transactions && transactions.length > 0) {
        return {
          canDelete: false,
          reason: 'Entity has associated transactions'
        }
      }

      return { canDelete: true }
    } catch (error) {
      console.error('Error analyzing entity for deletion:', error)
      return { canDelete: false, reason: 'Analysis failed' }
    }
  }

  private async archiveEntity(
    entityId: string,
    actorUserId: string,
    organizationId: string,
    reason?: string
  ): Promise<EntityDeleteResult> {
    try {
      // Get auth token for secure API v2 call
      const authToken = await this.getAuthToken()

      // ✅ USE API v2 GATEWAY for archive operation
      const entityData = {
        operation: 'archive',
        entity_id: entityId,
        entity_type: this.config.entityType,
        organization_id: organizationId,
        reason: reason || 'Entity archived instead of deleted'
      }

      // Use API v2 endpoint through secure gateway
      await apiV2.patch('entities', entityData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Organization-Id': organizationId
        }
      })

      console.log('✅ Entity archived successfully via API v2')

      return {
        success: true,
        action: 'archived',
        reason: reason || 'Entity archived instead of deleted',
        auditTrailPreserved: true
      }
    } catch (error) {
      console.error('Error archiving entity:', error)
      throw error
    }
  }

  private formatDynamicFieldsForUpdate(dynamicFields: Record<string, any>): Record<string, any> {
    const formatted: Record<string, any> = {}

    Object.entries(dynamicFields).forEach(([fieldName, value]) => {
      formatted[fieldName] = {
        field_name: fieldName,
        field_type: this.inferFieldType(value),
        ...this.formatFieldValue(value)
      }
    })

    return formatted
  }

  private inferFieldType(value: any): string {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) return 'date'
    return 'text'
  }

  private formatFieldValue(value: any): Record<string, any> {
    if (typeof value === 'number') {
      return { field_value_number: value }
    }
    if (typeof value === 'boolean') {
      return { field_value_boolean: value }
    }
    if (value instanceof Date) {
      return { field_value_date: value.toISOString() }
    }
    return { field_value_text: value.toString() }
  }

  /**
   * Format dynamic fields for API v2 endpoint (different from RPC format)
   */
  private formatDynamicFieldsForAPIv2(dynamicFields: Record<string, any>): any[] {
    return Object.entries(dynamicFields).map(([fieldName, value]) => ({
      field_name: fieldName,
      field_type: this.inferFieldType(value),
      field_value: value,
      smart_code: `HERA.${this.config.microAppConfig.app_code}.${this.config.entityType}.FIELD.${fieldName.toUpperCase()}.v1`
    }))
  }


  private convertToCSV(entities: any[]): string {
    if (!entities || entities.length === 0) {
      return ''
    }

    // Get headers from export fields configuration
    const headers = [
      'ID',
      'Name',
      'Type',
      'Smart Code',
      'Created At',
      'Updated At',
      ...this.config.displayConfig.exportFields
    ]

    // Create CSV content
    const csvRows = [headers.join(',')]

    entities.forEach(entity => {
      const row = [
        entity.id || '',
        `"${(entity.entity_name || '').replace(/"/g, '""')}"`,
        entity.entity_type || '',
        entity.smart_code || '',
        entity.created_at || '',
        entity.updated_at || '',
        ...this.config.displayConfig.exportFields.map(field => {
          const value = entity.dynamic_data?.[field] || ''
          return `"${value.toString().replace(/"/g, '""')}"`
        })
      ]
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }
}

export default EntityListService