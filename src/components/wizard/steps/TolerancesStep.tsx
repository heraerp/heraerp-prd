'use client'

import React from 'react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import type { WizardData } from '../BusinessSetupWizard'

interface TolerancesStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

export const TolerancesStep: React.FC<TolerancesStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const tolerancesData = data.tolerances

  const updateField = (field: keyof typeof tolerancesData, value: any) => {
    onChange({
      tolerances: { ...tolerancesData, [field]: value }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posting Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>User Posting Limit ({data.organizationBasics.base_currency_code})</Label>
              <Input
                type="number"
                value={tolerancesData.user_posting_limit}
                onChange={e => updateField('user_posting_limit', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Approval Required Above ({data.organizationBasics.base_currency_code})</Label>
              <Input
                type="number"
                value={tolerancesData.require_approval_above}
                onChange={e => updateField('require_approval_above', parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Tolerances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Payment Tolerance Amount ({data.organizationBasics.base_currency_code})</Label>
              <Input
                type="number"
                step="0.01"
                value={tolerancesData.payment_tolerance_amount}
                onChange={e => updateField('payment_tolerance_amount', parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>AI Confidence Threshold (0.0 - 1.0)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={tolerancesData.ai_confidence_threshold}
                onChange={e => updateField('ai_confidence_threshold', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum confidence required for auto-posting
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={tolerancesData.allow_negative_inventory}
                onCheckedChange={checked => updateField('allow_negative_inventory', checked)}
              />
              <Label>Allow Negative Inventory</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
