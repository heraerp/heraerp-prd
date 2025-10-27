/**
 * YAML Configuration Parser for Master Data Forms
 * Smart Code: HERA.ENTERPRISE.MASTER_DATA.YAML_PARSER.v1
 * 
 * Parses YAML template files and generates TypeScript interfaces
 * for dynamic master data form generation.
 */

export interface MasterDataField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'textarea' | 'select' | 'multiselect'
  label: string
  required: boolean
  tab: string
  validation?: {
    pattern?: string
    message?: string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
  }
  options?: Array<{
    label: string
    value: string | number
  }>
  placeholder?: string
  helpText?: string
  defaultValue?: any
}

export interface MasterDataRelationship {
  name: string
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany'
  targetEntity: string
  label: string
  uiComponent: 'select' | 'multiSelect' | 'autocomplete'
  tab: string
  required?: boolean
  searchFields?: string[]
  displayField?: string
  valueField?: string
  filters?: Record<string, any>
}

export interface WorkflowStep {
  id: string
  description: string
  action: 'validate' | 'persist' | 'sendNotification' | 'createRelationship' | 'executeRule' | 'custom'
  next: string | null
  parameters?: Record<string, any>
  onError?: 'retry' | 'skip' | 'abort'
  timeout?: number
}

export interface MasterDataWorkflow {
  name: string
  description: string
  trigger: 'onCreate' | 'onUpdate' | 'onDelete' | 'manual'
  steps: WorkflowStep[]
  enabled?: boolean
}

export interface MasterDataTab {
  id: string
  title: string
  icon?: string
  description?: string
  order?: number
  visible?: boolean
  collapsed?: boolean
}

export interface ProgressIndicatorConfig {
  type: 'stepper' | 'progressBar' | 'wizard'
  labels: boolean
  icons: boolean
  consistent: boolean
  colourScheme: {
    completed: string
    active: string
    upcoming: string
    error?: string
  }
  autoUpdate: boolean
  showPercentage?: boolean
}

export interface ValidationBehaviour {
  invalidColour: string
  validColour: string
  showErrorMessages: boolean
  validateOnChange: boolean
  validateOnBlur: boolean
  showRequiredIndicator: boolean
}

export interface NavigationBehaviour {
  showNextButton: boolean
  showPreviousButton: boolean
  disableNextUntilValid: boolean
  saveOnNavigate: boolean
  allowSkipOptionalTabs: boolean
  confirmOnExit: boolean
}

export interface MasterDataTemplate {
  version: string
  template: string
  description: string
  entityName: string
  smartCode: string
  fields: MasterDataField[]
  relationships?: MasterDataRelationship[]
  workflow?: MasterDataWorkflow
  ui: {
    tabs: MasterDataTab[]
    progressIndicator: ProgressIndicatorConfig
  }
  behaviour: {
    validation: ValidationBehaviour
    navigation: NavigationBehaviour
  }
  metadata?: {
    author?: string
    created?: string
    lastModified?: string
    tags?: string[]
    category?: string
  }
}

export interface ParsedMasterDataForm {
  template: MasterDataTemplate
  fieldsByTab: Map<string, MasterDataField[]>
  relationshipsByTab: Map<string, MasterDataRelationship[]>
  requiredFields: Set<string>
  tabOrder: string[]
  validationRules: Map<string, any[]>
}

export class MasterDataYamlParser {
  /**
   * Parse YAML content into a structured MasterDataTemplate
   */
  static parseYamlContent(yamlContent: string): MasterDataTemplate {
    try {
      // In a real implementation, you would use a YAML parser like js-yaml
      // For now, we'll assume the content is already parsed JSON
      const parsed = typeof yamlContent === 'string' 
        ? JSON.parse(yamlContent) 
        : yamlContent

      return this.validateAndNormalizeTemplate(parsed)
    } catch (error) {
      console.error('Error parsing YAML content:', error)
      throw new Error(`Failed to parse YAML template: ${error}`)
    }
  }

