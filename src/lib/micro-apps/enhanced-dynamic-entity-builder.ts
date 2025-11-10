/**
 * HERA Enhanced Dynamic Entity Builder v1
 * Smart Code: HERA.PLATFORM.MICRO_APPS.DYNAMIC.ENTITY.BUILDER.v1
 * 
 * Enhanced developer experience for dynamic entities and transactions in micro-apps with:
 * ✅ Declarative entity definition system
 * ✅ Auto-generated dynamic field mappings
 * ✅ Type-safe field validation and transformation
 * ✅ Smart Code generation for dynamic fields
 * ✅ Integration with existing hera_entities_crud_v1 and hera_txn_crud_v1
 * ✅ Seamless micro-app runtime integration
 */

import { microAppClient, type MicroAppDefinition } from './micro-app-client'
import { apiV2 } from '@/lib/client/fetchV2'

// Enhanced entity definition with dynamic field support
export interface EnhancedMicroAppEntityDefinition {
  entity_type: string
  display_name: string
  display_name_plural: string
  smart_code_base: string // e.g., "HERA.CRM.CUSTOMER"
  dynamic_fields: DynamicFieldDefinition[]
  relationships?: DynamicRelationshipDefinition[]
  validation_rules?: EntityValidationRule[]
  ui_config?: EntityUIConfig
}

// Enhanced transaction definition with dynamic field support
export interface EnhancedMicroAppTransactionDefinition {
  transaction_type: string
  display_name: string
  display_name_plural: string
  smart_code_base: string // e.g., "HERA.FINANCE.TXN.SALE"
  header_fields: DynamicFieldDefinition[]
  line_fields?: DynamicFieldDefinition[]
  validation_rules?: TransactionValidationRule[]
  finance_integration?: FinanceIntegrationConfig
  ui_config?: TransactionUIConfig
}

// Dynamic field definition with enhanced features
export interface DynamicFieldDefinition {
  field_name: string
  display_label: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'entity_ref' | 'email' | 'phone' | 'url' | 'json'
  is_required: boolean
  is_searchable?: boolean
  is_sortable?: boolean
  field_order: number
  default_value?: any
  validation?: FieldValidation
  ui_hints?: FieldUIHints
  smart_code_suffix?: string // Custom suffix for Smart Code generation
  storage_config?: FieldStorageConfig
}

// Enhanced relationship definition
export interface DynamicRelationshipDefinition {
  relationship_type: string
  to_entity_type: string
  display_name: string
  is_required: boolean
  cardinality: 'one_to_one' | 'one_to_many' | 'many_to_many'
  effective_dating?: boolean
  cascade_delete?: boolean
}

// Validation rules
export interface EntityValidationRule {
  rule_id: string
  rule_type: 'required' | 'unique' | 'format' | 'cross_field' | 'custom'
  field_names: string[]
  validation_config: any
  error_message: string
}

export interface TransactionValidationRule {
  rule_id: string
  rule_type: 'balance' | 'required' | 'line_validation' | 'approval' | 'custom'
  scope: 'header' | 'lines' | 'both'
  validation_config: any
  error_message: string
}

// Field-level validation
export interface FieldValidation {
  min_length?: number
  max_length?: number
  min_value?: number
  max_value?: number
  regex_pattern?: string
  allowed_values?: string[]
  custom_validator?: string // Function name for custom validation
}

// UI configuration
export interface FieldUIHints {
  input_type?: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'radio' | 'checkbox'
  placeholder?: string
  help_text?: string
  width?: 'small' | 'medium' | 'large' | 'full'
  group?: string
  conditional_display?: ConditionalDisplayRule[]
}

