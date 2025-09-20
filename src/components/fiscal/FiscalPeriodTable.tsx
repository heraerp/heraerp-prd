// ================================================================================
// FISCAL PERIOD TABLE - FISCAL COMPONENT
// Smart Code: HERA.UI.FISCAL.PERIOD_TABLE.v1
// Production-ready fiscal period display with lock/close actions
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar,
  Lock,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  CalendarDays
} from 'lucide-react'
import { FiscalPeriod } from '@/lib/schemas/fiscal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface FiscalPeriodTableProps {
  periods: FiscalPeriod[]
  isLoading: boolean
  error: Error | null
  onLock: (periodCode: string) => Promise<void>
  onClose: (periodCode: string) => Promise<void>
  isLocking: boolean
  isClosing: boolean
  canLock: (periodCode: string) => boolean
  canClose: (periodCode: string) => boolean
}

export function FiscalPeriodTable({
  periods,
  isLoading,
  error,
  onLock,
  onClose,
  isLocking,
  isClosing,
  canLock,
  canClose
}: FiscalPeriodTableProps) {
  const [selectedPeriods, setSelectedPeriods] = React.useState<Set<string>>(new Set())
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean
    action: 'lock' | 'close'
    periodCode: string
    periodName: string
  }>({ open: false, action: 'lock', periodCode: '', periodName: '' })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const openPeriods = periods.filter(p => p.status === 'open').map(p => p.code)
      setSelectedPeriods(new Set(openPeriods))
    } else {
      setSelectedPeriods(new Set())
    }
  }

  const handleSelectPeriod = (periodCode: string, checked: boolean) => {
    const newSelection = new Set(selectedPeriods)
    if (checked) {
      newSelection.add(periodCode)
    } else {
      newSelection.delete(periodCode)
    }
    setSelectedPeriods(newSelection)
  }

  const handleLockPeriod = async (periodCode: string) => {
    setConfirmDialog({
      open: true,
      action: 'lock',
      periodCode,
      periodName: periods.find(p => p.code === periodCode)?.code || periodCode
    })
  }

  const handleClosePeriod = async (periodCode: string) => {
    setConfirmDialog({
      open: true,
      action: 'close',
      periodCode,
      periodName: periods.find(p => p.code === periodCode)?.code || periodCode
    })
  }

  const handleConfirmAction = async () => {
    const { action, periodCode } = confirmDialog
    
    try {
      if (action === 'lock') {
        await onLock(periodCode)
      } else {
        await onClose(periodCode)
      }
      setConfirmDialog({ ...confirmDialog, open: false })
      setSelectedPeriods(new Set())
    } catch (error) {
      // Error handled by parent
    }
  }

  const handleBulkLock = async () => {
    const periodsToLock = Array.from(selectedPeriods).filter(canLock)
    
    if (periodsToLock.length === 0) return
    
    if (!window.confirm(`Lock ${periodsToLock.length} selected periods?`)) {
      return
    }

    for (const periodCode of periodsToLock) {
      try {
        await onLock(periodCode)
      } catch (error) {
        // Continue with next period
      }
    }
    setSelectedPeriods(new Set())
  }

  const handleBulkClose = async () => {
    const periodsToClose = Array.from(selectedPeriods).filter(canClose)
    
    if (periodsToClose.length === 0) return
    
    if (!window.confirm(`Close ${periodsToClose.length} selected periods? Ensure checklist is complete.`)) {
      return
    }

    for (const periodCode of periodsToClose) {
      try {
        await onClose(periodCode)
      } catch (error) {
        // Continue with next period
      }
    }
    setSelectedPeriods(new Set())
  }

  const getStatusBadge = (status: FiscalPeriod['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-violet-100 text-violet-800 border-violet-300">
          <Clock className="h-3 w-3 mr-1" />
          Open
        </Badge>
      case 'locked':
        return <Badge variant="outline" className="text-purple-700 border-purple-300">
          <Lock className="h-3 w-3 mr-1" />
          Locked
        </Badge>
      case 'closed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Closed
        </Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-600 mr-3" />
            <span className="text-gray-600 dark:text-gray-400">Loading fiscal periods...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          Failed to load fiscal periods: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (periods.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Fiscal Periods
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Click "Generate Periods" above to create fiscal periods for the year.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const canSelectAll = periods.some(p => p.status === 'open')
  const hasSelectedPeriods = selectedPeriods.size > 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fiscal Periods
            </CardTitle>
            
            {hasSelectedPeriods && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedPeriods.size} selected
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkLock}
                  disabled={isLocking || !Array.from(selectedPeriods).some(canLock)}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Lock
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkClose}
                  disabled={isClosing || !Array.from(selectedPeriods).some(canClose)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Close
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      checked={canSelectAll && selectedPeriods.size === periods.filter(p => p.status === 'open').length}
                      onCheckedChange={handleSelectAll}
                      disabled={!canSelectAll}
                      aria-label="Select all open periods"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
                    Period
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {periods.map((period, index) => {
                  const isEven = index % 2 === 0
                  const isSelectable = period.status === 'open'
                  const isSelected = selectedPeriods.has(period.code)
                  
                  return (
                    <tr 
                      key={period.code}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        isEven ? 'bg-gray-50/30 dark:bg-gray-800/20' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectPeriod(period.code, checked as boolean)}
                          disabled={!isSelectable}
                          aria-label={`Select period ${period.code}`}
                        />
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                          {period.code}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          {formatDate(period.from)}
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          {formatDate(period.to)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {getStatusBadge(period.status)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canLock(period.code) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLockPeriod(period.code)}
                              disabled={isLocking}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              {isLocking ? (
                                <Clock className="h-3 w-3 animate-spin" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          
                          {canClose(period.code) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClosePeriod(period.code)}
                              disabled={isClosing}
                              className="text-green-600 hover:text-green-700"
                            >
                              {isClosing ? (
                                <Clock className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                          )}

                          {period.status === 'closed' && (
                            <span className="text-sm text-gray-500 px-2">
                              {period.closed_at && `Closed ${new Date(period.closed_at).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'lock' ? (
                <>
                  <Lock className="h-5 w-5 text-purple-600" />
                  Lock Fiscal Period
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Close Fiscal Period
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'lock' ? (
                <>
                  Are you sure you want to lock period <strong>{confirmDialog.periodName}</strong>?
                  <br />
                  <br />
                  Locked periods prevent new transactions but can still be closed.
                  <br />
                  <br />
                  <Badge variant="outline" className="text-xs">
                    Smart Code: HERA.FIN.FISCAL.PERIOD.LOCK.V1
                  </Badge>
                </>
              ) : (
                <>
                  Are you sure you want to close period <strong>{confirmDialog.periodName}</strong>?
                  <br />
                  <br />
                  This will post all journal entries and prevent any further changes.
                  <br />
                  <br />
                  <Badge variant="outline" className="text-xs">
                    Smart Code: HERA.FIN.FISCAL.PERIOD.CLOSE.V1
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isLocking || isClosing}
              className={confirmDialog.action === 'lock' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isLocking || isClosing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {confirmDialog.action === 'lock' ? 'Lock Period' : 'Close Period'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}