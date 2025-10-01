/**
 * HERA Self-Governing Standards Integration
 * Connects the self-governing standards (6 tables) with the admin interface
 * Smart Code: HERA.GOVERNANCE.INTEGRATION.MANAGER.V1
 */

import { universalApi } from '@/lib/universal-api'
import type {
  DNAComponent,
  DNATemplate,
  EntityTypeDefinition,
  FieldTypeDefinition,
  SmartCodeDefinition,
  OrganizationSystemConfig
} from '@/lib/schema/schema-manager'

// Map universal table data to schema manager types
export class SelfGoverningIntegration {
  private static SYSTEM_ORG_ID = 'hera_system_standards'
  private static QUALITY_ORG_ID = 'hera_quality_assurance'

  /**
   * Get DNA components from self-governing standards
   */
  static async getDNAComponentsFromStandards(filters?: {
    type?: string
    category?: string
    status?: string
  }): Promise<DNAComponent[]> {
    // Get standard entity types that represent DNA components
    const componentEntities = await universalApi.getEntities({
      organization_id: this.SYSTEM_ORG_ID,
      entity_type: 'dna_component_standard',
      status: 'active'
    })

    const components: DNAComponent[] = []

    for (const entity of componentEntities) {
      // Get dynamic data for this component
      const dynamicData = await universalApi.getDynamicData({
        entity_id: entity.id,
        organization_id: this.SYSTEM_ORG_ID
      })

      // Transform to DNAComponent format
      const component: DNAComponent = {
        id: entity.id,
        component_name: entity.entity_name,
        component_type:
          this.extractMetadataValue(entity.metadata, 'component_type') || 'specialized',
        category: this.extractMetadataValue(entity.metadata, 'category') || 'universal',
        component_code: this.getDynamicValue(dynamicData, 'component_code', ''),
        props_schema: this.getDynamicValue(dynamicData, 'props_schema', {}),
        dependencies: this.getDynamicValue(dynamicData, 'dependencies', []),
        dna_pattern: this.getDynamicValue(dynamicData, 'dna_pattern'),
        reusability_score: this.getDynamicValue(dynamicData, 'reusability_score', 1.0),
        version: this.getDynamicValue(dynamicData, 'version', '1.0.0'),
        status: entity.status as 'active' | 'deprecated' | 'experimental',
        description: entity.entity_description,
        usage_examples: this.getDynamicValue(dynamicData, 'usage_examples', {})
      }

      // Apply filters
      if (filters?.type && component.component_type !== filters.type) continue
      if (filters?.category && component.category !== filters.category) continue
      if (filters?.status && component.status !== filters.status) continue

      components.push(component)
    }

    return components
  }

  /**
   * Get DNA templates from self-governing standards
   */
  static async getDNATemplatesFromStandards(industry?: string): Promise<DNATemplate[]> {
    const templateEntities = await universalApi.getEntities({
      organization_id: this.SYSTEM_ORG_ID,
      entity_type: 'dna_template_standard',
      status: 'active'
    })

    const templates: DNATemplate[] = []

    for (const entity of templateEntities) {
      const dynamicData = await universalApi.getDynamicData({
        entity_id: entity.id,
        organization_id: this.SYSTEM_ORG_ID
      })

      const template: DNATemplate = {
        id: entity.id,
        template_name: entity.entity_name,
        template_type: this.extractMetadataValue(entity.metadata, 'template_type') || 'industry',
        industry: this.extractMetadataValue(entity.metadata, 'industry') || 'universal',
        template_schema: this.getDynamicValue(dynamicData, 'template_schema', {}),
        component_mapping: this.getDynamicValue(dynamicData, 'component_mapping', {}),
        demo_data_generator: this.getDynamicValue(dynamicData, 'demo_data_generator', ''),
        smart_codes: this.extractMetadataValue(entity.metadata, 'smart_codes') || [],
        business_rules: this.getDynamicValue(dynamicData, 'business_rules', {}),
        required_components:
          this.extractMetadataValue(entity.metadata, 'required_components') || [],
        optional_components:
          this.extractMetadataValue(entity.metadata, 'optional_components') || [],
        version: this.getDynamicValue(dynamicData, 'version', '1.0.0'),
        status: entity.status as 'active' | 'deprecated' | 'beta'
      }

      // Apply industry filter
      if (industry && template.industry !== industry) continue

      templates.push(template)
    }

    return templates
  }

