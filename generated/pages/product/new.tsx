'use client'

/**
 * Product Create Page
 * Smart Code: HERA.PROCURE.MASTER.PRODUCT.ENTITY.v1
 * Generated from: Purchasing Rebate Processing v1.0.0
 */

import React, { useState } from 'react'
import { EnterpriseCreatePage, CreatePageSection, AIInsight } from '@/components/enterprise/EnterpriseCreatePage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Settings, 
  Link, 
  CheckCircle,
  Package
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface ProductFormData {
  entity_name: string
  entity_code: string
  product_name: string
  product_code: string
  category: string
  unit_price: number
}

export default function CreateProductPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('basics')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    entity_name: '',
    entity_code: '',
    product_name: '',
    product_code: '',
    category: '',
    unit_price: 0
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'basics',
      title: 'Basic Information',
      icon: FileText,
      isRequired: true,
      isComplete: !!(formData.entity_name && formData.entity_code)
    },
    {
      id: 'details',
      title: 'Product Details',
      icon: Settings,
      isRequired: false,
      isComplete: true // Mark complete when required fields are filled
    },
    {
      id: 'relationships',
      title: 'Relationships',
      icon: Link,
      isRequired: false,
      isComplete: true
    }
  ]

  // AI insights and suggestions
  const aiInsights: AIInsight[] = [
    {
      id: 'naming',
      type: 'suggestion',
      title: 'Naming Convention',
      content: 'Consider using a descriptive name that follows your organization\'s naming conventions.',
      action: {
        label: 'Apply Standard',
        onClick: () => {
          // Auto-generate based on patterns
          setFormData(prev => ({
            ...prev,
            entity_code: prev.entity_name.toUpperCase().replace(/\s+/g, '_')
          }))
        }
      }
    },
    {
      id: 'validation',
      type: 'automation',
      title: 'Auto-validation',
      content: 'HERA will automatically validate required fields and smart code patterns.'
    }
  ]

  const aiSuggestions = [
    'Use clear, descriptive names for better organization',
    'Fill all required fields marked with asterisk (*)',
    'Consider relationships with other entities',
    'Leverage HERA\'s automation features'
  ]

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Prepare entity data
      const entityData = {
        entity_type: 'PRODUCT',
        entity_name: formData.entity_name,
        entity_code: formData.entity_code,
        smart_code: 'HERA.PROCURE.MASTER.PRODUCT.ENTITY.v1',
        organization_id: organization!.id
      }

      // Prepare dynamic fields
      const dynamicFields = [
        {
          field_name: 'product_name',
          field_type: 'text',
          field_value_text: formData.product_name,
          smart_code: 'HERA.PROCURE.MASTER.PRODUCT.FIELD.NAME.v1'
        },
        {
          field_name: 'product_code',
          field_type: 'text',
          field_value_text: formData.product_code,
          smart_code: 'HERA.PROCURE.MASTER.PRODUCT.FIELD.CODE.v1'
        },
        {
          field_name: 'category',
          field_type: 'text',
          field_value_text: formData.category,
          smart_code: 'HERA.PROCURE.MASTER.PRODUCT.FIELD.CATEGORY.v1'
        },
        {
          field_name: 'unit_price',
          field_type: 'number',
          field_value_number: formData.unit_price,
          smart_code: 'HERA.PROCURE.MASTER.PRODUCT.FIELD.UNIT_PRICE.v1'
        }
      ]

      // Create entity via API
      const { data } = await apiV2.post('entities', {
        entity: entityData,
        dynamic_fields: dynamicFields,
        relationships: [],
        organization_id: organization!.id
      })

      // Success - redirect to list or view page
      window.location.href = `/product`
      
    } catch (error) {
      console.error('Failed to create product:', error)
      alert('Failed to create product. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/product`
  }

  const handleSaveAndContinue = async () => {
    await handleSave()
    // Continue to next step or entity
  }

  const completionPercentage = Math.round(
    (sections.filter(s => s.isComplete).length / sections.length) * 100
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'basics':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entity_name">
                    Product Name *
                  </Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_name: e.target.value
                    }))}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entity_code">
                    Product Code *
                  </Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_code: e.target.value.toUpperCase()
                    }))}
                    placeholder="Enter product code"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'details':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Product Name
                   *
                </label>
                <Input
                    type="text"
                    value={formData.product_name || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      product_name: e.target.value
                    }))}
                    placeholder="Enter product name"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Product Code
                   *
                </label>
                <Input
                    type="text"
                    value={formData.product_code || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      product_code: e.target.value
                    }))}
                    placeholder="Enter product code"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Category
                  
                </label>
                <Input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      category: e.target.value
                    }))}
                    placeholder="Enter category"
                    
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Unit Price
                  
                </label>
                <Input
                    type="number"
                    value={formData.unit_price || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      unit_price: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter unit price"
                    
                  />
              </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'relationships':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Relationships & Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Link className="w-12 h-12 mx-auto mb-4" />
                <p>Relationship configuration will be available after creating the product.</p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <EnterpriseCreatePage
      title={`Create New ${Product}`}
      subtitle="Set up a new product record with all required information"
      breadcrumb="Enterprise > Products > Create"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      onSaveAndContinue={handleSaveAndContinue}
      isSaving={isSaving}
      saveLabel="Create Product"
      aiInsights={aiInsights}
      aiSuggestions={aiSuggestions}
      completionPercentage={completionPercentage}
      estimatedTime="5-10 minutes"
      hasErrors={false}
      errorCount={0}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}