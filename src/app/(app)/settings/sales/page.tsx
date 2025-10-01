// ================================================================================
// SALES SETTINGS PAGE - VAT, COMMISSION, TIPS
// Smart Code: HERA.UI.SETTINGS.SALES.V1
// Production-ready sales policy configuration using Sacred Six storage
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Calculator,
  Percent,
  DollarSign,
  Receipt,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useOrgSettings } from '@/lib/api/orgSettings'
import { SalesPolicyForm } from '@/components/settings/SalesPolicyForm'
import { SalesPolicy } from '@/lib/schemas/settings'
import { useToast } from '@/components/ui/use-toast'

export default function SalesSettingsPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()

  const { salesPolicy, isSalesPolicyLoading, salesPolicyError, saveSalesPolicy } = useOrgSettings(
    currentOrganization?.id || ''
  )

  const handleSaveSalesPolicy = async (policy: SalesPolicy) => {
    try {
      await saveSalesPolicy.mutateAsync(policy)
      toast({
        title: 'Sales Settings Updated',
        description:
          'Your sales policy has been saved successfully. Changes will reflect immediately in POS and reports.',
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save sales settings',
        variant: 'destructive'
      })
    }
  }

  // Calculate derived values for display
  const derivedValues = React.useMemo(() => {
    if (!salesPolicy) return null

    return {
      vatDisplay: `${Math.round(salesPolicy.vat_rate * 100)}%`,
      commissionDisplay: `${Math.round(salesPolicy.commission_rate * 100)}%`,
      vatAmount: (amount: number) => amount * salesPolicy.vat_rate,
      commissionAmount: (amount: number) => amount * salesPolicy.commission_rate,
      netAmount: (amount: number) => amount - amount * salesPolicy.vat_rate,
      exampleCalculations: {
        saleAmount: 100,
        vatAmount: 100 * salesPolicy.vat_rate,
        commissionAmount: 100 * salesPolicy.commission_rate,
        tipsAmount: 15,
        commissionOnTips: salesPolicy.include_tips_in_commission
          ? 15 * salesPolicy.commission_rate
          : 0
      }
    }
  }, [salesPolicy])

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to configure sales settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calculator className="h-7 w-7 text-green-600" />
            Sales Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure VAT rates, commission structure, and payment policies for{' '}
            {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-violet-700 border-violet-300">
              {currentOrganization.name}
            </Badge>
            {salesPolicy && (
              <Badge variant="outline" className="text-green-700 border-green-300">
                Policy Active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Current Policy Summary */}
      {derivedValues && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    VAT Rate
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {derivedValues.vatDisplay}
                    <Percent className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <Receipt className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Commission Rate
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {derivedValues.commissionDisplay}
                    <Percent className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tips in Commission
                  </div>
                  <div className="text-2xl font-bold">
                    {salesPolicy?.include_tips_in_commission ? 'Yes' : 'No'}
                  </div>
                </div>
                <Calculator className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Currency
                  </div>
                  <div className="text-2xl font-bold">{salesPolicy?.currency || 'AED'}</div>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Example Calculations */}
      {derivedValues && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Example Calculations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm font-medium mb-3">Example: AED 100 Service Sale</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Service Amount:</span>
                    <span className="font-medium">AED 100.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({derivedValues.vatDisplay}):</span>
                    <span className="font-medium">
                      AED {derivedValues.exampleCalculations.vatAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total with VAT:</span>
                    <span className="font-bold">
                      AED{' '}
                      {(
                        derivedValues.exampleCalculations.saleAmount +
                        derivedValues.exampleCalculations.vatAmount
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Commission ({derivedValues.commissionDisplay}):</span>
                    <span className="font-medium">
                      AED {derivedValues.exampleCalculations.commissionAmount.toFixed(2)}
                    </span>
                  </div>
                  {salesPolicy?.tips_enabled && (
                    <>
                      <div className="flex justify-between">
                        <span>Tips:</span>
                        <span className="font-medium">
                          AED {derivedValues.exampleCalculations.tipsAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission on Tips:</span>
                        <span className="font-medium">
                          AED {derivedValues.exampleCalculations.commissionOnTips.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Commission:</span>
                    <span className="font-bold text-green-600">
                      AED{' '}
                      {(
                        derivedValues.exampleCalculations.commissionAmount +
                        derivedValues.exampleCalculations.commissionOnTips
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isSalesPolicyLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-green-600 mr-3" />
              <span className="text-gray-600 dark:text-gray-400">Loading sales settings...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {salesPolicyError && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load sales settings: {salesPolicyError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Sales Policy Form */}
      {!isSalesPolicyLoading && !salesPolicyError && (
        <SalesPolicyForm
          policy={salesPolicy}
          onSubmit={handleSaveSalesPolicy}
          isSubmitting={saveSalesPolicy.isPending}
        />
      )}

      {/* Impact Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium text-blue-800 dark:text-blue-200">Settings Impact</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              • VAT and commission rates apply immediately to new transactions • POS system will
              automatically calculate taxes and commissions • Financial reports will reflect these
              settings • All changes are logged for audit purposes
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
