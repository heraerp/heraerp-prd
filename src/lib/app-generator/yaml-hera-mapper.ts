/**
 * HERA YAML-to-HERA Mapping Engine v2.4
 * 
 * Converts parsed YAML app definitions to HERA Sacred Six architecture
 * Supports: entity mapping, transaction mapping, relationship creation, smart code generation
 * Compatible with Jewelry ERP and other complex business applications
 */

import { EnhancedAppConfig, GenerationContext } from './enhanced-yaml-parser'

// HERA Sacred Six table structure
export interface HERAEntityMapping {
  // core_entities table
  entity_type: string
  entity_name: string
  entity_code: string
  smart_code: string
  organization_id: string
  entity_description?: string
  
  // core_dynamic_data entries
  dynamic_fields: HERADynamicField[]
  
  // core_relationships entries
  relationships: HERARelationship[]
}

export interface HERADynamicField {
  entity_id: string
  field_name: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'email' | 'phone' | 'url'
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_date?: string
  field_value_json?: any
  smart_code: string
  organization_id: string
  field_description?: string
  is_required?: boolean
  is_searchable?: boolean
  is_pii?: boolean
  validation_rules?: any
}

export interface HERARelationship {
  source_entity_id: string
  target_entity_id: string
  relationship_type: string
  relationship_data?: any
  smart_code: string
  organization_id: string
  effective_date?: string
  expiration_date?: string
  is_required?: boolean
}

export interface HERATransactionMapping {
  // universal_transactions table
  transaction_type: string
  transaction_code: string
  smart_code: string
  source_entity_id?: string
  target_entity_id?: string
  total_amount?: number
  transaction_currency_code?: string
  transaction_date: string
  transaction_status: string
  organization_id: string
  
  // universal_transaction_lines entries
  lines: HERATransactionLine[]
  
  // Business rules and policies
  policies: HERATransactionPolicy[]
}

export interface HERATransactionLine {
  transaction_id: string
  line_number: number
  line_type: string
  entity_id?: string
  description?: string
  quantity?: number
  unit_amount?: number
  line_amount?: number
  line_data?: any
  smart_code: string
  organization_id: string
}

export interface HERATransactionPolicy {
  policy_type: string
  policy_name: string
  rule_definition: any
  applies_to: string
  smart_code: string
  organization_id: string
}

export class YAMLToHERAMapper {
  private organizationId: string
  private actorUserId: string
  
  constructor(organizationId: string, actorUserId: string) {
    this.organizationId = organizationId
    this.actorUserId = actorUserId
  }
  
