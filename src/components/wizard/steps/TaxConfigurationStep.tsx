'use client'

import React, { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import type { WizardData } from '../BusinessSetupWizard'

interface TaxConfigurationStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

const DEFAULT_TAX_CODES = {
  AE: [
    {
      tax_code: 'VAT5',
      description: 'VAT 5%',
      rate_percent: 5,
      input_account: '1450000',
      output_account: '2250000',
      recoverable: true
    }
  ],
  GB: [
    {
      tax_code: 'VAT20',
      description: 'VAT Standard Rate',
      rate_percent: 20,
      input_account: '1450000',
      output_account: '2250000',
      recoverable: true
    },
    {
      tax_code: 'VAT5',
      description: 'VAT Reduced Rate',
      rate_percent: 5,
      input_account: '1450000',
      output_account: '2250000',
      recoverable: true
    }
  ],
  US: [
    {
      tax_code: 'ST8',
      description: 'Sales Tax 8%',
      rate_percent: 8,
      input_account: '1450000',
      output_account: '2250000',
      recoverable: false
    }
  ]
}

export const TaxConfigurationStep: React.FC<TaxConfigurationStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const taxData = data.taxConfiguration
  const country = data.organizationBasics.country

  React.useEffect(() => {
    if (
      taxData.tax_codes.length === 0 &&
      country &&
      DEFAULT_TAX_CODES[country as keyof typeof DEFAULT_TAX_CODES]
    ) {
      onChange({
        taxConfiguration: {
          tax_codes: DEFAULT_TAX_CODES[country as keyof typeof DEFAULT_TAX_CODES]
        }
      })
    }
  }, [country])

  const updateTaxCode = (index: number, field: string, value: any) => {
    const codes = [...taxData.tax_codes]
    codes[index] = { ...codes[index], [field]: value }
    onChange({ taxConfiguration: { tax_codes: codes } })
  }

  const addTaxCode = () => {
    const codes = [
      ...taxData.tax_codes,
      {
        tax_code: '',
        description: '',
        rate_percent: 0,
        input_account: '',
        output_account: '',
        recoverable: true
      }
    ]
    onChange({ taxConfiguration: { tax_codes: codes } })
  }

  const removeTaxCode = (index: number) => {
    const codes = taxData.tax_codes.filter((_, i) => i !== index)
    onChange({ taxConfiguration: { tax_codes: codes } })
  }

  return (
    <div className="space-y-6">
      {taxData.tax_codes.map((tax, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Tax Code {index + 1}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => removeTaxCode(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tax Code</Label>
              <Input
                value={tax.tax_code}
                onChange={e => updateTaxCode(index, 'tax_code', e.target.value)}
                placeholder="VAT20"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={tax.description}
                onChange={e => updateTaxCode(index, 'description', e.target.value)}
                placeholder="VAT Standard Rate"
              />
            </div>
            <div>
              <Label>Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={tax.rate_percent}
                onChange={e => updateTaxCode(index, 'rate_percent', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Input Tax Account</Label>
              <Input
                value={tax.input_account}
                onChange={e => updateTaxCode(index, 'input_account', e.target.value)}
                placeholder="1450000"
              />
            </div>
            <div>
              <Label>Output Tax Account</Label>
              <Input
                value={tax.output_account}
                onChange={e => updateTaxCode(index, 'output_account', e.target.value)}
                placeholder="2250000"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={tax.recoverable}
                onCheckedChange={checked => updateTaxCode(index, 'recoverable', checked)}
              />
              <Label>Recoverable</Label>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addTaxCode} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Tax Code
      </Button>
    </div>
  )
}
