/**
 * HERA DNA Schema Manager
 * Manages the separation between System Schema and User Data
 * Smart Code: HERA.DNA.SCHEMA.MANAGER.v1
 */

import { createClient } from '@supabase/supabase-js'

// Types for System Schema (Read-Only from Supabase)
export interface DNAComponent {
  id: string
  component_name: string
  component_type: 'layout' | 'form' | 'table' | 'chart' | 'navigation' | 'specialized'
  category: 'universal' | 'industry_specific' | 'custom'
  component_code: string
  props_schema: Record<string, any>
  dependencies: string[]
  dna_pattern?: string
  reusability_score: number
  version: string
  status: 'active' | 'deprecated' | 'experimental'
  description?: string
  usage_examples?: Record<string, any>
}

export interface DNATemplate {
  id: string
  template_name: string
  template_type: 'industry' | 'business_type' | 'use_case'
  industry: string
  template_schema: Record<string, any>
  component_mapping: Record<string, any>
  demo_data_generator: string
  smart_codes: string[]
  business_rules?: Record<string, any>
  required_components: string[]
  optional_components: string[]
  version: string
  status: 'active' | 'deprecated' | 'beta'
}

export interface SmartCodeDefinition {
  id: string
  smart_code: string
  industry: string
  module_name: string
  function_name: string
  code_type: string
  version: string
  business_rules: Record<string, any>
  gl_posting_rules?: Record<string, any>
  validation_rules?: Record<string, any>
  automation_rules?: Record<string, any>
  applicable_entities: string[]
  applicable_transactions: string[]
  description: string
  examples?: Record<string, any>
}

export interface EntityTypeDefinition {
  id: string
  entity_type: string
  display_name: string
  category: 'universal' | 'industry_specific'
  base_fields: Record<string, any>
  optional_fields: Record<string, any>
  validation_schema: Record<string, any>
  form_layout?: Record<string, any>
  table_columns?: Record<string, any>
  default_smart_codes: string[]
  typical_relationships?: Record<string, any>
  hierarchy_support: boolean
}

export interface FieldTypeDefinition {
  id: string
  field_type: string
  display_name: string
  category: 'basic' | 'advanced' | 'industry_specific'
  data_type: string
  validation_schema?: Record<string, any>
  input_component: string
  display_component?: string
  default_props: Record<string, any>
  description?: string
  usage_examples?: Record<string, any>
}

// Types for User Configuration (Admin CRUD)
export interface OrganizationSystemConfig {
  id: string
  organization_id: string
  enabled_components: Record<string, any>
  component_configurations: Record<string, any>
  active_templates: string[]
  template_customizations: Record<string, any>
  enabled_entity_types: string[]
  entity_type_customizations: Record<string, any>
  enabled_field_types: string[]
  field_type_customizations: Record<string, any>
  enabled_business_rules: string[]
  business_rule_overrides: Record<string, any>
  feature_flags: Record<string, any>
  theme_configuration: Record<string, any>
  configured_by: string
  configuration_version: number
}

export interface UserEntityFieldSelection {
  id: string
  organization_id: string
  entity_type: string
  field_selection_name: string
  selection_type: 'form' | 'table' | 'search' | 'report'
  selected_fields: Record<string, any>
  field_order: number[]
  field_configurations: Record<string, any>
  display_rules: Record<string, any>
  required_fields: string[]
  hidden_fields: string[]
  readonly_fields: string[]
  user_roles: string[]
  is_default: boolean
  is_active: boolean
  created_by: string
}

export interface DynamicFormConfiguration {
  id: string
  organization_id: string
  form_name: string
  entity_type: string
  form_type: 'create' | 'edit' | 'view' | 'search' | 'report'
  form_schema: Record<string, any>
  field_layout: Record<string, any>
  section_definitions: Record<string, any>
  validation_rules: Record<string, any>
  business_logic: Record<string, any>
  conditional_logic: Record<string, any>
  calculated_fields: Record<string, any>
  default_values: Record<string, any>
  user_roles: string[]
  is_default: boolean
  is_active: boolean
  version: number
  created_by: string
}

