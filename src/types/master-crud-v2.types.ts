/**
 * Master CRUD v2 - TypeScript Interfaces
 * High-performance atomic operations for HERA ERP Sacred Six schema
 * 
 * Created: 2025-10-14
 * Goal: 73% performance improvement (300ms → 80ms) with ACID compliance
 */

import { CoreEntities, CoreDynamicData, CoreRelationships } from './hera-database.types'

/**
 * Master CRUD v2 Core Interfaces
 */

// Dynamic data field definition for atomic operations
export interface MasterCrudDynamicField {
  field_name: string
  field_type?: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'file_url'
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_date?: string
  field_value_json?: any
  field_value_file_url?: string
  smart_code?: string
  validation_rules?: string
  is_required?: boolean
  is_searchable?: boolean
  field_order?: number
}

// Relationship definition for atomic operations
export interface MasterCrudRelationship {
  type: string // relationship_type
  targetEntityId?: string // to_entity_id
  targetSmartCode?: string // Used to find target entity by smart code
  sourceEntityId?: string // from_entity_id (defaults to created entity)
  direction?: 'forward' | 'backward' | 'bidirectional'
  strength?: number
  metadata?: Record<string, any> // relationship_data
  isActive?: boolean
  effectiveDate?: string
  expirationDate?: string
  smart_code?: string
}

/**
 * Create Entity Complete Request
 * Single atomic operation to replace 3-5 separate API calls
 */
export interface CreateEntityCompleteRequest {
  // Required fields
  entityType: string
  entityName: string
  organizationId: string
  
  // Optional entity fields
  entityCode?: string
  entityDescription?: string
  parentEntityId?: string
  smartCode?: string
  smartCodeStatus?: string
  status?: string
  tags?: string[]
  metadata?: Record<string, any>
  businessRules?: Record<string, any>
  
  // Dynamic data (business fields)
  dynamicData?: Record<string, any> | MasterCrudDynamicField[]
  
  // Relationships
  relationships?: MasterCrudRelationship[]
  
  // AI fields
  aiConfidence?: number
  aiClassification?: string
  aiInsights?: Record<string, any>
  
  // Audit fields
  actorUserId?: string
}

/**
 * Update Entity Complete Request
 * Atomic update of entity + dynamic data + relationships
 */
export interface UpdateEntityCompleteRequest {
  // Required fields
  entityId: string
  organizationId: string
  
  // Optional entity updates
  entityName?: string
  entityCode?: string
  entityDescription?: string
  parentEntityId?: string
  smartCode?: string
  smartCodeStatus?: string
  status?: string
  tags?: string[]
  metadata?: Record<string, any>
  businessRules?: Record<string, any>
  
  // Dynamic data updates
  dynamicData?: {
    upsert?: Record<string, any> | MasterCrudDynamicField[]
    delete?: string[] // field names to delete
  }
  
  // Relationship updates
  relationships?: {
    upsert?: MasterCrudRelationship[]
    delete?: string[] // relationship IDs to delete
  }
  
  // AI fields
  aiConfidence?: number
  aiClassification?: string
  aiInsights?: Record<string, any>
  
  // Audit fields
  actorUserId?: string
}

/**
 * Delete Entity Complete Request
 * Atomic deletion of entity + all related data
 */
export interface DeleteEntityCompleteRequest {
  entityId: string
  organizationId: string
  deleteMode?: 'soft' | 'hard' | 'archive'
  cascadeRelationships?: boolean
  cascadeDynamicData?: boolean
  actorUserId?: string
}

/**
 * Query Entity Complete Request
 * Efficient retrieval of entity + dynamic data + relationships
 */
export interface QueryEntityCompleteRequest {
  organizationId: string
  
  // Entity selection
  entityId?: string
  entityIds?: string[]
  entityType?: string
  entityTypes?: string[]
  smartCode?: string
  smartCodes?: string[]
  
  // Include options
  includeDynamicData?: boolean | string[] // true for all, array for specific fields
  includeRelationships?: boolean | {
    incoming?: boolean
    outgoing?: boolean
    relationshipTypes?: string[]
  }
  includeMetadata?: boolean
  includeAuditInfo?: boolean
  
