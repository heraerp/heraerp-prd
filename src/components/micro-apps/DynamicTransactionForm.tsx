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
  Plus,
  Minus,
  Calculator,
  Receipt,
  FileText,
  Hash,
  DollarSign,
  Calendar,
  User,
  Building,
  Package,
  ArrowUpDown,
  Trash2,
  Copy,
  Edit3
} from 'lucide-react'
import type { 
  DynamicTransactionBuildResponse, 
  DynamicFieldDefinition,
  EnhancedDynamicEntityBuilder
} from '@/lib/micro-apps/enhanced-dynamic-entity-builder'

/**
 * HERA Dynamic Transaction Form Component
 * Smart Code: HERA.PLATFORM.MICRO_APPS.COMPONENTS.TRANSACTION_FORM.v1
 * 
 * Enterprise-grade form component for dynamic transactions with:
 * ✅ SAP Fiori design standards with glassmorphism
 * ✅ Header/Line transaction structure
 * ✅ Automatic field rendering from transaction configuration
 * ✅ Real-time validation with visual feedback
 * ✅ Mobile-first responsive design with 44px touch targets
 * ✅ Smooth animations and micro-interactions
 * ✅ Finance integration with automatic GL posting
 * ✅ Multi-line management with dynamic totals
 * ✅ Approval workflow integration
 * ✅ Integration with Enhanced Dynamic Entity Builder
 */

export interface TransactionLineItem {
  id: string
  line_number: number
  line_type: string
  description?: string
  quantity?: number
  unit_amount?: number
  line_amount?: number
  entity_id?: string
  [key: string]: any // Dynamic line fields
}

export interface DynamicTransactionFormProps {
  /** Transaction configuration from Enhanced Dynamic Entity Builder */
  transactionConfig: DynamicTransactionBuildResponse
  /** Builder instance for execution */
  builder: EnhancedDynamicEntityBuilder
  /** Organization context */
  organizationId: string
  /** Initial data for editing */
  initialData?: Record<string, any>
  /** Initial line items */
  initialLines?: TransactionLineItem[]
  /** Form mode */
  mode: 'create' | 'edit' | 'view' | 'approve'
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
  /** Show approval actions */
  showApprovalActions?: boolean
  /** Enable finance integration */
  enableFinanceIntegration?: boolean
}

export interface FieldState {
  value: any
  error?: string
  touched: boolean
  visible: boolean
}

export interface LineValidationError {
  lineNumber: number
  field: string
  message: string
}

