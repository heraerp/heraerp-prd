/**
 * HERA Universal Dynamic App Builder v2
 * Smart Code: HERA.PLATFORM.CONFIG.APP.ENTITY.v2
 * 
 * DEPRECATION NOTICE: This class now delegates to SupabaseAppBuilder for dynamic configuration loading
 * All hardcoded templates have been migrated to Supabase for true dynamic scalability
 * 
 * This file maintains backward compatibility while internally using the new Supabase-driven architecture
 */

import { ComponentType } from 'react'
import { HeraAppConfig, EntityDefinition, TransactionDefinition, ScreenDefinition } from '@/types/app-config'
import { DynamicPageConfig } from '@/lib/hera/dynamic-page-loader'

// Import the new Supabase-driven system
import { 
  supabaseAppBuilder, 
  SupabaseAppBuilder, 
  GeneratedAppRuntime,
  loadDynamicApp,
  loadFishExportsApp,
  loadRetailApp
} from './supabase-app-builder'

import { dynamicComponentFactory, DynamicComponentFactory } from './dynamic-component-factory'

// Legacy import for backward compatibility
import { EntityWizard } from '@/components/universal/EntityWizard'
import { TransactionWizard } from '@/components/universal/TransactionWizard'
import { UniversalOperationPage } from '@/components/universal/UniversalOperationPage'
import { UniversalEntityShell } from '@/components/universal/UniversalEntityShell'
import { UniversalTransactionShell } from '@/components/universal/UniversalTransactionShell'
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'

export interface AppBuilderConfig {
  app_id: string
  name: string
  description: string
  industry: string
  version: string
  entities: EntityDefinition[]
  transactions: TransactionDefinition[]
  screens: ScreenDefinition[]
  workflows?: WorkflowDefinition[]
  integrations?: IntegrationDefinition[]
  business_rules?: BusinessRuleDefinition[]
  navigation: NavigationConfig
  ui_theme?: UIThemeConfig
}

export interface WorkflowDefinition {
  workflow_id: string
  name: string
  entity_type?: string
  transaction_type?: string
  trigger: 'create' | 'update' | 'delete' | 'status_change'
  steps: WorkflowStep[]
}

export interface WorkflowStep {
  step_id: string
  name: string
  type: 'approval' | 'notification' | 'automation' | 'validation'
  assignee?: string
  conditions?: any[]
  actions: any[]
}

export interface IntegrationDefinition {
  integration_id: string
  name: string
  type: 'webhook' | 'api' | 'file' | 'email'
  trigger: string
  endpoint?: string
  config: any
}

export interface BusinessRuleDefinition {
  rule_id: string
  name: string
  description: string
  entity_type?: string
  transaction_type?: string
  trigger: 'before_save' | 'after_save' | 'on_field_change'
  conditions: any[]
  actions: any[]
}

export interface NavigationConfig {
  main_menu: MenuItem[]
  quick_actions: QuickAction[]
  dashboards: DashboardConfig[]
}

export interface MenuItem {
  id: string
  label: string
  icon: string
  path: string
  children?: MenuItem[]
  permissions?: string[]
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  path: string
  color: string
}

export interface DashboardConfig {
  dashboard_id: string
  name: string
  widgets: DashboardWidget[]
  layout: 'grid' | 'masonry' | 'flow'
}

export interface DashboardWidget {
  widget_id: string
  type: 'metric' | 'chart' | 'table' | 'list'
  title: string
  size: 'small' | 'medium' | 'large'
  data_source: string
  config: any
}

export interface UIThemeConfig {
  primary_color: string
  secondary_color: string
  accent_color: string
  logo_url?: string
  custom_css?: string
}

export interface GeneratedApp {
  app_config: AppBuilderConfig
  components: Record<string, ComponentType<any>>
  routes: AppRoute[]
  navigation: NavigationConfig
  dynamic_configs: Record<string, DynamicPageConfig>
}

export interface AppRoute {
  path: string
  component: string
  exact?: boolean
  permissions?: string[]
  params?: Record<string, string>
}

/**
 * Universal App Builder Class v2 (Legacy Compatibility Wrapper)
 * 
 * IMPORTANT: This class now delegates to SupabaseAppBuilder for dynamic functionality
 * All methods have been updated to use the new Supabase-driven architecture
 */
export class UniversalAppBuilder {
  private static instance: UniversalAppBuilder
  private supabaseBuilder: SupabaseAppBuilder
  private componentFactory: DynamicComponentFactory
  private registeredApps: Record<string, GeneratedApp> // Legacy compatibility