  // Filtering
  filters?: {
    status?: string[]
    tags?: string[]
    createdAfter?: string
    createdBefore?: string
    updatedAfter?: string
    updatedBefore?: string
  }
  
  // Performance options
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  useCache?: boolean
}

/**
 * Master CRUD v2 Response Types
 */

export interface MasterCrudEntityResult {
  entity: CoreEntities
  dynamicData?: CoreDynamicData[]
  relationships?: {
    incoming: CoreRelationships[]
    outgoing: CoreRelationships[]
  }
  metadata?: {
    totalFields: number
    totalRelationships: number
    lastUpdated: string
    version: string
  }
}

export interface CreateEntityCompleteResponse {
  api_version: 'v2'
  success: boolean
  entityId: string
  entity: CoreEntities
  dynamicDataIds: string[]
  relationshipIds: string[]
  performance: {
    executionTimeMs: number
    operationsCount: number
    cacheHit?: boolean
  }
  warnings?: string[]
}

export interface UpdateEntityCompleteResponse {
  api_version: 'v2'
  success: boolean
  entityId: string
  entity: CoreEntities
  changes: {
    dynamicData: {
      upserted: string[]
      deleted: string[]
    }
    relationships: {
      upserted: string[]
      deleted: string[]
    }
  }
  performance: {
    executionTimeMs: number
    operationsCount: number
    cacheHit?: boolean
  }
  warnings?: string[]
}

export interface DeleteEntityCompleteResponse {
  api_version: 'v2'
  success: boolean
  entityId: string
  deleted: {
    entity: boolean
    dynamicData: number
    relationships: number
  }
  performance: {
    executionTimeMs: number
    operationsCount: number
  }
}

export interface QueryEntityCompleteResponse {
  api_version: 'v2'
  success: boolean
  entities: MasterCrudEntityResult[]
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  performance: {
    executionTimeMs: number
    cacheHit?: boolean
  }
}

/**
 * Master CRUD v2 Error Types
 */

export interface MasterCrudError {
  code: string
  message: string
  details?: any
  field?: string
  operation?: string
}

export interface MasterCrudErrorResponse {
  api_version: 'v2'
  success: false
  error: string
  errors?: MasterCrudError[]
  performance?: {
    executionTimeMs: number
    failedAt: string
  }
}

/**
 * Master CRUD v2 Validation Types
 */

export interface ValidationRule {
  field: string
  type: 'required' | 'format' | 'length' | 'range' | 'custom'
  value?: any
  message?: string
  code?: string
}

export interface MasterCrudValidationResult {
  isValid: boolean
  errors: MasterCrudError[]
  warnings: string[]
}

/**
 * Master CRUD v2 Performance Types
 */

export interface PerformanceConfig {
  enableBenchmarking: boolean
  targetResponseTimeMs: number
  maxOperationsPerRequest: number
  enableCaching: boolean
  enableOptimizations: boolean
}

export interface PerformanceMetrics {
  executionTimeMs: number
  operationsCount: number
  dbCallsCount: number
  cacheHitRate?: number
  memoryUsageMB?: number
  optimizationsApplied?: string[]
}

/**
 * Master CRUD v2 Transaction Types
 */

export interface TransactionConfig {
  isolationLevel?: 'read_committed' | 'repeatable_read' | 'serializable'
  timeoutMs?: number
  enableRollback: boolean
  savepoints?: string[]
}

export interface TransactionResult {
  transactionId: string
  startTime: string
  endTime: string
  operations: number
  rollbacks: number
  savepoints: string[]
  status: 'committed' | 'rolled_back' | 'failed'
}

/**
 * Master CRUD v2 Smart Code Integration
 */

export interface SmartCodeValidation {
  code: string
  isValid: boolean
  format: string
  family: string
  version: string
  errors?: string[]
}

export interface SmartCodeLookup {
  code: string
  entityId?: string
  entityType?: string
  organizationId: string
  created?: boolean
}

/**
 * Master CRUD v2 Batch Operations
 */

export interface BatchOperationRequest {
  operations: Array<{
    type: 'create' | 'update' | 'delete'
    data: CreateEntityCompleteRequest | UpdateEntityCompleteRequest | DeleteEntityCompleteRequest
    operationId?: string
  }>
  organizationId: string
  transactionConfig?: TransactionConfig
  performanceConfig?: PerformanceConfig
}