  /**
   * Map complete YAML app configuration to HERA architecture
   */
  mapAppToHERA(config: EnhancedAppConfig): HERAAppMapping {
    return {
      app: this.mapAppDefinition(config.app),
      entities: config.entities.map(entity => this.mapEntityToHERA(entity)),
      transactions: config.transactions?.map(txn => this.mapTransactionToHERA(txn)) || [],
      policies: config.policies?.map(policy => this.mapPolicyToHERA(policy)) || [],
      seeds: config.seeds?.map(seed => this.mapSeedDataToHERA(seed)) || [],
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: this.actorUserId,
        organization_id: this.organizationId,
        source_format: 'yaml',
        app_version: config.app.version
      }
    }
  }
  
  /**
   * Map YAML entity definition to HERA core_entities + core_dynamic_data + core_relationships
   */
  private mapEntityToHERA(yamlEntity: EnhancedAppConfig['entities'][0]): HERAEntityMapping {
    // Generate entity code from template
    const entityCode = this.generateEntityCode(yamlEntity.entity_code_template, yamlEntity.entity_type)
    
    // Generate dynamic fields
    const dynamicFields: HERADynamicField[] = yamlEntity.fields.map(field => ({
      entity_id: '', // Will be filled when entity is created
      field_name: field.name,
      field_type: this.mapFieldType(field.type),
      smart_code: this.generateFieldSmartCode(yamlEntity.smart_code_prefix, field.name),
      organization_id: this.organizationId,
      field_description: field.description,
      is_required: field.required,
      is_searchable: field.searchable,
      is_pii: field.pii,
      validation_rules: field.validation ? { pattern: field.validation, min: field.min, max: field.max } : undefined
    }))
    
    // Generate relationships
    const relationships: HERARelationship[] = yamlEntity.relationships?.map(rel => ({
      source_entity_id: '', // Will be filled when entity is created
      target_entity_id: '', // Will be resolved from target entity
      relationship_type: rel.type,
      smart_code: this.generateRelationshipSmartCode(yamlEntity.smart_code_prefix, rel.type),
      organization_id: this.organizationId,
      is_required: rel.required,
      relationship_data: {
        cardinality: rel.cardinality,
        to_entity_type: rel.to_entity_type
      }
    })) || []
    
    return {
      entity_type: yamlEntity.entity_type,
      entity_name: this.generateEntityName(yamlEntity.entity_name_template, yamlEntity.entity_type),
      entity_code: entityCode,
      smart_code: this.generateEntitySmartCode(yamlEntity.smart_code_prefix),
      organization_id: this.organizationId,
      entity_description: `${yamlEntity.entity_type} entity generated from YAML configuration`,
      dynamic_fields: dynamicFields,
      relationships: relationships
    }
  }
  
  /**
   * Map YAML transaction definition to HERA universal_transactions + universal_transaction_lines
   */
  private mapTransactionToHERA(yamlTransaction: EnhancedAppConfig['transactions'][0]): HERATransactionMapping {
    // Map header fields to transaction properties
    const headerFields = yamlTransaction.header_fields || []
    
    // Generate transaction lines
    const lines: HERATransactionLine[] = yamlTransaction.lines.map((line, index) => ({
      transaction_id: '', // Will be filled when transaction is created
      line_number: index + 1,
      line_type: line.line_type,
      smart_code: this.generateTransactionLineSmartCode(yamlTransaction.smart_code, line.line_type),
      organization_id: this.organizationId,
      line_data: {
        fields: line.fields,
        generated_by: line.generated_by
      }
    }))
    
    // Map policies
    const policies: HERATransactionPolicy[] = yamlTransaction.policies?.map(policy => ({
      policy_type: policy.policy_type,
      policy_name: `${yamlTransaction.transaction_type}_${policy.policy_type}`,
      rule_definition: policy.rule,
      applies_to: yamlTransaction.transaction_type,
      smart_code: this.generatePolicySmartCode(yamlTransaction.smart_code, policy.policy_type),
      organization_id: this.organizationId
    })) || []
    
    return {
      transaction_type: yamlTransaction.transaction_type,
      transaction_code: '', // Will be generated at runtime
      smart_code: yamlTransaction.smart_code,
      transaction_date: new Date().toISOString(),
      transaction_status: 'DRAFT',
      organization_id: this.organizationId,
      lines: lines,
      policies: policies
    }
  }
  
  /**
   * Map YAML policy to HERA business rule
   */
  private mapPolicyToHERA(yamlPolicy: EnhancedAppConfig['policies'][0]): HERATransactionPolicy {
    return {
      policy_type: yamlPolicy.policy_type,
      policy_name: `Global_${yamlPolicy.policy_type}`,
      rule_definition: yamlPolicy.rule,
      applies_to: yamlPolicy.applies_to || 'ALL',
      smart_code: this.generateGlobalPolicySmartCode(yamlPolicy.policy_type),
      organization_id: this.organizationId
    }
  }
  
  /**
   * Map YAML seed data to HERA entity creation requests
   */
  private mapSeedDataToHERA(yamlSeed: EnhancedAppConfig['seeds'][0]): HERASeedMapping {
    return {
      entity_type: yamlSeed.entity_type,
      records: yamlSeed.records.map((record, index) => ({
        entity_type: yamlSeed.entity_type,
        entity_name: record.name || `${yamlSeed.entity_type} ${index + 1}`,
        entity_code: record.code || this.generateSeedEntityCode(yamlSeed.entity_type, index),
        smart_code: this.generateSeedSmartCode(yamlSeed.entity_type),
        organization_id: this.organizationId,
        dynamic_data: record
      }))
    }
  }
  
  /**
   * Map app definition to HERA app entity
   */
  private mapAppDefinition(appDef: EnhancedAppConfig['app']): HERAAppEntity {
    return {
      entity_type: 'APPLICATION',
      entity_name: appDef.name,
      entity_code: appDef.id.toUpperCase(),
      smart_code: `HERA.PLATFORM.APP.${appDef.id.toUpperCase()}.v1`,
      organization_id: this.organizationId,
      app_metadata: {
        app_id: appDef.id,
        version: appDef.version,
        description: appDef.description,
        industry: appDef.industry,
        settings: appDef.settings
      }
    }
  }
  
  // Helper methods for Smart Code generation
  private generateEntitySmartCode(prefix: string): string {
    return `${prefix}.ENTITY.v1`
  }
  
  private generateFieldSmartCode(entityPrefix: string, fieldName: string): string {
    return `${entityPrefix}.FIELD.${fieldName.toUpperCase()}.v1`
  }
  
  private generateRelationshipSmartCode(entityPrefix: string, relType: string): string {
    return `${entityPrefix}.REL.${relType.toUpperCase()}.v1`
  }
  
  private generateTransactionLineSmartCode(txnSmartCode: string, lineType: string): string {
    return `${txnSmartCode}.LINE.${lineType.toUpperCase()}`
  }
  
  private generatePolicySmartCode(txnSmartCode: string, policyType: string): string {
    return `${txnSmartCode}.POLICY.${policyType.toUpperCase()}`
  }
  
  private generateGlobalPolicySmartCode(policyType: string): string {
    return `HERA.POLICY.GLOBAL.${policyType.toUpperCase()}.v1`
  }
  
  private generateSeedSmartCode(entityType: string): string {
    return `HERA.SEED.${entityType.toUpperCase()}.DEMO.v1`
  }
  
  // Helper methods for code and name generation
  private generateEntityCode(template: string, entityType: string): string {
    return template
      .replace('{entity_type}', entityType.toUpperCase())
      .replace('{timestamp}', Date.now().toString().slice(-6))
      .replace('{random}', Math.random().toString(36).slice(-4).toUpperCase())
  }
  
  private generateEntityName(template: string, entityType: string): string {
    return template
      .replace('{entity_type}', this.capitalize(entityType))
      .replace('{Entity_Type}', this.capitalize(entityType))
      .replace('{ENTITY_TYPE}', entityType.toUpperCase())
  }
  
  private generateSeedEntityCode(entityType: string, index: number): string {
    return `${entityType.toUpperCase()}_SEED_${(index + 1).toString().padStart(3, '0')}`
  }
  
  private mapFieldType(yamlType: string): HERADynamicField['field_type'] {
    const typeMap: Record<string, HERADynamicField['field_type']> = {
      'text': 'text',
      'string': 'text',
      'number': 'number',
      'integer': 'number',
      'float': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'bool': 'boolean',
      'date': 'date',
      'datetime': 'date',
      'timestamp': 'date',
      'json': 'json',
      'object': 'json',
      'array': 'json',
      'email': 'email',
      'phone': 'phone',
      'url': 'url'
    }
    
    return typeMap[yamlType] || 'text'
  }
  
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
  
  /**
   * Generate RPC function calls for creating HERA entities
   */
  generateEntityRPCCalls(mapping: HERAEntityMapping): HERAEntityRPCCall {
    return {
      function_name: 'hera_entities_crud_v1',
      parameters: {
        p_action: 'CREATE',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_entity: {
          entity_type: mapping.entity_type,
          entity_name: mapping.entity_name,
          entity_code: mapping.entity_code,
          smart_code: mapping.smart_code,
          entity_description: mapping.entity_description
        },
        p_dynamic: this.convertDynamicFieldsToRPCFormat(mapping.dynamic_fields),
        p_relationships: mapping.relationships.map(rel => ({
          relationship_type: rel.relationship_type,
          target_entity_type: rel.relationship_data?.to_entity_type,
          relationship_data: rel.relationship_data,
          smart_code: rel.smart_code
        })),
        p_options: {}
      }
    }
  }
  
  /**
   * Generate RPC function calls for creating HERA transactions
   */
  generateTransactionRPCCalls(mapping: HERATransactionMapping): HERATransactionRPCCall {
    return {
      function_name: 'hera_txn_crud_v1',
      parameters: {
        p_action: 'CREATE',
        p_actor_user_id: this.actorUserId,
        p_organization_id: this.organizationId,
        p_transaction: {
          transaction_type: mapping.transaction_type,
          smart_code: mapping.smart_code,
          source_entity_id: mapping.source_entity_id,
          target_entity_id: mapping.target_entity_id,
          total_amount: mapping.total_amount,
          transaction_currency_code: mapping.transaction_currency_code || 'USD',
          transaction_date: mapping.transaction_date,
          transaction_status: mapping.transaction_status
        },
        p_lines: mapping.lines.map(line => ({
          line_number: line.line_number,
          line_type: line.line_type,
          entity_id: line.entity_id,
          description: line.description,
          quantity: line.quantity || 1,
          unit_amount: line.unit_amount || 0,
          line_amount: line.line_amount || 0,
          line_data: line.line_data,
          smart_code: line.smart_code
        })),
        p_options: {}
      }
    }
  }
  
  private convertDynamicFieldsToRPCFormat(fields: HERADynamicField[]): Record<string, any> {
    const result: Record<string, any> = {}
    
    fields.forEach(field => {
      result[field.field_name] = {
        field_type: field.field_type,
        field_value_text: field.field_value_text,
        field_value_number: field.field_value_number,
        field_value_boolean: field.field_value_boolean,
        field_value_date: field.field_value_date,
        field_value_json: field.field_value_json,
        smart_code: field.smart_code,
        is_required: field.is_required,
        is_searchable: field.is_searchable,
        is_pii: field.is_pii,
        validation_rules: field.validation_rules
      }
    })
    
    return result
  }
  
  /**
   * Calculate estimated duration for HERA operations
   */
  private calculateEstimatedDuration(heraMapping: HERAAppMapping): string {
    const entityCount = heraMapping.entities.length
    const transactionCount = heraMapping.transactions.length
    const totalOperations = entityCount + transactionCount
    
    // Estimate based on operation complexity
    const estimatedMinutes = Math.ceil((totalOperations * 2) / 60) // 2 seconds per operation
    
    if (estimatedMinutes < 1) {
      return '< 1 minute'
    } else if (estimatedMinutes === 1) {
      return '1 minute'
    } else {
      return `${estimatedMinutes} minutes`
    }
  }
}