export interface ConditionalDisplayRule {
  field_name: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface EntityUIConfig {
  layout: 'tabs' | 'accordion' | 'single_page'
  groups: UIFieldGroup[]
  list_view: EntityListViewConfig
  search_config: EntitySearchConfig
}

export interface TransactionUIConfig {
  layout: 'tabs' | 'accordion' | 'single_page'
  header_groups: UIFieldGroup[]
  line_config: TransactionLineConfig
  workflow_config?: WorkflowUIConfig
}

export interface UIFieldGroup {
  group_id: string
  title: string
  description?: string
  fields: string[]
  collapsible?: boolean
  default_expanded?: boolean
}

export interface EntityListViewConfig {
  default_columns: string[]
  sortable_columns: string[]
  filterable_columns: string[]
  searchable_columns: string[]
  row_actions: ListRowAction[]
}

export interface EntitySearchConfig {
  quick_search_fields: string[]
  advanced_search_fields: string[]
  search_operators: SearchOperator[]
}

export interface TransactionLineConfig {
  required_fields: string[]
  calculated_fields: CalculatedField[]
  validation_rules: string[]
}

export interface WorkflowUIConfig {
  approval_steps: ApprovalStep[]
  status_indicators: StatusIndicator[]
}

// Supporting types
export interface FieldStorageConfig {
  index_for_search?: boolean
  encrypt_at_rest?: boolean
  audit_changes?: boolean
  compression?: boolean
}

export interface ListRowAction {
  action_id: string
  label: string
  icon: string
  condition?: string
  confirmation_required?: boolean
}

export interface SearchOperator {
  field_type: string
  operators: string[]
}

export interface CalculatedField {
  field_name: string
  calculation_type: 'sum' | 'multiply' | 'percentage' | 'custom'
  source_fields: string[]
  formula?: string
}

export interface ApprovalStep {
  step_id: string
  title: string
  assignee_field?: string
  condition?: string
}

export interface StatusIndicator {
  status_value: string
  color: string
  icon: string
  description: string
}

export interface FinanceIntegrationConfig {
  chart_of_accounts_mapping: ChartMapping[]
  posting_rules: PostingRule[]
  currency_handling: CurrencyConfig
  revenue_recognition?: RevenueRecognitionConfig
}

export interface ChartMapping {
  transaction_type: string
  debit_account: string
  credit_account: string
  description_template: string
}

export interface PostingRule {
  condition: string
  action: 'post' | 'defer' | 'split'
  configuration: any
}

export interface CurrencyConfig {
  default_currency: string
  multi_currency_support: boolean
  exchange_rate_source?: string
}

export interface RevenueRecognitionConfig {
  recognition_method: 'immediate' | 'deferred' | 'milestone' | 'time_based'
  configuration: any
}

// Enhanced dynamic entity builder response types
export interface DynamicEntityBuildResponse {
  success: boolean
  entity_definition: ProcessedEntityDefinition
  field_mappings: DynamicFieldMapping[]
  smart_codes: SmartCodeMapping[]
  validation_config: ValidationConfig
  runtime_config: RuntimeConfig
  error?: string
}

export interface ProcessedEntityDefinition {
  entity_type: string
  display_name: string
  smart_code: string
  core_entity_config: any
  dynamic_data_config: DynamicDataConfig[]
  relationship_config: RelationshipConfig[]
}

export interface DynamicFieldMapping {
  field_name: string
  field_type: string
  smart_code: string
  storage_location: 'core_dynamic_data' | 'metadata'
  validation_rules: any[]
  ui_config: any
}

export interface SmartCodeMapping {
  context: string
  smart_code: string
  version: string
  description: string
}

export interface ValidationConfig {
  field_validators: FieldValidator[]
  entity_validators: EntityValidator[]
  cross_field_validators: CrossFieldValidator[]
}

export interface RuntimeConfig {
  creation_template: any
  update_template: any
  search_template: any
  list_template: any
}

export interface DynamicDataConfig {
  field_name: string
  field_type: string
  smart_code: string
  default_value?: any
  validation_config: any
}

export interface RelationshipConfig {
  relationship_type: string
  to_entity_type: string
  smart_code: string
  cardinality: string
  constraints: any[]
}

export interface FieldValidator {
  field_name: string
  validator_type: string
  configuration: any
  error_message: string
}

export interface EntityValidator {
  validator_type: string
  configuration: any
  error_message: string
}

export interface CrossFieldValidator {
  field_names: string[]
  validator_type: string
  configuration: any
  error_message: string
}

/**
 * Enhanced Dynamic Entity Builder Class
 * 
 * Provides declarative, type-safe interface for defining dynamic entities and transactions
 * Automatically generates Smart Codes, field mappings, and runtime configurations
 */
export class EnhancedDynamicEntityBuilder {
  private app_code: string
  private version: string
  private smart_code_base: string

  constructor(app_code: string, version: string = 'v1') {
    this.app_code = app_code
    this.version = version
    this.smart_code_base = `HERA.MICROAPP.${app_code.toUpperCase().replace(/-/g, '_')}`
  }

