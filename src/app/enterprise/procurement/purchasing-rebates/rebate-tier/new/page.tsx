'use client'

/**
 * Rebate Tier Create Page
 * Smart Code: HERA.PURCHASE.REBATE.TIER.ENTITY.v1
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
  Layers
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface RebateTierFormData {
  entity_name: string
  entity_code: string
  min_volume: number
  max_volume: number
  rate: number
}

export default function CreateRebateTierPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('basics')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<RebateTierFormData>({
    entity_name: '',
    entity_code: '',
    min_volume: 0,
    max_volume: 0,
    rate: 0
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
      title: 'Rebate Tier Details',
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
        entity_type: 'REBATE_TIER',
        entity_name: formData.entity_name,
        entity_code: formData.entity_code,
        smart_code: 'HERA.PURCHASE.REBATE.TIER.ENTITY.v1',
        organization_id: organization!.id
      }

      // Prepare dynamic fields
      const dynamicFields = [
        {
          field_name: 'min_volume',
          field_type: 'number',
          field_value_number: formData.min_volume,
          smart_code: 'HERA.PURCHASE.REBATE.TIER.FIELD.MIN_VOLUME.v1'
        },
        {
          field_name: 'max_volume',
          field_type: 'number',
          field_value_number: formData.max_volume,
          smart_code: 'HERA.PURCHASE.REBATE.TIER.FIELD.MAX_VOLUME.v1'
        },
        {
          field_name: 'rate',
          field_type: 'number',
          field_value_number: formData.rate,
          smart_code: 'HERA.PURCHASE.REBATE.TIER.FIELD.RATE.v1'
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
      window.location.href = `/rebate_tier`
      
    } catch (error) {
      console.error('Failed to create rebate_tier:', error)
      alert('Failed to create rebate_tier. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/rebate_tier`
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
                    Rebate Tier Name *
                  </Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_name: e.target.value
                    }))}
                    placeholder="Enter rebate_tier name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entity_code">
                    Rebate Tier Code *
                  </Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_code: e.target.value.toUpperCase()
                    }))}
                    placeholder="Enter rebate_tier code"
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
              <CardTitle>Rebate Tier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Min Volume
                   *
                </label>
                <Input
                    type="number"
                    value={formData.min_volume || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      min_volume: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter min volume"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Max Volume
                   *
                </label>
                <Input
                    type="number"
                    value={formData.max_volume || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      max_volume: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter max volume"
                    required
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Rate
                   *
                </label>
                <Input
                    type="number"
                    value={formData.rate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rate: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter rate"
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
                <p>Relationship configuration will be available after creating the rebate_tier.</p>
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
      title="Create New Rebate Tier"
      subtitle="Set up a new rebate_tier record with all required information"
      breadcrumb="Enterprise > Rebate Tiers > Create"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      onSaveAndContinue={handleSaveAndContinue}
      isSaving={isSaving}
      saveLabel="Create Rebate Tier"
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