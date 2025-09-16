'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Badge } from '@/src/components/ui/badge'
import { Calendar, AlertCircle, Clock } from 'lucide-react'
import type { WizardData } from '../BusinessSetupWizard'

interface FiscalYearStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

interface FiscalPeriod {
  period_number: number
  period_name: string
  start_date: string
  end_date: string
  quarter: number
}

const MONTHS = [
  { value: 1, name: 'January', short: 'Jan' },
  { value: 2, name: 'February', short: 'Feb' },
  { value: 3, name: 'March', short: 'Mar' },
  { value: 4, name: 'April', short: 'Apr' },
  { value: 5, name: 'May', short: 'May' },
  { value: 6, name: 'June', short: 'Jun' },
  { value: 7, name: 'July', short: 'Jul' },
  { value: 8, name: 'August', short: 'Aug' },
  { value: 9, name: 'September', short: 'Sep' },
  { value: 10, name: 'October', short: 'Oct' },
  { value: 11, name: 'November', short: 'Nov' },
  { value: 12, name: 'December', short: 'Dec' }
]

export const FiscalYearStep: React.FC<FiscalYearStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([])
  const fiscalData = data.fiscalYear
  const coaAccounts = data.chartOfAccounts.accounts || []

  // Generate fiscal periods when configuration changes
  useEffect(() => {
    generateFiscalPeriods()
  }, [fiscalData.fiscal_year_start_month, fiscalData.number_of_periods])

  const generateFiscalPeriods = () => {
    const currentYear = new Date().getFullYear()
    const startMonth = fiscalData.fiscal_year_start_month
    const numPeriods = fiscalData.number_of_periods

    const periods: FiscalPeriod[] = []

    for (let i = 0; i < numPeriods; i++) {
      const periodMonth = ((startMonth - 1 + i) % 12) + 1
      const periodYear = currentYear + Math.floor((startMonth - 1 + i) / 12)

      const startDate = new Date(periodYear, periodMonth - 1, 1)
      const endDate = new Date(periodYear, periodMonth, 0) // Last day of month

      periods.push({
        period_number: i + 1,
        period_name: `${MONTHS[periodMonth - 1].short} ${periodYear}`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        quarter: Math.floor(i / 3) + 1
      })
    }

    setFiscalPeriods(periods)
  }

  const handleChange = (field: keyof typeof fiscalData, value: any) => {
    onChange({
      fiscalYear: {
        ...fiscalData,
        [field]: value
      }
    })
  }

  const handleSave = async () => {
    await onSave({
      fiscalYear: fiscalData
    })
  }

  // Get system accounts for selection
  const systemAccounts = coaAccounts.filter(
    acc =>
      acc.account_type === 'EQUITY' ||
      (acc.account_type === 'ASSET' && acc.account_subtype === 'CURRENT_ASSET')
  )

  const retainedEarningsAccounts = coaAccounts.filter(
    acc =>
      acc.account_type === 'EQUITY' &&
      (acc.entity_name.toLowerCase().includes('retained') ||
        acc.entity_name.toLowerCase().includes('earnings') ||
        acc.entity_code === '3200000')
  )

  const currentEarningsAccounts = coaAccounts.filter(
    acc =>
      acc.account_type === 'EQUITY' &&
      (acc.entity_name.toLowerCase().includes('current') ||
        acc.entity_name.toLowerCase().includes('profit') ||
        acc.entity_code === '3300000')
  )

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fiscal Year Start */}
        <div className="space-y-2">
          <Label htmlFor="start_month" className="text-sm font-medium">
            Fiscal Year Start Month <span className="text-red-500">*</span>
          </Label>
          <Select
            value={fiscalData.fiscal_year_start_month.toString()}
            onValueChange={value => handleChange('fiscal_year_start_month', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select start month" />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              {MONTHS.map(month => (
                <SelectItem
                  key={month.value}
                  value={month.value.toString()}
                  className="hera-select-item"
                >
                  {month.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">First month of your fiscal year</p>
        </div>

        {/* Start Day */}
        <div className="space-y-2">
          <Label htmlFor="start_day" className="text-sm font-medium">
            Start Day
          </Label>
          <Input
            id="start_day"
            type="number"
            min="1"
            max="31"
            value={fiscalData.fiscal_year_start_day}
            onChange={e => handleChange('fiscal_year_start_day', parseInt(e.target.value) || 1)}
          />
          <p className="text-xs text-muted-foreground">Day of the month (usually 1)</p>
        </div>

        {/* Number of Periods */}
        <div className="space-y-2">
          <Label htmlFor="num_periods" className="text-sm font-medium">
            Number of Periods
          </Label>
          <Select
            value={fiscalData.number_of_periods.toString()}
            onValueChange={value => handleChange('number_of_periods', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              <SelectItem value="12" className="hera-select-item">
                12 Periods (Monthly)
              </SelectItem>
              <SelectItem value="13" className="hera-select-item">
                13 Periods (4-4-5 Calendar)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Special Periods */}
        <div className="space-y-2">
          <Label htmlFor="special_periods" className="text-sm font-medium">
            Special Periods
          </Label>
          <Input
            id="special_periods"
            type="number"
            min="0"
            max="4"
            value={fiscalData.special_periods}
            onChange={e => handleChange('special_periods', parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">Additional adjustment periods (0-4)</p>
        </div>
      </div>

      {/* Closing Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Year-End Closing Configuration</CardTitle>
          <CardDescription>Select GL accounts for automatic year-end closing</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Retained Earnings Account */}
          <div className="space-y-2">
            <Label htmlFor="retained_earnings" className="text-sm font-medium">
              Retained Earnings Account <span className="text-red-500">*</span>
            </Label>
            <Select
              value={fiscalData.retained_earnings_account}
              onValueChange={value => handleChange('retained_earnings_account', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select retained earnings account" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                {retainedEarningsAccounts.map(account => (
                  <SelectItem
                    key={account.entity_code}
                    value={account.entity_code}
                    className="hera-select-item"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{account.entity_code}</span>
                      <span>{account.entity_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Prior year P&L closes to this account</p>
          </div>

          {/* Current Year Earnings */}
          <div className="space-y-2">
            <Label htmlFor="current_earnings" className="text-sm font-medium">
              Current Year Earnings Account <span className="text-red-500">*</span>
            </Label>
            <Select
              value={fiscalData.current_year_earnings_account}
              onValueChange={value => handleChange('current_year_earnings_account', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select current earnings account" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                {currentEarningsAccounts.map(account => (
                  <SelectItem
                    key={account.entity_code}
                    value={account.entity_code}
                    className="hera-select-item"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{account.entity_code}</span>
                      <span>{account.entity_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Current year P&L accumulates here</p>
          </div>
        </CardContent>
      </Card>

      {/* Fiscal Calendar Preview */}
      {fiscalPeriods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Fiscal Calendar Preview</span>
              <Badge variant="secondary">{fiscalPeriods.length} periods</Badge>
            </CardTitle>
            <CardDescription>Generated fiscal periods based on your configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {fiscalPeriods.map(period => (
                <div key={period.period_number} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      P{period.period_number.toString().padStart(2, '0')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Q{period.quarter}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium">{period.period_name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(period.start_date).toLocaleDateString()} -{' '}
                    {new Date(period.end_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">
              {MONTHS[fiscalData.fiscal_year_start_month - 1]?.short || 'Jan'}
            </div>
            <div className="text-xs text-muted-foreground">Fiscal Start</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{fiscalData.number_of_periods}</div>
            <div className="text-xs text-muted-foreground">Periods</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 mx-auto mb-2 text-primary flex items-center justify-center">
              📊
            </div>
            <div className="text-2xl font-bold">{fiscalData.special_periods}</div>
            <div className="text-xs text-muted-foreground">Special Periods</div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Code Preview */}
      <div className="mt-4 p-3 border rounded bg-blue-50 dark:bg-blue-950/30">
        <h4 className="font-medium text-sm mb-2">Generated Smart Codes:</h4>
        <div className="text-xs font-mono space-y-1">
          <div>
            Fiscal Config: HERA.{data.organizationBasics.industry_classification}
            .UCR.CONFIG.FISCAL_YEAR.v1
          </div>
          <div>
            Fiscal Periods: HERA.{data.organizationBasics.industry_classification}
            .UCR.CONFIG.FISCAL_PERIODS.v1
          </div>
          <div>
            Year-End Close: HERA.{data.organizationBasics.industry_classification}
            .UCR.CONFIG.YEAR_END_CLOSE.v1
          </div>
        </div>
      </div>
    </div>
  )
}