  /**
   * Build enhanced entity definition with dynamic field mappings
   */
  buildEntityDefinition(entityDef: EnhancedMicroAppEntityDefinition): DynamicEntityBuildResponse {
    try {
      // Generate Smart Code for entity
      const entitySmartCode = `${entityDef.smart_code_base}.ENTITY.${this.version}`
      
      // Process dynamic fields and generate mappings
      const fieldMappings: DynamicFieldMapping[] = []
      const dynamicDataConfig: DynamicDataConfig[] = []
      const smartCodes: SmartCodeMapping[] = []

      // Add entity smart code mapping
      smartCodes.push({
        context: 'entity',
        smart_code: entitySmartCode,
        version: this.version,
        description: `Smart code for ${entityDef.display_name} entity`
      })

      // Process each dynamic field
      entityDef.dynamic_fields.forEach((field, index) => {
        const fieldSmartCode = this.generateFieldSmartCode(
          entityDef.smart_code_base,
          field.field_name,
          field.smart_code_suffix
        )

        const fieldMapping: DynamicFieldMapping = {
          field_name: field.field_name,
          field_type: field.field_type,
          smart_code: fieldSmartCode,
          storage_location: this.determineStorageLocation(field),
          validation_rules: this.buildFieldValidation(field),
          ui_config: this.buildFieldUIConfig(field)
        }

        fieldMappings.push(fieldMapping)

        // Create dynamic data configuration
        dynamicDataConfig.push({
          field_name: field.field_name,
          field_type: field.field_type,
          smart_code: fieldSmartCode,
          default_value: field.default_value,
          validation_config: fieldMapping.validation_rules
        })

        // Add field smart code mapping
        smartCodes.push({
          context: 'field',
          smart_code: fieldSmartCode,
          version: this.version,
          description: `Smart code for ${field.display_label} field`
        })
      })

      // Process relationships
      const relationshipConfig: RelationshipConfig[] = []
      if (entityDef.relationships) {
        entityDef.relationships.forEach((rel) => {
          const relSmartCode = this.generateRelationshipSmartCode(
            entityDef.smart_code_base,
            rel.relationship_type,
            rel.to_entity_type
          )

          relationshipConfig.push({
            relationship_type: rel.relationship_type,
            to_entity_type: rel.to_entity_type,
            smart_code: relSmartCode,
            cardinality: rel.cardinality,
            constraints: []
          })

          smartCodes.push({
            context: 'relationship',
            smart_code: relSmartCode,
            version: this.version,
            description: `Smart code for ${rel.display_name} relationship`
          })
        })
      }

      // Build validation configuration
      const validationConfig: ValidationConfig = {
        field_validators: this.buildFieldValidators(entityDef.dynamic_fields),
        entity_validators: this.buildEntityValidators(entityDef.validation_rules || []),
        cross_field_validators: this.buildCrossFieldValidators(entityDef.validation_rules || [])
      }

      // Build runtime configuration
      const runtimeConfig: RuntimeConfig = {
        creation_template: this.buildCreationTemplate(entityDef),
        update_template: this.buildUpdateTemplate(entityDef),
        search_template: this.buildSearchTemplate(entityDef),
        list_template: this.buildListTemplate(entityDef)
      }

      // Create processed entity definition
      const processedEntityDef: ProcessedEntityDefinition = {
        entity_type: entityDef.entity_type,
        display_name: entityDef.display_name,
        smart_code: entitySmartCode,
        core_entity_config: {
          entity_type: entityDef.entity_type,
          entity_name: entityDef.display_name,
          smart_code: entitySmartCode
        },
        dynamic_data_config: dynamicDataConfig,
        relationship_config: relationshipConfig
      }

      return {
        success: true,
        entity_definition: processedEntityDef,
        field_mappings: fieldMappings,
        smart_codes: smartCodes,
        validation_config: validationConfig,
        runtime_config: runtimeConfig
      }

    } catch (error: any) {
      return {
        success: false,
        entity_definition: {} as ProcessedEntityDefinition,
        field_mappings: [],
        smart_codes: [],
        validation_config: {} as ValidationConfig,
        runtime_config: {} as RuntimeConfig,
        error: error.message
      }
    }
  }

