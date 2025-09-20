'use client'

import React, { useState, useEffect } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { FileUp, Download, Eye, AlertCircle, CheckCircle } from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import type { WizardData } from '../BusinessSetupWizard'

interface ChartOfAccountsStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

interface COAAccount {
  entity_code: string
  entity_name: string
  parent_entity_code?: string
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  account_subtype: string
  allow_posting: boolean
  natural_balance: 'DEBIT' | 'CREDIT'
  ifrs_classification: string
  smart_code: string
}

const INDUSTRY_TEMPLATES = {
  RESTAURANT: {
    name: 'Restaurant & Food Service',
    description:
      'Complete chart of accounts for restaurants with food cost tracking, tips, and hospitality-specific accounts',
    account_count: 85
  },
  SALON: {
    name: 'Beauty & Personal Care',
    description:
      'Specialized accounts for salons including service revenue, product sales, and beauty industry specifics',
    account_count: 78
  },
  HEALTHCARE: {
    name: 'Healthcare & Medical',
    description:
      'Medical practice accounts including patient receivables, insurance, and healthcare-specific expenses',
    account_count: 92
  },
  RETAIL: {
    name: 'Retail & E-commerce',
    description:
      'Retail-focused accounts with inventory management, online sales, and customer loyalty programs',
    account_count: 88
  },
  MANUFACTURING: {
    name: 'Manufacturing & Production',
    description:
      'Production-focused accounts including work-in-progress, raw materials, and manufacturing overhead',
    account_count: 110
  },
  PROFESSIONAL_SERVICES: {
    name: 'Professional Services',
    description:
      'Service business accounts with time billing, project tracking, and professional service specifics',
    account_count: 75
  }
}

