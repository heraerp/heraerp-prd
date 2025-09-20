// ================================================================================
// SALES POLICY FORM - SETTINGS COMPONENT
// Smart Code: HERA.UI.SETTINGS.SALES_POLICY_FORM.v1
// Production-ready sales policy configuration form with validation
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calculator, 
  Save,
  Percent,
  DollarSign,
  Receipt,
  CreditCard,
  AlertCircle,
  Info,
  Clock
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SalesPolicy } from '@/lib/schemas/settings'

interface SalesPolicyFormProps {
  policy?: SalesPolicy | null
  onSubmit: (policy: SalesPolicy) => Promise<void>
  isSubmitting: boolean
}

const CURRENCY_OPTIONS = [
  { value: 'AED', label: 'AED - UAE Dirham', symbol: 'د.إ' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', symbol: 'ر.س' },
  { value: 'QAR', label: 'QAR - Qatari Riyal', symbol: 'ر.ق' },
  { value: 'KWD', label: 'KWD - Kuwaiti Dinar', symbol: 'د.ك' },
  { value: 'BHD', label: 'BHD - Bahraini Dinar', symbol: '.د.ب' },
  { value: 'OMR', label: 'OMR - Omani Rial', symbol: 'ر.ع.' }
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash', icon: DollarSign },
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { value: 'digital_wallet', label: 'Digital Wallet', icon: Receipt },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Receipt }
]

