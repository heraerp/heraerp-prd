/**
 * HERA Micro-Apps Client SDK v2
 * Smart Code: HERA.PLATFORM.MICRO_APPS.CLIENT.SDK.v2
 * 
 * Enterprise-grade TypeScript client for HERA Micro-Apps management with:
 * ✅ Complete type safety
 * ✅ Actor stamping and audit trails
 * ✅ Organization isolation
 * ✅ Dependency validation
 * ✅ API v2 gateway integration
 */

import { apiV2 } from '@/lib/client/fetchV2'

// Core types for micro-apps
export interface MicroAppDefinition {
  code: string
  display_name: string
  version: string
  category: string
  description?: string
  icon?: string
  depends_on?: MicroAppDependency[]
  entities?: MicroAppEntity[]
  transactions?: MicroAppTransaction[]
  navigation?: MicroAppNavigation[]
  workflows?: MicroAppWorkflow[]
  settings?: Record<string, any>
}

export interface MicroAppDependency {
  code: string
  version: string // e.g., ">=v1.0", "=v2.1", "~v1.2"
  optional?: boolean
}

export interface MicroAppEntity {
  entity_type: string
  display_name: string
  display_name_plural: string
  fields: MicroAppField[]
  relationships?: MicroAppRelationship[]
}

export interface MicroAppTransaction {
  transaction_type: string
  display_name: string
  display_name_plural: string
  header_fields: MicroAppField[]
  line_fields?: MicroAppField[]
}

export interface MicroAppField {
  field_name: string
  display_label: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'entity_ref'
  is_required: boolean
  is_searchable?: boolean
  field_order: number
  validation?: Record<string, any>
  ui_hints?: Record<string, any>
}

export interface MicroAppRelationship {
  relationship_type: string
  to_entity_type: string
  display_name: string
  is_required: boolean
}

export interface MicroAppNavigation {
  id: string
  label: string
  path: string
  icon: string
  order: number
  parent_id?: string
  permissions?: string[]
}

export interface MicroAppWorkflow {
  workflow_id: string
  name: string
  trigger: 'create' | 'update' | 'delete' | 'status_change'
  entity_type?: string
  transaction_type?: string
  steps: MicroAppWorkflowStep[]
}

export interface MicroAppWorkflowStep {
  step_id: string
  name: string
  type: 'approval' | 'notification' | 'automation' | 'validation'
  config: Record<string, any>
}

// API Response types
export interface MicroAppCatalogResponse {
  success: boolean
  operation: string
  apps?: MicroAppCatalogEntry[]
  app?: MicroAppCatalogEntry
  app_entity_id?: string
  smart_code?: string
  message?: string
  error?: string
  audit: {
    actor_user_id: string
    organization_id: string
    timestamp: string
    operation: string
  }
}

export interface MicroAppCatalogEntry {
  entity_id: string
  code: string
  display_name: string
  smart_code: string
  created_at: string
  updated_at: string
  definition: MicroAppDefinition
}

export interface MicroAppInstallResponse {
  success: boolean
  operation: string
  installation_entity_id?: string
  app_code?: string
  app_version?: string
  status?: string
  installation?: MicroAppInstallation
  installations?: MicroAppInstallation[]
  message?: string
  error?: string
  dependency_errors?: any[]
  audit: {
    actor_user_id: string
    organization_id: string
    timestamp: string
    operation: string
  }
}

export interface MicroAppInstallation {
  installation_id: string
  app_code: string
  app_name: string
  smart_code: string
  status: 'installing' | 'installed' | 'uninstalling' | 'error'
  app_version: string
  installed_at: string
  updated_at: string
  config: Record<string, any>
}

export interface MicroAppDependencyResponse {
  success: boolean
  operation: string
  app_code: string
  app_version: string
  dependencies_count?: number
  validation_errors?: any[]
  resolved_dependencies?: any[]
  install_order?: string[]
  total_dependencies?: number
  cycles_found?: boolean
  cycle_paths?: any[]
  message?: string
  error?: string
  audit: {
    actor_user_id: string
    organization_id: string
    timestamp: string
    operation: string
  }
}

// Runtime execution types
export interface MicroAppRuntimeContext {
  component_type: 'entity' | 'transaction' | 'workflow' | 'report' | 'generic'
  action?: string
  environment?: string
  user_context?: Record<string, any>
  session_data?: Record<string, any>
}