  /**
   * Validate and normalize the template structure
   */
  private static validateAndNormalizeTemplate(data: any): MasterDataTemplate {
    // Validate required fields
    if (!data.entityName) {
      throw new Error('entityName is required in template')
    }

    if (!data.fields || !Array.isArray(data.fields) || data.fields.length === 0) {
      throw new Error('fields array is required and must not be empty')
    }

    if (!data.ui?.tabs || !Array.isArray(data.ui.tabs) || data.ui.tabs.length === 0) {
      throw new Error('ui.tabs array is required and must not be empty')
    }

    // Validate each field has required properties
    data.fields.forEach((field: any, index: number) => {
      if (!field?.name || !field?.type || !field?.label || !field?.tab) {
        throw new Error(`Field at index ${index} is missing required properties (name, type, label, tab)`)
      }
    })

    // Validate each tab has required properties
    data.ui.tabs.forEach((tab: any, index: number) => {
      if (!tab?.id || !tab?.title) {
        throw new Error(`Tab at index ${index} is missing required properties (id, title)`)
      }
    })

    // Normalize and set defaults
    const template: MasterDataTemplate = {
      version: data.version || '1.0',
      template: data.template || 'MasterDataForm',
      description: data.description || '',
      entityName: data.entityName,
      smartCode: data.smartCode || `HERA.ENTERPRISE.${data.entityName.toUpperCase()}.v1`,
      fields: this.normalizeFields(data.fields),
      relationships: data.relationships ? this.normalizeRelationships(data.relationships) : [],
      workflow: data.workflow ? this.normalizeWorkflow(data.workflow) : undefined,
      ui: {
        tabs: this.normalizeTabs(data.ui.tabs),
        progressIndicator: this.normalizeProgressIndicator(data.ui.progressIndicator)
      },
      behaviour: {
        validation: this.normalizeValidationBehaviour(data.behaviour?.validation),
        navigation: this.normalizeNavigationBehaviour(data.behaviour?.navigation)
      },
      metadata: data.metadata || {}
    }

    // Validate field-tab relationships
    this.validateFieldTabReferences(template)

    return template
  }

  /**
   * Normalize field definitions
   */
  private static normalizeFields(fields: any[]): MasterDataField[] {
    return fields.map((field, index) => {
      if (!field.name || !field.type || !field.label || !field.tab) {
        throw new Error(`Field at index ${index} is missing required properties (name, type, label, tab)`)
      }

      return {
        name: field.name,
        type: field.type,
        label: field.label,
        required: field.required === true,
        tab: field.tab,
        validation: field.validation || {},
        options: field.options || [],
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        defaultValue: field.defaultValue
      }
    })
  }

  /**
   * Normalize relationship definitions
   */
  private static normalizeRelationships(relationships: any[]): MasterDataRelationship[] {
    return relationships.map((rel, index) => {
      if (!rel.name || !rel.type || !rel.targetEntity || !rel.label || !rel.tab) {
        throw new Error(`Relationship at index ${index} is missing required properties`)
      }

      return {
        name: rel.name,
        type: rel.type,
        targetEntity: rel.targetEntity,
        label: rel.label,
        uiComponent: rel.uiComponent || 'select',
        tab: rel.tab,
        required: rel.required === true,
        searchFields: rel.searchFields || ['entity_name'],
        displayField: rel.displayField || 'entity_name',
        valueField: rel.valueField || 'entity_id',
        filters: rel.filters || {}
      }
    })
  }

  /**
   * Normalize workflow definition
   */
  private static normalizeWorkflow(workflow: any): MasterDataWorkflow {
    if (!workflow.name || !workflow.steps) {
      throw new Error('Workflow must have name and steps')
    }

    return {
      name: workflow.name,
      description: workflow.description || '',
      trigger: workflow.trigger || 'onCreate',
      steps: workflow.steps.map((step: any) => ({
        id: step.id,
        description: step.description || '',
        action: step.action,
        next: step.next || null,
        parameters: step.parameters || {},
        onError: step.onError || 'abort',
        timeout: step.timeout || 30000
      })),
      enabled: workflow.enabled !== false
    }
  }

