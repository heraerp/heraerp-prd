/**
 * HERA v2.4 Configuration Validation Engine
 * Smart Code: HERA.VALIDATION.CONFIG.PLATFORM.v1
 * 
 * Client-side validation for JSON-driven ERP configurations
 * Provides comprehensive validation with detailed error reporting
 */

import { 
  HeraAppConfig, 
  EntityDefinition, 
  FieldDefinition,
  TransactionDefinition,
  ScreenDefinition,
  BusinessRuleDefinition,
  ValidationDefinition,
  WorkflowDefinition,
  IntegrationDefinition,
  ConfigError,
  ConfigWarning,
  ConfigValidationResponse
} from '@/types/app-config'

// =============================================================================
// Validation Engine Class
// =============================================================================

export class ConfigValidationEngine {
  private errors: ConfigError[] = []
  private warnings: ConfigWarning[] = []

  /**
   * Validate complete configuration
   */
  async validate(config: HeraAppConfig | Partial<HeraAppConfig>): Promise<ConfigValidationResponse> {
    this.errors = []
    this.warnings = []

    try {
      // Basic structure validation
      this.validateBasicStructure(config)

      // Section-specific validation
      if (config.metadata) this.validateMetadata(config.metadata)
      if (config.entities) this.validateEntities(config.entities)
      if (config.transactions) this.validateTransactions(config.transactions)
      if (config.screens) this.validateScreens(config.screens)
      if (config.business_rules) this.validateBusinessRules(config.business_rules)
      if (config.validations) this.validateValidations(config.validations)
      if (config.workflows) this.validateWorkflows(config.workflows)
      if (config.integrations) this.validateIntegrations(config.integrations)

      // Cross-section validation
      this.validateCrossReferences(config)

    } catch (error) {
      this.addError('VALIDATION_EXCEPTION', `Validation failed: ${error.message}`)
    }

    return {
      is_valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  /**
   * Validate basic configuration structure
   */
  private validateBasicStructure(config: HeraAppConfig | Partial<HeraAppConfig>) {
    if (!config) {
      this.addError('CONFIG_NULL', 'Configuration cannot be null or undefined')
      return
    }

    // Required root fields for complete configs
    if (!config.app_id) {
      this.addError('APP_ID_MISSING', 'app_id is required')
    } else if (!/^[a-z_]+$/.test(config.app_id)) {
      this.addError('APP_ID_INVALID', 'app_id must contain only lowercase letters and underscores')
    }

    if (!config.version) {
      this.addError('VERSION_MISSING', 'version is required')
    } else if (!/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(config.version)) {
      this.addError('VERSION_INVALID', 'version must follow pattern v{major}.{minor}.{patch}')
    }

    // Warn about missing sections
    if (!config.entities && !config.transactions) {
      this.addWarning('NO_DATA_DEFINITIONS', 'Configuration has no entities or transactions defined')
    }

    if (!config.screens) {
      this.addWarning('NO_SCREENS', 'Configuration has no screen definitions - users won\'t be able to interact with data')
    }
  }

  /**
   * Validate metadata section
   */
  private validateMetadata(metadata: any) {
    const requiredFields = ['name', 'description', 'module', 'icon', 'category']
    
    for (const field of requiredFields) {
      if (!metadata[field]) {
        this.addError('METADATA_FIELD_MISSING', `metadata.${field} is required`, `metadata.${field}`)
      } else if (typeof metadata[field] !== 'string' || metadata[field].length === 0) {
        this.addError('METADATA_FIELD_INVALID', `metadata.${field} must be a non-empty string`, `metadata.${field}`)
      }
    }

    // Validate optional fields
    if (metadata.tags && !Array.isArray(metadata.tags)) {
      this.addError('METADATA_TAGS_INVALID', 'metadata.tags must be an array of strings', 'metadata.tags')
    }

    if (metadata.tags && metadata.tags.some((tag: any) => typeof tag !== 'string')) {
      this.addError('METADATA_TAGS_INVALID', 'All metadata.tags must be strings', 'metadata.tags')
    }
  }

  /**
   * Validate entities section
   */
  private validateEntities(entities: EntityDefinition[]) {
    if (!Array.isArray(entities)) {
      this.addError('ENTITIES_NOT_ARRAY', 'entities must be an array')
      return
    }

    const entityTypes = new Set<string>()

    entities.forEach((entity, index) => {
      const entityPath = `entities[${index}]`

      // Check for duplicates
      if (entityTypes.has(entity.entity_type)) {
        this.addError('ENTITY_TYPE_DUPLICATE', `Duplicate entity_type: ${entity.entity_type}`, entityPath)
      } else {
        entityTypes.add(entity.entity_type)
      }

      // Validate required fields
      this.validateRequiredField(entity, 'entity_type', entityPath)
      this.validateRequiredField(entity, 'smart_code_prefix', entityPath)
      this.validateRequiredField(entity, 'display_name', entityPath)
      this.validateRequiredField(entity, 'display_name_plural', entityPath)
      this.validateRequiredField(entity, 'icon', entityPath)
      this.validateRequiredField(entity, 'color', entityPath)

      // Validate entity_type format
      if (entity.entity_type && !/^[A-Z_]+$/.test(entity.entity_type)) {
        this.addError('ENTITY_TYPE_INVALID', 
          `entity_type must contain only uppercase letters and underscores: ${entity.entity_type}`, 
          entityPath)
      }

      // Validate smart_code_prefix
      if (entity.smart_code_prefix && !entity.smart_code_prefix.startsWith('HERA.')) {
        this.addError('SMART_CODE_PREFIX_INVALID', 
          `smart_code_prefix must start with 'HERA.': ${entity.smart_code_prefix}`, 
          entityPath)
      }

      // Validate color format
      if (entity.color && !/^#[0-9a-fA-F]{6}$/.test(entity.color)) {
        this.addError('COLOR_INVALID', 
          `color must be a valid hex color: ${entity.color}`, 
          entityPath)
      }

      // Validate fields
      if (!entity.fields || !Array.isArray(entity.fields)) {
        this.addError('ENTITY_FIELDS_MISSING', 'Entity must have fields array', entityPath)
      } else {
        this.validateEntityFields(entity.fields, entityPath)
      }

      // Validate relationships
      if (entity.relationships) {
        this.validateEntityRelationships(entity.relationships, entityPath)
      }

      // Validate indexes
      if (entity.indexes) {
        this.validateEntityIndexes(entity.indexes, entityPath)
      }
    })
  }

  /**
   * Validate entity fields
   */
  private validateEntityFields(fields: FieldDefinition[], entityPath: string) {
    const fieldNames = new Set<string>()

    fields.forEach((field, index) => {
      const fieldPath = `${entityPath}.fields[${index}]`

      // Check for duplicates
      if (fieldNames.has(field.field_name)) {
        this.addError('FIELD_NAME_DUPLICATE', 
          `Duplicate field_name: ${field.field_name}`, 
          fieldPath)
      } else {
        fieldNames.add(field.field_name)
      }

      // Validate required fields
      this.validateRequiredField(field, 'field_name', fieldPath)
      this.validateRequiredField(field, 'display_label', fieldPath)
      this.validateRequiredField(field, 'field_type', fieldPath)
      this.validateRequiredField(field, 'is_required', fieldPath)
      this.validateRequiredField(field, 'field_order', fieldPath)

      // Validate field_name format
      if (field.field_name && !/^[a-z_]+$/.test(field.field_name)) {
        this.addError('FIELD_NAME_INVALID', 
          `field_name must contain only lowercase letters and underscores: ${field.field_name}`, 
          fieldPath)
      }

      // Validate field_type
      const validFieldTypes = ['text', 'number', 'date', 'boolean', 'json', 'entity_reference']
      if (field.field_type && !validFieldTypes.includes(field.field_type)) {
        this.addError('FIELD_TYPE_INVALID', 
          `Invalid field_type: ${field.field_type}. Valid types: ${validFieldTypes.join(', ')}`, 
          fieldPath)
      }

      // Validate field_order
      if (typeof field.field_order !== 'number' || field.field_order < 1) {
        this.addError('FIELD_ORDER_INVALID', 
          `field_order must be a positive number: ${field.field_order}`, 
          fieldPath)
      }

      // Validate validation rules
      if (field.validation) {
        this.validateFieldValidation(field.validation, fieldPath)
      }

      // Validate UI hints
      if (field.ui_hints) {
        this.validateFieldUIHints(field.ui_hints, fieldPath)
      }

      // Validate computed field config
      if (field.computed) {
        this.validateComputedFieldConfig(field.computed, fieldPath)
      }
    })

    // Check for reasonable field order sequence
    const orders = fields.map(f => f.field_order).sort((a, b) => a - b)
    const gaps = orders.filter((order, i) => i > 0 && order - orders[i - 1] > 10)
    if (gaps.length > 0) {
      this.addWarning('FIELD_ORDER_GAPS', 
        `Large gaps in field_order sequence may indicate missing fields`,
        entityPath)
    }
  }

  /**
   * Validate field validation rules
   */
  private validateFieldValidation(validation: any, fieldPath: string) {
    const validationPath = `${fieldPath}.validation`

    // Validate error_message is required
    if (!validation.error_message) {
      this.addError('VALIDATION_ERROR_MESSAGE_MISSING', 
        'validation.error_message is required', 
        validationPath)
    }

    // Validate conditional rules
    if (validation.min_length && typeof validation.min_length !== 'number') {
      this.addError('VALIDATION_MIN_LENGTH_INVALID', 
        'validation.min_length must be a number', 
        validationPath)
    }

    if (validation.max_length && typeof validation.max_length !== 'number') {
      this.addError('VALIDATION_MAX_LENGTH_INVALID', 
        'validation.max_length must be a number', 
        validationPath)
    }

    if (validation.min && typeof validation.min !== 'number') {
      this.addError('VALIDATION_MIN_INVALID', 
        'validation.min must be a number', 
        validationPath)
    }

    if (validation.max && typeof validation.max !== 'number') {
      this.addError('VALIDATION_MAX_INVALID', 
        'validation.max must be a number', 
        validationPath)
    }

    // Validate pattern is valid regex
    if (validation.pattern) {
      try {
        new RegExp(validation.pattern)
      } catch (error) {
        this.addError('VALIDATION_PATTERN_INVALID', 
          `validation.pattern is not a valid regex: ${validation.pattern}`, 
          validationPath)
      }
    }

    // Validate enum values
    if (validation.enum && !Array.isArray(validation.enum)) {
      this.addError('VALIDATION_ENUM_INVALID', 
        'validation.enum must be an array', 
        validationPath)
    }

    // Validate JSON schema if present
    if (validation.json_schema && typeof validation.json_schema !== 'object') {
      this.addError('VALIDATION_JSON_SCHEMA_INVALID', 
        'validation.json_schema must be an object', 
        validationPath)
    }
  }

  /**
   * Validate field UI hints
   */
  private validateFieldUIHints(uiHints: any, fieldPath: string) {
    const hintsPath = `${fieldPath}.ui_hints`

    if (!uiHints.input_type) {
      this.addError('UI_HINTS_INPUT_TYPE_MISSING', 
        'ui_hints.input_type is required', 
        hintsPath)
    }

    const validInputTypes = [
      'text', 'email', 'tel', 'date', 'datetime', 'number',
      'select', 'multiselect', 'textarea', 'json_editor',
      'entity_lookup', 'file_upload', 'color_picker'
    ]

    if (uiHints.input_type && !validInputTypes.includes(uiHints.input_type)) {
      this.addError('UI_HINTS_INPUT_TYPE_INVALID', 
        `Invalid input_type: ${uiHints.input_type}. Valid types: ${validInputTypes.join(', ')}`, 
        hintsPath)
    }

    // Validate options for select inputs
    if (['select', 'multiselect'].includes(uiHints.input_type) && !uiHints.options) {
      this.addError('UI_HINTS_OPTIONS_MISSING', 
        'ui_hints.options is required for select input types', 
        hintsPath)
    }

    if (uiHints.options && !Array.isArray(uiHints.options)) {
      this.addError('UI_HINTS_OPTIONS_INVALID', 
        'ui_hints.options must be an array', 
        hintsPath)
    }
  }

  /**
   * Validate computed field configuration
   */
  private validateComputedFieldConfig(computed: any, fieldPath: string) {
    const computedPath = `${fieldPath}.computed`

    if (!computed.auto_calculate && !computed.formula && !computed.rule_id) {
      this.addError('COMPUTED_CONFIG_INCOMPLETE', 
        'Computed field must specify auto_calculate=true, formula, or rule_id', 
        computedPath)
    }

    if (!Array.isArray(computed.dependencies)) {
      this.addError('COMPUTED_DEPENDENCIES_INVALID', 
        'computed.dependencies must be an array of field names', 
        computedPath)
    }
  }

  /**
   * Validate transactions section
   */
  private validateTransactions(transactions: TransactionDefinition[]) {
    if (!Array.isArray(transactions)) {
      this.addError('TRANSACTIONS_NOT_ARRAY', 'transactions must be an array')
      return
    }

    const transactionTypes = new Set<string>()

    transactions.forEach((transaction, index) => {
      const transactionPath = `transactions[${index}]`

      // Check for duplicates
      if (transactionTypes.has(transaction.transaction_type)) {
        this.addError('TRANSACTION_TYPE_DUPLICATE', 
          `Duplicate transaction_type: ${transaction.transaction_type}`, 
          transactionPath)
      } else {
        transactionTypes.add(transaction.transaction_type)
      }

      // Validate required fields
      this.validateRequiredField(transaction, 'transaction_type', transactionPath)
      this.validateRequiredField(transaction, 'smart_code_prefix', transactionPath)
      this.validateRequiredField(transaction, 'display_name', transactionPath)
      this.validateRequiredField(transaction, 'header_fields', transactionPath)
      this.validateRequiredField(transaction, 'line_fields', transactionPath)

      // Validate header and line fields
      if (transaction.header_fields) {
        this.validateEntityFields(transaction.header_fields, `${transactionPath}.header_fields`)
      }

      if (transaction.line_fields) {
        this.validateEntityFields(transaction.line_fields, `${transactionPath}.line_fields`)
      }

      // Validate state machine if present
      if (transaction.state_machine) {
        this.validateStateMachine(transaction.state_machine, transactionPath)
      }
    })
  }

  /**
   * Validate screens section
   */
  private validateScreens(screens: ScreenDefinition[]) {
    if (!Array.isArray(screens)) {
      this.addError('SCREENS_NOT_ARRAY', 'screens must be an array')
      return
    }

    const screenIds = new Set<string>()

    screens.forEach((screen, index) => {
      const screenPath = `screens[${index}]`

      // Check for duplicates
      if (screenIds.has(screen.screen_id)) {
        this.addError('SCREEN_ID_DUPLICATE', 
          `Duplicate screen_id: ${screen.screen_id}`, 
          screenPath)
      } else {
        screenIds.add(screen.screen_id)
      }

      // Validate required fields
      this.validateRequiredField(screen, 'screen_id', screenPath)
      this.validateRequiredField(screen, 'screen_type', screenPath)
      this.validateRequiredField(screen, 'display_name', screenPath)

      // Validate screen_type
      const validScreenTypes = ['entity_list', 'entity_form', 'transaction_form', 'dashboard', 'report']
      if (screen.screen_type && !validScreenTypes.includes(screen.screen_type)) {
        this.addError('SCREEN_TYPE_INVALID', 
          `Invalid screen_type: ${screen.screen_type}. Valid types: ${validScreenTypes.join(', ')}`, 
          screenPath)
      }

      // Validate entity_type or transaction_type is specified when needed
      if (['entity_list', 'entity_form'].includes(screen.screen_type) && !screen.entity_type) {
        this.addError('SCREEN_ENTITY_TYPE_MISSING', 
          `screen_type ${screen.screen_type} requires entity_type`, 
          screenPath)
      }

      if (screen.screen_type === 'transaction_form' && !screen.transaction_type) {
        this.addError('SCREEN_TRANSACTION_TYPE_MISSING', 
          'screen_type transaction_form requires transaction_type', 
          screenPath)
      }
    })
  }

  /**
   * Validate business rules section
   */
  private validateBusinessRules(rules: BusinessRuleDefinition[]) {
    if (!Array.isArray(rules)) {
      this.addError('BUSINESS_RULES_NOT_ARRAY', 'business_rules must be an array')
      return
    }

    const ruleIds = new Set<string>()

    rules.forEach((rule, index) => {
      const rulePath = `business_rules[${index}]`

      // Check for duplicates
      if (ruleIds.has(rule.rule_id)) {
        this.addError('RULE_ID_DUPLICATE', 
          `Duplicate rule_id: ${rule.rule_id}`, 
          rulePath)
      } else {
        ruleIds.add(rule.rule_id)
      }

      // Validate required fields
      this.validateRequiredField(rule, 'rule_id', rulePath)
      this.validateRequiredField(rule, 'display_name', rulePath)
      this.validateRequiredField(rule, 'trigger', rulePath)
      this.validateRequiredField(rule, 'actions', rulePath)

      // Validate trigger
      const validTriggers = ['on_save', 'on_field_change', 'on_calculate', 'on_submit', 'scheduled']
      if (rule.trigger && !validTriggers.includes(rule.trigger)) {
        this.addError('RULE_TRIGGER_INVALID', 
          `Invalid trigger: ${rule.trigger}. Valid triggers: ${validTriggers.join(', ')}`, 
          rulePath)
      }

      // Validate schedule for scheduled rules
      if (rule.trigger === 'scheduled' && !rule.schedule) {
        this.addError('RULE_SCHEDULE_MISSING', 
          'Scheduled rules must have schedule field', 
          rulePath)
      }

      // Validate actions array
      if (!Array.isArray(rule.actions)) {
        this.addError('RULE_ACTIONS_NOT_ARRAY', 
          'actions must be an array', 
          rulePath)
      }
    })
  }

  /**
   * Validate validations section
   */
  private validateValidations(validations: ValidationDefinition[]) {
    if (!Array.isArray(validations)) {
      this.addError('VALIDATIONS_NOT_ARRAY', 'validations must be an array')
      return
    }

    validations.forEach((validation, index) => {
      const validationPath = `validations[${index}]`

      // Validate required fields
      this.validateRequiredField(validation, 'validation_id', validationPath)
      this.validateRequiredField(validation, 'display_name', validationPath)
      this.validateRequiredField(validation, 'type', validationPath)
      this.validateRequiredField(validation, 'error_message', validationPath)
      this.validateRequiredField(validation, 'error_code', validationPath)

      // Validate type
      const validTypes = ['unique', 'custom', 'threshold', 'pattern', 'range']
      if (validation.type && !validTypes.includes(validation.type)) {
        this.addError('VALIDATION_TYPE_INVALID', 
          `Invalid validation type: ${validation.type}. Valid types: ${validTypes.join(', ')}`, 
          validationPath)
      }
    })
  }

  /**
   * Validate workflows section
   */
  private validateWorkflows(workflows: WorkflowDefinition[]) {
    if (!Array.isArray(workflows)) {
      this.addError('WORKFLOWS_NOT_ARRAY', 'workflows must be an array')
      return
    }

    workflows.forEach((workflow, index) => {
      const workflowPath = `workflows[${index}]`

      // Validate required fields
      this.validateRequiredField(workflow, 'workflow_id', workflowPath)
      this.validateRequiredField(workflow, 'display_name', workflowPath)
      this.validateRequiredField(workflow, 'enabled', workflowPath)
      this.validateRequiredField(workflow, 'trigger', workflowPath)
      this.validateRequiredField(workflow, 'steps', workflowPath)

      // Validate steps array
      if (!Array.isArray(workflow.steps)) {
        this.addError('WORKFLOW_STEPS_NOT_ARRAY', 
          'workflow steps must be an array', 
          workflowPath)
      }
    })
  }

  /**
   * Validate integrations section
   */
  private validateIntegrations(integrations: IntegrationDefinition[]) {
    if (!Array.isArray(integrations)) {
      this.addError('INTEGRATIONS_NOT_ARRAY', 'integrations must be an array')
      return
    }

    integrations.forEach((integration, index) => {
      const integrationPath = `integrations[${index}]`

      // Validate required fields
      this.validateRequiredField(integration, 'integration_id', integrationPath)
      this.validateRequiredField(integration, 'display_name', integrationPath)
      this.validateRequiredField(integration, 'type', integrationPath)
      this.validateRequiredField(integration, 'enabled', integrationPath)
      this.validateRequiredField(integration, 'endpoint', integrationPath)
      this.validateRequiredField(integration, 'method', integrationPath)
      this.validateRequiredField(integration, 'auth', integrationPath)

      // Validate type
      const validTypes = ['webhook', 'scheduled', 'real_time']
      if (integration.type && !validTypes.includes(integration.type)) {
        this.addError('INTEGRATION_TYPE_INVALID', 
          `Invalid integration type: ${integration.type}. Valid types: ${validTypes.join(', ')}`, 
          integrationPath)
      }

      // Validate URL format
      if (integration.endpoint) {
        try {
          new URL(integration.endpoint)
        } catch (error) {
          this.addError('INTEGRATION_ENDPOINT_INVALID', 
            `Invalid endpoint URL: ${integration.endpoint}`, 
            integrationPath)
        }
      }

      // Validate HTTP method
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      if (integration.method && !validMethods.includes(integration.method.toUpperCase())) {
        this.addError('INTEGRATION_METHOD_INVALID', 
          `Invalid HTTP method: ${integration.method}. Valid methods: ${validMethods.join(', ')}`, 
          integrationPath)
      }
    })
  }

  /**
   * Validate cross-references between sections
   */
  private validateCrossReferences(config: HeraAppConfig | Partial<HeraAppConfig>) {
    // Collect all entity types and transaction types
    const entityTypes = new Set<string>()
    const transactionTypes = new Set<string>()
    const fieldNames = new Map<string, Set<string>>() // entity_type -> field_names

    if (config.entities) {
      config.entities.forEach(entity => {
        entityTypes.add(entity.entity_type)
        const fields = new Set<string>()
        entity.fields?.forEach(field => fields.add(field.field_name))
        fieldNames.set(entity.entity_type, fields)
      })
    }

    if (config.transactions) {
      config.transactions.forEach(transaction => {
        transactionTypes.add(transaction.transaction_type)
      })
    }

    // Validate screen references
    if (config.screens) {
      config.screens.forEach(screen => {
        if (screen.entity_type && !entityTypes.has(screen.entity_type)) {
          this.addError('SCREEN_ENTITY_TYPE_UNKNOWN', 
            `Screen references unknown entity_type: ${screen.entity_type}`, 
            `screens.${screen.screen_id}`)
        }

        if (screen.transaction_type && !transactionTypes.has(screen.transaction_type)) {
          this.addError('SCREEN_TRANSACTION_TYPE_UNKNOWN', 
            `Screen references unknown transaction_type: ${screen.transaction_type}`, 
            `screens.${screen.screen_id}`)
        }

        // Validate field references in tabs
        if (screen.tabs) {
          screen.tabs.forEach(tab => {
            if (tab.fields && screen.entity_type) {
              const validFields = fieldNames.get(screen.entity_type) || new Set()
              tab.fields.forEach(fieldName => {
                if (!validFields.has(fieldName)) {
                  this.addWarning('SCREEN_FIELD_UNKNOWN', 
                    `Tab references unknown field: ${fieldName}`, 
                    `screens.${screen.screen_id}.tabs.${tab.tab_id}`)
                }
              })
            }
          })
        }
      })
    }

    // Validate business rule references
    if (config.business_rules) {
      config.business_rules.forEach(rule => {
        if (rule.entity_type && !entityTypes.has(rule.entity_type)) {
          this.addError('RULE_ENTITY_TYPE_UNKNOWN', 
            `Business rule references unknown entity_type: ${rule.entity_type}`, 
            `business_rules.${rule.rule_id}`)
        }

        if (rule.transaction_type && !transactionTypes.has(rule.transaction_type)) {
          this.addError('RULE_TRANSACTION_TYPE_UNKNOWN', 
            `Business rule references unknown transaction_type: ${rule.transaction_type}`, 
            `business_rules.${rule.rule_id}`)
        }
      })
    }
  }

  /**
   * Validate state machine configuration
   */
  private validateStateMachine(stateMachine: any, transactionPath: string) {
    const stateMachinePath = `${transactionPath}.state_machine`

    if (!stateMachine.initial_state) {
      this.addError('STATE_MACHINE_INITIAL_STATE_MISSING', 
        'State machine must have initial_state', 
        stateMachinePath)
    }

    if (!Array.isArray(stateMachine.states)) {
      this.addError('STATE_MACHINE_STATES_NOT_ARRAY', 
        'State machine states must be an array', 
        stateMachinePath)
    }

    if (!Array.isArray(stateMachine.transitions)) {
      this.addError('STATE_MACHINE_TRANSITIONS_NOT_ARRAY', 
        'State machine transitions must be an array', 
        stateMachinePath)
    }

    // Validate states
    const stateNames = new Set<string>()
    if (stateMachine.states) {
      stateMachine.states.forEach((state: any, index: number) => {
        if (!state.name) {
          this.addError('STATE_NAME_MISSING', 
            `State must have name`, 
            `${stateMachinePath}.states[${index}]`)
        } else if (stateNames.has(state.name)) {
          this.addError('STATE_NAME_DUPLICATE', 
            `Duplicate state name: ${state.name}`, 
            `${stateMachinePath}.states[${index}]`)
        } else {
          stateNames.add(state.name)
        }
      })
    }

    // Validate initial state exists
    if (stateMachine.initial_state && !stateNames.has(stateMachine.initial_state)) {
      this.addError('STATE_MACHINE_INITIAL_STATE_UNKNOWN', 
        `Initial state not found in states: ${stateMachine.initial_state}`, 
        stateMachinePath)
    }

    // Validate transitions reference valid states
    if (stateMachine.transitions) {
      stateMachine.transitions.forEach((transition: any, index: number) => {
        if (!transition.from || !stateNames.has(transition.from)) {
          this.addError('TRANSITION_FROM_INVALID', 
            `Transition from invalid state: ${transition.from}`, 
            `${stateMachinePath}.transitions[${index}]`)
        }

        if (!transition.to || !stateNames.has(transition.to)) {
          this.addError('TRANSITION_TO_INVALID', 
            `Transition to invalid state: ${transition.to}`, 
            `${stateMachinePath}.transitions[${index}]`)
        }
      })
    }
  }

  /**
   * Validate entity relationships
   */
  private validateEntityRelationships(relationships: any[], entityPath: string) {
    relationships.forEach((relationship, index) => {
      const relPath = `${entityPath}.relationships[${index}]`

      this.validateRequiredField(relationship, 'relationship_type', relPath)
      this.validateRequiredField(relationship, 'to_entity_type', relPath)
      this.validateRequiredField(relationship, 'cardinality', relPath)
      this.validateRequiredField(relationship, 'is_required', relPath)

      const validCardinalities = ['one_to_one', 'one_to_many', 'many_to_many']
      if (relationship.cardinality && !validCardinalities.includes(relationship.cardinality)) {
        this.addError('RELATIONSHIP_CARDINALITY_INVALID', 
          `Invalid cardinality: ${relationship.cardinality}. Valid: ${validCardinalities.join(', ')}`, 
          relPath)
      }
    })
  }

  /**
   * Validate entity indexes
   */
  private validateEntityIndexes(indexes: any[], entityPath: string) {
    indexes.forEach((index, i) => {
      const indexPath = `${entityPath}.indexes[${i}]`

      this.validateRequiredField(index, 'name', indexPath)
      this.validateRequiredField(index, 'columns', indexPath)

      if (!Array.isArray(index.columns) || index.columns.length === 0) {
        this.addError('INDEX_COLUMNS_INVALID', 
          'Index columns must be a non-empty array', 
          indexPath)
      }
    })
  }

  /**
   * Helper to validate required fields
   */
  private validateRequiredField(obj: any, field: string, path: string) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      this.addError('REQUIRED_FIELD_MISSING', 
        `Required field missing: ${field}`, 
        `${path}.${field}`)
    }
  }

