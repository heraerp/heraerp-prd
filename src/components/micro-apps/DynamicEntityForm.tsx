'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS, SALON_LUXE_GRADIENTS } from '@/lib/constants/salon-luxe-colors'
import { SalonLuxeInput } from '@/components/salon/shared/SalonLuxeInput'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeSelect } from '@/components/salon/shared/SalonLuxeSelect'
import { SalonLuxeBadge } from '@/components/salon/shared/SalonLuxeBadge'
import { 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  FileText,
  Hash,
  Link,
  Eye,
  EyeOff
} from 'lucide-react'
import type { 
  DynamicEntityBuildResponse, 
  DynamicFieldDefinition,
  EnhancedDynamicEntityBuilder
} from '@/lib/micro-apps/enhanced-dynamic-entity-builder'

/**
 * HERA Dynamic Entity Form Component
 * Smart Code: HERA.PLATFORM.MICRO_APPS.COMPONENTS.ENTITY_FORM.v1
 * 
 * Enterprise-grade form component for dynamic entities with:
 * ✅ SAP Fiori design standards with glassmorphism
 * ✅ Automatic field rendering from entity configuration
 * ✅ Real-time validation with visual feedback
 * ✅ Mobile-first responsive design with 44px touch targets
 * ✅ Smooth animations and micro-interactions
 * ✅ Multi-group field organization
 * ✅ Conditional field display
 * ✅ Integration with Enhanced Dynamic Entity Builder
 */

export interface DynamicEntityFormProps {
  /** Entity configuration from Enhanced Dynamic Entity Builder */
  entityConfig: DynamicEntityBuildResponse
  /** Builder instance for execution */
  builder: EnhancedDynamicEntityBuilder
  /** Organization context */
  organizationId: string
  /** Initial data for editing */
  initialData?: Record<string, any>
  /** Form mode */
  mode: 'create' | 'edit' | 'view'
  /** Success callback */
  onSuccess?: (result: any) => void
  /** Error callback */
  onError?: (error: string) => void
  /** Cancel callback */
  onCancel?: () => void
  /** Custom className */
  className?: string
  /** Show form in modal style */
  modalStyle?: boolean
  /** Custom form title */
  title?: string
  /** Enable animations */
  animated?: boolean
}

export interface FieldState {
  value: any
  error?: string
  touched: boolean
  visible: boolean
}

