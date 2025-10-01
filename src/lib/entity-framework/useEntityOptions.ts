'use client'

import { useQuery } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Types for select options
export interface SelectOption {
  value: string
  label: string
  data?: any
}

export interface EntitySelectOptions {
  options: SelectOption[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Helper to get authentication headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  // For the entity config demo, always use the demo token
  // This ensures we have the correct organization_id and permissions
  console.log('🚀 Using demo token for entity options')
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo-token-salon-receptionist'
  }
}

/**
 * Hook to fetch entity options for select components
 * Converts entities into { value, label } format for dropdowns
 */
export function useEntityOptions(config: {
  entityType: string
  displayField?: string
  valueField?: string
  searchFields?: string[]
  filters?: Record<string, any>
  enabled?: boolean
}): EntitySelectOptions {
  const { organization } = useHERAAuth()
  const organizationId = organization?.id

  const {
    entityType,
    displayField = 'entity_name',
    valueField = 'id',
    searchFields = ['entity_name'],
    filters = {},
    enabled = true
  } = config

  // Build query key
  const queryKey = ['entity-options', entityType, organizationId, displayField, valueField, filters]

  // Fetch entities and convert to options
  const {
    data: optionsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        entity_type: entityType,
        ...filters,
        limit: (filters.limit || 1000).toString(),
        offset: (filters.offset || 0).toString(),
        include_dynamic: 'true'
      })

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/v2/entities?${params}`, {
        headers
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch entity options')
      }
      
      const result = await response.json()
      const entities = result?.data || []

      // Convert entities to select options
      const options: SelectOption[] = entities.map((entity: any) => {
        // Get display value from entity or dynamic fields
        let displayValue = entity[displayField]
        if (!displayValue && entity.dynamic_fields && entity.dynamic_fields[displayField]) {
          displayValue = entity.dynamic_fields[displayField]
        }
        if (!displayValue) {
          displayValue = entity.entity_name || entity.id
        }

        // Get value field
        let value = entity[valueField]
        if (!value && entity.dynamic_fields && entity.dynamic_fields[valueField]) {
          value = entity.dynamic_fields[valueField]
        }
        if (!value) {
          value = entity.id
        }

        return {
          value: String(value),
          label: String(displayValue),
          data: entity
        }
      })

      // Sort options by label
      options.sort((a, b) => a.label.localeCompare(b.label))

      return options
    },
    enabled: enabled && !!entityType
  })

  return {
    options: optionsData || [],
    isLoading,
    error: (error as any)?.message || null,
    refetch
  }
}

/**
 * Hook for category options (commonly used)
 */
export function useCategoryOptions(filters?: Record<string, any>): EntitySelectOptions {
  return useEntityOptions({
    entityType: 'CATEGORY',
    displayField: 'entity_name',
    filters: {
      active: true,
      ...filters
    }
  })
}

/**
 * Hook for brand options (commonly used)
 */
export function useBrandOptions(filters?: Record<string, any>): EntitySelectOptions {
  return useEntityOptions({
    entityType: 'BRAND',
    displayField: 'entity_name',
    filters: {
      active: true,
      ...filters
    }
  })
}

/**
 * Hook for vendor/supplier options (commonly used)
 */
export function useVendorOptions(filters?: Record<string, any>): EntitySelectOptions {
  return useEntityOptions({
    entityType: 'VENDOR',
    displayField: 'entity_name',
    filters: {
      active: true,
      ...filters
    }
  })
}

/**
 * Hook for employee options (commonly used)
 */
export function useEmployeeOptions(filters?: Record<string, any>): EntitySelectOptions {
  return useEntityOptions({
    entityType: 'EMPLOYEE',
    displayField: 'entity_name',
    filters: {
      active: true,
      ...filters
    }
  })
}

/**
 * Hook for customer options (commonly used)
 */
export function useCustomerOptions(filters?: Record<string, any>): EntitySelectOptions {
  return useEntityOptions({
    entityType: 'CUSTOMER',
    displayField: 'entity_name',
    searchFields: ['entity_name', 'phone', 'email'],
    filters
  })
}

/**
 * Hook for role options (commonly used)
 */
export function useRoleOptions(filters?: Record<string, any>): EntitySelectOptions {
  return useEntityOptions({
    entityType: 'ROLE',
    displayField: 'entity_name',
    filters: {
      active: true,
      ...filters
    }
  })
}

/**
 * Hook for product options (commonly used)
 */
export function useProductOptions(filters?: Record<string, any>): EntitySelectOptions {
  return useEntityOptions({
    entityType: 'PRODUCT',
    displayField: 'entity_name',
    searchFields: ['entity_name', 'sku'],
    filters
  })
}

/**
 * Hook for service options (commonly used)
 */
export function useServiceOptions(filters?: Record<string, any>): EntitySelectOptions {
  return useEntityOptions({
    entityType: 'SERVICE',
    displayField: 'entity_name',
    filters: {
      active: true,
      ...filters
    }
  })
}

/**
 * Multi-select hook for handling multiple entity relationships
 */
export function useMultiEntityOptions(configs: Array<{
  key: string
  entityType: string
  displayField?: string
  valueField?: string
  filters?: Record<string, any>
}>): Record<string, EntitySelectOptions> {
  const results: Record<string, EntitySelectOptions> = {}
  
  for (const config of configs) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[config.key] = useEntityOptions(config)
  }
  
  return results
}

/**
 * Search hook for entity options with debounced search
 */
export function useEntitySearch(config: {
  entityType: string
  searchTerm: string
  displayField?: string
  searchFields?: string[]
  debounceMs?: number
}): EntitySelectOptions {
  const { searchTerm, debounceMs = 300, ...restConfig } = config
  
  // Simple debouncing using query key changes
  const debouncedSearchTerm = searchTerm // In a real implementation, you'd use a debounce hook
  
  return useEntityOptions({
    ...restConfig,
    filters: {
      search: debouncedSearchTerm,
      limit: 50 // Limit search results
    },
    enabled: debouncedSearchTerm.length >= 2 // Only search with 2+ characters
  })
}

/**
 * Helper to get option by value
 */
export function getOptionByValue(options: SelectOption[], value: string): SelectOption | undefined {
  return options.find(option => option.value === value)
}

/**
 * Helper to get multiple options by values
 */
export function getOptionsByValues(options: SelectOption[], values: string[]): SelectOption[] {
  return values
    .map(value => getOptionByValue(options, value))
    .filter((option): option is SelectOption => option !== undefined)
}

/**
 * Helper to convert option to relationship format
 */
export function optionToRelationship(option: SelectOption, relationshipType: string, smartCode: string) {
  return {
    to_entity_id: option.value,
    relationship_type: relationshipType,
    smart_code: smartCode,
    relationship_direction: 'forward',
    is_active: true
  }
}

/**
 * Helper to convert multiple options to relationships
 */
export function optionsToRelationships(
  options: SelectOption[],
  relationshipType: string,
  smartCode: string
) {
  return options.map(option => optionToRelationship(option, relationshipType, smartCode))
}