  /**
   * Get entity type definitions from self-governing standards
   */
  static async getEntityTypeDefinitionsFromStandards(
    category?: string
  ): Promise<EntityTypeDefinition[]> {
    const entityStandards = await universalApi.getEntities({
      organization_id: this.SYSTEM_ORG_ID,
      entity_type: 'standard_entity_type',
      status: 'active'
    })

    const definitions: EntityTypeDefinition[] = []

    for (const entity of entityStandards) {
      const dynamicData = await universalApi.getDynamicData({
        entity_id: entity.id,
        organization_id: this.SYSTEM_ORG_ID
      })

      const definition: EntityTypeDefinition = {
        id: entity.id,
        entity_type: entity.entity_code.toLowerCase().replace('std-', ''),
        display_name: entity.entity_name,
        category: this.extractMetadataValue(entity.metadata, 'category') || 'universal',
        base_fields: this.extractMetadataValue(entity.metadata, 'standard_fields') || {},
        optional_fields: this.extractMetadataValue(entity.metadata, 'optional_fields') || {},
        validation_schema: this.extractMetadataValue(entity.metadata, 'compliance_rules') || {},
        form_layout: this.getDynamicValue(dynamicData, 'form_layout', {}),
        table_columns: this.getDynamicValue(dynamicData, 'table_columns', {}),
        default_smart_codes: this.extractMetadataValue(entity.metadata, 'smart_codes') || [],
        typical_relationships: this.getDynamicValue(dynamicData, 'typical_relationships', {}),
        hierarchy_support: this.getDynamicValue(dynamicData, 'hierarchy_support', false)
      }

      // Apply category filter
      if (category && definition.category !== category) continue

      definitions.push(definition)
    }

    return definitions
  }

  /**
   * Get field type definitions from self-governing standards
   */
  static async getFieldTypeDefinitionsFromStandards(
    category?: string
  ): Promise<FieldTypeDefinition[]> {
    // Get field registry entity
    const fieldRegistry = await universalApi.getEntities({
      organization_id: this.SYSTEM_ORG_ID,
      entity_type: 'field_registry',
      entity_code: 'STD-FIELD-REGISTRY'
    })

    if (!fieldRegistry.length) return []

    // Get all field definitions from dynamic data
    const fieldData = await universalApi.getDynamicData({
      entity_id: fieldRegistry[0].id,
      organization_id: this.SYSTEM_ORG_ID
    })

    const definitions: FieldTypeDefinition[] = []

    for (const field of fieldData) {
      const fieldDefinition = field.field_value_json || {}

      const definition: FieldTypeDefinition = {
        id: field.id,
        field_type: field.field_name,
        display_name: fieldDefinition.display_name || field.field_name,
        category: field.field_category || 'basic',
        data_type: field.field_type,
        validation_schema: fieldDefinition.validation || {},
        input_component: fieldDefinition.input_component || 'Input',
        display_component: fieldDefinition.display_component,
        default_props: fieldDefinition.default_props || {},
        description: fieldDefinition.description
      }

      // Apply category filter
      if (category && definition.category !== category) continue

      definitions.push(definition)
    }

    return definitions
  }

  /**
   * Get smart code definitions from self-governing standards
   */
  static async getSmartCodeDefinitionsFromStandards(
    industry?: string
  ): Promise<SmartCodeDefinition[]> {
    // Get smart code registry entity
    const smartCodeRegistry = await universalApi.getEntities({
      organization_id: this.SYSTEM_ORG_ID,
      entity_type: 'smart_code_registry',
      entity_code: 'SMART-CODE-REGISTRY'
    })

    if (!smartCodeRegistry.length) return []

    // Get all smart code definitions from dynamic data
    const codeData = await universalApi.getDynamicData({
      entity_id: smartCodeRegistry[0].id,
      organization_id: this.SYSTEM_ORG_ID
    })

    const definitions: SmartCodeDefinition[] = []

    for (const code of codeData) {
      const codeDefinition = code.field_value_json || {}

      // Parse smart code components
      const smartCodeParts = code.field_name.split('.')

      const definition: SmartCodeDefinition = {
        id: code.id,
        smart_code: code.field_name,
        industry: code.field_category || 'universal',
        module_name: smartCodeParts[2] || '',
        function_name: smartCodeParts[3] || '',
        code_type: smartCodeParts[4] || '',
        version: smartCodeParts[5] || 'v1',
        business_rules: codeDefinition.business_rules || {},
        gl_posting_rules: codeDefinition.gl_posting_rules,
        validation_rules: codeDefinition.validation_rules,
        automation_rules: codeDefinition.automation_rules,
        applicable_entities: codeDefinition.applicable_entities || [],
        applicable_transactions: codeDefinition.applicable_transactions || [],
        description: codeDefinition.description || '',
        examples: codeDefinition.examples
      }

      // Apply industry filter
      if (industry && definition.industry !== industry && definition.industry !== 'universal')
        continue

      definitions.push(definition)
    }

    return definitions
  }

