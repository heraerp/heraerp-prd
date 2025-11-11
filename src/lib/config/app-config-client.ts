/**
 * HERA v2.4 Platform Configuration Client SDK
 * Smart Code: HERA.CLIENT.CONFIG.PLATFORM.v1
 * 
 * Complete client SDK for managing JSON-driven ERP configurations
 * Integrates with HERA API v2 security gateway
 */

import { 
  HeraAppConfig, 
  AppConfigResponse, 
  ConfigValidationResponse,
  ConfigOperationResult,
  AppConfigSmartCodes,
  ConfigCacheEntry
} from '@/types/app-config'
import { HeraClient } from '@/lib/hera/client'

// =============================================================================
// Configuration Cache Manager
// =============================================================================

class ConfigCacheManager {
  private cache = new Map<string, ConfigCacheEntry>()
  private readonly TTL_MINUTES = 5

  private getCacheKey(orgId: string, appId: string): string {
    return `config:${orgId}:${appId}`
  }

  get(orgId: string, appId: string): HeraAppConfig | null {
    const key = this.getCacheKey(orgId, appId)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (new Date() > entry.expires_at) {
      this.cache.delete(key)
      return null
    }
    
    return entry.merged_config
  }

  set(orgId: string, appId: string, config: HeraAppConfig, version: string = 'v2.4.0') {
    const key = this.getCacheKey(orgId, appId)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.TTL_MINUTES * 60 * 1000)
    
    this.cache.set(key, {
      app_id: appId,
      organization_id: orgId,
      merged_config: config,
      cached_at: now,
      expires_at: expiresAt,
      version
    })
  }

  invalidate(orgId: string, appId?: string) {
    if (appId) {
      const key = this.getCacheKey(orgId, appId)
      this.cache.delete(key)
    } else {
      // Invalidate all configs for org
      for (const [key] of this.cache) {
        if (key.startsWith(`config:${orgId}:`)) {
          this.cache.delete(key)
        }
      }
    }
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    const now = new Date()
    const entries = Array.from(this.cache.values())
    
    return {
      total_entries: entries.length,
      valid_entries: entries.filter(e => e.expires_at > now).length,
      expired_entries: entries.filter(e => e.expires_at <= now).length,
      cache_size_kb: Math.round(JSON.stringify(entries).length / 1024)
    }
  }
}

// =============================================================================
// Configuration Client SDK
// =============================================================================

export class AppConfigClient {
  private cache = new ConfigCacheManager()
  
  constructor(
    private heraClient: HeraClient,
    private orgId: string
  ) {}

  /**
   * Get merged configuration for an app (platform + org override)
   * Automatically handles caching for performance
   */
  async getConfig(appId: string, useCache: boolean = true): Promise<AppConfigResponse> {
    // Try cache first if enabled
    if (useCache) {
      const cached = this.cache.get(this.orgId, appId)
      if (cached) {
        return {
          app_id: appId,
          merged_config: cached,
          has_platform_config: true,
          has_org_override: true,
          merged_from: ['cache'],
          cache_key: `${this.orgId}:${appId}`,
          cached_at: new Date().toISOString()
        }
      }
    }

    // Fetch from API
    const response = await this.heraClient.command({
      op: 'app_config',
      action: 'READ',
      app_id: appId
    })

    if (!response.ok) {
      throw new Error(`Failed to load config for ${appId}: ${response.error}`)
    }

    const configData = response.data as AppConfigResponse
    
    // Cache the result
    if (useCache && configData.merged_config) {
      this.cache.set(this.orgId, appId, configData.merged_config)
    }

    return configData
  }

  /**
   * Create or update platform configuration (platform org only)
   */
  async createPlatformConfig(appId: string, config: HeraAppConfig): Promise<ConfigOperationResult> {
    const response = await this.heraClient.command({
      op: 'app_config',
      action: 'CREATE',
      app_id: appId,
      config_data: config,
      is_override: false
    })

    if (!response.ok) {
      throw new Error(`Failed to create platform config: ${response.error}`)
    }

    // Invalidate cache
    this.cache.invalidate(this.orgId, appId)

    return response.data as ConfigOperationResult
  }

