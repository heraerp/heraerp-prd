'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, 
  Circle, 
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Calendar,
  FileText,
  BarChart3,
  Download,
  RefreshCw,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { fiscalDashboard } from '@/lib/fiscal/fiscal-dashboard-service'
import { smartCodeReporting } from '@/lib/financial/smart-code-reporting'
import type { FiscalPeriod, ClosingStep, FinancialKPIs, BranchConsolidation } from '@/lib/fiscal/fiscal-dashboard-service'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Period status color mapping
const statusColors = {
  open: { bg: 'bg-green-100', text: 'text-green-800', icon: Unlock },
  current: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock },
  closed: { bg: 'bg-red-100', text: 'text-red-800', icon: Lock }
}

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function FiscalDashboardPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01')
  const [periodStatus, setPeriodStatus] = useState<FiscalPeriod | null>(null)
  const [closingSteps, setClosingSteps] = useState<ClosingStep[]>([])
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null)
  const [branchData, setBranchData] = useState<{ branches: BranchConsolidation[]; consolidated: FinancialKPIs } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadDashboardData()
    }
  }, [currentOrganization, selectedPeriod])

  const loadDashboardData = async () => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      // Load period status
      const status = await fiscalDashboard.getFiscalPeriodStatus(
        currentOrganization.id,
        selectedPeriod
      )
      setPeriodStatus(status)

      // Load closing checklist
      const steps = await fiscalDashboard.getClosingChecklist(
        currentOrganization.id,
        selectedPeriod
      )
      setClosingSteps(steps)

      // Load KPIs
      const periodDates = getPeriodDates(selectedPeriod)
      const kpiData = await fiscalDashboard.calculateKPIs(
        currentOrganization.id,
        periodDates.start,
        periodDates.end
      )
      setKpis(kpiData)

      // Load branch consolidation
      const branches = await fiscalDashboard.getBranchConsolidation(
        currentOrganization.id,
        periodDates.start,
        periodDates.end
      )
      setBranchData(branches)
    } catch (error) {
      console.error('Failed to load fiscal dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodDates = (period: string): { start: string; end: string } => {
    const [year, month] = period.split('-')
    const start = new Date(parseInt(year), parseInt(month) - 1, 1)
    const end = new Date(parseInt(year), parseInt(month), 0)
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const updateClosingStep = async (step: ClosingStep, newStatus: 'in_progress' | 'completed') => {
    if (!currentOrganization?.id) return

    setRefreshing(true)
    try {
      await fiscalDashboard.updateClosingStep(
        currentOrganization.id,
        selectedPeriod,
        step.step_code,
        newStatus,
        'current_user_id', // Would come from auth context
        `Updated via fiscal dashboard`
      )
      
      // Reload data
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to update step:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'in_progress': return <Clock className="w-5 h-5 text-amber-600" />
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading fiscal dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fiscal Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage financial periods and closing process</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-01">January 2025</SelectItem>
              <SelectItem value="2024-12">December 2024</SelectItem>
              <SelectItem value="2024-11">November 2024</SelectItem>
              <SelectItem value="2024-Q4">Q4 2024</SelectItem>
              <SelectItem value="2024">Year 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={loadDashboardData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Period Status Panel */}
      {periodStatus && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Period Status</CardTitle>
                <CardDescription>
                  {periodStatus.start_date} to {periodStatus.end_date}
                </CardDescription>
              </div>
              <Badge className={`${statusColors[periodStatus.status].bg} ${statusColors[periodStatus.status].text}`}>
                {React.createElement(statusColors[periodStatus.status].icon, { className: 'w-4 h-4 mr-1 inline' })}
                {periodStatus.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Closing Progress</span>
              <span className="text-sm font-medium">{periodStatus.closing_progress}%</span>
            </div>
            <Progress value={periodStatus.closing_progress} className="mt-2" />
            {periodStatus.status === 'current' && periodStatus.closing_progress < 100 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This period has ended but the closing process is not complete.
                  Please complete all steps to close the period.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="kpis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="closing">Closing Process</TabsTrigger>
          <TabsTrigger value="branches">Branch Analysis</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* KPIs Tab */}
        <TabsContent value="kpis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpis.revenue)}</div>
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +12.5% from last period
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpis.expenses)}</div>
                    <div className="flex items-center mt-2 text-sm text-red-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +5.2% from last period
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpis.net_income)}</div>
                    <div className="text-sm text-gray-600 mt-2">
                      Margin: {kpis.gross_margin?.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Retained Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpis.retained_earnings)}</div>
                    <div className="text-sm text-gray-600 mt-2">
                      YTD Accumulation
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Revenue vs Expenses Chart */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Revenue vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { month: 'Oct', revenue: 45000, expenses: 32000 },
                    { month: 'Nov', revenue: 52000, expenses: 35000 },
                    { month: 'Dec', revenue: 58000, expenses: 38000 },
                    { month: 'Jan', revenue: kpis?.revenue || 0, expenses: kpis?.expenses || 0 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Closing Process Tab */}
        <TabsContent value="closing">
          <Card>
            <CardHeader>
              <CardTitle>Closing Checklist</CardTitle>
              <CardDescription>
                Complete all steps to close the financial period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {closingSteps.map((step, index) => (
                  <div
                    key={step.step_code}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      step.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm">
                        {getStepIcon(step.status)}
                      </div>
                      <div>
                        <div className="font-medium">{step.description}</div>
                        <div className="text-sm text-gray-600">Step {step.step_number} of 8</div>
                        {step.completed_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Completed on {new Date(step.completed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {step.status === 'pending' && index === closingSteps.findIndex(s => s.status === 'pending') && (
                        <Button
                          size="sm"
                          onClick={() => updateClosingStep(step, 'in_progress')}
                          disabled={refreshing}
                        >
                          Start
                        </Button>
                      )}
                      {step.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateClosingStep(step, 'completed')}
                          disabled={refreshing}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branch Analysis Tab */}
        <TabsContent value="branches">
          {branchData && (
            <>
              {/* Branch KPIs Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Branch</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={branchData.branches.map(b => ({
                          name: b.branch_name.split(' ')[0],
                          revenue: b.kpis.revenue
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="revenue" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profit Margin by Branch</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={branchData.branches.map((b, i) => ({
                            name: b.branch_name.split(' ')[0],
                            value: b.kpis.net_income,
                            percentage: ((b.kpis.net_income / b.kpis.revenue) * 100).toFixed(1)
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {branchData.branches.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Consolidated View */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Consolidated Financial Summary</CardTitle>
                  <CardDescription>All branches combined</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total Revenue</div>
                      <div className="text-2xl font-bold mt-1">
                        {formatCurrency(branchData.consolidated.revenue)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total Expenses</div>
                      <div className="text-2xl font-bold mt-1">
                        {formatCurrency(branchData.consolidated.expenses)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Net Income</div>
                      <div className="text-2xl font-bold mt-1">
                        {formatCurrency(branchData.consolidated.net_income)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Profit Margin</div>
                      <div className="text-2xl font-bold mt-1">
                        {branchData.consolidated.gross_margin?.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Profit & Loss</CardTitle>
                    <CardDescription>Income statement for {selectedPeriod}</CardDescription>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate P&L Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Balance Sheet</CardTitle>
                    <CardDescription>Financial position as of period end</CardDescription>
                  </div>
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Balance Sheet
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Cash Flow</CardTitle>
                    <CardDescription>Cash movements for the period</CardDescription>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Cash Flow
                </Button>
              </CardContent>
            </Card>
          </div>

          <Alert className="mt-6">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              All reports are generated dynamically based on smart code classifications.
              No GL account mappings required - the system automatically categorizes transactions.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}