/**
 * Universal Entity Registry
 * Smart Code: HERA.MICRO_APPS.UNIVERSAL.ENTITY_REGISTRY.v1
 * 
 * Discovers and manages entity types from installed micro-apps
 * Provides workspace-aware entity type discovery for universal creation
 */

import { microAppClient, type MicroAppEntity, type MicroAppInstallation } from './micro-app-client'

export interface WorkspaceEntityContext {
  domain: string
  section: string
  workspace: string
  organization_id: string
  available_apps?: string[]
  default_entity_type?: string
  ui_customizations?: Record<string, any>
}

export interface EntityCreationConfig {
  entityType: string
  entityLabel: string
  smartCodePattern: string
  sections: FormSection[]
  fields: FormField[]
  workspaceContext: WorkspaceEntityContext
  microAppConfig: {
    app_code: string
    app_name: string
    entity_definition: MicroAppEntity
  }
}

export interface FormSection {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  required: boolean
  description: string
}

export interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'number' | 'url' | 'date' | 'boolean'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string; description?: string }>
  validation?: (value: string) => string | null
  section: string
}

/**
 * Universal Entity Registry for micro-app entity discovery
 */
export class UniversalEntityRegistry {
  
  /**
   * Get all available entity types for a workspace context
   */
  static async getAvailableEntityTypes(
    workspaceContext: WorkspaceEntityContext
  ): Promise<{
    entityTypes: MicroAppEntity[]
    appMappings: Record<string, string> // entity_type -> app_code
  }> {
    try {
      console.log('🔍 Discovering entity types for workspace:', workspaceContext)

      // 1. Get all installed micro-apps for organization
      const installedAppsResponse = await microAppClient.listInstalledApps(
        workspaceContext.organization_id,
        { status: 'installed' }
      )

      if (!installedAppsResponse.success || !installedAppsResponse.installations) {
        console.log('⚠️ No installed micro-apps found, using default entities')
        return this.getDefaultEntityTypes(workspaceContext)
      }

      const installedApps = installedAppsResponse.installations

      // 2. Extract entity definitions from each app
      const entityTypes: MicroAppEntity[] = []
      const appMappings: Record<string, string> = {}

      for (const app of installedApps) {
        try {
          // Get app definition from catalog
          const appDefinition = await microAppClient.getAppDefinition(app.app_code)
          
          if (appDefinition?.entities) {
            for (const entity of appDefinition.entities) {
              // Check if entity is compatible with workspace
              if (this.isEntityCompatibleWithWorkspace(entity, workspaceContext)) {
                entityTypes.push(entity)
                appMappings[entity.entity_type] = app.app_code
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load entities from app ${app.app_code}:`, error)
        }
      }

      // 3. If no entities found, provide defaults
      if (entityTypes.length === 0) {
        console.log('📋 No micro-app entities found, using workspace defaults')
        return this.getDefaultEntityTypes(workspaceContext)
      }

      console.log(`✅ Found ${entityTypes.length} entity types from ${installedApps.length} apps`)
      return { entityTypes, appMappings }

    } catch (error) {
      console.error('❌ Error discovering entity types:', error)
      return this.getDefaultEntityTypes(workspaceContext)
    }
  }

  /**
   * Get entity creation configuration for a specific entity type
   */
  static async getEntityCreationConfig(
    entityType: string,
    appCode: string,
    workspaceContext: WorkspaceEntityContext
  ): Promise<EntityCreationConfig | null> {
    try {
      console.log(`🔧 Getting creation config for ${entityType} from app ${appCode}`)

      // Get app definition and find the entity
      const appDefinition = await microAppClient.getAppDefinition(appCode)
      const entityDefinition = appDefinition?.entities?.find(e => e.entity_type === entityType)

      if (!entityDefinition) {
        console.error(`❌ Entity type ${entityType} not found in app ${appCode}`)
        return null
      }

      // Convert MicroAppEntity to EntityCreationConfig
      const config = this.convertMicroAppEntityToConfig(
        entityDefinition,
        appCode,
        appDefinition.display_name || appCode,
        workspaceContext
      )

      console.log('✅ Generated entity creation config:', config.entityLabel)
      return config

    } catch (error) {
      console.error(`❌ Error getting entity creation config:`, error)
      return null
    }
  }

  /**
   * Get default entity types when no micro-apps are available
   */
  private static getDefaultEntityTypes(
    workspaceContext: WorkspaceEntityContext
  ): { entityTypes: MicroAppEntity[], appMappings: Record<string, string> } {
    const { domain, section } = workspaceContext

    // Generate workspace-appropriate default entity types
    const entityTypes: MicroAppEntity[] = []

    if (domain === 'analytics') {
      entityTypes.push({
        entity_type: 'analytics_report',
        display_name: 'Analytics Report',
        display_name_plural: 'Analytics Reports',
        fields: [
          { field_name: 'report_name', display_label: 'Report Name', field_type: 'text', is_required: true, field_order: 1 },
          { field_name: 'description', display_label: 'Description', field_type: 'text', is_required: false, field_order: 2 },
          { field_name: 'data_source', display_label: 'Data Source', field_type: 'select', is_required: true, field_order: 3 },
          { field_name: 'report_type', display_label: 'Report Type', field_type: 'select', is_required: true, field_order: 4 }
        ]
      })

      if (section === 'ops') {
        entityTypes.push({
          entity_type: 'operational_metric',
          display_name: 'Operational Metric',
          display_name_plural: 'Operational Metrics',
          fields: [
            { field_name: 'metric_name', display_label: 'Metric Name', field_type: 'text', is_required: true, field_order: 1 },
            { field_name: 'metric_value', display_label: 'Value', field_type: 'number', is_required: true, field_order: 2 },
            { field_name: 'measurement_unit', display_label: 'Unit', field_type: 'text', is_required: false, field_order: 3 }
          ]
        })
      }
    }

    // Default retail entities
    if (domain === 'retail') {
      entityTypes.push({
        entity_type: 'product',
        display_name: 'Product',
        display_name_plural: 'Products',
        fields: [
          { field_name: 'product_name', display_label: 'Product Name', field_type: 'text', is_required: true, field_order: 1 },
          { field_name: 'description', display_label: 'Description', field_type: 'text', is_required: false, field_order: 2 },
          { field_name: 'price', display_label: 'Price', field_type: 'number', is_required: true, field_order: 3 },
          { field_name: 'category', display_label: 'Category', field_type: 'select', is_required: true, field_order: 4 }
        ]
      })
    }

    // Always include customer as a universal entity
    entityTypes.push({
      entity_type: 'customer',
      display_name: 'Customer',
      display_name_plural: 'Customers',
      fields: [
        { field_name: 'customer_name', display_label: 'Customer Name', field_type: 'text', is_required: true, field_order: 1 },
        { field_name: 'email', display_label: 'Email', field_type: 'text', is_required: true, field_order: 2 },
        { field_name: 'phone', display_label: 'Phone', field_type: 'text', is_required: false, field_order: 3 }
      ]
    })

    const appMappings: Record<string, string> = {}
    entityTypes.forEach(entity => {
      appMappings[entity.entity_type] = 'HERA_DEFAULT'
    })

    return { entityTypes, appMappings }
  }

  /**
   * Check if entity is compatible with workspace
   */
  private static isEntityCompatibleWithWorkspace(
    entity: MicroAppEntity,
    workspaceContext: WorkspaceEntityContext
  ): boolean {
    // For now, accept all entities
    // Future: implement workspace-specific compatibility rules
    return true
  }

  /**
   * Convert MicroAppEntity to EntityCreationConfig
   */
  private static convertMicroAppEntityToConfig(
    entityDefinition: MicroAppEntity,
    appCode: string,
    appName: string,
    workspaceContext: WorkspaceEntityContext
  ): EntityCreationConfig {
    // Generate smart code pattern
    const smartCodePattern = `HERA.${appCode.toUpperCase()}.${entityDefinition.entity_type.toUpperCase()}.{VARIANT}.v1`

    // Convert fields to form fields
    const formFields: FormField[] = entityDefinition.fields.map(field => ({
      id: field.field_name,
      label: field.display_label,
      type: this.mapFieldType(field.field_type),
      required: field.is_required,
      placeholder: `Enter ${field.display_label.toLowerCase()}`,
      section: this.getFieldSection(field.field_name, field.field_order)
    }))

    // Generate sections based on field grouping
    const sections = this.generateFormSections(formFields, entityDefinition)

    return {
      entityType: entityDefinition.entity_type,
      entityLabel: entityDefinition.display_name,
      smartCodePattern,
      sections,
      fields: formFields,
      workspaceContext,
      microAppConfig: {
        app_code: appCode,
        app_name: appName,
        entity_definition: entityDefinition
      }
    }
  }

  /**
   * Map micro-app field types to form field types
   */
  private static mapFieldType(fieldType: string): FormField['type'] {
    const typeMap: Record<string, FormField['type']> = {
      'text': 'text',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'select': 'select',
      'entity_ref': 'select'
    }

    return typeMap[fieldType] || 'text'
  }

  /**
   * Determine section for field based on name and order
   */
  private static getFieldSection(fieldName: string, order: number): string {
    // Basic section assignment logic
    const basicFields = ['name', 'title', 'description', 'type', 'category']
    const contactFields = ['email', 'phone', 'address', 'contact']
    const financialFields = ['price', 'cost', 'amount', 'value', 'budget']

    if (basicFields.some(f => fieldName.toLowerCase().includes(f))) {
      return 'basic'
    }
    if (contactFields.some(f => fieldName.toLowerCase().includes(f))) {
      return 'contact'
    }
    if (financialFields.some(f => fieldName.toLowerCase().includes(f))) {
      return 'financial'
    }

    // Default section assignment by order
    if (order <= 3) return 'basic'
    if (order <= 6) return 'details'
    return 'additional'
  }

  /**
   * Generate form sections from fields
   */
  private static generateFormSections(fields: FormField[], entityDefinition: MicroAppEntity): FormSection[] {
    const sectionGroups: Record<string, FormField[]> = {}
    
    // Group fields by section
    fields.forEach(field => {
      if (!sectionGroups[field.section]) {
        sectionGroups[field.section] = []
      }
      sectionGroups[field.section].push(field)
    })

    // Generate sections with metadata
    const sections: FormSection[] = []
    
    Object.keys(sectionGroups).forEach((sectionId, index) => {
      const hasRequiredFields = sectionGroups[sectionId].some(f => f.required)
      
      sections.push({
        id: sectionId,
        label: this.getSectionLabel(sectionId),
        icon: this.getSectionIcon(sectionId) as any,
        required: hasRequiredFields,
        description: this.getSectionDescription(sectionId, entityDefinition.display_name)
      })
    })

    return sections
  }

  private static getSectionLabel(sectionId: string): string {
    const labels: Record<string, string> = {
      'basic': 'Basic Information',
      'contact': 'Contact Details',
      'financial': 'Financial Information',
      'details': 'Additional Details',
      'additional': 'Additional Information'
    }
    return labels[sectionId] || sectionId.charAt(0).toUpperCase() + sectionId.slice(1)
  }

  private static getSectionIcon(sectionId: string): string {
    // Return icon class names - will be resolved to actual components in UI
    const icons: Record<string, string> = {
      'basic': 'FileText',
      'contact': 'User',
      'financial': 'DollarSign',
      'details': 'Settings',
      'additional': 'MoreHorizontal'
    }
    return icons[sectionId] || 'FileText'
  }

  private static getSectionDescription(sectionId: string, entityName: string): string {
    const descriptions: Record<string, string> = {
      'basic': `Enter basic ${entityName.toLowerCase()} information`,
      'contact': `Add contact details and communication information`,
      'financial': `Configure financial terms and pricing`,
      'details': `Provide additional ${entityName.toLowerCase()} details`,
      'additional': `Optional additional information`
    }
    return descriptions[sectionId] || `Configure ${sectionId} settings`
  }

  /**
   * Check if entity type exists in any installed micro-app
   */
  static async isEntityTypeAvailable(
    entityType: string,
    organizationId: string
  ): Promise<{ available: boolean; appCode?: string }> {
    try {
      const installedApps = await microAppClient.listInstalledApps(organizationId)
      
      if (!installedApps.success || !installedApps.installations) {
        return { available: false }
      }

      for (const app of installedApps.installations) {
        const appDefinition = await microAppClient.getAppDefinition(app.app_code)
        const hasEntityType = appDefinition?.entities?.some(e => e.entity_type === entityType)
        
        if (hasEntityType) {
          return { available: true, appCode: app.app_code }
        }
      }

      return { available: false }
    } catch (error) {
      console.error('Error checking entity type availability:', error)
      return { available: false }
    }
  }

  /**
   * Get quick creation options for workspace
   */
  static async getQuickCreateOptions(
    workspaceContext: WorkspaceEntityContext
  ): Promise<{ entityType: string; label: string; icon: string }[]> {
    const { entityTypes } = await this.getAvailableEntityTypes(workspaceContext)
    
    return entityTypes.slice(0, 3).map(entity => ({
      entityType: entity.entity_type,
      label: entity.display_name,
      icon: '📝' // Default icon, can be enhanced
    }))
  }
}

export default UniversalEntityRegistry