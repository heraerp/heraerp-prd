/**
 * Universal Entity Edit Modal
 * Smart Code: HERA.MICRO_APPS.UNIVERSAL.ENTITY_EDIT_MODAL.v1
 * 
 * Advanced glassmorphism edit modal with micro-app form generation
 * Supports real-time validation, smart code updates, and field dependencies
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Edit,
  Sparkles,
  FileText,
  User,
  DollarSign,
  Settings,
  MoreHorizontal,
  Loader2,
  RefreshCw
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

// HERA Components
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'

// Services and Types
import { EntityListService, type EntityUpdatePayload } from '@/lib/micro-apps/EntityListService'
import { UniversalEntityRegistry, type EntityCreationConfig } from '@/lib/micro-apps/UniversalEntityRegistry'
import type { EntityListConfig } from '@/lib/micro-apps/UniversalEntityListRegistry'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Utilities
import { cn } from '@/lib/utils'
import { fadeSlide } from '@/components/ui-kit/design-tokens'

interface UniversalEntityEditModalProps {
  open: boolean
  onClose: () => void
  entity: any | null
  config: EntityListConfig
  service: EntityListService
  onEntityUpdated?: (updatedEntity: any) => void
  onError?: (error: string) => void
  className?: string
}

interface ValidationError {
  field: string
  message: string
}

interface FormState {
  basicData: Record<string, any>
  dynamicData: Record<string, any>
  smartCode: string
  isDirty: boolean
  isValid: boolean
}

/**
 * Universal Entity Edit Modal with advanced form generation
 */
