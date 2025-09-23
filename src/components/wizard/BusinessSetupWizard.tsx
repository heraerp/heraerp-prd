'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { universalApi } from '@/lib/universal-api'

// Step Components
import { OrganizationBasicsStep } from './steps/OrganizationBasicsStep'
import { ChartOfAccountsStep } from './steps/ChartOfAccountsStep'
import { FiscalYearStep } from './steps/FiscalYearStep'
import { PostingControlsStep } from './steps/PostingControlsStep'
import { DocumentNumberingStep } from './steps/DocumentNumberingStep'
import { CurrencySettingsStep } from './steps/CurrencySettingsStep'
import { TaxConfigurationStep } from './steps/TaxConfigurationStep'
import { TolerancesStep } from './steps/TolerancesStep'
import { OrganizationalStructureStep } from './steps/OrganizationalStructureStep'
import { ReviewAndActivateStep } from './steps/ReviewAndActivateStep'

export interface WizardData {
  organizationBasics: {
    organization_name: string
    organization_code: string
    country: string
    industry_classification: string
    base_currency_code: string
    language: string
    time_zone: string
  }
  chartOfAccounts: {
    load_type: 'template' | 'upload'
    template_industry?: string
    accounts?: Array<{
      entity_code: string
      entity_name: string
      parent_entity_id?: string
      account_type: string
      allow_posting: boolean
    }>
  }
  fiscalYear: {
    fiscal_year_start_month: number
    fiscal_year_start_day: number
    number_of_periods: number
    special_periods: number
    retained_earnings_account: string
    current_year_earnings_account: string
  }
  postingControls: {
    period_controls: Array<{
      period_id: string
      period_name: string
      gl_status: 'OPEN' | 'CLOSED'
      ap_status: 'OPEN' | 'CLOSED'
      ar_status: 'OPEN' | 'CLOSED'
      inventory_status: 'OPEN' | 'CLOSED'
    }>
  }
  documentNumbering: {
    sequences: Array<{
      document_type: string
      prefix: string
      suffix: string
      next_number: number
      min_length: number
      reset_frequency: 'NEVER' | 'YEARLY' | 'MONTHLY'
    }>
  }
  currencySettings: {
    allowed_currencies: string[]
    default_rate_type: 'SPOT' | 'MONTH_END' | 'DAILY'
    rate_tolerance_percent: number
    auto_calculate_differences: boolean
  }
  taxConfiguration: {
    tax_codes: Array<{
      tax_code: string
      description: string
      rate_percent: number
      input_account: string
      output_account: string
      recoverable: boolean
    }>
  }
  tolerances: {
    user_posting_limit: number
    payment_tolerance_amount: number
    require_approval_above: number
    ai_confidence_threshold: number
    allow_negative_inventory: boolean
  }
  organizationalStructure: {
    org_units: Array<{
      entity_code: string
      entity_name: string
      entity_type: 'branch' | 'cost_center' | 'profit_center'
      parent_entity_id?: string
      allow_posting: boolean
    }>
  }
  moduleActivation: {
    finance_dna: boolean
    fiscal_dna: boolean
    tax_dna: boolean
    auto_journal_dna: boolean
  }
}

const WIZARD_STEPS = [
  {
    id: 'organization_basics',
    title: 'Organization Basics',
    description: 'Basic organization information and settings',
    component: OrganizationBasicsStep
  },
  {
    id: 'chart_of_accounts',
    title: 'Chart of Accounts',
    description: 'Load or import GL account structure',
    component: ChartOfAccountsStep
  },
  {
    id: 'fiscal_year',
    title: 'Fiscal Year & Periods',
    description: 'Configure fiscal calendar and periods',
    component: FiscalYearStep
  },
  {
    id: 'posting_controls',
    title: 'Posting Period Controls',
    description: 'Configure which periods are open for posting',
    component: PostingControlsStep
  },
  {
    id: 'document_numbering',
    title: 'Document Numbering',
    description: 'Define numbering sequences for documents',
    component: DocumentNumberingStep
  },
  {
    id: 'currency_settings',
    title: 'Currency & Exchange Rates',
    description: 'Configure multi-currency settings',
    component: CurrencySettingsStep
  },
  {
    id: 'tax_configuration',
    title: 'Tax Configuration',
    description: 'Setup tax codes and rates',
    component: TaxConfigurationStep
  },
  {
    id: 'tolerances',
    title: 'Tolerances & Controls',
    description: 'Set organizational control limits',
    component: TolerancesStep
  },
  {
    id: 'organizational_structure',
    title: 'Organizational Structure',
    description: 'Define branches, cost centers, profit centers',
    component: OrganizationalStructureStep
  },
  {
    id: 'review_activate',
    title: 'Review & Activate',
    description: 'Confirm setup and activate DNA modules',
    component: ReviewAndActivateStep
  }
]