export interface MicroAppExecutionPayload {
  entity_type?: string
  entity_data?: Record<string, any>
  dynamic_fields?: Record<string, any>
  relationships?: any[]
  transaction_type?: string
  transaction_data?: Record<string, any>
  lines?: any[]
  workflow_id?: string
  workflow_payload?: Record<string, any>
  options?: Record<string, any>
}

export interface MicroAppRuntimeResponse {
  success: boolean
  operation: string
  execution_id: string
  app_code: string
  component_type: string
  execution_result: any
  performance_metrics: {
    execution_time_ms: number
    component_type: string
    action: string
    success: boolean
  }
  runtime_state?: any
  message?: string
  error?: string
  audit: {
    actor_user_id: string
    organization_id: string
    timestamp: string
    operation: string
    execution_id: string
  }
}

// Workflow execution types
export interface MicroAppWorkflowPayload {
  trigger_data?: Record<string, any>
  variables?: Record<string, any>
  context?: Record<string, any>
  comments?: string
}

export interface MicroAppWorkflowResponse {
  success: boolean
  operation: string
  workflow_instance_id: string
  app_code: string
  workflow_id: string
  status: 'running' | 'completed' | 'pending_approval' | 'error' | 'cancelled'
  steps_executed: number
  total_steps: number
  approval_required: boolean
  step_results: MicroAppWorkflowStepResult[]
  workflow_state?: any
  instances?: MicroAppWorkflowInstance[]
  message?: string
  error?: string
  audit: {
    actor_user_id: string
    organization_id: string
    timestamp: string
    operation: string
    workflow_instance_id: string
  }
}

export interface MicroAppWorkflowStepResult {
  step_index: number
  step_id: string
  step_name: string
  type: string
  status: string
  executed_at: string
  executed_by: string
  success: boolean
  result?: any
  error?: string
}

export interface MicroAppWorkflowInstance {
  workflow_instance_id: string
  workflow_name: string
  app_code: string
  workflow_id: string
  status: string
  created_at: string
  updated_at: string
  initiated_by: string
  current_step_index: number
  total_steps: number
}

// Client options
export interface MicroAppClientOptions {
  baseURL?: string
  timeout?: number
  retries?: number
}

/**
 * HERA Micro-Apps Client SDK
 * 
 * Provides type-safe access to HERA Micro-Apps platform functionality
 * All operations are actor-stamped and organization-isolated
 */
export class MicroAppClient {
  constructor(private options: MicroAppClientOptions = {}) {}

  // ==================== CATALOG OPERATIONS ====================
  
  /**
   * Create a new micro-app in the catalog (Platform Org only)
   */
  async createCatalogApp(
    appDefinition: MicroAppDefinition,
    organizationId: string = '00000000-0000-0000-0000-000000000000' // Platform org
  ): Promise<MicroAppCatalogResponse> {
    return await apiV2.post('/micro-apps/catalog', {
      operation: 'CREATE',
      app_definition: appDefinition,
      organization_id: organizationId
    })
  }

  /**
   * Get micro-app from catalog
   */
  async getCatalogApp(
    appCode: string,
    version?: string,
    organizationId: string = '00000000-0000-0000-0000-000000000000'
  ): Promise<MicroAppCatalogResponse> {
    return await apiV2.post('/micro-apps/catalog', {
      operation: 'READ',
      filters: {
        app_code: appCode,
        version: version
      },
      organization_id: organizationId
    })
  }

  /**
   * List all micro-apps in catalog
   */
  async listCatalogApps(
    filters?: {
      category?: string
      search?: string
    },
    options?: {
      limit?: number
      offset?: number
    },
    organizationId: string = '00000000-0000-0000-0000-000000000000'
  ): Promise<MicroAppCatalogResponse> {
    return await apiV2.post('/micro-apps/catalog', {
      operation: 'LIST',
      filters: filters || null,
      options: options || {},
      organization_id: organizationId
    })
  }

  /**
   * Update micro-app in catalog
   */
  async updateCatalogApp(
    appEntityId: string,
    appDefinition: MicroAppDefinition,
    organizationId: string = '00000000-0000-0000-0000-000000000000'
  ): Promise<MicroAppCatalogResponse> {
    return await apiV2.post('/micro-apps/catalog', {
      operation: 'UPDATE',
      filters: {
        app_entity_id: appEntityId
      },
      app_definition: appDefinition,
      organization_id: organizationId
    })
  }

