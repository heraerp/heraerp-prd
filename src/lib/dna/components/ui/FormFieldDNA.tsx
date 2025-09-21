// ================================================================================
// HERA DNA UI - FORM FIELD COMPONENT
// Smart Code: HERA.DNA.UI.FORM.FIELD.V1
// Complete form field with proper dark mode support from the start
// ================================================================================

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BaseFieldProps {
  label: string
  id?: string
  className?: string
  icon?: LucideIcon
  helper?: string
  error?: string
}

interface InputFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time' | 'datetime-local'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  readOnly?: boolean
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  options: Array<{
    value: string
    label: string
  }>
  disabled?: boolean
}

type FormFieldDNAProps = InputFieldProps | TextareaFieldProps | SelectFieldProps

export function FormFieldDNA(props: FormFieldDNAProps) {
  const { label, id, className, icon: Icon, helper, error } = props
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Label>

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}

        {props.type === 'textarea' ? (
          <Textarea
            id={fieldId}
            value={props.value}
            onChange={e => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            rows={props.rows || 3}
            disabled={props.disabled}
            readOnly={props.readOnly}
            className={cn(
              'w-full',
              'dark:bg-gray-800 dark:border-gray-700',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-500 dark:placeholder:text-gray-400',
              'disabled:bg-gray-50 dark:disabled:bg-gray-900',
              'disabled:text-gray-600 dark:disabled:text-gray-300',
              'focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400',
              Icon && 'pl-10',
              error && 'border-red-500 dark:border-red-400'
            )}
          />
        ) : props.type === 'select' ? (
          <Select value={props.value} onValueChange={props.onChange} disabled={props.disabled}>
            <SelectTrigger
              className={cn(
                'w-full',
                'dark:bg-gray-800 dark:border-gray-700',
                'text-gray-900 dark:text-gray-100',
                'disabled:bg-gray-50 dark:disabled:bg-gray-900',
                'disabled:text-gray-600 dark:disabled:text-gray-300',
                'focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400',
                Icon && 'pl-10',
                error && 'border-red-500 dark:border-red-400'
              )}
            >
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              {props.options.map(option => (
                <SelectItem key={option.value} value={option.value} className="hera-select-item">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={fieldId}
            type={props.type}
            value={props.value}
            onChange={e => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            className={cn(
              'w-full',
              'dark:bg-gray-800 dark:border-gray-700',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-500 dark:placeholder:text-gray-400',
              'disabled:bg-gray-50 dark:disabled:bg-gray-900',
              'disabled:text-gray-600 dark:disabled:text-gray-300',
              'focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400',
              Icon && 'pl-10',
              error && 'border-red-500 dark:border-red-400'
            )}
          />
        )}
      </div>

      {helper && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

// Export presets for common field types
export const EmailFieldDNA = (props: Omit<InputFieldProps, 'type'>) => (
  <FormFieldDNA {...props} type="email" />
)

export const PasswordFieldDNA = (props: Omit<InputFieldProps, 'type'>) => (
  <FormFieldDNA {...props} type="password" />
)

export const DateFieldDNA = (props: Omit<InputFieldProps, 'type'>) => (
  <FormFieldDNA {...props} type="date" />
)

export const TimeFieldDNA = (props: Omit<InputFieldProps, 'type'>) => (
  <FormFieldDNA {...props} type="time" />
)

export const TextareaFieldDNA = (props: Omit<TextareaFieldProps, 'type'>) => (
  <FormFieldDNA {...props} type="textarea" />
)

export const SelectFieldDNA = (props: Omit<SelectFieldProps, 'type'>) => (
  <FormFieldDNA {...props} type="select" />
)
