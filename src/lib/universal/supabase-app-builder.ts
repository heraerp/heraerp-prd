/**
 * HERA Supabase Dynamic App Builder
 * Smart Code: HERA.PLATFORM.CONFIG.LOADER.DYNAMIC.v2
 * 
 * Truly dynamic application builder that loads all configurations from Supabase
 * Replaces hardcoded templates with database-driven, runtime-resolved apps
 */

import { ComponentType } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { HeraAppConfig, EntityDefinition, TransactionDefinition } from '@/types/app-config'
import { heraConfigService, ConfigurationType } from '@/lib/config/hera-config-service'
import { SmartCodeValidationService, generateAppConfigSmartCode } from '@/lib/validation/smart-code-validation-service'

// Platform Organization ID - where all platform configurations are stored
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

// Universal Templates Registry
import { EntityWizard } from '@/components/universal/EntityWizard'
import { TransactionWizard } from '@/components/universal/TransactionWizard'
import { UniversalOperationPage } from '@/components/universal/UniversalOperationPage'
import { UniversalEntityShell } from '@/components/universal/UniversalEntityShell'
import { UniversalTransactionShell } from '@/components/universal/UniversalTransactionShell'
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'

export interface SupabaseAppConfig extends HeraAppConfig {
  entity_id?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface GeneratedAppRuntime {
  app_config: SupabaseAppConfig
  components: Record<string, ComponentType<any>>
  routes: AppRoute[]
  navigation: any
  entity_configs: Record<string, any>
  transaction_configs: Record<string, any>
  cache_key: string
  loaded_at: Date
}

export interface AppRoute {
  path: string
  component: string
  exact?: boolean
  permissions?: string[]
  params?: Record<string, string>
}

export interface AppLoadOptions {
  include_cache?: boolean
  cache_ttl?: number
  organization_id?: string
  resolve_inheritance?: boolean
  include_permissions?: boolean
}

export interface ConfigInheritance {
  platform_config: SupabaseAppConfig | null
  org_override: Partial<SupabaseAppConfig> | null
  merged_config: SupabaseAppConfig
  inheritance_chain: string[]
}

/**
 * Supabase Dynamic App Builder Class
 * Loads and builds applications from database configurations
 */
export class SupabaseAppBuilder {
  private static instance: SupabaseAppBuilder
  private supabase: SupabaseClient
  private templates: Record<string, ComponentType<any>>
  private configCache: Map<string, { config: GeneratedAppRuntime; expires_at: Date }>
  private subscriptions: Map<string, any>

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    this.templates = {
      'EntityWizard': EntityWizard,
      'TransactionWizard': TransactionWizard,
      'UniversalOperationPage': UniversalOperationPage,
      'UniversalEntityShell': UniversalEntityShell,
      'UniversalTransactionShell': UniversalTransactionShell,
      'HERAMasterDataTemplate': HERAMasterDataTemplate,
      'EntityListPage': HERAMasterDataTemplate,
      'TransactionListPage': HERAMasterDataTemplate,
      'EntityDetailPage': UniversalOperationPage,
      'TransactionDetailPage': UniversalOperationPage
    }

    this.configCache = new Map()
    this.subscriptions = new Map()
  }

  public static getInstance(): SupabaseAppBuilder {
    if (!SupabaseAppBuilder.instance) {
      SupabaseAppBuilder.instance = new SupabaseAppBuilder()
    }
    return SupabaseAppBuilder.instance
  }

  /**
   * Load application configuration from Supabase
   */
  async loadAppConfig(
    appId: string,
    actorId: string,
    options: AppLoadOptions = {}
  ): Promise<GeneratedAppRuntime> {
    const cacheKey = `${appId}:${options.organization_id || 'platform'}`

    // Check cache first
    if (options.include_cache !== false) {
      const cached = this.getCachedConfig(cacheKey)
      if (cached) {
        console.log(`🎯 SupabaseAppBuilder: Cache hit for ${appId}`)
        return cached
      }
    }

    try {
      console.log(`🔍 SupabaseAppBuilder: Loading ${appId} from Supabase`)

      // Load configuration with inheritance
      const inheritance = await this.loadConfigWithInheritance(appId, actorId, options)
      
      if (!inheritance.merged_config) {
        throw new Error(`App configuration not found: ${appId}`)
      }

      // Build the application runtime
      const generatedApp = await this.buildApplicationRuntime(inheritance.merged_config, options)

      // Cache the result
      if (options.include_cache !== false) {
        this.setCachedConfig(cacheKey, generatedApp, options.cache_ttl)
      }

      console.log(`✅ SupabaseAppBuilder: Successfully loaded ${appId}`)
      return generatedApp

    } catch (error) {
      console.error(`💥 SupabaseAppBuilder: Failed to load ${appId}:`, error)
      throw error
    }
  }