  /**
   * Delete micro-app from catalog
   */
  async deleteCatalogApp(
    appEntityId: string,
    organizationId: string = '00000000-0000-0000-0000-000000000000'
  ): Promise<MicroAppCatalogResponse> {
    return await apiV2.post('/micro-apps/catalog', {
      operation: 'DELETE',
      filters: {
        app_entity_id: appEntityId
      },
      organization_id: organizationId
    })
  }

  // ==================== INSTALLATION OPERATIONS ====================

  /**
   * Install a micro-app from catalog
   */
  async installApp(
    appCode: string,
    appVersion: string,
    organizationId: string,
    installationConfig: Record<string, any> = {}
  ): Promise<MicroAppInstallResponse> {
    return await apiV2.post('/micro-apps/install', {
      operation: 'INSTALL',
      app_code: appCode,
      app_version: appVersion,
      installation_config: installationConfig,
      organization_id: organizationId
    })
  }

  /**
   * Uninstall a micro-app
   */
  async uninstallApp(
    appCode: string,
    organizationId: string
  ): Promise<MicroAppInstallResponse> {
    return await apiV2.post('/micro-apps/install', {
      operation: 'UNINSTALL',
      app_code: appCode,
      organization_id: organizationId
    })
  }

  /**
   * Get installation status
   */
  async getInstallationStatus(
    appCode: string,
    organizationId: string
  ): Promise<MicroAppInstallResponse> {
    return await apiV2.post('/micro-apps/install', {
      operation: 'STATUS',
      app_code: appCode,
      organization_id: organizationId
    })
  }

