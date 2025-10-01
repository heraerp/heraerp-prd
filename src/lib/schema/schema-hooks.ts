/**
 * HERA DNA Schema Hooks
 * React hooks for schema management with caching and real-time updates
 * Smart Code: HERA.DNA.SCHEMA.HOOKS.V1
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { schemaManager, SchemaUtils } from './schema-manager'
import {
  EnhancedSchemaManager,
  SelfGoverningIntegration
} from '@/lib/governance/self-governing-integration'
import type {
  DNAComponent,
  DNATemplate,
  SmartCodeDefinition,
  EntityTypeDefinition,
  FieldTypeDefinition,
  OrganizationSystemConfig,
  UserEntityFieldSelection,
  DynamicFormConfiguration,
  CompleteSystemSchema
} from './schema-manager'

// Query key factory for consistent caching
const schemaKeys = {
  all: ['schema'] as const,
  systemSchema: () => [...schemaKeys.all, 'system'] as const,
  components: (filters?: any) => [...schemaKeys.systemSchema(), 'components', filters] as const,
  templates: (industry?: string) => [...schemaKeys.systemSchema(), 'templates', industry] as const,
  smartCodes: (industry?: string) =>
    [...schemaKeys.systemSchema(), 'smart-codes', industry] as const,
  entityTypes: (category?: string) =>
    [...schemaKeys.systemSchema(), 'entity-types', category] as const,
  fieldTypes: (category?: string) =>
    [...schemaKeys.systemSchema(), 'field-types', category] as const,

  orgConfig: (orgId: string) => [...schemaKeys.all, 'org-config', orgId] as const,
  fieldSelections: (orgId: string, entityType?: string) =>
    [...schemaKeys.all, 'field-selections', orgId, entityType] as const,
  formConfigs: (orgId: string, entityType?: string, formType?: string) =>
    [...schemaKeys.all, 'form-configs', orgId, entityType, formType] as const,
  completeSchema: (orgId: string) => [...schemaKeys.all, 'complete-schema', orgId] as const,
  effectiveFields: (orgId: string, entityType: string, selectionType: string) =>
    [...schemaKeys.all, 'effective-fields', orgId, entityType, selectionType] as const
}

// =====================================================
// SYSTEM SCHEMA HOOKS (Read-Only)
// =====================================================

/**
 * Hook to get DNA components with caching
 */
export function useDNAComponents(filters?: { type?: string; category?: string; status?: string }) {
  return useQuery({
    queryKey: schemaKeys.components(filters),
    queryFn: () => EnhancedSchemaManager.getDNAComponents(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  })
}

/**
 * Hook to get DNA templates
 */
export function useDNATemplates(industry?: string) {
  return useQuery({
    queryKey: schemaKeys.templates(industry),
    queryFn: () => EnhancedSchemaManager.getDNATemplates(industry),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000
  })
}

/**
 * Hook to get smart code definitions
 */
export function useSmartCodeDefinitions(industry?: string) {
  return useQuery({
    queryKey: schemaKeys.smartCodes(industry),
    queryFn: () => schemaManager.getSmartCodeDefinitions(industry),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000
  })
}

/**
 * Hook to get entity type definitions
 */
export function useEntityTypeDefinitions(category?: string) {
  return useQuery({
    queryKey: schemaKeys.entityTypes(category),
    queryFn: () => schemaManager.getEntityTypeDefinitions(category),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000
  })
}

/**
 * Hook to get field type definitions
 */
export function useFieldTypeDefinitions(category?: string) {
  return useQuery({
    queryKey: schemaKeys.fieldTypes(category),
    queryFn: () => schemaManager.getFieldTypeDefinitions(category),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000
  })
}

/**
 * Hook to get a specific component by name
 */
export function useComponent(componentName: string) {
  return useQuery({
    queryKey: [...schemaKeys.components(), 'single', componentName],
    queryFn: () => SchemaUtils.getComponent(componentName),
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!componentName
  })
}

/**
 * Hook to get a specific template
 */
export function useTemplate(templateName: string, industry?: string) {
  return useQuery({
    queryKey: [...schemaKeys.templates(industry), 'single', templateName],
    queryFn: () => SchemaUtils.getTemplate(templateName, industry),
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!templateName
  })
}

/**
 * Hook to get a specific smart code definition
 */
export function useSmartCodeDefinition(smartCode: string) {
  return useQuery({
    queryKey: [...schemaKeys.smartCodes(), 'single', smartCode],
    queryFn: () => SchemaUtils.getSmartCodeDefinition(smartCode),
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!smartCode
  })
}

// =====================================================
// ORGANIZATION CONFIGURATION HOOKS (Admin CRUD)
// =====================================================

/**
 * Hook to get organization system configuration
 */
export function useOrganizationConfig(organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useQuery({
    queryKey: schemaKeys.orgConfig(orgId!),
    queryFn: () => EnhancedSchemaManager.getOrganizationConfig(orgId!),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!orgId
  })
}

/**
 * Hook to update organization system configuration
 */
export function useUpdateOrganizationConfig() {
  const queryClient = useQueryClient()
  const { user } = useHERAAuth()

  return useMutation({
    mutationFn: ({
      organizationId,
      config
    }: {
      organizationId: string
      config: Partial<OrganizationSystemConfig>
    }) => EnhancedSchemaManager.upsertOrganizationConfig(organizationId, config, user?.id!),
    onSuccess: data => {
      // Update the cache
      queryClient.setQueryData(schemaKeys.orgConfig(data.organization_id), data)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: schemaKeys.completeSchema(data.organization_id) })
    }
  })
}