  /**
   * Helper to add error
   */
  private addError(errorCode: string, message: string, path?: string) {
    this.errors.push({
      error: message,
      path,
      ...(path && path.includes('entity') ? { entity_type: this.extractEntityType(path) } : {}),
      ...(path && path.includes('field') ? { field_name: this.extractFieldName(path) } : {}),
      ...(path && path.includes('screen') ? { screen_id: this.extractScreenId(path) } : {}),
      ...(path && path.includes('rule') ? { rule_id: this.extractRuleId(path) } : {})
    })
  }

  /**
   * Helper to add warning
   */
  private addWarning(warningCode: string, message: string, path?: string, suggestion?: string) {
    this.warnings.push({
      warning: message,
      path,
      suggestion
    })
  }

  /**
   * Extract entity type from path
   */
  private extractEntityType(path: string): string | undefined {
    const match = path.match(/entities\[(\d+)\]/)
    if (match) {
      const index = parseInt(match[1])
      // This would need access to the config being validated
      return `entity_${index}`
    }
    return undefined
  }

  /**
   * Extract field name from path
   */
  private extractFieldName(path: string): string | undefined {
    const match = path.match(/fields\[(\d+)\]/)
    if (match) {
      return `field_${match[1]}`
    }
    return undefined
  }

  /**
   * Extract screen ID from path
   */
  private extractScreenId(path: string): string | undefined {
    const match = path.match(/screens\.([^\.]+)/)
    if (match) {
      return match[1]
    }
    return undefined
  }

  /**
   * Extract rule ID from path
   */
  private extractRuleId(path: string): string | undefined {
    const match = path.match(/rules\.([^\.]+)/)
    if (match) {
      return match[1]
    }
    return undefined
  }
}

// =============================================================================
// Validation Utilities
// =============================================================================

export function validateAppConfig(config: HeraAppConfig | Partial<HeraAppConfig>): Promise<ConfigValidationResponse> {
  const engine = new ConfigValidationEngine()
  return engine.validate(config)
}

export function validateConfigQuick(config: HeraAppConfig | Partial<HeraAppConfig>): { isValid: boolean; errorCount: number; warningCount: number } {
  const engine = new ConfigValidationEngine()
  
  try {
    const result = engine.validate(config)
    return {
      isValid: result.then ? false : (result as ConfigValidationResponse).is_valid,
      errorCount: result.then ? 0 : (result as ConfigValidationResponse).errors.length,
      warningCount: result.then ? 0 : (result as ConfigValidationResponse).warnings.length
    }
  } catch (error) {
    return { isValid: false, errorCount: 1, warningCount: 0 }
  }
}

export function isValidAppConfig(config: HeraAppConfig | Partial<HeraAppConfig>): boolean {
  return validateConfigQuick(config).isValid
}