// Type definitions for complete HERA mapping
export interface HERAAppMapping {
  app: HERAAppEntity
  entities: HERAEntityMapping[]
  transactions: HERATransactionMapping[]
  policies: HERATransactionPolicy[]
  seeds: HERASeedMapping[]
  metadata: {
    generated_at: string
    generated_by: string
    organization_id: string
    source_format: string
    app_version: string
  }
}

export interface HERAAppEntity {
  entity_type: 'APPLICATION'
  entity_name: string
  entity_code: string
  smart_code: string
  organization_id: string
  app_metadata: {
    app_id: string
    version: string
    description: string
    industry: string
    settings?: any
  }
}

export interface HERASeedMapping {
  entity_type: string
  records: Array<{
    entity_type: string
    entity_name: string
    entity_code: string
    smart_code: string
    organization_id: string
    dynamic_data: any
  }>
}

export interface HERAEntityRPCCall {
  function_name: 'hera_entities_crud_v1'
  parameters: {
    p_action: 'CREATE'
    p_actor_user_id: string
    p_organization_id: string
    p_entity: {
      entity_type: string
      entity_name: string
      entity_code: string
      smart_code: string
      entity_description?: string
    }
    p_dynamic: Record<string, any>
    p_relationships: Array<{
      relationship_type: string
      target_entity_type?: string
      relationship_data?: any
      smart_code: string
    }>
    p_options: {}
  }
}