/**
 * Hook to get user entity field selections
 */
export function useEntityFieldSelections(organizationId?: string, entityType?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useQuery({
    queryKey: schemaKeys.fieldSelections(orgId!, entityType),
    queryFn: () => schemaManager.getUserEntityFieldSelections(orgId!, entityType),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    enabled: !!orgId
  })
}

/**
 * Hook to create/update entity field selection
 */
export function useUpdateEntityFieldSelection() {
  const queryClient = useQueryClient()
  const { user } = useHERAAuth()

  return useMutation({
    mutationFn: (selection: Partial<UserEntityFieldSelection>) =>
      schemaManager.upsertEntityFieldSelection(selection, user?.id!),
    onSuccess: data => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: schemaKeys.fieldSelections(data.organization_id, data.entity_type)
      })
      queryClient.invalidateQueries({
        queryKey: schemaKeys.effectiveFields(
          data.organization_id,
          data.entity_type,
          data.selection_type
        )
      })
    }
  })
}

/**
 * Hook to get dynamic form configurations
 */
export function useDynamicFormConfigurations(
  organizationId?: string,
  entityType?: string,
  formType?: string
) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useQuery({
    queryKey: schemaKeys.formConfigs(orgId!, entityType, formType),
    queryFn: () => schemaManager.getDynamicFormConfigurations(orgId!, entityType, formType),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    enabled: !!orgId
  })
}

/**
 * Hook to create/update dynamic form configuration
 */
export function useUpdateDynamicFormConfiguration() {
  const queryClient = useQueryClient()
  const { user } = useHERAAuth()

  return useMutation({
    mutationFn: (formConfig: Partial<DynamicFormConfiguration>) =>
      schemaManager.upsertDynamicFormConfiguration(formConfig, user?.id!),
    onSuccess: data => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: schemaKeys.formConfigs(data.organization_id, data.entity_type, data.form_type)
      })
      queryClient.invalidateQueries({
        queryKey: schemaKeys.effectiveFields(data.organization_id, data.entity_type, data.form_type)
      })
    }
  })
}

/**
 * Hook to get complete system schema for organization
 */
export function useCompleteSystemSchema(organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useQuery({
    queryKey: schemaKeys.completeSchema(orgId!),
    queryFn: () => schemaManager.getCompleteSystemSchema(orgId!),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    enabled: !!orgId
  })
}

/**
 * Hook to get effective field configuration for an entity type
 */
export function useEffectiveFieldConfiguration(
  entityType: string,
  selectionType: 'form' | 'table' | 'search' | 'report' = 'form',
  organizationId?: string
) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useQuery({
    queryKey: schemaKeys.effectiveFields(orgId!, entityType, selectionType),
    queryFn: () => schemaManager.getEffectiveFieldConfiguration(orgId!, entityType, selectionType),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    enabled: !!orgId && !!entityType
  })
}

// =====================================================
// UTILITY HOOKS
// =====================================================

/**
 * Hook to check if organization has a feature enabled
 */
export function useFeatureFlag(featureName: string, organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useQuery({
    queryKey: [...schemaKeys.orgConfig(orgId!), 'feature', featureName],
    queryFn: () => SchemaUtils.hasFeatureEnabled(orgId!, featureName),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    enabled: !!orgId && !!featureName
  })
}

/**
 * Hook to validate organization configuration
 */
export function useValidateOrganizationConfig(organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useQuery({
    queryKey: [...schemaKeys.orgConfig(orgId!), 'validation'],
    queryFn: () => schemaManager.validateOrganizationConfiguration(orgId!),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orgId
  })
}

/**
 * Hook to get components filtered by organization configuration
 */