export function DynamicEntityForm({
  entityConfig,
  builder,
  organizationId,
  initialData = {},
  mode = 'create',
  onSuccess,
  onError,
  onCancel,
  className,
  modalStyle = false,
  title,
  animated = true
}: DynamicEntityFormProps) {
  const [formData, setFormData] = useState<Record<string, FieldState>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [activeGroup, setActiveGroup] = useState<string>('')

  const isReadonly = mode === 'view'
  const formTitle = title || `${mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'} ${entityConfig.entity_definition.display_name}`

  // Initialize form data
  useEffect(() => {
    if (!entityConfig.success) return

    const initialFormData: Record<string, FieldState> = {}
    
    // Add entity name field
    initialFormData.entity_name = {
      value: initialData.entity_name || '',
      touched: false,
      visible: true
    }

    // Add dynamic fields
    entityConfig.field_mappings.forEach(mapping => {
      const fieldValue = initialData[mapping.field_name] || getDefaultValue(mapping)
      initialFormData[mapping.field_name] = {
        value: fieldValue,
        touched: false,
        visible: evaluateFieldVisibility(mapping.field_name, initialFormData)
      }
    })

    setFormData(initialFormData)

    // Set default active group
    const firstGroup = getFieldGroups()[0]
    if (firstGroup) {
      setActiveGroup(firstGroup.group_id)
    }
  }, [entityConfig, initialData])

  // Get default value for field
  const getDefaultValue = (mapping: any): any => {
    if (mapping.ui_config?.default_value !== undefined) {
      return mapping.ui_config.default_value
    }
    
    switch (mapping.field_type) {
      case 'boolean': return false
      case 'number': return 0
      case 'date': return ''
      case 'email': return ''
      case 'phone': return ''
      case 'select': return ''
      default: return ''
    }
  }

  // Evaluate field visibility based on conditional display rules
  const evaluateFieldVisibility = (fieldName: string, currentFormData: Record<string, FieldState>): boolean => {
    const mapping = entityConfig.field_mappings.find(m => m.field_name === fieldName)
    const conditionalRules = mapping?.ui_config?.conditional_display || []
    
    if (conditionalRules.length === 0) return true

    return conditionalRules.every((rule: any) => {
      const dependentValue = currentFormData[rule.field_name]?.value
      
      switch (rule.operator) {
        case 'equals': return dependentValue === rule.value
        case 'not_equals': return dependentValue !== rule.value
        case 'contains': return String(dependentValue).includes(rule.value)
        case 'greater_than': return Number(dependentValue) > Number(rule.value)
        case 'less_than': return Number(dependentValue) < Number(rule.value)
        default: return true
      }
    })
  }

  // Get field groups from entity config or create default
  const getFieldGroups = () => {
    if (entityConfig.runtime_config?.ui_config?.groups) {
      return entityConfig.runtime_config.ui_config.groups
    }

    // Create default groups based on field order
    const allFields = ['entity_name', ...entityConfig.field_mappings.map(m => m.field_name)]
    return [
      {
        group_id: 'general',
        title: 'General Information',
        description: 'Basic entity information',
        fields: allFields,
        default_expanded: true
      }
    ]
  }

  // Update field value and trigger validation
  const updateFieldValue = (fieldName: string, value: any) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value,
          touched: true,
          error: validateField(fieldName, value, prev)
        }
      }

      // Re-evaluate visibility for all fields
      Object.keys(updated).forEach(key => {
        updated[key].visible = evaluateFieldVisibility(key, updated)
      })

      return updated
    })
    setSubmitError('')
  }

  // Validate individual field
  const validateField = (fieldName: string, value: any, currentData: Record<string, FieldState>): string | undefined => {
    if (fieldName === 'entity_name') {
      if (!value || value.trim().length === 0) {
        return 'Entity name is required'
      }
      return undefined
    }

    const mapping = entityConfig.field_mappings.find(m => m.field_name === fieldName)
    if (!mapping) return undefined

    const validationRules = mapping.validation_rules || []

    for (const rule of validationRules) {
      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            return rule.message || `${fieldName} is required`
          }
          break
        case 'min_length':
          if (value && String(value).length < rule.value) {
            return rule.message || `Must be at least ${rule.value} characters`
          }
          break
        case 'max_length':
          if (value && String(value).length > rule.value) {
            return rule.message || `Must not exceed ${rule.value} characters`
          }
          break
        case 'min_value':
          if (value !== undefined && Number(value) < rule.value) {
            return rule.message || `Must be at least ${rule.value}`
          }
          break
        case 'max_value':
          if (value !== undefined && Number(value) > rule.value) {
            return rule.message || `Must not exceed ${rule.value}`
          }
          break
        case 'regex':
          if (value && !new RegExp(rule.pattern).test(String(value))) {
            return rule.message || 'Invalid format'
          }
          break
        case 'allowed_values':
          if (value && !rule.values.includes(value)) {
            return rule.message || `Must be one of: ${rule.values.join(', ')}`
          }
          break
      }
    }

    return undefined
  }

  // Validate entire form
  const validateForm = (): boolean => {
    let isValid = true
    const updatedFormData = { ...formData }

    Object.keys(formData).forEach(fieldName => {
      const field = formData[fieldName]
      if (field.visible) {
        const error = validateField(fieldName, field.value, formData)
        updatedFormData[fieldName] = {
          ...field,
          error,
          touched: true
        }
        if (error) isValid = false
      }
    })

    setFormData(updatedFormData)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadonly || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      if (!validateForm()) {
        setSubmitError('Please fix validation errors before submitting')
        return
      }

      // Prepare data for submission
      const submitData: Record<string, any> = {}
      Object.entries(formData).forEach(([fieldName, field]) => {
        if (field.visible && field.value !== undefined && field.value !== '') {
          submitData[fieldName] = field.value
        }
      })

      // Execute via Enhanced Dynamic Entity Builder
      const result = await builder.executeEntityOperation(
        entityConfig,
        mode === 'create' ? 'create' : 'update',
        submitData,
        organizationId,
        {
          validate_before_save: true,
          auto_generate_codes: true,
          trigger_workflows: true
        }
      )

      if (result.success) {
        onSuccess?.(result)
      } else {
        throw new Error(result.error || 'Failed to save entity')
      }

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred'
      setSubmitError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get field icon
  const getFieldIcon = (fieldType: string, fieldName: string) => {
    if (fieldName.includes('email')) return <Mail className="w-4 h-4" />
    if (fieldName.includes('phone')) return <Phone className="w-4 h-4" />
    if (fieldName.includes('date')) return <Calendar className="w-4 h-4" />
    if (fieldName.includes('amount') || fieldName.includes('price') || fieldName.includes('cost')) return <DollarSign className="w-4 h-4" />
    if (fieldName.includes('code') || fieldName.includes('number')) return <Hash className="w-4 h-4" />
    if (fieldName.includes('url') || fieldName.includes('link')) return <Link className="w-4 h-4" />
    if (fieldName.includes('name') || fieldName.includes('customer') || fieldName.includes('user')) return <User className="w-4 h-4" />
    
    switch (fieldType) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'number': return <Hash className="w-4 h-4" />
      case 'boolean': return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  // Render field based on type
  const renderField = (fieldName: string, mapping?: any) => {
    const field = formData[fieldName]
    if (!field || !field.visible) return null

    const isEntityName = fieldName === 'entity_name'
    const fieldType = isEntityName ? 'text' : mapping?.field_type || 'text'
    const displayLabel = isEntityName ? 'Name' : (mapping?.ui_config?.display_label || fieldName)
    const placeholder = isEntityName ? 'Enter entity name' : mapping?.ui_config?.placeholder
    const helpText = mapping?.ui_config?.help_text
    
    const commonProps = {
      value: field.value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
        updateFieldValue(fieldName, e.target.value),
      disabled: isReadonly || isSubmitting,
      error: !!field.error,
      placeholder: placeholder || `Enter ${displayLabel.toLowerCase()}`,
      leftIcon: getFieldIcon(fieldType, fieldName)
    }

    const renderInput = () => {
      switch (fieldType) {
        case 'email':
          return (
            <SalonLuxeInput
              {...commonProps}
              type="email"
            />
          )
        
        case 'phone':
          return (
            <SalonLuxeInput
              {...commonProps}
              type="tel"
            />
          )
        
        case 'number':
          return (
            <SalonLuxeInput
              {...commonProps}
              type="number"
              onChange={(e) => updateFieldValue(fieldName, parseFloat(e.target.value) || 0)}
            />
          )
        
        case 'date':
          return (
            <SalonLuxeInput
              {...commonProps}
              type="date"
            />
          )
        
        case 'boolean':
          return (
            <div className="flex items-center gap-3 h-12">
              <button
                type="button"
                onClick={() => updateFieldValue(fieldName, !field.value)}
                disabled={isReadonly || isSubmitting}
                className={cn(
                  'w-12 h-6 rounded-full relative transition-all duration-300 ease-out',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
                  field.value
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700'
                )}
                style={{
                  boxShadow: field.value 
                    ? `0 4px 12px rgba(34, 197, 94, 0.4)`
                    : `0 2px 8px rgba(0, 0, 0, 0.2)`
                }}
              >
                <div
                  className={cn(
                    'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ease-out shadow-lg',
                    field.value ? 'translate-x-6' : 'translate-x-0.5'
                  )}
                />
              </button>
              <span 
                className="text-sm font-medium"
                style={{ color: SALON_LUXE_COLORS.text.secondary }}
              >
                {field.value ? 'Yes' : 'No'}
              </span>
            </div>
          )
        
        case 'select':
          const options = mapping?.validation_rules?.find((r: any) => r.type === 'allowed_values')?.values || []
          return (
            <SalonLuxeSelect
              value={field.value || ''}
              onValueChange={(value) => updateFieldValue(fieldName, value)}
              disabled={isReadonly || isSubmitting}
              placeholder={placeholder}
            >
              <option value="">Select {displayLabel.toLowerCase()}</option>
              {options.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SalonLuxeSelect>
          )
        
        case 'text':
        default:
          return (
            <SalonLuxeInput
              {...commonProps}
              type="text"
            />
          )
      }
    }

    return (
      <div 
        key={fieldName}
        className={cn(
          'space-y-2 transition-all duration-500 ease-out',
          animated && 'animate-in fade-in slide-in-from-left-1'
        )}
      >
        <label 
          className="block text-sm font-semibold"
          style={{ color: SALON_LUXE_COLORS.text.primary }}
        >
          {displayLabel}
          {mapping?.validation_rules?.some((r: any) => r.type === 'required') && (
            <span style={{ color: SALON_LUXE_COLORS.error.base }}> *</span>
          )}
        </label>
        
        {renderInput()}
        
        {field.error && (
          <div 
            className={cn(
              'flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-1 duration-300'
            )}
            style={{ color: SALON_LUXE_COLORS.error.base }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {field.error}
          </div>
        )}
        
        {helpText && !field.error && (
          <p 
            className="text-xs"
            style={{ color: SALON_LUXE_COLORS.text.tertiary }}
          >
            {helpText}
          </p>
        )}
      </div>
    )
  }

  // Render field group
  const renderFieldGroup = (group: any) => {
    const groupFields = group.fields.filter((fieldName: string) => {
      if (fieldName === 'entity_name') return true
      return entityConfig.field_mappings.some(m => m.field_name === fieldName)
    })

    if (groupFields.length === 0) return null

    const isActive = activeGroup === group.group_id
    
    return (
      <div 
        key={group.group_id}
        className={cn(
          'rounded-xl border transition-all duration-500 overflow-hidden',
          isActive && 'ring-2 ring-offset-2 ring-offset-transparent',
          animated && 'animate-in fade-in slide-in-from-top-2'
        )}
        style={{
          background: SALON_LUXE_GRADIENTS.charcoal,
          border: `1px solid ${SALON_LUXE_COLORS.border.base}`,
          boxShadow: isActive 
            ? `0 8px 24px rgba(212, 175, 55, 0.2)`
            : `0 4px 16px rgba(0, 0, 0, 0.1)`,
          ...(isActive && { 
            ringColor: SALON_LUXE_COLORS.gold.base + '40' 
          })
        }}
      >
        <button
          type="button"
          onClick={() => setActiveGroup(isActive ? '' : group.group_id)}
          className={cn(
            'w-full p-6 text-left transition-all duration-300 hover:backdrop-blur-xl',
            'focus:outline-none focus:ring-2 focus:ring-inset'
          )}
          style={{
            background: isActive 
              ? SALON_LUXE_GRADIENTS.goldAccent 
              : 'transparent',
            focusRingColor: SALON_LUXE_COLORS.gold.base + '60'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 
                className={cn(
                  'text-lg font-bold transition-all duration-300',
                  isActive && 'text-shadow-sm'
                )}
                style={{ 
                  color: isActive 
                    ? SALON_LUXE_COLORS.gold.base 
                    : SALON_LUXE_COLORS.text.primary 
                }}
              >
                {group.title}
              </h3>
              {group.description && (
                <p 
                  className="text-sm mt-1"
                  style={{ color: SALON_LUXE_COLORS.text.secondary }}
                >
                  {group.description}
                </p>
              )}
            </div>
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
                isActive ? 'rotate-180' : 'rotate-0'
              )}
              style={{
                background: isActive 
                  ? SALON_LUXE_COLORS.gold.base 
                  : SALON_LUXE_COLORS.charcoal.light,
                color: isActive 
                  ? SALON_LUXE_COLORS.text.onGold 
                  : SALON_LUXE_COLORS.text.secondary
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
        
        {isActive && (
          <div 
            className={cn(
              'p-6 pt-0 space-y-6',
              animated && 'animate-in fade-in slide-in-from-top-1 duration-500'
            )}
          >
            {groupFields.map((fieldName: string) => {
              if (fieldName === 'entity_name') {
                return renderField(fieldName)
              }
              const mapping = entityConfig.field_mappings.find(m => m.field_name === fieldName)
              return renderField(fieldName, mapping)
            })}
          </div>
        )}
      </div>
    )
  }

  if (!entityConfig.success) {
    return (
      <div className="p-6 text-center">
        <AlertCircle 
          className="w-12 h-12 mx-auto mb-4" 
          style={{ color: SALON_LUXE_COLORS.error.base }} 
        />
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: SALON_LUXE_COLORS.text.primary }}
        >
          Configuration Error
        </h3>
        <p style={{ color: SALON_LUXE_COLORS.text.secondary }}>
          {entityConfig.error || 'Invalid entity configuration'}
        </p>
      </div>
    )
  }

  const fieldGroups = getFieldGroups()

  return (
    <div 
      className={cn(
        'w-full',
        modalStyle ? 'max-w-4xl mx-auto' : '',
        className
      )}
    >
      {/* Form Header */}
      <div 
        className={cn(
          'flex items-center justify-between p-6 border-b',
          animated && 'animate-in fade-in slide-in-from-top-2 duration-500'
        )}
        style={{ 
          borderColor: SALON_LUXE_COLORS.border.light,
          background: modalStyle ? SALON_LUXE_GRADIENTS.charcoal : 'transparent'
        }}
      >
        <div>
          <h2 
            className="text-2xl font-bold"
            style={{ 
              background: SALON_LUXE_GRADIENTS.goldLight,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {formTitle}
          </h2>
          <p 
            className="text-sm mt-1"
            style={{ color: SALON_LUXE_COLORS.text.secondary }}
          >
            {mode === 'create' ? 'Fill out the form to create a new entity' : 
             mode === 'edit' ? 'Update the entity information' : 
             'View entity details'}
          </p>
        </div>
        
        {isReadonly && (
          <SalonLuxeBadge variant="secondary">
            <Eye className="w-3 h-3 mr-1" />
            Read-only
          </SalonLuxeBadge>
        )}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={cn('p-6', animated && 'space-y-6')}>
          {fieldGroups.map(renderFieldGroup)}
        </div>

        {/* Submit Error */}
        {submitError && (
          <div 
            className={cn(
              'mx-6 p-4 rounded-lg flex items-center gap-3',
              animated && 'animate-in fade-in slide-in-from-bottom-1 duration-300'
            )}
            style={{ 
              background: SALON_LUXE_GRADIENTS.error,
              border: `1px solid ${SALON_LUXE_COLORS.error.base}60`
            }}
          >
            <AlertCircle 
              className="w-5 h-5 flex-shrink-0" 
              style={{ color: SALON_LUXE_COLORS.error.base }}
            />
            <p 
              className="text-sm font-medium"
              style={{ color: SALON_LUXE_COLORS.error.text }}
            >
              {submitError}
            </p>
          </div>
        )}

        {/* Form Actions */}
        {!isReadonly && (
          <div 
            className={cn(
              'flex items-center justify-end gap-3 p-6 border-t',
              animated && 'animate-in fade-in slide-in-from-bottom-2 duration-500'
            )}
            style={{ borderColor: SALON_LUXE_COLORS.border.light }}
          >
            {onCancel && (
              <SalonLuxeButton 
                variant="secondary" 
                onClick={onCancel}
                disabled={isSubmitting}
                className="min-w-[120px] min-h-[44px]"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </SalonLuxeButton>
            )}
            
            <SalonLuxeButton 
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="min-w-[120px] min-h-[44px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Create' : 'Update'} {entityConfig.entity_definition.display_name}
            </SalonLuxeButton>
          </div>
        )}
      </form>
    </div>
  )
}