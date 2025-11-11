/**
 * HERA Entity Metadata Service (Singleton)
 * Smart Code: HERA.UNIVERSAL.SERVICE.METADATA_SINGLETON.v1
 * 
 * Global singleton service for entity metadata resolution
 * Can be used in both React and non-React contexts (API routes, middleware, etc.)
 */

import { 
  resolveEntityMetadata, 
  type EntityMetadata, 
  type MetadataResolutionOptions,
  invalidateMetadataCache,
  clearMetadataCache,
  getMetadataCacheStats
} from './entity-metadata-resolver'

export interface EntityMetadataServiceConfig {
  defaultFallbackToPlatform?: boolean
  defaultIncludePermissions?: boolean
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
}

class EntityMetadataService {
  private config: EntityMetadataServiceConfig
  private static instance: EntityMetadataService | null = null

  private constructor(config: EntityMetadataServiceConfig = {}) {
    this.config = {
      defaultFallbackToPlatform: true,
      defaultIncludePermissions: true,
      logLevel: 'info',
      ...config
    }
  }

  // Singleton pattern
  public static getInstance(config?: EntityMetadataServiceConfig): EntityMetadataService {
    if (!EntityMetadataService.instance) {
      EntityMetadataService.instance = new EntityMetadataService(config)
    }
    return EntityMetadataService.instance
  }