  /**
   * List all installed apps for organization
   */
  async listInstalledApps(
    organizationId: string,
    filters?: {
      status?: string
    },
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<MicroAppInstallResponse> {
    return await apiV2.post('/micro-apps/install', {
      operation: 'LIST',
      filters: filters || null,
      options: options || {},
      organization_id: organizationId
    })
  }

  // ==================== DEPENDENCY OPERATIONS ====================

  /**
   * Validate app dependencies
   */
  async validateDependencies(
    appCode: string,
    appVersion: string,
    organizationId: string
  ): Promise<MicroAppDependencyResponse> {
    return await apiV2.post('/micro-apps/dependencies', {
      operation: 'VALIDATE',
      app_code: appCode,
      app_version: appVersion,
      organization_id: organizationId
    })
  }

  /**
   * Resolve dependency tree
   */
  async resolveDependencies(
    appCode: string,
    appVersion: string,
    organizationId: string
  ): Promise<MicroAppDependencyResponse> {
    return await apiV2.post('/micro-apps/dependencies', {
      operation: 'RESOLVE',
      app_code: appCode,
      app_version: appVersion,
      organization_id: organizationId
    })
  }

  /**
   * Check for circular dependencies
   */
  async checkCircularDependencies(
    appCode: string,
    appVersion: string,
    organizationId: string
  ): Promise<MicroAppDependencyResponse> {
    return await apiV2.post('/micro-apps/dependencies', {
      operation: 'CHECK_CYCLES',
      app_code: appCode,
      app_version: appVersion,
      organization_id: organizationId
    })
  }

  // ==================== HELPER METHODS ====================

  /**
   * Install app with dependency validation
   */
  async installAppWithValidation(
    appCode: string,
    appVersion: string,
    organizationId: string,
    installationConfig: Record<string, any> = {}
  ): Promise<{
    validation: MicroAppDependencyResponse
    installation?: MicroAppInstallResponse
  }> {
    // First validate dependencies
    const validation = await this.validateDependencies(appCode, appVersion, organizationId)
    
    if (!validation.success || (validation.validation_errors && validation.validation_errors.length > 0)) {
      return { validation }
    }

    // If validation passes, proceed with installation
    const installation = await this.installApp(appCode, appVersion, organizationId, installationConfig)
    
    return { validation, installation }
  }

  /**
   * Get app definition from catalog
   */
  async getAppDefinition(
    appCode: string,
    version?: string
  ): Promise<MicroAppDefinition | null> {
    const response = await this.getCatalogApp(appCode, version)
    
    if (response.success && response.app) {
      return response.app.definition
    }
    
    return null
  }

  /**
   * Check if app is installed
   */
  async isAppInstalled(
    appCode: string,
    organizationId: string
  ): Promise<boolean> {
    const response = await this.getInstallationStatus(appCode, organizationId)
    
    return response.success && 
           response.installation?.status === 'installed'
  }

  /**
   * Get installation order for app and dependencies
   */
  async getInstallationOrder(
    appCode: string,
    appVersion: string,
    organizationId: string
  ): Promise<string[]> {
    const response = await this.resolveDependencies(appCode, appVersion, organizationId)
    
    if (response.success && response.install_order) {
      return response.install_order
    }
    
    return []
  }

  // ==================== RUNTIME OPERATIONS ====================

  /**
   * Execute a micro-app component at runtime
   */
  async executeComponent(
    appCode: string,
    runtimeContext: MicroAppRuntimeContext,
    executionPayload: MicroAppExecutionPayload,
    organizationId: string,
    options?: Record<string, any>
  ): Promise<MicroAppRuntimeResponse> {
    return await apiV2.post('/micro-apps/runtime', {
      operation: 'EXECUTE',
      app_code: appCode,
      runtime_context: runtimeContext,
      execution_payload: executionPayload,
      organization_id: organizationId,
      options: options || {}
    })
  }

  /**
   * Get runtime execution state
   */
  async getRuntimeState(
    organizationId: string,
    executionId?: string,
    appCode?: string
  ): Promise<MicroAppRuntimeResponse> {
    return await apiV2.post('/micro-apps/runtime', {
      operation: 'GET_STATE',
      app_code: appCode,
      organization_id: organizationId,
      options: executionId ? { execution_id: executionId } : {}
    })
  }

  /**
   * Update runtime execution state
   */
  async updateRuntimeState(
    executionId: string,
    stateUpdates: Record<string, any>,
    organizationId: string
  ): Promise<MicroAppRuntimeResponse> {
    return await apiV2.post('/micro-apps/runtime', {
      operation: 'UPDATE_STATE',
      execution_payload: {
        state_updates: stateUpdates
      },
      organization_id: organizationId,
      options: { execution_id: executionId }
    })
  }

  /**
   * Get runtime performance metrics
   */
  async getRuntimeMetrics(
    organizationId: string,
    appCode?: string,
    options?: {
      from_date?: string
      limit?: number
    }
  ): Promise<MicroAppRuntimeResponse> {
    return await apiV2.post('/micro-apps/runtime', {
      operation: 'GET_METRICS',
      app_code: appCode,
      organization_id: organizationId,
      options: options || {}
    })
  }

  // ==================== WORKFLOW OPERATIONS ====================

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    appCode: string,
    workflowId: string,
    workflowPayload: MicroAppWorkflowPayload,
    organizationId: string,
    options?: Record<string, any>
  ): Promise<MicroAppWorkflowResponse> {
    return await apiV2.post('/micro-apps/workflow', {
      operation: 'EXECUTE',
      app_code: appCode,
      workflow_id: workflowId,
      workflow_payload: workflowPayload,
      organization_id: organizationId,
      options: options || {}
    })
  }

  /**
   * Get workflow instance status
   */
  async getWorkflowStatus(
    workflowInstanceId: string,
    organizationId: string
  ): Promise<MicroAppWorkflowResponse> {
    return await apiV2.post('/micro-apps/workflow', {
      operation: 'GET_STATUS',
      organization_id: organizationId,
      options: { workflow_instance_id: workflowInstanceId }
    })
  }

  /**
   * Approve workflow step
   */
  async approveWorkflowStep(
    workflowInstanceId: string,
    stepId: string,
    organizationId: string,
    comments?: string
  ): Promise<MicroAppWorkflowResponse> {
    return await apiV2.post('/micro-apps/workflow', {
      operation: 'APPROVE',
      workflow_payload: { comments },
      organization_id: organizationId,
      options: { 
        workflow_instance_id: workflowInstanceId,
        step_id: stepId 
      }
    })
  }

  /**
   * Reject workflow step
   */
  async rejectWorkflowStep(
    workflowInstanceId: string,
    stepId: string,
    organizationId: string,
    comments?: string
  ): Promise<MicroAppWorkflowResponse> {
    return await apiV2.post('/micro-apps/workflow', {
      operation: 'REJECT',
      workflow_payload: { comments },
      organization_id: organizationId,
      options: { 
        workflow_instance_id: workflowInstanceId,
        step_id: stepId 
      }
    })
  }

