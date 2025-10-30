/**
 * Master CRUD v2 - Core Implementation
 * High-performance atomic operations for HERA ERP Sacred Six schema
 * 
 * Performance Target: 73% improvement (300ms → 80ms)
 * ACID Compliance: Full transaction support with automatic rollback
 */

import { supabase, selectValue, selectRows, rpc } from '@/lib/db'
import { createTransaction, DatabaseTransaction } from '@/lib/db-transaction'
import {
  CreateEntityCompleteRequest,
  CreateEntityCompleteResponse,
  UpdateEntityCompleteRequest,
  UpdateEntityCompleteResponse,
  DeleteEntityCompleteRequest,
  DeleteEntityCompleteResponse,
  QueryEntityCompleteRequest,
  QueryEntityCompleteResponse,
  MasterCrudV2Service,
  MasterCrudDynamicField,
  MasterCrudRelationship,
  MasterCrudError,
  MasterCrudValidationResult,
  PerformanceMetrics,
  SmartCodeValidation,
  SmartCodeLookup,
  MasterCrudEntityResult,
  convertDynamicData
} from '@/types/master-crud-v2.types'
import { CoreEntities, CoreDynamicData, CoreRelationships } from '@/types/hera-database.types'

/**
 * Master CRUD v2 Service Implementation
 * Single atomic operations for complete entity management
 */
export class MasterCrudV2ServiceImpl implements MasterCrudV2Service {
  private performanceTarget = 80 // Target response time in ms
  