  /**
   * Create or update organization configuration using universal tables
   */
  static async upsertOrganizationConfigInStandards(
    organizationId: string,
    config: Partial<OrganizationSystemConfig>,
    userId: string
  ): Promise<OrganizationSystemConfig> {
    // Check if configuration entity exists
    const existingConfig = await universalApi.getEntities({
      organization_id: organizationId,
      entity_type: 'organization_system_config',
      entity_code: `SYSCONFIG-${organizationId}`
    })

    let configEntity
    if (existingConfig.length > 0) {
      // Update existing configuration
      configEntity = await universalApi.updateEntity(existingConfig[0].id, {
        metadata: {
          ...existingConfig[0].metadata,
          ...config,
          updated_by: userId,
          updated_at: new Date().toISOString()
        }
      })
    } else {
      // Create new configuration
      configEntity = await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'organization_system_config',
        entity_name: `System Configuration`,
        entity_code: `SYSCONFIG-${organizationId}`,
        smart_code: 'HERA.SYS.CONFIG.ORG.SETTINGS.V1',
        metadata: {
          ...config,
          configured_by: userId,
          configuration_version: 1,
          created_at: new Date().toISOString()
        },
        status: 'active'
      })
    }

    // Store individual configuration values as dynamic data
    if (config.enabled_components) {
      await universalApi.setDynamicField(
        configEntity.id,
        'enabled_components',
        JSON.stringify(config.enabled_components),
        'json'
      )
    }

    if (config.enabled_entity_types) {
      await universalApi.setDynamicField(
        configEntity.id,
        'enabled_entity_types',
        JSON.stringify(config.enabled_entity_types),
        'json'
      )
    }

    if (config.feature_flags) {
      await universalApi.setDynamicField(
        configEntity.id,
        'feature_flags',
        JSON.stringify(config.feature_flags),
        'json'
      )
    }

    // Transform back to OrganizationSystemConfig format
    const dynamicData = await universalApi.getDynamicData({
      entity_id: configEntity.id,
      organization_id: organizationId
    })

    return {
      id: configEntity.id,
      organization_id: organizationId,
      enabled_components: this.getDynamicValue(dynamicData, 'enabled_components', {}),
      component_configurations: this.getDynamicValue(dynamicData, 'component_configurations', {}),
      active_templates: this.getDynamicValue(dynamicData, 'active_templates', []),
      template_customizations: this.getDynamicValue(dynamicData, 'template_customizations', {}),
      enabled_entity_types: this.getDynamicValue(dynamicData, 'enabled_entity_types', []),
      entity_type_customizations: this.getDynamicValue(
        dynamicData,
        'entity_type_customizations',
        {}
      ),
      enabled_field_types: this.getDynamicValue(dynamicData, 'enabled_field_types', []),
      field_type_customizations: this.getDynamicValue(dynamicData, 'field_type_customizations', {}),
      enabled_business_rules: this.getDynamicValue(dynamicData, 'enabled_business_rules', []),
      business_rule_overrides: this.getDynamicValue(dynamicData, 'business_rule_overrides', {}),
      feature_flags: this.getDynamicValue(dynamicData, 'feature_flags', {}),
      theme_configuration: this.getDynamicValue(dynamicData, 'theme_configuration', {}),
      configured_by: (configEntity.metadata as any)?.configured_by || userId,
      configuration_version: (configEntity.metadata as any)?.configuration_version || 1
    }
  }

  /**
   * Get organization configuration from universal tables
   */
  static async getOrganizationConfigFromStandards(
    organizationId: string
  ): Promise<OrganizationSystemConfig | null> {
    const configEntities = await universalApi.getEntities({
      organization_id: organizationId,
      entity_type: 'organization_system_config',
      entity_code: `SYSCONFIG-${organizationId}`
    })

    if (!configEntities.length) return null

    const configEntity = configEntities[0]
    const dynamicData = await universalApi.getDynamicData({
      entity_id: configEntity.id,
      organization_id: organizationId
    })

    return {
      id: configEntity.id,
      organization_id: organizationId,
      enabled_components: this.getDynamicValue(dynamicData, 'enabled_components', {}),
      component_configurations: this.getDynamicValue(dynamicData, 'component_configurations', {}),
      active_templates: this.getDynamicValue(dynamicData, 'active_templates', []),
      template_customizations: this.getDynamicValue(dynamicData, 'template_customizations', {}),
      enabled_entity_types: this.getDynamicValue(dynamicData, 'enabled_entity_types', []),
      entity_type_customizations: this.getDynamicValue(
        dynamicData,
        'entity_type_customizations',
        {}
      ),
      enabled_field_types: this.getDynamicValue(dynamicData, 'enabled_field_types', []),
      field_type_customizations: this.getDynamicValue(dynamicData, 'field_type_customizations', {}),
      enabled_business_rules: this.getDynamicValue(dynamicData, 'enabled_business_rules', []),
      business_rule_overrides: this.getDynamicValue(dynamicData, 'business_rule_overrides', {}),
      feature_flags: this.getDynamicValue(dynamicData, 'feature_flags', {}),
      theme_configuration: this.getDynamicValue(dynamicData, 'theme_configuration', {}),
      configured_by: (configEntity.metadata as any)?.configured_by || '',
      configuration_version: (configEntity.metadata as any)?.configuration_version || 1
    }
  }

  /**
   * Get data quality metrics from quality assurance organization
   */
  static async getDataQualityMetrics(organizationId?: string): Promise<{
    compliance_score: number
    duplicate_count: number
    non_standard_fields: number
    standards_violations: any[]
    quality_trends: any[]
  }> {
    // Get quality reports from QA organization
    const qualityReports = await universalApi.getEntities({
      organization_id: this.QUALITY_ORG_ID,
      entity_type: 'quality_report',
      status: 'active'
    })

    // Get violation tracking
    const violations = await universalApi.getEntities({
      organization_id: this.QUALITY_ORG_ID,
      entity_type: 'violation_tracker',
      status: 'active'
    })

    // Calculate metrics (placeholder implementation)
    return {
      compliance_score: 0.95,
      duplicate_count: 3,
      non_standard_fields: 7,
      standards_violations: violations.slice(0, 10),
      quality_trends: []
    }
  }

  // Helper methods
  private static extractMetadataValue(metadata: any, key: string): any {
    return metadata && typeof metadata === 'object' ? metadata[key] : undefined
  }

  private static getDynamicValue(dynamicData: any[], fieldName: string, defaultValue?: any): any {
    const field = dynamicData.find(d => d.field_name === fieldName)
    if (!field) return defaultValue

    if (field.field_value_json) {
      return field.field_value_json
    }
    if (field.field_value_text && defaultValue !== undefined) {
      try {
        return JSON.parse(field.field_value_text)
      } catch {
        return field.field_value_text
      }
    }
    if (field.field_value_number !== null) {
      return field.field_value_number
    }
    if (field.field_value_boolean !== null) {
      return field.field_value_boolean
    }

    return defaultValue
  }
}

