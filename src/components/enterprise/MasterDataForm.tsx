'use client'

/**
 * Master Data Form Container
 * Smart Code: HERA.ENTERPRISE.MASTER_DATA.FORM_CONTAINER.v1
 * 
 * Main form component that orchestrates the entire master data entry experience
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Save, Send, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, X, Settings } from 'lucide-react'
import { 
  MasterDataTemplate, 
  ParsedMasterDataForm, 
  MasterDataYamlParser 
} from '@/lib/master-data/yaml-parser'
import { useMasterDataForm } from '@/hooks/useMasterDataForm'
import { useEntityRelationships } from '@/hooks/useEntityRelationships'
import { ProgressStepper, StepState } from './ProgressStepper'
import { SapNavbar } from '@/components/sap/SapNavbar'

export interface MasterDataFormProps {
  template: MasterDataTemplate
  entityId?: string
  initialValues?: Record<string, any>
  onSubmit?: (values: Record<string, any>) => Promise<void>
  onCancel?: () => void
  onSave?: (values: Record<string, any>) => Promise<void>
  className?: string
  readOnly?: boolean
  showNavbar?: boolean
}

export function MasterDataForm({
  template,
  entityId,
  initialValues = {},
  onSubmit,
  onCancel,
  onSave,
  className = '',
  readOnly = false,
  showNavbar = true
}: MasterDataFormProps) {
  // Early validation
  if (!template) {
    return <div className="p-4 text-red-600">Error: No template provided</div>
  }
  
  if (!template.ui?.tabs || !Array.isArray(template.ui.tabs) || template.ui.tabs.length === 0) {
    return <div className="p-4 text-red-600">Error: Template missing valid tabs configuration</div>
  }
  
  // Parse the template configuration
  const parsedConfig = React.useMemo(() => {
    try {
      return MasterDataYamlParser.generateFormConfig(template)
    } catch (error) {
      console.error('MasterDataForm: Error generating config:', error)
      throw error
    }
  }, [template])

  // Initialize form management
  const form = useMasterDataForm({
    template,
    parsedConfig,
    entityId,
    initialValues,
    onSubmit,
    autoSave: {
      enabled: !readOnly,
      onTabChange: true,
      interval: 30000
    }
  })
  
  // Safety check for form state
  if (!form || !form.formState) {
    return <div className="p-4 text-red-600">Error: Form initialization failed</div>
  }

  // Initialize relationship management
  const relationships = useEntityRelationships({
    relationships: template.relationships || [],
    initialSelections: initialValues,
    onSelectionChange: (relationshipName, selection) => {
      form.updateFieldValue(relationshipName, selection.selectedValues)
    }
  })

  // Tab validation states
  const [tabValidations, setTabValidations] = useState<Record<string, any>>({})

  // Generate stepper steps from tabs
  const stepperSteps: StepState[] = (parsedConfig.tabOrder || []).map(tabId => {
    const tab = template.ui.tabs?.find(t => t.id === tabId)
    if (!tab) return null
    const validation = tabValidations[tabId]
    const isCurrentTab = form.formState.currentTab === tabId
    const isCompleted = form.formState.tabCompletion[tabId]
    
    let status: StepState['status'] = 'upcoming'
    if (isCompleted) {
      status = 'completed'
    } else if (isCurrentTab) {
      status = validation?.isValid === false ? 'error' : 'active'
    } else if (validation?.isValid === false) {
      status = 'error'
    }

    return {
      id: tabId,
      title: tab.title,
      icon: tab.icon,
      status,
      completionPercentage: isCurrentTab ? 
        ((validation?.completedFields || 0) / (validation?.totalFields || 1)) * 100 : 
        undefined,
      errors: validation?.errors || [],
      isClickable: true
    }
  }).filter(Boolean) as StepState[]

  // Handle tab validation updates
  const handleTabValidationChange = (tabId: string, validation: any) => {
    setTabValidations(prev => ({
      ...prev,
      [tabId]: validation
    }))
  }

  // Current tab fields and relationships
  const currentTabFields = parsedConfig.fieldsByTab.get(form.formState.currentTab) || []
  const currentTabRelationships = parsedConfig.relationshipsByTab.get(form.formState.currentTab) || []

  return (
    <div className={`master-data-form sap-font min-h-screen bg-gray-100 ${className}`}>
      {/* Navigation Bar */}
      {showNavbar && (
        <SapNavbar
          title="HERA"
          breadcrumb={`Master Data › ${template.entityName}`}
          showBack={true}
          onBack={onCancel}
          userInitials="EG"
          showSearch={false}
        />
      )}

      <div className={`${showNavbar ? 'mt-12' : ''} min-h-screen`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Form Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-blue-600" />
                  {form.isNewEntity ? `New ${template.entityName}` : `Edit ${template.entityName}`}
                </h1>
                <p className="text-gray-600 mt-1">
                  {template.description || `Complete the form to ${form.isNewEntity ? 'create' : 'update'} ${template.entityName.toLowerCase()} information`}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {form.lastSaved && (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Saved {formatRelativeTime(form.lastSaved)}
                  </div>
                )}
                
                {form.isDirty && !form.isSubmitting && (
                  <div className="text-sm text-orange-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Unsaved changes
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <ProgressStepper
              steps={stepperSteps}
              currentStepId={form.formState.currentTab}
              config={template.ui.progressIndicator}
              onStepClick={form.navigateToTab}
              showProgress={true}
            />
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            
            {/* Tab Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {template.ui.tabs?.find(t => t.id === form.formState.currentTab)?.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.ui.tabs?.find(t => t.id === form.formState.currentTab)?.description}
                  </p>
                </div>
                
                <div className="text-sm text-gray-500">
                  Step {(parsedConfig.tabOrder || []).indexOf(form.formState.currentTab) + 1} of {(parsedConfig.tabOrder || []).length}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-6">
              <FormTabContent
                fields={currentTabFields}
                relationships={currentTabRelationships}
                formState={form.formState}
                relationshipState={relationships}
                onFieldChange={form.updateFieldValue}
                onValidationChange={handleTabValidationChange}
                currentTabId={form.formState.currentTab}
                template={template}
                readOnly={readOnly}
              />
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={form.navigatePrevious}
                    disabled={(parsedConfig.tabOrder || []).indexOf(form.formState.currentTab) === 0}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </button>

                  {template.behaviour.navigation.saveOnNavigate && (
                    <button
                      type="button"
                      onClick={form.performAutoSave}
                      disabled={form.isSubmitting || !form.isDirty}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  )}

                  {(parsedConfig.tabOrder || []).indexOf(form.formState.currentTab) < (parsedConfig.tabOrder || []).length - 1 ? (
                    <button
                      type="button"
                      onClick={form.navigateNext}
                      disabled={!form.canNavigateNext()}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={form.submitForm}
                      disabled={form.isSubmitting || !form.canNavigateNext()}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {form.isSubmitting ? (
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {form.isNewEntity ? 'Create' : 'Update'} {template.entityName}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FormTabContentProps {
  fields: any[]
  relationships: any[]
  formState: any
  relationshipState: any
  onFieldChange: (fieldName: string, value: any) => void
  onValidationChange: (tabId: string, validation: any) => void
  currentTabId: string
  template: MasterDataTemplate
  readOnly: boolean
}

function FormTabContent({
  fields,
  relationships,
  formState,
  relationshipState,
  onFieldChange,
  onValidationChange,
  currentTabId,
  template,
  readOnly
}: FormTabContentProps) {
  // Calculate validation state for current tab
  React.useEffect(() => {
    const allItems = [...fields, ...relationships]
    let completedFields = 0
    let isValid = true
    const errors: string[] = []

    for (const item of allItems) {
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

      if (item.required && !hasValue) {
        isValid = false
        errors.push(`${item.label} is required`)
      }
    }

    onValidationChange(currentTabId, {
      isValid,
      completedFields,
      totalFields: allItems.length,
      errors
    })
  }, [fields, relationships, formState.values, currentTabId, onValidationChange])

  return (
    <div className="space-y-6">
      {/* Regular Fields */}
      {fields.map(field => (
        <FormFieldRenderer
          key={field.name}
          field={field}
          value={formState.values[field.name]?.value}
          errors={formState.values[field.name]?.errors || []}
          isValid={formState.values[field.name]?.isValid ?? true}
          onChange={(value) => onFieldChange(field.name, value)}
          readOnly={readOnly}
          validationConfig={template.behaviour.validation}
        />
      ))}

      {/* Relationship Fields */}
      {relationships.map(relationship => (
        <RelationshipFieldRenderer
          key={relationship.name}
          relationship={relationship}
          relationshipState={relationshipState}
          readOnly={readOnly}
          validationConfig={template.behaviour.validation}
        />
      ))}
    </div>
  )
}

interface FormFieldRendererProps {
  field: any
  value: any
  errors: string[]
  isValid: boolean
  onChange: (value: any) => void
  readOnly: boolean
  validationConfig: any
}

function FormFieldRenderer({
  field,
  value,
  errors,
  isValid,
  onChange,
  readOnly,
  validationConfig
}: FormFieldRendererProps) {
  const hasErrors = errors.length > 0
  const fieldId = `field-${field.name}`

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      {/* Field Input */}
      <div className="relative">
        <FieldInput
          id={fieldId}
          field={field}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          hasErrors={hasErrors}
          validationConfig={validationConfig}
        />
      </div>

      {/* Help Text */}
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}

      {/* Error Messages */}
      {hasErrors && (
        <div className="mt-1 space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

interface FieldInputProps {
  id: string
  field: any
  value: any
  onChange: (value: any) => void
  readOnly: boolean
  hasErrors: boolean
  validationConfig: any
}

function FieldInput({
  id,
  field,
  value,
  onChange,
  readOnly,
  hasErrors,
  validationConfig
}: FieldInputProps) {
  const baseClasses = `
    block w-full rounded-md shadow-sm transition-colors duration-200
    ${hasErrors 
      ? `border-red-300 focus:ring-red-500 focus:border-red-500` 
      : `border-gray-300 focus:ring-blue-500 focus:border-blue-500`}
    ${readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
  `

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          id={id}
          name={field.name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          readOnly={readOnly}
          required={field.required}
          rows={4}
          className={baseClasses}
        />
      )

    case 'select':
      return (
        <select
          id={id}
          name={field.name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          required={field.required}
          className={baseClasses}
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )

    case 'number':
      return (
        <input
          id={id}
          name={field.name}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || null)}
          placeholder={field.placeholder}
          readOnly={readOnly}
          required={field.required}
          min={field.validation?.min}
          max={field.validation?.max}
          className={baseClasses}
        />
      )

    case 'date':
      return (
        <input
          id={id}
          name={field.name}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          required={field.required}
          className={baseClasses}
        />
      )

    case 'boolean':
      return (
        <div className="flex items-center">
          <input
            id={id}
            name={field.name}
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={id} className="ml-2 block text-sm text-gray-900">
            {field.placeholder || 'Enable'}
          </label>
        </div>
      )

    default:
      return (
        <input
          id={id}
          name={field.name}
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          readOnly={readOnly}
          required={field.required}
          minLength={field.validation?.minLength}
          maxLength={field.validation?.maxLength}
          pattern={field.validation?.pattern}
          className={baseClasses}
        />
      )
  }
}

interface RelationshipFieldRendererProps {
  relationship: any
  relationshipState: any
  readOnly: boolean
  validationConfig: any
}

function RelationshipFieldRenderer({
  relationship,
  relationshipState,
  readOnly,
  validationConfig
}: RelationshipFieldRendererProps) {
  const selection = relationshipState.getSelectedOptions(relationship.name)
  const searchState = relationshipState.getSearchStateForRelationship(relationship.name)
  const options = relationshipState.getOptionsForRelationship(relationship.name)

  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {relationship.label}
        {relationship.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      {/* Search Input */}
      <div className="relative mb-2">
        <input
          type="text"
          placeholder={`Search ${relationship.label}...`}
          value={searchState.query}
          onChange={(e) => relationshipState.updateSearchQuery(relationship.name, e.target.value)}
          disabled={readOnly}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        {searchState.isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Selected Items */}
      {selection.length > 0 && (
        <div className="mb-2 space-y-1">
          {selection.map((option: any) => (
            <div key={option.value} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
              <span className="text-sm font-medium text-blue-900">{option.label}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => relationshipState.updateSelection(relationship.name, option.value, option, false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Available Options */}
      {options.length > 0 && searchState.query && (
        <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
          {options.filter(opt => !opt.isSelected).map((option: any) => (
            <button
              key={option.value}
              type="button"
              onClick={() => relationshipState.updateSelection(relationship.name, option.value, option, true)}
              disabled={readOnly}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Utility functions
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  
  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}