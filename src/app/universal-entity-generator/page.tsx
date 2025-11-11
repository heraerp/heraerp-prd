'use client'

/**
 * Universal Entity Generator Page
 * Smart Code: HERA.PLATFORM.UNIVERSAL.ENTITY.GENERATOR.v1
 * 
 * Universal tool for creating any entity type with dynamic data fields
 * Based on HERA RPC function patterns and enterprise form design
 */

import React, { useState, useMemo } from 'react'
import { useClaudeEntityGenerator } from '@/hooks/useClaudeEntityGenerator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  Users, 
  Settings, 
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Code,
  Sparkles,
  Copy,
  Save,
  RefreshCw,
  Wand2,
  Brain,
  Loader2
} from 'lucide-react'

// Dynamic import for API to avoid SSR issues

// Entity type templates with predefined fields
const ENTITY_TEMPLATES = {
  PRODUCT: {
    label: 'Product',
    icon: Package,
    category: 'Commerce',
    description: 'Physical or digital products, software, services',
    requiredFields: ['name', 'category'],
    fields: [
      { name: 'name', label: 'Product Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['software', 'hardware', 'service', 'subscription', 'digital', 'physical'] },
      { name: 'price', label: 'Price', type: 'number', prefix: '$' },
      { name: 'sku', label: 'SKU/Code', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'vendor', label: 'Vendor/Manufacturer', type: 'text' },
      { name: 'version', label: 'Version', type: 'text' },
      { name: 'license_type', label: 'License Type', type: 'select', options: ['perpetual', 'subscription', 'trial', 'open_source'] },
      { name: 'platform', label: 'Platform/OS', type: 'text', placeholder: 'windows,mac,linux' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'discontinued'] }
    ]
  },
  CUSTOMER: {
    label: 'Customer',
    icon: Users,
    category: 'CRM',
    description: 'Business customers, prospects, contacts',
    requiredFields: ['name', 'type'],
    fields: [
      { name: 'name', label: 'Customer Name', type: 'text', required: true },
      { name: 'type', label: 'Customer Type', type: 'select', required: true, options: ['prospect', 'customer', 'partner', 'vendor'] },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'industry', label: 'Industry', type: 'select', options: ['technology', 'healthcare', 'finance', 'manufacturing', 'retail', 'other'] },
      { name: 'company_size', label: 'Company Size', type: 'select', options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
      { name: 'revenue', label: 'Annual Revenue', type: 'select', options: ['under_1m', '1m_10m', '10m_50m', '50m_100m', '100m+'] },
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'website', label: 'Website', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'prospect'] }
    ]
  },
  SERVICE: {
    label: 'Service',
    icon: Settings,
    category: 'Operations',
    description: 'Service offerings, treatments, consultations',
    requiredFields: ['name', 'category'],
    fields: [
      { name: 'name', label: 'Service Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['consultation', 'treatment', 'maintenance', 'support', 'training'] },
      { name: 'duration', label: 'Duration (minutes)', type: 'number' },
      { name: 'price', label: 'Price', type: 'number', prefix: '$' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'skill_level', label: 'Required Skill Level', type: 'select', options: ['beginner', 'intermediate', 'advanced', 'expert'] },
      { name: 'equipment_needed', label: 'Equipment Needed', type: 'text' },
      { name: 'prerequisites', label: 'Prerequisites', type: 'textarea' },
      { name: 'booking_type', label: 'Booking Type', type: 'select', options: ['appointment', 'walk_in', 'both'] },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'seasonal'] }
    ]
  },
  VENDOR: {
    label: 'Vendor/Supplier',
    icon: Database,
    category: 'Supply Chain',
    description: 'Suppliers, vendors, business partners',
    requiredFields: ['name', 'type'],
    fields: [
      { name: 'name', label: 'Vendor Name', type: 'text', required: true },
      { name: 'type', label: 'Vendor Type', type: 'select', required: true, options: ['supplier', 'distributor', 'manufacturer', 'service_provider', 'contractor'] },
      { name: 'contact_person', label: 'Contact Person', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'payment_terms', label: 'Payment Terms', type: 'select', options: ['net15', 'net30', 'net45', 'net60', 'cod', 'prepaid'] },
      { name: 'credit_limit', label: 'Credit Limit', type: 'number', prefix: '$' },
      { name: 'tax_id', label: 'Tax ID', type: 'text' },
      { name: 'capabilities', label: 'Capabilities', type: 'textarea' },
      { name: 'certifications', label: 'Certifications', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'approved', 'pending'] }
    ]
  },
  ASSET: {
    label: 'Asset',
    icon: Zap,
    category: 'Assets',
    description: 'Equipment, tools, facilities, digital assets',
    requiredFields: ['name', 'category'],
    fields: [
      { name: 'name', label: 'Asset Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['equipment', 'vehicle', 'property', 'software', 'furniture', 'tools'] },
      { name: 'serial_number', label: 'Serial Number', type: 'text' },
      { name: 'purchase_price', label: 'Purchase Price', type: 'number', prefix: '$' },
      { name: 'current_value', label: 'Current Value', type: 'number', prefix: '$' },
      { name: 'purchase_date', label: 'Purchase Date', type: 'date' },
      { name: 'warranty_expiry', label: 'Warranty Expiry', type: 'date' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'condition', label: 'Condition', type: 'select', options: ['excellent', 'good', 'fair', 'poor', 'needs_repair'] },
      { name: 'maintenance_schedule', label: 'Maintenance Schedule', type: 'select', options: ['weekly', 'monthly', 'quarterly', 'annually', 'as_needed'] },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'maintenance', 'retired'] }
    ]
  }
}