export const BusinessSetupWizard: React.FC = () => {
  const { currentOrganization, user  } = useHERAAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>({
    organizationBasics: {
      organization_name: '',
      organization_code: '',
      country: '',
      industry_classification: '',
      base_currency_code: '',
      language: 'en',
      time_zone: ''
    },
    chartOfAccounts: {
      load_type: 'template',
      accounts: []
    },
    fiscalYear: {
      fiscal_year_start_month: 1,
      fiscal_year_start_day: 1,
      number_of_periods: 12,
      special_periods: 0,
      retained_earnings_account: '',
      current_year_earnings_account: ''
    },
    postingControls: {
      period_controls: []
    },
    documentNumbering: {
      sequences: []
    },
    currencySettings: {
      allowed_currencies: [],
      default_rate_type: 'SPOT',
      rate_tolerance_percent: 1.0,
      auto_calculate_differences: true
    },
    taxConfiguration: {
      tax_codes: []
    },
    tolerances: {
      user_posting_limit: 10000,
      payment_tolerance_amount: 10,
      require_approval_above: 5000,
      ai_confidence_threshold: 0.8,
      allow_negative_inventory: false
    },
    organizationalStructure: {
      org_units: []
    },
    moduleActivation: {
      finance_dna: true,
      fiscal_dna: true,
      tax_dna: true,
      auto_journal_dna: true
    }
  })

  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [wizardSessionId] = useState(
    () => `wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  )

  // Initialize wizard data if organization exists
  useEffect(() => {
    if (currentOrganization && user) {
      setWizardData(prev => ({
        ...prev,
        organizationBasics: {
          ...prev.organizationBasics,
          organization_name: currentOrganization.organization_name || '',
          organization_code: currentOrganization.organization_code || ''
        }
      }))
    }
  }, [currentOrganization, user])

  const validateStep = async (stepIndex: number): Promise<boolean> => {
    const step = WIZARD_STEPS[stepIndex]
    const stepData = wizardData[step.id as keyof WizardData]

    // Basic validation logic - can be extended
    const errors: string[] = []

    switch (step.id) {
      case 'organization_basics':
        const orgData = stepData as WizardData['organizationBasics']
        if (!orgData.organization_name) errors.push('Organization name is required')
        if (!orgData.organization_code) errors.push('Organization code is required')
        if (!orgData.country) errors.push('Country is required')
        if (!orgData.base_currency_code) errors.push('Base currency is required')
        break

      case 'fiscal_year':
        const fiscalData = stepData as WizardData['fiscalYear']
        if (!fiscalData.retained_earnings_account)
          errors.push('Retained earnings account is required')
        if (!fiscalData.current_year_earnings_account)
          errors.push('Current year earnings account is required')
        break
    }

    setValidationErrors(prev => ({
      ...prev,
      [step.id]: errors
    }))

    return errors.length === 0
  }

  const saveStepData = async (stepIndex: number, data: Partial<WizardData>) => {
    setLoading(true)
    try {
      // Update wizard data
      setWizardData(prev => ({
        ...prev,
        ...data
      }))

      // Save to backend
      if (currentOrganization) {
        await universalApi.saveWizardStep({
          organization_id: currentOrganization.id,
          wizard_session_id: wizardSessionId,
          step: WIZARD_STEPS[stepIndex].id,
          data: data,
          metadata: {
            ingest_source: 'business_setup_wizard_v2',
            step_completion_time: new Date().toISOString()
          }
        })
      }

      // Mark step as completed
      setCompletedSteps(prev => new Set([...prev, stepIndex]))
    } catch (error) {
      console.error('Failed to save step data:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const activateOrganization = async () => {
    setLoading(true)
    try {
      if (!currentOrganization) {
        throw new Error('No organization context')
      }

      // Final validation
      const allValid = await Promise.all(WIZARD_STEPS.map((_, index) => validateStep(index)))

      if (!allValid.every(Boolean)) {
        throw new Error('Please complete all steps before activation')
      }

      // Activate organization with all configuration
      const result = await universalApi.activateOrganization({
        organization_id: currentOrganization.id,
        wizard_data: wizardData,
        wizard_session_id: wizardSessionId
      })

      if (result.success) {
        // Redirect to organization dashboard
        window.location.href = '/org'
      } else {
        throw new Error(result.error || 'Activation failed')
      }
    } catch (error) {
      console.error('Organization activation failed:', error)
      // Show error to user
    } finally {
      setLoading(false)
    }
  }

  if (!currentOrganization || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading organization context...</p>
        </div>
      </div>
    )
  }

  const CurrentStepComponent = WIZARD_STEPS[currentStep].component
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">HERA Business Setup Wizard</h1>
        <p className="text-muted-foreground mt-2">
          Configure your organization using HERA's Universal Configuration Rules
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Steps Navigation */}
      <div className="grid grid-cols-5 gap-2 text-xs">
        {WIZARD_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center space-x-1 p-2 rounded ${
              index === currentStep
                ? 'bg-primary text-primary-foreground'
                : completedSteps.has(index)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {completedSteps.has(index) ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
            <span className="truncate">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle>{WIZARD_STEPS[currentStep].title}</CardTitle>
          <CardDescription>{WIZARD_STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            data={wizardData}
            onChange={data => setWizardData(prev => ({ ...prev, ...data }))}
            onSave={data => saveStepData(currentStep, data)}
            validationErrors={validationErrors[WIZARD_STEPS[currentStep].id] || []}
            organizationId={currentOrganization.id}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={previousStep} disabled={currentStep === 0 || loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep === WIZARD_STEPS.length - 1 ? (
          <Button
            onClick={activateOrganization}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Activate Organization
          </Button>
        ) : (
          <Button onClick={nextStep} disabled={loading}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
