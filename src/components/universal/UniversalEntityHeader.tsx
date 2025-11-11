'use client'

/**
 * Universal Entity Header - Dynamic form generation for entities
 * Smart Code: HERA.UNIVERSAL.ENTITY.HEADER.v1
 * 
 * Dynamically generates entity forms based on configuration with enhanced
 * field types, validation, and conditional logic for master data management
 */

import React, { useState, useCallback, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Calendar,
  Upload,
  Link as LinkIcon,
  Hash,
  Type,
  Mail,
  Phone,
  Globe,
  DollarSign
} from 'lucide-react'
import { 
  EntityTypeConfig, 
  EntityField, 
  EntitySection,
  getSectionFields,
  shouldShowField,
  validateEntityData
} from '@/lib/config/entity-types'

interface UniversalEntityHeaderProps {
  config: EntityTypeConfig
  data: Record<string, any>
  onChange: (field: string, value: any) => void
  onValidationChange?: (errors: Record<string, string>) => void
  readonly?: boolean
  showValidation?: boolean
  compactMode?: boolean
  className?: string
}

interface FieldComponentProps {
  field: EntityField
  value: any
  onChange: (value: any) => void
  error?: string
  readonly?: boolean
}

// Field icons mapping
const FIELD_ICONS = {
  text: Type,
  email: Mail,
  phone: Phone,
  url: Globe,
  number: Hash,
  date: Calendar,
  datetime: Calendar,
  file: Upload,
  entity_ref: LinkIcon,
  relationship: LinkIcon
}

// Format field value for display
const formatFieldValue = (value: any, field: EntityField): string => {
  if (!value) return ''
  
  switch (field.format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'AED' 
      }).format(value)
    case 'percentage':
      return `${value}%`
    case 'phone':
      return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
    case 'email':
      return value.toLowerCase()
    default:
      return String(value)
  }
}