interface DynamicField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select' | 'boolean'
  value: string | number | boolean
  required?: boolean
  options?: string[]
  smartCode: string
}

interface FormData {
  entityType: string
  entityName: string
  entityCode: string
  entityDescription: string
  organizationId: string
  smartCode: string
  dynamicFields: DynamicField[]
}

export default function UniversalEntityGeneratorPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAiGenerator, setShowAiGenerator] = useState(false)
  
  // Claude AI integration
  const {
    isGenerating,
    generatedTemplate,
    error: aiError,
    generateTemplate,
    enhanceFields,
    clearTemplate
  } = useClaudeEntityGenerator()
  
  const [formData, setFormData] = useState<FormData>({
    entityType: '',
    entityName: '',
    entityCode: '',
    entityDescription: '',
    organizationId: 'ff837c4c-95f2-43ac-a498-39597018b10c', // Default to retail org
    smartCode: '',
    dynamicFields: []
  })

  // Generate smart code based on entity type and business context
  const generateSmartCode = (entityType: string, category?: string, subCategory?: string) => {
    const base = 'HERA'
    const industry = 'SOFTWARE' // Could be dynamic based on org
    const type = entityType.toUpperCase()
    const cat = category?.toUpperCase().replace(/-/g, '_') || 'GENERAL'
    const sub = subCategory?.toUpperCase().replace(/-/g, '_') || 'STANDARD'
    const version = 'v1'
    
    return `${base}.${industry}.${type}.${cat}.${sub}.${version}`
  }

  // Update smart code when entity type or category changes
  const updateSmartCode = (entityType: string, categoryValue?: string) => {
    if (entityType) {
      const template = ENTITY_TEMPLATES[entityType as keyof typeof ENTITY_TEMPLATES]
      const category = categoryValue || template?.category || 'GENERAL'
      const smartCode = generateSmartCode(entityType, category)
      setFormData(prev => ({ ...prev, smartCode }))
    }
  }

  // Handle entity type selection
  const handleEntityTypeChange = (entityType: string) => {
    const template = ENTITY_TEMPLATES[entityType as keyof typeof ENTITY_TEMPLATES]
    if (!template) return

    // Initialize dynamic fields based on template
    const dynamicFields: DynamicField[] = template.fields.map((field, index) => ({
      id: `field_${index}`,
      name: field.name,
      label: field.label,
      type: field.type,
      value: field.type === 'boolean' ? false : '',
      required: field.required || false,
      options: field.options,
      smartCode: `HERA.SOFTWARE.${entityType}.FIELD.${field.name.toUpperCase()}.v1`
    }))

    setFormData(prev => ({
      ...prev,
      entityType,
      dynamicFields
    }))

    updateSmartCode(entityType)
  }

  // Handle dynamic field value changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dynamicFields: prev.dynamicFields.map(field =>
        field.id === fieldId ? { ...field, value } : field
      )
    }))

    // Update smart code if category field changed
    const field = formData.dynamicFields.find(f => f.id === fieldId)
    if (field?.name === 'category' && formData.entityType) {
      updateSmartCode(formData.entityType, value as string)
    }
  }

  // Add custom dynamic field
  const addCustomField = () => {
    const newField: DynamicField = {
      id: `custom_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      value: '',
      smartCode: `HERA.SOFTWARE.${formData.entityType}.FIELD.CUSTOM.v1`
    }

    setFormData(prev => ({
      ...prev,
      dynamicFields: [...prev.dynamicFields, newField]
    }))
  }

  // Remove dynamic field
  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      dynamicFields: prev.dynamicFields.filter(field => field.id !== fieldId)
    }))
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.entityType) newErrors.entityType = 'Entity type is required'
    if (!formData.entityName) newErrors.entityName = 'Entity name is required'
    if (!formData.smartCode) newErrors.smartCode = 'Smart code is required'
    if (!formData.organizationId) newErrors.organizationId = 'Organization is required'

    // Validate required dynamic fields
    const template = ENTITY_TEMPLATES[formData.entityType as keyof typeof ENTITY_TEMPLATES]
    if (template) {
      formData.dynamicFields.forEach(field => {
        if (field.required && !field.value) {
          newErrors[`field_${field.id}`] = `${field.label} is required`
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Generate entity code from name
  const generateEntityCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20)
  }

  // Handle entity name change and auto-generate code
  const handleEntityNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      entityName: name,
      entityCode: prev.entityCode || generateEntityCode(name)
    }))
  }

  // Handle AI-generated template
  const handleAiGeneration = async () => {
    if (!aiPrompt.trim()) return

    const organizationContext = 'HERA Retail Demo - Software retailer organization'
    await generateTemplate(aiPrompt, organizationContext)
  }

  // Apply AI-generated template to form
  const applyAiTemplate = () => {
    if (!generatedTemplate) return

    // Convert Claude fields to our DynamicField format
    const dynamicFields: DynamicField[] = generatedTemplate.fields.map((field, index) => ({
      id: `ai_field_${index}`,
      name: field.name,
      label: field.label,
      type: field.type,
      value: field.type === 'boolean' ? false : '',
      required: field.required || false,
      options: field.options,
      smartCode: `HERA.SOFTWARE.${generatedTemplate.entityType}.FIELD.${field.name.toUpperCase()}.v1`
    }))

    // Apply template to form data
    setFormData(prev => ({
      ...prev,
      entityType: generatedTemplate.entityType,
      entityName: generatedTemplate.suggestedName || '',
      entityCode: generatedTemplate.suggestedCode || generateEntityCode(generatedTemplate.suggestedName || ''),
      entityDescription: generatedTemplate.description,
      smartCode: generatedTemplate.smartCode,
      dynamicFields
    }))

    // Clear AI state and proceed to next step
    clearTemplate()
    setAiPrompt('')
    setShowAiGenerator(false)
    setCurrentStep(2)
  }

  // Enhance current fields with AI suggestions
  const enhanceCurrentFields = async () => {
    if (!formData.entityType) return

    const context = `${formData.entityType} entity for software retailer business. Current fields: ${formData.dynamicFields.map(f => f.label).join(', ')}`
    
    const additionalFields = await enhanceFields(
      formData.dynamicFields.map(f => ({
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.options
      })),
      formData.entityType,
      context
    )

    if (additionalFields.length > 0) {
      const newDynamicFields: DynamicField[] = additionalFields.map((field, index) => ({
        id: `enhanced_${Date.now()}_${index}`,
        name: field.name,
        label: field.label,
        type: field.type,
        value: field.type === 'boolean' ? false : '',
        required: field.required || false,
        options: field.options,
        smartCode: `HERA.SOFTWARE.${formData.entityType}.FIELD.${field.name.toUpperCase()}.v1`
      }))

      setFormData(prev => ({
        ...prev,
        dynamicFields: [...prev.dynamicFields, ...newDynamicFields]
      }))
    }
  }

  // Create entity using RPC function
  const createEntity = async () => {
    if (!validateForm()) return

    setIsCreating(true)
    setErrors({})
    setSuccessMessage('')

    try {
      // Import the API here to avoid SSR issues
      const { universalEntityAPI } = await import('@/lib/universal-entity-api')

      // Create entity request
      const request = {
        entityType: formData.entityType,
        entityName: formData.entityName,
        entityCode: formData.entityCode,
        entityDescription: formData.entityDescription,
        organizationId: formData.organizationId,
        smartCode: formData.smartCode,
        dynamicFields: formData.dynamicFields.map(field => ({
          name: field.name,
          type: field.type,
          value: field.value,
          smartCode: field.smartCode
        }))
      }

      console.log('🚀 Creating entity via Universal Entity API:', request)

      // Call the real API
      const result = await universalEntityAPI.createEntity(request)

      if (result.success) {
        setSuccessMessage(`✅ Successfully created ${formData.entityType.toLowerCase()} entity: ${formData.entityName}${result.entityId ? ` (ID: ${result.entityId})` : ''}`)
        
        // Reset form
        setFormData({
          entityType: '',
          entityName: '',
          entityCode: '',
          entityDescription: '',
          organizationId: 'ff837c4c-95f2-43ac-a498-39597018b10c',
          smartCode: '',
          dynamicFields: []
        })
        setCurrentStep(1)
      } else {
        setErrors({ 
          general: `❌ Failed to create entity: ${result.error}${result.context ? ` (${result.context})` : ''}` 
        })
      }

    } catch (error) {
      console.error('💥 Exception creating entity:', error)
      setErrors({ general: `❌ Failed to create entity: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setIsCreating(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={`w-16 h-1 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  const renderEntityTypeSelection = () => (
    <div className="space-y-6">
      {/* AI Generator Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Entity Generator
            <Badge variant="secondary" className="ml-2">Powered by Claude</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showAiGenerator ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Let AI generate a custom entity template based on your description
              </p>
              <Button 
                onClick={() => setShowAiGenerator(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="aiPrompt">
                  Describe what you want to track
                </Label>
                <Textarea
                  id="aiPrompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: 'I want to track software licenses for our company with renewal dates, vendor info, and cost tracking' or 'Customer project requirements with timelines, budget, and team assignments'"
                  rows={3}
                  className="mt-2"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAiGeneration}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Template
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAiGenerator(false)
                    setAiPrompt('')
                    clearTemplate()
                  }}
                >
                  Cancel
                </Button>
              </div>

              {aiError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {aiError}
                  </AlertDescription>
                </Alert>
              )}

              {generatedTemplate && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Generated Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold">Entity Type: {generatedTemplate.entityType}</p>
                        <p className="text-sm text-gray-600">{generatedTemplate.description}</p>
                        <p className="text-xs font-mono mt-1">{generatedTemplate.smartCode}</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold">Generated Fields ({generatedTemplate.fields.length}):</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {generatedTemplate.fields.map((field, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm">{field.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={applyAiTemplate}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Use This Template
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setAiPrompt('')
                            clearTemplate()
                          }}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Or Select from Predefined Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(ENTITY_TEMPLATES).map(([key, template]) => {
            const IconComponent = template.icon
            const isSelected = formData.entityType === key
            
            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleEntityTypeChange(key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{template.label}</h3>
                      <Badge variant="secondary" className="mb-2">
                        {template.category}
                      </Badge>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          {template.fields.length} fields available
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {formData.entityType && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Selected: {ENTITY_TEMPLATES[formData.entityType as keyof typeof ENTITY_TEMPLATES].label}</h4>
            <p className="text-sm text-gray-600 mb-3">
              {ENTITY_TEMPLATES[formData.entityType as keyof typeof ENTITY_TEMPLATES].description}
            </p>
            <Button onClick={() => setCurrentStep(2)}>
              Configure Basic Information <Code className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )

  const renderBasicInformation = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="entityName">
            Entity Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="entityName"
            value={formData.entityName}
            onChange={(e) => handleEntityNameChange(e.target.value)}
            placeholder="Enter entity name"
            className={errors.entityName ? 'border-red-500' : ''}
          />
          {errors.entityName && (
            <p className="text-sm text-red-600 mt-1">{errors.entityName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="entityCode">Entity Code</Label>
          <Input
            id="entityCode"
            value={formData.entityCode}
            onChange={(e) => setFormData(prev => ({ ...prev, entityCode: e.target.value }))}
            placeholder="Auto-generated from name"
          />
        </div>

        <div>
          <Label htmlFor="entityDescription">Description</Label>
          <Textarea
            id="entityDescription"
            value={formData.entityDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, entityDescription: e.target.value }))}
            placeholder="Brief description of this entity"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="organizationId">
            Organization <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.organizationId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
          >
            <SelectTrigger className={errors.organizationId ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ff837c4c-95f2-43ac-a498-39597018b10c">HERA Retail Demo</SelectItem>
              <SelectItem value="00000000-0000-0000-0000-000000000000">HERA Platform</SelectItem>
            </SelectContent>
          </Select>
          {errors.organizationId && (
            <p className="text-sm text-red-600 mt-1">{errors.organizationId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="smartCode">
            Smart Code <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="smartCode"
              value={formData.smartCode}
              onChange={(e) => setFormData(prev => ({ ...prev, smartCode: e.target.value }))}
              placeholder="HERA DNA Smart Code"
              className={`font-mono ${errors.smartCode ? 'border-red-500' : ''}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => updateSmartCode(formData.entityType)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {errors.smartCode && (
            <p className="text-sm text-red-600 mt-1">{errors.smartCode}</p>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            Back
          </Button>
          <Button onClick={() => setCurrentStep(3)} disabled={!formData.entityName}>
            Configure Fields <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderDynamicFields = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Dynamic Fields Configuration
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={enhanceCurrentFields}
            disabled={isGenerating || !formData.entityType}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Enhance Fields
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addCustomField}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {formData.dynamicFields.map((field) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{field.label}</Label>
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
                {!field.required && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {field.type === 'select' ? (
                <Select
                  value={field.value as string}
                  onValueChange={(value) => handleFieldChange(field.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  value={field.value as string}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  rows={3}
                />
              ) : field.type === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value as boolean}
                    onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Enable {field.label.toLowerCase()}</span>
                </div>
              ) : (
                <Input
                  type={field.type}
                  value={field.value as string}
                  onChange={(e) => handleFieldChange(field.id, field.type === 'number' ? Number(e.target.value) || '' : e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}

              <div className="mt-2">
                <span className="text-xs text-gray-500 font-mono">{field.smartCode}</span>
              </div>

              {errors[`field_${field.id}`] && (
                <p className="text-sm text-red-600 mt-1">{errors[`field_${field.id}`]}</p>
              )}
            </Card>
          ))}

        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            Back
          </Button>
          <Button onClick={() => setCurrentStep(4)}>
            Review & Create <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderReviewAndCreate = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Review & Create Entity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errors.general && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errors.general}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Entity Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {formData.entityType}
              </div>
              <div>
                <span className="font-medium">Name:</span> {formData.entityName}
              </div>
              <div>
                <span className="font-medium">Code:</span> {formData.entityCode}
              </div>
              <div>
                <span className="font-medium">Smart Code:</span> <code className="bg-white px-1 rounded">{formData.smartCode}</code>
              </div>
            </div>
            {formData.entityDescription && (
              <div className="mt-2">
                <span className="font-medium">Description:</span> {formData.entityDescription}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Dynamic Fields ({formData.dynamicFields.filter(f => f.value).length})</h3>
            <div className="space-y-2">
              {formData.dynamicFields
                .filter(field => field.value)
                .map(field => (
                  <div key={field.id} className="flex justify-between text-sm">
                    <span className="font-medium">{field.label}:</span>
                    <span>{String(field.value)}</span>
                  </div>
                ))}
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-800">RPC Function Call Preview</h3>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`supabase.rpc('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: 'f7f778da-e629-40f2-a255-38825ed1db37',
  p_organization_id: '${formData.organizationId}',
  p_entity: {
    entity_type: '${formData.entityType}',
    entity_name: '${formData.entityName}',
    entity_code: '${formData.entityCode}',
    smart_code: '${formData.smartCode}'
  },
  p_dynamic: {${formData.dynamicFields
    .filter(f => f.value)
    .map(f => `
    ${f.name}: {
      field_type: '${f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'text'}',
      field_value_${f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'text'}: ${typeof f.value === 'string' ? `'${f.value}'` : f.value},
      smart_code: '${f.smartCode}'
    }`)
    .join(',')
  }
  },
  p_relationships: [],
  p_options: {}
})`}
            </pre>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => setCurrentStep(3)}>
            Back to Fields
          </Button>
          <Button 
            onClick={createEntity} 
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Entity
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            Universal Entity Generator
            <Brain className="w-8 h-8 text-blue-600" />
          </h1>
          <p className="text-xl text-gray-600">
            Create any entity type with AI-powered field generation using HERA RPC functions
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge className="bg-blue-100 text-blue-800">
              AI-Powered by Claude
            </Badge>
            <Badge>
              Organization: HERA Retail Demo
            </Badge>
          </div>
        </div>

        {renderStepIndicator()}

        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && renderEntityTypeSelection()}
          {currentStep === 2 && renderBasicInformation()}
          {currentStep === 3 && renderDynamicFields()}
          {currentStep === 4 && renderReviewAndCreate()}
        </div>
      </div>
    </div>
  )
}