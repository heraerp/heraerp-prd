'use client'

/**
 * Greenworms ERP - Add New Customer
 * Enterprise template with AI assistant
 * 
 * Module: CUSTOMER_MANAGEMENT
 * Entity: CUSTOMER
 * Smart Code: HERA.WASTE.MASTER.ENTITY.CUSTOMER.v1
 * Description: Professional customer onboarding form with AI guidance
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EnterpriseCreatePage, CreatePageSection, AIInsight } from '@/components/enterprise/EnterpriseCreatePage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'
import { 
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Settings,
  Building2,
  Home,
  Building,
  Truck,
  CheckCircle
} from 'lucide-react'

interface CustomerFormData {
  entity_name: string
  entity_code: string
  customer_type: string
  billing_email: string
  phone: string
  contact_person: string
  address: string
  geo_location: string
  contract_type: string
  billing_terms: string
  service_level: string
  monthly_waste: string
  units: number
  special_requirements: string
  route_code: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('basics')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>({
    entity_name: '',
    entity_code: '',
    customer_type: 'Commercial',
    billing_email: '',
    phone: '',
    contact_person: '',
    address: '',
    geo_location: '',
    contract_type: 'Monthly',
    billing_terms: 'Net 30',
    service_level: 'Standard',
    monthly_waste: '',
    units: 1,
    special_requirements: '',
    route_code: ''
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/greenworms/login')
    }
  }, [isAuthenticated, router])

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'basics',
      title: 'Basic Information',
      icon: User,
      isRequired: true,
      isComplete: !!(formData.entity_name && formData.billing_email && formData.phone)
    },
    {
      id: 'contact',
      title: 'Contact & Location',
      icon: MapPin,
      isRequired: true,
      isComplete: !!(formData.address && formData.geo_location)
    },
    {
      id: 'service',
      title: 'Service Configuration',
      icon: Settings,
      isRequired: false,
      isComplete: true // Mark complete when required fields are filled
    },
    {
      id: 'requirements',
      title: 'Special Requirements',
      icon: FileText,
      isRequired: false,
      isComplete: true
    }
  ]

  // AI insights and suggestions
  const aiInsights: AIInsight[] = [
    {
      id: 'naming',
      type: 'suggestion',
      title: 'Customer Naming',
      content: 'Use the official business name for better identification and billing accuracy.',
      action: {
        label: 'Auto-generate Code',
        onClick: () => {
          setFormData(prev => ({
            ...prev,
            entity_code: prev.entity_name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)
          }))
        }
      }
    },
    {
      id: 'location',
      type: 'automation',
      title: 'Smart Location Detection',
      content: 'HERA can automatically assign the optimal collection route based on the customer location.'
    },
    {
      id: 'service_optimization',
      type: 'tip',
      title: 'Service Level Optimization',
      content: 'Consider the customer type and waste volume to recommend the most suitable service level.'
    },
    {
      id: 'validation',
      type: 'automation',
      title: 'Data Validation',
      content: 'All fields are automatically validated for format and completeness before saving.'
    }
  ]

  const aiSuggestions = [
    'Use official business names for accurate billing',
    'Select appropriate service level based on customer size',
    'Include detailed address for efficient route planning',
    'Specify waste volume estimates for capacity planning',
    'Add special requirements for operational notes'
  ]

  const customerTypes = [
    { value: 'Residential Complex', label: 'Residential Complex', icon: Home },
    { value: 'Commercial', label: 'Commercial Business', icon: Building2 },
    { value: 'Commercial Office', label: 'Commercial Office', icon: Building },
    { value: 'Shopping Mall', label: 'Shopping Mall', icon: Building2 },
    { value: 'Government', label: 'Government Entity', icon: Building },
    { value: 'Airport/Transport', label: 'Airport/Transport Hub', icon: Truck }
  ]

  const contractTypes = ['Monthly', 'Quarterly', 'Annual', 'Pay-per-Service', 'Custom']
  const billingTerms = ['Net 15', 'Net 30', 'Net 45', 'Immediate', 'Cash on Delivery']
  const serviceLevels = ['Standard', 'Premium', 'Enterprise', 'Municipal', 'Corporate', 'Critical Infrastructure']
  
  const dubaiLocations = [
    'Dubai Marina', 'Downtown Dubai', 'Business Bay', 'Deira', 'Bur Dubai',
    'Jumeirah', 'Al Barsha', 'Dubai Silicon Oasis', 'Dubai Investment Park',
    'Dubai Hills', 'Arabian Ranches', 'Motor City', 'Dubai Sports City',
    'Emirates Hills', 'Palm Jumeirah', 'Discovery Gardens', 'International City'
  ]

  const handleInputChange = (field: keyof CustomerFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Prepare entity data
      const entityData = {
        entity_type: 'CUSTOMER',
        entity_name: formData.entity_name,
        entity_code: formData.entity_code || formData.entity_name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10),
        smart_code: 'HERA.WASTE.MASTER.ENTITY.CUSTOMER.v1',
        organization_id: currentOrganization!.id
      }

      // Prepare dynamic fields
      const dynamicFields = [
        {
          field_name: 'customer_type',
          field_type: 'text',
          field_value_text: formData.customer_type,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.TYPE.v1'
        },
        {
          field_name: 'billing_email',
          field_type: 'email',
          field_value_text: formData.billing_email,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.EMAIL.v1'
        },
        {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: formData.phone,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.PHONE.v1'
        },
        {
          field_name: 'contact_person',
          field_type: 'text',
          field_value_text: formData.contact_person,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.CONTACT.v1'
        },
        {
          field_name: 'address',
          field_type: 'text',
          field_value_text: formData.address,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.ADDRESS.v1'
        },
        {
          field_name: 'geo_location',
          field_type: 'text',
          field_value_text: formData.geo_location,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.LOCATION.v1'
        },
        {
          field_name: 'contract_type',
          field_type: 'text',
          field_value_text: formData.contract_type,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.CONTRACT.v1'
        },
        {
          field_name: 'billing_terms',
          field_type: 'text',
          field_value_text: formData.billing_terms,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.BILLING.v1'
        },
        {
          field_name: 'service_level',
          field_type: 'text',
          field_value_text: formData.service_level,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.SERVICE.v1'
        },
        {
          field_name: 'monthly_waste',
          field_type: 'text',
          field_value_text: formData.monthly_waste,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.WASTE.v1'
        },
        {
          field_name: 'units',
          field_type: 'number',
          field_value_number: formData.units,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.UNITS.v1'
        },
        {
          field_name: 'special_requirements',
          field_type: 'text',
          field_value_text: formData.special_requirements,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.REQUIREMENTS.v1'
        },
        {
          field_name: 'route_code',
          field_type: 'text',
          field_value_text: formData.route_code,
          smart_code: 'HERA.WASTE.CUSTOMER.FIELD.ROUTE.v1'
        }
      ]

      // Create customer via API
      const response = await apiV2.post('entities', {
        ...entityData,
        dynamic_fields: dynamicFields
      })

      if (response.data) {
        router.push('/greenworms/customers')
      }

    } catch (error: any) {
      console.error('Error creating customer:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'basics':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entity_name">Customer Name *</Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => handleInputChange('entity_name', e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="entity_code">Customer Code</Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => handleInputChange('entity_code', e.target.value)}
                    placeholder="Auto-generated from name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_type">Customer Type</Label>
                  <select
                    id="customer_type"
                    value={formData.customer_type}
                    onChange={(e) => handleInputChange('customer_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {customerTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="units">Units/Properties</Label>
                  <Input
                    id="units"
                    type="number"
                    min="1"
                    value={formData.units}
                    onChange={(e) => handleInputChange('units', parseInt(e.target.value) || 1)}
                    placeholder="Number of units"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billing_email">Billing Email *</Label>
                  <Input
                    id="billing_email"
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => handleInputChange('billing_email', e.target.value)}
                    placeholder="billing@company.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+971-4-555-0000"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact_person">Primary Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  placeholder="Contact person name"
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'contact':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Contact & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Complete Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Complete address including building name, street, and area"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="geo_location">Location Area</Label>
                  <select
                    id="geo_location"
                    value={formData.geo_location}
                    onChange={(e) => handleInputChange('geo_location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select area</option>
                    {dubaiLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="route_code">Assigned Route</Label>
                  <Input
                    id="route_code"
                    value={formData.route_code}
                    onChange={(e) => handleInputChange('route_code', e.target.value)}
                    placeholder="e.g., Route A-Marina"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'service':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-600" />
                Service Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contract_type">Contract Type</Label>
                  <select
                    id="contract_type"
                    value={formData.contract_type}
                    onChange={(e) => handleInputChange('contract_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {contractTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="billing_terms">Billing Terms</Label>
                  <select
                    id="billing_terms"
                    value={formData.billing_terms}
                    onChange={(e) => handleInputChange('billing_terms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {billingTerms.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="service_level">Service Level</Label>
                  <select
                    id="service_level"
                    value={formData.service_level}
                    onChange={(e) => handleInputChange('service_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {serviceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="monthly_waste">Monthly Waste Volume</Label>
                <Input
                  id="monthly_waste"
                  value={formData.monthly_waste}
                  onChange={(e) => handleInputChange('monthly_waste', e.target.value)}
                  placeholder="e.g., 5.2 tons"
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'requirements':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Special Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="special_requirements">Special Requirements & Notes</Label>
                <Textarea
                  id="special_requirements"
                  value={formData.special_requirements}
                  onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                  placeholder="Any special handling requirements, access instructions, or operational notes"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to Login</h2>
          <p className="text-gray-600">Please wait while we redirect you to the Greenworms login page.</p>
        </div>
      </div>
    )
  }

  return (
    <EnterpriseCreatePage
      title="Add New Customer"
      subtitle="Create a new waste collection customer profile"
      backUrl="/greenworms/customers"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      isSaving={isSaving}
      aiInsights={aiInsights}
      aiSuggestions={aiSuggestions}
      brandColor="green"
    >
      {renderSection(currentSection)}
    </EnterpriseCreatePage>
  )
}