/**
 * Create Entity Tab Component
 * Smart Code: HERA.COMPONENTS.CREATE_ENTITY_TAB.v1
 * 
 * Comprehensive entity creation form with:
 * - Entity type selection
 * - Dynamic field configuration
 * - Smart code generation
 * - Validation and submission
 */

'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Save, Check, AlertCircle, Users, Package, 
  FileText, Building, ShoppingCart, Truck, Tag,
  DollarSign, Calendar, Globe, Mail, Phone
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

// Utils
import { cn } from '@/lib/utils'

// Types
interface CreateEntityTabProps {
  domain: string
  section: string
  entityType?: string | null
  organizationId: string
  actorUserId: string
  onEntityCreated: (entity: any) => void
}

interface EntityType {
  id: string
  label: string
  description: string
  icon: React.ComponentType<any>
  color: string
  fields: Field[]
}

interface Field {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'date'
  required: boolean
  placeholder?: string
  options?: string[]
}

export function CreateEntityTab({
  domain,
  section,
  entityType: initialEntityType,
  organizationId,
  actorUserId,
  onEntityCreated
}: CreateEntityTabProps) {
  const [selectedEntityType, setSelectedEntityType] = useState<string>(initialEntityType || 'customer')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Entity type definitions
  const entityTypes: EntityType[] = [
    {
      id: 'customer',
      label: 'Customer',
      description: 'Individual or business customers',
      icon: Users,
      color: 'blue',
      fields: [
        { name: 'entity_name', label: 'Customer Name', type: 'text', required: true, placeholder: 'John Doe' },
        { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com' },
        { name: 'phone', label: 'Phone Number', type: 'phone', required: false, placeholder: '+1 (555) 123-4567' },
        { name: 'company', label: 'Company', type: 'text', required: false, placeholder: 'ACME Corp' },
        { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: '123 Main St, City, State' },
        { name: 'customer_type', label: 'Customer Type', type: 'select', required: true, options: ['Individual', 'Business', 'VIP', 'Wholesale'] }
      ]
    },
    {
      id: 'product',
      label: 'Product',
      description: 'Inventory items and services',
      icon: Package,
      color: 'green',
      fields: [
        { name: 'entity_name', label: 'Product Name', type: 'text', required: true, placeholder: 'Premium Widget' },
        { name: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'PWD-001' },
        { name: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Detailed product description...' },
        { name: 'price', label: 'Price', type: 'number', required: true, placeholder: '99.99' },
        { name: 'category', label: 'Category', type: 'select', required: true, options: ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Sports', 'Other'] },
        { name: 'stock_quantity', label: 'Stock Quantity', type: 'number', required: false, placeholder: '100' }
      ]
    },
    {
      id: 'vendor',
      label: 'Vendor',
      description: 'Suppliers and service providers',
      icon: Truck,
      color: 'purple',
      fields: [
        { name: 'entity_name', label: 'Vendor Name', type: 'text', required: true, placeholder: 'ABC Supplies Inc.' },
        { name: 'contact_email', label: 'Contact Email', type: 'email', required: true, placeholder: 'contact@abcsupplies.com' },
        { name: 'contact_phone', label: 'Contact Phone', type: 'phone', required: false, placeholder: '+1 (555) 987-6543' },
        { name: 'website', label: 'Website', type: 'text', required: false, placeholder: 'https://abcsupplies.com' },
        { name: 'payment_terms', label: 'Payment Terms', type: 'select', required: true, options: ['Net 30', 'Net 60', 'Due on Receipt', 'COD'] },
        { name: 'vendor_type', label: 'Vendor Type', type: 'select', required: true, options: ['Supplier', 'Service Provider', 'Contractor', 'Consultant'] }
      ]
    },
    {
      id: 'location',
      label: 'Location',
      description: 'Physical locations and stores',
      icon: Building,
      color: 'orange',
      fields: [
        { name: 'entity_name', label: 'Location Name', type: 'text', required: true, placeholder: 'Main Store' },
        { name: 'address', label: 'Address', type: 'textarea', required: true, placeholder: '123 Business Ave, City, State 12345' },
        { name: 'phone', label: 'Phone Number', type: 'phone', required: false, placeholder: '+1 (555) 123-4567' },
        { name: 'manager', label: 'Manager', type: 'text', required: false, placeholder: 'Jane Smith' },
        { name: 'location_type', label: 'Location Type', type: 'select', required: true, options: ['Store', 'Warehouse', 'Office', 'Distribution Center'] },
        { name: 'operating_hours', label: 'Operating Hours', type: 'text', required: false, placeholder: 'Mon-Fri 9AM-6PM' }
      ]
    }
  ]

  const currentEntityType = entityTypes.find(et => et.id === selectedEntityType) || entityTypes[0]

  // Handle field value change
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }, [validationErrors])

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    
    currentEntityType.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        errors[field.name] = `${field.label} is required`
      } else if (field.type === 'email' && formData[field.name] && !formData[field.name].includes('@')) {
        errors[field.name] = 'Please enter a valid email address'
      } else if (field.type === 'number' && formData[field.name] && isNaN(Number(formData[field.name]))) {
        errors[field.name] = 'Please enter a valid number'
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [currentEntityType.fields, formData])

  // Generate smart code
  const generateSmartCode = useCallback((): string => {
    const domainCode = domain.toUpperCase()
    const sectionCode = section.toUpperCase()
    const entityCode = selectedEntityType.toUpperCase()
    return `HERA.${domainCode}.${sectionCode}.${entityCode}.ENTITY.v1`
  }, [domain, section, selectedEntityType])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare entity data
      const entityData = {
        entity_type: selectedEntityType.toUpperCase(),
        entity_name: formData.entity_name,
        entity_description: formData.description || `${currentEntityType.label} entity`,
        smart_code: generateSmartCode(),
        organization_id: organizationId,
        created_by: actorUserId,
        updated_by: actorUserId
      }

      // Prepare dynamic fields
      const dynamicFields = currentEntityType.fields
        .filter(field => field.name !== 'entity_name' && formData[field.name])
        .map(field => ({
          field_name: field.name,
          field_type: field.type === 'number' ? 'number' : 
                      field.type === 'email' ? 'email' :
                      field.type === 'phone' ? 'phone' : 'text',
          field_value_text: field.type !== 'number' ? formData[field.name] : undefined,
          field_value_number: field.type === 'number' ? Number(formData[field.name]) : undefined,
          smart_code: `${generateSmartCode()}.FIELD.${field.name.toUpperCase()}.v1`
        }))

      // Simulate API call (replace with actual API integration)
      console.log('Creating entity:', { entityData, dynamicFields })
      
      // Mock successful response
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newEntity = {
        id: `entity-${Date.now()}`,
        ...entityData,
        dynamic_fields: dynamicFields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Reset form
      setFormData({})
      setSelectedEntityType(initialEntityType || 'customer')
      
      // Notify parent
      onEntityCreated(newEntity)
      
    } catch (err) {
      console.error('Entity creation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to create entity. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, selectedEntityType, formData, currentEntityType, generateSmartCode, organizationId, actorUserId, onEntityCreated, initialEntityType])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Create New Entity</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Add a new {selectedEntityType} to your {domain} {section} workspace
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50/80 text-green-700 border-green-200/50">
          <Plus className="w-3 h-3 mr-1" />
          New Entity
        </Badge>
      </div>

      <Separator className="bg-white/20" />

      {/* Entity Type Selection */}
      <Card className="bg-white/5 backdrop-blur border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Entity Type</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Select the type of entity you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {entityTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedEntityType === type.id
              
              return (
                <motion.button
                  key={type.id}
                  onClick={() => {
                    setSelectedEntityType(type.id)
                    setFormData({}) // Reset form data when changing type
                  }}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                    isSelected
                      ? `bg-${type.color}-500/20 border-${type.color}-500/50 text-${type.color}-700`
                      : "bg-white/5 border-white/20 text-slate-600 hover:bg-white/10 hover:border-white/30"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    isSelected ? `bg-${type.color}-500/20` : "bg-white/10"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{type.label}</div>
                    <div className="text-xs opacity-80 mt-1">{type.description}</div>
                  </div>
                  {isSelected && (
                    <motion.div
                      className={cn("w-2 h-2 rounded-full", `bg-${type.color}-500`)}
                      layoutId="selectedTypeIndicator"
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Entity Form */}
      <Card className="bg-white/5 backdrop-blur border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg text-slate-800 dark:text-slate-100">
            <currentEntityType.icon className={cn("w-5 h-5", `text-${currentEntityType.color}-600`)} />
            {currentEntityType.label} Details
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Fill in the details for your new {currentEntityType.label.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Smart Code Preview */}
          <div className="bg-slate-800/5 rounded-lg p-3 border border-white/10">
            <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Smart Code</Label>
            <div className="font-mono text-sm text-slate-700 dark:text-slate-200 mt-1">{generateSmartCode()}</div>
          </div>

          {/* Dynamic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentEntityType.fields.map((field) => (
              <div key={field.name} className={cn(
                field.type === 'textarea' ? "md:col-span-2" : ""
              )}>
                <Label htmlFor={field.name} className="text-slate-700 dark:text-slate-200">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {field.type === 'select' ? (
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={(value) => handleFieldChange(field.name, value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-slate-800 dark:text-slate-100">
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="bg-white/10 border-white/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="bg-white/10 border-white/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                )}

                {validationErrors[field.name] && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50/80 backdrop-blur">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Entity...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create {currentEntityType.label}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}