  /**
   * Create Entity Complete - Atomic operation
   * Replaces 3-5 separate API calls with single ACID transaction
   */
  async createEntityComplete(request: CreateEntityCompleteRequest): Promise<CreateEntityCompleteResponse> {
    const startTime = Date.now()
    
    try {
      // Validate request
      const validation = this.validateCreateRequest(request)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // Smart code validation and generation
      const smartCode = await this.validateAndGenerateSmartCode(request.smartCode, request.entityType)
      
      const transaction = createTransaction(supabase)
      let entityId: string
      const dynamicDataIds: string[] = []
      const relationshipIds: string[] = []

      // Step 1: Create entity
      transaction.add('create_entity', async () => {
        const sql = `
          SELECT entity_id FROM hera_entities_crud_v1(
            'CREATE'::text,
            $18::uuid,
            $1::uuid,
            jsonb_build_object(
              'entity_type', $2::text,
              'entity_name', $3::text,
              'entity_code', $6::text,
              'entity_description', $7::text,
              'smart_code', $4::text,
              'parent_entity_id', $8::uuid,
              'status', $9::text,
              'metadata', $13::jsonb
            ),
            $17::jsonb,
            '[]'::jsonb,
            '{}'::jsonb
          )
        `
        
        const params = [
          request.organizationId,
          request.entityType,
          request.entityName,
          smartCode,
          null, // entity_id (new entity)
          request.entityCode || null,
          request.entityDescription || null,
          request.parentEntityId || null,
          request.status || 'active',
          request.tags || null,
          request.smartCodeStatus || 'ACTIVE',
          request.businessRules || {},
          request.metadata || {},
          request.aiConfidence || 0,
          request.aiClassification || null,
          request.aiInsights || {},
          {}, // attributes
          request.actorUserId || null
        ]

        const result = await selectValue<string>(sql, params)
        entityId = result
        return { entityId: result }
      })

      // Step 2: Add dynamic data fields
      if (request.dynamicData) {
        const fields = Array.isArray(request.dynamicData) 
          ? request.dynamicData 
          : convertDynamicData(request.dynamicData)

        for (const [index, field] of fields.entries()) {
          transaction.add(`create_dynamic_field_${index}`, async () => {
            const prevResult = transaction.getResult<{entityId: string}>('create_entity')
            if (!prevResult) throw new Error('Entity creation failed')

            const sql = `
              INSERT INTO core_dynamic_data (
                organization_id, entity_id, field_name, field_type,
                field_value_text, field_value_number, field_value_boolean, 
                field_value_date, field_value_json, field_value_file_url,
                smart_code, validation_rules, is_required, is_searchable, field_order,
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
              ) RETURNING id
            `

            const params = [
              request.organizationId,
              prevResult.entityId,
              field.field_name,
              field.field_type || 'text',
              field.field_value_text || null,
              field.field_value_number || null,
              field.field_value_boolean || null,
              field.field_value_date || null,
              field.field_value_json || null,
              field.field_value_file_url || null,
              field.smart_code || null,
              field.validation_rules || null,
              field.is_required || false,
              field.is_searchable || true,
              field.field_order || index
            ]

            const result = await selectValue<{id: string}>(sql, params)
            dynamicDataIds.push(result.id)
            return result
          })
        }
      }

      // Step 3: Create relationships
      if (request.relationships) {
        for (const [index, relationship] of request.relationships.entries()) {
          transaction.add(`create_relationship_${index}`, async () => {
            const prevResult = transaction.getResult<{entityId: string}>('create_entity')
            if (!prevResult) throw new Error('Entity creation failed')

            // Resolve target entity if using smart code
            let targetEntityId = relationship.targetEntityId
            if (!targetEntityId && relationship.targetSmartCode) {
              targetEntityId = await this.resolveEntityBySmartCode(
                relationship.targetSmartCode, 
                request.organizationId
              )
            }

            if (!targetEntityId) {
              throw new Error(`Cannot resolve target entity for relationship ${relationship.type}`)
            }

            const sql = `
              SELECT hera_relationship_upsert_v1(
                $1::uuid, $2::uuid, $3::uuid, $4::text, $5::text,
                $6::text, $7::numeric, $8::jsonb, $9::text, $10::numeric,
                $11::text, $12::jsonb, $13::jsonb, $14::jsonb, $15::boolean,
                $16::timestamptz, $17::timestamptz, $18::uuid
              ) as relationship_id
            `

            const params = [
              request.organizationId,
              relationship.sourceEntityId || prevResult.entityId,
              targetEntityId,
              relationship.type,
              relationship.smart_code || null,
              relationship.direction || 'forward',
              relationship.strength || 1,
              relationship.metadata || {},
              'ACTIVE',
              0, // ai_confidence
              null, // ai_classification
              {}, // ai_insights
              {}, // business_logic
              {}, // validation_rules
              relationship.isActive !== false,
              relationship.effectiveDate || new Date().toISOString(),
              relationship.expirationDate || null,
              request.actorUserId || null
            ]

            const result = await selectValue<string>(sql, params)
            relationshipIds.push(result)
            return { relationshipId: result }
          })
        }
      }

      // Execute all operations atomically
      const results = await transaction.execute()
      const executionTime = Date.now() - startTime

      // Get the created entity
      const entity = await this.getEntityById(entityId!, request.organizationId)

      const response: CreateEntityCompleteResponse = {
        api_version: 'v2',
        success: true,
        entityId: entityId!,
        entity,
        dynamicDataIds,
        relationshipIds,
        performance: {
          executionTimeMs: executionTime,
          operationsCount: 1 + dynamicDataIds.length + relationshipIds.length,
          cacheHit: false
        }
      }

      // Check performance target
      if (executionTime > this.performanceTarget) {
        response.warnings = [`Execution time ${executionTime}ms exceeded target ${this.performanceTarget}ms`]
      }

      return response

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('Error in createEntityComplete:', error)
      
      throw {
        api_version: 'v2',
        success: false,
        error: 'operation_failed',
        errors: [{
          code: 'ATOMIC_OPERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          operation: 'createEntityComplete'
        }],
        performance: {
          executionTimeMs: executionTime,
          failedAt: 'atomic_transaction'
        }
      }
    }
  }

