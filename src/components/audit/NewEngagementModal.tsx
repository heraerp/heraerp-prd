'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Briefcase,
  Building2,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Calendar,
  FileText,
  User,
  Plus,
  Save,
  X
} from 'lucide-react'

interface NewEngagementModalProps {
  children: React.ReactNode
  onEngagementCreated?: (engagement: any) => void
}

export function NewEngagementModal({ children, onEngagementCreated }: NewEngagementModalProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [engagementData, setEngagementData] = useState({
    // Client Information
    client_name: '',
    client_code: '',
    client_type: 'private',
    industry: '',
    annual_revenue: '',
    total_assets: '',
    public_interest_entity: false,
    previous_auditor: '',

    // Engagement Details
    engagement_type: 'statutory',
    audit_year: new Date().getFullYear().toString(),
    year_end_date: '',
    planned_start_date: '',
    target_completion_date: '',
    estimated_hours: '',
    estimated_fees: '',

    // Risk Assessment
    risk_rating: 'moderate',
    risk_factors: '',
    materiality_planning: '',
    materiality_performance: '',

    // Team Assignment
    engagement_partner: '',
    audit_manager: '',
    eqcr_partner: '',
    additional_team_members: [],

    // Compliance
    independence_confirmed: false,
    conflict_check_completed: false,
    aml_assessment_done: false,
    compliance_approval: false
  })

  const updateField = (field: string, value: any) => {
    setEngagementData(prev => ({ ...prev, [field]: value }))
  }

  const calculateMateriality = () => {
    const revenue = parseFloat(engagementData.annual_revenue) || 0
    const assets = parseFloat(engagementData.total_assets) || 0

    // Simple materiality calculation (5% of revenue or 0.5% of assets)
    const planningMateriality = Math.max(revenue * 0.05, assets * 0.005)
    const performanceMateriality = planningMateriality * 0.75

    updateField('materiality_planning', planningMateriality.toString())
    updateField('materiality_performance', performanceMateriality.toString())
  }

  const isEQCRRequired = () => {
    return (
      engagementData.public_interest_entity ||
      engagementData.risk_rating === 'high' ||
      engagementData.risk_rating === 'very_high'
    )
  }

  const getStepValidation = (step: number) => {
    switch (step) {
      case 1:
        return (
          engagementData.client_name && engagementData.client_code && engagementData.client_type
        )
      case 2:
        return (
          engagementData.engagement_type &&
          engagementData.audit_year &&
          engagementData.year_end_date
        )
      case 3:
        return engagementData.risk_rating
      case 4:
        return engagementData.engagement_partner && engagementData.audit_manager
      case 5:
        return engagementData.independence_confirmed && engagementData.conflict_check_completed
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep === 2) {
      calculateMateriality()
    }
    setCurrentStep(prev => Math.min(prev + 1, 5))
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    console.log('Starting engagement creation with data:', engagementData)
    setIsSubmitting(true)

    try {
      // Create the engagement
      const requestData = {
        action: 'create_engagement',
        data: engagementData
      }

      console.log('Sending request:', requestData)

      const response = await fetch('/api/v1/audit/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      console.log('Response status:', response.status)

      const result = await response.json()
      console.log('API response:', result)

      if (result.success) {
        toast.success('✅ Audit Engagement Created', {
          description: `${engagementData.client_name} (${engagementData.client_code}) is now active and ready for planning. Partner: ${engagementData.engagement_partner}`,
          duration: 5000,
          action: {
            label: 'View Client',
            onClick: () => console.log('Navigate to client')
          }
        })
        onEngagementCreated?.(result.data)
        setOpen(false)
        setCurrentStep(1)
        setEngagementData({
          client_name: '',
          client_code: '',
          client_type: 'private',
          industry: '',
          annual_revenue: '',
          total_assets: '',
          public_interest_entity: false,
          previous_auditor: '',
          engagement_type: 'statutory',
          audit_year: new Date().getFullYear().toString(),
          year_end_date: '',
          planned_start_date: '',
          target_completion_date: '',
          estimated_hours: '',
          estimated_fees: '',
          risk_rating: 'moderate',
          risk_factors: '',
          materiality_planning: '',
          materiality_performance: '',
          engagement_partner: '',
          audit_manager: '',
          eqcr_partner: '',
          additional_team_members: [],
          independence_confirmed: false,
          conflict_check_completed: false,
          aml_assessment_done: false,
          compliance_approval: false
        })
      } else {
        toast.error('❌ Failed to Create Engagement', {
          description: result.message || 'Please check your information and try again.',
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => console.log('Retry creation')
          }
        })
      }
    } catch (error) {
      console.error('Error creating engagement:', error)
      toast.error('🔌 Connection Error', {
        description: 'Unable to create engagement. Please check your connection and try again.',
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => handleSubmit()
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepTitles = [
    'Client Information',
    'Engagement Details',
    'Risk Assessment',
    'Team Assignment',
    'Compliance & Review'
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <span className="text-xl">New Audit Engagement</span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Step {currentStep} of 5: {stepTitles[currentStep - 1]}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step < currentStep
                    ? 'bg-green-500 text-foreground'
                    : step === currentStep
                      ? 'bg-blue-500 text-foreground'
                      : 'bg-gray-700 text-muted-foreground'
                }`}
              >
                {step < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step}
              </div>
              {step < 5 && (
                <div
                  className={`w-8 h-1 mx-1 ${step < currentStep ? 'bg-green-500' : 'bg-gray-700'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Step 1: Client Information */}
          {currentStep === 1 && (
            <Card className="bg-background border border-border shadow-sm">
              <CardHeader className="bg-muted border-b">
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Building2 className="w-5 h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-background p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Client Name *</Label>
                    <Input
                      id="client_name"
                      value={engagementData.client_name}
                      onChange={e => updateField('client_name', e.target.value)}
                      placeholder="Enter client company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_code">Client Code *</Label>
                    <Input
                      id="client_code"
                      value={engagementData.client_code}
                      onChange={e => updateField('client_code', e.target.value)}
                      placeholder="e.g., CLI-2025-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_type">Client Type *</Label>
                    <Select
                      value={engagementData.client_type}
                      onValueChange={value => updateField('client_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public Company</SelectItem>
                        <SelectItem value="private">Private Company</SelectItem>
                        <SelectItem value="non_profit">Non-Profit Organization</SelectItem>
                        <SelectItem value="government">Government Entity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={engagementData.industry}
                      onChange={e => updateField('industry', e.target.value)}
                      placeholder="e.g., Manufacturing"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annual_revenue">Annual Revenue</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="annual_revenue"
                        type="number"
                        value={engagementData.annual_revenue}
                        onChange={e => updateField('annual_revenue', e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_assets">Total Assets</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="total_assets"
                        type="number"
                        value={engagementData.total_assets}
                        onChange={e => updateField('total_assets', e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="previous_auditor">Previous Auditor</Label>
                    <Input
                      id="previous_auditor"
                      value={engagementData.previous_auditor}
                      onChange={e => updateField('previous_auditor', e.target.value)}
                      placeholder="Name of previous audit firm (if any)"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pie"
                      checked={engagementData.public_interest_entity}
                      onChange={e => updateField('public_interest_entity', e.target.checked)}
                      className="rounded border-border"
                    />
                    <Label htmlFor="pie" className="text-sm">
                      Public Interest Entity (PIE)
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Engagement Details */}
          {currentStep === 2 && (
            <Card className="bg-background border border-border shadow-sm">
              <CardHeader className="bg-muted border-b">
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Calendar className="w-5 h-5" />
                  Engagement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-background p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="engagement_type">Engagement Type *</Label>
                    <Select
                      value={engagementData.engagement_type}
                      onValueChange={value => updateField('engagement_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="statutory">Statutory Audit</SelectItem>
                        <SelectItem value="voluntary">Voluntary Audit</SelectItem>
                        <SelectItem value="special">Special Purpose Audit</SelectItem>
                        <SelectItem value="review">Review Engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audit_year">Audit Year *</Label>
                    <Input
                      id="audit_year"
                      value={engagementData.audit_year}
                      onChange={e => updateField('audit_year', e.target.value)}
                      placeholder="2025"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year_end_date">Year End Date *</Label>
                    <Input
                      id="year_end_date"
                      type="date"
                      value={engagementData.year_end_date}
                      onChange={e => updateField('year_end_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="planned_start_date">Planned Start Date</Label>
                    <Input
                      id="planned_start_date"
                      type="date"
                      value={engagementData.planned_start_date}
                      onChange={e => updateField('planned_start_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_completion_date">Target Completion</Label>
                    <Input
                      id="target_completion_date"
                      type="date"
                      value={engagementData.target_completion_date}
                      onChange={e => updateField('target_completion_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_hours">Estimated Hours</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      value={engagementData.estimated_hours}
                      onChange={e => updateField('estimated_hours', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_fees">Estimated Fees</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="estimated_fees"
                        type="number"
                        value={engagementData.estimated_fees}
                        onChange={e => updateField('estimated_fees', e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Risk Assessment */}
          {currentStep === 3 && (
            <Card className="bg-background border border-border shadow-sm">
              <CardHeader className="bg-muted border-b">
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Assessment & Materiality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-background p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="risk_rating">Overall Risk Rating *</Label>
                    <Select
                      value={engagementData.risk_rating}
                      onValueChange={value => updateField('risk_rating', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="moderate">Moderate Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                        <SelectItem value="very_high">Very High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>EQCR Required</Label>
                    <div
                      className={`p-3 rounded-lg border ${
                        isEQCRRequired()
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isEQCRRequired() ? (
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isEQCRRequired() ? 'text-orange-800' : 'text-green-800'
                          }`}
                        >
                          {isEQCRRequired() ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on PIE status and risk rating
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="materiality_planning">Planning Materiality</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="materiality_planning"
                        type="number"
                        value={engagementData.materiality_planning}
                        onChange={e => updateField('materiality_planning', e.target.value)}
                        className="pl-10"
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="materiality_performance">Performance Materiality</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="materiality_performance"
                        type="number"
                        value={engagementData.materiality_performance}
                        onChange={e => updateField('materiality_performance', e.target.value)}
                        className="pl-10"
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk_factors">Risk Factors</Label>
                  <Textarea
                    id="risk_factors"
                    value={engagementData.risk_factors}
                    onChange={e => updateField('risk_factors', e.target.value)}
                    placeholder="Document specific risk factors for this engagement..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Team Assignment */}
          {currentStep === 4 && (
            <Card className="bg-background border border-border shadow-sm">
              <CardHeader className="bg-muted border-b">
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Users className="w-5 h-5" />
                  Team Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-background p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="engagement_partner">Engagement Partner *</Label>
                    <Select
                      value={engagementData.engagement_partner}
                      onValueChange={value => updateField('engagement_partner', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="john_smith">John Smith, CPA</SelectItem>
                        <SelectItem value="michael_brown">Michael Brown, CPA</SelectItem>
                        <SelectItem value="david_lee">David Lee, CPA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audit_manager">Audit Manager *</Label>
                    <Select
                      value={engagementData.audit_manager}
                      onValueChange={value => updateField('audit_manager', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah_johnson">Sarah Johnson, CPA</SelectItem>
                        <SelectItem value="emily_davis">Emily Davis, CPA</SelectItem>
                        <SelectItem value="robert_chen">Robert Chen, CPA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isEQCRRequired() && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="eqcr_partner">EQCR Partner *</Label>
                      <Select
                        value={engagementData.eqcr_partner}
                        onValueChange={value => updateField('eqcr_partner', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select EQCR partner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="david_lee">David Lee, CPA</SelectItem>
                          <SelectItem value="robert_chen">Robert Chen, CPA</SelectItem>
                          <SelectItem value="lisa_wang">Lisa Wang, CPA</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-orange-600">
                        EQCR required due to PIE status or high risk rating
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Compliance & Review */}
          {currentStep === 5 && (
            <Card className="bg-background border border-border shadow-sm">
              <CardHeader className="bg-muted border-b">
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Shield className="w-5 h-5" />
                  Compliance & Final Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-background p-6">
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={engagementData.independence_confirmed}
                        onChange={e => updateField('independence_confirmed', e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-gray-700">Independence Confirmed</span>
                    </div>
                    {engagementData.independence_confirmed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </label>

                  <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={engagementData.conflict_check_completed}
                        onChange={e => updateField('conflict_check_completed', e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-gray-700">Conflict Check Completed</span>
                    </div>
                    {engagementData.conflict_check_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </label>

                  <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={engagementData.aml_assessment_done}
                        onChange={e => updateField('aml_assessment_done', e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-gray-700">AML Assessment Completed</span>
                    </div>
                    {engagementData.aml_assessment_done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </label>

                  <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={engagementData.compliance_approval}
                        onChange={e => updateField('compliance_approval', e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-gray-700">Compliance Officer Approval</span>
                    </div>
                    {engagementData.compliance_approval ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </label>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Engagement Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Client:</span>{' '}
                      <span className="text-gray-100">{engagementData.client_name}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Type:</span>{' '}
                      <span className="text-gray-100">{engagementData.engagement_type}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Year:</span>{' '}
                      <span className="text-gray-100">{engagementData.audit_year}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Risk:</span>{' '}
                      <span className="text-gray-100">{engagementData.risk_rating}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Partner:</span>{' '}
                      <span className="text-gray-100">{engagementData.engagement_partner}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">EQCR:</span>{' '}
                      <span className="text-gray-100">
                        {isEQCRRequired() ? 'Required' : 'Not Required'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t bg-background">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>

            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!getStepValidation(currentStep)}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={() => {
                  console.log('Create Engagement button clicked')
                  console.log('Step 5 validation:', getStepValidation(5))
                  console.log('Is submitting:', isSubmitting)
                  handleSubmit()
                }}
                disabled={!getStepValidation(5) || isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Engagement
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