  private constructor() {
    this.supabaseBuilder = supabaseAppBuilder
    this.componentFactory = dynamicComponentFactory
    this.registeredApps = {} // Initialize for backward compatibility
    
    console.log('🔄 UniversalAppBuilder v2: Initialized with Supabase-driven architecture')
  }

  public static getInstance(): UniversalAppBuilder {
    if (!UniversalAppBuilder.instance) {
      UniversalAppBuilder.instance = new UniversalAppBuilder()
    }
    return UniversalAppBuilder.instance
  }

  /**
   * Build complete application from configuration (LEGACY METHOD - DEPRECATED)
   * 
   * @deprecated Use loadDynamicApp() instead for Supabase-driven dynamic loading
   */
  public async buildApplication(config: AppBuilderConfig): Promise<GeneratedApp> {
    console.warn('⚠️ buildApplication() is deprecated. Use loadDynamicApp() for dynamic configuration loading.')
    
    // Convert legacy config to GeneratedAppRuntime format
    const runtime = await this.supabaseBuilder.loadAppConfig(
      config.app_id,
      'system', // TODO: Use actual actor ID
      {
        organization_id: 'platform',
        include_cache: true
      }
    )

    // Convert to legacy format for backward compatibility
    const legacyApp: GeneratedApp = {
      app_config: runtime.app_config,
      components: runtime.components,
      routes: runtime.routes,
      navigation: runtime.navigation,
      dynamic_configs: {
        ...runtime.entity_configs,
        ...runtime.transaction_configs
      }
    }

    console.log(`✅ Application built via Supabase backend: ${runtime.routes.length} routes generated`)
    return legacyApp
  }

  /**
   * Generate dynamic routes for all entities and transactions (DEPRECATED)
   * @deprecated Routes are now generated dynamically by SupabaseAppBuilder
   */
  private async generateRoutes(config: AppBuilderConfig): Promise<AppRoute[]> {
    console.warn('⚠️ generateRoutes() is deprecated. Routes are now generated by SupabaseAppBuilder.')
    
    // Delegate to Supabase builder for dynamic route generation
    try {
      const runtime = await this.supabaseBuilder.loadAppConfig(
        config.app_id,
        'system', // TODO: Use actual actor ID
        { organization_id: 'platform' }
      )
      return runtime.routes
    } catch (error) {
      console.error('Error generating routes:', error)
      return []
    }
  }

  /**
   * Generate dynamic page configurations for all entities and transactions (DEPRECATED)
   * @deprecated Dynamic configs are now generated by SupabaseAppBuilder
   */
  private generateDynamicConfigs(config: AppBuilderConfig): Record<string, DynamicPageConfig> {
    console.warn('⚠️ generateDynamicConfigs() is deprecated. Dynamic configs are now generated by SupabaseAppBuilder.')
    
    // Return empty object - configs are now handled by SupabaseAppBuilder
    return {}
  }

  /**
   * Create entity configuration for dynamic pages
   */
  private createEntityConfig(entity: EntityDefinition, appConfig: AppBuilderConfig): DynamicPageConfig {
    return {
      entity: {
        entityType: entity.entity_type,
        entityLabel: entity.display_name,
        sections: [
          {
            id: 'basic_info',
            title: 'Basic Information',
            fields: entity.fields.filter(f => f.field_order <= 5).map(f => f.field_name)
          },
          {
            id: 'details',
            title: 'Details',
            fields: entity.fields.filter(f => f.field_order > 5).map(f => f.field_name)
          }
        ],
        fields: entity.fields.map(field => ({
          name: field.field_name,
          label: field.display_label,
          type: field.field_type,
          required: field.is_required,
          validation: field.validation,
          ui_hints: field.ui_hints
        })),
        api: {
          base_path: `/${appConfig.app_id}/${entity.entity_type.toLowerCase()}`,
          endpoints: {
            list: 'GET /',
            create: 'POST /',
            read: 'GET /:id',
            update: 'PUT /:id',
            delete: 'DELETE /:id'
          }
        }
      },
      lists: {
        [entity.entity_type.toLowerCase()]: {
          entityType: entity.entity_type,
          title: entity.display_name_plural,
          description: `Manage ${entity.display_name_plural.toLowerCase()}`,
          searchFields: entity.fields.filter(f => f.is_searchable).map(f => f.field_name),
          filterOptions: this.generateFilterOptions(entity.fields),
          columns: this.generateColumnConfig(entity.fields),
          actions: [
            { id: 'create', label: 'Create New', icon: 'Plus', primary: true },
            { id: 'edit', label: 'Edit', icon: 'Edit' },
            { id: 'delete', label: 'Delete', icon: 'Trash2', confirm: true }
          ]
        }
      }
    }
  }