export function SalesPolicyForm({ policy, onSubmit, isSubmitting }: SalesPolicyFormProps) {
  const form = useForm<SalesPolicy>({
    resolver: zodResolver(SalesPolicy),
    defaultValues: policy || {
      vat_rate: 0.05,
      commission_rate: 0.35,
      include_tips_in_commission: false,
      tips_enabled: true,
      auto_calculate_tax: true,
      tax_inclusive_pricing: false,
      discount_policy: {
        max_discount_percent: 20,
        requires_manager_approval: true,
        approval_threshold_percent: 10
      },
      payment_methods: ['cash', 'card'],
      currency: 'AED'
    }
  })

  // Reset form when policy changes
  React.useEffect(() => {
    if (policy) {
      form.reset(policy)
    }
  }, [policy, form])

  const handleSubmit = async (data: SalesPolicy) => {
    try {
      await onSubmit({
        ...data,
        updated_at: new Date().toISOString(),
        updated_by: 'current_user' // TODO: Get from auth context
      })
    } catch (error) {
      // Error handled by parent component
    }
  }

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`
  }

  const watchedValues = {
    vatRate: form.watch('vat_rate'),
    commissionRate: form.watch('commission_rate'),
    tipsEnabled: form.watch('tips_enabled'),
    includeTipsInCommission: form.watch('include_tips_in_commission'),
    paymentMethods: form.watch('payment_methods'),
    currency: form.watch('currency'),
    maxDiscount: form.watch('discount_policy.max_discount_percent'),
    approvalThreshold: form.watch('discount_policy.approval_threshold_percent')
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      
      {/* Tax Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Tax Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vat_rate" className="flex items-center justify-between">
                <span>VAT Rate</span>
                <Badge variant="outline" className="text-blue-600">
                  {formatPercentage(watchedValues.vatRate)}
                </Badge>
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="vat_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  {...form.register('vat_rate', { 
                    valueAsNumber: true,
                    validate: (value) => value >= 0 && value <= 1 || 'VAT rate must be between 0% and 100%'
                  })}
                  className="flex-1"
                />
                <Percent className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Enter as decimal (0.05 = 5%)
              </p>
              {form.formState.errors.vat_rate && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.vat_rate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={watchedValues.currency}
                onValueChange={(value) => form.setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{currency.symbol}</span>
                        <span>{currency.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Auto-calculate Tax</Label>
              <p className="text-sm text-gray-500">Automatically add VAT to service prices</p>
            </div>
            <Switch
              checked={form.watch('auto_calculate_tax')}
              onCheckedChange={(checked) => form.setValue('auto_calculate_tax', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Tax-inclusive Pricing</Label>
              <p className="text-sm text-gray-500">Prices shown include tax (VAT is part of the price)</p>
            </div>
            <Switch
              checked={form.watch('tax_inclusive_pricing')}
              onCheckedChange={(checked) => form.setValue('tax_inclusive_pricing', checked)}
            />
          </div>

        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Commission Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="commission_rate" className="flex items-center justify-between">
              <span>Commission Rate</span>
              <Badge variant="outline" className="text-green-600">
                {formatPercentage(watchedValues.commissionRate)}
              </Badge>
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                {...form.register('commission_rate', { 
                  valueAsNumber: true,
                  validate: (value) => value >= 0 && value <= 1 || 'Commission rate must be between 0% and 100%'
                })}
                className="flex-1"
              />
              <Percent className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Enter as decimal (0.35 = 35%)
            </p>
            {form.formState.errors.commission_rate && (
              <p className="text-sm text-red-600">
                {form.formState.errors.commission_rate.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Enable Tips</Label>
              <p className="text-sm text-gray-500">Allow customers to add tips to payments</p>
            </div>
            <Switch
              checked={watchedValues.tipsEnabled}
              onCheckedChange={(checked) => form.setValue('tips_enabled', checked)}
            />
          </div>

          {watchedValues.tipsEnabled && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label>Include Tips in Commission</Label>
                <p className="text-sm text-gray-500">Calculate commission on tips as well as service amount</p>
              </div>
              <Switch
                checked={watchedValues.includeTipsInCommission}
                onCheckedChange={(checked) => form.setValue('include_tips_in_commission', checked)}
              />
            </div>
          )}

        </CardContent>
      </Card>

      {/* Discount Policy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Discount Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_discount" className="flex items-center justify-between">
                <span>Maximum Discount</span>
                <Badge variant="outline" className="text-orange-600">
                  {watchedValues.maxDiscount}%
                </Badge>
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="max_discount"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  {...form.register('discount_policy.max_discount_percent', { 
                    valueAsNumber: true
                  })}
                  className="flex-1"
                />
                <Percent className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Maximum discount percentage allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval_threshold" className="flex items-center justify-between">
                <span>Approval Threshold</span>
                <Badge variant="outline" className="text-purple-600">
                  {watchedValues.approvalThreshold}%
                </Badge>
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="approval_threshold"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  {...form.register('discount_policy.approval_threshold_percent', { 
                    valueAsNumber: true
                  })}
                  className="flex-1"
                />
                <Percent className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Discounts above this require manager approval
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Require Manager Approval</Label>
              <p className="text-sm text-gray-500">Manager approval needed for discounts above threshold</p>
            </div>
            <Switch
              checked={form.watch('discount_policy.requires_manager_approval')}
              onCheckedChange={(checked) => form.setValue('discount_policy.requires_manager_approval', checked)}
            />
          </div>

        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAYMENT_METHOD_OPTIONS.map((method) => {
              const isSelected = watchedValues.paymentMethods.includes(method.value)
              return (
                <div
                  key={method.value}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-violet-300 bg-violet-50 dark:bg-violet-950/30' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const current = watchedValues.paymentMethods
                    if (isSelected) {
                      form.setValue('payment_methods', current.filter(m => m !== method.value))
                    } else {
                      form.setValue('payment_methods', [...current, method.value])
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <method.icon className={`h-4 w-4 ${isSelected ? 'text-violet-600' : 'text-gray-400'}`} />
                    <span className={isSelected ? 'text-violet-900 dark:text-violet-100 font-medium' : ''}>
                      {method.label}
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded border-2 ${
                    isSelected 
                      ? 'bg-violet-600 border-violet-600' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {watchedValues.paymentMethods.length === 0 && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                At least one payment method must be selected.
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>

      {/* Smart Code Display (Audit Slot) */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200">
              Changes will be logged with Smart Code:
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              HERA.ORG.SETTINGS.SALES_POLICY.UPDATE.V1
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || watchedValues.paymentMethods.length === 0}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Policy
            </>
          )}
        </Button>
      </div>

    </form>
  )
}