  /**
   * Update Entity Complete - Atomic update operation
   */
  async updateEntityComplete(request: UpdateEntityCompleteRequest): Promise<UpdateEntityCompleteResponse> {
    const startTime = Date.now()
    
    try {
      const validation = this.validateUpdateRequest(request)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      const transaction = createTransaction(supabase)
      const changes = {
        dynamicData: { upserted: [] as string[], deleted: [] as string[] },
        relationships: { upserted: [] as string[], deleted: [] as string[] }
      }

      // Step 1: Update entity if fields provided
      if (this.hasEntityUpdates(request)) {
        transaction.add('update_entity', async () => {
          const sql = `
            UPDATE core_entities 
            SET 
              entity_name = COALESCE($3, entity_name),
              entity_code = COALESCE($4, entity_code),
              entity_description = COALESCE($5, entity_description),
              parent_entity_id = COALESCE($6, parent_entity_id),
              smart_code = COALESCE($7, smart_code),
              smart_code_status = COALESCE($8, smart_code_status),
              status = COALESCE($9, status),
              tags = COALESCE($10, tags),
              metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE($11, '{}'::jsonb),
              business_rules = COALESCE(business_rules, '{}'::jsonb) || COALESCE($12, '{}'::jsonb),
              ai_confidence = COALESCE($13, ai_confidence),
              ai_classification = COALESCE($14, ai_classification),
              ai_insights = COALESCE(ai_insights, '{}'::jsonb) || COALESCE($15, '{}'::jsonb),
              updated_at = NOW(),
              updated_by = $16
            WHERE id = $1 AND organization_id = $2
            RETURNING id
          `

          const params = [
            request.entityId,
            request.organizationId,
            request.entityName,
            request.entityCode,
            request.entityDescription,
            request.parentEntityId,
            request.smartCode,
            request.smartCodeStatus,
            request.status,
            request.tags,
            request.metadata,
            request.businessRules,
            request.aiConfidence,
            request.aiClassification,
            request.aiInsights,
            request.actorUserId
          ]

          return await selectValue<{id: string}>(sql, params)
        })
      }

      // Step 2: Handle dynamic data updates
      if (request.dynamicData?.upsert) {
        const fields = Array.isArray(request.dynamicData.upsert) 
          ? request.dynamicData.upsert 
          : convertDynamicData(request.dynamicData.upsert)

        for (const [index, field] of fields.entries()) {
          transaction.add(`upsert_dynamic_field_${index}`, async () => {
            const sql = `
              INSERT INTO core_dynamic_data (
                organization_id, entity_id, field_name, field_type,
                field_value_text, field_value_number, field_value_boolean, 
                field_value_date, field_value_json, field_value_file_url,
                smart_code, validation_rules, is_required, is_searchable,
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
              )
              ON CONFLICT (organization_id, entity_id, field_name)
              DO UPDATE SET
                field_type = EXCLUDED.field_type,
                field_value_text = EXCLUDED.field_value_text,
                field_value_number = EXCLUDED.field_value_number,
                field_value_boolean = EXCLUDED.field_value_boolean,
                field_value_date = EXCLUDED.field_value_date,
                field_value_json = EXCLUDED.field_value_json,
                field_value_file_url = EXCLUDED.field_value_file_url,
                smart_code = EXCLUDED.smart_code,
                validation_rules = EXCLUDED.validation_rules,
                is_required = EXCLUDED.is_required,
                is_searchable = EXCLUDED.is_searchable,
                updated_at = NOW()
              RETURNING id
            `

            const params = [
              request.organizationId,
              request.entityId,
              field.field_name,
              field.field_type || 'text',
              field.field_value_text || null,
              field.field_value_number || null,
              field.field_value_boolean || null,
              field.field_value_date || null,
              field.field_value_json || null,
              field.field_value_file_url || null,
              field.smart_code || null,
              field.validation_rules || null,
              field.is_required || false,
              field.is_searchable || true
            ]

            const result = await selectValue<{id: string}>(sql, params)
            changes.dynamicData.upserted.push(result.id)
            return result
          })
        }
      }

      // Step 3: Delete dynamic data fields if specified
      if (request.dynamicData?.delete?.length) {
        transaction.add('delete_dynamic_fields', async () => {
          const sql = `
            DELETE FROM core_dynamic_data 
            WHERE organization_id = $1 AND entity_id = $2 AND field_name = ANY($3)
            RETURNING id
          `
          
          const result = await selectRows(sql, [
            request.organizationId,
            request.entityId,
            request.dynamicData.delete
          ])

          changes.dynamicData.deleted = result.map(r => r.id)
          return result
        })
      }

      // Execute transaction
      await transaction.execute()
      const executionTime = Date.now() - startTime

      // Get updated entity
      const entity = await this.getEntityById(request.entityId, request.organizationId)

      const response: UpdateEntityCompleteResponse = {
        api_version: 'v2',
        success: true,
        entityId: request.entityId,
        entity,
        changes,
        performance: {
          executionTimeMs: executionTime,
          operationsCount: transaction['operations'].length,
          cacheHit: false
        }
      }

      if (executionTime > this.performanceTarget) {
        response.warnings = [`Execution time ${executionTime}ms exceeded target ${this.performanceTarget}ms`]
      }

      return response

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('Error in updateEntityComplete:', error)
      
      throw {
        api_version: 'v2',
        success: false,
        error: 'operation_failed',
        errors: [{
          code: 'ATOMIC_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          operation: 'updateEntityComplete'
        }],
        performance: {
          executionTimeMs: executionTime,
          failedAt: 'atomic_transaction'
        }
      }
    }
  }