export interface CompleteSystemSchema {
  components: Record<string, DNAComponent>
  templates: Record<string, DNATemplate>
  entity_types: Record<string, EntityTypeDefinition>
  field_types: Record<string, FieldTypeDefinition>
  business_rules: Record<string, any>
  smart_codes: Record<string, SmartCodeDefinition>
  field_selections: Record<string, UserEntityFieldSelection>
  form_configurations: Record<string, DynamicFormConfiguration>
}

export class SchemaManager {
  private supabase: any
  private systemSchemaCache: Map<string, any> = new Map()
  private organizationConfigCache: Map<string, any> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // =====================================================
  // SYSTEM SCHEMA ACCESS (Read-Only)
  // =====================================================

  /**
   * Get all available DNA components
   */
  async getDNAComponents(filters?: {
    type?: string
    category?: string
    status?: string
  }): Promise<DNAComponent[]> {
    const cacheKey = `dna_components_${JSON.stringify(filters)}`
    
    if (this.systemSchemaCache.has(cacheKey)) {
      const cached = this.systemSchemaCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    let query = this.supabase
      .from('dna_components')
      .select('*')
      .eq('status', 'active')

    if (filters?.type) query = query.eq('component_type', filters.type)
    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query.order('component_name')

    if (error) throw new Error(`Failed to fetch DNA components: ${error.message}`)

    this.systemSchemaCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  /**
   * Get available DNA templates
   */
  async getDNATemplates(industry?: string): Promise<DNATemplate[]> {
    const cacheKey = `dna_templates_${industry || 'all'}`
    
    if (this.systemSchemaCache.has(cacheKey)) {
      const cached = this.systemSchemaCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    let query = this.supabase
      .from('dna_templates')
      .select('*')
      .eq('status', 'active')

    if (industry) {
      query = query.eq('industry', industry)
    }

    const { data, error } = await query.order('template_name')

    if (error) throw new Error(`Failed to fetch DNA templates: ${error.message}`)

    this.systemSchemaCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  /**
   * Get smart code definitions
   */
  async getSmartCodeDefinitions(industry?: string): Promise<SmartCodeDefinition[]> {
    const cacheKey = `smart_codes_${industry || 'all'}`
    
    if (this.systemSchemaCache.has(cacheKey)) {
      const cached = this.systemSchemaCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    let query = this.supabase
      .from('smart_code_definitions')
      .select('*')
      .eq('status', 'active')

    if (industry) {
      query = query.eq('industry', industry)
    }

    const { data, error } = await query.order('smart_code')

    if (error) throw new Error(`Failed to fetch smart code definitions: ${error.message}`)

    this.systemSchemaCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  /**
   * Get entity type definitions
   */
  async getEntityTypeDefinitions(category?: string): Promise<EntityTypeDefinition[]> {
    const cacheKey = `entity_types_${category || 'all'}`
    
    if (this.systemSchemaCache.has(cacheKey)) {
      const cached = this.systemSchemaCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    let query = this.supabase
      .from('entity_type_definitions')
      .select('*')
      .eq('status', 'active')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('display_name')

    if (error) throw new Error(`Failed to fetch entity type definitions: ${error.message}`)

    this.systemSchemaCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  /**
   * Get field type definitions
   */
  async getFieldTypeDefinitions(category?: string): Promise<FieldTypeDefinition[]> {
    const cacheKey = `field_types_${category || 'all'}`
    
    if (this.systemSchemaCache.has(cacheKey)) {
      const cached = this.systemSchemaCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    let query = this.supabase
      .from('field_type_definitions')
      .select('*')
      .eq('status', 'active')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('display_name')

    if (error) throw new Error(`Failed to fetch field type definitions: ${error.message}`)

    this.systemSchemaCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  // =====================================================
  // ORGANIZATION CONFIGURATION (Admin CRUD)
  // =====================================================

  /**
   * Get organization system configuration
   */
  async getOrganizationConfig(organizationId: string): Promise<OrganizationSystemConfig | null> {
    const cacheKey = `org_config_${organizationId}`
    
    if (this.organizationConfigCache.has(cacheKey)) {
      const cached = this.organizationConfigCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    const { data, error } = await this.supabase
      .from('organization_system_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch organization config: ${error.message}`)
    }

    this.organizationConfigCache.set(cacheKey, {
      data: data || null,
      timestamp: Date.now()
    })

    return data || null
  }

  /**
   * Create or update organization system configuration
   */
  async upsertOrganizationConfig(
    organizationId: string,
    config: Partial<OrganizationSystemConfig>,
    userId: string
  ): Promise<OrganizationSystemConfig> {
    const existingConfig = await this.getOrganizationConfig(organizationId)

    const configData = {
      organization_id: organizationId,
      ...config,
      ...(existingConfig ? { updated_by: userId } : { configured_by: userId }),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('organization_system_config')
      .upsert(configData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert organization config: ${error.message}`)
    }

    // Clear cache
    this.organizationConfigCache.delete(`org_config_${organizationId}`)

    return data
  }

  /**
   * Get user entity field selections for an organization
   */
  async getUserEntityFieldSelections(
    organizationId: string,
    entityType?: string
  ): Promise<UserEntityFieldSelection[]> {
    let query = this.supabase
      .from('user_entity_field_selections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data, error } = await query.order('field_selection_name')

    if (error) throw new Error(`Failed to fetch field selections: ${error.message}`)

    return data
  }

  /**
   * Create or update entity field selection
   */
  async upsertEntityFieldSelection(
    selection: Partial<UserEntityFieldSelection>,
    userId: string
  ): Promise<UserEntityFieldSelection> {
    const selectionData = {
      ...selection,
      ...(selection.id ? { updated_by: userId } : { created_by: userId }),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('user_entity_field_selections')
      .upsert(selectionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert field selection: ${error.message}`)
    }

    return data
  }

  /**
   * Get dynamic form configurations
   */
  async getDynamicFormConfigurations(
    organizationId: string,
    entityType?: string,
    formType?: string
  ): Promise<DynamicFormConfiguration[]> {
    let query = this.supabase
      .from('dynamic_form_configurations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    if (formType) {
      query = query.eq('form_type', formType)
    }

    const { data, error } = await query.order('form_name')

    if (error) throw new Error(`Failed to fetch form configurations: ${error.message}`)

    return data
  }

  /**
   * Create or update dynamic form configuration
   */
  async upsertDynamicFormConfiguration(
    formConfig: Partial<DynamicFormConfiguration>,
    userId: string
  ): Promise<DynamicFormConfiguration> {
    const formData = {
      ...formConfig,
      ...(formConfig.id ? { updated_by: userId } : { created_by: userId }),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('dynamic_form_configurations')
      .upsert(formData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert form configuration: ${error.message}`)
    }

    return data
  }

  // =====================================================
  // COMPLETE SCHEMA ASSEMBLY
  // =====================================================

  /**
   * Get complete system schema for an organization
   */
  async getCompleteSystemSchema(organizationId: string): Promise<CompleteSystemSchema> {
    const cacheKey = `complete_schema_${organizationId}`
    
    if (this.organizationConfigCache.has(cacheKey)) {
      const cached = this.organizationConfigCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    // Use the stored function for optimal performance
    const { data, error } = await this.supabase
      .rpc('get_organization_system_schema', { org_id: organizationId })

    if (error) {
      throw new Error(`Failed to fetch complete system schema: ${error.message}`)
    }

    this.organizationConfigCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  /**
   * Get effective field configuration for an entity type
   */
  async getEffectiveFieldConfiguration(
    organizationId: string,
    entityType: string,
    selectionType: 'form' | 'table' | 'search' | 'report' = 'form'
  ): Promise<{
    entityDefinition: EntityTypeDefinition
    fieldSelection: UserEntityFieldSelection | null
    formConfiguration: DynamicFormConfiguration | null
    effectiveFields: Record<string, any>
  }> {
    // Get base entity definition
    const entityDefinitions = await this.getEntityTypeDefinitions()
    const entityDefinition = entityDefinitions.find(def => def.entity_type === entityType)

    if (!entityDefinition) {
      throw new Error(`Entity type definition not found: ${entityType}`)
    }

    // Get organization's field selection
    const fieldSelections = await this.getUserEntityFieldSelections(organizationId, entityType)
    const fieldSelection = fieldSelections.find(
      sel => sel.selection_type === selectionType && sel.is_default
    ) || fieldSelections[0] || null

    // Get form configuration
    const formConfigurations = await this.getDynamicFormConfigurations(
      organizationId,
      entityType,
      selectionType === 'form' ? 'create' : undefined
    )
    const formConfiguration = formConfigurations.find(
      config => config.is_default
    ) || formConfigurations[0] || null

    // Merge to get effective fields
    let effectiveFields = { ...entityDefinition.base_fields }

    if (fieldSelection) {
      // Apply field selection overrides
      Object.keys(fieldSelection.selected_fields).forEach(fieldName => {
        if (fieldSelection.selected_fields[fieldName]) {
          effectiveFields[fieldName] = {
            ...effectiveFields[fieldName],
            ...fieldSelection.field_configurations[fieldName]
          }
        }
      })

      // Remove hidden fields
      fieldSelection.hidden_fields.forEach(fieldName => {
        delete effectiveFields[fieldName]
      })

      // Mark required fields
      fieldSelection.required_fields.forEach(fieldName => {
        if (effectiveFields[fieldName]) {
          effectiveFields[fieldName].required = true
        }
      })

      // Mark readonly fields
      fieldSelection.readonly_fields.forEach(fieldName => {
        if (effectiveFields[fieldName]) {
          effectiveFields[fieldName].readonly = true
        }
      })
    }

    return {
      entityDefinition,
      fieldSelection,
      formConfiguration,
      effectiveFields
    }
  }

  /**
   * Validate organization configuration
   */
  async validateOrganizationConfiguration(organizationId: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const { data, error } = await this.supabase
      .rpc('validate_organization_config', { org_id: organizationId })

    if (error) {
      throw new Error(`Failed to validate organization config: ${error.message}`)
    }

    return data
  }

  // =====================================================
  // CACHE MANAGEMENT
  // =====================================================

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.systemSchemaCache.clear()
    this.organizationConfigCache.clear()
  }

  /**
   * Clear cache for specific organization
   */
  clearOrganizationCache(organizationId: string): void {
    const keysToDelete = Array.from(this.organizationConfigCache.keys())
      .filter(key => key.includes(organizationId))

    keysToDelete.forEach(key => {
      this.organizationConfigCache.delete(key)
    })
  }

  /**
   * Warm up cache with commonly used data
   */
  async warmUpCache(organizationId?: string): Promise<void> {
    // Load system schema data
    await Promise.all([
      this.getDNAComponents(),
      this.getDNATemplates(),
      this.getSmartCodeDefinitions(),
      this.getEntityTypeDefinitions(),
      this.getFieldTypeDefinitions()
    ])

    // Load organization-specific data if provided
    if (organizationId) {
      await Promise.all([
        this.getOrganizationConfig(organizationId),
        this.getUserEntityFieldSelections(organizationId),
        this.getDynamicFormConfigurations(organizationId)
      ])
    }
  }
}

// Export singleton instance
export const schemaManager = new SchemaManager(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Utility functions for common operations
export const SchemaUtils = {
  /**
   * Get component by name
   */
  async getComponent(componentName: string): Promise<DNAComponent | null> {
    const components = await schemaManager.getDNAComponents()
    return components.find(comp => comp.component_name === componentName) || null
  },

  /**
   * Get template by name and industry
   */
  async getTemplate(templateName: string, industry?: string): Promise<DNATemplate | null> {
    const templates = await schemaManager.getDNATemplates(industry)
    return templates.find(template => template.template_name === templateName) || null
  },

  /**
   * Check if organization has feature enabled
   */
  async hasFeatureEnabled(organizationId: string, featureName: string): Promise<boolean> {
    const config = await schemaManager.getOrganizationConfig(organizationId)
    return config?.feature_flags?.[featureName] === true
  },

  /**
   * Get smart code definition
   */
  async getSmartCodeDefinition(smartCode: string): Promise<SmartCodeDefinition | null> {
    const definitions = await schemaManager.getSmartCodeDefinitions()
    return definitions.find(def => def.smart_code === smartCode) || null
  }
}