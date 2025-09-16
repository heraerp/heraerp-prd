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
import { Switch } from '@/src/components/ui/switch'
import { Badge } from '@/src/components/ui/badge'
import type { WizardData } from '../BusinessSetupWizard'

interface CurrencySettingsStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'INR', 'SGD', 'JPY']

export const CurrencySettingsStep: React.FC<CurrencySettingsStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const currencyData = data.currencySettings
  const baseCurrency = data.organizationBasics.base_currency_code

  const updateField = (field: keyof typeof currencyData, value: any) => {
    onChange({
      currencySettings: { ...currencyData, [field]: value }
    })
  }

  const toggleCurrency = (currency: string) => {
    const allowed = currencyData.allowed_currencies.includes(currency)
      ? currencyData.allowed_currencies.filter(c => c !== currency)
      : [...currencyData.allowed_currencies, currency]
    updateField('allowed_currencies', allowed)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Base Currency (Read-only)</Label>
          <div className="p-2 bg-muted rounded border">
            <Badge variant="secondary">{baseCurrency}</Badge>
          </div>
        </div>

        <div>
          <Label>Default Rate Type</Label>
          <Select
            value={currencyData.default_rate_type}
            onValueChange={(value: any) => updateField('default_rate_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              <SelectItem value="SPOT" className="hera-select-item">
                Spot Rate
              </SelectItem>
              <SelectItem value="MONTH_END" className="hera-select-item">
                Month End
              </SelectItem>
              <SelectItem value="DAILY" className="hera-select-item">
                Daily Average
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Rate Tolerance (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={currencyData.rate_tolerance_percent}
            onChange={e => updateField('rate_tolerance_percent', parseFloat(e.target.value))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={currencyData.auto_calculate_differences}
            onCheckedChange={checked => updateField('auto_calculate_differences', checked)}
          />
          <Label>Auto-calculate exchange differences</Label>
        </div>
      </div>

      <div>
        <Label className="text-base">Additional Transaction Currencies</Label>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3">
          {CURRENCIES.filter(c => c !== baseCurrency).map(currency => (
            <div
              key={currency}
              className={`p-2 border rounded cursor-pointer text-center ${
                currencyData.allowed_currencies.includes(currency)
                  ? 'border-primary bg-primary/10'
                  : 'border-muted'
              }`}
              onClick={() => toggleCurrency(currency)}
            >
              <span className="text-sm font-medium">{currency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