export function DynamicTransactionForm({
  transactionConfig,
  builder,
  organizationId,
  initialData = {},
  initialLines = [],
  mode = 'create',
  onSuccess,
  onError,
  onCancel,
  className,
  modalStyle = false,
  title,
  animated = true,
  showApprovalActions = false,
  enableFinanceIntegration = true
}: DynamicTransactionFormProps) {
  const [headerData, setHeaderData] = useState<Record<string, FieldState>>({})
  const [lineItems, setLineItems] = useState<TransactionLineItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'header' | 'lines' | 'totals'>('header')
  const [lineValidationErrors, setLineValidationErrors] = useState<LineValidationError[]>([])
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
    lineCount: 0
  })

  const isReadonly = mode === 'view'
  const isApproval = mode === 'approve'
  const formTitle = title || `${mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : mode === 'approve' ? 'Approve' : 'View'} ${transactionConfig.transaction_definition.display_name}`

  // Initialize form data
  useEffect(() => {
    if (!transactionConfig.success) return

    // Initialize header data
    const initialHeaderData: Record<string, FieldState> = {}
    
    // Add transaction number field
    initialHeaderData.transaction_number = {
      value: initialData.transaction_number || '',
      touched: false,
      visible: true
    }

    // Add header fields from config
    transactionConfig.header_field_mappings?.forEach(mapping => {
      const fieldValue = initialData[mapping.field_name] || getDefaultValue(mapping)
      initialHeaderData[mapping.field_name] = {
        value: fieldValue,
        touched: false,
        visible: evaluateFieldVisibility(mapping.field_name, initialHeaderData)
      }
    })

    setHeaderData(initialHeaderData)

    // Initialize line items
    if (initialLines.length > 0) {
      setLineItems(initialLines)
    } else {
      // Add one empty line if creating new transaction
      if (mode === 'create') {
        addNewLine()
      }
    }
  }, [transactionConfig, initialData, initialLines])

  // Calculate totals whenever line items change
  useEffect(() => {
    const subtotal = lineItems.reduce((sum, line) => sum + (line.line_amount || 0), 0)
    const taxRate = parseFloat(headerData.tax_rate?.value || '0') / 100
    const tax = subtotal * taxRate
    const total = subtotal + tax

    setTotals({
      subtotal,
      tax,
      total,
      lineCount: lineItems.length
    })
  }, [lineItems, headerData.tax_rate?.value])

  // Get default value for field
  const getDefaultValue = (mapping: any): any => {
    if (mapping.ui_config?.default_value !== undefined) {
      return mapping.ui_config.default_value
    }
    
    switch (mapping.field_type) {
      case 'boolean': return false
      case 'number': return 0
      case 'date': return new Date().toISOString().split('T')[0]
      case 'email': return ''
      case 'phone': return ''
      case 'select': return ''
      default: return ''
    }
  }

  // Evaluate field visibility
  const evaluateFieldVisibility = (fieldName: string, currentData: Record<string, FieldState>): boolean => {
    const mapping = transactionConfig.header_field_mappings?.find(m => m.field_name === fieldName)
    const conditionalRules = mapping?.ui_config?.conditional_display || []
    
    if (conditionalRules.length === 0) return true

    return conditionalRules.every((rule: any) => {
      const dependentValue = currentData[rule.field_name]?.value
      
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

  // Update header field value
  const updateHeaderField = (fieldName: string, value: any) => {
    setHeaderData(prev => {
      const updated = {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value,
          touched: true,
          error: validateHeaderField(fieldName, value, prev)
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

  // Validate header field
  const validateHeaderField = (fieldName: string, value: any, currentData: Record<string, FieldState>): string | undefined => {
    if (fieldName === 'transaction_number') {
      if (mode === 'create' && (!value || value.trim().length === 0)) {
        return 'Transaction number is required'
      }
      return undefined
    }

    const mapping = transactionConfig.header_field_mappings?.find(m => m.field_name === fieldName)
    if (!mapping) return undefined

    const validationRules = mapping.validation_rules || []

    for (const rule of validationRules) {
      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            return rule.message || `${fieldName} is required`
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
      }
    }

    return undefined
  }

  // Add new line item
  const addNewLine = () => {
    const newLineNumber = lineItems.length + 1
    const newLine: TransactionLineItem = {
      id: `line_${Date.now()}_${newLineNumber}`,
      line_number: newLineNumber,
      line_type: 'STANDARD',
      description: '',
      quantity: 1,
      unit_amount: 0,
      line_amount: 0
    }

    setLineItems(prev => [...prev, newLine])
  }

  // Remove line item
  const removeLine = (lineId: string) => {
    setLineItems(prev => {
      const filtered = prev.filter(line => line.id !== lineId)
      // Renumber lines
      return filtered.map((line, index) => ({
        ...line,
        line_number: index + 1
      }))
    })
  }

  // Update line item
  const updateLineItem = (lineId: string, field: string, value: any) => {
    setLineItems(prev => prev.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value }
        
        // Auto-calculate line amount for quantity/unit_amount changes
        if (field === 'quantity' || field === 'unit_amount') {
          updatedLine.line_amount = (updatedLine.quantity || 0) * (updatedLine.unit_amount || 0)
        }
        
        return updatedLine
      }
      return line
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true
    const updatedHeaderData = { ...headerData }
    const lineErrors: LineValidationError[] = []

    // Validate header fields
    Object.keys(headerData).forEach(fieldName => {
      const field = headerData[fieldName]
      if (field.visible) {
        const error = validateHeaderField(fieldName, field.value, headerData)
        updatedHeaderData[fieldName] = {
          ...field,
          error,
          touched: true
        }
        if (error) isValid = false
      }
    })

    // Validate line items
    lineItems.forEach(line => {
      if (!line.description || line.description.trim().length === 0) {
        lineErrors.push({
          lineNumber: line.line_number,
          field: 'description',
          message: 'Description is required'
        })
        isValid = false
      }
      if ((line.quantity || 0) <= 0) {
        lineErrors.push({
          lineNumber: line.line_number,
          field: 'quantity',
          message: 'Quantity must be greater than 0'
        })
        isValid = false
      }
      if ((line.unit_amount || 0) < 0) {
        lineErrors.push({
          lineNumber: line.line_number,
          field: 'unit_amount',
          message: 'Unit amount cannot be negative'
        })
        isValid = false
      }
    })

    // Check minimum lines
    if (lineItems.length === 0) {
      lineErrors.push({
        lineNumber: 0,
        field: 'general',
        message: 'At least one line item is required'
      })
      isValid = false
    }

    setHeaderData(updatedHeaderData)
    setLineValidationErrors(lineErrors)
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

      // Prepare header data for submission
      const submitHeaderData: Record<string, any> = {}
      Object.entries(headerData).forEach(([fieldName, field]) => {
        if (field.visible && field.value !== undefined && field.value !== '') {
          submitHeaderData[fieldName] = field.value
        }
      })

      // Prepare line data
      const submitLineData = lineItems.map(line => ({
        line_number: line.line_number,
        line_type: line.line_type,
        description: line.description,
        quantity: line.quantity || 1,
        unit_amount: line.unit_amount || 0,
        line_amount: line.line_amount || 0,
        entity_id: line.entity_id
      }))

      // Execute via Enhanced Dynamic Entity Builder
      const result = await builder.executeTransactionOperation(
        transactionConfig,
        mode === 'create' ? 'create' : mode === 'approve' ? 'approve' : 'update',
        submitHeaderData,
        submitLineData,
        organizationId,
        {
          validate_before_save: true,
          auto_generate_codes: true,
          trigger_workflows: true,
          enable_finance_integration: enableFinanceIntegration,
          calculate_totals: true
        }
      )

      if (result.success) {
        onSuccess?.(result)
      } else {
        throw new Error(result.error || 'Failed to save transaction')
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
    if (fieldName.includes('amount') || fieldName.includes('price') || fieldName.includes('cost') || fieldName.includes('total')) return <DollarSign className="w-4 h-4" />
    if (fieldName.includes('date')) return <Calendar className="w-4 h-4" />
    if (fieldName.includes('number') || fieldName.includes('code')) return <Hash className="w-4 h-4" />
    if (fieldName.includes('customer') || fieldName.includes('vendor') || fieldName.includes('user')) return <User className="w-4 h-4" />
    if (fieldName.includes('location') || fieldName.includes('store') || fieldName.includes('branch')) return <Building className="w-4 h-4" />
    
    switch (fieldType) {
      case 'number': return <Hash className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'boolean': return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  // Render header field
  const renderHeaderField = (fieldName: string, mapping?: any) => {
    const field = headerData[fieldName]
    if (!field || !field.visible) return null

    const isTransactionNumber = fieldName === 'transaction_number'
    const fieldType = isTransactionNumber ? 'text' : mapping?.field_type || 'text'
    const displayLabel = isTransactionNumber ? 'Transaction Number' : (mapping?.ui_config?.display_label || fieldName)
    const placeholder = isTransactionNumber ? 'Auto-generated' : mapping?.ui_config?.placeholder
    
    const commonProps = {
      value: field.value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
        updateHeaderField(fieldName, e.target.value),
      disabled: isReadonly || isSubmitting || (isTransactionNumber && mode === 'create'),
      error: !!field.error,
      placeholder: placeholder || `Enter ${displayLabel.toLowerCase()}`,
      leftIcon: getFieldIcon(fieldType, fieldName)
    }

    return (
      <div 
        key={fieldName}
        className={cn(
          'space-y-2',
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
        
        {fieldType === 'select' ? (
          <SalonLuxeSelect
            value={field.value || ''}
            onValueChange={(value) => updateHeaderField(fieldName, value)}
            disabled={commonProps.disabled}
            placeholder={commonProps.placeholder}
          >
            <option value="">Select {displayLabel.toLowerCase()}</option>
            {mapping?.validation_rules?.find((r: any) => r.type === 'allowed_values')?.values.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SalonLuxeSelect>
        ) : (
          <SalonLuxeInput
            {...commonProps}
            type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
            onChange={fieldType === 'number' 
              ? (e) => updateHeaderField(fieldName, parseFloat(e.target.value) || 0)
              : commonProps.onChange
            }
          />
        )}
        
        {field.error && (
          <div 
            className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-1"
            style={{ color: SALON_LUXE_COLORS.error.base }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {field.error}
          </div>
        )}
      </div>
    )
  }

  // Render line item row
  const renderLineItem = (line: TransactionLineItem, index: number) => {
    const lineErrors = lineValidationErrors.filter(err => err.lineNumber === line.line_number)
    
    return (
      <div 
        key={line.id}
        className={cn(
          'rounded-xl border p-4 space-y-4',
          animated && 'animate-in fade-in slide-in-from-bottom-1'
        )}
        style={{
          background: SALON_LUXE_GRADIENTS.charcoal,
          border: `1px solid ${SALON_LUXE_COLORS.border.base}`
        }}
      >
        <div className="flex items-center justify-between">
          <h4 
            className="text-sm font-semibold"
            style={{ color: SALON_LUXE_COLORS.gold.base }}
          >
            Line {line.line_number}
          </h4>
          <div className="flex items-center gap-2">
            <SalonLuxeButton
              variant="secondary"
              size="sm"
              onClick={() => {
                const duplicatedLine: TransactionLineItem = {
                  ...line,
                  id: `line_${Date.now()}_${lineItems.length + 1}`,
                  line_number: lineItems.length + 1
                }
                setLineItems(prev => [...prev, duplicatedLine])
              }}
              disabled={isReadonly || isSubmitting}
              className="min-h-[36px] min-w-[36px] p-2"
            >
              <Copy className="w-3 h-3" />
            </SalonLuxeButton>
            <SalonLuxeButton
              variant="danger"
              size="sm"
              onClick={() => removeLine(line.id)}
              disabled={isReadonly || isSubmitting || lineItems.length <= 1}
              className="min-h-[36px] min-w-[36px] p-2"
            >
              <Trash2 className="w-3 h-3" />
            </SalonLuxeButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-medium" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
              Description *
            </label>
            <SalonLuxeInput
              value={line.description || ''}
              onChange={(e) => updateLineItem(line.id, 'description', e.target.value)}
              disabled={isReadonly || isSubmitting}
              placeholder="Enter description"
              error={lineErrors.some(err => err.field === 'description')}
              leftIcon={<FileText className="w-3 h-3" />}
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="block text-xs font-medium" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
              Quantity *
            </label>
            <SalonLuxeInput
              type="number"
              value={line.quantity || 1}
              onChange={(e) => updateLineItem(line.id, 'quantity', parseFloat(e.target.value) || 1)}
              disabled={isReadonly || isSubmitting}
              placeholder="1"
              error={lineErrors.some(err => err.field === 'quantity')}
              leftIcon={<Hash className="w-3 h-3" />}
              min="0.01"
              step="0.01"
            />
          </div>

          {/* Unit Amount */}
          <div className="space-y-2">
            <label className="block text-xs font-medium" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
              Unit Amount
            </label>
            <SalonLuxeInput
              type="number"
              value={line.unit_amount || 0}
              onChange={(e) => updateLineItem(line.id, 'unit_amount', parseFloat(e.target.value) || 0)}
              disabled={isReadonly || isSubmitting}
              placeholder="0.00"
              error={lineErrors.some(err => err.field === 'unit_amount')}
              leftIcon={<DollarSign className="w-3 h-3" />}
              step="0.01"
            />
          </div>

          {/* Line Amount */}
          <div className="space-y-2">
            <label className="block text-xs font-medium" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
              Line Amount
            </label>
            <SalonLuxeInput
              type="number"
              value={line.line_amount || 0}
              disabled={true}
              placeholder="0.00"
              leftIcon={<Calculator className="w-3 h-3" />}
              style={{
                background: SALON_LUXE_GRADIENTS.goldAccent,
                color: SALON_LUXE_COLORS.text.primary
              }}
            />
          </div>
        </div>

        {/* Line validation errors */}
        {lineErrors.length > 0 && (
          <div className="space-y-1">
            {lineErrors.map((error, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 text-xs"
                style={{ color: SALON_LUXE_COLORS.error.base }}
              >
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {error.message}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!transactionConfig.success) {
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
          {transactionConfig.error || 'Invalid transaction configuration'}
        </p>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'w-full',
        modalStyle ? 'max-w-6xl mx-auto' : '',
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
            {mode === 'create' ? 'Fill out the transaction details and add line items' : 
             mode === 'edit' ? 'Update the transaction information' : 
             mode === 'approve' ? 'Review and approve the transaction' :
             'View transaction details'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isReadonly && (
            <SalonLuxeBadge variant="secondary">
              <Receipt className="w-3 h-3 mr-1" />
              Read-only
            </SalonLuxeBadge>
          )}
          {isApproval && (
            <SalonLuxeBadge variant="warning">
              <CheckCircle className="w-3 h-3 mr-1" />
              Pending Approval
            </SalonLuxeBadge>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div 
        className={cn(
          'flex items-center border-b',
          animated && 'animate-in fade-in slide-in-from-top-1 duration-300'
        )}
        style={{ borderColor: SALON_LUXE_COLORS.border.light }}
      >
        {['header', 'lines', 'totals'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              'px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 min-h-[44px]',
              activeTab === tab
                ? 'border-current'
                : 'border-transparent hover:border-current'
            )}
            style={{
              color: activeTab === tab 
                ? SALON_LUXE_COLORS.gold.base 
                : SALON_LUXE_COLORS.text.secondary
            }}
          >
            {tab === 'header' && <FileText className="w-4 h-4 mr-2 inline" />}
            {tab === 'lines' && <Edit3 className="w-4 h-4 mr-2 inline" />}
            {tab === 'totals' && <Calculator className="w-4 h-4 mr-2 inline" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'lines' && (
              <span 
                className="ml-2 px-2 py-0.5 rounded-full text-xs"
                style={{ 
                  background: SALON_LUXE_COLORS.gold.base + '20',
                  color: SALON_LUXE_COLORS.gold.base 
                }}
              >
                {lineItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6">
          {/* Header Tab */}
          {activeTab === 'header' && (
            <div 
              className={cn(
                'space-y-6',
                animated && 'animate-in fade-in slide-in-from-left-1 duration-500'
              )}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Transaction Number */}
                {renderHeaderField('transaction_number')}
                
                {/* Header fields from config */}
                {transactionConfig.header_field_mappings?.map(mapping => 
                  renderHeaderField(mapping.field_name, mapping)
                )}
              </div>
            </div>
          )}

          {/* Lines Tab */}
          {activeTab === 'lines' && (
            <div 
              className={cn(
                'space-y-4',
                animated && 'animate-in fade-in slide-in-from-right-1 duration-500'
              )}
            >
              <div className="flex items-center justify-between">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: SALON_LUXE_COLORS.text.primary }}
                >
                  Line Items
                </h3>
                {!isReadonly && (
                  <SalonLuxeButton
                    variant="primary"
                    onClick={addNewLine}
                    disabled={isSubmitting}
                    className="min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </SalonLuxeButton>
                )}
              </div>

              <div className="space-y-4">
                {lineItems.map((line, index) => renderLineItem(line, index))}
              </div>

              {lineItems.length === 0 && (
                <div 
                  className="text-center py-12 rounded-xl border-2 border-dashed"
                  style={{ 
                    borderColor: SALON_LUXE_COLORS.border.base,
                    color: SALON_LUXE_COLORS.text.tertiary 
                  }}
                >
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No line items added yet</p>
                  {!isReadonly && (
                    <SalonLuxeButton
                      variant="secondary"
                      onClick={addNewLine}
                      disabled={isSubmitting}
                      className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Line
                    </SalonLuxeButton>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Totals Tab */}
          {activeTab === 'totals' && (
            <div 
              className={cn(
                'space-y-6',
                animated && 'animate-in fade-in slide-in-from-bottom-1 duration-500'
              )}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Summary Card */}
                <div 
                  className="rounded-xl p-6 space-y-4"
                  style={{
                    background: SALON_LUXE_GRADIENTS.charcoal,
                    border: `1px solid ${SALON_LUXE_COLORS.border.base}`
                  }}
                >
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: SALON_LUXE_COLORS.gold.base }}
                  >
                    Transaction Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                        Line Items:
                      </span>
                      <span style={{ color: SALON_LUXE_COLORS.text.primary }}>
                        {totals.lineCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                        Subtotal:
                      </span>
                      <span style={{ color: SALON_LUXE_COLORS.text.primary }}>
                        ${totals.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                        Tax:
                      </span>
                      <span style={{ color: SALON_LUXE_COLORS.text.primary }}>
                        ${totals.tax.toFixed(2)}
                      </span>
                    </div>
                    <div 
                      className="flex justify-between text-lg font-semibold pt-3 border-t"
                      style={{ borderColor: SALON_LUXE_COLORS.border.base }}
                    >
                      <span style={{ color: SALON_LUXE_COLORS.gold.base }}>
                        Total:
                      </span>
                      <span style={{ color: SALON_LUXE_COLORS.gold.base }}>
                        ${totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Finance Integration Card */}
                {enableFinanceIntegration && (
                  <div 
                    className="rounded-xl p-6 space-y-4"
                    style={{
                      background: SALON_LUXE_GRADIENTS.emeraldSubtle,
                      border: `1px solid ${SALON_LUXE_COLORS.emerald?.base}40`
                    }}
                  >
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: SALON_LUXE_COLORS.emerald?.base }}
                    >
                      Finance Integration
                    </h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle 
                          className="w-4 h-4" 
                          style={{ color: SALON_LUXE_COLORS.emerald?.base }}
                        />
                        <span style={{ color: SALON_LUXE_COLORS.text.primary }}>
                          Automatic GL posting enabled
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle 
                          className="w-4 h-4" 
                          style={{ color: SALON_LUXE_COLORS.emerald?.base }}
                        />
                        <span style={{ color: SALON_LUXE_COLORS.text.primary }}>
                          Tax calculations automated
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle 
                          className="w-4 h-4" 
                          style={{ color: SALON_LUXE_COLORS.emerald?.base }}
                        />
                        <span style={{ color: SALON_LUXE_COLORS.text.primary }}>
                          Audit trail maintained
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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

        {/* Line Validation Errors */}
        {lineValidationErrors.length > 0 && (
          <div 
            className="mx-6 p-4 rounded-lg space-y-2"
            style={{ 
              background: SALON_LUXE_GRADIENTS.error,
              border: `1px solid ${SALON_LUXE_COLORS.error.base}60`
            }}
          >
            <p 
              className="text-sm font-medium"
              style={{ color: SALON_LUXE_COLORS.error.text }}
            >
              Line Item Validation Errors:
            </p>
            {lineValidationErrors.map((error, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 text-sm"
                style={{ color: SALON_LUXE_COLORS.error.text }}
              >
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Line {error.lineNumber}: {error.message}
              </div>
            ))}
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
            
            {isApproval && showApprovalActions && (
              <>
                <SalonLuxeButton 
                  variant="danger"
                  onClick={() => {
                    // Implement rejection logic
                  }}
                  disabled={isSubmitting}
                  className="min-w-[120px] min-h-[44px]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </SalonLuxeButton>
                
                <SalonLuxeButton 
                  variant="success"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="min-w-[120px] min-h-[44px]"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </SalonLuxeButton>
              </>
            )}
            
            {!isApproval && (
              <SalonLuxeButton 
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="min-w-[120px] min-h-[44px]"
              >
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Create' : 'Update'} {transactionConfig.transaction_definition.display_name}
              </SalonLuxeButton>
            )}
          </div>
        )}
      </form>
    </div>
  )
}