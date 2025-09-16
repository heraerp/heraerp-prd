// ================================================================================
// CLOSE ACTIONS BAR - FISCAL COMPONENT
// Smart Code: HERA.UI.FISCAL.CLOSE_ACTIONS_BAR.v1
// Production-ready fiscal close actions with Sacred Six storage
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { 
  Lock,
  CheckCircle,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  FileText,
  Info
} from 'lucide-react'
import { FiscalPeriod, YearCloseRequest } from '@/src/lib/schemas/fiscal'
import { useToast } from '@/src/components/ui/use-toast'

interface CloseActionsBarProps {
  currentPeriod?: FiscalPeriod
  isChecklistComplete: boolean
  areAllPeriodsClosed: (year?: string) => boolean
  canCloseYear: (year: string) => boolean
  retainedEarningsAccount?: string
  onClosePeriod: (periodCode: string) => Promise<void>
  onCloseYear: (request: YearCloseRequest) => Promise<void>
  isClosingPeriod: boolean
  isClosingYear: boolean
}

export function CloseActionsBar({
  currentPeriod,
  isChecklistComplete,
  areAllPeriodsClosed,
  canCloseYear,
  retainedEarningsAccount,
  onClosePeriod,
  onCloseYear,
  isClosingPeriod,
  isClosingYear
}: CloseActionsBarProps) {
  const { toast } = useToast()
  const [showYearCloseDialog, setShowYearCloseDialog] = React.useState(false)
  const [yearCloseForm, setYearCloseForm] = React.useState({
    fiscal_year: new Date().getFullYear().toString(),
    retained_earnings_account: retainedEarningsAccount || '3200',
    confirm_all_periods_closed: false,
    notes: ''
  })

  const currentYear = new Date().getFullYear().toString()
  const canClosePeriod = currentPeriod && 
    (currentPeriod.status === 'open' || currentPeriod.status === 'locked') && 
    isChecklistComplete

  const canCloseCurrentYear = canCloseYear(currentYear)

  const handleClosePeriod = async () => {
    if (!currentPeriod) return

    try {
      await onClosePeriod(currentPeriod.code)
      toast({
        title: "Period Closed",
        description: `Period ${currentPeriod.code} has been closed successfully. Journal entries posted.`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Close Failed",
        description: error instanceof Error ? error.message : "Failed to close period",
        variant: "destructive"
      })
    }
  }

  const handleCloseYear = async () => {
    if (!yearCloseForm.confirm_all_periods_closed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm all periods are closed",
        variant: "destructive"
      })
      return
    }

    try {
      await onCloseYear({
        fiscal_year: yearCloseForm.fiscal_year,
        retained_earnings_account: yearCloseForm.retained_earnings_account,
        confirm_all_periods_closed: yearCloseForm.confirm_all_periods_closed,
        notes: yearCloseForm.notes
      })
      
      toast({
        title: "Year Closed",
        description: `Fiscal year ${yearCloseForm.fiscal_year} closed. Retained earnings posted to account ${yearCloseForm.retained_earnings_account}.`,
        variant: "default"
      })
      
      setShowYearCloseDialog(false)
    } catch (error) {
      toast({
        title: "Year Close Failed",
        description: error instanceof Error ? error.message : "Failed to close fiscal year",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            
            {/* Current Period Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <Calendar className="h-8 w-8 text-violet-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Current Period
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {currentPeriod ? currentPeriod.code : 'No Period'}
                  </div>
                  {currentPeriod && (
                    <div className="flex items-center gap-2 mt-1">
                      {currentPeriod.status === 'open' && (
                        <Badge className="bg-violet-100 text-violet-800 border-violet-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Open
                        </Badge>
                      )}
                      {currentPeriod.status === 'locked' && (
                        <Badge variant="outline" className="text-purple-700 border-purple-300">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                      {currentPeriod.status === 'closed' && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Closed
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist Status */}
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Checklist Status
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {isChecklistComplete ? 'Complete' : 'Incomplete'}
                  </div>
                  <div className="mt-1">
                    {isChecklistComplete ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        All items checked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Items pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleClosePeriod}
                disabled={!canClosePeriod || isClosingPeriod}
                className="min-w-40"
              >
                {isClosingPeriod ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Closing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Close Period
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowYearCloseDialog(true)}
                disabled={!canCloseCurrentYear || isClosingYear}
                className="min-w-40"
              >
                {isClosingYear ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Closing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Close Fiscal Year
                  </>
                )}
              </Button>
            </div>

          </div>

          {/* Help Text */}
          {!canClosePeriod && currentPeriod && currentPeriod.status !== 'closed' && (
            <Alert className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                Complete all checklist items before closing the period.
              </AlertDescription>
            </Alert>
          )}

          {!canCloseCurrentYear && areAllPeriodsClosed() && !retainedEarningsAccount && (
            <Alert className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                Configure retained earnings account before closing the fiscal year.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Year Close Dialog */}
      <Dialog open={showYearCloseDialog} onOpenChange={setShowYearCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Close Fiscal Year
            </DialogTitle>
            <DialogDescription>
              Close fiscal year and post retained earnings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fiscal_year">Fiscal Year</Label>
              <Input
                id="fiscal_year"
                value={yearCloseForm.fiscal_year}
                onChange={(e) => setYearCloseForm({
                  ...yearCloseForm,
                  fiscal_year: e.target.value
                })}
                placeholder="2025"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retained_earnings">Retained Earnings Account *</Label>
              <Input
                id="retained_earnings"
                value={yearCloseForm.retained_earnings_account}
                onChange={(e) => setYearCloseForm({
                  ...yearCloseForm,
                  retained_earnings_account: e.target.value
                })}
                placeholder="3200"
                className="font-mono"
                required
              />
              <p className="text-sm text-gray-500">
                P&L balances will be posted to this account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={yearCloseForm.notes}
                onChange={(e) => setYearCloseForm({
                  ...yearCloseForm,
                  notes: e.target.value
                })}
                placeholder="Year-end closing notes..."
              />
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/30">
              <input
                type="checkbox"
                id="confirm_close"
                className="mt-1"
                checked={yearCloseForm.confirm_all_periods_closed}
                onChange={(e) => setYearCloseForm({
                  ...yearCloseForm,
                  confirm_all_periods_closed: e.target.checked
                })}
              />
              <label htmlFor="confirm_close" className="text-sm text-orange-800 dark:text-orange-200">
                I confirm all periods are closed and reviewed. I understand this action will post all P&L balances to retained earnings and cannot be reversed.
              </label>
            </div>

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  Audit Trail
                </div>
                <div className="text-blue-700 dark:text-blue-300 mt-1">
                  Smart Code: HERA.FIN.FISCAL.YEAR.CLOSE.v1
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowYearCloseDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCloseYear}
              disabled={
                !yearCloseForm.fiscal_year || 
                !yearCloseForm.retained_earnings_account ||
                !yearCloseForm.confirm_all_periods_closed ||
                isClosingYear
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isClosingYear ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Closing Year...
                </>
              ) : (
                'Close Fiscal Year'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}