  /**
   * List workflow instances
   */
  async listWorkflowInstances(
    organizationId: string,
    appCode?: string,
    workflowId?: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<MicroAppWorkflowResponse> {
    return await apiV2.post('/micro-apps/workflow', {
      operation: 'LIST_INSTANCES',
      app_code: appCode,
      workflow_id: workflowId,
      organization_id: organizationId,
      options: options || {}
    })
  }

  /**
   * Cancel workflow instance
   */
  async cancelWorkflow(
    workflowInstanceId: string,
    organizationId: string,
    reason?: string
  ): Promise<MicroAppWorkflowResponse> {
    return await apiV2.post('/micro-apps/workflow', {
      operation: 'CANCEL',
      workflow_payload: { reason },
      organization_id: organizationId,
      options: { workflow_instance_id: workflowInstanceId }
    })
  }

  // ==================== ENHANCED HELPER METHODS ====================

  /**
   * Execute entity operation through micro-app runtime
   */
  async executeEntityOperation(
    appCode: string,
    action: 'create' | 'update' | 'delete' | 'read',
    entityType: string,
    entityData: Record<string, any>,
    organizationId: string,
    dynamicFields?: Record<string, any>,
    relationships?: any[]
  ): Promise<MicroAppRuntimeResponse> {
    return this.executeComponent(
      appCode,
      {
        component_type: 'entity',
        action: action
      },
      {
        entity_type: entityType,
        entity_data: entityData,
        dynamic_fields: dynamicFields,
        relationships: relationships
      },
      organizationId
    )
  }

  /**
   * Execute transaction operation through micro-app runtime
   */
  async executeTransactionOperation(
    appCode: string,
    action: 'create' | 'update' | 'post' | 'approve',
    transactionType: string,
    transactionData: Record<string, any>,
    organizationId: string,
    lines?: any[]
  ): Promise<MicroAppRuntimeResponse> {
    return this.executeComponent(
      appCode,
      {
        component_type: 'transaction',
        action: action
      },
      {
        transaction_type: transactionType,
        transaction_data: transactionData,
        lines: lines
      },
      organizationId
    )
  }

  /**
   * Trigger workflow from entity or transaction events
   */
  async triggerEventWorkflow(
    appCode: string,
    workflowId: string,
    triggerType: 'entity_created' | 'entity_updated' | 'transaction_posted' | 'custom',
    triggerData: Record<string, any>,
    organizationId: string
  ): Promise<MicroAppWorkflowResponse> {
    return this.executeWorkflow(
      appCode,
      workflowId,
      {
        trigger_data: triggerData,
        context: {
          trigger_type: triggerType,
          triggered_at: new Date().toISOString()
        }
      },
      organizationId
    )
  }

  /**
   * Get comprehensive micro-app analytics
   */
  async getMicroAppAnalytics(
    organizationId: string,
    appCode?: string,
    timeRange?: {
      from_date?: string
      to_date?: string
    }
  ): Promise<{
    runtime_metrics: any
    workflow_instances: MicroAppWorkflowInstance[]
    installation_status: any
  }> {
    const [runtimeMetrics, workflowInstances, installationStatus] = await Promise.all([
      this.getRuntimeMetrics(organizationId, appCode, timeRange),
      this.listWorkflowInstances(organizationId, appCode),
      appCode ? this.getInstallationStatus(appCode, organizationId) : Promise.resolve(null)
    ])

    return {
      runtime_metrics: runtimeMetrics.success ? runtimeMetrics : null,
      workflow_instances: workflowInstances.success ? (workflowInstances.instances || []) : [],
      installation_status: installationStatus?.success ? installationStatus.installation : null
    }
  }
}

// Export singleton instance
export const microAppClient = new MicroAppClient()

// Export factory function for custom configuration
export function createMicroAppClient(options: MicroAppClientOptions = {}): MicroAppClient {
  return new MicroAppClient(options)
}

// Export types for external usage
export type {
  MicroAppDefinition,
  MicroAppDependency,
  MicroAppEntity,
  MicroAppTransaction,
  MicroAppField,
  MicroAppRelationship,
  MicroAppNavigation,
  MicroAppWorkflow,
  MicroAppWorkflowStep,
  MicroAppCatalogResponse,
  MicroAppCatalogEntry,
  MicroAppInstallResponse,
  MicroAppInstallation,
  MicroAppDependencyResponse,
  MicroAppClientOptions
}