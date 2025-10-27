'use client'

/**
 * CRM Lead Creation Page
 * Smart Code: HERA.ENTERPRISE.CRM.LEADS.CREATE.v1
 * 
 * Modern lead creation with AI assistance
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
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Tags,
  FileText,
  TrendingUp,
  Target,
  Users,
  Clock,
  Lightbulb,
  Zap,
  CheckCircle
} from 'lucide-react'

interface LeadFormData {
  // Basic Information
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  jobTitle: string
  
  // Lead Details
  leadSource: string
  leadStatus: string
  leadScore: number
  industry: string
  
  // Contact Information
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  
  // Additional Information
  website: string
  linkedinProfile: string
  notes: string
  tags: string[]
  
  // Qualification
  budget: string
  timeline: string
  decisionMaker: boolean
  painPoints: string
  interests: string[]
}

export default function CreateLeadPage() {
  const [currentSection, setCurrentSection] = useState('basic')
  const [formData, setFormData] = useState<LeadFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    leadSource: '',
    leadStatus: 'new',
    leadScore: 50,
    industry: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    website: '',
    linkedinProfile: '',
    notes: '',
    tags: [],
    budget: '',
    timeline: '',
    decisionMaker: false,
    painPoints: '',
    interests: []
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sections = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: User,
      isRequired: true,
      isComplete: !!(formData.firstName && formData.lastName && formData.email)
    },
    {
      id: 'company',
      title: 'Company Details',
      icon: Building2,
      isRequired: true,
      isComplete: !!(formData.company && formData.industry)
    },
    {
      id: 'contact',
      title: 'Contact Information',
      icon: MapPin,
      isComplete: !!(formData.address && formData.city)
    },
    {
      id: 'qualification',
      title: 'Lead Qualification',
      icon: Star,
      badge: 'AI Powered',
      isComplete: !!(formData.budget && formData.timeline)
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
      title: 'Company Enrichment Available',
      content: 'We found additional information about this company. Would you like to auto-fill some fields?',
      action: {
        label: 'Auto-fill',
        onClick: () => {
          // Auto-fill company data
          setFormData(prev => ({
            ...prev,
            industry: 'Technology',
            website: 'https://example.com',
            address: '123 Tech Street'
          }))
        }
      }
    },
    {
      id: '2',
      type: 'tip' as const,
      title: 'Lead Scoring Insight',
      content: 'Based on the company size and industry, this lead has high potential. Consider increasing the lead score.',
      action: {
        label: 'Set High Score',
        onClick: () => setFormData(prev => ({ ...prev, leadScore: 85 }))
      }
    },
    {
      id: '3',
      type: 'automation' as const,
      title: 'Follow-up Automation',
      content: 'We can automatically schedule follow-up tasks and email sequences for this lead type.',
      action: {
        label: 'Enable Automation',
        onClick: () => console.log('Enable automation')
      }
    }
  ]

  const aiSuggestions = [
    'Include specific pain points to improve lead qualification accuracy',
    'Add LinkedIn profile URL for better social selling opportunities',
    'Consider adding tags for better lead segmentation and reporting',
    'Upload company logo to improve visual identification in lead lists'
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validate required fields
      const newErrors: Record<string, string> = {}
      if (!formData.firstName) newErrors.firstName = 'First name is required'
      if (!formData.lastName) newErrors.lastName = 'Last name is required'
      if (!formData.email) newErrors.email = 'Email is required'
      if (!formData.company) newErrors.company = 'Company is required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsSaving(false)
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirect to lead list or lead detail
      window.location.href = '/enterprise/sales/crm/leads'
    } catch (error) {
      console.error('Error saving lead:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.history.back()
  }

  const updateFormData = (field: keyof LeadFormData, value: any) => {
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
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="Enter first name"
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      placeholder="Enter last name"
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="Enter email address"
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="jobTitle" className="text-sm font-medium">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => updateFormData('jobTitle', e.target.value)}
                    placeholder="Enter job title"
                  />
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
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company" className="text-sm font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => updateFormData('company', e.target.value)}
                    placeholder="Enter company name"
                    className={errors.company ? 'border-red-500' : ''}
                  />
                  {errors.company && (
                    <p className="text-sm text-red-600 mt-1">{errors.company}</p>
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
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="website" className="text-sm font-medium">Company Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leadSource" className="text-sm font-medium">Lead Source</Label>
                    <Select value={formData.leadSource} onValueChange={(value) => updateFormData('leadSource', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="email_campaign">Email Campaign</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="trade_show">Trade Show</SelectItem>
                        <SelectItem value="cold_call">Cold Call</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="leadStatus" className="text-sm font-medium">Lead Status</Label>
                    <Select value={formData.leadStatus} onValueChange={(value) => updateFormData('leadStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="disqualified">Disqualified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <MapPin className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value)}
                      placeholder="Enter postal code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
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

                <div>
                  <Label htmlFor="linkedinProfile" className="text-sm font-medium">LinkedIn Profile</Label>
                  <Input
                    id="linkedinProfile"
                    value={formData.linkedinProfile}
                    onChange={(e) => updateFormData('linkedinProfile', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'qualification':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Lead Qualification
                  <Badge variant="secondary" className="ml-2">AI Powered</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Lead Score: {formData.leadScore}/100
                  </Label>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${formData.leadScore}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    AI-generated score based on company profile and behavior
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget" className="text-sm font-medium">Budget Range</Label>
                    <Select value={formData.budget} onValueChange={(value) => updateFormData('budget', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_10k">Under $10K</SelectItem>
                        <SelectItem value="10k_50k">$10K - $50K</SelectItem>
                        <SelectItem value="50k_100k">$50K - $100K</SelectItem>
                        <SelectItem value="100k_500k">$100K - $500K</SelectItem>
                        <SelectItem value="over_500k">Over $500K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timeline" className="text-sm font-medium">Purchase Timeline</Label>
                    <Select value={formData.timeline} onValueChange={(value) => updateFormData('timeline', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (< 1 month)</SelectItem>
                        <SelectItem value="short">Short term (1-3 months)</SelectItem>
                        <SelectItem value="medium">Medium term (3-6 months)</SelectItem>
                        <SelectItem value="long">Long term (6+ months)</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="painPoints" className="text-sm font-medium">Pain Points & Challenges</Label>
                  <Textarea
                    id="painPoints"
                    value={formData.painPoints}
                    onChange={(e) => updateFormData('painPoints', e.target.value)}
                    placeholder="Describe the main challenges they're facing..."
                    rows={3}
                  />
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
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    placeholder="Add any additional notes about this lead..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Hot Lead', 'Enterprise', 'Technical Decision Maker', 'Budget Approved'].map((tag) => (
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
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.leads"]}>
      <EnterpriseCreatePage
        title="Create New Lead"
        subtitle="Add a new sales lead to your CRM pipeline"
        breadcrumb="Sales & Distribution → CRM → Leads → Create"
        sections={sections}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
        saveLabel="Create Lead"
        aiInsights={aiInsights}
        aiSuggestions={aiSuggestions}
        completionPercentage={completionPercentage}
        estimatedTime="5-8 minutes"
        hasErrors={Object.keys(errors).length > 0}
        errorCount={Object.keys(errors).length}
      >
        {renderCurrentSection()}
      </EnterpriseCreatePage>
    </ProtectedPage>
  )
}