  /**
   * Create or update organization override configuration
   */
  async createOrgOverride(appId: string, override: Partial<HeraAppConfig>): Promise<ConfigOperationResult> {
    const response = await this.heraClient.command({
      op: 'app_config',
      action: 'CREATE',
      app_id: appId,
      config_data: override,
      is_override: true
    })

    if (!response.ok) {
      throw new Error(`Failed to create org override: ${response.error}`)
    }

    // Invalidate cache
    this.cache.invalidate(this.orgId, appId)

    return response.data as ConfigOperationResult
  }

  /**
   * Update existing configuration
   */
  async updateConfig(appId: string, config: HeraAppConfig | Partial<HeraAppConfig>, isOverride: boolean = false): Promise<ConfigOperationResult> {
    const response = await this.heraClient.command({
      op: 'app_config',
      action: 'UPDATE',
      app_id: appId,
      config_data: config,
      is_override: isOverride
    })

    if (!response.ok) {
      throw new Error(`Failed to update config: ${response.error}`)
    }

    // Invalidate cache
    this.cache.invalidate(this.orgId, appId)

    return response.data as ConfigOperationResult
  }

  /**
   * Delete configuration
   */
  async deleteConfig(appId: string, isOverride: boolean = false): Promise<ConfigOperationResult> {
    const response = await this.heraClient.command({
      op: 'app_config',
      action: 'DELETE',
      app_id: appId,
      is_override: isOverride
    })

    if (!response.ok) {
      throw new Error(`Failed to delete config: ${response.error}`)
    }

    // Invalidate cache
    this.cache.invalidate(this.orgId, appId)

    return response.data as ConfigOperationResult
  }

  /**
   * Validate configuration JSON against schema
   */
  async validateConfig(config: HeraAppConfig | Partial<HeraAppConfig>): Promise<ConfigValidationResponse> {
    const response = await this.heraClient.command({
      op: 'app_config',
      action: 'VALIDATE',
      config_data: config
    })

    if (!response.ok) {
      throw new Error(`Failed to validate config: ${response.error}`)
    }

    return response.data as ConfigValidationResponse
  }

  /**
   * Get entity definition from configuration
   */
  async getEntityDefinition(appId: string, entityType: string) {
    const config = await this.getConfig(appId)
    const entity = config.merged_config.entities?.find(e => e.entity_type === entityType)
    
    if (!entity) {
      throw new Error(`Entity type ${entityType} not found in app ${appId}`)
    }
    
    return entity
  }

  /**
   * Get transaction definition from configuration
   */
  async getTransactionDefinition(appId: string, transactionType: string) {
    const config = await this.getConfig(appId)
    const transaction = config.merged_config.transactions?.find(t => t.transaction_type === transactionType)
    
    if (!transaction) {
      throw new Error(`Transaction type ${transactionType} not found in app ${appId}`)
    }
    
    return transaction
  }

  /**
   * Get screen definition from configuration
   */
  async getScreenDefinition(appId: string, screenId: string) {
    const config = await this.getConfig(appId)
    const screen = config.merged_config.screens?.find(s => s.screen_id === screenId)
    
    if (!screen) {
      throw new Error(`Screen ${screenId} not found in app ${appId}`)
    }
    
    return screen
  }

  /**
   * List all available app configurations for organization
   */
  async listConfigs(): Promise<string[]> {
    const response = await this.heraClient.command({
      op: 'app_config',
      action: 'LIST'
    })

    if (!response.ok) {
      throw new Error(`Failed to list configs: ${response.error}`)
    }

    return response.data.app_ids as string[]
  }

