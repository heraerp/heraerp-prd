'use client'

import React, { useState, useEffect } from 'react'
import {
  EntityPresetWithUIType,
  EnhancedDynamicFieldDef,
  EnhancedRelationshipDef,
  validateDynamicFieldsWithUI,
  applyDefaultsWithUI,
  isFieldVisible,
  isFieldReadonly,
  isRelationshipVisible
} from './entityPresets'
import { useEntityOptions, SelectOption } from './useEntityOptions'
import {
  UniversalForm,
  UniversalInput,
  UniversalTextarea,
  UniversalSelect,
  UniversalButton,
  UniversalFieldGroup
} from '@/components/universal/forms/UniversalForm'

// Types
export interface EntityFormData {
  entity_name: string
  entity_code?: string
  smart_code: string
  dynamic_fields: Record<string, any>
  relationships: Record<string, string[]>
}

export interface EntityFormProps {
  preset: EntityPresetWithUIType
  mode: 'create' | 'edit'
  initialData?: Partial<EntityFormData>
  userRole?: string
  onSubmit: (data: EntityFormData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  className?: string
}

// Field component for dynamic fields
interface DynamicFieldProps {
  field: EnhancedDynamicFieldDef
  value: any
  onChange: (value: any) => void
  error?: string
  userRole: string
}

function DynamicField({ field, value, onChange, error, userRole }: DynamicFieldProps) {
  const isVisible = isFieldVisible(field, userRole)
  const isReadonly = isFieldReadonly(field, userRole)
  
  if (!isVisible) return null

  const commonProps = {
    id: field.name,
    name: field.name,
    label: field.ui.label,
    required: field.ui.validation?.required,
    error: error,
    disabled: isReadonly
  }

  // Format display value based on field type
  const formatValue = (val: any) => {
    if (val === null || val === undefined) return ''
    
    switch (field.type) {
      case 'number':
        return val === '' ? '' : Number(val)
      case 'boolean':
        return Boolean(val)
      case 'date':
        if (val instanceof Date) return val.toISOString().split('T')[0]
        if (typeof val === 'string' && val) return val.split('T')[0]
        return val
      default:
        return String(val)
    }
  }

  // Handle value changes with type conversion
  const handleChange = (newValue: any) => {
    switch (field.type) {
      case 'number':
        onChange(newValue === '' ? null : Number(newValue))
        break
      case 'boolean':
        onChange(Boolean(newValue))
        break
      case 'date':
        onChange(newValue ? new Date(newValue) : null)
        break
      default:
        onChange(newValue)
    }
  }

  switch (field.type) {
    case 'boolean':
      return (
        <div className="space-y-1">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={isReadonly}
              className="rounded border-border focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {field.ui.label}
              {field.ui.validation?.required && <span className="text-red-500"> *</span>}
            </span>
          </label>
          {field.ui.helpText && (
            <p className="text-xs text-muted-foreground">{field.ui.helpText}</p>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      )

    case 'date':
      return (
        <UniversalInput
          {...commonProps}
          type="date"
          value={formatValue(value)}
          placeholder={field.ui.placeholder}
          onChange={handleChange}
        />
      )

    case 'number':
      return (
        <UniversalInput
          {...commonProps}
          type="number"
          value={formatValue(value)}
          placeholder={field.ui.placeholder}
          step={field.ui.displayOptions?.step}
          min={field.ui.validation?.min}
          max={field.ui.validation?.max}
          onChange={handleChange}
        />
      )

    case 'text':
    default:
      // Use textarea for longer text fields or if specified
      if (field.name === 'description' || field.name === 'notes') {
        return (
          <UniversalTextarea
            {...commonProps}
            value={formatValue(value)}
            placeholder={field.ui.placeholder}
            rows={3}
            onChange={handleChange}
          />
        )
      }

      return (
        <UniversalInput
          {...commonProps}
          type={field.name === 'email' ? 'email' : field.name === 'phone' ? 'tel' : 'text'}
          value={formatValue(value)}
          placeholder={field.ui.placeholder}
          onChange={handleChange}
        />
      )
  }
}

// Relationship field component
interface RelationshipFieldProps {
  relationship: EnhancedRelationshipDef
  value: string[]
  onChange: (value: string[]) => void
  error?: string
  userRole: string
}

function RelationshipField({ relationship, value, onChange, error, userRole }: RelationshipFieldProps) {
  const isVisible = isRelationshipVisible(relationship, userRole)
  
  if (!isVisible) return null

  const { options, isLoading } = useEntityOptions({
    entityType: relationship.ui.entityType,
    displayField: relationship.ui.displayField || 'entity_name',
    searchFields: relationship.ui.searchFields || ['entity_name']
  })

  if (relationship.ui.multiple) {
    // Multi-select relationship
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {relationship.ui.label}
        </label>
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...value, option.value])
                  } else {
                    onChange(value.filter(v => v !== option.value))
                  }
                }}
                className="rounded border-border focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
        {relationship.ui.description && (
          <p className="text-xs text-muted-foreground">{relationship.ui.description}</p>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    )
  } else {
    // Single-select relationship
    return (
      <UniversalSelect
        id={relationship.type}
        name={relationship.type}
        label={relationship.ui.label}
        value={value[0] || ''}
        options={options}
        placeholder={isLoading ? 'Loading...' : `Select ${relationship.ui.label}`}
        onChange={(selectedValue) => {
          onChange(selectedValue ? [selectedValue] : [])
        }}
        error={error}
      />
    )
  }
}