  /**
   * Load configuration with inheritance chain (Platform → Org → User)
   */
  private async loadConfigWithInheritance(
    appId: string,
    actorId: string,
    options: AppLoadOptions
  ): Promise<ConfigInheritance> {
    const inheritanceChain: string[] = []

    // Load platform configuration
    const platformConfig = await this.loadPlatformConfig(appId, actorId)
    if (platformConfig) {
      inheritanceChain.push('platform')
    }

    // Load organization override (if specified)
    let orgOverride: Partial<SupabaseAppConfig> | null = null
    if (options.organization_id && options.resolve_inheritance !== false) {
      orgOverride = await this.loadOrgOverride(appId, options.organization_id, actorId)
      if (orgOverride) {
        inheritanceChain.push('organization')
      }
    }

    // Merge configurations
    const mergedConfig = this.mergeConfigurations(platformConfig, orgOverride)

    return {
      platform_config: platformConfig,
      org_override: orgOverride,
      merged_config: mergedConfig,
      inheritance_chain: inheritanceChain
    }
  }

  /**
   * Load platform configuration from Platform Organization
   */
  private async loadPlatformConfig(appId: string, actorId: string): Promise<SupabaseAppConfig | null> {
    try {
      const { data, error } = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: actorId,
        p_organization_id: PLATFORM_ORG_ID,
        p_entity: {
          entity_type: 'APP_CONFIG',
          entity_code: appId
        },
        p_options: {
          include_dynamic_data: true
        }
      })

      if (error || !data?.length) {
        console.warn(`⚠️ Platform config not found for ${appId}`)
        return null
      }

      const entity = data[0]
      const appDefinitionField = entity.dynamic_fields?.find(
        (field: any) => field.field_name === 'app_definition'
      )

      if (!appDefinitionField?.field_value_json) {
        console.warn(`⚠️ No app_definition field for ${appId}`)
        return null
      }

      const config = appDefinitionField.field_value_json as SupabaseAppConfig
      
      // Add entity metadata
      config.entity_id = entity.id
      config.created_at = entity.created_at
      config.updated_at = entity.updated_at
      config.created_by = entity.created_by
      config.updated_by = entity.updated_by

