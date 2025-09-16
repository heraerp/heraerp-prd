'use client'

import React from 'react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { WizardData } from '../BusinessSetupWizard'

interface OrganizationBasicsStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' }
]

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'SGD', name: 'Singapore Dollar' }
]

const INDUSTRIES = [
  { code: 'RESTAURANT', name: 'Restaurant & Food Service' },
  { code: 'SALON', name: 'Beauty & Personal Care' },
  { code: 'HEALTHCARE', name: 'Healthcare & Medical' },
  { code: 'RETAIL', name: 'Retail & E-commerce' },
  { code: 'MANUFACTURING', name: 'Manufacturing & Production' },
  { code: 'PROFESSIONAL_SERVICES', name: 'Professional Services' },
  { code: 'CONSTRUCTION', name: 'Construction & Real Estate' },
  { code: 'TECHNOLOGY', name: 'Technology & Software' },
  { code: 'EDUCATION', name: 'Education & Training' },
  { code: 'FINANCE', name: 'Financial Services' }
]

const TIME_ZONES = [
  { code: 'Asia/Dubai', name: 'Dubai (GST+4)' },
  { code: 'Europe/London', name: 'London (GMT)' },
  { code: 'America/New_York', name: 'New York (EST)' },
  { code: 'America/Los_Angeles', name: 'Los Angeles (PST)' },
  { code: 'Asia/Singapore', name: 'Singapore (SGT+8)' },
  { code: 'Australia/Sydney', name: 'Sydney (AEST+10)' },
  { code: 'Europe/Berlin', name: 'Berlin (CET+1)' },
  { code: 'Asia/Kolkata', name: 'Mumbai (IST+5:30)' }
]

export const OrganizationBasicsStep: React.FC<OrganizationBasicsStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const orgData = data.organizationBasics

  const handleChange = (field: keyof typeof orgData, value: string) => {
    const updatedData = {
      organizationBasics: {
        ...orgData,
        [field]: value
      }
    }

    // Auto-set currency based on country
    if (field === 'country') {
      const country = COUNTRIES.find(c => c.code === value)
      if (country) {
        updatedData.organizationBasics.base_currency_code = country.currency
      }
    }

    onChange(updatedData)
  }

  const handleSave = async () => {
    await onSave({
      organizationBasics: orgData
    })
  }

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
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="organization_name" className="text-sm font-medium">
            Business Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organization_name"
            placeholder="Enter your business name"
            value={orgData.organization_name}
            onChange={e => handleChange('organization_name', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">The legal name of your business</p>
        </div>

        {/* Organization Code */}
        <div className="space-y-2">
          <Label htmlFor="organization_code" className="text-sm font-medium">
            Organization Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organization_code"
            placeholder="ACME-US"
            value={orgData.organization_code}
            onChange={e => handleChange('organization_code', e.target.value.toUpperCase())}
            className="w-full"
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground">
            4-10 character unique identifier (letters, numbers, dash)
          </p>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium">
            Primary Country <span className="text-red-500">*</span>
          </Label>
          <Select value={orgData.country} onValueChange={value => handleChange('country', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your primary country" />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              {COUNTRIES.map(country => (
                <SelectItem key={country.code} value={country.code} className="hera-select-item">
                  <div className="flex items-center space-x-2">
                    <span>{country.name}</span>
                    <span className="text-xs text-muted-foreground">({country.code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Industry Classification */}
        <div className="space-y-2">
          <Label htmlFor="industry_classification" className="text-sm font-medium">
            Industry Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={orgData.industry_classification}
            onValueChange={value => handleChange('industry_classification', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              {INDUSTRIES.map(industry => (
                <SelectItem key={industry.code} value={industry.code} className="hera-select-item">
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base Currency */}
        <div className="space-y-2">
          <Label htmlFor="base_currency_code" className="text-sm font-medium">
            Base Currency <span className="text-red-500">*</span>
          </Label>
          <Select
            value={orgData.base_currency_code}
            onValueChange={value => handleChange('base_currency_code', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select base currency" />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              {CURRENCIES.map(currency => (
                <SelectItem key={currency.code} value={currency.code} className="hera-select-item">
                  <div className="flex items-center space-x-2">
                    <span>{currency.code}</span>
                    <span className="text-sm text-muted-foreground">{currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Zone */}
        <div className="space-y-2">
          <Label htmlFor="time_zone" className="text-sm font-medium">
            Time Zone <span className="text-red-500">*</span>
          </Label>
          <Select
            value={orgData.time_zone}
            onValueChange={value => handleChange('time_zone', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your time zone" />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              {TIME_ZONES.map(tz => (
                <SelectItem key={tz.code} value={tz.code} className="hera-select-item">
                  {tz.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview Card */}
      <div className="mt-8 p-4 border rounded-lg bg-muted/30">
        <h3 className="font-semibold text-lg mb-4">Organization Preview</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Name:</span> {orgData.organization_name || 'Not set'}
          </div>
          <div>
            <span className="font-medium">Code:</span> {orgData.organization_code || 'Not set'}
          </div>
          <div>
            <span className="font-medium">Country:</span>{' '}
            {COUNTRIES.find(c => c.code === orgData.country)?.name || 'Not selected'}
          </div>
          <div>
            <span className="font-medium">Industry:</span>{' '}
            {INDUSTRIES.find(i => i.code === orgData.industry_classification)?.name ||
              'Not selected'}
          </div>
          <div>
            <span className="font-medium">Currency:</span> {orgData.base_currency_code || 'Not set'}
          </div>
          <div>
            <span className="font-medium">Time Zone:</span>{' '}
            {TIME_ZONES.find(tz => tz.code === orgData.time_zone)?.name || 'Not selected'}
          </div>
        </div>
      </div>

      {/* Smart Code Preview */}
      {orgData.organization_code && orgData.industry_classification && (
        <div className="mt-4 p-3 border rounded bg-blue-50 dark:bg-blue-950/30">
          <h4 className="font-medium text-sm mb-2">Generated Smart Codes:</h4>
          <div className="text-xs font-mono space-y-1">
            <div>Organization: HERA.{orgData.industry_classification}.ORG.ENTITY.MAIN.v1</div>
            <div>Settings: HERA.{orgData.industry_classification}.UCR.CONFIG.ORG_SETTINGS.v1</div>
          </div>
        </div>
      )}
    </div>
  )
}