export interface BatchOperationResponse {
  api_version: 'v2'
  success: boolean
  results: Array<{
    operationId?: string
    success: boolean
    result?: any
    error?: MasterCrudError
  }>
  transaction: TransactionResult
  performance: PerformanceMetrics
  summary: {
    total: number
    succeeded: number
    failed: number
    skipped: number
  }
}

/**
 * Master CRUD v2 Service Interface
 */

export interface MasterCrudV2Service {
  // Core operations
  createEntityComplete(request: CreateEntityCompleteRequest): Promise<CreateEntityCompleteResponse>
  updateEntityComplete(request: UpdateEntityCompleteRequest): Promise<UpdateEntityCompleteResponse>
  deleteEntityComplete(request: DeleteEntityCompleteRequest): Promise<DeleteEntityCompleteResponse>
  queryEntityComplete(request: QueryEntityCompleteRequest): Promise<QueryEntityCompleteResponse>
  
  // Batch operations
  batchOperations(request: BatchOperationRequest): Promise<BatchOperationResponse>
  
  // Utility methods
  validateRequest(request: any): MasterCrudValidationResult
  validateSmartCode(code: string): SmartCodeValidation
  lookupBySmartCode(request: SmartCodeLookup): Promise<MasterCrudEntityResult | null>
  
  // Performance methods
  benchmark(operation: () => Promise<any>): Promise<PerformanceMetrics>
  clearCache(organizationId: string): Promise<void>
  
  // Health check
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    responseTimeMs: number
    features: string[]
  }>
}

/**
 * Master CRUD v2 Configuration
 */

export interface MasterCrudV2Config {
  performance: PerformanceConfig
  transaction: TransactionConfig
  validation: {
    enableStrictMode: boolean
    enableSmartCodeValidation: boolean
    enableOrganizationValidation: boolean
    enableBusinessRuleValidation: boolean
  }
  features: {
    enableCaching: boolean
    enableBenchmarking: boolean
    enableAuditLogging: boolean
    enableOptimizations: boolean
  }
  limits: {
    maxDynamicFields: number
    maxRelationships: number
    maxBatchSize: number
    maxQueryResults: number
  }
}

/**
 * Type guards for Master CRUD v2
 */

export function isCreateEntityCompleteRequest(obj: any): obj is CreateEntityCompleteRequest {
  return obj && 
    typeof obj.entityType === 'string' &&
    typeof obj.entityName === 'string' &&
    typeof obj.organizationId === 'string'
}

export function isUpdateEntityCompleteRequest(obj: any): obj is UpdateEntityCompleteRequest {
  return obj && 
    typeof obj.entityId === 'string' &&
    typeof obj.organizationId === 'string'
}

export function isDeleteEntityCompleteRequest(obj: any): obj is DeleteEntityCompleteRequest {
  return obj && 
    typeof obj.entityId === 'string' &&
    typeof obj.organizationId === 'string'
}

export function isQueryEntityCompleteRequest(obj: any): obj is QueryEntityCompleteRequest {
  return obj && typeof obj.organizationId === 'string'
}

export function isMasterCrudError(obj: any): obj is MasterCrudError {
  return obj && typeof obj.code === 'string' && typeof obj.message === 'string'
}

/**
 * Utility type for converting simple object to MasterCrudDynamicField array
 */
export function convertDynamicData(data: Record<string, any>): MasterCrudDynamicField[] {
  return Object.entries(data).map(([field_name, value]) => {
    const field: MasterCrudDynamicField = { field_name }
    
    // Auto-detect field type and set appropriate value field
    if (typeof value === 'string') {
      field.field_type = 'text'
      field.field_value_text = value
    } else if (typeof value === 'number') {
      field.field_type = 'number'
      field.field_value_number = value
    } else if (typeof value === 'boolean') {
      field.field_type = 'boolean'
      field.field_value_boolean = value
    } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      field.field_type = 'date'
      field.field_value_date = value instanceof Date ? value.toISOString() : value
    } else {
      field.field_type = 'json'
      field.field_value_json = value
    }
    
    return field
  })
}

/**
 * Export all types for easy importing
 */
export type {
  CoreEntities,
  CoreDynamicData,
  CoreRelationships
} from './hera-database.types'