'use client'

/**
 * Vendor Create Page
 * Smart Code: HERA.PURCHASE.MASTER.VENDOR.ENTITY.v1
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
  Building2
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface VendorFormData {
  entity_name: string
  entity_code: string
  vendor_name: string
  tax_id: string
  payment_terms: string
  is_active: boolean
}

export default function CreateVendorPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('basics')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<VendorFormData>({
    entity_name: '',
    entity_code: '',
    vendor_name: '',
    tax_id: '',
    payment_terms: '',
    is_active: false
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
      title: 'Vendor Details',
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
        entity_type: 'VENDOR',
        entity_name: formData.entity_name,
        entity_code: formData.entity_code,
        smart_code: 'HERA.PURCHASE.MASTER.VENDOR.ENTITY.v1',
        organization_id: organization!.id
      }

      // Prepare dynamic fields
      const dynamicFields = [
        {
          field_name: 'vendor_name',
          field_type: 'text',
          field_value_text: formData.vendor_name,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.NAME.v1'
        },
        {
          field_name: 'tax_id',
          field_type: 'text',
          field_value_text: formData.tax_id,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.TAX_ID.v1'
        },
        {
          field_name: 'payment_terms',
          field_type: 'text',
          field_value_text: formData.payment_terms,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.PAYMENT_TERMS.v1'
        },
        {
          field_name: 'is_active',
          field_type: 'boolean',
          field_value_boolean: formData.is_active,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.IS_ACTIVE.v1'
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
      window.location.href = `/vendor`
      
    } catch (error) {
      console.error('Failed to create vendor:', error)
      alert('Failed to create vendor. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/vendor`
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
                    Vendor Name *
                  </Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_name: e.target.value
                    }))}
                    placeholder="Enter vendor name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entity_code">
                    Vendor Code *
                  </Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_code: e.target.value.toUpperCase()
                    }))}
                    placeholder="Enter vendor code"
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
              <CardTitle>Vendor Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Vendor Name
                   *
                </label>
                <Input
                    type="text"
                    value={formData.vendor_name || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vendor_name: e.target.value
                    }))}
                    placeholder="Enter vendor name"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tax Id
                  
                </label>
                <Input
                    type="text"
                    value={formData.tax_id || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      tax_id: e.target.value
                    }))}
                    placeholder="Enter tax id"
                    
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Payment Terms
                  
                </label>
                <Input
                    type="text"
                    value={formData.payment_terms || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_terms: e.target.value
                    }))}
                    placeholder="Enter payment terms"
                    
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Is Active
                   *
                </label>
                <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        is_active: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Enable is_active</span>
                  </div>
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
                <p>Relationship configuration will be available after creating the vendor.</p>
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
      title={`Create New ${Vendor}`}
      subtitle="Set up a new vendor record with all required information"
      breadcrumb="Enterprise > Vendors > Create"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      onSaveAndContinue={handleSaveAndContinue}
      isSaving={isSaving}
      saveLabel="Create Vendor"
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