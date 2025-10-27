'use client'

/**
 * Master Data Form Hook
 * Smart Code: HERA.ENTERPRISE.MASTER_DATA.FORM_HOOK.v1
 * 
 * Manages master data form state, validation, auto-save, and workflow integration
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  MasterDataTemplate, 
  MasterDataField, 
  MasterDataRelationship,
  ParsedMasterDataForm,
  MasterDataYamlParser
} from '@/lib/master-data/yaml-parser'
import { createEnvironmentAwareHeraClient, HeraClient } from '@/lib/hera/client'

interface DynamicFieldInput {
  field_name: string
  field_value: string
  field_type: 'text' | 'number'
  smart_code: string
}

export interface FormFieldValue {
  value: any
  isDirty: boolean
  isValid: boolean
  errors: string[]
  touched: boolean
}

export interface FormState {
  values: Record<string, FormFieldValue>
  currentTab: string
  tabCompletion: Record<string, boolean>
  overallCompletion: number
  isSubmitting: boolean
  isDraft: boolean
  lastSaved: Date | null
  entityId: string | null
}

export interface TabValidationState {
  isValid: boolean
  completedFields: number
  totalFields: number
  errors: string[]
}

export interface AutoSaveOptions {
  enabled: boolean
  interval: number // milliseconds
  onTabChange: boolean
  onFieldChange: boolean
  debounceDelay: number
}

export interface MasterDataFormOptions {
  template: MasterDataTemplate
  parsedConfig: ParsedMasterDataForm
  entityId?: string // For editing existing entities
  initialValues?: Record<string, any>
  autoSave?: Partial<AutoSaveOptions>
  onSubmit?: (values: Record<string, any>) => Promise<void>
  onAutoSave?: (values: Record<string, any>) => Promise<void>
  onTabChange?: (fromTab: string, toTab: string) => void
  onValidationChange?: (tabId: string, validation: TabValidationState) => void
}

const DEFAULT_AUTO_SAVE_OPTIONS: AutoSaveOptions = {
  enabled: true,
  interval: 30000, // 30 seconds
  onTabChange: true,
  onFieldChange: false, // Too frequent, use debounce instead
  debounceDelay: 2000 // 2 seconds
}

export function useMasterDataForm(options: MasterDataFormOptions) {
  const { user, organization } = useHERAAuth()
  const queryClient = useQueryClient()
  
  const {
    template,
    parsedConfig,
    entityId: initialEntityId,
    initialValues = {},
    autoSave: autoSaveOptions = {},
    onSubmit,
    onAutoSave,
    onTabChange,
    onValidationChange
  } = options

  const autoSaveConfig = { ...DEFAULT_AUTO_SAVE_OPTIONS, ...autoSaveOptions }
  
  // Form state
  const [formState, setFormState] = useState<FormState>(() => {
    // Validate inputs before proceeding
    if (!template?.fields || !Array.isArray(template.fields)) {
      console.error('Invalid template: fields array is required', template)
      throw new Error('Invalid template: fields array is required')
    }
    
    if (!parsedConfig?.tabOrder || !Array.isArray(parsedConfig.tabOrder)) {
      console.error('Invalid parsed config: tabOrder is required', parsedConfig)
      throw new Error('Invalid parsed config: tabOrder is required')
    }

    const initialState: FormState = {
      values: {},
      currentTab: parsedConfig.tabOrder.length > 0 ? parsedConfig.tabOrder[0] : '',
      tabCompletion: {},
      overallCompletion: 0,
      isSubmitting: false,
      isDraft: false,
      lastSaved: null,
      entityId: initialEntityId || null
    }

    // Initialize field values with safety checks
    for (const field of template.fields) {
      if (!field?.name) {
        console.warn('Skipping field without name:', field)
        continue
      }
      initialState.values[field.name] = {
        value: initialValues[field.name] || field.defaultValue || getDefaultValueForType(field.type),
        isDirty: false,
        isValid: !field.required || (initialValues[field.name] !== undefined),
        errors: [],
        touched: false
      }
    }

    // Initialize relationship values
    if (template.relationships) {
      for (const rel of template.relationships) {
        initialState.values[rel.name] = {
          value: initialValues[rel.name] || (rel.type.includes('Many') ? [] : null),
          isDirty: false,
          isValid: !rel.required || (initialValues[rel.name] !== undefined),
          errors: [],
          touched: false
        }
      }
    }

    return initialState
  })

  // Auto-save timer refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Mutation for saving data
  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Organization or user not available')
      }

      // Get user session for authentication
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Create environment-aware HERA client
      const heraClient = await createEnvironmentAwareHeraClient(
        session.access_token,
        organization.id
      )

      const entityData = prepareEntityDataForHeraClient(values, template, organization.id)
      
      if (formState.entityId) {
        // Update existing entity - for now we'll create a new one since HeraClient doesn't have update yet
        console.warn('Update operation not yet implemented in HeraClient, creating new entity')
        const result = await heraClient.createEntity(entityData)
        return result
      } else {
        // Create new entity
        const result = await heraClient.createEntity(entityData)
        setFormState(prev => ({ ...prev, entityId: result.data?.entity_id || result.data?.id }))
        return result
      }
    },
    onSuccess: (data) => {
      setFormState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isDraft: false
      }))
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['entities', organization?.id, template.entityName] 
      })
    },
    onError: (error) => {
      console.error('Failed to save master data:', error)
    }
  })

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!autoSaveConfig.enabled || saveMutation.isPending) return

    const values = getCurrentValues()
    
    try {
      if (onAutoSave) {
        await onAutoSave(values)
      } else {
        await saveMutation.mutateAsync(values)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [autoSaveConfig.enabled, saveMutation, onAutoSave])

  // Get current form values
  const getCurrentValues = useCallback(() => {
    const values: Record<string, any> = {}
    for (const [fieldName, fieldState] of Object.entries(formState.values)) {
      values[fieldName] = fieldState.value
    }
    return values
  }, [formState.values])

  // Update field value with validation
  const updateFieldValue = useCallback((fieldName: string, value: any) => {
    const field = template.fields.find(f => f.name === fieldName) ||
                  template.relationships?.find(r => r.name === fieldName)
    
    if (!field) return

    const validation = 'validation' in field 
      ? MasterDataYamlParser.validateFieldValue(field as MasterDataField, value)
      : { isValid: true, errors: [] }

    setFormState(prev => {
      const newState = {
        ...prev,
        values: {
          ...prev.values,
          [fieldName]: {
            value,
            isDirty: true,
            isValid: validation.isValid,
            errors: validation.errors,
            touched: true
          }
        }
      }

      // Recalculate tab completion and overall progress
      const updatedState = recalculateProgress(newState, parsedConfig)
      return updatedState
    })

    // Trigger debounced auto-save if enabled
    if (autoSaveConfig.enabled && autoSaveConfig.onFieldChange) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      debounceTimerRef.current = setTimeout(() => {
        performAutoSave()
      }, autoSaveConfig.debounceDelay)
    }
  }, [template, parsedConfig, autoSaveConfig, performAutoSave])

  // Navigate to a specific tab
  const navigateToTab = useCallback((tabId: string) => {
    if (!parsedConfig.tabOrder?.includes(tabId)) return

    const fromTab = formState.currentTab
    
    // Trigger auto-save on tab change if enabled
    if (autoSaveConfig.enabled && autoSaveConfig.onTabChange && fromTab !== tabId) {
      performAutoSave()
    }

    setFormState(prev => ({
      ...prev,
      currentTab: tabId
    }))

    // Notify about tab change
    if (onTabChange) {
      onTabChange(fromTab, tabId)
    }
  }, [formState.currentTab, parsedConfig.tabOrder, autoSaveConfig, performAutoSave, onTabChange])

  // Navigate to next tab
  const navigateNext = useCallback(() => {
    if (!parsedConfig.tabOrder?.length) return
    const currentIndex = parsedConfig.tabOrder.indexOf(formState.currentTab)
    if (currentIndex < parsedConfig.tabOrder.length - 1) {
      navigateToTab(parsedConfig.tabOrder[currentIndex + 1])
    }
  }, [formState.currentTab, parsedConfig.tabOrder, navigateToTab])

  // Navigate to previous tab
  const navigatePrevious = useCallback(() => {
    if (!parsedConfig.tabOrder?.length) return
    const currentIndex = parsedConfig.tabOrder.indexOf(formState.currentTab)
    if (currentIndex > 0) {
      navigateToTab(parsedConfig.tabOrder[currentIndex - 1])
    }
  }, [formState.currentTab, parsedConfig.tabOrder, navigateToTab])

  // Validate a specific tab
  const validateTab = useCallback((tabId: string): TabValidationState => {
    const tabFields = parsedConfig.fieldsByTab.get(tabId) || []
    const tabRelationships = parsedConfig.relationshipsByTab.get(tabId) || []
    const allTabItems = [...tabFields, ...tabRelationships]
    
    let completedFields = 0
    let isValid = true
    const errors: string[] = []

    for (const item of allTabItems) {
      const fieldState = formState.values[item.name]
      if (!fieldState) continue

      const hasValue = fieldState.value !== null && 
                      fieldState.value !== undefined && 
                      fieldState.value !== '' &&
                      (!Array.isArray(fieldState.value) || fieldState.value.length > 0)

      if (hasValue) {
        completedFields++
      }

      if (!fieldState.isValid) {
        isValid = false
        errors.push(...fieldState.errors)
      }

      // Check required field validation
      if (item.required && !hasValue) {
        isValid = false
        errors.push(`${item.label} is required`)
      }
    }

    const validation: TabValidationState = {
      isValid,
      completedFields,
      totalFields: allTabItems.length,
      errors
    }

    // Notify about validation change
    if (onValidationChange) {
      onValidationChange(tabId, validation)
    }

    return validation
  }, [formState.values, parsedConfig, onValidationChange])

  // Check if next navigation is allowed
  const canNavigateNext = useCallback(() => {
    if (!template.behaviour.navigation.disableNextUntilValid) {
      return true
    }

    const currentTabValidation = validateTab(formState.currentTab)
    return currentTabValidation.isValid
  }, [formState.currentTab, template.behaviour.navigation.disableNextUntilValid, validateTab])

  // Submit the form
  const submitForm = useCallback(async () => {
    if (formState.isSubmitting) return

    setFormState(prev => ({ ...prev, isSubmitting: true }))

    try {
      // Validate all tabs
      let isFormValid = true
      for (const tabId of parsedConfig.tabOrder || []) {
        const tabValidation = validateTab(tabId)
        if (!tabValidation.isValid) {
          isFormValid = false
          break
        }
      }

      if (!isFormValid) {
        throw new Error('Form contains validation errors')
      }

      const values = getCurrentValues()

      if (onSubmit) {
        await onSubmit(values)
      } else {
        await saveMutation.mutateAsync(values)
        
        // Execute workflow if configured
        if (template.workflow && template.workflow.enabled) {
          await executeWorkflow(template.workflow, formState.entityId!, values)
        }
      }

    } catch (error) {
      console.error('Form submission failed:', error)
      throw error
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
    }
  }, [formState.isSubmitting, formState.entityId, parsedConfig.tabOrder, validateTab, getCurrentValues, onSubmit, saveMutation, template.workflow])

  // Setup auto-save interval
  useEffect(() => {
    if (autoSaveConfig.enabled && autoSaveConfig.interval > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        performAutoSave()
      }, autoSaveConfig.interval)

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current)
        }
      }
    }
  }, [autoSaveConfig.enabled, autoSaveConfig.interval, performAutoSave])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    // State
    formState,
    
    // Field management
    updateFieldValue,
    getCurrentValues,
    
    // Navigation
    navigateToTab,
    navigateNext,
    navigatePrevious,
    canNavigateNext,
    
    // Validation
    validateTab,
    
    // Submission
    submitForm,
    isSubmitting: formState.isSubmitting || saveMutation.isPending,
    
    // Auto-save
    performAutoSave,
    lastSaved: formState.lastSaved,
    
    // Utility
    isNewEntity: !formState.entityId,
    isDirty: Object.values(formState.values).some(field => field.isDirty),
    
    // Progress tracking
    overallCompletion: formState.overallCompletion,
    tabCompletion: formState.tabCompletion
  }
}

// Helper functions

function getDefaultValueForType(type: string): any {
  switch (type) {
    case 'string':
    case 'email':
    case 'phone':
    case 'textarea':
      return ''
    case 'number':
      return null
    case 'boolean':
      return false
    case 'date':
      return null
    case 'select':
      return ''
    case 'multiselect':
      return []
    default:
      return null
  }
}

function recalculateProgress(state: FormState, config: ParsedMasterDataForm): FormState {
  const tabCompletion: Record<string, boolean> = {}
  let totalCompleted = 0
  
  for (const tabId of config.tabOrder || []) {
    const tabFields = config.fieldsByTab.get(tabId) || []
    const tabRelationships = config.relationshipsByTab.get(tabId) || []
    const allTabItems = [...tabFields, ...tabRelationships]
    
    let requiredCompleted = 0
    let totalRequired = 0
    
    for (const item of allTabItems) {
      if (item.required) {
        totalRequired++
        const fieldState = state.values[item.name]
        if (fieldState && fieldState.value !== null && fieldState.value !== undefined && fieldState.value !== '') {
          requiredCompleted++
        }
      }
    }
    
    const isTabComplete = totalRequired === 0 || requiredCompleted === totalRequired
    tabCompletion[tabId] = isTabComplete
    
    if (isTabComplete) {
      totalCompleted++
    }
  }
  
  const overallCompletion = (config.tabOrder?.length || 0) > 0 
    ? Math.round((totalCompleted / (config.tabOrder?.length || 1)) * 100)
    : 0
  
  return {
    ...state,
    tabCompletion,
    overallCompletion
  }
}

function prepareEntityDataForHeraClient(values: Record<string, any>, template: MasterDataTemplate, organizationId: string) {
  // Extract entity name from common field names
  const entityName = values.entityName || values.name || values.entity_name || `New ${template.entityName}`
  
  // Prepare entity data for HeraClient createEntity method
  const entityData = {
    entity_type: template.entityName.toUpperCase().substring(0, 4),
    entity_name: entityName,
    entity_code: values.entityCode || values.entity_code || null,
    entity_description: values.entityDescription || values.entity_description || values.description || null,
    smart_code: template.smartCode,
    parent_entity_id: values.parent_entity_id || null,
    status: values.status || 'active',
    metadata: {
      enterprise_module: 'MASTER_DATA',
      template_name: template.entityName,
      created_via: 'master_data_form_hook_v1',
      organization_id: organizationId
    }
  }

  // Add dynamic fields - HeraClient expects them in a specific format
  const dynamicFields: Record<string, any> = {}
  
  for (const field of template.fields) {
    const fieldValue = values[field.name]
    
    // Skip core entity fields and undefined values
    if (['entityName', 'name', 'entity_name', 'entityCode', 'entity_code', 
         'entityDescription', 'entity_description', 'description', 'status', 
         'parent_entity_id'].includes(field.name) || fieldValue === undefined) {
      continue
    }

    // Format field for HeraClient
    dynamicFields[field.name] = {
      value: fieldValue,
      type: mapFieldTypeToHeraType(field.type),
      smart_code: MasterDataYamlParser.generateFieldSmartCode(template.entityName, field.name)
    }
  }
  
  if (Object.keys(dynamicFields).length > 0) {
    entityData.dynamic_fields = dynamicFields
  }
  
  return entityData
}

function mapFieldTypeToHeraType(fieldType: string): 'text' | 'number' | 'boolean' | 'date' | 'json' {
  switch (fieldType) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'date':
      return 'date'
    case 'json':
    case 'object':
      return 'json'
    default:
      return 'text'
  }
}

function prepareEntityData(values: Record<string, any>, template: MasterDataTemplate) {
  const entityData: any = {
    entity_type: template.entityName.toUpperCase().substring(0, 4),
    entity_name: values.entityName || values.name || `New ${template.entityName}`,
    smart_code: template.smartCode,
    metadata: {
      enterprise_module: 'MASTER_DATA',
      template_name: template.entityName,
      created_via: 'master_data_form_v1'
    }
  }

  const dynamicFields: DynamicFieldInput[] = []
  
  for (const field of template.fields) {
    if (values[field.name] !== undefined) {
      if (['entityName', 'name', 'entity_name'].includes(field.name)) {
        entityData.entity_name = values[field.name]
      } else {
        dynamicFields.push({
          field_name: field.name,
          field_value: String(values[field.name]),
          field_type: field.type === 'number' ? 'number' : 'text',
          smart_code: MasterDataYamlParser.generateFieldSmartCode(template.entityName, field.name)
        })
      }
    }
  }
  
  entityData.dynamic_fields = dynamicFields
  return entityData
}

async function createEntity(entityData: any, organizationId: string, userId: string) {
  const result = await upsertEntity({
    ...entityData,
    organization_id: organizationId,
    actor_user_id: userId
  })
  
  return result
}

async function updateEntity(entityId: string, entityData: any, organizationId: string, userId: string) {
  const result = await upsertEntity({
    ...entityData,
    entity_id: entityId,
    organization_id: organizationId,
    actor_user_id: userId
  })
  
  return result
}

async function executeWorkflow(workflow: any, entityId: string, values: Record<string, any>) {
  // Workflow execution would integrate with the enterprise workflow engine
  // This is a placeholder for workflow integration
  console.log('Executing workflow:', workflow.name, 'for entity:', entityId)
}