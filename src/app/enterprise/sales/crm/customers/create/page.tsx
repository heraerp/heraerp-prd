'use client'

/**
 * CRM Customer Creation Page
 * Smart Code: HERA.ENTERPRISE.CRM.CUSTOMERS.CREATE.v1
 * 
 * Modern customer creation with AI assistance
 */

import React, { useState } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { EnterpriseCreatePage } from '@/components/enterprise/EnterpriseCreatePage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Star,
  FileText,
  TrendingUp,
  User,
  DollarSign,
  Calendar,
  Lightbulb,
  Zap,
  CheckCircle,
  Shield,
  CreditCard
} from 'lucide-react'

interface CustomerFormData {
  // Basic Information
  customerName: string
  customerType: string
  industry: string
  website: string
  description: string
  
  // Primary Contact
  primaryContactName: string
  primaryContactTitle: string
  primaryContactEmail: string
  primaryContactPhone: string
  
  // Company Information
  employeeCount: string
  annualRevenue: string
  founded: string
  parentCompany: string
  subsidiaries: string[]
  
  // Address Information
  billingAddress: string
  billingCity: string
  billingState: string
  billingPostalCode: string
  billingCountry: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  shippingCountry: string
  sameAsBilling: boolean
  
  // Account Information
  accountOwner: string
  customerStatus: string
  customerSegment: string
  priority: string
  contractValue: string
  paymentTerms: string
  creditLimit: string
  
  // Additional Information
  tags: string[]
  notes: string
  socialMedia: {
    linkedin: string
    twitter: string
    facebook: string
  }
  customFields: Record<string, string>
}