  /**
   * Normalize tab definitions
   */
  private static normalizeTabs(tabs: any[]): MasterDataTab[] {
    return tabs.map((tab, index) => ({
      id: tab.id,
      title: tab.title,
      icon: tab.icon || undefined,
      description: tab.description || '',
      order: tab.order || index,
      visible: tab.visible !== false,
      collapsed: tab.collapsed === true
    })).sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  /**
   * Normalize progress indicator configuration
   */
  private static normalizeProgressIndicator(config: any): ProgressIndicatorConfig {
    return {
      type: config?.type || 'stepper',
      labels: config?.labels !== false,
      icons: config?.icons !== false,
      consistent: config?.consistent !== false,
      colourScheme: {
        completed: config?.colourScheme?.completed || '#00b388',
        active: config?.colourScheme?.active || '#0073e6',
        upcoming: config?.colourScheme?.upcoming || '#bdbdbd',
        error: config?.colourScheme?.error || '#e74c3c'
      },
      autoUpdate: config?.autoUpdate !== false,
      showPercentage: config?.showPercentage === true
    }
  }

  /**
   * Normalize validation behaviour
   */
  private static normalizeValidationBehaviour(config: any): ValidationBehaviour {
    return {
      invalidColour: config?.invalidColour || '#e74c3c',
      validColour: config?.validColour || '#00b388',
      showErrorMessages: config?.showErrorMessages !== false,
      validateOnChange: config?.validateOnChange !== false,
      validateOnBlur: config?.validateOnBlur !== false,
      showRequiredIndicator: config?.showRequiredIndicator !== false
    }
  }

  /**
   * Normalize navigation behaviour
   */
  private static normalizeNavigationBehaviour(config: any): NavigationBehaviour {
    return {
      showNextButton: config?.showNextButton !== false,
      showPreviousButton: config?.showPreviousButton !== false,
      disableNextUntilValid: config?.disableNextUntilValid !== false,
      saveOnNavigate: config?.saveOnNavigate !== false,
      allowSkipOptionalTabs: config?.allowSkipOptionalTabs === true,
      confirmOnExit: config?.confirmOnExit !== false
    }
  }

  /**
   * Validate that all field tabs exist in the tabs definition
   */
  private static validateFieldTabReferences(template: MasterDataTemplate): void {
    const tabIds = new Set(template.ui.tabs.map(tab => tab.id))
    
    // Check fields
    for (const field of template.fields) {
      if (!tabIds.has(field.tab)) {
        throw new Error(`Field '${field.name}' references non-existent tab '${field.tab}'`)
      }
    }

    // Check relationships
    if (template.relationships) {
      for (const rel of template.relationships) {
        if (!tabIds.has(rel.tab)) {
          throw new Error(`Relationship '${rel.name}' references non-existent tab '${rel.tab}'`)
        }
      }
    }
  }

  /**
   * Generate a structured form configuration for easy consumption by components
   */
  static generateFormConfig(template: MasterDataTemplate): ParsedMasterDataForm {
    const fieldsByTab = new Map<string, MasterDataField[]>()
    const relationshipsByTab = new Map<string, MasterDataRelationship[]>()
    const requiredFields = new Set<string>()
    const validationRules = new Map<string, any[]>()

    // Group fields by tab
    for (const field of template.fields) {
      if (!fieldsByTab.has(field.tab)) {
        fieldsByTab.set(field.tab, [])
      }
      fieldsByTab.get(field.tab)!.push(field)

      if (field.required) {
        requiredFields.add(field.name)
      }

      if (field.validation && Object.keys(field.validation).length > 0) {
        validationRules.set(field.name, [field.validation])
      }
    }

    // Group relationships by tab
    if (template.relationships) {
      for (const rel of template.relationships) {
        if (!relationshipsByTab.has(rel.tab)) {
          relationshipsByTab.set(rel.tab, [])
        }
        relationshipsByTab.get(rel.tab)!.push(rel)

        if (rel.required) {
          requiredFields.add(rel.name)
        }
      }
    }

    // Generate tab order
    const tabOrder = (template.ui?.tabs || [])
      .filter(tab => tab.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(tab => tab.id)

    return {
      template,
      fieldsByTab,
      relationshipsByTab,
      requiredFields,
      tabOrder,
      validationRules
    }
  }

  /**
   * Generate smart codes for fields based on entity and field names
   */
  static generateFieldSmartCode(entityName: string, fieldName: string, version: string = 'v1'): string {
    const entity = entityName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    const field = fieldName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    return `HERA.ENTERPRISE.${entity}.FIELD.${field}.${version}`
  }

  /**
   * Generate smart codes for relationships
   */
  static generateRelationshipSmartCode(
    entityName: string, 
    relationshipName: string, 
    version: string = 'v1'
  ): string {
    const entity = entityName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    const rel = relationshipName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    return `HERA.ENTERPRISE.${entity}.REL.${rel}.${version}`
  }

  /**
   * Validate field values against their validation rules
   */
  static validateFieldValue(field: MasterDataField, value: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required field validation
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`${field.label} is required`)
    }

    // Skip other validations if value is empty and not required
    if (!field.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, errors: [] }
    }

    // Type-specific validations
    if (field.validation) {
      const val = field.validation

      // Pattern validation (regex)
      if (val.pattern && typeof value === 'string') {
        const regex = new RegExp(val.pattern)
        if (!regex.test(value)) {
          errors.push(val.message || `${field.label} format is invalid`)
        }
      }

      // Length validations
      if (typeof value === 'string') {
        if (val.minLength && value.length < val.minLength) {
          errors.push(`${field.label} must be at least ${val.minLength} characters`)
        }
        if (val.maxLength && value.length > val.maxLength) {
          errors.push(`${field.label} must not exceed ${val.maxLength} characters`)
        }
      }

      // Numeric validations
      if (typeof value === 'number') {
        if (val.min !== undefined && value < val.min) {
          errors.push(`${field.label} must be at least ${val.min}`)
        }
        if (val.max !== undefined && value > val.max) {
          errors.push(`${field.label} must not exceed ${val.max}`)
        }
      }
    }

    // Email validation
    if (field.type === 'email' && typeof value === 'string') {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(value)) {
        errors.push(`${field.label} must be a valid email address`)
      }
    }

    // Phone validation (basic)
    if (field.type === 'phone' && typeof value === 'string') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        errors.push(`${field.label} must be a valid phone number`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}