'use client'
/**
 * HERA POS Daily Cash Close UI Component
 * Smart Code: HERA.POS.DAILY.CASH.CLOSE.UI.V1
 *
 * Complete UI for POS daily cash close operations
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Printer,
  Calendar,
  Clock,
  Users,
  Package,
  ShoppingCart,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Lock,
  Unlock,
  Calculator,
  Hash,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ----------------------------- Types & Interfaces ------------------------------------

interface ShiftSummary {
  shiftId: string
  operatorName: string
  openTime: Date
  closeTime?: Date
  status: 'open' | 'closed'
  salesCount: number
  totalSales: number
  cashExpected: number
  cashCounted?: number
  variance?: number
}

interface DenominationCount {
  denomination: number
  count: number
  total: number
}

interface PaymentSummary {
  method: string
  count: number
  amount: number
  percentage: number
}

interface CardBatchSummary {
  acquirer: string
  authCount: number
  totalAmount: number
  status: 'pending' | 'submitted' | 'settled'
  batchId?: string
}

// ----------------------------- Main Component ------------------------------------

export default function DailyCashClose() {
  const [selectedShift, setSelectedShift] = useState<string>('')
  const [cashCounted, setCashCounted] = useState<number>(0)
  const [denominations, setDenominations] = useState<DenominationCount[]>([
    { denomination: 200, count: 0, total: 0 },
    { denomination: 100, count: 0, total: 0 },
    { denomination: 50, count: 0, total: 0 },
    { denomination: 20, count: 0, total: 0 },
    { denomination: 10, count: 0, total: 0 },
    { denomination: 5, count: 0, total: 0 },
    { denomination: 1, count: 0, total: 0 }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showEODModal, setShowEODModal] = useState(false)

  // Mock data - would come from API
  const shifts: ShiftSummary[] = [
    {
      shiftId: 'SHIFT-20250115-001',
      operatorName: 'Sarah Ahmed',
      openTime: new Date('2025-01-15T06:00:00'),
      closeTime: new Date('2025-01-15T14:00:00'),
      status: 'closed',
      salesCount: 42,
      totalSales: 5250.0,
      cashExpected: 2480.0,
      cashCounted: 2500.0,
      variance: 20.0
    },
    {
      shiftId: 'SHIFT-20250115-002',
      operatorName: 'Ahmed Hassan',
      openTime: new Date('2025-01-15T14:00:00'),
      status: 'open',
      salesCount: 38,
      totalSales: 4800.0,
      cashExpected: 2150.0
    }
  ]

  const paymentSummary: PaymentSummary[] = [
    { method: 'Cash', count: 45, amount: 3200.0, percentage: 25.6 },
    { method: 'Visa', count: 28, amount: 5100.0, percentage: 40.8 },
    { method: 'Mastercard', count: 18, amount: 3600.0, percentage: 28.8 },
    { method: 'Digital Wallet', count: 8, amount: 600.0, percentage: 4.8 }
  ]

  const cardBatches: CardBatchSummary[] = [
    {
      acquirer: 'Network International',
      authCount: 46,
      totalAmount: 8700.0,
      status: 'pending',
      batchId: 'BATCH-NI-20250115-001'
    }
  ]

  // Update cash total when denominations change
  useEffect(() => {
    const total = denominations.reduce((sum, d) => sum + d.total, 0)
    setCashCounted(total)
  }, [denominations])

  const updateDenomination = (index: number, count: number) => {
    const updated = [...denominations]
    updated[index].count = count
    updated[index].total = count * updated[index].denomination
    setDenominations(updated)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const handleShiftClose = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsProcessing(false)
    alert('Shift closed successfully!')
  }

  const handleCardBatch = async (batch: CardBatchSummary) => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsProcessing(false)
    alert(`Batch ${batch.batchId} submitted successfully!`)
  }

  const handleEODProcess = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsProcessing(false)
    setShowEODModal(false)
    alert('End of Day process completed successfully!')
  }

  const openShift = shifts.find(s => s.status === 'open')
  const closedShifts = shifts.filter(s => s.status === 'closed')
  const totalDaySales = shifts.reduce((sum, s) => sum + s.totalSales, 0)
  const totalTransactions = shifts.reduce((sum, s) => sum + s.salesCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Daily Cash Close
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-AE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="w-4 h-4 mr-2" />
            {new Date().toLocaleTimeString()}
          </Badge>
          <Button
            onClick={() => setShowEODModal(true)}
            disabled={openShift !== undefined}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Lock className="w-4 h-4 mr-2" />
            End of Day
          </Button>
        </div>
      </div>

      {/* Day Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                Total Sales
              </span>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalDaySales)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
              +12.5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                Transactions
              </span>
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalTransactions}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(totalDaySales / totalTransactions)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                Active Shifts
              </span>
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{openShift ? 1 : 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{closedShifts.length} closed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                Card Batches
              </span>
              <CreditCard className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold">{cardBatches.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Ready to submit</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shifts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="batches">Card Batches</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Shifts Tab */}
        <TabsContent value="shifts">
          {openShift && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have an open shift that needs to be closed before running End of Day.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {shifts.map(shift => (
              <Card
                key={shift.shiftId}
                className={cn('transition-all', shift.status === 'open' && 'border-orange-500')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{shift.shiftId}</CardTitle>
                      <CardDescription>{shift.operatorName}</CardDescription>
                    </div>
                    <Badge variant={shift.status === 'open' ? 'default' : 'secondary'}>
                      {shift.status === 'open' ? (
                        <>
                          <Unlock className="w-3 h-3 mr-1" /> Open
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" /> Closed
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Open Time
                      </p>
                      <p className="font-medium">{shift.openTime.toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Sales
                      </p>
                      <p className="font-medium">{shift.salesCount} transactions</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Total
                      </p>
                      <p className="font-medium">{formatCurrency(shift.totalSales)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Cash Expected
                      </p>
                      <p className="font-medium">{formatCurrency(shift.cashExpected)}</p>
                    </div>
                  </div>

                  {shift.status === 'open' ? (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Count Cash</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {denominations.map((denom, index) => (
                            <div key={denom.denomination} className="space-y-1">
                              <label className="text-sm text-muted-foreground dark:text-muted-foreground">
                                AED {denom.denomination}
                              </label>
                              <Input
                                type="number"
                                min="0"
                                value={denom.count}
                                onChange={e =>
                                  updateDenomination(index, parseInt(e.target.value) || 0)
                                }
                                className="h-9"
                              />
                              <p className="text-xs text-muted-foreground">
                                = {formatCurrency(denom.total)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Total Counted
                          </p>
                          <p className="text-2xl font-bold">{formatCurrency(cashCounted)}</p>
                          {cashCounted !== 0 && (
                            <p
                              className={cn(
                                'text-sm mt-1',
                                cashCounted > shift.cashExpected
                                  ? 'text-green-600'
                                  : cashCounted < shift.cashExpected
                                    ? 'text-red-600'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {cashCounted > shift.cashExpected ? (
                                <>
                                  <ArrowUpRight className="w-3 h-3 inline" /> Over by{' '}
                                  {formatCurrency(cashCounted - shift.cashExpected)}
                                </>
                              ) : cashCounted < shift.cashExpected ? (
                                <>
                                  <ArrowDownRight className="w-3 h-3 inline" /> Short by{' '}
                                  {formatCurrency(shift.cashExpected - cashCounted)}
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 inline" /> Balanced
                                </>
                              )}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={handleShiftClose}
                          disabled={isProcessing || cashCounted === 0}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" /> Close Shift
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Cash Variance
                          </p>
                          <p
                            className={cn(
                              'text-lg font-semibold',
                              shift.variance && shift.variance > 0
                                ? 'text-green-600'
                                : shift.variance && shift.variance < 0
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                            )}
                          >
                            {shift.variance && shift.variance > 0 ? '+' : ''}
                            {formatCurrency(shift.variance || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Closed at
                          </p>
                          <p className="font-medium">{shift.closeTime?.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Summary</CardTitle>
              <CardDescription>Breakdown of all payment methods for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentSummary.map(payment => (
                  <div key={payment.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          payment.method === 'Cash' && 'bg-green-100 dark:bg-green-900',
                          payment.method === 'Visa' && 'bg-blue-100 dark:bg-blue-900',
                          payment.method === 'Mastercard' && 'bg-orange-100 dark:bg-orange-900',
                          payment.method === 'Digital Wallet' && 'bg-purple-100 dark:bg-purple-900'
                        )}
                      >
                        {payment.method === 'Cash' ? (
                          <Banknote className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{payment.method}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.count} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">Total Payments</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(paymentSummary.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Card Batches Tab */}
        <TabsContent value="batches">
          <div className="space-y-4">
            {cardBatches.map(batch => (
              <Card key={batch.batchId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{batch.acquirer}</CardTitle>
                      <CardDescription>{batch.batchId}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        batch.status === 'pending'
                          ? 'outline'
                          : batch.status === 'submitted'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {batch.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Authorizations
                      </p>
                      <p className="text-xl font-semibold">{batch.authCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="text-xl font-semibold">{formatCurrency(batch.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Settlement Date
                      </p>
                      <p className="text-xl font-semibold">Tomorrow</p>
                    </div>
                  </div>

                  {batch.status === 'pending' && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleCardBatch(batch)}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" /> Submit Batch
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Receipt className="w-8 h-8 text-purple-600" />
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Z Report</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Daily sales summary report
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">VAT Report</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Tax collection summary
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Calculator className="w-8 h-8 text-green-600" />
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Cash Reconciliation</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Detailed cash movement report
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Sales Analytics</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Performance insights
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* End of Day Modal */}
      {showEODModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>End of Day Process</CardTitle>
              <CardDescription>
                This will close the business day and generate all reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All shifts must be closed and card batches submitted before running EOD.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    All shifts closed
                  </span>
                  <Badge variant="secondary">Ready</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Card batches submitted
                  </span>
                  <Badge variant="secondary">Ready</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Generate Z Report
                  </span>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    Lock business day
                  </span>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEODModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEODProcess}
                  disabled={isProcessing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" /> Run End of Day
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
