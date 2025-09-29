'use client'

import { useState } from 'react'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

interface JsonSchemaFormProps {
  schema: Record<string, unknown>
  initial?: any
  onSubmit: (value: any) => void
  submitLabel?: string
}

export function JsonSchemaForm({
  schema,
  initial = {},
  onSubmit,
  submitLabel = 'Submit'
}: JsonSchemaFormProps) {
  const [formData, setFormData] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = ajv.compile(schema)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const valid = validate(formData)

    if (!valid && validate.errors) {
      const fieldErrors: Record<string, string> = {}
      validate.errors.forEach(error => {
        const path = error.instancePath || error.dataPath || 'root'
        const field = path.replace(/^\//, '') || 'root'
        fieldErrors[field] = error.message || 'Invalid value'
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    setErrors({})
    onSubmit(formData)
    setIsSubmitting(false)
  }

  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current = newData

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newData
    })

    // Clear error for this field
    if (errors[path]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[path]
        return newErrors
      })
    }
  }

  const renderField = (
    fieldName: string,
    fieldSchema: any,
    value: any,
    path: string = fieldName
  ) => {
    const fieldType = fieldSchema.type
    const fieldError = errors[path]

    switch (fieldType) {
      case 'string':
        if (
          fieldSchema.format === 'textarea' ||
          (fieldSchema.maxLength && fieldSchema.maxLength > 100)
        ) {
          return (
            <div key={path} className="space-y-2">
              <Label htmlFor={path}>{fieldSchema.title || fieldName}</Label>
              <Textarea
                id={path}
                value={value || ''}
                onChange={e => updateField(path, e.target.value)}
                placeholder={fieldSchema.description}
                className={fieldError ? 'border-red-500' : ''}
              />
              {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
            </div>
          )
        }
        return (
          <div key={path} className="space-y-2">
            <Label htmlFor={path}>{fieldSchema.title || fieldName}</Label>
            <Input
              id={path}
              type="text"
              value={value || ''}
              onChange={e => updateField(path, e.target.value)}
              placeholder={fieldSchema.description}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'number':
      case 'integer':
        return (
          <div key={path} className="space-y-2">
            <Label htmlFor={path}>{fieldSchema.title || fieldName}</Label>
            <Input
              id={path}
              type="number"
              value={value || ''}
              onChange={e => updateField(path, Number(e.target.value))}
              placeholder={fieldSchema.description}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div key={path} className="flex items-center space-x-2">
            <Checkbox
              id={path}
              checked={Boolean(value)}
              onCheckedChange={checked => updateField(path, checked)}
            />
            <Label htmlFor={path}>{fieldSchema.title || fieldName}</Label>
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'object':
        if (!fieldSchema.properties) return null
        return (
          <div key={path} className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium">{fieldSchema.title || fieldName}</h4>
            {Object.entries(fieldSchema.properties).map(([propName, propSchema]) =>
              renderField(propName, propSchema, value?.[propName], `${path}.${propName}`)
            )}
          </div>
        )

      default:
        return (
          <div key={path} className="space-y-2">
            <Label htmlFor={path}>{fieldSchema.title || fieldName}</Label>
            <Input
              id={path}
              type="text"
              value={typeof value === 'string' ? value : JSON.stringify(value || '')}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  updateField(path, parsed)
                } catch {
                  updateField(path, e.target.value)
                }
              }}
              placeholder={fieldSchema.description || 'Enter value'}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )
    }
  }

  if (!schema.properties) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="ink-muted">No form schema available</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Object.entries(schema.properties).map(([fieldName, fieldSchema]) =>
        renderField(fieldName, fieldSchema, formData[fieldName])
      )}

      {errors.root && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.root}</p>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : submitLabel}
      </Button>
    </form>
  )
}
