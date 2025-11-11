/**
 * HERA v3.0 Dynamic Form Generator
 * Generates CRUD forms from entity templates
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  templateCompiler,
  type CompiledTemplate,
  type FormComponentProps 
} from '@/lib/platform/template-compiler'
import { useEntityTemplate } from '@/hooks/useTemplatePack'
import { useHERAAuthV3 } from '@/components/auth/HERAAuthProviderV3'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, X, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DynamicFormGeneratorProps {
  templateId: string
  entityId?: string
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => Promise<void>
  onCancel: () => void
  mode: 'create' | 'edit' | 'view'
  className?: string
}

export function DynamicFormGenerator({
  templateId,
  entityId,
  initialData,
  onSubmit,
  onCancel,
  mode,
  className = ''
}: DynamicFormGeneratorProps) {
  const { organization } = useHERAAuthV3()
  const { entityTemplate, isLoading: templateLoading, error: templateError } = useEntityTemplate(templateId)
  
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {})
  const [compiledTemplate, setCompiledTemplate] = useState<CompiledTemplate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<string>('')

  // Compile template when it loads
  useEffect(() => {
    if (entityTemplate && organization?.industry) {
      templateCompiler.compileEntityTemplate(entityTemplate, organization.industry)
        .then(compiled => {
          setCompiledTemplate(compiled)
          // Set first tab as active
          if (entityTemplate.ui_config.form_view.tabs.length > 0) {
            setActiveTab(entityTemplate.ui_config.form_view.tabs[0].id)
          }
        })
        .catch(error => {
          console.error('Failed to compile template:', error)
        })
    }
  }, [entityTemplate, organization?.industry])

  // Form validation
  const validateForm = useMemo(() => {
    if (!compiledTemplate) return () => ({})
    
    return (data: Record<string, any>) => {
      const errors: Record<string, string> = {}
      const schema = compiledTemplate.validationSchema
      
      Object.entries(schema).forEach(([fieldName, rules]) => {
        const value = data[fieldName]
        
        // Required field validation
        if (rules.required && (!value || value.toString().trim() === '')) {
          errors[fieldName] = 'This field is required'
          return
        }
        
        // Type validation
        if (value && rules.type) {
          switch (rules.type) {
            case 'email':
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors[fieldName] = 'Please enter a valid email address'
              }
              break
            case 'phone':
              if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
                errors[fieldName] = 'Please enter a valid phone number'
              }
              break
            case 'number':
              if (isNaN(Number(value))) {
                errors[fieldName] = 'Please enter a valid number'
              }
              break
          }
        }
        
        // Custom validation rules
        if (value && rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors[fieldName] = 'Please enter a valid format'
        }
        
        if (value && rules.min_length && value.length < rules.min_length) {
          errors[fieldName] = `Minimum length is ${rules.min_length} characters`
        }
        
        if (value && rules.max_length && value.length > rules.max_length) {
          errors[fieldName] = `Maximum length is ${rules.max_length} characters`
        }
        
        if (value && rules.min && Number(value) < rules.min) {
          errors[fieldName] = `Minimum value is ${rules.min}`
        }
        
        if (value && rules.max && Number(value) > rules.max) {
          errors[fieldName] = `Maximum value is ${rules.max}`
        }
      })
      
      return errors
    }
  }, [compiledTemplate])

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleSubmit = async () => {
    if (!entityTemplate || !organization?.id) return
    
    // Validate form
    const errors = validateForm(formData)
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Add system fields
      const submitData = {
        ...formData,
        organization_id: organization.id,
        entity_type: entityTemplate.entity_type,
        smart_code: `${entityTemplate.smart_code_prefix}.v1`,
        ...(entityId && { id: entityId })
      }
      
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
      // Handle error - could show toast notification
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (fieldName: string, fieldConfig: any) => {
    const value = formData[fieldName] || fieldConfig.default || ''
    const error = validationErrors[fieldName]
    const disabled = mode === 'view'
    
    // Determine input type based on field configuration
    const getInputType = () => {
      if (fieldConfig.field_type === 'email') return 'email'
      if (fieldConfig.field_type === 'phone') return 'tel'
      if (fieldConfig.field_type === 'number') return 'number'
      if (fieldConfig.field_type === 'date') return 'date'
      return 'text'
    }

    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName} className={fieldConfig.required ? 'required' : ''}>
          {fieldConfig.label}
          {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {/* Render different input types */}
        {fieldConfig.validation_rules?.enum ? (
          // Select dropdown for enum fields
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(fieldName, newValue)}
            disabled={disabled}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.validation_rules.enum.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : fieldConfig.ui_hints?.input_type === 'textarea' ? (
          // Textarea for long text
          <Textarea
            id={fieldName}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={fieldConfig.placeholder}
            disabled={disabled}
            rows={fieldConfig.ui_hints?.rows || 3}
            className={error ? 'border-red-500' : ''}
          />
        ) : fieldConfig.field_type === 'boolean' ? (
          // Checkbox for boolean
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={fieldName}
              checked={value === true}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300"
            />
            <Label htmlFor={fieldName} className="text-sm font-normal">
              {fieldConfig.label}
            </Label>
          </div>
        ) : (
          // Regular input
          <div className="relative">
            {fieldConfig.ui_hints?.prefix && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {fieldConfig.ui_hints.prefix}
              </span>
            )}
            <Input
              type={getInputType()}
              id={fieldName}
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={fieldConfig.placeholder}
              disabled={disabled}
              className={`${error ? 'border-red-500' : ''} ${fieldConfig.ui_hints?.prefix ? 'pl-8' : ''} ${fieldConfig.ui_hints?.suffix ? 'pr-16' : ''}`}
            />
            {fieldConfig.ui_hints?.suffix && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {fieldConfig.ui_hints.suffix}
              </span>
            )}
          </div>
        )}
        
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    )
  }

  if (templateLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading template...
      </div>
    )
  }

  if (templateError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load template: {templateError}
        </AlertDescription>
      </Alert>
    )
  }

  if (!entityTemplate || !compiledTemplate) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Template not available
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {entityTemplate.template_name}
          {mode === 'view' && <Badge variant="secondary">Read Only</Badge>}
          {mode === 'edit' && <Badge variant="outline">Editing</Badge>}
          {mode === 'create' && <Badge variant="default">New</Badge>}
        </CardTitle>
        <CardDescription>
          {entityTemplate.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {entityTemplate.ui_config.form_view.tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {entityTemplate.ui_config.form_view.tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tab.fields.map((fieldName) => {
                  // Get field configuration
                  const standardField = entityTemplate.standard_fields[fieldName]
                  const dynamicField = entityTemplate.dynamic_fields.find(f => f.field_name === fieldName)
                  const fieldConfig = standardField || dynamicField
                  
                  if (!fieldConfig) return null
                  
                  return renderField(fieldName, fieldConfig)
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Form Actions */}
        {mode !== 'view' && (
          <div className="flex gap-2 mt-6 pt-6 border-t">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Helper component for multi-select fields
 */
interface MultiSelectFieldProps {
  value: string[]
  onChange: (value: string[]) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
}

function MultiSelectField({ value, onChange, options, placeholder, disabled }: MultiSelectFieldProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(value || [])
  
  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option]
    
    setSelectedValues(newValues)
    onChange(newValues)
  }
  
  return (
    <div className="space-y-2">
      <div className="border rounded-md p-2 min-h-[40px] flex flex-wrap gap-1">
        {selectedValues.length === 0 ? (
          <span className="text-gray-500 text-sm">{placeholder}</span>
        ) : (
          selectedValues.map(value => (
            <Badge key={value} variant="secondary" className="text-xs">
              {value}
              {!disabled && (
                <button
                  onClick={() => toggleOption(value)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              )}
            </Badge>
          ))
        )}
      </div>
      
      {!disabled && (
        <Select onValueChange={toggleOption}>
          <SelectTrigger>
            <SelectValue placeholder="Add option..." />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter(option => !selectedValues.includes(option))
              .map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      )}
    </div>
  )
}