'use client'

/**
 * CRM Opportunity Creation Page
 * Smart Code: HERA.ENTERPRISE.CRM.OPPORTUNITIES.CREATE.v1
 * 
 * Modern opportunity creation with AI assistance
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
  Target, 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  MapPin, 
  Star,
  FileText,
  TrendingUp,
  Users,
  Clock,
  Lightbulb,
  Zap,
  CheckCircle,
  Percent,
  BarChart3
} from 'lucide-react'

interface OpportunityFormData {
  // Basic Information
  opportunityName: string
  accountName: string
  contactName: string
  email: string
  phone: string
  
  // Opportunity Details
  stage: string
  type: string
  leadSource: string
  probability: number
  expectedCloseDate: string
  
  // Financial Information
  amount: string
  currency: string
  budgetConfirmed: boolean
  decisionProcess: string
  
  // Product Information
  products: string[]
  solution: string
  competitors: string[]
  
  // Additional Information
  description: string
  nextSteps: string
  notes: string
  tags: string[]
  
  // Team & Ownership
  owner: string
  team: string[]
  stakeholders: string[]
}

export default function CreateOpportunityPage() {
  const [currentSection, setCurrentSection] = useState('basic')
  const [formData, setFormData] = useState<OpportunityFormData>({
    opportunityName: '',
    accountName: '',
    contactName: '',
    email: '',
    phone: '',
    stage: 'qualification',
    type: 'new_business',
    leadSource: '',
    probability: 25,
    expectedCloseDate: '',
    amount: '',
    currency: 'USD',
    budgetConfirmed: false,
    decisionProcess: '',
    products: [],
    solution: '',
    competitors: [],
    description: '',
    nextSteps: '',
    notes: '',
    tags: [],
    owner: '',
    team: [],
    stakeholders: []
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sections = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: Target,
      isRequired: true,
      isComplete: !!(formData.opportunityName && formData.accountName && formData.contactName)
    },
    {
      id: 'details',
      title: 'Opportunity Details',
      icon: BarChart3,
      isRequired: true,
      isComplete: !!(formData.stage && formData.type && formData.expectedCloseDate)
    },
    {
      id: 'financial',
      title: 'Financial Information',
      icon: DollarSign,
      badge: 'AI Powered',
      isComplete: !!(formData.amount && formData.currency)
    },
    {
      id: 'product',
      title: 'Product & Solution',
      icon: Building2,
      isComplete: !!(formData.solution || formData.products.length > 0)
    },
    {
      id: 'team',
      title: 'Team & Ownership',
      icon: Users,
      isComplete: !!(formData.owner)
    },
    {
      id: 'additional',
      title: 'Additional Details',
      icon: FileText,
      isComplete: !!(formData.description || formData.notes)
    }
  ]

  const completionPercentage = Math.round((sections.filter(s => s.isComplete).length / sections.length) * 100)

  const aiInsights = [
    {
      id: '1',
      type: 'suggestion' as const,
      title: 'Account Intelligence Available',
      content: 'We found recent news and financial data about this account. Would you like to see relevant insights?',
      action: {
        label: 'View Insights',
        onClick: () => {
          // Show account intelligence
          console.log('Show account insights')
        }
      }
    },
    {
      id: '2',
      type: 'tip' as const,
      title: 'Optimal Close Date',
      content: 'Based on similar opportunities, consider setting the close date to end of quarter for better conversion rates.',
      action: {
        label: 'Use Suggestion',
        onClick: () => {
          const endOfQuarter = new Date()
          endOfQuarter.setMonth(endOfQuarter.getMonth() + (3 - endOfQuarter.getMonth() % 3))
          endOfQuarter.setDate(0)
          setFormData(prev => ({ ...prev, expectedCloseDate: endOfQuarter.toISOString().split('T')[0] }))
        }
      }
    },
    {
      id: '3',
      type: 'automation' as const,
      title: 'Opportunity Workflow',
      content: 'Set up automated follow-up sequences and task reminders based on opportunity stage.',
      action: {
        label: 'Configure Automation',
        onClick: () => console.log('Configure automation')
      }
    }
  ]

  const aiSuggestions = [
    'Consider adding key stakeholders from the buying committee',
    'Include competitive positioning notes for better deal strategy',
    'Set up discovery call to validate budget and timeline',
    'Upload proposal documents and product demos to opportunity record'
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validate required fields
      const newErrors: Record<string, string> = {}
      if (!formData.opportunityName) newErrors.opportunityName = 'Opportunity name is required'
      if (!formData.accountName) newErrors.accountName = 'Account name is required'
      if (!formData.contactName) newErrors.contactName = 'Contact name is required'
      if (!formData.stage) newErrors.stage = 'Opportunity stage is required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsSaving(false)
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirect to opportunity list or opportunity detail
      window.location.href = '/enterprise/sales/crm/opportunities'
    } catch (error) {
      console.error('Error saving opportunity:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.history.back()
  }

  const updateFormData = (field: keyof OpportunityFormData, value: any) => {
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
                  <Target className="w-5 h-5" />
                  Opportunity Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="opportunityName" className="text-sm font-medium">
                    Opportunity Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="opportunityName"
                    value={formData.opportunityName}
                    onChange={(e) => updateFormData('opportunityName', e.target.value)}
                    placeholder="Enter opportunity name"
                    className={errors.opportunityName ? 'border-red-500' : ''}
                  />
                  {errors.opportunityName && (
                    <p className="text-sm text-red-600 mt-1">{errors.opportunityName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountName" className="text-sm font-medium">
                      Account Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="accountName"
                      value={formData.accountName}
                      onChange={(e) => updateFormData('accountName', e.target.value)}
                      placeholder="Enter account name"
                      className={errors.accountName ? 'border-red-500' : ''}
                    />
                    {errors.accountName && (
                      <p className="text-sm text-red-600 mt-1">{errors.accountName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contactName" className="text-sm font-medium">
                      Primary Contact <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => updateFormData('contactName', e.target.value)}
                      placeholder="Enter contact name"
                      className={errors.contactName ? 'border-red-500' : ''}
                    />
                    {errors.contactName && (
                      <p className="text-sm text-red-600 mt-1">{errors.contactName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'details':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Opportunity Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stage" className="text-sm font-medium">
                      Opportunity Stage <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.stage} onValueChange={(value) => updateFormData('stage', value)}>
                      <SelectTrigger className={errors.stage ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qualification">Qualification</SelectItem>
                        <SelectItem value="needs_analysis">Needs Analysis</SelectItem>
                        <SelectItem value="proposal">Proposal/Quote</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.stage && (
                      <p className="text-sm text-red-600 mt-1">{errors.stage}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">Opportunity Type</Label>
                    <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_business">New Business</SelectItem>
                        <SelectItem value="existing_customer">Existing Customer</SelectItem>
                        <SelectItem value="upsell">Upsell</SelectItem>
                        <SelectItem value="cross_sell">Cross-sell</SelectItem>
                        <SelectItem value="renewal">Renewal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                        <SelectItem value="cold_call">Cold Call</SelectItem>
                        <SelectItem value="trade_show">Trade Show</SelectItem>
                        <SelectItem value="email_campaign">Email Campaign</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expectedCloseDate" className="text-sm font-medium">
                      Expected Close Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={formData.expectedCloseDate}
                      onChange={(e) => updateFormData('expectedCloseDate', e.target.value)}
                      className={errors.expectedCloseDate ? 'border-red-500' : ''}
                    />
                    {errors.expectedCloseDate && (
                      <p className="text-sm text-red-600 mt-1">{errors.expectedCloseDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Probability: {formData.probability}%
                  </Label>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.probability}
                      onChange={(e) => updateFormData('probability', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'financial':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Information
                  <Badge variant="secondary" className="ml-2">AI Powered</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium">Deal Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => updateFormData('amount', e.target.value)}
                      placeholder="Enter deal amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => updateFormData('currency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="decisionProcess" className="text-sm font-medium">Decision Process</Label>
                  <Textarea
                    id="decisionProcess"
                    value={formData.decisionProcess}
                    onChange={(e) => updateFormData('decisionProcess', e.target.value)}
                    placeholder="Describe the decision-making process..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="budgetConfirmed"
                    checked={formData.budgetConfirmed}
                    onChange={(e) => updateFormData('budgetConfirmed', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="budgetConfirmed" className="text-sm">
                    Budget confirmed by customer
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'product':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Product & Solution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="solution" className="text-sm font-medium">Solution Description</Label>
                  <Textarea
                    id="solution"
                    value={formData.solution}
                    onChange={(e) => updateFormData('solution', e.target.value)}
                    placeholder="Describe the proposed solution..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Products/Services</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Enterprise Software', 'Professional Services', 'Training', 'Support', 'Integration'].map((product) => (
                      <Badge
                        key={product}
                        variant={formData.products.includes(product) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newProducts = formData.products.includes(product)
                            ? formData.products.filter(p => p !== product)
                            : [...formData.products, product]
                          updateFormData('products', newProducts)
                        }}
                      >
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Competitors</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Competitor A', 'Competitor B', 'Competitor C', 'In-house Solution', 'Status Quo'].map((competitor) => (
                      <Badge
                        key={competitor}
                        variant={formData.competitors.includes(competitor) ? 'destructive' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newCompetitors = formData.competitors.includes(competitor)
                            ? formData.competitors.filter(c => c !== competitor)
                            : [...formData.competitors, competitor]
                          updateFormData('competitors', newCompetitors)
                        }}
                      >
                        {competitor}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'team':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team & Ownership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="owner" className="text-sm font-medium">Opportunity Owner</Label>
                  <Select value={formData.owner} onValueChange={(value) => updateFormData('owner', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john_doe">John Doe - Sales Rep</SelectItem>
                      <SelectItem value="jane_smith">Jane Smith - Senior Sales Rep</SelectItem>
                      <SelectItem value="mike_johnson">Mike Johnson - Sales Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Sales Team Members</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'].map((member) => (
                      <Badge
                        key={member}
                        variant={formData.team.includes(member) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newTeam = formData.team.includes(member)
                            ? formData.team.filter(t => t !== member)
                            : [...formData.team, member]
                          updateFormData('team', newTeam)
                        }}
                      >
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Key Stakeholders</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['CEO', 'CTO', 'CFO', 'IT Director', 'Procurement', 'End Users'].map((stakeholder) => (
                      <Badge
                        key={stakeholder}
                        variant={formData.stakeholders.includes(stakeholder) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newStakeholders = formData.stakeholders.includes(stakeholder)
                            ? formData.stakeholders.filter(s => s !== stakeholder)
                            : [...formData.stakeholders, stakeholder]
                          updateFormData('stakeholders', newStakeholders)
                        }}
                      >
                        {stakeholder}
                      </Badge>
                    ))}
                  </div>
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
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Detailed opportunity description..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="nextSteps" className="text-sm font-medium">Next Steps</Label>
                  <Textarea
                    id="nextSteps"
                    value={formData.nextSteps}
                    onChange={(e) => updateFormData('nextSteps', e.target.value)}
                    placeholder="What are the next steps to move this opportunity forward?"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    placeholder="Additional notes and observations..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Hot Opportunity', 'Enterprise Deal', 'Strategic Account', 'Quick Win', 'Complex Sale'].map((tag) => (
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
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.opportunities"]}>
      <EnterpriseCreatePage
        title="Create New Opportunity"
        subtitle="Add a new sales opportunity to your CRM pipeline"
        breadcrumb="Sales & Distribution → CRM → Opportunities → Create"
        sections={sections}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
        saveLabel="Create Opportunity"
        aiInsights={aiInsights}
        aiSuggestions={aiSuggestions}
        completionPercentage={completionPercentage}
        estimatedTime="8-12 minutes"
        hasErrors={Object.keys(errors).length > 0}
        errorCount={Object.keys(errors).length}
      >
        {renderCurrentSection()}
      </EnterpriseCreatePage>
    </ProtectedPage>
  )
}