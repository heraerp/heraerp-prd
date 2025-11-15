'use client'

import React, { useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowRight, 
  ArrowLeft,
  Building2, 
  Users, 
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
  Rocket,
  Store,
  Package,
  CreditCard,
  BarChart3
} from 'lucide-react'

/**
 * HERA Onboarding Getting Started - Welcome flow for new customers
 * 
 * Features:
 * - Multi-step wizard for project creation
 * - Business information collection
 * - Timeline estimation and planning
 * - Mobile-first responsive design
 * - Real-time validation and progress tracking
 */

interface BusinessInfo {
  businessName: string
  industry: string
  businessType: string
  employeeCount: string
  branchCount: string
  currentSoftware: string
  projectDescription: string
  targetGoLiveDate: string
  estimatedBudget: string
  primaryContact: string
  contactEmail: string
  contactPhone: string
}

interface MicroAppSelection {
  salon_core: boolean
  pos: boolean
  inventory: boolean
  accounting: boolean
  crm: boolean
  analytics: boolean
}

export default function GettingStarted() {
  const [currentStep, setCurrentStep] = useState(1)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    industry: '',
    businessType: '',
    employeeCount: '',
    branchCount: '',
    currentSoftware: '',
    projectDescription: '',
    targetGoLiveDate: '',
    estimatedBudget: '',
    primaryContact: '',
    contactEmail: '',
    contactPhone: ''
  })
  const [microApps, setMicroApps] = useState<MicroAppSelection>({
    salon_core: true,
    pos: false,
    inventory: false,
    accounting: false,
    crm: false,
    analytics: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user, organization } = useHERAAuth()
  
  const totalSteps = 4
  const progressPercentage = (currentStep / totalSteps) * 100

  const industries = [
    { value: 'salon', label: 'Salon & Beauty' },
    { value: 'restaurant', label: 'Restaurant & Food' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'fitness', label: 'Fitness & Wellness' },
    { value: 'professional', label: 'Professional Services' },
    { value: 'other', label: 'Other' }
  ]

  const businessTypes = [
    { value: 'single_location', label: 'Single Location' },
    { value: 'multi_location', label: 'Multiple Locations' },
    { value: 'franchise', label: 'Franchise' },
    { value: 'chain', label: 'Chain/Corporate' }
  ]

  const employeeCounts = [
    { value: '1-5', label: '1-5 employees' },
    { value: '6-15', label: '6-15 employees' },
    { value: '16-50', label: '16-50 employees' },
    { value: '51-100', label: '51-100 employees' },
    { value: '100+', label: '100+ employees' }
  ]

  const handleBusinessInfoChange = (field: keyof BusinessInfo, value: string) => {
    setBusinessInfo(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleMicroAppToggle = (app: keyof MicroAppSelection) => {
    setMicroApps(prev => ({
      ...prev,
      [app]: !prev[app]
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(businessInfo.businessName && businessInfo.industry && businessInfo.businessType)
      case 2:
        return !!(businessInfo.employeeCount && businessInfo.primaryContact && businessInfo.contactEmail)
      case 3:
        return !!(businessInfo.targetGoLiveDate)
      case 4:
        return Object.values(microApps).some(selected => selected)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
      setError(null)
    } else {
      setError('Please fill in all required fields to continue')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const createProject = async () => {
    try {
      setLoading(true)
      setError(null)

      const selectedApps = Object.entries(microApps)
        .filter(([_, selected]) => selected)
        .map(([app, _]) => app.toUpperCase())

      // Simulate auth token retrieval
      const authToken = 'placeholder-token'

      const response = await fetch('/api/v2/onboarding/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Organization-Id': organization.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'create',
          project: {
            project_name: `${businessInfo.businessName} Implementation`,
            project_description: businessInfo.projectDescription || `HERA implementation for ${businessInfo.businessName}`,
            project_type: 'NEW_CUSTOMER',
            target_go_live_date: businessInfo.targetGoLiveDate,
            estimated_days: calculateEstimatedDays(),
            micro_app_bundle_codes: selectedApps,
            primary_contact_email: businessInfo.contactEmail,
            ai_copilot_enabled: true,
            org_code: businessInfo.businessName.replace(/\s+/g, '_').toUpperCase()
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to project page
        window.location.href = `/onboarding/project/${result.project_id}`
      } else {
        setError(result.message || 'Failed to create project')
      }
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateEstimatedDays = (): number => {
    let baseDays = 14 // Base implementation time
    
    // Adjust for business size
    switch (businessInfo.employeeCount) {
      case '1-5': baseDays += 0; break
      case '6-15': baseDays += 3; break
      case '16-50': baseDays += 7; break
      case '51-100': baseDays += 14; break
      case '100+': baseDays += 21; break
    }
    
    // Adjust for number of locations
    const branchCount = parseInt(businessInfo.branchCount) || 1
    if (branchCount > 1) {
      baseDays += Math.min((branchCount - 1) * 2, 14)
    }
    
    // Adjust for selected apps
    const selectedAppCount = Object.values(microApps).filter(Boolean).length
    baseDays += Math.max(0, (selectedAppCount - 1) * 3)
    
    return Math.min(baseDays, 45) // Cap at 45 days
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gold" />
              </div>
              <h2 className="text-2xl font-bold text-champagne mb-2">Tell us about your business</h2>
              <p className="text-bronze">We'll use this information to customize your HERA experience</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName" className="text-champagne">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessInfo.businessName}
                  onChange={(e) => handleBusinessInfoChange('businessName', e.target.value)}
                  placeholder="Enter your business name"
                  className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                />
              </div>

              <div>
                <Label htmlFor="industry" className="text-champagne">Industry *</Label>
                <Select value={businessInfo.industry} onValueChange={(value) => handleBusinessInfoChange('industry', value)}>
                  <SelectTrigger className="mt-1 bg-charcoal/50 border-gold/20 text-champagne">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="businessType" className="text-champagne">Business Type *</Label>
                <Select value={businessInfo.businessType} onValueChange={(value) => handleBusinessInfoChange('businessType', value)}>
                  <SelectTrigger className="mt-1 bg-charcoal/50 border-gold/20 text-champagne">
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="branchCount" className="text-champagne">Number of Locations</Label>
                <Input
                  id="branchCount"
                  type="number"
                  value={businessInfo.branchCount}
                  onChange={(e) => handleBusinessInfoChange('branchCount', e.target.value)}
                  placeholder="1"
                  min="1"
                  className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-champagne mb-2">Team & Contact Information</h2>
              <p className="text-bronze">Help us understand your team size and primary contact</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="employeeCount" className="text-champagne">Number of Employees *</Label>
                <Select value={businessInfo.employeeCount} onValueChange={(value) => handleBusinessInfoChange('employeeCount', value)}>
                  <SelectTrigger className="mt-1 bg-charcoal/50 border-gold/20 text-champagne">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeCounts.map((count) => (
                      <SelectItem key={count.value} value={count.value}>
                        {count.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="primaryContact" className="text-champagne">Primary Contact Name *</Label>
                <Input
                  id="primaryContact"
                  value={businessInfo.primaryContact}
                  onChange={(e) => handleBusinessInfoChange('primaryContact', e.target.value)}
                  placeholder="Contact person for this project"
                  className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                />
              </div>

              <div>
                <Label htmlFor="contactEmail" className="text-champagne">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={businessInfo.contactEmail}
                  onChange={(e) => handleBusinessInfoChange('contactEmail', e.target.value)}
                  placeholder="email@business.com"
                  className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone" className="text-champagne">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={businessInfo.contactPhone}
                  onChange={(e) => handleBusinessInfoChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                />
              </div>

              <div>
                <Label htmlFor="currentSoftware" className="text-champagne">Current Software (if any)</Label>
                <Input
                  id="currentSoftware"
                  value={businessInfo.currentSoftware}
                  onChange={(e) => handleBusinessInfoChange('currentSoftware', e.target.value)}
                  placeholder="QuickBooks, Excel, etc."
                  className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-champagne mb-2">Project Timeline</h2>
              <p className="text-bronze">When would you like to go live with HERA?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="targetGoLiveDate" className="text-champagne">Target Go-Live Date *</Label>
                <Input
                  id="targetGoLiveDate"
                  type="date"
                  value={businessInfo.targetGoLiveDate}
                  onChange={(e) => handleBusinessInfoChange('targetGoLiveDate', e.target.value)}
                  min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                />
              </div>

              <div>
                <Label htmlFor="projectDescription" className="text-champagne">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  value={businessInfo.projectDescription}
                  onChange={(e) => handleBusinessInfoChange('projectDescription', e.target.value)}
                  placeholder="Describe your implementation goals and any special requirements"
                  rows={4}
                  className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                />
              </div>

              <div>
                <Label htmlFor="estimatedBudget" className="text-champagne">Estimated Budget</Label>
                <Select value={businessInfo.estimatedBudget} onValueChange={(value) => handleBusinessInfoChange('estimatedBudget', value)}>
                  <SelectTrigger className="mt-1 bg-charcoal/50 border-gold/20 text-champagne">
                    <SelectValue placeholder="Select budget range (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-5k">Under $5,000</SelectItem>
                    <SelectItem value="5k-15k">$5,000 - $15,000</SelectItem>
                    <SelectItem value="15k-50k">$15,000 - $50,000</SelectItem>
                    <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                    <SelectItem value="over-100k">Over $100,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {businessInfo.targetGoLiveDate && (
                <Card className="bg-gold/10 border-gold/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-sm font-medium text-champagne">
                          Estimated Implementation: {calculateEstimatedDays()} days
                        </p>
                        <p className="text-xs text-bronze">
                          Based on your business size and requirements
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-champagne mb-2">Select Your Applications</h2>
              <p className="text-bronze">Choose the HERA modules you need for your business</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${microApps.salon_core ? 'bg-gold/20 border-gold/50' : 'bg-charcoal/50 border-gold/20'} hover:border-gold/30`}
                onClick={() => handleMicroAppToggle('salon_core')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Store className="w-6 h-6 text-gold" />
                      <div>
                        <h3 className="font-medium text-champagne">Salon Core</h3>
                        <p className="text-xs text-bronze">Appointments, clients, services</p>
                      </div>
                    </div>
                    {microApps.salon_core && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${microApps.pos ? 'bg-gold/20 border-gold/50' : 'bg-charcoal/50 border-gold/20'} hover:border-gold/30`}
                onClick={() => handleMicroAppToggle('pos')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                      <div>
                        <h3 className="font-medium text-champagne">Point of Sale</h3>
                        <p className="text-xs text-bronze">Payments, receipts, transactions</p>
                      </div>
                    </div>
                    {microApps.pos && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${microApps.inventory ? 'bg-gold/20 border-gold/50' : 'bg-charcoal/50 border-gold/20'} hover:border-gold/30`}
                onClick={() => handleMicroAppToggle('inventory')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-green-400" />
                      <div>
                        <h3 className="font-medium text-champagne">Inventory</h3>
                        <p className="text-xs text-bronze">Stock management, products</p>
                      </div>
                    </div>
                    {microApps.inventory && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${microApps.accounting ? 'bg-gold/20 border-gold/50' : 'bg-charcoal/50 border-gold/20'} hover:border-gold/30`}
                onClick={() => handleMicroAppToggle('accounting')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-purple-400" />
                      <div>
                        <h3 className="font-medium text-champagne">Accounting</h3>
                        <p className="text-xs text-bronze">Financial reports, GL</p>
                      </div>
                    </div>
                    {microApps.accounting && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${microApps.crm ? 'bg-gold/20 border-gold/50' : 'bg-charcoal/50 border-gold/20'} hover:border-gold/30`}
                onClick={() => handleMicroAppToggle('crm')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-pink-400" />
                      <div>
                        <h3 className="font-medium text-champagne">CRM</h3>
                        <p className="text-xs text-bronze">Customer relationships</p>
                      </div>
                    </div>
                    {microApps.crm && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${microApps.analytics ? 'bg-gold/20 border-gold/50' : 'bg-charcoal/50 border-gold/20'} hover:border-gold/30`}
                onClick={() => handleMicroAppToggle('analytics')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-orange-400" />
                      <div>
                        <h3 className="font-medium text-champagne">Analytics</h3>
                        <p className="text-xs text-bronze">Reports, insights, dashboards</p>
                      </div>
                    </div>
                    {microApps.analytics && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-champagne">Getting Started</h1>
            <span className="text-sm text-bronze">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-charcoal/50" />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20 mb-8">
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="min-h-[44px] border-gold/30 text-champagne hover:bg-gold/10 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="min-h-[44px] bg-gold text-black hover:bg-gold/90 disabled:opacity-50"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={createProject}
              disabled={!validateStep(currentStep) || loading}
              className="min-h-[44px] bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              Create Project
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}