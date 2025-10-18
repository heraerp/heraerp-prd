/**
 * HERA Feature Flags System
 *
 * Controls gradual rollout of new features
 * Environment-based configuration for safe production deployment
 */

export const FEATURE_FLAGS = {
  // ============================================================================
  // UNIFIED ENTITY RPC (hera_entities_crud_v2)
  // ============================================================================

  /**
   * Global flag: Enable unified RPC for ALL entity types
   * Use this for final production rollout after per-entity testing
   */
  USE_UNIFIED_ENTITY_RPC: process.env.NEXT_PUBLIC_USE_UNIFIED_ENTITY_RPC === 'true',

  /**
   * Per-entity-type flags for gradual rollout
   * Start with one entity type, monitor, then expand
   */

  // Inventory entities (Phase 1 - Start here)
  USE_UNIFIED_RPC_STOCK_LEVEL:
    process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_STOCK_LEVEL === 'true',
  USE_UNIFIED_RPC_PRODUCT: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_PRODUCT === 'true',

  // Customer entities (Phase 2)
  USE_UNIFIED_RPC_CUSTOMER: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_CUSTOMER === 'true',
  USE_UNIFIED_RPC_CONTACT: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_CONTACT === 'true',

  // Salon entities (Phase 3)
  USE_UNIFIED_RPC_SERVICE: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_SERVICE === 'true',
  USE_UNIFIED_RPC_STAFF: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_STAFF === 'true',
  USE_UNIFIED_RPC_APPOINTMENT:
    process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_APPOINTMENT === 'true',

  // Organization entities (Phase 4)
  USE_UNIFIED_RPC_BRANCH: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_BRANCH === 'true',
  USE_UNIFIED_RPC_CATEGORY: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_CATEGORY === 'true',
  USE_UNIFIED_RPC_BRAND: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_BRAND === 'true'
} as const

/**
 * Hook to check feature flags in components
 *
 * @example
 * ```typescript
 * const isV2Enabled = useFeatureFlag('USE_UNIFIED_RPC_STOCK_LEVEL')
 * if (isV2Enabled) {
 *   console.log('Using V2 unified RPC')
 * }
 * ```
 */
export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] || false
}

/**
 * Check if unified RPC should be used for a specific entity type
 *
 * @example
 * ```typescript
 * if (shouldUseUnifiedRPC('STOCK_LEVEL')) {
 *   // Use V2 hook
 * } else {
 *   // Use V1 hook
 * }
 * ```
 */
export function shouldUseUnifiedRPC(entityType: string): boolean {
  // Global flag overrides all
  if (FEATURE_FLAGS.USE_UNIFIED_ENTITY_RPC) {
    return true
  }

  // Check per-entity-type flag
  const flagKey = `USE_UNIFIED_RPC_${entityType.toUpperCase()}` as keyof typeof FEATURE_FLAGS
  return FEATURE_FLAGS[flagKey] || false
}

/**
 * Get all enabled entity types for unified RPC
 * Useful for monitoring and logging
 */
export function getEnabledEntityTypes(): string[] {
  if (FEATURE_FLAGS.USE_UNIFIED_ENTITY_RPC) {
    return ['ALL']
  }

  const enabled: string[] = []
  Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
    if (key.startsWith('USE_UNIFIED_RPC_') && value === true) {
      const entityType = key.replace('USE_UNIFIED_RPC_', '')
      enabled.push(entityType)
    }
  })

  return enabled
}

/**
 * Log current feature flag state (for debugging)
 */
export function logFeatureFlagState() {
  console.log('[Feature Flags] Current state:', {
    global: FEATURE_FLAGS.USE_UNIFIED_ENTITY_RPC,
    enabled_entity_types: getEnabledEntityTypes(),
    all_flags: FEATURE_FLAGS
  })
}