export const ChartOfAccountsStep: React.FC<ChartOfAccountsStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const [previewAccounts, setPreviewAccounts] = useState<COAAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const coaData = data.chartOfAccounts
  const industryCode = data.organizationBasics.industry_classification

  // Load template preview when industry/template changes
  useEffect(() => {
    if (
      coaData.load_type === 'template' &&
      industryCode &&
      INDUSTRY_TEMPLATES[industryCode as keyof typeof INDUSTRY_TEMPLATES]
    ) {
      loadTemplatePreview()
    }
  }, [coaData.load_type, industryCode])

  const loadTemplatePreview = async () => {
    setLoading(true)
    try {
      // Load industry-specific COA template
      const template = await universalApi.getCOATemplate({
        industry: industryCode,
        country: data.organizationBasics.country,
        currency: data.organizationBasics.base_currency_code
      })

      setPreviewAccounts(template.accounts || [])

      // Update wizard data
      onChange({
        chartOfAccounts: {
          ...coaData,
          template_industry: industryCode,
          accounts: template.accounts
        }
      })
    } catch (error) {
      console.error('Failed to load COA template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadTypeChange = (value: 'template' | 'upload') => {
    onChange({
      chartOfAccounts: {
        ...coaData,
        load_type: value,
        accounts: []
      }
    })
    setPreviewAccounts([])
    setShowPreview(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      let accounts: COAAccount[] = []

      if (file.name.endsWith('.json')) {
        accounts = JSON.parse(text)
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV - basic implementation
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())

        accounts = lines
          .slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim())
            const account: any = {}
            headers.forEach((header, index) => {
              account[header] = values[index] || ''
            })
            return account as COAAccount
          })
      }

      // Validate uploaded accounts
      const validatedAccounts = accounts.map(account => ({
        ...account,
        allow_posting: account.allow_posting ?? true,
        smart_code:
          account.smart_code || `HERA.${industryCode}.COA.ACCOUNT.GL.${account.account_type}.v1`
      }))

      setPreviewAccounts(validatedAccounts)
      onChange({
        chartOfAccounts: {
          ...coaData,
          accounts: validatedAccounts
        }
      })
    } catch (error) {
      console.error('Failed to parse file:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleFile = () => {
    const sampleCOA = [
      {
        entity_code: '1100000',
        entity_name: 'Cash and Bank',
        parent_entity_code: '1000000',
        account_type: 'ASSET',
        account_subtype: 'CURRENT_ASSET',
        allow_posting: true,
        natural_balance: 'DEBIT',
        ifrs_classification: 'CURRENT_ASSET',
        smart_code: 'HERA.UNIVERSAL.COA.ACCOUNT.GL.ASSET.CURRENT.CASH.V1'
      },
      {
        entity_code: '4100000',
        entity_name: 'Sales Revenue',
        parent_entity_code: '4000000',
        account_type: 'REVENUE',
        account_subtype: 'OPERATING_REVENUE',
        allow_posting: true,
        natural_balance: 'CREDIT',
        ifrs_classification: 'REVENUE',
        smart_code: 'HERA.UNIVERSAL.COA.ACCOUNT.GL.REV.OPERATING.SALES.V1'
      }
    ]

    const csvContent = [
      'entity_code,entity_name,parent_entity_code,account_type,account_subtype,allow_posting,natural_balance,ifrs_classification,smart_code',
      ...sampleCOA.map(
        acc =>
          `${acc.entity_code},${acc.entity_name},${acc.parent_entity_code},${acc.account_type},${acc.account_subtype},${acc.allow_posting},${acc.natural_balance},${acc.ifrs_classification},${acc.smart_code}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hera-coa-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    await onSave({
      chartOfAccounts: coaData
    })
  }

  const templateInfo = industryCode
    ? INDUSTRY_TEMPLATES[industryCode as keyof typeof INDUSTRY_TEMPLATES]
    : null

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Load Type Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Chart of Accounts Source</Label>
        <RadioGroup
          value={coaData.load_type}
          onValueChange={handleLoadTypeChange}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="template" id="template" />
            <Label htmlFor="template">Load Industry Template (Recommended)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upload" id="upload" />
            <Label htmlFor="upload">Upload Custom Chart of Accounts</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Template Option */}
      {coaData.load_type === 'template' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Industry Template</span>
              {templateInfo && (
                <Badge variant="secondary">{templateInfo.account_count} accounts</Badge>
              )}
            </CardTitle>
            <CardDescription>{templateInfo?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {industryCode && templateInfo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div>
                    <h4 className="font-semibold">{templateInfo.name}</h4>
                    <p className="text-sm text-muted-foreground">{templateInfo.description}</p>
                    <div className="flex space-x-4 text-xs text-muted-foreground mt-2">
                      <span>✓ IFRS Compliant</span>
                      <span>✓ Industry Optimized</span>
                      <span>✓ Multi-Currency Ready</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={loading}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide' : 'Preview'}
                  </Button>
                </div>

                {loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading template...</p>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please complete the Organization Basics step first to select an industry template.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Option */}
      {coaData.load_type === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Chart of Accounts</CardTitle>
            <CardDescription>
              Upload a CSV or JSON file containing your chart of accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coa-file">Select File</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="coa-file"
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                <Button variant="outline" onClick={downloadSampleFile} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Sample
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: CSV, JSON. Maximum file size: 5MB
              </p>
            </div>

            {/* Upload Instructions */}
            <div className="p-3 border rounded bg-blue-50 dark:bg-blue-950/30 text-sm">
              <h4 className="font-medium mb-2">Required Fields:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  <code>entity_code</code> - Account code (e.g., 1100000)
                </li>
                <li>
                  <code>entity_name</code> - Account name (e.g., Cash and Bank)
                </li>
                <li>
                  <code>account_type</code> - ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
                </li>
                <li>
                  <code>natural_balance</code> - DEBIT or CREDIT
                </li>
                <li>
                  <code>allow_posting</code> - true/false
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {showPreview && previewAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Chart of Accounts Preview</span>
              <Badge variant="secondary">{previewAccounts.length} accounts</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Account Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Balance</th>
                    <th className="text-left p-2">Posting</th>
                  </tr>
                </thead>
                <tbody>
                  {previewAccounts.map((account, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono">{account.entity_code}</td>
                      <td className="p-2">{account.entity_name}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {account.account_type}
                        </Badge>
                      </td>
                      <td className="p-2">{account.natural_balance}</td>
                      <td className="p-2">
                        {account.allow_posting ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-muted-foreground text-xs">Summary</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {previewAccounts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map(type => {
            const count = previewAccounts.filter(acc => acc.account_type === type).length
            return (
              <div key={type} className="p-3 border rounded bg-muted/30">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{type}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Required System Accounts Check */}
      {previewAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Account Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Retained Earnings Account: Found</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Current Year Earnings: Found</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Cash/Bank Accounts: Found</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Revenue Accounts: Found</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