  // Update configuration
  public updateConfig(config: Partial<EntityMetadataServiceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // Get current configuration
  public getConfig(): EntityMetadataServiceConfig {
    return { ...this.config }
  }

  // Core metadata resolution
  public async resolveMetadata(
    moduleHint: string,
    entityHint: string,
    options: MetadataResolutionOptions
  ): Promise<{ success: boolean; metadata: EntityMetadata | null; error?: string }> {
    const fullOptions: MetadataResolutionOptions = {
      includePermissions: this.config.defaultIncludePermissions!,
      fallbackToPlatform: this.config.defaultFallbackToPlatform!,
      ...options
    }

    this.log('info', `🔍 Resolving metadata: ${moduleHint}.${entityHint}`, { 
      organizationId: options.organizationId?.slice(0, 8) + '...',
      actorUserId: options.actorUserId?.slice(0, 8) + '...'
    })

    try {
      const result = await resolveEntityMetadata(moduleHint, entityHint, fullOptions)
      
      if (result.success) {
        this.log('info', `✅ Metadata resolved: ${result.metadata?.source}`, {
          entityType: result.metadata?.entity_type,
          fieldsCount: result.metadata?.fields.length
        })
      } else {
        this.log('warn', `❌ Metadata resolution failed: ${result.error}`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log('error', `🚨 Metadata resolution error: ${errorMessage}`, { error })
      
      return {
        success: false,
        metadata: null,
        error: errorMessage
      }
    }
  }

  // Batch metadata resolution
  public async resolveBatchMetadata(
    requests: Array<{ 
      module: string
      entity: string
      organizationId: string
      actorUserId: string
      options?: Partial<MetadataResolutionOptions>
    }>
  ): Promise<Array<{
    module: string
    entity: string
    metadata: EntityMetadata | null
    error?: string
  }>> {
    this.log('info', `🔄 Batch resolving ${requests.length} metadata requests`)

    const results = await Promise.allSettled(
      requests.map(async ({ module, entity, organizationId, actorUserId, options = {} }) => {
        const result = await this.resolveMetadata(module, entity, {
          organizationId,
          actorUserId,
          ...options
        })
        
        return {
          module,
          entity,
          metadata: result.metadata,
          error: result.error
        }
      })
    )

    return results.map((result, index) => {
      const request = requests[index]
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          module: request.module,
          entity: request.entity,
          metadata: null,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        }
      }
    })
  }

  // Common entity resolvers with defaults
  public async resolveCustomerMetadata(
    organizationId: string,
    actorUserId: string,
    options: Partial<MetadataResolutionOptions> = {}
  ): Promise<EntityMetadata | null> {
    const result = await this.resolveMetadata('crm', 'customer', {
      organizationId,
      actorUserId,
      ...options
    })
    return result.success ? result.metadata : null
  }

  public async resolveVendorMetadata(
    organizationId: string,
    actorUserId: string,
    options: Partial<MetadataResolutionOptions> = {}
  ): Promise<EntityMetadata | null> {
    const result = await this.resolveMetadata('procurement', 'vendor', {
      organizationId,
      actorUserId,
      ...options
    })
    return result.success ? result.metadata : null
  }

  public async resolveProductMetadata(
    organizationId: string,
    actorUserId: string,
    options: Partial<MetadataResolutionOptions> = {}
  ): Promise<EntityMetadata | null> {
    const result = await this.resolveMetadata('inventory', 'product', {
      organizationId,
      actorUserId,
      ...options
    })
    return result.success ? result.metadata : null
  }

  // Cache management
  public invalidateCache(pattern: string): void {
    this.log('info', `🗑️ Invalidating cache pattern: ${pattern}`)
    invalidateMetadataCache(pattern)
  }

  public clearCache(): void {
    this.log('info', '🗑️ Clearing entire metadata cache')
    clearMetadataCache()
  }

  public getCacheStats(): { size: number; keys: string[] } {
    const stats = getMetadataCacheStats()
    this.log('debug', `📊 Cache stats: ${stats.size} entries`)
    return stats
  }

  // Utility methods
  public async resolveMetadataFromRequest(request: {
    searchParams: URLSearchParams
    organizationId: string
    actorUserId: string
    options?: Partial<MetadataResolutionOptions>
  }): Promise<{ success: boolean; metadata: EntityMetadata | null; error?: string }> {
    const moduleHint = request.searchParams.get('module')
    const entityHint = request.searchParams.get('type')

    if (!moduleHint || !entityHint) {
      return {
        success: false,
        metadata: null,
        error: 'Missing required URL parameters: module and type'
      }
    }

    return this.resolveMetadata(moduleHint, entityHint, {
      organizationId: request.organizationId,
      actorUserId: request.actorUserId,
      ...(request.options || {})
    })
  }

  // Preload common metadata for an organization
  public async preloadCommonMetadata(
    organizationId: string,
    actorUserId: string
  ): Promise<{
    customer: EntityMetadata | null
    vendor: EntityMetadata | null
    product: EntityMetadata | null
  }> {
    this.log('info', `🚀 Preloading common metadata for org: ${organizationId.slice(0, 8)}...`)

    const [customer, vendor, product] = await Promise.all([
      this.resolveCustomerMetadata(organizationId, actorUserId),
      this.resolveVendorMetadata(organizationId, actorUserId),
      this.resolveProductMetadata(organizationId, actorUserId)
    ])

    return { customer, vendor, product }
  }

  // Health check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    cache: { size: number }
    timestamp: string
  }> {
    try {
      const cacheStats = this.getCacheStats()
      
      return {
        status: 'healthy',
        cache: { size: cacheStats.size },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        cache: { size: 0 },
        timestamp: new Date().toISOString()
      }
    }
  }

  // Logging utility
  private log(level: string, message: string, metadata?: any): void {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 }
    const configLevel = levels[this.config.logLevel!] || 2
    const messageLevel = levels[level as keyof typeof levels] || 2

    if (messageLevel <= configLevel) {
      const logData = { level, message, timestamp: new Date().toISOString(), ...metadata }
      
      if (level === 'error') {
        console.error('[EntityMetadataService]', logData)
      } else if (level === 'warn') {
        console.warn('[EntityMetadataService]', logData)
      } else {
        console.log('[EntityMetadataService]', logData)
      }
    }
  }
}

// Export singleton instance
export const entityMetadataService = EntityMetadataService.getInstance()

// Export class for custom instances if needed
export { EntityMetadataService }

// Export helper functions for common patterns
export const createEntityMetadataService = (config?: EntityMetadataServiceConfig) => {
  return EntityMetadataService.getInstance(config)
}

export const resolveEntityMetadataFromService = async (
  module: string,
  entity: string,
  organizationId: string,
  actorUserId: string,
  options?: Partial<MetadataResolutionOptions>
) => {
  return entityMetadataService.resolveMetadata(module, entity, {
    organizationId,
    actorUserId,
    ...options
  })
}

export default entityMetadataService