  /**
   * Create transaction configuration for dynamic pages
   */
  private createTransactionConfig(transaction: TransactionDefinition, appConfig: AppBuilderConfig): DynamicPageConfig {
    return {
      transaction: {
        transactionType: transaction.transaction_type,
        transactionLabel: transaction.display_name,
        fields: transaction.header_fields.map(field => ({
          name: field.field_name,
          label: field.display_label,
          type: field.field_type,
          required: field.is_required,
          validation: field.validation,
          ui_hints: field.ui_hints
        })),
        lineFields: transaction.line_fields?.map(field => ({
          name: field.field_name,
          label: field.display_label,
          type: field.field_type,
          required: field.is_required,
          validation: field.validation,
          ui_hints: field.ui_hints
        })),
        api: {
          base_path: `/${appConfig.app_id}/${transaction.transaction_type.toLowerCase()}`,
          endpoints: {
            list: 'GET /',
            create: 'POST /',
            read: 'GET /:id',
            update: 'PUT /:id',
            delete: 'DELETE /:id',
            post: 'POST /:id/post',
            approve: 'POST /:id/approve'
          }
        }
      },
      lists: {
        [transaction.transaction_type.toLowerCase()]: {
          transactionType: transaction.transaction_type,
          title: transaction.display_name_plural,
          description: `Manage ${transaction.display_name_plural.toLowerCase()}`,
          searchFields: transaction.header_fields.filter(f => f.is_searchable).map(f => f.field_name),
          filterOptions: this.generateFilterOptions(transaction.header_fields),
          columns: this.generateColumnConfig(transaction.header_fields),
          actions: [
            { id: 'create', label: 'Create New', icon: 'Plus', primary: true },
            { id: 'edit', label: 'Edit', icon: 'Edit' },
            { id: 'post', label: 'Post', icon: 'Send' },
            { id: 'approve', label: 'Approve', icon: 'Check' }
          ]
        }
      }
    }
  }

  /**
   * Generate filter options from field definitions
   */
  private generateFilterOptions(fields: any[]): any[] {
    return fields
      .filter(field => ['select', 'boolean', 'date'].includes(field.field_type))
      .map(field => ({
        field_name: field.field_name,
        display_label: field.display_label,
        filter_type: field.field_type === 'boolean' ? 'boolean' : 
                    field.field_type === 'date' ? 'date_range' : 'select',
        options: field.ui_hints?.options?.map((opt: any) => opt.value) || []
      }))
  }

  /**
   * Generate column configuration from field definitions
   */
  private generateColumnConfig(fields: any[]): any[] {
    return fields
      .filter(field => field.field_order <= 6) // First 6 fields for table
      .map(field => ({
        field_name: field.field_name,
        display_label: field.display_label,
        sortable: true,
        width: field.field_type === 'number' ? '120px' : 
               field.field_type === 'date' ? '140px' : 'auto',
        render: field.field_type === 'boolean' ? 'boolean' :
                field.field_type === 'date' ? 'date' :
                field.field_type === 'number' ? 'currency' : 'text',
        align: field.field_type === 'number' ? 'right' : 'left'
      }))
  }

  /**
   * Get generated application by ID (UPDATED - uses Supabase)
   */
  public async getApplication(appId: string): Promise<GeneratedApp | null> {
    try {
      const runtime = await this.supabaseBuilder.loadAppConfig(appId, 'system', {
        organization_id: 'platform',
        include_cache: true
      })

      // Convert to legacy format
      const legacyApp: GeneratedApp = {
        app_config: runtime.app_config,
        components: runtime.components,
        routes: runtime.routes,
        navigation: runtime.navigation,
        dynamic_configs: {
          ...runtime.entity_configs,
          ...runtime.transaction_configs
        }
      }

      return legacyApp
    } catch (error) {
      console.error(`Error loading application ${appId}:`, error)
      return null
    }
  }

  /**
   * List all available applications (UPDATED - uses Supabase)
   */
  public async listApplications(): Promise<string[]> {
    try {
      return await this.supabaseBuilder.listAvailableApps('system')
    } catch (error) {
      console.error('Error listing applications:', error)
      return []
    }
  }