  /**
   * Build enhanced transaction definition with dynamic field mappings
   */
  buildTransactionDefinition(txnDef: EnhancedMicroAppTransactionDefinition): DynamicEntityBuildResponse {
    try {
      // Generate Smart Code for transaction
      const txnSmartCode = `${txnDef.smart_code_base}.TXN.${this.version}`
      
      const fieldMappings: DynamicFieldMapping[] = []
      const dynamicDataConfig: DynamicDataConfig[] = []
      const smartCodes: SmartCodeMapping[] = []

      // Add transaction smart code mapping
      smartCodes.push({
        context: 'transaction',
        smart_code: txnSmartCode,
        version: this.version,
        description: `Smart code for ${txnDef.display_name} transaction`
      })

      // Process header fields
      txnDef.header_fields.forEach((field) => {
        const fieldSmartCode = this.generateFieldSmartCode(
          txnDef.smart_code_base + '.HEADER',
          field.field_name,
          field.smart_code_suffix
        )

        const fieldMapping: DynamicFieldMapping = {
          field_name: field.field_name,
          field_type: field.field_type,
          smart_code: fieldSmartCode,
          storage_location: 'core_dynamic_data',
          validation_rules: this.buildFieldValidation(field),
          ui_config: this.buildFieldUIConfig(field)
        }

        fieldMappings.push(fieldMapping)
        dynamicDataConfig.push({
          field_name: field.field_name,
          field_type: field.field_type,
          smart_code: fieldSmartCode,
          default_value: field.default_value,
          validation_config: fieldMapping.validation_rules
        })

        smartCodes.push({
          context: 'transaction_header_field',
          smart_code: fieldSmartCode,
          version: this.version,
          description: `Smart code for ${field.display_label} header field`
        })
      })

      // Process line fields if present
      if (txnDef.line_fields) {
        txnDef.line_fields.forEach((field) => {
          const fieldSmartCode = this.generateFieldSmartCode(
            txnDef.smart_code_base + '.LINE',
            field.field_name,
            field.smart_code_suffix
          )

          const fieldMapping: DynamicFieldMapping = {
            field_name: field.field_name,
            field_type: field.field_type,
            smart_code: fieldSmartCode,
            storage_location: 'core_dynamic_data',
            validation_rules: this.buildFieldValidation(field),
            ui_config: this.buildFieldUIConfig(field)
          }

          fieldMappings.push(fieldMapping)

          smartCodes.push({
            context: 'transaction_line_field',
            smart_code: fieldSmartCode,
            version: this.version,
            description: `Smart code for ${field.display_label} line field`
          })
        })
      }

      // Build validation configuration
      const validationConfig: ValidationConfig = {
        field_validators: this.buildFieldValidators(txnDef.header_fields),
        entity_validators: this.buildTransactionValidators(txnDef.validation_rules || []),
        cross_field_validators: []
      }

      // Build runtime configuration with finance integration
      const runtimeConfig: RuntimeConfig = {
        creation_template: this.buildTransactionCreationTemplate(txnDef),
        update_template: this.buildTransactionUpdateTemplate(txnDef),
        search_template: this.buildTransactionSearchTemplate(txnDef),
        list_template: this.buildTransactionListTemplate(txnDef)
      }

      const processedTxnDef: ProcessedEntityDefinition = {
        entity_type: txnDef.transaction_type,
        display_name: txnDef.display_name,
        smart_code: txnSmartCode,
        core_entity_config: {
          transaction_type: txnDef.transaction_type,
          transaction_name: txnDef.display_name,
          smart_code: txnSmartCode
        },
        dynamic_data_config: dynamicDataConfig,
        relationship_config: []
      }

      return {
        success: true,
        entity_definition: processedTxnDef,
        field_mappings: fieldMappings,
        smart_codes: smartCodes,
        validation_config: validationConfig,
        runtime_config: runtimeConfig
      }

    } catch (error: any) {
      return {
        success: false,
        entity_definition: {} as ProcessedEntityDefinition,
        field_mappings: [],
        smart_codes: [],
        validation_config: {} as ValidationConfig,
        runtime_config: {} as RuntimeConfig,
        error: error.message
      }
    }
  }

