/**
 * Entity Creation Service
 * Smart Code: HERA.MICRO_APPS.UNIVERSAL.ENTITY_CREATION_SERVICE.v1
 * 
 * Orchestrates entity creation through micro-app runtime
 * Handles smart code generation, validation, and workflow triggers
 */

import { microAppClient } from './micro-app-client'
import { UniversalEntityRegistry, type WorkspaceEntityContext, type EntityCreationConfig } from './UniversalEntityRegistry'

export interface EntityCreationPayload {
  entityType: string
  entityData: Record<string, any>
  dynamicFields?: Record<string, any>
  relationships?: any[]
  workspaceContext: WorkspaceEntityContext
  appCode?: string
}

export interface EntityCreationResult {
  success: boolean
  entity_id?: string
  smart_code?: string
  execution_id?: string
  workflow_triggered?: boolean
  workflow_instance_id?: string
  message?: string
  error?: string
  validation_errors?: Record<string, string>
  audit: {
    actor_user_id: string
    organization_id: string
    timestamp: string
    operation: string
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings?: string[]
}

/**
 * Service for orchestrating entity creation through micro-apps
 */
export class EntityCreationService {

  /**
   * Create entity through micro-app runtime
   */
  static async createEntity(
    payload: EntityCreationPayload,
    actorUserId: string
  ): Promise<EntityCreationResult> {
    try {
      console.log('🚀 Starting entity creation:', payload.entityType)

      // 1. Determine which app handles this entity type
      const appCode = payload.appCode || await this.resolveAppForEntityType(
        payload.entityType,
        payload.workspaceContext.organization_id
      )

      if (!appCode) {
        return {
          success: false,
          error: `No micro-app found to handle entity type: ${payload.entityType}`,
          audit: this.createAudit(actorUserId, payload.workspaceContext.organization_id, 'CREATE_ENTITY_FAILED')
        }
      }

      // 2. Generate smart code for the entity
      const smartCode = await this.generateSmartCode(
        payload.entityType,
        payload.entityData,
        payload.workspaceContext,
        appCode
      )

      // 3. Validate entity data
      const validation = await this.validateEntityData(payload, appCode)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validation_errors: validation.errors,
          audit: this.createAudit(actorUserId, payload.workspaceContext.organization_id, 'CREATE_ENTITY_VALIDATION_FAILED')
        }
      }

      // 4. Prepare entity data with smart code and workspace context
      const enhancedEntityData = {
        ...payload.entityData,
        entity_type: payload.entityType,
        smart_code: smartCode,
        workspace_context: {
          domain: payload.workspaceContext.domain,
          section: payload.workspaceContext.section,
          workspace: payload.workspaceContext.workspace
        }
      }

      // 5. Execute entity creation through micro-app runtime
      const executionResult = await microAppClient.executeEntityOperation(
        appCode,
        'create',
        payload.entityType,
        enhancedEntityData,
        payload.workspaceContext.organization_id,
        payload.dynamicFields,
        payload.relationships
      )

      if (!executionResult.success) {
        return {
          success: false,
          error: executionResult.error || 'Entity creation failed',
          execution_id: executionResult.execution_id,
          audit: this.createAudit(actorUserId, payload.workspaceContext.organization_id, 'CREATE_ENTITY_EXECUTION_FAILED')
        }
      }

      // 6. Extract entity ID from execution result
      const entityId = executionResult.execution_result?.entity_id || 
                      executionResult.execution_result?.id ||
                      executionResult.execution_result?.data?.id

      // 7. Create workspace relationship if entity creation succeeded
      let workflowTriggered = false
      let workflowInstanceId: string | undefined

      if (entityId) {
        await this.createWorkspaceRelationship(
          entityId,
          payload.workspaceContext,
          appCode
        )

        // 8. Trigger entity creation workflows
        const workflowResult = await this.triggerEntityWorkflows(
          appCode,
          payload.entityType,
          {
            entity_id: entityId,
            entity_type: payload.entityType,
            entity_data: enhancedEntityData,
            workspace_context: payload.workspaceContext
          },
          payload.workspaceContext.organization_id
        )

        workflowTriggered = workflowResult.triggered
        workflowInstanceId = workflowResult.workflow_instance_id
      }