  /**
   * Generate complete app from industry template (UPDATED - uses Supabase)
   * @deprecated Use loadDynamicApp() instead for database-driven templates
   */
  public async generateFromTemplate(
    industry: string, 
    appName: string, 
    customizations?: Partial<AppBuilderConfig>
  ): Promise<GeneratedApp> {
    console.warn('⚠️ generateFromTemplate() is deprecated. Use loadDynamicApp() for dynamic configuration loading.')
    
    try {
      // Map industry to app_id (following the seed script mapping)
      const industryAppMap: Record<string, string> = {
        'fish_exports': 'fish-exports',
        'retail': 'retail',
        'manufacturing': 'manufacturing',
        'waste_management': 'waste-management',
        'salon': 'salon',
        'restaurant': 'restaurant'
      }

      const appId = industryAppMap[industry]
      if (!appId) {
        throw new Error(`Industry template not found: ${industry}. Available: ${Object.keys(industryAppMap).join(', ')}`)
      }

      // Load from Supabase
      const runtime = await this.supabaseBuilder.loadAppConfig(appId, 'system', {
        organization_id: 'platform',
        include_cache: true
      })

      // Apply customizations if provided
      if (customizations) {
        runtime.app_config = { ...runtime.app_config, ...customizations }
        runtime.app_config.app_id = appName.toLowerCase().replace(/\s+/g, '-')
        runtime.app_config.name = appName
      }

      // Convert to legacy format
      const legacyApp: GeneratedApp = {
        app_config: runtime.app_config,
        components: runtime.components,
        routes: runtime.routes,
        navigation: runtime.navigation,
        dynamic_configs: {
          ...runtime.entity_configs,
          ...runtime.transaction_configs
        }
      }

      return legacyApp
    } catch (error) {
      console.error(`Error generating app from template ${industry}:`, error)
      throw error
    }
  }

  /**
   * Get industry-specific template (DEPRECATED - moved to Supabase)
   * @deprecated Templates are now stored in Supabase and loaded dynamically
   */
  private async getIndustryTemplate(industry: string): Promise<AppBuilderConfig | null> {
    console.warn('⚠️ getIndustryTemplate() is deprecated. Templates are now loaded from Supabase.')
    
    // Map industry to app_id and load from Supabase
    const industryAppMap: Record<string, string> = {
      'fish_exports': 'fish-exports',
      'retail': 'retail',
      'manufacturing': 'manufacturing',
      'waste_management': 'waste-management',
      'salon': 'salon',
      'restaurant': 'restaurant'
    }

    const appId = industryAppMap[industry]
    if (!appId) {
      return null
    }

    try {
      const runtime = await this.supabaseBuilder.loadAppConfig(appId, 'system', {
        organization_id: 'platform'
      })
      return runtime.app_config
    } catch (error) {
      console.error(`Error loading industry template ${industry}:`, error)
      return null
    }
  }

  /**
   * Fish Exports Industry Template (DEPRECATED - moved to Supabase)
   * @deprecated This template is now stored in Supabase. Use loadFishExportsApp() instead.
   */
  private async getFishExportsTemplate(): Promise<AppBuilderConfig> {
    console.warn('⚠️ getFishExportsTemplate() is deprecated. Template now loaded from Supabase via loadFishExportsApp().')
    
    try {
      const runtime = await this.supabaseBuilder.loadAppConfig('fish-exports', 'system', {
        organization_id: 'platform'
      })
      return runtime.app_config
    } catch (error) {
      console.error('Error loading fish exports template from Supabase:', error)
      throw new Error('Fish exports template not available. Please run the seed script first.')
    }
  }

  /**
   * Retail Industry Template (DEPRECATED - moved to Supabase)
   * @deprecated This template is now stored in Supabase. Use loadRetailApp() instead.
   */
  private async getRetailTemplate(): Promise<AppBuilderConfig> {
    console.warn('⚠️ getRetailTemplate() is deprecated. Template now loaded from Supabase via loadRetailApp().')
    
    try {
      const runtime = await this.supabaseBuilder.loadAppConfig('retail', 'system', {
        organization_id: 'platform'
      })
      return runtime.app_config
    } catch (error) {
      console.error('Error loading retail template from Supabase:', error)
      throw new Error('Retail template not available. Please run the seed script first.')
    }
  }