export function UniversalEntityEditModal({
  open,
  onClose,
  entity,
  config,
  service,
  onEntityUpdated,
  onError,
  className = ''
}: UniversalEntityEditModalProps) {
  
  // Auth context
  const { user, organization } = useHERAAuth()

  // State management
  const [formState, setFormState] = useState<FormState>({
    basicData: {},
    dynamicData: {},
    smartCode: '',
    isDirty: false,
    isValid: true
  })

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creationConfig, setCreationConfig] = useState<EntityCreationConfig | null>(null)

  /**
   * Initialize form when entity or modal opens
   */
  useEffect(() => {
    if (!open || !entity || !config) {
      return
    }

    const initializeForm = async () => {
      try {
        setLoading(true)
        console.log('📝 Initializing edit form for entity:', entity.id)

        // Get creation config for form fields
        const entityConfig = await UniversalEntityRegistry.getEntityCreationConfig(
          config.entityType,
          config.microAppConfig.app_code,
          config.workspaceContext
        )

        if (!entityConfig) {
          throw new Error('Failed to load entity configuration')
        }

        setCreationConfig(entityConfig)

        // Initialize form state with current entity data
        setFormState({
          basicData: {
            entity_name: entity.entity_name || '',
            entity_code: entity.entity_code || '',
            entity_description: entity.entity_description || ''
          },
          dynamicData: entity.dynamic_data || {},
          smartCode: entity.smart_code || '',
          isDirty: false,
          isValid: true
        })

        setValidationErrors([])
        console.log('✅ Edit form initialized')

      } catch (error) {
        console.error('❌ Error initializing edit form:', error)
        onError?.(error instanceof Error ? error.message : 'Failed to initialize form')
      } finally {
        setLoading(false)
      }
    }

    initializeForm()
  }, [open, entity, config, onError])

  /**
   * Handle field value changes
   */
  const handleFieldChange = useCallback((fieldName: string, value: any, isBasicField = false) => {
    setFormState(prev => {
      const newState = { ...prev }
      
      if (isBasicField) {
        newState.basicData = { ...prev.basicData, [fieldName]: value }
      } else {
        newState.dynamicData = { ...prev.dynamicData, [fieldName]: value }
      }

      newState.isDirty = true
      
      return newState
    })

    // Clear field-specific validation errors
    setValidationErrors(prev => prev.filter(error => error.field !== fieldName))
  }, [])

  /**
   * Validate form data
   */
  const validateForm = useCallback((): boolean => {
    const errors: ValidationError[] = []

    // Validate entity name (required)
    if (!formState.basicData.entity_name?.trim()) {
      errors.push({
        field: 'entity_name',
        message: 'Entity name is required'
      })
    }

    // Validate required dynamic fields
    if (creationConfig) {
      creationConfig.fields.forEach(field => {
        if (field.required && !formState.dynamicData[field.id]?.toString()?.trim()) {
          errors.push({
            field: field.id,
            message: `${field.label} is required`
          })
        }

        // Type-specific validation
        if (formState.dynamicData[field.id]) {
          const value = formState.dynamicData[field.id]

          if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              errors.push({
                field: field.id,
                message: 'Please enter a valid email address'
              })
            }
          }

          if (field.type === 'number' && value && isNaN(Number(value))) {
            errors.push({
              field: field.id,
              message: 'Please enter a valid number'
            })
          }

          if (field.type === 'url' && value) {
            try {
              new URL(value)
            } catch {
              errors.push({
                field: field.id,
                message: 'Please enter a valid URL'
              })
            }
          }
        }

        // Custom validation if provided
        if (field.validation && formState.dynamicData[field.id]) {
          const customError = field.validation(formState.dynamicData[field.id])
          if (customError) {
            errors.push({
              field: field.id,
              message: customError
            })
          }
        }
      })
    }

    setValidationErrors(errors)
    
    const isValid = errors.length === 0
    setFormState(prev => ({ ...prev, isValid }))
    
    return isValid
  }, [formState.basicData, formState.dynamicData, creationConfig])

  /**
   * Handle form submission
   */
  const handleSave = useCallback(async () => {
    if (!user?.id || !organization?.id || !entity) {
      onError?.('Authentication required')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      console.log('💾 Saving entity updates:', entity.id)

      const updatePayload: EntityUpdatePayload = {
        entityId: entity.id,
        entityType: config.entityType,
        updates: formState.basicData,
        dynamicFields: formState.dynamicData,
        actorUserId: user.id,
        organizationId: organization.id
      }

      const updatedEntity = await service.updateEntity(updatePayload)

      // Merge the updates back into the entity object for the callback
      const mergedEntity = {
        ...entity,
        ...formState.basicData,
        dynamic_data: { ...entity.dynamic_data, ...formState.dynamicData },
        updated_at: new Date().toISOString(),
        updated_by: user.id
      }

      console.log('✅ Entity updated successfully')
      onEntityUpdated?.(mergedEntity)
      onClose()

    } catch (error) {
      console.error('❌ Error saving entity:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to save entity')
    } finally {
      setSaving(false)
    }
  }, [user, organization, entity, formState, config, service, validateForm, onEntityUpdated, onClose, onError])

  /**
   * Handle modal close with unsaved changes warning
   */
  const handleClose = useCallback(() => {
    if (formState.isDirty && !saving) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [formState.isDirty, saving, onClose])

  /**
   * Get appropriate icon for section
   */
  const getSectionIcon = useCallback((sectionId: string) => {
    const icons = {
      basic: FileText,
      contact: User,
      financial: DollarSign,
      details: Settings,
      additional: MoreHorizontal
    }
    return icons[sectionId as keyof typeof icons] || FileText
  }, [])

  /**
   * Render form field based on type
   */
  const renderFormField = useCallback((field: any) => {
    const value = formState.dynamicData[field.id] || ''
    const error = validationErrors.find(e => e.field === field.id)
    const hasError = !!error

    const baseClassName = cn(
      "w-full transition-all duration-200",
      hasError && "border-red-300 focus:border-red-500 focus:ring-red-500/20",
      !hasError && "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
    )

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={cn(baseClassName, "min-h-[100px] resize-y")}
            rows={4}
          />
        )

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          >
            <SelectTrigger className={baseClassName}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-slate-500">{option.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              id={field.id}
            />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.placeholder || `Enable ${field.label.toLowerCase()}`}
            </Label>
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseClassName}
            step="any"
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseClassName}
          />
        )

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseClassName}
          />
        )

      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseClassName}
          />
        )

      case 'phone':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseClassName}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseClassName}
          />
        )
    }
  }, [formState.dynamicData, validationErrors, handleFieldChange])

  if (!entity || !config) {
    return null
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={handleClose}
      title="Edit Entity"
      description={`Update ${config.entityLabel.toLowerCase()} information`}
      icon={<Edit className="w-6 h-6" />}
      size="xl"
      showCloseButton={!saving}
      validationErrors={validationErrors}
      showValidationSummary={validationErrors.length > 0}
      className={className}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {formState.isDirty && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
            
            {formState.isValid && formState.isDirty && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready to save
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <SalonLuxeButton
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="min-w-[100px]"
            >
              Cancel
            </SalonLuxeButton>
            
            <SalonLuxeButton
              type="submit"
              onClick={handleSave}
              disabled={!formState.isValid || !formState.isDirty || saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </div>
              )}
            </SalonLuxeButton>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
            <p className="text-champagne">Loading entity configuration...</p>
          </div>
        </div>
      ) : creationConfig ? (
        <motion.div className="space-y-8" {...fadeSlide()}>
          {/* Entity Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gold" />
              <h3 className="text-lg font-semibold text-champagne">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="entity_name" className="text-champagne font-medium">
                  Entity Name *
                </Label>
                <Input
                  id="entity_name"
                  value={formState.basicData.entity_name || ''}
                  onChange={(e) => handleFieldChange('entity_name', e.target.value, true)}
                  placeholder="Enter entity name"
                  className={cn(
                    "mt-1",
                    validationErrors.find(e => e.field === 'entity_name') && "border-red-300"
                  )}
                />
                {validationErrors.find(e => e.field === 'entity_name') && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.find(e => e.field === 'entity_name')?.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="entity_code" className="text-champagne font-medium">
                  Entity Code
                </Label>
                <Input
                  id="entity_code"
                  value={formState.basicData.entity_code || ''}
                  onChange={(e) => handleFieldChange('entity_code', e.target.value, true)}
                  placeholder="Enter entity code"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="smart_code" className="text-champagne font-medium">
                Smart Code
              </Label>
              <div className="mt-1 px-3 py-2 bg-charcoal-dark rounded-lg border border-gold/20">
                <code className="text-gold text-sm font-mono">
                  {formState.smartCode || entity.smart_code}
                </code>
              </div>
            </div>
          </div>

          {/* Dynamic Fields by Section */}
          {creationConfig.sections.map(section => {
            const sectionFields = creationConfig.fields.filter(field => field.section === section.id)
            if (sectionFields.length === 0) return null

            const SectionIcon = getSectionIcon(section.id)

            return (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <SectionIcon className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-semibold text-champagne">
                    {section.label}
                  </h3>
                  {section.required && (
                    <Badge variant="outline" className="bg-red-50/10 text-red-400 border-red-400/30">
                      Required
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-bronze mb-4">{section.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sectionFields.map(field => {
                    const fieldError = validationErrors.find(e => e.field === field.id)
                    
                    return (
                      <div key={field.id}>
                        <Label htmlFor={field.id} className="text-champagne font-medium">
                          {field.label}
                          {field.required && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </Label>
                        
                        <div className="mt-1">
                          {renderFormField(field)}
                        </div>

                        {fieldError && (
                          <p className="mt-1 text-sm text-red-400">
                            {fieldError.message}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Additional Information */}
          <div className="pt-6 border-t border-gold/20">
            <div className="text-xs text-bronze space-y-1">
              <p>Last updated: {entity.updated_at ? new Date(entity.updated_at).toLocaleString() : 'Never'}</p>
              <p>Created: {entity.created_at ? new Date(entity.created_at).toLocaleString() : 'Unknown'}</p>
              {entity.updated_by && <p>Updated by: {entity.updated_by}</p>}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-champagne">Failed to load entity configuration</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}
    </SalonLuxeModal>
  )
}

export default UniversalEntityEditModal