  /**
   * Execute entity operation using enhanced dynamic configuration
   */
  async executeEntityOperation(
    entityConfig: DynamicEntityBuildResponse,
    action: 'create' | 'update' | 'delete' | 'read',
    entityData: Record<string, any>,
    organizationId: string,
    options?: {
      validate_before_save?: boolean
      auto_generate_codes?: boolean
      trigger_workflows?: boolean
    }
  ) {
    if (!entityConfig.success) {
      throw new Error(`Entity configuration is invalid: ${entityConfig.error}`)
    }

    // Transform input data to HERA format using field mappings
    const transformedData = this.transformEntityDataToHERA(entityData, entityConfig)

    // Execute via micro-app runtime with enhanced context
    return await microAppClient.executeEntityOperation(
      this.app_code,
      action,
      entityConfig.entity_definition.entity_type,
      transformedData.entity_data,
      organizationId,
      transformedData.dynamic_fields,
      transformedData.relationships
    )
  }

  /**
   * Execute transaction operation using enhanced dynamic configuration
   */
  async executeTransactionOperation(
    transactionConfig: DynamicEntityBuildResponse,
    action: 'create' | 'update' | 'post' | 'approve',
    transactionData: Record<string, any>,
    organizationId: string,
    lines?: any[],
    options?: {
      validate_before_save?: boolean
      auto_post_to_gl?: boolean
      trigger_workflows?: boolean
    }
  ) {
    if (!transactionConfig.success) {
      throw new Error(`Transaction configuration is invalid: ${transactionConfig.error}`)
    }

    // Transform input data to HERA format
    const transformedData = this.transformTransactionDataToHERA(transactionData, transactionConfig)

    // Execute via micro-app runtime
    return await microAppClient.executeTransactionOperation(
      this.app_code,
      action,
      transactionConfig.entity_definition.entity_type,
      transformedData.transaction_data,
      organizationId,
      transformedData.lines
    )
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private generateFieldSmartCode(
    baseCode: string, 
    fieldName: string, 
    suffix?: string
  ): string {
    const normalizedFieldName = fieldName.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    const smartCodeSuffix = suffix || 'FIELD'
    return `${baseCode}.${smartCodeSuffix}.${normalizedFieldName}.${this.version}`
  }

  private generateRelationshipSmartCode(
    baseCode: string,
    relationshipType: string,
    toEntityType: string
  ): string {
    const normalizedRelType = relationshipType.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    const normalizedEntityType = toEntityType.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    return `${baseCode}.REL.${normalizedRelType}.${normalizedEntityType}.${this.version}`
  }

  private determineStorageLocation(field: DynamicFieldDefinition): 'core_dynamic_data' | 'metadata' {
    // Business fields go to core_dynamic_data
    // System metadata goes to metadata
    if (field.storage_config?.encrypt_at_rest || 
        field.field_type === 'json' ||
        field.field_name.startsWith('system_') ||
        field.field_name.startsWith('meta_')) {
      return 'metadata'
    }
    return 'core_dynamic_data'
  }

  private buildFieldValidation(field: DynamicFieldDefinition): any[] {
    const validators: any[] = []

    if (field.is_required) {
      validators.push({
        type: 'required',
        message: `${field.display_label} is required`
      })
    }

    if (field.validation) {
      const val = field.validation
      
      if (val.min_length !== undefined) {
        validators.push({
          type: 'min_length',
          value: val.min_length,
          message: `${field.display_label} must be at least ${val.min_length} characters`
        })
      }

      if (val.max_length !== undefined) {
        validators.push({
          type: 'max_length',
          value: val.max_length,
          message: `${field.display_label} cannot exceed ${val.max_length} characters`
        })
      }

      if (val.regex_pattern) {
        validators.push({
          type: 'regex',
          pattern: val.regex_pattern,
          message: `${field.display_label} format is invalid`
        })
      }

      if (val.allowed_values) {
        validators.push({
          type: 'allowed_values',
          values: val.allowed_values,
          message: `${field.display_label} must be one of: ${val.allowed_values.join(', ')}`
        })
      }
    }

    return validators
  }

  private buildFieldUIConfig(field: DynamicFieldDefinition): any {
    return {
      input_type: field.ui_hints?.input_type || this.getDefaultInputType(field.field_type),
      placeholder: field.ui_hints?.placeholder,
      help_text: field.ui_hints?.help_text,
      width: field.ui_hints?.width || 'medium',
      group: field.ui_hints?.group,
      conditional_display: field.ui_hints?.conditional_display || []
    }
  }

  private getDefaultInputType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'number': 'number',
      'boolean': 'checkbox',
      'date': 'date',
      'datetime': 'datetime-local',
      'email': 'email',
      'phone': 'tel',
      'url': 'url',
      'select': 'select',
      'entity_ref': 'select',
      'json': 'textarea'
    }
    return typeMap[fieldType] || 'text'
  }