  /**
   * Clear configuration cache
   */
  clearCache(appId?: string) {
    this.cache.invalidate(this.orgId, appId)
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Generate Smart Code for configuration entity
   */
  generateSmartCode(appId: string, isOverride: boolean = false): string {
    return isOverride 
      ? AppConfigSmartCodes.ORG_OVERRIDE(appId)
      : AppConfigSmartCodes.PLATFORM_CONFIG(appId)
  }

  /**
   * Export configuration as JSON
   */
  async exportConfig(appId: string, includeOverride: boolean = true): Promise<string> {
    const config = await this.getConfig(appId, false) // Don't use cache
    
    const exportData = {
      exported_at: new Date().toISOString(),
      app_id: appId,
      organization_id: this.orgId,
      merged_from: config.merged_from,
      config: config.merged_config
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import configuration from JSON
   */
  async importConfig(appId: string, configJson: string, isOverride: boolean = false): Promise<ConfigOperationResult> {
    let configData: HeraAppConfig | Partial<HeraAppConfig>
    
    try {
      const parsed = JSON.parse(configJson)
      configData = parsed.config || parsed
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error}`)
    }

    // Validate before importing
    const validation = await this.validateConfig(configData)
    if (!validation.is_valid) {
      throw new Error(`Configuration validation failed: ${JSON.stringify(validation.errors)}`)
    }

    // Create/update the configuration
    return isOverride 
      ? this.createOrgOverride(appId, configData as Partial<HeraAppConfig>)
      : this.createPlatformConfig(appId, configData as HeraAppConfig)
  }
}

// =============================================================================
// Configuration Factory
// =============================================================================

export class ConfigFactory {
  /**
   * Create a minimal entity configuration
   */
  static createEntity(entityType: string, smartCodePrefix: string): HeraAppConfig {
    return {
      app_id: entityType.toLowerCase(),
      version: 'v2.4.0',
      metadata: {
        name: `${entityType} Configuration`,
        description: `Configuration for ${entityType} entity`,
        module: 'generic',
        icon: 'database',
        category: 'Master Data'
      },
      entities: [{
        entity_type: entityType,
        smart_code_prefix: smartCodePrefix,
        display_name: entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase(),
        display_name_plural: entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase() + 's',
        icon: 'database',
        color: '#3b82f6',
        fields: [
          {
            field_name: 'name',
            display_label: 'Name',
            field_type: 'text',
            is_required: true,
            field_order: 1,
            validation: {
              min_length: 1,
              max_length: 255,
              error_message: 'Name is required'
            },
            ui_hints: {
              input_type: 'text',
              placeholder: `Enter ${entityType.toLowerCase()} name`
            }
          }
        ]
      }]
    }
  }

  /**
   * Create a minimal transaction configuration
   */
  static createTransaction(transactionType: string, smartCodePrefix: string): HeraAppConfig {
    return {
      app_id: transactionType.toLowerCase(),
      version: 'v2.4.0',
      metadata: {
        name: `${transactionType} Configuration`,
        description: `Configuration for ${transactionType} transaction`,
        module: 'financial',
        icon: 'receipt',
        category: 'Transactions'
      },
      transactions: [{
        transaction_type: transactionType,
        smart_code_prefix: smartCodePrefix,
        display_name: transactionType.charAt(0).toUpperCase() + transactionType.slice(1).toLowerCase(),
        display_name_plural: transactionType.charAt(0).toUpperCase() + transactionType.slice(1).toLowerCase() + 's',
        icon: 'receipt',
        color: '#22c55e',
        header_fields: [
          {
            field_name: 'transaction_date',
            display_label: 'Date',
            field_type: 'date',
            is_required: true,
            field_order: 1,
            validation: {
              error_message: 'Transaction date is required'
            },
            ui_hints: {
              input_type: 'date',
              default: 'today'
            }
          }
        ],
        line_fields: [
          {
            field_name: 'description',
            display_label: 'Description',
            field_type: 'text',
            is_required: true,
            field_order: 1,
            validation: {
              min_length: 1,
              error_message: 'Description is required'
            },
            ui_hints: {
              input_type: 'text',
              placeholder: 'Enter description'
            }
          },
          {
            field_name: 'amount',
            display_label: 'Amount',
            field_type: 'number',
            is_required: true,
            field_order: 2,
            validation: {
              min: 0,
              error_message: 'Amount must be greater than 0'
            },
            ui_hints: {
              input_type: 'number',
              format: 'currency',
              currency: 'AED'
            }
          }
        ]
      }]
    }
  }
}

// =============================================================================
// Hook for React Components
// =============================================================================

export function useAppConfig(appId: string, orgId: string, heraClient: HeraClient) {
  const client = new AppConfigClient(heraClient, orgId)
  
  return {
    client,
    getConfig: (useCache = true) => client.getConfig(appId, useCache),
    updateConfig: (config: HeraAppConfig | Partial<HeraAppConfig>, isOverride = false) => 
      client.updateConfig(appId, config, isOverride),
    validateConfig: (config: HeraAppConfig | Partial<HeraAppConfig>) => 
      client.validateConfig(config),
    clearCache: () => client.clearCache(appId),
    exportConfig: () => client.exportConfig(appId),
    importConfig: (json: string, isOverride = false) => 
      client.importConfig(appId, json, isOverride)
  }
}