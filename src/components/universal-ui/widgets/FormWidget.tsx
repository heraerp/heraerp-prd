'use client'

import React, { useEffect, useState } from 'react'
import { Widget } from '@/src/lib/universal-ui/view-meta-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Switch } from '@/src/components/ui/switch'
import { Button } from '@/src/components/ui/button'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { cn } from '@/src/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { universalApi } from '@/src/lib/universal-api'

interface FormWidgetProps {
  widget: Widget
  entityId?: string
  organizationId: string
  onAction?: (action: any) => void
}

export function FormWidget({ widget, entityId, organizationId, onAction }: FormWidgetProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [entityOptions, setEntityOptions] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (entityId) {
      loadEntityData()
    }
  }, [entityId])

  const loadEntityData = async () => {
    try {
      const result = await universalApi.query('core_entities', { id: entityId })
      if (result.data && result.data.length > 0) {
        setFormData(result.data[0])
      }
    } catch (error) {
      console.error('Failed to load entity data:', error)
    }
  }

  const loadEntityOptions = async (fieldName: string, entityType: string) => {
    try {
      const result = await universalApi.query('core_entities', { entity_type: entityType })
      if (result.data) {
        setEntityOptions(prev => ({
          ...prev,
          [fieldName]: result.data
        }))
      }
    } catch (error) {
      console.error('Failed to load entity options:', error)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const renderField = (field: any) => {
    const value = formData[field.name] || field.default_value || ''

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.valueAsNumber)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'money':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={e => handleFieldChange(field.name, e.target.valueAsNumber)}
              className="pl-8"
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        )

      case 'percentage':
        return (
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              max="100"
              value={value}
              onChange={e => handleFieldChange(field.name, e.target.valueAsNumber)}
              className="pr-8"
              placeholder={field.placeholder}
              required={field.required}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              %
            </span>
          </div>
        )

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        )

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), 'PPP') : field.placeholder || 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={date => handleFieldChange(field.name, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )

      case 'select':
        return (
          <Select value={value} onValueChange={v => handleFieldChange(field.name, v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'entity_selector':
        if (!entityOptions[field.name] && field.entity_type) {
          loadEntityOptions(field.name, field.entity_type)
        }
        return (
          <Select value={value} onValueChange={v => handleFieldChange(field.name, v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.entity_type}...`} />
            </SelectTrigger>
            <SelectContent>
              {entityOptions[field.name]?.map((entity: any) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.entity_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'boolean':
        return (
          <Switch
            checked={value === true}
            onCheckedChange={checked => handleFieldChange(field.name, checked)}
          />
        )

      default:
        return (
          <Input
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        )
    }
  }

  const renderFormFields = () => {
    const fields = widget.config.fields || []
    const sections: Record<string, any[]> = {}

    // Group fields by section
    fields.forEach((field: any) => {
      const section = field.layout?.section || 'default'
      if (!sections[section]) {
        sections[section] = []
      }
      sections[section].push(field)
    })

    return Object.entries(sections).map(([section, sectionFields]) => (
      <div key={section} className="space-y-4">
        {section !== 'default' && (
          <h3 className="text-sm font-medium text-muted-foreground">{section}</h3>
        )}
        <div className="grid grid-cols-12 gap-4">
          {sectionFields.map((field: any) => {
            const colSpan = field.layout?.col_span || 12

            // Check conditional display
            if (
              field.conditional_display &&
              !evaluateCondition(field.conditional_display, formData)
            ) {
              return null
            }

            return (
              <div key={field.name} className={`col-span-${colSpan}`}>
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                  {field.help_text && (
                    <p className="text-sm text-muted-foreground">{field.help_text}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    ))
  }

  const evaluateCondition = (condition: any, data: any): boolean => {
    const fieldValue = data[condition.field]

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'contains':
        return String(fieldValue).includes(condition.value)
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      case 'in':
        return condition.value.includes(fieldValue)
      case 'not_in':
        return !condition.value.includes(fieldValue)
      default:
        return true
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (entityId) {
        // Update existing entity
        await universalApi.query('core_entities', {
          id: entityId,
          ...formData,
          organization_id: organizationId
        })
      } else {
        // Create new entity
        await universalApi.createEntity({
          ...formData,
          organization_id: organizationId,
          smart_code: widget.smart_code
        })
      }

      if (onAction) {
        onAction({ type: 'save', success: true })
      }
    } catch (error) {
      console.error('Failed to save form:', error)
      if (onAction) {
        onAction({ type: 'save', success: false, error })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {renderFormFields()}

          {widget.actions && widget.actions.length > 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              {widget.actions.map(action => (
                <Button
                  key={action.id}
                  variant={action.type === 'delete' ? 'destructive' : 'default'}
                  onClick={() =>
                    action.type === 'custom' && action.id === 'save'
                      ? handleSave()
                      : onAction?.(action)
                  }
                  disabled={loading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