export default function CreateCustomerPage() {
  const [currentSection, setCurrentSection] = useState('basic')
  const [formData, setFormData] = useState<CustomerFormData>({
    customerName: '',
    customerType: 'prospect',
    industry: '',
    website: '',
    description: '',
    primaryContactName: '',
    primaryContactTitle: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    employeeCount: '',
    annualRevenue: '',
    founded: '',
    parentCompany: '',
    subsidiaries: [],
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: '',
    sameAsBilling: true,
    accountOwner: '',
    customerStatus: 'active',
    customerSegment: '',
    priority: 'medium',
    contractValue: '',
    paymentTerms: 'net30',
    creditLimit: '',
    tags: [],
    notes: '',
    socialMedia: {
      linkedin: '',
      twitter: '',
      facebook: ''
    },
    customFields: {}
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sections = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: Building2,
      isRequired: true,
      isComplete: !!(formData.customerName && formData.customerType && formData.industry)
    },
    {
      id: 'contact',
      title: 'Primary Contact',
      icon: User,
      isRequired: true,
      isComplete: !!(formData.primaryContactName && formData.primaryContactEmail)
    },
    {
      id: 'company',
      title: 'Company Details',
      icon: TrendingUp,
      badge: 'AI Powered',
      isComplete: !!(formData.employeeCount || formData.annualRevenue)
    },
    {
      id: 'address',
      title: 'Address Information',
      icon: MapPin,
      isComplete: !!(formData.billingAddress && formData.billingCity)
    },
    {
      id: 'account',
      title: 'Account Settings',
      icon: Shield,
      isComplete: !!(formData.accountOwner && formData.customerSegment)
    },
    {
      id: 'additional',
      title: 'Additional Details',
      icon: FileText,
      isComplete: !!(formData.notes || formData.tags.length > 0)
    }
  ]

  const completionPercentage = Math.round((sections.filter(s => s.isComplete).length / sections.length) * 100)

  const aiInsights = [
    {
      id: '1',
      type: 'suggestion' as const,
      title: 'Company Enrichment',
      content: 'We found additional company information including employee count, revenue, and executive contacts. Would you like to auto-populate these fields?',
      action: {
        label: 'Auto-populate',
        onClick: () => {
          setFormData(prev => ({
            ...prev,
            employeeCount: '500-1000',
            annualRevenue: '$50M-$100M',
            founded: '2010'
          }))
        }
      }
    },
    {
      id: '2',
      type: 'tip' as const,
      title: 'Customer Segmentation',
      content: 'Based on company size and industry, this customer appears to be an Enterprise segment prospect.',
      action: {
        label: 'Apply Segment',
        onClick: () => setFormData(prev => ({ ...prev, customerSegment: 'enterprise' }))
      }
    },
    {
      id: '3',
      type: 'automation' as const,
      title: 'Welcome Workflow',
      content: 'Set up automated welcome sequence and onboarding tasks for new customers.',
      action: {
        label: 'Enable Automation',
        onClick: () => console.log('Enable automation')
      }
    }
  ]

  const aiSuggestions = [
    'Consider setting up regular business reviews for enterprise customers',
    'Add key stakeholders beyond the primary contact for better relationship mapping',
    'Include competitive intelligence and technology stack information',
    'Set up automated credit monitoring and payment tracking alerts'
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validate required fields
      const newErrors: Record<string, string> = {}
      if (!formData.customerName) newErrors.customerName = 'Customer name is required'
      if (!formData.customerType) newErrors.customerType = 'Customer type is required'
      if (!formData.primaryContactName) newErrors.primaryContactName = 'Primary contact name is required'
      if (!formData.primaryContactEmail) newErrors.primaryContactEmail = 'Primary contact email is required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsSaving(false)
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirect to customer list or customer detail
      window.location.href = '/enterprise/sales/crm/customers'
    } catch (error) {
      console.error('Error saving customer:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.history.back()
  }

  const updateFormData = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'basic':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName" className="text-sm font-medium">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => updateFormData('customerName', e.target.value)}
                    placeholder="Enter customer name"
                    className={errors.customerName ? 'border-red-500' : ''}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-red-600 mt-1">{errors.customerName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerType" className="text-sm font-medium">
                      Customer Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.customerType} onValueChange={(value) => updateFormData('customerType', value)}>
                      <SelectTrigger className={errors.customerType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="competitor">Competitor</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.customerType && (
                      <p className="text-sm text-red-600 mt-1">{errors.customerType}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                    <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Financial Services</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="nonproft">Non-profit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Company Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Brief description of the company and what they do..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Primary Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryContactName" className="text-sm font-medium">
                      Contact Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="primaryContactName"
                      value={formData.primaryContactName}
                      onChange={(e) => updateFormData('primaryContactName', e.target.value)}
                      placeholder="Enter contact name"
                      className={errors.primaryContactName ? 'border-red-500' : ''}
                    />
                    {errors.primaryContactName && (
                      <p className="text-sm text-red-600 mt-1">{errors.primaryContactName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="primaryContactTitle" className="text-sm font-medium">Job Title</Label>
                    <Input
                      id="primaryContactTitle"
                      value={formData.primaryContactTitle}
                      onChange={(e) => updateFormData('primaryContactTitle', e.target.value)}
                      placeholder="Enter job title"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="primaryContactEmail" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="primaryContactEmail"
                      type="email"
                      value={formData.primaryContactEmail}
                      onChange={(e) => updateFormData('primaryContactEmail', e.target.value)}
                      placeholder="Enter email address"
                      className={`pl-10 ${errors.primaryContactEmail ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.primaryContactEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.primaryContactEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="primaryContactPhone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="primaryContactPhone"
                      value={formData.primaryContactPhone}
                      onChange={(e) => updateFormData('primaryContactPhone', e.target.value)}
                      placeholder="Enter phone number"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'company':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Company Details
                  <Badge variant="secondary" className="ml-2">AI Powered</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeCount" className="text-sm font-medium">Employee Count</Label>
                    <Select value={formData.employeeCount} onValueChange={(value) => updateFormData('employeeCount', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1001-5000">1001-5000 employees</SelectItem>
                        <SelectItem value="5000+">5000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="annualRevenue" className="text-sm font-medium">Annual Revenue</Label>
                    <Select value={formData.annualRevenue} onValueChange={(value) => updateFormData('annualRevenue', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_1m">Under $1M</SelectItem>
                        <SelectItem value="1m_10m">$1M - $10M</SelectItem>
                        <SelectItem value="10m_50m">$10M - $50M</SelectItem>
                        <SelectItem value="50m_100m">$50M - $100M</SelectItem>
                        <SelectItem value="100m_500m">$100M - $500M</SelectItem>
                        <SelectItem value="500m_1b">$500M - $1B</SelectItem>
                        <SelectItem value="over_1b">Over $1B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="founded" className="text-sm font-medium">Founded Year</Label>
                    <Input
                      id="founded"
                      value={formData.founded}
                      onChange={(e) => updateFormData('founded', e.target.value)}
                      placeholder="e.g., 2010"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentCompany" className="text-sm font-medium">Parent Company</Label>
                    <Input
                      id="parentCompany"
                      value={formData.parentCompany}
                      onChange={(e) => updateFormData('parentCompany', e.target.value)}
                      placeholder="Enter parent company"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'address':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="billingAddress" className="text-sm font-medium">Street Address</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => updateFormData('billingAddress', e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingCity" className="text-sm font-medium">City</Label>
                    <Input
                      id="billingCity"
                      value={formData.billingCity}
                      onChange={(e) => updateFormData('billingCity', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingState" className="text-sm font-medium">State/Province</Label>
                    <Input
                      id="billingState"
                      value={formData.billingState}
                      onChange={(e) => updateFormData('billingState', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingPostalCode" className="text-sm font-medium">Postal Code</Label>
                    <Input
                      id="billingPostalCode"
                      value={formData.billingPostalCode}
                      onChange={(e) => updateFormData('billingPostalCode', e.target.value)}
                      placeholder="Enter postal code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCountry" className="text-sm font-medium">Country</Label>
                    <Select value={formData.billingCountry} onValueChange={(value) => updateFormData('billingCountry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sameAsBilling"
                    checked={formData.sameAsBilling}
                    onChange={(e) => updateFormData('sameAsBilling', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sameAsBilling" className="text-sm">
                    Same as billing address
                  </Label>
                </div>

                {!formData.sameAsBilling && (
                  <>
                    <div>
                      <Label htmlFor="shippingAddress" className="text-sm font-medium">Street Address</Label>
                      <Input
                        id="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={(e) => updateFormData('shippingAddress', e.target.value)}
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingCity" className="text-sm font-medium">City</Label>
                        <Input
                          id="shippingCity"
                          value={formData.shippingCity}
                          onChange={(e) => updateFormData('shippingCity', e.target.value)}
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingState" className="text-sm font-medium">State/Province</Label>
                        <Input
                          id="shippingState"
                          value={formData.shippingState}
                          onChange={(e) => updateFormData('shippingState', e.target.value)}
                          placeholder="Enter state"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingPostalCode" className="text-sm font-medium">Postal Code</Label>
                        <Input
                          id="shippingPostalCode"
                          value={formData.shippingPostalCode}
                          onChange={(e) => updateFormData('shippingPostalCode', e.target.value)}
                          placeholder="Enter postal code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingCountry" className="text-sm font-medium">Country</Label>
                        <Select value={formData.shippingCountry} onValueChange={(value) => updateFormData('shippingCountry', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="ca">Canada</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="de">Germany</SelectItem>
                            <SelectItem value="fr">France</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'account':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountOwner" className="text-sm font-medium">Account Owner</Label>
                    <Select value={formData.accountOwner} onValueChange={(value) => updateFormData('accountOwner', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="john_doe">John Doe - Account Manager</SelectItem>
                        <SelectItem value="jane_smith">Jane Smith - Senior Account Manager</SelectItem>
                        <SelectItem value="mike_johnson">Mike Johnson - Regional Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="customerStatus" className="text-sm font-medium">Customer Status</Label>
                    <Select value={formData.customerStatus} onValueChange={(value) => updateFormData('customerStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="former">Former Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerSegment" className="text-sm font-medium">Customer Segment</Label>
                    <Select value={formData.customerSegment} onValueChange={(value) => updateFormData('customerSegment', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select segment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="mid_market">Mid-Market</SelectItem>
                        <SelectItem value="smb">Small Business</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium">Priority Level</Label>
                    <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contractValue" className="text-sm font-medium">Contract Value</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="contractValue"
                        type="number"
                        value={formData.contractValue}
                        onChange={(e) => updateFormData('contractValue', e.target.value)}
                        placeholder="Enter contract value"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="creditLimit" className="text-sm font-medium">Credit Limit</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="creditLimit"
                        type="number"
                        value={formData.creditLimit}
                        onChange={(e) => updateFormData('creditLimit', e.target.value)}
                        placeholder="Enter credit limit"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentTerms" className="text-sm font-medium">Payment Terms</Label>
                  <Select value={formData.paymentTerms} onValueChange={(value) => updateFormData('paymentTerms', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net45">Net 45</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'additional':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    placeholder="Add any additional notes about this customer..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Strategic Account', 'High Value', 'Key Customer', 'Growth Potential', 'Partner'].map((tag) => (
                      <Badge
                        key={tag}
                        variant={formData.tags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newTags = formData.tags.includes(tag)
                            ? formData.tags.filter(t => t !== tag)
                            : [...formData.tags, tag]
                          updateFormData('tags', newTags)
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Social Media</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      placeholder="LinkedIn URL"
                      value={formData.socialMedia.linkedin}
                      onChange={(e) => updateFormData('socialMedia', { ...formData.socialMedia, linkedin: e.target.value })}
                    />
                    <Input
                      placeholder="Twitter URL"
                      value={formData.socialMedia.twitter}
                      onChange={(e) => updateFormData('socialMedia', { ...formData.socialMedia, twitter: e.target.value })}
                    />
                    <Input
                      placeholder="Facebook URL"
                      value={formData.socialMedia.facebook}
                      onChange={(e) => updateFormData('socialMedia', { ...formData.socialMedia, facebook: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.customers"]}>
      <EnterpriseCreatePage
        title="Create New Customer"
        subtitle="Add a new customer record to your CRM"
        breadcrumb="Sales & Distribution → CRM → Customers → Create"
        sections={sections}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
        saveLabel="Create Customer"
        aiInsights={aiInsights}
        aiSuggestions={aiSuggestions}
        completionPercentage={completionPercentage}
        estimatedTime="10-15 minutes"
        hasErrors={Object.keys(errors).length > 0}
        errorCount={Object.keys(errors).length}
      >
        {renderCurrentSection()}
      </EnterpriseCreatePage>
    </ProtectedPage>
  )
}