  private buildFieldValidators(fields: DynamicFieldDefinition[]): FieldValidator[] {
    const validators: FieldValidator[] = []
    
    fields.forEach((field) => {
      const fieldValidation = this.buildFieldValidation(field)
      fieldValidation.forEach((validation) => {
        validators.push({
          field_name: field.field_name,
          validator_type: validation.type,
          configuration: validation,
          error_message: validation.message
        })
      })
    })

    return validators
  }

  private buildEntityValidators(rules: EntityValidationRule[]): EntityValidator[] {
    return rules.map((rule) => ({
      validator_type: rule.rule_type,
      configuration: rule.validation_config,
      error_message: rule.error_message
    }))
  }

  private buildCrossFieldValidators(rules: EntityValidationRule[]): CrossFieldValidator[] {
    return rules
      .filter(rule => rule.rule_type === 'cross_field')
      .map((rule) => ({
        field_names: rule.field_names,
        validator_type: rule.rule_type,
        configuration: rule.validation_config,
        error_message: rule.error_message
      }))
  }

  private buildTransactionValidators(rules: TransactionValidationRule[]): EntityValidator[] {
    return rules.map((rule) => ({
      validator_type: rule.rule_type,
      configuration: rule.validation_config,
      error_message: rule.error_message
    }))
  }

  private buildCreationTemplate(entityDef: EnhancedMicroAppEntityDefinition): any {
    return {
      entity_type: entityDef.entity_type,
      smart_code: `${entityDef.smart_code_base}.ENTITY.${this.version}`,
      dynamic_fields: entityDef.dynamic_fields.map((field) => ({
        field_name: field.field_name,
        field_type: field.field_type,
        smart_code: this.generateFieldSmartCode(entityDef.smart_code_base, field.field_name, field.smart_code_suffix),
        default_value: field.default_value
      }))
    }
  }

  private buildUpdateTemplate(entityDef: EnhancedMicroAppEntityDefinition): any {
    return this.buildCreationTemplate(entityDef)
  }

  private buildSearchTemplate(entityDef: EnhancedMicroAppEntityDefinition): any {
    const searchableFields = entityDef.dynamic_fields.filter(f => f.is_searchable)
    return {
      entity_type: entityDef.entity_type,
      searchable_fields: searchableFields.map(f => f.field_name),
      search_operators: this.buildSearchOperators(searchableFields)
    }
  }

  private buildListTemplate(entityDef: EnhancedMicroAppEntityDefinition): any {
    const defaultColumns = entityDef.dynamic_fields
      .filter(f => f.field_order <= 5)
      .sort((a, b) => a.field_order - b.field_order)
      .map(f => f.field_name)

    return {
      entity_type: entityDef.entity_type,
      default_columns: defaultColumns,
      sortable_columns: entityDef.dynamic_fields.filter(f => f.is_sortable).map(f => f.field_name),
      ui_config: entityDef.ui_config?.list_view
    }
  }

  private buildTransactionCreationTemplate(txnDef: EnhancedMicroAppTransactionDefinition): any {
    return {
      transaction_type: txnDef.transaction_type,
      smart_code: `${txnDef.smart_code_base}.TXN.${this.version}`,
      header_fields: txnDef.header_fields.map((field) => ({
        field_name: field.field_name,
        field_type: field.field_type,
        smart_code: this.generateFieldSmartCode(txnDef.smart_code_base + '.HEADER', field.field_name),
        default_value: field.default_value
      })),
      line_fields: txnDef.line_fields?.map((field) => ({
        field_name: field.field_name,
        field_type: field.field_type,
        smart_code: this.generateFieldSmartCode(txnDef.smart_code_base + '.LINE', field.field_name),
        default_value: field.default_value
      })),
      finance_integration: txnDef.finance_integration
    }
  }

  private buildTransactionUpdateTemplate(txnDef: EnhancedMicroAppTransactionDefinition): any {
    return this.buildTransactionCreationTemplate(txnDef)
  }

  private buildTransactionSearchTemplate(txnDef: EnhancedMicroAppTransactionDefinition): any {
    const searchableFields = txnDef.header_fields.filter(f => f.is_searchable)
    return {
      transaction_type: txnDef.transaction_type,
      searchable_fields: searchableFields.map(f => f.field_name),
      search_operators: this.buildSearchOperators(searchableFields)
    }
  }

