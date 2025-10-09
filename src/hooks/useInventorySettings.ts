/**
 * HERA Enterprise Inventory Settings Hook
 * Smart Code: HERA.HOOKS.INVENTORY.SETTINGS.V1
 *
 * Enterprise-grade inventory management control with three levels:
 * 1. Organization-level: Master on/off switch
 * 2. Product-level: Per-product inventory tracking flag
 * 3. Module-level: Feature activation for SaaS tiers
 *
 * Features:
 * - Hierarchical control (org > module > product)
 * - Real-time settings sync
 * - Type-safe mutations
 * - Audit trail for setting changes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiV2 } from '@/lib/client/fetchV2'

// ==================== TYPES ====================

export interface InventorySettings {
  organizationId: string
  // Level 1: Organization-wide master switch
  inventoryEnabled: boolean
  // Level 2: Module activation (for SaaS tiers)
  inventoryModuleActive: boolean
  // Settings
  defaultRequiresInventory: boolean // Default for new products
  trackByBranch: boolean // Multi-location tracking
  allowNegativeStock: boolean // Can products go below zero
  autoReorderEnabled: boolean // Automatic reorder point alerts
  // Timestamps
  updatedAt?: string
  updatedBy?: string
}

export interface UpdateInventorySettingsRequest {
  organizationId: string
  inventoryEnabled?: boolean
  defaultRequiresInventory?: boolean
  trackByBranch?: boolean
  allowNegativeStock?: boolean
  autoReorderEnabled?: boolean
}

// ==================== HOOK ====================

export function useInventorySettings(organizationId?: string) {
  const queryClient = useQueryClient()

  // Fetch current settings
  const {
    data: settings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inventory-settings', organizationId] as const,
    queryFn: async () => {
      console.log('[useInventorySettings] Fetching settings for org:', organizationId)

      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      try {
        // Fetch from organization's dynamic data
        const { data, error } = await apiV2.get('dynamic-data', {
          p_entity_id: organizationId
          // Note: Not filtering by field_name so we get all fields for this entity
        })

        console.log('[useInventorySettings] API response:', {
          success: !!data,
          hasError: !!error,
          fieldCount: data?.data?.length || 0
        })

        if (error) {
          console.error('[useInventorySettings] API error:', error)
          throw new Error(`Failed to fetch inventory settings: ${error.message || 'Unknown error'}`)
        }

        // Map dynamic data to settings object
        // API returns { success: true, data: [...] }
        const fields = data?.data || []
        const getValue = (fieldName: string, defaultValue: any) => {
          const field = fields.find((f: any) => f.field_name === fieldName)
          return field ? field.field_value_boolean ?? defaultValue : defaultValue
        }

        const settings = {
          organizationId,
          // Enterprise-grade: Disabled by default for safety, explicit opt-in required
          inventoryEnabled: getValue('inventory_management_enabled', false),
          inventoryModuleActive: true, // TODO: Check from organization.metadata.active_modules
          defaultRequiresInventory: getValue('inventory_default_tracking', false),
          trackByBranch: getValue('inventory_track_by_branch', true),
          allowNegativeStock: getValue('inventory_allow_negative', false),
          autoReorderEnabled: getValue('inventory_auto_reorder', true)
        } as InventorySettings

        console.log('[useInventorySettings] Settings loaded successfully')
        return settings
      } catch (err: any) {
        console.error('[useInventorySettings] Error:', err)
        throw err
      }
    },
    enabled: !!organizationId,
    staleTime: 60000, // 1 minute
    gcTime: 300000 // 5 minutes
  })

  // Update settings mutation with optimistic updates
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: UpdateInventorySettingsRequest) => {
      if (!updates.organizationId) {
        throw new Error('Organization ID is required')
      }

      // Build dynamic data updates
      const fields: any[] = []

      if (updates.inventoryEnabled !== undefined) {
        fields.push({
          field_name: 'inventory_management_enabled',
          field_type: 'boolean',
          field_value_boolean: updates.inventoryEnabled,
          smart_code: 'HERA.ORG.SETTINGS.INVENTORY.ENABLED.V1'
        })
      }

      if (updates.defaultRequiresInventory !== undefined) {
        fields.push({
          field_name: 'inventory_default_tracking',
          field_type: 'boolean',
          field_value_boolean: updates.defaultRequiresInventory,
          smart_code: 'HERA.ORG.SETTINGS.INVENTORY.DEFAULT.V1'
        })
      }

      if (updates.trackByBranch !== undefined) {
        fields.push({
          field_name: 'inventory_track_by_branch',
          field_type: 'boolean',
          field_value_boolean: updates.trackByBranch,
          smart_code: 'HERA.ORG.SETTINGS.INVENTORY.BRANCH.V1'
        })
      }

      if (updates.allowNegativeStock !== undefined) {
        fields.push({
          field_name: 'inventory_allow_negative',
          field_type: 'boolean',
          field_value_boolean: updates.allowNegativeStock,
          smart_code: 'HERA.ORG.SETTINGS.INVENTORY.NEGATIVE.V1'
        })
      }

      if (updates.autoReorderEnabled !== undefined) {
        fields.push({
          field_name: 'inventory_auto_reorder',
          field_type: 'boolean',
          field_value_boolean: updates.autoReorderEnabled,
          smart_code: 'HERA.ORG.SETTINGS.INVENTORY.REORDER.V1'
        })
      }

      console.log('[useInventorySettings] Updating settings:', {
        organizationId: updates.organizationId,
        updates,
        fields
      })

      // Batch update all fields
      const payload = {
        p_entity_id: updates.organizationId,
        p_smart_code: 'HERA.ORG.SETTINGS.INVENTORY.V1',
        p_fields: fields
      }

      console.log('[useInventorySettings] API payload:', payload)

      const { data, error } = await apiV2.post('dynamic-data/batch', payload)

      if (error) {
        console.error('[useInventorySettings] Update failed:', error)
        throw new Error(`Failed to update settings: ${error.message || 'Unknown error'}`)
      }

      console.log('[useInventorySettings] Update successful:', {
        requested: fields.length,
        processed: data?.metadata?.processed || 0,
        failed: data?.metadata?.failed || 0,
        errors: data?.errors
      })

      // Check if any fields failed to save
      if (data?.errors && data.errors.length > 0) {
        console.error('[useInventorySettings] Field errors:', data.errors)
        const errorDetails = data.errors.map((e: any) => `${e.field_name}: ${e.error}`).join('; ')
        throw new Error(`Database error - ${errorDetails}`)
      }

      return data
    },
    // Optimistic update - update UI immediately
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory-settings', organizationId] })

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<InventorySettings>(['inventory-settings', organizationId])

      // Optimistically update to the new value
      queryClient.setQueryData<InventorySettings>(['inventory-settings', organizationId], (old) => {
        if (!old) return old
        return {
          ...old,
          ...updates
        }
      })

      // Return a context object with the snapshotted value
      return { previousSettings }
    },
    // If mutation fails, use the context returned from onMutate to roll back
    onError: (err, updates, context) => {
      console.error('[useInventorySettings] Mutation error, rolling back:', err)
      if (context?.previousSettings) {
        queryClient.setQueryData(['inventory-settings', organizationId], context.previousSettings)
      }
    },
    // Always refetch after error or success to ensure we have fresh data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-settings', organizationId] })
    }
  })

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending
  }
}

// ==================== HELPERS ====================

/**
 * Check if inventory should be shown for a product
 * Respects organizational and product-level settings
 */
export function shouldShowInventory(
  settings?: InventorySettings,
  productRequiresInventory?: boolean
): boolean {
  // Level 1: Organization disabled inventory completely
  if (!settings?.inventoryEnabled) return false

  // Level 2: Module not active (SaaS tier restriction)
  if (!settings?.inventoryModuleActive) return false

  // Level 3: Product-specific flag (if provided)
  if (productRequiresInventory !== undefined) {
    return productRequiresInventory
  }

  // Default: Use organization default
  return settings?.defaultRequiresInventory ?? false
}

/**
 * Check if inventory chip should be displayed
 */
export function shouldDisplayInventoryChip(
  settings?: InventorySettings,
  product?: { requires_inventory?: boolean }
): boolean {
  if (!settings?.inventoryEnabled) return false
  return product?.requires_inventory ?? false
}
