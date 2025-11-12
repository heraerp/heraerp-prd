/**
 * HERA Entity Metadata Context Provider
 * Smart Code: HERA.UNIVERSAL.CONTEXT.METADATA_PROVIDER.v1
 * 
 * Global context provider for entity metadata resolution service
 * Makes metadata resolver available throughout the React component tree
 */

'use client'

import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { 
  resolveEntityMetadata, 
  type EntityMetadata, 
  type MetadataResolutionOptions,
  invalidateMetadataCache,
  clearMetadataCache,
  getMetadataCacheStats
} from './entity-metadata-resolver'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Context interface
interface EntityMetadataContextValue {
  // Core metadata resolution
  resolveMetadata: (
    moduleHint: string, 
    entityHint: string, 
    options?: Partial<MetadataResolutionOptions>
  ) => Promise<{ success: boolean; metadata: EntityMetadata | null; error?: string }>
  
  // Cache management
  invalidateCache: (pattern: string) => void
  clearCache: () => void
  getCacheStats: () => { size: number; keys: string[] }
  
  // Convenience methods
  resolveCustomerMetadata: (orgId?: string) => Promise<EntityMetadata | null>
  resolveVendorMetadata: (orgId?: string) => Promise<EntityMetadata | null>
  resolveProductMetadata: (orgId?: string) => Promise<EntityMetadata | null>
  
  // Batch operations
  resolveMultipleMetadata: (
    requests: Array<{ module: string; entity: string }>
  ) => Promise<Array<{ module: string; entity: string; metadata: EntityMetadata | null; error?: string }>>
}

// Create context
const EntityMetadataContext = createContext<EntityMetadataContextValue | null>(null)

// Provider component
export function EntityMetadataProvider({ children }: { children: React.ReactNode }) {
  const { user, organization } = useHERAAuth()

  // Core metadata resolution function
  const resolveMetadata = useCallback(async (
    moduleHint: string,
    entityHint: string,
    options: Partial<MetadataResolutionOptions> = {}
  ) => {
    if (!user?.id || !organization?.id) {
      return {
        success: false,
        metadata: null,
        error: 'Missing user or organization context'
      }
    }

    const fullOptions: MetadataResolutionOptions = {
      organizationId: organization.id,
      actorUserId: user.entity_id || user.id,
      includePermissions: true,
      fallbackToPlatform: true,
      ...options
    }

    try {
      return await resolveEntityMetadata(moduleHint, entityHint, fullOptions)
    } catch (error) {
      return {
        success: false,
        metadata: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [user?.id, organization?.id])

  // Cache management functions
  const invalidateCache = useCallback((pattern: string) => {
    invalidateMetadataCache(pattern)
  }, [])

  const clearCache = useCallback(() => {
    clearMetadataCache()
  }, [])

  const getCacheStats = useCallback(() => {
    return getMetadataCacheStats()
  }, [])

  // Convenience methods for common entities
  const resolveCustomerMetadata = useCallback(async (orgId?: string) => {
    const options = orgId ? { organizationId: orgId } : {}
    const result = await resolveMetadata('crm', 'customer', options)
    return result.success ? result.metadata : null
  }, [resolveMetadata])

  const resolveVendorMetadata = useCallback(async (orgId?: string) => {
    const options = orgId ? { organizationId: orgId } : {}
    const result = await resolveMetadata('procurement', 'vendor', options)
    return result.success ? result.metadata : null
  }, [resolveMetadata])

  const resolveProductMetadata = useCallback(async (orgId?: string) => {
    const options = orgId ? { organizationId: orgId } : {}
    const result = await resolveMetadata('inventory', 'product', options)
    return result.success ? result.metadata : null
  }, [resolveMetadata])

  // Batch metadata resolution
  const resolveMultipleMetadata = useCallback(async (
    requests: Array<{ module: string; entity: string }>
  ) => {
    const results = await Promise.allSettled(
      requests.map(async ({ module, entity }) => {
        const result = await resolveMetadata(module, entity)
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
  }, [resolveMetadata])

  // Memoize context value
  const contextValue = useMemo<EntityMetadataContextValue>(() => ({
    resolveMetadata,
    invalidateCache,
    clearCache,
    getCacheStats,
    resolveCustomerMetadata,
    resolveVendorMetadata,
    resolveProductMetadata,
    resolveMultipleMetadata
  }), [
    resolveMetadata,
    invalidateCache,
    clearCache,
    getCacheStats,
    resolveCustomerMetadata,
    resolveVendorMetadata,
    resolveProductMetadata,
    resolveMultipleMetadata
  ])

  return (
    <EntityMetadataContext.Provider value={contextValue}>
      {children}
    </EntityMetadataContext.Provider>
  )
}

// Hook for consuming the context
export function useEntityMetadata() {
  const context = useContext(EntityMetadataContext)
  
  if (!context) {
    throw new Error('useEntityMetadata must be used within an EntityMetadataProvider')
  }
  
  return context
}

// Hook with automatic error handling
export function useEntityMetadataWithErrorHandling() {
  const metadata = useEntityMetadata()
  
  return {
    ...metadata,
    
    // Safe resolver that handles errors gracefully
    safeResolveMetadata: async (
      moduleHint: string,
      entityHint: string,
      options?: Partial<MetadataResolutionOptions>
    ) => {
      try {
        const result = await metadata.resolveMetadata(moduleHint, entityHint, options)
        return result
      } catch (error) {
        console.error('🚨 Metadata resolution failed:', error)
        return {
          success: false,
          metadata: null,
          error: 'Metadata service unavailable'
        }
      }
    }
  }
}

// Utility hook for specific entity types with loading states
export function useEntityMetadataLoader(module: string, entity: string, autoLoad = true) {
  const { resolveMetadata } = useEntityMetadata()
  const [loading, setLoading] = React.useState(false)
  const [metadata, setMetadata] = React.useState<EntityMetadata | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const loadMetadata = useCallback(async () => {
    if (!module || !entity) return

    setLoading(true)
    setError(null)

    try {
      const result = await resolveMetadata(module, entity)
      if (result.success) {
        setMetadata(result.metadata)
      } else {
        setError(result.error || 'Failed to load metadata')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [module, entity, resolveMetadata])

  React.useEffect(() => {
    if (autoLoad) {
      loadMetadata()
    }
  }, [autoLoad, loadMetadata])

  return {
    metadata,
    loading,
    error,
    reload: loadMetadata
  }
}

export default EntityMetadataContext