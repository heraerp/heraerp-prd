'use client'

/**
 * Rebate Agreement Create Page
 * Smart Code: HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1
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
  File-contract
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface Rebate AgreementFormData {
  entity_name: string
  entity_code: string
  agreement_name: string
  agreement_type: string
  valid_from: string
  valid_to: string
  base_rate: number
  target_volume: number
  settlement_method: string
  settlement_frequency: string
  status: string
}

export default function CreateRebate AgreementPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('basics')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Rebate AgreementFormData>({
    entity_name: '',
    entity_code: '',
    agreement_name: '',
    agreement_type: '',
    valid_from: '',
    valid_to: '',
    base_rate: 0,
    target_volume: 0,
    settlement_method: '',
    settlement_frequency: '',
    status: ''
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
      title: 'Rebate Agreement Details',
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
        entity_type: 'REBATE_AGREEMENT',
        entity_name: formData.entity_name,
        entity_code: formData.entity_code,
        smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1',
        organization_id: organization!.id
      }

      // Prepare dynamic fields
      const dynamicFields = [
        {
          field_name: 'agreement_name',
          field_type: 'text',
          field_value_text: formData.agreement_name,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.NAME.v1'
        },
        {
          field_name: 'agreement_type',
          field_type: 'text',
          field_value_text: formData.agreement_type,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TYPE.v1'
        },
        {
          field_name: 'valid_from',
          field_type: 'text',
          field_value_text: formData.valid_from,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_FROM.v1'
        },
        {
          field_name: 'valid_to',
          field_type: 'text',
          field_value_text: formData.valid_to,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_TO.v1'
        },
        {
          field_name: 'base_rate',
          field_type: 'number',
          field_value_number: formData.base_rate,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.BASE_RATE.v1'
        },
        {
          field_name: 'target_volume',
          field_type: 'number',
          field_value_number: formData.target_volume,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TARGET_VOLUME.v1'
        },
        {
          field_name: 'settlement_method',
          field_type: 'text',
          field_value_text: formData.settlement_method,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.SETTLEMENT_METHOD.v1'
        },
        {
          field_name: 'settlement_frequency',
          field_type: 'text',
          field_value_text: formData.settlement_frequency,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.SETTLEMENT_FREQUENCY.v1'
        },
        {
          field_name: 'status',
          field_type: 'text',
          field_value_text: formData.status,
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.STATUS.v1'
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
      window.location.href = `/rebate_agreement`
      
    } catch (error) {
      console.error('Failed to create rebate_agreement:', error)
      alert('Failed to create rebate_agreement. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/rebate_agreement`
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
                    Rebate Agreement Name *
                  </Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_name: e.target.value
                    }))}
                    placeholder="Enter rebate_agreement name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entity_code">
                    Rebate Agreement Code *
                  </Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_code: e.target.value.toUpperCase()
                    }))}
                    placeholder="Enter rebate_agreement code"
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
              <CardTitle>Rebate Agreement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Agreement Name
                   *
                </label>
                <Input
                    type="text"
                    value={formData.agreement_name || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      agreement_name: e.target.value
                    }))}
                    placeholder="Enter agreement name"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Agreement Type
                   *
                </label>
                <Input
                    type="text"
                    value={formData.agreement_type || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      agreement_type: e.target.value
                    }))}
                    placeholder="Enter agreement type"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Valid From
                   *
                </label>
                <Input
                    type="text"
                    value={formData.valid_from || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      valid_from: e.target.value
                    }))}
                    placeholder="Enter valid from"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Valid To
                   *
                </label>
                <Input
                    type="text"
                    value={formData.valid_to || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      valid_to: e.target.value
                    }))}
                    placeholder="Enter valid to"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Base Rate
                   *
                </label>
                <Input
                    type="number"
                    value={formData.base_rate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      base_rate: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter base rate"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Target Volume
                  
                </label>
                <Input
                    type="number"
                    value={formData.target_volume || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      target_volume: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter target volume"
                    
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Settlement Method
                   *
                </label>
                <Input
                    type="text"
                    value={formData.settlement_method || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settlement_method: e.target.value
                    }))}
                    placeholder="Enter settlement method"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Settlement Frequency
                   *
                </label>
                <Input
                    type="text"
                    value={formData.settlement_frequency || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settlement_frequency: e.target.value
                    }))}
                    placeholder="Enter settlement frequency"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Status
                   *
                </label>
                <Input
                    type="text"
                    value={formData.status || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                    placeholder="Enter status"
                    required
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
                <p>Relationship configuration will be available after creating the rebate_agreement.</p>
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
      title={`Create New ${Rebate Agreement}`}
      subtitle="Set up a new rebate_agreement record with all required information"
      breadcrumb="Enterprise > Rebate Agreements > Create"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      onSaveAndContinue={handleSaveAndContinue}
      isSaving={isSaving}
      saveLabel="Create Rebate Agreement"
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