/**
 * Enhanced Schema Manager that uses self-governing standards
 */
export class EnhancedSchemaManager {
  /**
   * Get DNA components with fallback to self-governing standards
   */
  static async getDNAComponents(filters?: {
    type?: string
    category?: string
    status?: string
  }): Promise<DNAComponent[]> {
    try {
      // Try to get from traditional schema manager first
      const { schemaManager } = await import('@/lib/schema/schema-manager')
      return await schemaManager.getDNAComponents(filters)
    } catch (error) {
      // Fallback to self-governing standards
      console.log('Falling back to self-governing standards for DNA components')
      return await SelfGoverningIntegration.getDNAComponentsFromStandards(filters)
    }
  }

  /**
   * Get DNA templates with fallback to self-governing standards
   */
  static async getDNATemplates(industry?: string): Promise<DNATemplate[]> {
    try {
      const { schemaManager } = await import('@/lib/schema/schema-manager')
      return await schemaManager.getDNATemplates(industry)
    } catch (error) {
      console.log('Falling back to self-governing standards for DNA templates')
      return await SelfGoverningIntegration.getDNATemplatesFromStandards(industry)
    }
  }

  /**
   * Get organization configuration with self-governing integration
   */
  static async getOrganizationConfig(
    organizationId: string
  ): Promise<OrganizationSystemConfig | null> {
    try {
      const { schemaManager } = await import('@/lib/schema/schema-manager')
      const config = await schemaManager.getOrganizationConfig(organizationId)

      // If no config found in traditional tables, check self-governing standards
      if (!config) {
        return await SelfGoverningIntegration.getOrganizationConfigFromStandards(organizationId)
      }

      return config
    } catch (error) {
      console.log('Using self-governing standards for organization config')
      return await SelfGoverningIntegration.getOrganizationConfigFromStandards(organizationId)
    }
  }

  /**
   * Update organization configuration with self-governing integration
   */
  static async upsertOrganizationConfig(
    organizationId: string,
    config: Partial<OrganizationSystemConfig>,
    userId: string
  ): Promise<OrganizationSystemConfig> {
    try {
      const { schemaManager } = await import('@/lib/schema/schema-manager')
      return await schemaManager.upsertOrganizationConfig(organizationId, config, userId)
    } catch (error) {
      console.log('Using self-governing standards for organization config update')
      return await SelfGoverningIntegration.upsertOrganizationConfigInStandards(
        organizationId,
        config,
        userId
      )
    }
  }
}
