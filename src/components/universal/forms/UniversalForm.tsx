'use client'

import React, { ReactNode, FormEvent } from 'react'

/**
 * Universal Form Components
 *
 * Based on lessons learned from EditMenuItemForm issues:
 * - Always use native HTML elements with explicit styling
 * - Avoid shadcn/ui components in modals for better visibility
 * - Consistent styling patterns across all forms
 * - Proper accessibility and form validation
 */

// Base styling constants
const FORM_STYLES = {
  input:
    'w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100 placeholder:text-muted-foreground',
  textarea:
    'w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100 placeholder:text-muted-foreground resize-none',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  select:
    'w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100',
  button: {
    primary:
      'px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    secondary:
      'px-4 py-2 border border-border text-gray-700 bg-background rounded-lg hover:bg-muted focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'px-4 py-2 bg-red-600 text-foreground rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  },
  fieldGroup: 'space-y-4 bg-muted p-4 rounded-lg',
  error: 'text-red-600 text-sm mt-1',
  required: 'text-red-500'
}

// Form field props
interface BaseFieldProps {
  id?: string
  name?: string
  label?: string
  required?: boolean
  error?: string
  disabled?: boolean
  className?: string
}

interface InputProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  value?: string | number
  placeholder?: string
  step?: string
  min?: string | number
  max?: string | number
  onChange?: (value: string) => void
  onBlur?: () => void
}

interface TextareaProps extends BaseFieldProps {
  value?: string
  placeholder?: string
  rows?: number
  onChange?: (value: string) => void
  onBlur?: () => void
}

interface SelectProps extends BaseFieldProps {
  value?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
  onChange?: (value: string) => void
}

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: ReactNode
  onClick?: () => void
  className?: string
}

interface FormProps {
  onSubmit?: (e: FormEvent) => void
  className?: string
  children: ReactNode
}

interface FieldGroupProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

// Universal Input Component
export function UniversalInput({
  id,
  name,
  label,
  type = 'text',
  value,
  placeholder,
  required = false,
  error,
  disabled = false,
  step,
  min,
  max,
  className = '',
  onChange,
  onBlur
}: InputProps) {
  const fieldId = id || name || 'input'

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={fieldId} className={FORM_STYLES.label}>
          {label}
          {required && <span className={FORM_STYLES.required}> *</span>}
        </label>
      )}
      <input
        id={fieldId}
        name={name}
        type={type}
        value={value || ''}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        step={step}
        min={min}
        max={max}
        className={`${FORM_STYLES.input} ${error ?'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        onChange={e => onChange?.(e.target.value)}
        onBlur={onBlur}
      />
      {error && <p className={FORM_STYLES.error}>{error}</p>}
    </div>
  )
}

// Universal Textarea Component
export function UniversalTextarea({
  id,
  name,
  label,
  value,
  placeholder,
  rows = 3,
  required = false,
  error,
  disabled = false,
  className = '',
  onChange,
  onBlur
}: TextareaProps) {
  const fieldId = id || name || 'textarea'

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={fieldId} className={FORM_STYLES.label}>
          {label}
          {required && <span className={FORM_STYLES.required}> *</span>}
        </label>
      )}
      <textarea
        id={fieldId}
        name={name}
        value={value || ''}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`${FORM_STYLES.textarea} ${error ?'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        onChange={e => onChange?.(e.target.value)}
        onBlur={onBlur}
      />
      {error && <p className={FORM_STYLES.error}>{error}</p>}
    </div>
  )
}

// Universal Select Component
export function UniversalSelect({
  id,
  name,
  label,
  value,
  options,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  onChange
}: SelectProps) {
  const fieldId = id || name || 'select'

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={fieldId} className={FORM_STYLES.label}>
          {label}
          {required && <span className={FORM_STYLES.required}> *</span>}
        </label>
      )}
      <select
        id={fieldId}
        name={name}
        value={value || ''}
        required={required}
        disabled={disabled}
        className={`${FORM_STYLES.select} ${error ?'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        onChange={e => onChange?.(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className={FORM_STYLES.error}>{error}</p>}
    </div>
  )
}

// Universal Button Component
export function UniversalButton({
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = ''
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const baseClasses = FORM_STYLES.button[variant]
  const sizeClass = sizeClasses[size]

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClass} ${className} flex items-center justify-center font-medium`}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      )}
      {children}
    </button>
  )
}

// Universal Form Container
export function UniversalForm({ onSubmit, className = '', children }: FormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`} noValidate>
      {children}
    </form>
  )
}

// Universal Field Group
export function UniversalFieldGroup({
  title,
  description,
  children,
  className = ''
}: FieldGroupProps) {
  return (
    <div className={`${FORM_STYLES.fieldGroup} ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// Universal Modal (with proper visibility)
export function UniversalModal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  }

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-background rounded-lg shadow-xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-hidden`}
      >
        {/* Header */}
        <div className="bg-background p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-100">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-muted-foreground bg-background p-1 rounded transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-background p-6 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>
  )
}

// Utility: Form validation helpers
export const FormValidation = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required'
    }
    return null
  },

  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },

  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters long`
    }
    return null
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters long`
    }
    return null
  },

  number: (value: string) => {
    if (value && isNaN(Number(value))) {
      return 'Must be a valid number'
    }
    return null
  },

  positive: (value: string) => {
    if (value && Number(value) <= 0) {
      return 'Must be a positive number'
    }
    return null
  }
}

// Utility: Form state management hook
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [values, setValues] = React.useState<T>(initialState)
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({})

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const setError = (name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const setFieldTouched = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const validate = (
    validationRules: Partial<Record<keyof T, ((value: any) => string | null)[]>>
  ) => {
    const newErrors: Partial<Record<keyof T, string>> = {}

    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = values[field as keyof T]
      for (const rule of rules as ((value: any) => string | null)[]) {
        const error = rule(value)
        if (error) {
          newErrors[field as keyof T] = error
          break
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const reset = () => {
    setValues(initialState)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setTouched: setFieldTouched,
    validate,
    reset,
    hasErrors: Object.keys(errors).length > 0
  }
}
