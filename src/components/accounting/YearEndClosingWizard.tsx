'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  ChevronRight,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import {
  createFiscalYearManager,
  type ClosingResult,
  type FiscalPeriod
} from '@/lib/dna/fiscal-year/universal-fiscal-year'
import {
  createFiscalCloseEngine,
  type FiscalCloseResult
} from '@/lib/dna/fiscal-year/fiscal-close-engine'
import { formatDate } from '@/lib/date-utils'

interface YearEndClosingWizardProps {
  className?: string
  fiscalYear?: number
  onComplete?: (result: ClosingResult) => void
  retainedEarningsAccountId?: string
  currentYearEarningsAccountId?: string
}

interface ChecklistItem {
  code: string
  name: string
  category: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  required: boolean
}

export function YearEndClosingWizard({
  className,
  fiscalYear = new Date().getFullYear(),
  onComplete
}: YearEndClosingWizardProps) {
  const { currentOrganization } = useHERAAuth()
  const [activeStep, setActiveStep] = useState<'review' | 'checklist' | 'closing' | 'complete'>(
    'review'
  )
  const [loading, setLoading] = useState(false)
  const [periods, setPeriods] = useState<FiscalPeriod[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [closingResult, setClosingResult] = useState<ClosingResult | null>(null)
  const [closePreview, setClosePreview] = useState<FiscalCloseResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [retainedEarningsAccountId, setRetainedEarningsAccountId] = useState('')
  const [currentYearEarningsAccountId, setCurrentYearEarningsAccountId] = useState('')

  const fiscalManager = currentOrganization ? createFiscalYearManager(currentOrganization.id) : null
  const fiscalCloseEngine = currentOrganization
    ? createFiscalCloseEngine(currentOrganization.id)
    : null

  // Load fiscal periods
  useEffect(() => {
    if (fiscalManager) {
      loadFiscalPeriods()
      loadChecklist()
    }
  }, [fiscalManager, fiscalYear])

  const loadFiscalPeriods = async () => {
    try {
      const periods = await fiscalManager!.getFiscalPeriods(fiscalYear)
      setPeriods(periods)
    } catch (error) {
      console.error('Failed to load fiscal periods:', error)
    }
  }

  const loadChecklist = async () => {
    // In real implementation, this would load from database
    setChecklist([
      {
        code: 'YEC-01',
        name: 'Reconcile all bank accounts',
        category: 'reconciliation',
        status: 'completed',
        required: true
      },
      {
        code: 'YEC-02',
        name: 'Complete physical inventory count',
        category: 'inventory',
        status: 'completed',
        required: true
      },
      {
        code: 'YEC-03',
        name: 'Review and adjust prepaid expenses',
        category: 'adjustments',
        status: 'pending',
        required: true
      },
      {
        code: 'YEC-04',
        name: 'Accrue unpaid expenses',
        category: 'adjustments',
        status: 'pending',
        required: true
      },
      {
        code: 'YEC-05',
        name: 'Calculate and book depreciation',
        category: 'adjustments',
        status: 'pending',
        required: true
      },
      {
        code: 'YEC-06',
        name: 'Review accounts receivable aging',
        category: 'receivables',
        status: 'pending',
        required: true
      },
      {
        code: 'YEC-07',
        name: 'Review accounts payable',
        category: 'payables',
        status: 'pending',
        required: true
      },
      {
        code: 'YEC-08',
        name: 'Reconcile intercompany accounts',
        category: 'reconciliation',
        status: 'pending',
        required: false
      },
      {
        code: 'YEC-09',
        name: 'Review tax accounts',
        category: 'tax',
        status: 'pending',
        required: true
      },
      {
        code: 'YEC-10',
        name: 'Generate trial balance',
        category: 'reporting',
        status: 'pending',
        required: true
      }
    ])
  }

  const updateChecklistItem = (code: string, status: ChecklistItem['status']) => {
    setChecklist(prev => prev.map(item => (item.code === code ? { ...item, status } : item)))
  }

  const executeClosing = async () => {
    if (!fiscalManager) return

    setLoading(true)
    setProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const result = await fiscalManager.executeYearEndClosing(
        fiscalYear,
        new Date(`${fiscalYear}-12-31`),
        {
          revenuePattern: '4%',
          expensePattern: '5%',
          includeOtherIncome: true,
          includeOtherExpenses: true
        }
      )

      clearInterval(progressInterval)
      setProgress(100)
      setClosingResult(result)
      setActiveStep('complete')

      if (onComplete) {
        onComplete(result)
      }
    } catch (error) {
      console.error('Year-end closing failed:', error)
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const openPeriods = periods.filter(p => p.status === 'open').length
  const currentPeriod = periods.find(p => p.status === 'current')
  const completedChecklist = checklist.filter(item => item.status === 'completed').length
  const requiredItems = checklist.filter(item => item.required)
  const requiredCompleted = requiredItems.filter(item => item.status === 'completed').length

  return (
    <Card className={cn('max-w-6xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-600" />
          Year-End Closing Wizard - Fiscal Year {fiscalYear}
        </CardTitle>
        <CardDescription>
          Complete the year-end closing process for your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeStep} onValueChange={(v: any) => setActiveStep(v)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="review" className="gap-2">
              <FileText className="w-4 h-4" />
              Review
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger
              value="closing"
              className="gap-2"
              disabled={requiredCompleted < requiredItems.length}
            >
              <Calculator className="w-4 h-4" />
              Closing
            </TabsTrigger>
            <TabsTrigger value="complete" className="gap-2" disabled={!closingResult}>
              <TrendingUp className="w-4 h-4" />
              Complete
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Fiscal Periods Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fiscal Periods Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Period</span>
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        {currentPeriod?.name || 'None'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Open Periods</span>
                      <Badge variant={openPeriods > 0 ? 'destructive' : 'success'}>
                        {openPeriods} periods
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Periods</span>
                      <span className="font-medium">{periods.length}</span>
                    </div>
                  </div>

                  {openPeriods > 0 && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {openPeriods} periods are still open. They will be closed during the
                        year-end process.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Checklist Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Checklist Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress
                      value={(completedChecklist / checklist.length) * 100}
                      className="h-2"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">
                        {completedChecklist} of {checklist.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Required Items</span>
                      <span className="font-medium">
                        {requiredCompleted} of {requiredItems.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {['reconciliation', 'adjustments', 'reporting'].map(category => {
                      const categoryItems = checklist.filter(item => item.category === category)
                      const completed = categoryItems.filter(
                        item => item.status === 'completed'
                      ).length
                      return (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-muted-foreground">{category}</span>
                          <Badge
                            variant={completed === categoryItems.length ? 'success' : 'secondary'}
                          >
                            {completed}/{categoryItems.length}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => loadFiscalPeriods()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setActiveStep('checklist')} className="gap-2">
                Continue to Checklist
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4 mt-6">
            <div className="space-y-4">
              {Object.entries(
                checklist.reduce(
                  (acc, item) => {
                    if (!acc[item.category]) acc[item.category] = []
                    acc[item.category].push(item)
                    return acc
                  },
                  {} as Record<string, ChecklistItem[]>
                )
              ).map(([category, items]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-base capitalize">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.code} className="flex items-center space-x-3">
                          <Checkbox
                            checked={item.status === 'completed'}
                            onCheckedChange={checked => {
                              updateChecklistItem(item.code, checked ? 'completed' : 'pending')
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'text-sm',
                                  item.status === 'completed' &&
                                    'line-through text-muted-foreground'
                                )}
                              >
                                {item.name}
                              </span>
                              {item.required && (
                                <Badge variant="outline" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              item.status === 'completed'
                                ? 'success'
                                : item.status === 'in_progress'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep('review')}>
                Back
              </Button>
              <Button
                onClick={() => setActiveStep('closing')}
                disabled={requiredCompleted < requiredItems.length}
                className="gap-2"
              >
                Proceed to Closing
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="closing" className="space-y-4 mt-6">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> The year-end closing process will:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Close all revenue and expense accounts</li>
                  <li>Transfer net income/loss to retained earnings</li>
                  <li>Mark all fiscal periods as closed</li>
                  <li>This action cannot be undone without proper authorization</li>
                </ul>
              </AlertDescription>
            </Alert>

            {loading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-center text-sm text-muted-foreground">
                      Processing year-end closing... {progress}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && (
              <div className="flex justify-center py-8">
                <Button size="lg" onClick={executeClosing} className="gap-2" variant="destructive">
                  <Lock className="w-5 h-5" />
                  Execute Year-End Closing
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="complete" className="space-y-4 mt-6">
            {closingResult && (
              <>
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Year-end closing completed successfully for fiscal year {fiscalYear}
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Revenue</span>
                          <span className="font-medium">
                            ${closingResult.totalRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Expenses</span>
                          <span className="font-medium">
                            ${closingResult.totalExpenses.toLocaleString()}
                          </span>
                        </div>
                        {closingResult.otherIncome !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Other Income</span>
                            <span className="font-medium">
                              ${closingResult.otherIncome.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Net Income</span>
                            <Badge
                              variant={closingResult.netIncome >= 0 ? 'success' : 'destructive'}
                              className="gap-1"
                            >
                              {closingResult.netIncome >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              ${Math.abs(closingResult.netIncome).toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Closing Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Closing Date</span>
                          <span className="font-medium">
                            {formatDate(new Date(closingResult.closingDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Journal Entry</span>
                          <Badge variant="outline">{closingResult.closingEntryId.slice(-8)}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Periods Closed</span>
                          <span className="font-medium">{closingResult.periodsClosed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant="success">Completed</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                  <Button
                    onClick={() => {
                      // Reset wizard for next year
                      setActiveStep('review')
                      setClosingResult(null)
                      loadFiscalPeriods()
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Close Another Year
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