export function useEnabledComponents(organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  const { data: orgConfig } = useOrganizationConfig(orgId)
  const { data: allComponents } = useDNAComponents()

  return useQuery({
    queryKey: [...schemaKeys.components(), 'enabled', orgId],
    queryFn: () => {
      if (!orgConfig?.enabled_components || !allComponents) {
        return []
      }

      const enabledComponentNames = Object.keys(orgConfig.enabled_components).filter(
        name => orgConfig.enabled_components[name] === true
      )

      return allComponents.filter(component =>
        enabledComponentNames.includes(component.component_name)
      )
    },
    enabled: !!orgConfig && !!allComponents,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to get entity types enabled for organization
 */
export function useEnabledEntityTypes(organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  const { data: orgConfig } = useOrganizationConfig(orgId)
  const { data: allEntityTypes } = useEntityTypeDefinitions()

  return useQuery({
    queryKey: [...schemaKeys.entityTypes(), 'enabled', orgId],
    queryFn: () => {
      if (!orgConfig?.enabled_entity_types || !allEntityTypes) {
        return []
      }

      return allEntityTypes.filter(entityType =>
        orgConfig.enabled_entity_types.includes(entityType.entity_type)
      )
    },
    enabled: !!orgConfig && !!allEntityTypes,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook to warm up cache for organization
 */
export function useWarmUpCache(organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useMutation({
    mutationFn: () => schemaManager.warmUpCache(orgId),
    onSuccess: () => {
      console.log('Schema cache warmed up successfully')
    }
  })
}

/**
 * Hook to clear cache
 */
export function useClearCache() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (organizationId?: string) => {
      if (organizationId) {
        schemaManager.clearOrganizationCache(organizationId)
        queryClient.invalidateQueries({ queryKey: [...schemaKeys.all, organizationId] })
      } else {
        schemaManager.clearCache()
        queryClient.invalidateQueries({ queryKey: schemaKeys.all })
      }
    },
    onSuccess: () => {
      console.log('Schema cache cleared successfully')
    }
  })
}

// =====================================================
// COMBINED HOOKS FOR COMMON PATTERNS
// =====================================================

/**
 * Hook to get everything needed to render an entity form
 */
export function useEntityFormSchema(
  entityType: string,
  formType: 'create' | 'edit' | 'view' = 'create',
  organizationId?: string
) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  // Get all the data needed for form rendering
  const entityDefinition = useEntityTypeDefinitions()
  const fieldTypes = useFieldTypeDefinitions()
  const effectiveFields = useEffectiveFieldConfiguration(entityType, 'form', orgId)
  const formConfig = useDynamicFormConfigurations(orgId, entityType, formType)
  const smartCodes = useSmartCodeDefinitions()

  return {
    entityDefinition: entityDefinition.data?.find(def => def.entity_type === entityType),
    fieldTypes: fieldTypes.data,
    effectiveFields: effectiveFields.data,
    formConfig: formConfig.data?.[0],
    smartCodes: smartCodes.data,
    isLoading:
      entityDefinition.isLoading ||
      fieldTypes.isLoading ||
      effectiveFields.isLoading ||
      formConfig.isLoading ||
      smartCodes.isLoading,
    error:
      entityDefinition.error ||
      fieldTypes.error ||
      effectiveFields.error ||
      formConfig.error ||
      smartCodes.error
  }
}

/**
 * Hook to get everything needed to render an entity table
 */
export function useEntityTableSchema(entityType: string, organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  const entityDefinition = useEntityTypeDefinitions()
  const effectiveFields = useEffectiveFieldConfiguration(entityType, 'table', orgId)
  const fieldTypes = useFieldTypeDefinitions()

  return {
    entityDefinition: entityDefinition.data?.find(def => def.entity_type === entityType),
    effectiveFields: effectiveFields.data,
    fieldTypes: fieldTypes.data,
    isLoading: entityDefinition.isLoading || effectiveFields.isLoading || fieldTypes.isLoading,
    error: entityDefinition.error || effectiveFields.error || fieldTypes.error
  }
}

/**
 * Hook to get data quality metrics from self-governing standards
 */
export function useDataQualityMetrics(organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return useQuery({
    queryKey: [...schemaKeys.all, 'quality-metrics', orgId],
    queryFn: () => SelfGoverningIntegration.getDataQualityMetrics(orgId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orgId
  })
}

/**
 * Hook for schema administration interface with self-governing integration
 */
export function useSchemaAdministration(organizationId?: string) {
  const { user } = useHERAAuth()
  const orgId = organizationId || user?.organization_id

  return {
    // System schema (read-only) - now integrated with self-governing standards
    components: useDNAComponents(),
    templates: useDNATemplates(),
    entityTypes: useEntityTypeDefinitions(),
    fieldTypes: useFieldTypeDefinitions(),
    smartCodes: useSmartCodeDefinitions(),

    // Organization configuration (admin CRUD)
    orgConfig: useOrganizationConfig(orgId),
    fieldSelections: useEntityFieldSelections(orgId),
    formConfigs: useDynamicFormConfigurations(orgId),

    // Self-governing standards integration
    qualityMetrics: useDataQualityMetrics(orgId),

    // Mutations
    updateOrgConfig: useUpdateOrganizationConfig(),
    updateFieldSelection: useUpdateEntityFieldSelection(),
    updateFormConfig: useUpdateDynamicFormConfiguration(),

    // Utilities
    validation: useValidateOrganizationConfig(orgId),
    warmUpCache: useWarmUpCache(orgId),
    clearCache: useClearCache()
  }
}
