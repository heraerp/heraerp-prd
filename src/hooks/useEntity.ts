/**
 * Universal Entity Hook with Config-Driven Presets
 * One-click entity hooks that eliminate entity-specific logic
 */

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import { ENTITY_PRESETS, type EntityConfig, type DynamicFieldDef } from './universal-entity.config'

export type UseEntityOptions = {
  organizationId: string
  filters?: Record<string, any>
  includeRelationships?: boolean
  includeDynamicData?: boolean
}

/**
 * Config-driven entity hook that auto-configures based on preset
 * Eliminates all entity-specific logic through configuration
 */
export function useEntity<TPreset extends keyof typeof ENTITY_PRESETS>(
  preset: TPreset,
  options: UseEntityOptions
) {
  const config = ENTITY_PRESETS[preset]

  // Auto-configure filters with entity type
  const enhancedFilters = useMemo(
    () => ({
      entity_type: config.entityType,
      ...options.filters
    }),
    [config.entityType, options.filters]
  )

  // Use the base universal entity hook with enhanced configuration
  const result = useUniversalEntity({
    organizationId: options.organizationId,
    filters: enhancedFilters,
    includeRelationships: options.includeRelationships ?? true,
    includeDynamicData: options.includeDynamicData ?? true
  })

  // Helper to create entity with preset configuration
  const createEntity = useMemo(() => {
    return async (data: {
      entity_name: string
      entity_code?: string
      dynamicFields?: Record<string, any>
      metadata?: Record<string, any>
    }) => {
      if (!result.createEntity) {
        throw new Error('Create function not available')
      }

      // Build dynamic fields from preset config + provided values
      const dynamicFieldsToSet: Array<{
        field_name: string
        field_value: any
        field_type: string
        smart_code: string
      }> = []

      // Add preset dynamic fields with defaults
      if (config.dynamicFields) {
        for (const fieldDef of config.dynamicFields) {
          const providedValue = data.dynamicFields?.[fieldDef.name]
          const valueToUse = providedValue !== undefined ? providedValue : fieldDef.defaultValue

          if (valueToUse !== undefined) {
            dynamicFieldsToSet.push({
              field_name: fieldDef.name,
              field_value: valueToUse,
              field_type: fieldDef.type,
              smart_code: fieldDef.smartCode
            })
          }
        }
      }

      // Create the entity with preset smart code
      return result.createEntity({
        entity_type: config.entityType,
        entity_name: data.entity_name,
        entity_code: data.entity_code,
        smart_code: config.baseSmartCode,
        metadata: data.metadata,
        dynamicFields: dynamicFieldsToSet
      })
    }
  }, [result.createEntity, config])

  // Helper to update dynamic fields with type safety
  const updateDynamicField = useMemo(() => {
    return async (entityId: string, fieldName: string, value: any) => {
      if (!result.setDynamicField) {
        throw new Error('setDynamicField function not available')
      }

      // Find field definition in preset
      const fieldDef = config.dynamicFields?.find(f => f.name === fieldName)
      if (!fieldDef) {
        throw new Error(`Field '${fieldName}' not found in preset ${preset}`)
      }

      return result.setDynamicField(entityId, {
        field_name: fieldName,
        field_value: value,
        field_type: fieldDef.type,
        smart_code: fieldDef.smartCode
      })
    }
  }, [result.setDynamicField, config.dynamicFields, preset])

  // Helper to get dynamic field definition
  const getFieldDef = useMemo(() => {
    return (fieldName: string): DynamicFieldDef | undefined => {
      return config.dynamicFields?.find(f => f.name === fieldName)
    }
  }, [config.dynamicFields])

  // Helper to validate required fields
  const validateRequiredFields = useMemo(() => {
    return (dynamicFields: Record<string, any>): string[] => {
      const missingFields: string[] = []

      if (config.dynamicFields) {
        for (const fieldDef of config.dynamicFields) {
          if (
            fieldDef.required &&
            (dynamicFields[fieldDef.name] === undefined || dynamicFields[fieldDef.name] === '')
          ) {
            missingFields.push(fieldDef.name)
          }
        }
      }

      return missingFields
    }
  }, [config.dynamicFields])

  return {
    // Base functionality from useUniversalEntity
    ...result,

    // Preset configuration
    config,

    // Enhanced create with preset configuration
    createEntity,

    // Dynamic field helpers
    updateDynamicField,
    getFieldDef,
    validateRequiredFields
  }
}

/**
 * Specific preset hooks for common entities
 * These provide the ultimate one-liner entity management
 */

export function useProducts(options: UseEntityOptions) {
  return useEntity('PRODUCT', options)
}

export function useProductCategories(options: UseEntityOptions) {
  return useEntity('PRODUCT_CATEGORY', options)
}

export function useServices(options: UseEntityOptions) {
  return useEntity('SERVICE', options)
}

export function useServiceCategories(options: UseEntityOptions) {
  return useEntity('SERVICE_CATEGORY', options)
}

export function useCustomers(options: UseEntityOptions) {
  return useEntity('CUSTOMER', options)
}

export function useEmployees(options: UseEntityOptions) {
  return useEntity('EMPLOYEE', options)
}

export function useAppointments(options: UseEntityOptions) {
  return useEntity('APPOINTMENT', options)
}

/**
 * Type-safe entity data with preset configuration
 */
export type EntityWithPreset<TPreset extends keyof typeof ENTITY_PRESETS> = {
  id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  organization_id: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  dynamicFields?: Record<string, any>
  relationships?: Array<{
    id: string
    relationship_type: string
    target_entity_id: string
    target_entity?: any
  }>
} & {
  [K in (typeof ENTITY_PRESETS)[TPreset]['dynamicFields'] extends Array<infer U>
    ? U extends { name: infer N }
      ? N extends string
        ? N
        : never
      : never
    : never]?: any
}