  /**
   * Add missing saveAppConfig method for completeness
   */
  public async saveAppConfig(
    appId: string,
    config: AppBuilderConfig,
    actorId: string = 'system',
    organizationId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Delegate to Supabase builder
      return await this.supabaseBuilder.saveAppConfig(appId, config, actorId, organizationId)
    } catch (error: any) {
      console.error(`Error saving app config ${appId}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get other industry templates (DEPRECATED - moved to Supabase)
   * @deprecated All templates are now stored in Supabase and loaded dynamically
   */
  private async getManufacturingTemplate(): Promise<AppBuilderConfig> {
    console.warn('⚠️ getManufacturingTemplate() is deprecated. Template now loaded from Supabase.')
    throw new Error('Manufacturing template not yet implemented in Supabase. Please add to seed script.')
  }

  private async getWasteManagementTemplate(): Promise<AppBuilderConfig> {
    console.warn('⚠️ getWasteManagementTemplate() is deprecated. Template now loaded from Supabase.')
    throw new Error('Waste management template not yet implemented in Supabase. Please add to seed script.')
  }

  private async getSalonTemplate(): Promise<AppBuilderConfig> {
    console.warn('⚠️ getSalonTemplate() is deprecated. Template now loaded from Supabase.')
    throw new Error('Salon template not yet implemented in Supabase. Please add to seed script.')
  }

  private async getRestaurantTemplate(): Promise<AppBuilderConfig> {
    console.warn('⚠️ getRestaurantTemplate() is deprecated. Template now loaded from Supabase.')
    throw new Error('Restaurant template not yet implemented in Supabase. Please add to seed script.')
  }

  /**
   * Export application configuration as JSON (UPDATED - uses Supabase)
   */
  public async exportApplication(appId: string): Promise<string> {
    const app = await this.getApplication(appId)
    if (!app) {
      throw new Error(`Application not found: ${appId}`)
    }
    return JSON.stringify(app.app_config, null, 2)
  }

  /**
   * Import application from JSON configuration (UPDATED - uses Supabase)
   */
  public async importApplication(configJson: string, actorId: string = 'system'): Promise<GeneratedApp> {
    const config: AppBuilderConfig = JSON.parse(configJson)
    
    // Save to Supabase first
    const saveResult = await this.supabaseBuilder.saveAppConfig(
      config.app_id,
      config,
      actorId
    )
    
    if (!saveResult.success) {
      throw new Error(`Failed to save imported configuration: ${saveResult.error}`)
    }
    
    // Then load it back as a GeneratedApp
    return this.buildApplication(config)
  }
}

// Export singleton instance
export const universalAppBuilder = UniversalAppBuilder.getInstance()

// Export factory functions for easy usage (UPDATED - uses Supabase dynamic loading)
export async function createFishExportsApp(appName: string = 'Fish Exports System'): Promise<GeneratedApp> {
  console.warn('⚠️ createFishExportsApp() is deprecated. Use loadFishExportsApp() from supabase-app-builder instead.')
  return universalAppBuilder.generateFromTemplate('fish_exports', appName)
}

export async function createRetailApp(appName: string = 'Retail Management System'): Promise<GeneratedApp> {
  console.warn('⚠️ createRetailApp() is deprecated. Use loadRetailApp() from supabase-app-builder instead.')
  return universalAppBuilder.generateFromTemplate('retail', appName)
}

export async function createManufacturingApp(appName: string = 'Manufacturing System'): Promise<GeneratedApp> {
  console.warn('⚠️ createManufacturingApp() is deprecated. Manufacturing template not yet implemented in Supabase.')
  throw new Error('Manufacturing template not available. Please add to seed script.')
}

export async function createCustomApp(config: AppBuilderConfig): Promise<GeneratedApp> {
  console.warn('⚠️ createCustomApp() is deprecated. Use buildApplication() instead.')
  return universalAppBuilder.buildApplication(config)
}

// NEW: Recommended dynamic loading functions
export async function loadDynamicAppFromSupabase(
  appId: string,
  actorId: string = 'system',
  organizationId?: string
): Promise<GeneratedApp> {
  const runtime = await universalAppBuilder.supabaseBuilder.loadAppConfig(appId, actorId, {
    organization_id: organizationId || 'platform',
    resolve_inheritance: true,
    include_cache: true
  })

  // Convert to legacy format for backward compatibility
  return {
    app_config: runtime.app_config,
    components: runtime.components,
    routes: runtime.routes,
    navigation: runtime.navigation,
    dynamic_configs: {
      ...runtime.entity_configs,
      ...runtime.transaction_configs
    }
  }
}