export interface HERATransactionRPCCall {
  function_name: 'hera_txn_crud_v1'
  parameters: {
    p_action: 'CREATE'
    p_actor_user_id: string
    p_organization_id: string
    p_transaction: {
      transaction_type: string
      smart_code: string
      source_entity_id?: string
      target_entity_id?: string
      total_amount?: number
      transaction_currency_code?: string
      transaction_date: string
      transaction_status: string
    }
    p_lines: Array<{
      line_number: number
      line_type: string
      entity_id?: string
      description?: string
      quantity?: number
      unit_amount?: number
      line_amount?: number
      line_data?: any
      smart_code: string
    }>
    p_options: {}
  }
}

/**
 * Helper function to create mapper instance and map YAML to HERA
 */
export function mapYAMLToHERA(
  config: EnhancedAppConfig,
  organizationId: string,
  actorUserId: string
): HERAAppMapping {
  const mapper = new YAMLToHERAMapper(organizationId, actorUserId)
  return mapper.mapAppToHERA(config)
}

/**
 * Generate complete RPC execution plan for YAML app
 */
export function generateHERARPCPlan(
  config: EnhancedAppConfig,
  organizationId: string,
  actorUserId: string
): HERARPCExecutionPlan {
  const mapper = new YAMLToHERAMapper(organizationId, actorUserId)
  const heraMapping = mapper.mapAppToHERA(config)
  
  const entityCalls = heraMapping.entities.map(entity => 
    mapper.generateEntityRPCCalls(entity)
  )
  
  const transactionCalls = heraMapping.transactions.map(txn => 
    mapper.generateTransactionRPCCalls(txn)
  )
  
  return {
    execution_order: [
      { step: 1, type: 'APP_CREATION', description: 'Create application entity' },
      { step: 2, type: 'ENTITY_CREATION', description: 'Create all entities with dynamic fields' },
      { step: 3, type: 'RELATIONSHIP_CREATION', description: 'Create entity relationships' },
      { step: 4, type: 'TRANSACTION_SETUP', description: 'Setup transaction types' },
      { step: 5, type: 'POLICY_CREATION', description: 'Create business policies' },
      { step: 6, type: 'SEED_DATA', description: 'Create seed/demo data' }
    ],
    app_creation: {
      function_name: 'hera_entities_crud_v1',
      parameters: {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_entity: heraMapping.app,
        p_dynamic: { app_metadata: heraMapping.app.app_metadata },
        p_relationships: [],
        p_options: {}
      }
    },
    entity_calls: entityCalls,
    transaction_calls: transactionCalls,
    estimated_duration: this.calculateEstimatedDuration(heraMapping),
    total_operations: entityCalls.length + transactionCalls.length + 1
  }
}

export interface HERARPCExecutionPlan {
  execution_order: Array<{
    step: number
    type: string
    description: string
  }>
  app_creation: HERAEntityRPCCall
  entity_calls: HERAEntityRPCCall[]
  transaction_calls: HERATransactionRPCCall[]
  estimated_duration: string
  total_operations: number
}

function calculateEstimatedDuration(mapping: HERAAppMapping): string {
  const entityCount = mapping.entities.length
  const transactionCount = mapping.transactions.length
  const totalOperations = entityCount + transactionCount + 1
  
  // Estimate 2 seconds per operation
  const estimatedSeconds = totalOperations * 2
  
  if (estimatedSeconds < 60) {
    return `${estimatedSeconds} seconds`
  } else {
    const minutes = Math.ceil(estimatedSeconds / 60)
    return `${minutes} minutes`
  }
}

export default YAMLToHERAMapper