// Generate field component based on type
function FieldComponent({ field, value, onChange, error, readonly }: FieldComponentProps) {
  const [showPassword, setShowPassword] = useState(false)
  const FieldIcon = FIELD_ICONS[field.type] || Type
  
  const hasError = !!error
  const baseInputClass = `w-full px-4 py-3 border rounded-lg transition-colors ${
    hasError 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  } ${readonly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file.name) // In a real implementation, you'd upload the file
    }
  }

  switch (field.type) {
    case 'select':
      return (
        <div className="relative">
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readonly}
            className={`${baseInputClass} pr-10 appearance-none`}
          >
            <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.description && ` - ${option.description}`}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      )

    case 'multiselect':
      return (
        <div className="space-y-2">
          {field.options?.map(option => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(option.value)}
                onChange={(e) => {
                  const currentArray = Array.isArray(value) ? value : []
                  if (e.target.checked) {
                    onChange([...currentArray, option.value])
                  } else {
                    onChange(currentArray.filter(v => v !== option.value))
                  }
                }}
                disabled={readonly}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )

    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={field.placeholder}
          readOnly={readonly}
          className={baseInputClass}
        />
      )

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readonly}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{field.description || field.label}</span>
        </div>
      )

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readonly}
          className={baseInputClass}
        />
      )

    case 'datetime':
      return (
        <input
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readonly}
          className={baseInputClass}
        />
      )

    case 'file':
      return (
        <div className="space-y-2">
          <input
            type="file"
            onChange={handleFileChange}
            disabled={readonly}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {value && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Upload size={14} />
              {value}
            </div>
          )}
        </div>
      )

    case 'entity_ref':
      return (
        <div className="relative">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || `Select ${field.entity_type}`}
            readOnly={readonly}
            className={`${baseInputClass} pr-10`}
          />
          <LinkIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>
      )

    default:
      return (
        <div className="relative">
          <input
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            readOnly={readonly}
            min={field.validation?.min}
            max={field.validation?.max}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            className={`${baseInputClass} ${field.icon ? 'pl-10' : ''}`}
          />
          {field.icon && (
            <FieldIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          )}
        </div>
      )
  }
}

export function UniversalEntityHeader({
  config,
  data,
  onChange,
  onValidationChange,
  readonly = false,
  showValidation = true,
  compactMode = false,
  className = ''
}: UniversalEntityHeaderProps) {
  const [activeSection, setActiveSection] = useState(config.sections[0]?.id || '')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(config.sections.filter(s => s.required).map(s => s.id))
  )

  // Auto-generate entity code from name
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    onChange(fieldName, value)
    
    // Auto-generate code from name fields
    if (fieldName.includes('name') && value && !readonly) {
      const codeFieldName = fieldName.replace('name', 'code')
      const codeField = config.fields.find(f => f.name === codeFieldName)
      
      if (codeField && !data[codeFieldName]) {
        const code = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)
        onChange(codeFieldName, code)
      }
    }
  }, [onChange, config.fields, data, readonly])

  // Validate data and notify parent
  const validation = useMemo(() => {
    return validateEntityData(config, data)
  }, [config, data])

  // Notify parent of validation changes
  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation.errors)
    }
  }, [validation.errors, onValidationChange])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Get visible fields for a section
  const getVisibleSectionFields = useCallback((section: EntitySection) => {
    const sectionFields = getSectionFields(config, section.id)
    return sectionFields.filter(field => shouldShowField(field, data))
  }, [config, data])

  if (compactMode) {
    // Render all fields in a simple grid layout
    const allVisibleFields = config.fields.filter(field => shouldShowField(field, data))
    
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allVisibleFields.map(field => (
            <div key={field.name} className={field.width === 'full' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              <FieldComponent
                field={field}
                value={data[field.name]}
                onChange={(value) => handleFieldChange(field.name, value)}
                error={validation.errors[field.name]}
                readonly={readonly || field.readonly}
              />
              
              {validation.errors[field.name] && showValidation && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validation.errors[field.name]}
                </p>
              )}
              
              {field.description && (
                <p className="text-gray-500 text-sm mt-1">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {config.sections.map(section => {
        const visibleFields = getVisibleSectionFields(section)
        const isExpanded = expandedSections.has(section.id)
        const sectionErrors = visibleFields.filter(field => validation.errors[field.name]).length
        const SectionIcon = section.icon
        
        if (visibleFields.length === 0) return null

        return (
          <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    sectionErrors > 0 
                      ? 'bg-red-100 text-red-600' 
                      : section.required 
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {sectionErrors > 0 ? (
                      <AlertCircle size={16} />
                    ) : (
                      <SectionIcon size={16} />
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {section.label}
                      {section.required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{section.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {sectionErrors > 0 && showValidation && (
                    <span className="text-red-500 text-sm bg-red-100 px-2 py-1 rounded">
                      {sectionErrors} error{sectionErrors !== 1 ? 's' : ''}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="text-gray-400" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={20} />
                  )}
                </div>
              </div>
            </button>

            {/* Section content */}
            {isExpanded && (
              <div className="p-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleFields.map(field => (
                    <div 
                      key={field.name} 
                      className={
                        field.width === 'full' ? 'md:col-span-2 lg:col-span-3' :
                        field.width === 'half' ? 'md:col-span-1' :
                        field.width === 'third' ? 'lg:col-span-1' : 'md:col-span-1'
                      }
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {field.readonly && (
                          <span className="text-gray-400 text-xs ml-2">(read-only)</span>
                        )}
                      </label>
                      
                      <FieldComponent
                        field={field}
                        value={data[field.name]}
                        onChange={(value) => handleFieldChange(field.name, value)}
                        error={validation.errors[field.name]}
                        readonly={readonly || field.readonly}
                      />
                      
                      {validation.errors[field.name] && showValidation && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {validation.errors[field.name]}
                        </p>
                      )}
                      
                      {field.description && !validation.errors[field.name] && (
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                          <Info size={14} />
                          {field.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Validation Summary */}
      {showValidation && Object.keys(validation.errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5" size={16} />
            <div>
              <h4 className="text-sm font-medium text-red-900">
                Please fix the following errors:
              </h4>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {Object.entries(validation.errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UniversalEntityHeader