// Main EntityForm component
export function EntityForm({
  preset,
  mode,
  initialData,
  userRole = 'user',
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = ''
}: EntityFormProps) {
  // Form state
  const [formData, setFormData] = useState<EntityFormData>(() => {
    const initial: EntityFormData = {
      entity_name: initialData?.entity_name || '',
      entity_code: initialData?.entity_code || '',
      smart_code: initialData?.smart_code || `HERA.SALON.${preset.entity_type}.ENTITY.v1`,
      dynamic_fields: applyDefaultsWithUI(preset, initialData?.dynamic_fields || {}, userRole),
      relationships: initialData?.relationships || {}
    }
    return initial
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData(prev => ({
        ...prev,
        entity_name: initialData.entity_name || prev.entity_name,
        entity_code: initialData.entity_code || prev.entity_code,
        smart_code: initialData.smart_code || prev.smart_code,
        dynamic_fields: applyDefaultsWithUI(preset, initialData.dynamic_fields || {}, userRole),
        relationships: initialData.relationships || {}
      }))
    }
  }, [initialData, preset, userRole, mode])

  // Handle field changes
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dynamic_fields: {
        ...prev.dynamic_fields,
        [fieldName]: value
      }
    }))
    setTouchedFields(prev => new Set([...prev, fieldName]))
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  // Handle relationship changes
  const handleRelationshipChange = (relationshipType: string, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      relationships: {
        ...prev.relationships,
        [relationshipType]: value
      }
    }))
    setTouchedFields(prev => new Set([...prev, relationshipType]))
    
    // Clear error when user makes selection
    if (errors[relationshipType]) {
      setErrors(prev => ({ ...prev, [relationshipType]: '' }))
    }
  }

  // Handle entity name change
  const handleEntityNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, entity_name: value }))
    setTouchedFields(prev => new Set([...prev, 'entity_name']))
    
    if (errors.entity_name) {
      setErrors(prev => ({ ...prev, entity_name: '' }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Validate entity name
    if (!formData.entity_name.trim()) {
      newErrors.entity_name = `${preset.ui.displayName} name is required`
    }
    
    // Validate dynamic fields
    const fieldValidation = validateDynamicFieldsWithUI(preset, formData.dynamic_fields, userRole)
    Object.assign(newErrors, fieldValidation.errors)
    
    // Validate required relationships
    for (const relationship of preset.relationships) {
      if (!isRelationshipVisible(relationship, userRole)) continue
      
      const values = formData.relationships[relationship.type] || []
      if (relationship.cardinality === 'one' && values.length === 0) {
        // Only mark as error if it's a required relationship (you might want to add this to the preset)
        // newErrors[relationship.type] = `${relationship.ui.label} is required`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
      // Handle submission errors
    }
  }

  // Group fields by form groups
  const groupedFields = preset.ui.formGroups?.reduce((acc, group) => {
    acc[group.name] = {
      ...group,
      fields: group.fields
        .map(fieldName => {
          if (fieldName === 'entity_name') return null // Handle separately
          return preset.dynamicFields.find(f => f.name === fieldName)
        })
        .filter((field): field is EnhancedDynamicFieldDef => field !== null)
    }
    return acc
  }, {} as Record<string, any>) || {}

  // Get ungrouped fields
  const groupedFieldNames = preset.ui.formGroups?.flatMap(g => g.fields) || []
  const ungroupedFields = preset.dynamicFields.filter(
    field => !groupedFieldNames.includes(field.name) && isFieldVisible(field, userRole)
  )

  return (
    <div className={className}>
      <UniversalForm onSubmit={handleSubmit}>
        {/* Basic entity information */}
        <UniversalFieldGroup title="Basic Information">
          <UniversalInput
            id="entity_name"
            name="entity_name"
            label={`${preset.ui.displayName} Name`}
            value={formData.entity_name}
            placeholder={`Enter ${preset.ui.displayName.toLowerCase()} name`}
            required
            error={errors.entity_name}
            onChange={handleEntityNameChange}
          />
        </UniversalFieldGroup>

        {/* Grouped dynamic fields */}
        {Object.entries(groupedFields)
          .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
          .map(([groupName, group]) => {
            const visibleFields = group.fields.filter((field: EnhancedDynamicFieldDef) => 
              isFieldVisible(field, userRole)
            )
            
            if (visibleFields.length === 0) return null
            
            return (
              <UniversalFieldGroup
                key={groupName}
                title={group.title}
                description={group.description}
              >
                {visibleFields
                  .sort((a: EnhancedDynamicFieldDef, b: EnhancedDynamicFieldDef) => 
                    (a.ui.order || 0) - (b.ui.order || 0)
                  )
                  .map((field: EnhancedDynamicFieldDef) => (
                    <DynamicField
                      key={field.name}
                      field={field}
                      value={formData.dynamic_fields[field.name]}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      error={errors[field.name]}
                      userRole={userRole}
                    />
                  ))}
              </UniversalFieldGroup>
            )
          })}

        {/* Ungrouped fields */}
        {ungroupedFields.length > 0 && (
          <UniversalFieldGroup title="Additional Information">
            {ungroupedFields
              .sort((a, b) => (a.ui.order || 0) - (b.ui.order || 0))
              .map((field) => (
                <DynamicField
                  key={field.name}
                  field={field}
                  value={formData.dynamic_fields[field.name]}
                  onChange={(value) => handleFieldChange(field.name, value)}
                  error={errors[field.name]}
                  userRole={userRole}
                />
              ))}
          </UniversalFieldGroup>
        )}

        {/* Relationships */}
        {preset.relationships.some(rel => isRelationshipVisible(rel, userRole)) && (
          <UniversalFieldGroup title="Relationships">
            {preset.relationships
              .filter(rel => isRelationshipVisible(rel, userRole))
              .map((relationship) => (
                <RelationshipField
                  key={relationship.type}
                  relationship={relationship}
                  value={formData.relationships[relationship.type] || []}
                  onChange={(value) => handleRelationshipChange(relationship.type, value)}
                  error={errors[relationship.type]}
                  userRole={userRole}
                />
              ))}
          </UniversalFieldGroup>
        )}

        {/* Form actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
          {onCancel && (
            <UniversalButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </UniversalButton>
          )}
          <UniversalButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {mode === 'create' ? `Create ${preset.ui.displayName}` : `Update ${preset.ui.displayName}`}
          </UniversalButton>
        </div>
      </UniversalForm>
    </div>
  )
}

// Export additional helper components for advanced use cases
export { DynamicField, RelationshipField }