'use client'

/**
 * Universal Transaction Header Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.TRANSACTION_HEADER.v1
 * 
 * Dynamically renders transaction header fields based on configuration
 * Provides consistent styling, validation, and auto-save functionality
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { FieldConfig, TransactionTypeConfig } from '@/lib/config/transaction-types'

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface UniversalTransactionHeaderProps {
  config: TransactionTypeConfig
  data: Record<string, any>
  onChange: (field: string, value: any) => void
  onValidation?: (errors: ValidationError[]) => void
  autoSave?: boolean
  autoSaveInterval?: number
  readonly?: boolean
  className?: string
}

export function UniversalTransactionHeader({
  config,
  data,
  onChange,
  onValidation,
  autoSave = true,
  autoSaveInterval = 30000,
  readonly = false,
  className = ''
}: UniversalTransactionHeaderProps) {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isDirty, setIsDirty] = useState(false)

  // Field validation
  const validateField = useCallback((field: FieldConfig, value: any): ValidationError | null => {
    // Required field validation
    if (field.required && (!value || value === '')) {
      return {
        field: field.name,
        message: `${field.label} is required`,
        severity: 'error'
      }
    }

    // Type-specific validation
    if (field.validation && value) {
      const { min, max, pattern, custom } = field.validation

      // Numeric validation
      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          return {
            field: field.name,
            message: `${field.label} must be at least ${min}`,
            severity: 'error'
          }
        }
        if (max !== undefined && value > max) {
          return {
            field: field.name,
            message: `${field.label} must not exceed ${max}`,
            severity: 'error'
          }
        }
      }

      // Pattern validation
      if (pattern && typeof value === 'string') {
        const regex = new RegExp(pattern)
        if (!regex.test(value)) {
          return {
            field: field.name,
            message: `${field.label} format is invalid`,
            severity: 'error'
          }
        }
      }

      // Custom validation
      if (custom) {
        const customError = custom(value)
        if (customError) {
          return {
            field: field.name,
            message: customError,
            severity: 'error'
          }
        }
      }
    }

    return null
  }, [])

  // Validate all fields
  const validateAllFields = useCallback(() => {
    const errors: ValidationError[] = []

    config.header_fields.forEach(field => {
      const value = data[field.name]
      const error = validateField(field, value)
      if (error) {
        errors.push(error)
      }
    })

    setValidationErrors(errors)
    if (onValidation) {
      onValidation(errors)
    }

    return errors
  }, [config.header_fields, data, validateField, onValidation])

  // Handle field changes
  const handleFieldChange = useCallback((field: FieldConfig, value: any) => {
    setTouchedFields(prev => new Set(prev).add(field.name))
    setIsDirty(true)
    onChange(field.name, value)

    // Validate the changed field
    setTimeout(() => {
      const error = validateField(field, value)
      setValidationErrors(prev => {
        const filtered = prev.filter(err => err.field !== field.name)
        return error ? [...filtered, error] : filtered
      })
    }, 100)
  }, [onChange, validateField])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return

    const interval = setInterval(() => {
      // Trigger auto-save logic here
      setIsDirty(false)
      console.log('Auto-saving transaction header...', data)
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [autoSave, isDirty, autoSaveInterval, data])

  // Initial validation on mount
  useEffect(() => {
    validateAllFields()
  }, [validateAllFields])

  // Render field based on type
  const renderField = (field: FieldConfig) => {
    const value = data[field.name] || field.defaultValue || ''
    const hasError = validationErrors.some(err => err.field === field.name)
    const fieldError = validationErrors.find(err => err.field === field.name)
    const isReadonly = readonly || field.readonly

    // Check conditional rendering
    if (field.conditional) {
      const conditionValue = data[field.conditional.field]
      const operator = field.conditional.operator || 'equals'
      
      let shouldShow = false
      switch (operator) {
        case 'equals':
          shouldShow = conditionValue === field.conditional.value
          break
        case 'not_equals':
          shouldShow = conditionValue !== field.conditional.value
          break
        case 'contains':
          shouldShow = String(conditionValue).includes(String(field.conditional.value))
          break
      }
      
      if (!shouldShow) return null
    }

    const baseInputClasses = `
      w-full px-4 py-3 bg-white border-2 rounded-xl outline-none transition-all
      ${hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
        : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
      }
      ${isReadonly ? 'bg-slate-50 cursor-not-allowed' : ''}
    `

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={field.placeholder}
              className={baseInputClasses}
              disabled={isReadonly}
            />
            {fieldError && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                fieldError.severity === 'error' ? 'text-red-600' : 
                fieldError.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {fieldError.severity === 'error' && <AlertTriangle size={12} />}
                {fieldError.severity === 'warning' && <AlertTriangle size={12} />}
                {fieldError.severity === 'info' && <Info size={12} />}
                {fieldError.message}
              </p>
            )}
          </div>
        )

      case 'number':
      case 'currency':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              className={baseInputClasses}
              disabled={isReadonly}
              min={field.validation?.min}
              max={field.validation?.max}
              step={field.type === 'currency' ? '0.01' : '1'}
            />
            {fieldError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {fieldError.message}
              </p>
            )}
          </div>
        )

      case 'date':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={field.name}
                type="date"
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className={baseInputClasses}
                disabled={isReadonly}
              />
              <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {fieldError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {fieldError.message}
              </p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <select
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={baseInputClasses}
              disabled={isReadonly}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value
                const optionLabel = typeof option === 'string' ? option : option.label
                return (
                  <option key={index} value={optionValue}>
                    {optionLabel}
                  </option>
                )
              })}
            </select>
            {fieldError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {fieldError.message}
              </p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={field.placeholder}
              className={`${baseInputClasses} resize-none h-20`}
              disabled={isReadonly}
            />
            {fieldError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {fieldError.message}
              </p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={field.name}
              checked={value || false}
              onChange={(e) => handleFieldChange(field, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isReadonly}
            />
            <Label htmlFor={field.name} className="text-sm font-medium text-slate-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  // Group fields into columns for responsive layout
  const leftColumnFields = config.header_fields.slice(0, Math.ceil(config.header_fields.length / 2))
  const rightColumnFields = config.header_fields.slice(Math.ceil(config.header_fields.length / 2))

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            {config.name} Information
            {/* Smart code indicator */}
            <Badge variant="outline" className="ml-auto text-xs">
              <Sparkles size={12} className="mr-1" />
              {config.smart_code}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Validation summary */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-red-600" size={16} />
                <span className="text-sm font-medium text-red-800">
                  {validationErrors.filter(e => e.severity === 'error').length} error(s) found
                </span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.filter(e => e.severity === 'error').map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Fields in responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              {leftColumnFields.map(renderField)}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {rightColumnFields.map(renderField)}
            </div>
          </div>

          {/* Full-width fields */}
          <div className="mt-6 space-y-4">
            {config.header_fields
              .filter(field => field.type === 'textarea' && !leftColumnFields.includes(field) && !rightColumnFields.includes(field))
              .map(renderField)
            }
          </div>
        </CardContent>
      </Card>

      {/* Auto-save indicator */}
      {autoSave && isDirty && (
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Auto-saving changes...
          </div>
        </div>
      )}
    </div>
  )
}

// Export validation utilities
export function validateTransactionHeader(
  config: TransactionTypeConfig, 
  data: Record<string, any>
): ValidationError[] {
  const errors: ValidationError[] = []

  config.header_fields.forEach(field => {
    const value = data[field.name]

    // Required field validation
    if (field.required && (!value || value === '')) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`,
        severity: 'error'
      })
    }

    // Type-specific validation
    if (field.validation && value) {
      const { min, max, pattern, custom } = field.validation

      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          errors.push({
            field: field.name,
            message: `${field.label} must be at least ${min}`,
            severity: 'error'
          })
        }
        if (max !== undefined && value > max) {
          errors.push({
            field: field.name,
            message: `${field.label} must not exceed ${max}`,
            severity: 'error'
          })
        }
      }

      if (pattern && typeof value === 'string') {
        const regex = new RegExp(pattern)
        if (!regex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.label} format is invalid`,
            severity: 'error'
          })
        }
      }

      if (custom) {
        const customError = custom(value)
        if (customError) {
          errors.push({
            field: field.name,
            message: customError,
            severity: 'error'
          })
        }
      }
    }
  })

  return errors
}