  /**
   * Delete Entity Complete - Atomic deletion
   */
  async deleteEntityComplete(request: DeleteEntityCompleteRequest): Promise<DeleteEntityCompleteResponse> {
    const startTime = Date.now()
    
    try {
      const transaction = createTransaction(supabase)
      let deletedCounts = { entity: false, dynamicData: 0, relationships: 0 }

      // Step 1: Delete relationships if cascade enabled
      if (request.cascadeRelationships !== false) {
        transaction.add('delete_relationships', async () => {
          const sql = `
            DELETE FROM core_relationships 
            WHERE organization_id = $1 AND (from_entity_id = $2 OR to_entity_id = $2)
            RETURNING id
          `
          
          const result = await selectRows(sql, [request.organizationId, request.entityId])
          deletedCounts.relationships = result.length
          return result
        })
      }

      // Step 2: Delete dynamic data if cascade enabled
      if (request.cascadeDynamicData !== false) {
        transaction.add('delete_dynamic_data', async () => {
          const sql = `
            DELETE FROM core_dynamic_data 
            WHERE organization_id = $1 AND entity_id = $2
            RETURNING id
          `
          
          const result = await selectRows(sql, [request.organizationId, request.entityId])
          deletedCounts.dynamicData = result.length
          return result
        })
      }

      // Step 3: Delete or archive entity
      transaction.add('delete_entity', async () => {
        if (request.deleteMode === 'soft' || request.deleteMode === 'archive') {
          const sql = `
            UPDATE core_entities 
            SET status = $3, updated_at = NOW(), updated_by = $4
            WHERE id = $1 AND organization_id = $2
            RETURNING id
          `
          
          const status = request.deleteMode === 'archive' ? 'archived' : 'deleted'
          await selectValue(sql, [request.entityId, request.organizationId, status, request.actorUserId])
        } else {
          const sql = `
            DELETE FROM core_entities 
            WHERE id = $1 AND organization_id = $2
            RETURNING id
          `
          
          await selectValue(sql, [request.entityId, request.organizationId])
        }
        
        deletedCounts.entity = true
        return { deleted: true }
      })

      await transaction.execute()
      const executionTime = Date.now() - startTime

      return {
        api_version: 'v2',
        success: true,
        entityId: request.entityId,
        deleted: deletedCounts,
        performance: {
          executionTimeMs: executionTime,
          operationsCount: transaction['operations'].length
        }
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('Error in deleteEntityComplete:', error)
      
      throw {
        api_version: 'v2',
        success: false,
        error: 'operation_failed',
        errors: [{
          code: 'ATOMIC_DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          operation: 'deleteEntityComplete'
        }],
        performance: {
          executionTimeMs: executionTime,
          failedAt: 'atomic_transaction'
        }
      }
    }
  }

  /**
   * Query Entity Complete - Efficient retrieval
   */
  async queryEntityComplete(request: QueryEntityCompleteRequest): Promise<QueryEntityCompleteResponse> {
    const startTime = Date.now()
    
    try {
      // Build entity query
      let entitySql = `
        SELECT * FROM core_entities 
        WHERE organization_id = $1
      `
      const params: any[] = [request.organizationId]
      let paramIndex = 1

      // Add filters
      if (request.entityId) {
        entitySql += ` AND id = $${++paramIndex}`
        params.push(request.entityId)
      }
      
      if (request.entityIds?.length) {
        entitySql += ` AND id = ANY($${++paramIndex})`
        params.push(request.entityIds)
      }

      if (request.entityType) {
        entitySql += ` AND entity_type = $${++paramIndex}`
        params.push(request.entityType)
      }

      if (request.entityTypes?.length) {
        entitySql += ` AND entity_type = ANY($${++paramIndex})`
        params.push(request.entityTypes)
      }

      if (request.smartCode) {
        entitySql += ` AND smart_code = $${++paramIndex}`
        params.push(request.smartCode)
      }

      if (request.smartCodes?.length) {
        entitySql += ` AND smart_code = ANY($${++paramIndex})`
        params.push(request.smartCodes)
      }

      // Add status filters
      if (request.filters?.status?.length) {
        entitySql += ` AND status = ANY($${++paramIndex})`
        params.push(request.filters.status)
      }

      // Add ordering and pagination
      const orderBy = request.orderBy || 'created_at'
      const orderDirection = request.orderDirection || 'desc'
      entitySql += ` ORDER BY ${orderBy} ${orderDirection}`

      if (request.limit) {
        entitySql += ` LIMIT $${++paramIndex}`
        params.push(request.limit)
      }

      if (request.offset) {
        entitySql += ` OFFSET $${++paramIndex}`
        params.push(request.offset)
      }

      // Execute entity query
      const entities = await selectRows(entitySql, params) as CoreEntities[]
      
      // Build results with additional data
      const results: MasterCrudEntityResult[] = []
      
      for (const entity of entities) {
        const result: MasterCrudEntityResult = { entity }

        // Include dynamic data if requested
        if (request.includeDynamicData) {
          if (request.includeDynamicData === true) {
            const dynamicSql = `
              SELECT * FROM core_dynamic_data 
              WHERE organization_id = $1 AND entity_id = $2
              ORDER BY field_order, field_name
            `
            result.dynamicData = await selectRows(dynamicSql, [request.organizationId, entity.id])
          } else if (Array.isArray(request.includeDynamicData)) {
            const dynamicSql = `
              SELECT * FROM core_dynamic_data 
              WHERE organization_id = $1 AND entity_id = $2 AND field_name = ANY($3)
              ORDER BY field_order, field_name
            `
            result.dynamicData = await selectRows(dynamicSql, [
              request.organizationId, 
              entity.id, 
              request.includeDynamicData
            ])
          }
        }

        // Include relationships if requested
        if (request.includeRelationships) {
          const relConfig = request.includeRelationships === true 
            ? { incoming: true, outgoing: true } 
            : request.includeRelationships

          result.relationships = { incoming: [], outgoing: [] }

          if (relConfig.incoming) {
            const incomingSql = `
              SELECT * FROM core_relationships 
              WHERE organization_id = $1 AND to_entity_id = $2
              ${relConfig.relationshipTypes?.length ? `AND relationship_type = ANY($3)` : ''}
            `
            const incomingParams = [request.organizationId, entity.id]
            if (relConfig.relationshipTypes?.length) {
              incomingParams.push(relConfig.relationshipTypes)
            }
            result.relationships.incoming = await selectRows(incomingSql, incomingParams)
          }

          if (relConfig.outgoing) {
            const outgoingSql = `
              SELECT * FROM core_relationships 
              WHERE organization_id = $1 AND from_entity_id = $2
              ${relConfig.relationshipTypes?.length ? `AND relationship_type = ANY($3)` : ''}
            `
            const outgoingParams = [request.organizationId, entity.id]
            if (relConfig.relationshipTypes?.length) {
              outgoingParams.push(relConfig.relationshipTypes)
            }
            result.relationships.outgoing = await selectRows(outgoingSql, outgoingParams)
          }
        }

        results.push(result)
      }

      const executionTime = Date.now() - startTime

      return {
        api_version: 'v2',
        success: true,
        entities: results,
        pagination: request.limit ? {
          total: entities.length, // Would need separate count query for accurate total
          limit: request.limit,
          offset: request.offset || 0,
          hasMore: entities.length === request.limit
        } : undefined,
        performance: {
          executionTimeMs: executionTime,
          cacheHit: false
        }
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('Error in queryEntityComplete:', error)
      
      throw {
        api_version: 'v2',
        success: false,
        error: 'query_failed',
        errors: [{
          code: 'QUERY_EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          operation: 'queryEntityComplete'
        }],
        performance: {
          executionTimeMs: executionTime,
          failedAt: 'query_execution'
        }
      }
    }
  }

  // Helper methods
  private validateCreateRequest(request: CreateEntityCompleteRequest): MasterCrudValidationResult {
    const errors: MasterCrudError[] = []
    
    if (!request.organizationId) {
      errors.push({ code: 'MISSING_ORGANIZATION_ID', message: 'organization_id is required' })
    }
    
    if (!request.entityType) {
      errors.push({ code: 'MISSING_ENTITY_TYPE', message: 'entityType is required' })
    }
    
    if (!request.entityName) {
      errors.push({ code: 'MISSING_ENTITY_NAME', message: 'entityName is required' })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  private validateUpdateRequest(request: UpdateEntityCompleteRequest): MasterCrudValidationResult {
    const errors: MasterCrudError[] = []
    
    if (!request.organizationId) {
      errors.push({ code: 'MISSING_ORGANIZATION_ID', message: 'organization_id is required' })
    }
    
    if (!request.entityId) {
      errors.push({ code: 'MISSING_ENTITY_ID', message: 'entityId is required' })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  private async validateAndGenerateSmartCode(smartCode: string | undefined, entityType: string): Promise<string> {
    if (smartCode) {
      // Validate existing smart code format
      const validation = this.validateSmartCode(smartCode)
      if (!validation.isValid) {
        throw new Error(`Invalid smart code format: ${validation.errors?.join(', ')}`)
      }
      return smartCode
    }
    
    // Generate smart code
    return `HERA.UNIVERSAL.${entityType.toUpperCase()}.ENTITY.PROFILE.V1`
  }

  private async resolveEntityBySmartCode(smartCode: string, organizationId: string): Promise<string | null> {
    const sql = `
      SELECT id FROM core_entities 
      WHERE organization_id = $1 AND smart_code = $2 AND status != 'deleted'
      LIMIT 1
    `
    
    try {
      const result = await selectValue<{id: string}>(sql, [organizationId, smartCode])
      return result?.id || null
    } catch {
      return null
    }
  }

  private async getEntityById(entityId: string, organizationId: string): Promise<CoreEntities> {
    const sql = `
      SELECT * FROM core_entities 
      WHERE id = $1 AND organization_id = $2
    `
    
    return await selectValue<CoreEntities>(sql, [entityId, organizationId])
  }

  private hasEntityUpdates(request: UpdateEntityCompleteRequest): boolean {
    return !!(
      request.entityName ||
      request.entityCode ||
      request.entityDescription ||
      request.parentEntityId ||
      request.smartCode ||
      request.smartCodeStatus ||
      request.status ||
      request.tags ||
      request.metadata ||
      request.businessRules ||
      request.aiConfidence ||
      request.aiClassification ||
      request.aiInsights
    )
  }

  // Stub implementations for interface compliance
  async batchOperations(): Promise<any> {
    throw new Error('Batch operations not implemented yet')
  }

  validateRequest(): MasterCrudValidationResult {
    return { isValid: true, errors: [], warnings: [] }
  }

  validateSmartCode(code: string): SmartCodeValidation {
    const regex = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V\d+$/
    const isValid = regex.test(code)
    
    return {
      code,
      isValid,
      format: 'HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{VERSION}',
      family: isValid ? code.split('.')[1] : '',
      version: isValid ? code.split('.').pop() || '' : '',
      errors: isValid ? [] : ['Invalid smart code format']
    }
  }

  async lookupBySmartCode(): Promise<MasterCrudEntityResult | null> {
    throw new Error('Smart code lookup not implemented yet')
  }

  async benchmark(): Promise<PerformanceMetrics> {
    throw new Error('Benchmark not implemented yet')
  }

  async clearCache(): Promise<void> {
    // Stub implementation
  }

  async healthCheck(): Promise<any> {
    return {
      status: 'healthy' as const,
      responseTimeMs: 50,
      features: ['createEntityComplete', 'updateEntityComplete', 'deleteEntityComplete', 'queryEntityComplete']
    }
  }
}

// Export singleton instance
export const masterCrudV2 = new MasterCrudV2ServiceImpl()