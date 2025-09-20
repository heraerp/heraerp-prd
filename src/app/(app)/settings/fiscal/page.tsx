// ================================================================================
// FISCAL SETTINGS PAGE - SETTINGS
// Smart Code: HERA.UI.SETTINGS.FISCAL.v1
// Production-ready fiscal year and period management using Sacred Six storage
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
  FileText,
  DollarSign,
  Clock,
  Plus
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useFiscalApi } from '@/lib/api/fiscal'
import { FiscalPeriodTable } from '@/components/fiscal/FiscalPeriodTable'
import { FiscalCloseChecklist } from '@/components/fiscal/FiscalCloseChecklist'
import { CloseActionsBar } from '@/components/fiscal/CloseActionsBar'
import { FiscalConfig } from '@/lib/schemas/fiscal'
import { useToast } from '@/components/ui/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export default function FiscalSettingsPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()

  const fiscal = useFiscalApi(currentOrganization?.id || '')

  const form = useForm<FiscalConfig>({
    resolver: zodResolver(FiscalConfig),
    defaultValues: fiscal.config || {
      fiscal_year_start: `${new Date().getFullYear()}-01-01`,
      retained_earnings_account: '3200',
      lock_after_days: 7
    }
  })

  // Reset form when config loads
  React.useEffect(() => {
    if (fiscal.config) {
      form.reset(fiscal.config)
    }
  }, [fiscal.config, form])

  const handleSaveConfig = async (data: FiscalConfig) => {
    try {
      await fiscal.saveConfig.mutateAsync(data)
      toast({
        title: "Fiscal Configuration Saved",
        description: "Your fiscal year settings have been updated successfully.",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save fiscal configuration",
        variant: "destructive"
      })
    }
  }

  const handleGeneratePeriods = async () => {
    if (!fiscal.config?.fiscal_year_start) return

    if (fiscal.periods.length > 0) {
      if (!window.confirm('This will replace all existing periods. Are you sure?')) {
        return
      }
    }

    try {
      await fiscal.generatePeriods(fiscal.config.fiscal_year_start)
      toast({
        title: "Periods Generated",
        description: `12 fiscal periods created starting from ${fiscal.config.fiscal_year_start}`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate fiscal periods",
        variant: "destructive"
      })
    }
  }

  const fiscalStats = React.useMemo(() => {
    const periods = fiscal.periods
    return {
      total: periods.length,
      open: periods.filter(p => p.status === 'open').length,
      locked: periods.filter(p => p.status === 'locked').length,
      closed: periods.filter(p => p.status === 'closed').length,
      currentPeriod: fiscal.getCurrentPeriod()
    }
  }, [fiscal.periods, fiscal.getCurrentPeriod])

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to configure fiscal settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Calendar className="h-7 w-7 text-violet-600" />
              Fiscal Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure fiscal years, periods, and closing procedures for {currentOrganization.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-violet-700 border-violet-300">
                {currentOrganization.name}
              </Badge>
              {fiscalStats.currentPeriod && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Current: {fiscalStats.currentPeriod.code}
                </Badge>
              )}
            </div>
          </div>

          {/* Fiscal Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Fiscal Year Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSaveConfig)} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal_year_start">Fiscal Year Start</Label>
                    <Input
                      id="fiscal_year_start"
                      type="date"
                      {...form.register('fiscal_year_start')}
                      aria-describedby="fiscal_year_start_error"
                    />
                    {form.formState.errors.fiscal_year_start && (
                      <p id="fiscal_year_start_error" className="text-sm text-red-600">
                        {form.formState.errors.fiscal_year_start.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retained_earnings_account">Retained Earnings Account</Label>
                    <Input
                      id="retained_earnings_account"
                      {...form.register('retained_earnings_account')}
                      placeholder="3200"
                      className="font-mono"
                      aria-describedby="retained_earnings_account_error"
                    />
                    {form.formState.errors.retained_earnings_account && (
                      <p id="retained_earnings_account_error" className="text-sm text-red-600">
                        {form.formState.errors.retained_earnings_account.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lock_after_days">Auto-lock After Days</Label>
                    <Input
                      id="lock_after_days"
                      type="number"
                      {...form.register('lock_after_days', { valueAsNumber: true })}
                      min="0"
                      max="90"
                      aria-describedby="lock_after_days_help lock_after_days_error"
                    />
                    <p id="lock_after_days_help" className="text-sm text-gray-500">
                      0-90 days after period end
                    </p>
                    {form.formState.errors.lock_after_days && (
                      <p id="lock_after_days_error" className="text-sm text-red-600">
                        {form.formState.errors.lock_after_days.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePeriods}
                    disabled={!fiscal.config?.fiscal_year_start || fiscal.saveConfig.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Periods
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={fiscal.saveConfig.isPending || !form.formState.isDirty}
                  >
                    {fiscal.saveConfig.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>

          {/* Period Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Periods</div>
                    <div className="text-2xl font-bold">{fiscalStats.total}</div>
                  </div>
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-violet-50 dark:bg-violet-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</div>
                    <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {fiscalStats.open}
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Locked</div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {fiscalStats.locked}
                    </div>
                  </div>
                  <Lock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Closed</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {fiscalStats.closed}
                    </div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Fiscal Periods Table */}
          <FiscalPeriodTable 
            periods={fiscal.periods}
            isLoading={fiscal.isPeriodsLoading}
            error={fiscal.periodsError}
            onLock={fiscal.lockPeriod.mutateAsync}
            onClose={fiscal.closePeriod.mutateAsync}
            isLocking={fiscal.lockPeriod.isPending}
            isClosing={fiscal.closePeriod.isPending}
            canLock={fiscal.canLockPeriod}
            canClose={fiscal.canClosePeriod}
          />

        </div>

        {/* Right Sidebar - Checklist */}
        <div className="space-y-6">
          
          <FiscalCloseChecklist
            checklist={fiscal.checklist}
            isLoading={fiscal.isChecklistLoading}
            error={fiscal.checklistError}
            onItemToggle={fiscal.updateChecklistItem}
            isUpdating={fiscal.saveChecklist.isPending}
          />

          {/* Smart Code Info */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  Audit Trail
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div>• Config: HERA.FIN.FISCAL.CONFIG.UPDATE.V1</div>
                  <div>• Lock: HERA.FIN.FISCAL.PERIOD.LOCK.V1</div>
                  <div>• Close: HERA.FIN.FISCAL.PERIOD.CLOSE.V1</div>
                  <div>• Year: HERA.FIN.FISCAL.YEAR.CLOSE.V1</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

        </div>

      </div>

      {/* Bottom Actions Bar */}
      <div className="mt-6">
        <CloseActionsBar
          currentPeriod={fiscalStats.currentPeriod}
          isChecklistComplete={fiscal.isChecklistComplete()}
          areAllPeriodsClosed={fiscal.areAllPeriodsClosed}
          canCloseYear={fiscal.canCloseYear}
          retainedEarningsAccount={fiscal.config?.retained_earnings_account}
          onClosePeriod={fiscal.closePeriod.mutateAsync}
          onCloseYear={fiscal.closeYear.mutateAsync}
          isClosingPeriod={fiscal.closePeriod.isPending}
          isClosingYear={fiscal.closeYear.isPending}
        />
      </div>

    </div>
  )
}