  private buildTransactionListTemplate(txnDef: EnhancedMicroAppTransactionDefinition): any {
    const defaultColumns = txnDef.header_fields
      .filter(f => f.field_order <= 5)
      .sort((a, b) => a.field_order - b.field_order)
      .map(f => f.field_name)

    return {
      transaction_type: txnDef.transaction_type,
      default_columns: defaultColumns,
      sortable_columns: txnDef.header_fields.filter(f => f.is_sortable).map(f => f.field_name),
      ui_config: txnDef.ui_config
    }
  }

  private buildSearchOperators(fields: DynamicFieldDefinition[]): any {
    const operatorMap: Record<string, string[]> = {
      'text': ['contains', 'equals', 'starts_with', 'ends_with'],
      'number': ['equals', 'greater_than', 'less_than', 'between'],
      'date': ['equals', 'greater_than', 'less_than', 'between'],
      'boolean': ['equals'],
      'select': ['equals', 'in']
    }

    return fields.map(field => ({
      field_name: field.field_name,
      field_type: field.field_type,
      operators: operatorMap[field.field_type] || ['equals']
    }))
  }

  private transformEntityDataToHERA(
    entityData: Record<string, any>,
    entityConfig: DynamicEntityBuildResponse
  ) {
    const entity_data: Record<string, any> = {}
    const dynamic_fields: Record<string, any> = {}
    const relationships: any[] = []

    // Process core entity fields
    entity_data.entity_type = entityConfig.entity_definition.entity_type
    entity_data.entity_name = entityData.entity_name || entityData.name
    entity_data.smart_code = entityConfig.entity_definition.smart_code

    // Transform dynamic fields using field mappings
    entityConfig.field_mappings.forEach(mapping => {
      const fieldValue = entityData[mapping.field_name]
      if (fieldValue !== undefined) {
        if (mapping.storage_location === 'core_dynamic_data') {
          dynamic_fields[mapping.field_name] = {
            field_type: mapping.field_type,
            [`field_value_${this.getFieldValueKey(mapping.field_type)}`]: fieldValue,
            smart_code: mapping.smart_code
          }
        } else {
          // Store in metadata
          entity_data.metadata = entity_data.metadata || {}
          entity_data.metadata[mapping.field_name] = fieldValue
        }
      }
    })

    return {
      entity_data,
      dynamic_fields,
      relationships
    }
  }

  private transformTransactionDataToHERA(
    transactionData: Record<string, any>,
    transactionConfig: DynamicEntityBuildResponse
  ) {
    const transaction_data: Record<string, any> = {}
    const lines: any[] = []

    // Process core transaction fields
    transaction_data.transaction_type = transactionConfig.entity_definition.entity_type
    transaction_data.smart_code = transactionConfig.entity_definition.smart_code

    // Transform header fields
    transactionConfig.field_mappings.forEach(mapping => {
      const fieldValue = transactionData[mapping.field_name]
      if (fieldValue !== undefined) {
        transaction_data[mapping.field_name] = fieldValue
      }
    })

    // Transform lines if present
    if (transactionData.lines) {
      lines.push(...transactionData.lines)
    }

    return {
      transaction_data,
      lines
    }
  }

  private getFieldValueKey(fieldType: string): string {
    const keyMap: Record<string, string> = {
      'text': 'text',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'datetime': 'timestamp',
      'email': 'text',
      'phone': 'text',
      'url': 'text',
      'select': 'text',
      'entity_ref': 'text',
      'json': 'json'
    }
    return keyMap[fieldType] || 'text'
  }
}

// Factory function for easy usage
export function createEnhancedDynamicEntityBuilder(
  app_code: string, 
  version: string = 'v1'
): EnhancedDynamicEntityBuilder {
  return new EnhancedDynamicEntityBuilder(app_code, version)
}

// Export all types for external usage
export type {
  EnhancedMicroAppEntityDefinition,
  EnhancedMicroAppTransactionDefinition,
  DynamicFieldDefinition,
  DynamicRelationshipDefinition,
  EntityValidationRule,
  TransactionValidationRule,
  FieldValidation,
  FieldUIHints,
  EntityUIConfig,
  TransactionUIConfig,
  FinanceIntegrationConfig
}