      return config

    } catch (error) {
      console.error(`💥 Error loading platform config for ${appId}:`, error)
      return null
    }
  }

  /**
   * Load organization-specific override
   */
  private async loadOrgOverride(
    appId: string,
    organizationId: string,
    actorId: string
  ): Promise<Partial<SupabaseAppConfig> | null> {
    try {
      const { data, error } = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: actorId,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'APP_CONFIG_OVERRIDE',
          entity_code: appId
        },
        p_options: {
          include_dynamic_data: true
        }
      })

      if (error || !data?.length) {
        console.log(`ℹ️ No org override found for ${appId} in org ${organizationId}`)
        return null
      }

      const entity = data[0]
      const overrideField = entity.dynamic_fields?.find(
        (field: any) => field.field_name === 'app_override'
      )

      if (!overrideField?.field_value_json) {
        console.warn(`⚠️ No app_override field for ${appId}`)
        return null
      }

      return overrideField.field_value_json as Partial<SupabaseAppConfig>

    } catch (error) {
      console.error(`💥 Error loading org override for ${appId}:`, error)
      return null
    }
  }

  /**
   * Merge platform configuration with organization overrides
   */
  private mergeConfigurations(
    platformConfig: SupabaseAppConfig | null,
    orgOverride: Partial<SupabaseAppConfig> | null
  ): SupabaseAppConfig {
    if (!platformConfig) {
      throw new Error('Platform configuration is required')
    }

    if (!orgOverride) {
      return platformConfig
    }

    // Deep merge with override taking precedence
    const merged = { ...platformConfig }

    // Merge metadata
    if (orgOverride.metadata) {
      merged.metadata = { ...merged.metadata, ...orgOverride.metadata }
    }

    // Merge entities (extend or override)
    if (orgOverride.entities) {
      const entityMap = new Map(merged.entities?.map(e => [e.entity_type, e]) || [])
      
      orgOverride.entities.forEach(entity => {
        entityMap.set(entity.entity_type, entity)
      })
      
      merged.entities = Array.from(entityMap.values())
    }

    // Merge transactions (extend or override)
    if (orgOverride.transactions) {
      const transactionMap = new Map(merged.transactions?.map(t => [t.transaction_type, t]) || [])
      
      orgOverride.transactions.forEach(transaction => {
        transactionMap.set(transaction.transaction_type, transaction)
      })
      
      merged.transactions = Array.from(transactionMap.values())
    }

    // Merge screens
    if (orgOverride.screens) {
      const screenMap = new Map(merged.screens?.map(s => [s.screen_id, s]) || [])
      
      orgOverride.screens.forEach(screen => {
        screenMap.set(screen.screen_id, screen)
      })
      
      merged.screens = Array.from(screenMap.values())
    }

    // Merge navigation
    if (orgOverride.navigation) {
      merged.navigation = { ...merged.navigation, ...orgOverride.navigation }
    }

    // Merge UI theme
    if (orgOverride.ui_theme) {
      merged.ui_theme = { ...merged.ui_theme, ...orgOverride.ui_theme }
    }

    // Update other root properties
    Object.keys(orgOverride).forEach(key => {
      if (!['metadata', 'entities', 'transactions', 'screens', 'navigation', 'ui_theme'].includes(key)) {
        (merged as any)[key] = (orgOverride as any)[key]
      }
    })

    return merged
  }

  /**
   * Build application runtime from configuration
   */
  private async buildApplicationRuntime(
    config: SupabaseAppConfig,
    options: AppLoadOptions
  ): Promise<GeneratedAppRuntime> {
    const routes = this.generateDynamicRoutes(config)
    const entityConfigs = this.generateEntityConfigs(config)
    const transactionConfigs = this.generateTransactionConfigs(config)

    return {
      app_config: config,
      components: { ...this.templates },
      routes,
      navigation: config.navigation,
      entity_configs: entityConfigs,
      transaction_configs: transactionConfigs,
      cache_key: `${config.app_id}:${Date.now()}`,
      loaded_at: new Date()
    }
  }

  /**
   * Generate dynamic routes from configuration
   */
  private generateDynamicRoutes(config: SupabaseAppConfig): AppRoute[] {
    const routes: AppRoute[] = []
    const basePath = `/${config.app_id}`

    // Generate entity routes
    config.entities?.forEach(entity => {
      const entityPath = entity.entity_type.toLowerCase().replace(/_/g, '-')
      
      routes.push(
        {
          path: `${basePath}/${entityPath}`,
          component: 'EntityListPage',
          permissions: [`${entity.entity_type}_READ`]
        },
        {
          path: `${basePath}/${entityPath}/new`,
          component: 'EntityWizard',
          permissions: [`${entity.entity_type}_CREATE`]
        },
        {
          path: `${basePath}/${entityPath}/:id`,
          component: 'EntityDetailPage',
          permissions: [`${entity.entity_type}_READ`]
        }
      )
    })

    // Generate transaction routes
    config.transactions?.forEach(transaction => {
      const txnPath = transaction.transaction_type.toLowerCase().replace(/_/g, '-')
      
      routes.push(
        {
          path: `${basePath}/${txnPath}`,
          component: 'TransactionListPage',
          permissions: [`${transaction.transaction_type}_READ`]
        },
        {
          path: `${basePath}/${txnPath}/new`,
          component: 'TransactionWizard',
          permissions: [`${transaction.transaction_type}_CREATE`]
        },
        {
          path: `${basePath}/${txnPath}/:id`,
          component: 'TransactionDetailPage',
          permissions: [`${transaction.transaction_type}_READ`]
        }
      )
    })

    // Add dashboard routes
    config.navigation?.dashboards?.forEach(dashboard => {
      routes.push({
        path: `${basePath}/dashboard/${dashboard.dashboard_id}`,
        component: 'DashboardPage',
        permissions: ['DASHBOARD_VIEW']
      })
    })

    // Add main app route
    routes.push({
      path: basePath,
      component: 'AppHomePage',
      exact: true
    })

    return routes
  }

  /**
   * Generate entity configurations for dynamic components
   */
  private generateEntityConfigs(config: SupabaseAppConfig): Record<string, any> {
    const configs: Record<string, any> = {}

    config.entities?.forEach(entity => {
      const configKey = `${config.app_id}.${entity.entity_type.toLowerCase()}`
      
      configs[configKey] = {
        entity: {
          entityType: entity.entity_type,
          entityLabel: entity.display_name,
          sections: this.generateEntitySections(entity),
          fields: entity.fields.map(field => ({
            name: field.field_name,
            label: field.display_label,
            type: field.field_type,
            required: field.is_required,
            validation: field.validation,
            ui_hints: field.ui_hints
          })),
          api: {
            base_path: `/${config.app_id}/${entity.entity_type.toLowerCase()}`,
            endpoints: {
              list: 'GET /',
              create: 'POST /',
              read: 'GET /:id',
              update: 'PUT /:id',
              delete: 'DELETE /:id'
            }
          }
        }
      }
    })

    return configs
  }

  /**
   * Generate transaction configurations for dynamic components
   */
  private generateTransactionConfigs(config: SupabaseAppConfig): Record<string, any> {
    const configs: Record<string, any> = {}

    config.transactions?.forEach(transaction => {
      const configKey = `${config.app_id}.${transaction.transaction_type.toLowerCase()}`
      
      configs[configKey] = {
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
            base_path: `/${config.app_id}/${transaction.transaction_type.toLowerCase()}`,
            endpoints: {
              list: 'GET /',
              create: 'POST /',
              read: 'GET /:id',
              update: 'PUT /:id',
              delete: 'DELETE /:id'
            }
          }
        }
      }
    })

    return configs
  }

  /**
   * Generate entity sections for UI layout
   */
  private generateEntitySections(entity: EntityDefinition): any[] {
    const fields = entity.fields || []
    const basicFields = fields.filter(f => f.field_order <= 5)
    const detailFields = fields.filter(f => f.field_order > 5)

    const sections = [
      {
        id: 'basic_info',
        title: 'Basic Information',
        fields: basicFields.map(f => f.field_name)
      }
    ]

    if (detailFields.length > 0) {
      sections.push({
        id: 'details',
        title: 'Additional Details',
        fields: detailFields.map(f => f.field_name)
      })
    }

    return sections
  }

  /**
   * List available apps from Supabase
   */
  async listAvailableApps(actorId: string, organizationId?: string): Promise<string[]> {
    try {
      // Get platform apps
      const { data: platformApps, error: platformError } = await this.supabase
        .from('core_entities')
        .select('entity_code')
        .eq('entity_type', 'APP_CONFIG')
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('status', 'active')

      if (platformError) {
        console.error('Error loading platform apps:', platformError)
        return []
      }

      const appIds = platformApps?.map(app => app.entity_code) || []

      // If organization specified, also check for org-specific apps
      if (organizationId) {
        const { data: orgApps, error: orgError } = await this.supabase
          .from('core_entities')
          .select('entity_code')
          .eq('entity_type', 'APP_CONFIG')
          .eq('organization_id', organizationId)
          .eq('status', 'active')

        if (!orgError && orgApps) {
          orgApps.forEach(app => {
            if (!appIds.includes(app.entity_code)) {
              appIds.push(app.entity_code)
            }
          })
        }
      }

      return appIds.sort()

    } catch (error) {
      console.error('Error listing available apps:', error)
      return []
    }
  }

  /**
   * Subscribe to configuration changes
   */
  subscribeToConfigChanges(
    appId: string,
    organizationId: string,
    callback: (newConfig: GeneratedAppRuntime) => void
  ): () => void {
    const subscriptionKey = `${appId}:${organizationId}`

    // Remove existing subscription
    this.unsubscribe(subscriptionKey)

    const channel = this.supabase
      .channel(`app-config-${subscriptionKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'core_dynamic_data',
          filter: `field_name=in.(app_definition,app_override)`
        },
        async (payload) => {
          console.log(`🔔 Configuration change detected for ${appId}`)
          
          // Invalidate cache
          this.invalidateCache(`${appId}:${organizationId}`)
          
          // Reload configuration and notify callback
          try {
            const newConfig = await this.loadAppConfig(appId, 'system', {
              organization_id: organizationId,
              include_cache: false
            })
            callback(newConfig)
          } catch (error) {
            console.error('Error reloading configuration after change:', error)
          }
        }
      )
      .subscribe()

    this.subscriptions.set(subscriptionKey, channel)

    return () => this.unsubscribe(subscriptionKey)
  }

  /**
   * Unsubscribe from configuration changes
   */
  private unsubscribe(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey)
    if (subscription) {
      this.supabase.removeChannel(subscription)
      this.subscriptions.delete(subscriptionKey)
    }
  }

  /**
   * Cache management methods
   */
  private getCachedConfig(cacheKey: string): GeneratedAppRuntime | null {
    const cached = this.configCache.get(cacheKey)
    if (!cached) return null

    const now = new Date()
    if (now > cached.expires_at) {
      this.configCache.delete(cacheKey)
      return null
    }

    return cached.config
  }

  private setCachedConfig(
    cacheKey: string,
    config: GeneratedAppRuntime,
    ttlMinutes: number = 5
  ): void {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes)

    this.configCache.set(cacheKey, {
      config,
      expires_at: expiresAt
    })
  }

  private invalidateCache(cacheKey?: string): void {
    if (cacheKey) {
      this.configCache.delete(cacheKey)
      console.log(`🗑️ Cache invalidated for ${cacheKey}`)
    } else {
      this.configCache.clear()
      console.log(`🧹 All cache cleared`)
    }
  }

  /**
   * Get template component
   */
  getTemplateComponent(componentName: string): ComponentType<any> | null {
    return this.templates[componentName] || null
  }

  /**
   * Register custom component
   */
  registerComponent(name: string, component: ComponentType<any>): void {
    this.templates[name] = component
    console.log(`🔧 Registered custom component: ${name}`)
  }

  /**
   * Save app configuration to Supabase
   */
  async saveAppConfig(
    appId: string,
    config: any,
    actorId: string,
    organizationId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isOverride = !!organizationId
      const targetOrgId = organizationId || PLATFORM_ORG_ID
      const entityType = isOverride ? 'APP_CONFIG_OVERRIDE' : 'APP_CONFIG'
      const fieldName = isOverride ? 'app_override' : 'app_definition'
      
      console.log(`💾 SupabaseAppBuilder: Saving ${entityType} for ${appId}`)

      // Generate Smart Code using the validation service
      const smartCode = isOverride 
        ? SmartCodeValidationService.generateAppConfigSmartCode('ENTITY', undefined, appId)
        : SmartCodeValidationService.generateAppConfigSmartCode('ENTITY', undefined, appId)
      
      // Validate the generated Smart Code
      const validation = SmartCodeValidationService.validateSmartCode(smartCode)
      if (!validation.isValid) {
        throw new Error(`Invalid Smart Code generated: ${smartCode} - ${validation.errorMessage}`)
      }
      
      console.log(`🧬 Generated Smart Code: ${smartCode}`)
      
      // Generate Smart Code for the data field
      const dataSmartCode = SmartCodeValidationService.generateAppConfigSmartCode('DATA', 'DEFINITION')

      const { data, error } = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'UPSERT',
        p_actor_user_id: actorId,
        p_organization_id: targetOrgId,
        p_entity: {
          entity_type: entityType,
          entity_code: appId,
          entity_name: config.name || `${appId} Configuration`,
          smart_code: smartCode
        },
        p_dynamic: {
          [fieldName]: {
            field_type: 'json',
            field_value_json: config,
            smart_code: dataSmartCode
          }
        },
        p_relationships: [],
        p_options: {
          validate_schema: true,
          emit_events: true
        }
      })

      if (error) {
        console.error(`❌ SupabaseAppBuilder: Failed to save ${entityType} for ${appId}:`, error)
        return { success: false, error: error.message }
      }

      // Invalidate cache
      this.invalidateCache(`${appId}:${targetOrgId}`)

      console.log(`✅ SupabaseAppBuilder: Successfully saved ${entityType} for ${appId}`)
      return { success: true }

    } catch (error: any) {
      console.error(`💥 SupabaseAppBuilder: Exception saving app config ${appId}:`, error)
      return { success: false, error: error.message }
    }
  }
}

// Export singleton instance
export const supabaseAppBuilder = SupabaseAppBuilder.getInstance()

// Export factory functions for easy usage
export async function loadFishExportsApp(
  actorId: string,
  organizationId?: string
): Promise<GeneratedAppRuntime> {
  return supabaseAppBuilder.loadAppConfig('fish-exports', actorId, {
    organization_id: organizationId,
    resolve_inheritance: true
  })
}

export async function loadRetailApp(
  actorId: string,
  organizationId?: string
): Promise<GeneratedAppRuntime> {
  return supabaseAppBuilder.loadAppConfig('retail', actorId, {
    organization_id: organizationId,
    resolve_inheritance: true
  })
}

export async function loadDynamicApp(
  appId: string,
  actorId: string,
  organizationId?: string,
  options?: AppLoadOptions
): Promise<GeneratedAppRuntime> {
  return supabaseAppBuilder.loadAppConfig(appId, actorId, {
    organization_id: organizationId,
    resolve_inheritance: true,
    ...options
  })
}