      console.log('✅ Entity created successfully:', entityId)

      return {
        success: true,
        entity_id: entityId,
        smart_code: smartCode,
        execution_id: executionResult.execution_id,
        workflow_triggered: workflowTriggered,
        workflow_instance_id: workflowInstanceId,
        message: `${payload.entityType} created successfully`,
        audit: this.createAudit(actorUserId, payload.workspaceContext.organization_id, 'CREATE_ENTITY_SUCCESS')
      }

    } catch (error) {
      console.error('❌ Entity creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        audit: this.createAudit(actorUserId, payload.workspaceContext.organization_id, 'CREATE_ENTITY_ERROR')
      }
    }
  }

  /**
   * Validate entity data before creation
   */
  static async validateEntityData(
    payload: EntityCreationPayload,
    appCode: string
  ): Promise<ValidationResult> {
    const errors: Record<string, string> = {}
    const warnings: string[] = []

    try {
      // 1. Get entity configuration from micro-app
      const entityConfig = await UniversalEntityRegistry.getEntityCreationConfig(
        payload.entityType,
        appCode,
        payload.workspaceContext
      )

      if (!entityConfig) {
        errors.general = `Entity configuration not found for type: ${payload.entityType}`
        return { isValid: false, errors }
      }

      // 2. Validate required fields
      entityConfig.fields.forEach(field => {
        if (field.required) {
          const value = payload.entityData[field.id]
          if (!value || (typeof value === 'string' && !value.trim())) {
            errors[field.id] = `${field.label} is required`
          }
        }

        // 3. Apply field-specific validation
        if (field.validation && payload.entityData[field.id]) {
          const validationError = field.validation(payload.entityData[field.id])
          if (validationError) {
            errors[field.id] = validationError
          }
        }
      })

      // 4. Validate business rules through micro-app
      try {
        const businessValidation = await microAppClient.executeComponent(
          appCode,
          {
            component_type: 'entity',
            action: 'validate'
          },
          {
            entity_type: payload.entityType,
            entity_data: payload.entityData,
            dynamic_fields: payload.dynamicFields
          },
          payload.workspaceContext.organization_id
        )

        if (businessValidation.success && businessValidation.execution_result?.validation_errors) {
          Object.assign(errors, businessValidation.execution_result.validation_errors)
        }
      } catch (validationError) {
        warnings.push('Business rule validation could not be completed')
        console.warn('Business validation warning:', validationError)
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
      }

    } catch (error) {
      console.error('Validation error:', error)
      errors.general = 'Validation failed due to system error'
      return { isValid: false, errors }
    }
  }

  /**
   * Generate smart code for entity
   */
  static async generateSmartCode(
    entityType: string,
    entityData: Record<string, any>,
    workspaceContext: WorkspaceEntityContext,
    appCode: string
  ): Promise<string> {
    try {
      // Get entity configuration to find smart code pattern
      const entityConfig = await UniversalEntityRegistry.getEntityCreationConfig(
        entityType,
        appCode,
        workspaceContext
      )

      if (entityConfig?.smartCodePattern) {
        // Use configured pattern
        const variant = this.generateVariant(entityData, workspaceContext)
        return entityConfig.smartCodePattern.replace('{VARIANT}', variant)
      }

      // Fallback to standard HERA pattern
      const variant = this.generateVariant(entityData, workspaceContext)
      return `HERA.${appCode.toUpperCase()}.${entityType.toUpperCase()}.${variant}.v1`

    } catch (error) {
      console.warn('Smart code generation error, using fallback:', error)
      return `HERA.${appCode.toUpperCase()}.${entityType.toUpperCase()}.STANDARD.v1`
    }
  }

  /**
   * Generate variant part of smart code based on entity data
   */
  private static generateVariant(
    entityData: Record<string, any>,
    workspaceContext: WorkspaceEntityContext
  ): string {
    // Use category or type from entity data if available
    if (entityData.category) {
      return entityData.category.toUpperCase()
    }
    if (entityData.type) {
      return entityData.type.toUpperCase()
    }
    
    // Use workspace context
    if (workspaceContext.section) {
      return workspaceContext.section.toUpperCase()
    }

    return 'STANDARD'
  }

  /**
   * Resolve which app should handle the entity type
   */
  private static async resolveAppForEntityType(
    entityType: string,
    organizationId: string
  ): Promise<string | null> {
    const availability = await UniversalEntityRegistry.isEntityTypeAvailable(entityType, organizationId)
    return availability.appCode || null
  }

  /**
   * Create workspace relationship for the new entity
   */
  private static async createWorkspaceRelationship(
    entityId: string,
    workspaceContext: WorkspaceEntityContext,
    appCode: string
  ): Promise<void> {
    try {
      // Create relationship between entity and workspace
      await microAppClient.executeComponent(
        appCode,
        {
          component_type: 'generic',
          action: 'create_relationship'
        },
        {
          from_entity_id: entityId,
          to_entity_id: workspaceContext.workspace, // Assuming workspace has entity ID
          relationship_type: 'BELONGS_TO_WORKSPACE',
          relationship_data: {
            domain: workspaceContext.domain,
            section: workspaceContext.section,
            created_in_workspace: true
          }
        },
        workspaceContext.organization_id
      )

      console.log('✅ Workspace relationship created for entity:', entityId)
    } catch (error) {
      console.warn('⚠️ Failed to create workspace relationship:', error)
    }
  }

  /**
   * Trigger entity creation workflows
   */
  private static async triggerEntityWorkflows(
    appCode: string,
    entityType: string,
    triggerData: Record<string, any>,
    organizationId: string
  ): Promise<{ triggered: boolean; workflow_instance_id?: string }> {
    try {
      // Get app definition to find workflows
      const appDefinition = await microAppClient.getAppDefinition(appCode)
      const entityWorkflows = appDefinition?.workflows?.filter(w => 
        w.trigger === 'create' && w.entity_type === entityType
      )

      if (!entityWorkflows || entityWorkflows.length === 0) {
        return { triggered: false }
      }

      // Trigger the first applicable workflow
      const workflow = entityWorkflows[0]
      const workflowResult = await microAppClient.triggerEventWorkflow(
        appCode,
        workflow.workflow_id,
        'entity_created',
        triggerData,
        organizationId
      )

      if (workflowResult.success) {
        console.log('✅ Entity creation workflow triggered:', workflow.workflow_id)
        return {
          triggered: true,
          workflow_instance_id: workflowResult.workflow_instance_id
        }
      } else {
        console.warn('⚠️ Failed to trigger workflow:', workflowResult.error)
        return { triggered: false }
      }

    } catch (error) {
      console.warn('⚠️ Workflow trigger error:', error)
      return { triggered: false }
    }
  }

  /**
   * Create audit trail entry
   */
  private static createAudit(
    actorUserId: string,
    organizationId: string,
    operation: string
  ) {
    return {
      actor_user_id: actorUserId,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      operation
    }
  }

  /**
   * Get entity creation summary for a workspace
   */
  static async getCreationSummary(
    workspaceContext: WorkspaceEntityContext,
    dateRange?: { from_date?: string; to_date?: string }
  ): Promise<{
    total_entities: number
    entities_by_type: Record<string, number>
    recent_entities: any[]
  }> {
    try {
      // This would require querying the micro-app runtime for metrics
      // For now, return empty summary
      return {
        total_entities: 0,
        entities_by_type: {},
        recent_entities: []
      }
    } catch (error) {
      console.error('Error getting creation summary:', error)
      return {
        total_entities: 0,
        entities_by_type: {},
        recent_entities: []
      }
    }
  }

  /**
   * Bulk entity creation
   */
  static async createEntitiesBulk(
    payloads: EntityCreationPayload[],
    actorUserId: string
  ): Promise<EntityCreationResult[]> {
    const results: EntityCreationResult[] = []

    for (const payload of payloads) {
      try {
        const result = await this.createEntity(payload, actorUserId)
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          audit: this.createAudit(actorUserId, payload.workspaceContext.organization_id, 'BULK_CREATE_ERROR')
        })
      }
    }

    return results
  }
}

export default EntityCreationService