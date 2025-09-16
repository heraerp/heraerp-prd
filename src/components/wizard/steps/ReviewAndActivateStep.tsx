'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Switch } from '@/src/components/ui/switch'
import { Label } from '@/src/components/ui/label'
import {
  CheckCircle,
  Building,
  CreditCard,
  Calendar,
  FileText,
  Globe,
  Settings,
  Users,
  Zap,
  AlertTriangle
} from 'lucide-react'
import type { WizardData } from '../BusinessSetupWizard'

interface ReviewAndActivateStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

export const ReviewAndActivateStep: React.FC<ReviewAndActivateStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const handleModuleToggle = (module: keyof typeof data.moduleActivation, enabled: boolean) => {
    onChange({
      moduleActivation: {
        ...data.moduleActivation,
        [module]: enabled
      }
    })
  }

  const summaryItems = [
    {
      icon: Building,
      title: 'Organization',
      content: [
        `Name: ${data.organizationBasics.organization_name}`,
        `Code: ${data.organizationBasics.organization_code}`,
        `Industry: ${data.organizationBasics.industry_classification}`,
        `Country: ${data.organizationBasics.country}`,
        `Currency: ${data.organizationBasics.base_currency_code}`
      ]
    },
    {
      icon: CreditCard,
      title: 'Chart of Accounts',
      content: [
        `Source: ${data.chartOfAccounts.load_type === 'template' ? 'Industry Template' : 'Custom Upload'}`,
        `Accounts: ${data.chartOfAccounts.accounts?.length || 0} accounts`,
        `IFRS Compliant: Yes`,
        `Multi-Currency: Yes`
      ]
    },
    {
      icon: Calendar,
      title: 'Fiscal Configuration',
      content: [
        `Start Month: ${new Date(2023, data.fiscalYear.fiscal_year_start_month - 1).toLocaleString('default', { month: 'long' })}`,
        `Periods: ${data.fiscalYear.number_of_periods} monthly periods`,
        `Special Periods: ${data.fiscalYear.special_periods}`,
        `Retained Earnings: ${data.fiscalYear.retained_earnings_account}`,
        `Current Earnings: ${data.fiscalYear.current_year_earnings_account}`
      ]
    },
    {
      icon: FileText,
      title: 'Document Numbering',
      content: data.documentNumbering.sequences.map(
        seq =>
          `${seq.document_type}: ${seq.prefix}${seq.next_number.toString().padStart(seq.min_length, '0')}`
      )
    },
    {
      icon: Globe,
      title: 'Currency & Tax',
      content: [
        `Base Currency: ${data.organizationBasics.base_currency_code}`,
        `Additional Currencies: ${data.currencySettings.allowed_currencies.length}`,
        `Tax Codes: ${data.taxConfiguration.tax_codes.length}`,
        `Rate Type: ${data.currencySettings.default_rate_type}`
      ]
    },
    {
      icon: Users,
      title: 'Organizational Structure',
      content: data.organizationalStructure.org_units.map(
        unit =>
          `${unit.entity_type}: ${unit.entity_name} (${unit.allow_posting ? 'Posting' : 'Summary'})`
      )
    }
  ]

  const dnaModules = [
    {
      key: 'finance_dna' as const,
      name: 'Finance DNA',
      description: 'Automatic GL posting with smart code intelligence',
      icon: '💰',
      features: [
        'Smart Code-driven GL posting',
        'Multi-currency support',
        'Real-time balance validation',
        'Audit trail integration'
      ],
      required: true
    },
    {
      key: 'fiscal_dna' as const,
      name: 'Fiscal DNA',
      description: 'Period management and year-end closing',
      icon: '📅',
      features: [
        'Automated period controls',
        'Year-end closing automation',
        'Period-based reporting',
        'Fiscal calendar management'
      ],
      required: true
    },
    {
      key: 'tax_dna' as const,
      name: 'Tax DNA',
      description: 'Automated tax calculations and compliance',
      icon: '🧾',
      features: [
        'Multi-jurisdiction tax support',
        'Automatic tax calculations',
        'Tax reporting templates',
        'Compliance monitoring'
      ],
      required: false
    },
    {
      key: 'auto_journal_dna' as const,
      name: 'Auto-Journal DNA',
      description: 'AI-powered intelligent journal automation',
      icon: '🤖',
      features: [
        '85%+ automation rate',
        'AI-powered classification',
        'Batch processing optimization',
        'Real-time posting validation'
      ],
      required: false
    }
  ]

  const completionChecks = [
    {
      label: 'Organization basics configured',
      completed: !!data.organizationBasics.organization_name
    },
    {
      label: 'Chart of accounts loaded',
      completed: (data.chartOfAccounts.accounts?.length || 0) > 0
    },
    { label: 'Fiscal year configured', completed: !!data.fiscalYear.retained_earnings_account },
    { label: 'Posting controls set', completed: data.postingControls.period_controls.length > 0 },
    { label: 'Document numbering defined', completed: data.documentNumbering.sequences.length > 0 },
    { label: 'Currency settings configured', completed: !!data.currencySettings.default_rate_type },
    { label: 'Tax configuration complete', completed: data.taxConfiguration.tax_codes.length > 0 },
    { label: 'Tolerances set', completed: !!data.tolerances.user_posting_limit },
    {
      label: 'Organization structure defined',
      completed: data.organizationalStructure.org_units.length > 0
    }
  ]

  const completedCount = completionChecks.filter(check => check.completed).length
  const completionPercentage = Math.round((completedCount / completionChecks.length) * 100)

  return (
    <div className="space-y-6">
      {/* Completion Status */}
      <Card
        className={
          completionPercentage === 100
            ? 'border-green-200 bg-green-50 dark:bg-green-950/30'
            : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30'
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {completionPercentage === 100 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            <span>Setup Completion: {completionPercentage}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {completionChecks.map((check, index) => (
              <div key={index} className="flex items-center space-x-2">
                {check.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-border" />
                )}
                <span className={check.completed ? 'text-green-700' : 'text-muted-foreground'}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summaryItems.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {item.content.map((line, lineIndex) => (
                  <li key={lineIndex} className="text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DNA Module Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>HERA DNA Module Activation</span>
          </CardTitle>
          <CardDescription>
            Select which HERA DNA modules to activate for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dnaModules.map(module => (
            <div key={module.key} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{module.icon}</span>
                    <div>
                      <h4 className="font-semibold">{module.name}</h4>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                    {module.required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>

                  <div className="ml-11 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                      {module.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Label htmlFor={module.key} className="text-sm">
                    {data.moduleActivation[module.key] ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id={module.key}
                    checked={data.moduleActivation[module.key]}
                    onCheckedChange={checked => handleModuleToggle(module.key, checked)}
                    disabled={module.required}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">
              Please resolve the following issues before activation:
            </div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Activation Preview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>What Happens Upon Activation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Immediate Actions:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Create all GL accounts with IFRS lineage</li>
                <li>• Generate fiscal periods and controls</li>
                <li>• Configure document numbering sequences</li>
                <li>• Setup organizational structure entities</li>
                <li>• Activate selected DNA modules</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Available Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Universal API access for all operations</li>
                <li>• Automatic GL posting for transactions</li>
                <li>• Real-time financial reporting</li>
                <li>• Multi-currency transaction processing</li>
                <li>• Complete audit trail and compliance</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 border rounded bg-background dark:bg-muted/50">
            <div className="text-xs font-mono">
              <div className="text-muted-foreground mb-1">Generated Smart Code:</div>
              <div>
                HERA.{data.organizationBasics.industry_classification}.ORG.ACTIVATION.COMPLETE.v1
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
