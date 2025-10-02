'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { EntityPreset, Role } from '@/hooks/entityPresets'

export interface EntityFormProps {
  preset: EntityPreset & {
    labels: {
      singular: string
      plural: string
    }
    permissions?: {
      create?: (role: Role) => boolean
      edit?: (role: Role) => boolean
      delete?: (role: Role) => boolean
      view?: (role: Role) => boolean
    }
  }
  mode: 'create' | 'update'
  entityId?: string
  allowedRoles: Role[]
  onSuccess: (data: any) => void
  onCancel: () => void
}

export function EntityForm({
  preset,
  mode,
  entityId,
  allowedRoles,
  onSuccess,
  onCancel
}: EntityFormProps) {
  const [formData, setFormData] = useState({
    entity_name: '',
    dynamic_fields: {} as Record<string, any>,
    relationships: {} as Record<string, any>
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle form field changes
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dynamic_fields: {
        ...prev.dynamic_fields,
        [fieldName]: value
      }
    }))

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  // Handle entity name change
  const handleEntityNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, entity_name: value }))
    if (errors.entity_name) {
      setErrors(prev => ({ ...prev, entity_name: '' }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate entity name
    if (!formData.entity_name.trim()) {
      newErrors.entity_name = `${preset.labels.singular} name is required`
    }

    // Validate required dynamic fields
    for (const field of preset.dynamicFields || []) {
      if (field.required && !formData.dynamic_fields[field.name]) {
        newErrors[field.name] = `${field.ui?.label || field.name} is required`
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

    setIsSubmitting(true)

    try {
      const payload = {
        entity_id: entityId,
        entity_name: formData.entity_name,
        dynamic_fields: formData.dynamic_fields,
        relationships: formData.relationships
      }

      await onSuccess(payload)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render field based on type
  const renderField = (field: any) => {
    const value = formData.dynamic_fields[field.name] || field.defaultValue || ''
    const error = errors[field.name]
    const label = field.ui?.label || field.name
    const placeholder = field.ui?.placeholder || ''
    const helpText = field.ui?.helpText

    switch (field.type) {
      case 'boolean':
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={Boolean(value)}
                onCheckedChange={checked => handleFieldChange(field.name, checked)}
              />
              <Label htmlFor={field.name} className="text-sm font-medium">
                {label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value ? new Date(value).toISOString().split('T')[0] : ''}
              onChange={e =>
                handleFieldChange(field.name, e.target.value ? new Date(e.target.value) : '')
              }
              className={error ? 'border-red-500' : ''}
            />
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              placeholder={placeholder}
              step={field.ui?.decimals ? Math.pow(10, -field.ui.decimals) : undefined}
              min={field.ui?.min}
              max={field.ui?.max}
              onChange={e =>
                handleFieldChange(field.name, e.target.value ? Number(e.target.value) : '')
              }
              className={error ? 'border-red-500' : ''}
            />
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        )

      case 'text':
      default:
        // Use textarea for description fields
        if (
          field.ui?.widget === 'textarea' ||
          field.name === 'description' ||
          field.name === 'notes'
        ) {
          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Textarea
                id={field.name}
                value={value}
                placeholder={placeholder}
                rows={3}
                onChange={e => handleFieldChange(field.name, e.target.value)}
                className={error ? 'border-red-500' : ''}
              />
              {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
          )
        }

        // Use select for status fields
        if (field.ui?.widget === 'select' || field.name === 'status') {
          const options =
            field.name === 'status' ? ['in_stock', 'low_stock', 'out_of_stock', 'reserved'] : []

          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Select value={value} onValueChange={val => handleFieldChange(field.name, val)}>
                <SelectTrigger className={error ? 'border-red-500' : ''}>
                  <SelectValue placeholder={placeholder || `Select ${label}`} />
                </SelectTrigger>
                <SelectContent className="jewelry-glass-panel">
                  {options.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
          )
        }

        // Default text input
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.name === 'email' ? 'email' : field.name === 'phone' ? 'tel' : 'text'}
              value={value}
              placeholder={placeholder}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Entity Name */}
      <div className="space-y-2">
        <Label htmlFor="entity_name" className="text-sm font-medium">
          {preset.labels.singular} Name
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="entity_name"
          value={formData.entity_name}
          placeholder={`Enter ${preset.labels.singular.toLowerCase()} name`}
          onChange={e => handleEntityNameChange(e.target.value)}
          className={errors.entity_name ? 'border-red-500' : ''}
        />
        {errors.entity_name && <p className="text-red-600 text-sm">{errors.entity_name}</p>}
      </div>

      {/* Dynamic Fields */}
      {preset.dynamicFields?.map(renderField)}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="jewelry-btn-primary">
          {isSubmitting
            ? 'Saving...'
            : mode === 'create'
              ? `Create ${preset.labels.singular}`
              : `Update ${preset.labels.singular}`}
        </Button>
      </div>
    </form>
  )
}
