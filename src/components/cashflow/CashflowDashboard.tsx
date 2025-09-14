'use client'

// ================================================================================
// HERA UNIVERSAL CASHFLOW DASHBOARD
// Complete cashflow analysis and reporting interface
// Smart Code: HERA.UI.CF.DASHBOARD.v1
// ================================================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar,
  Download, RefreshCw, AlertTriangle, CheckCircle,
  BarChart3, PieChart as PieChartIcon, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'

// ================================================================================
// INTERFACES
// ================================================================================

interface CashflowDashboardProps {
  organizationId: string
  currency?: string
}

interface CashflowStatement {
  period_start: string
  period_end: string
  currency: string
  method: 'direct' | 'indirect'
  operating_activities: CashflowActivity[]
  investing_activities: CashflowActivity[]
  financing_activities: CashflowActivity[]
  net_change_in_cash: number
  cash_beginning: number
  cash_ending: number
}

interface CashflowActivity {
  category: 'operating' | 'investing' | 'financing'
  description: string
  amount: number
  account_code?: string
  line_items?: CashflowLineItem[]
  is_subtotal?: boolean
  is_total?: boolean
}

interface CashflowLineItem {
  description: string
  amount: number
  account_code: string
  transaction_count: number
}

// ================================================================================
// MAIN DASHBOARD COMPONENT
// ================================================================================

export default function CashflowDashboard({ organizationId, currency = 'AED' }: CashflowDashboardProps) {
  const [currentStatement, setCurrentStatement] = useState<CashflowStatement | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [trendAnalysis, setTrendAnalysis] = useState<any>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [selectedMethod, setSelectedMethod] = useState<'direct' | 'indirect'>('direct')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCashflowData()
  }, [organizationId, selectedPeriod, selectedMethod])

  const loadCashflowData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get period dates based on selection
      const { startDate, endDate } = getPeriodDates(selectedPeriod)

      // Load current cashflow statement
      const statementResponse = await fetch(
        `/api/v1/cashflow?action=generate_statement&organization_id=${organizationId}&start_date=${startDate}&end_date=${endDate}&method=${selectedMethod}&currency=${currency}`
      )
      
      if (!statementResponse.ok) {
        throw new Error('Failed to load cashflow statement')
      }
      
      const statementData = await statementResponse.json()
      setCurrentStatement(statementData.data)

      // Load trend analysis
      const trendsResponse = await fetch(
        `/api/v1/cashflow?action=analyze_trends&organization_id=${organizationId}&periods=6&currency=${currency}`
      )
      
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setTrendAnalysis(trendsData.data)
        
        // Transform trend data for charts
        const chartData = trendsData.data.trend_analysis.periods_analyzed
        setHistoricalData(Array.isArray(chartData) ? chartData : [])
      }

    } catch (err: any) {
      setError(err.message)
      console.error('Error loading cashflow data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodDates = (period: string) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    switch (period) {
      case 'current_month':
        return {
          startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        }
      case 'last_month':
        return {
          startDate: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
          endDate: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
        }
      case 'quarter':
        const quarterStart = Math.floor(currentMonth / 3) * 3
        return {
          startDate: new Date(currentYear, quarterStart, 1).toISOString().split('T')[0],
          endDate: new Date(currentYear, quarterStart + 3, 0).toISOString().split('T')[0]
        }
      case 'year':
        return {
          startDate: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          endDate: new Date(currentYear, 11, 31).toISOString().split('T')[0]
        }
      default:
        return {
          startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const exportCashflowStatement = async () => {
    if (!currentStatement) return

    // Create CSV content
    const csvContent = generateCashflowCSV(currentStatement)
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cashflow-statement-${currentStatement.period_start}-to-${currentStatement.period_end}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading && !currentStatement) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cashflow data...</p>
        </div>
      </div>
    )
  }

  if (error && !currentStatement) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadCashflowData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            💰 Cashflow Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive cashflow analysis and reporting
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'direct' | 'indirect')}>
            <SelectTrigger className="w-[140px]">
              <BarChart3 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct Method</SelectItem>
              <SelectItem value="indirect">Indirect Method</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportCashflowStatement} variant="outline" disabled={!currentStatement}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={loadCashflowData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {currentStatement && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CashflowMetricCard
              title="Operating Cash Flow"
              value={currentStatement.operating_activities.find(a => a.is_total)?.amount || 0}
              currency={currency}
              trend={trendAnalysis?.trend_analysis?.operating_cf_trend?.direction}
              icon={<Activity className="h-5 w-5" />}
              color="blue"
            />
            
            <CashflowMetricCard
              title="Investing Cash Flow"
              value={currentStatement.investing_activities.find(a => a.is_total)?.amount || 0}
              currency={currency}
              trend={null}
              icon={<TrendingUp className="h-5 w-5" />}
              color="green"
            />
            
            <CashflowMetricCard
              title="Financing Cash Flow"
              value={currentStatement.financing_activities.find(a => a.is_total)?.amount || 0}
              currency={currency}
              trend={null}
              icon={<BarChart3 className="h-5 w-5" />}
              color="purple"
            />
            
            <CashflowMetricCard
              title="Cash Position"
              value={currentStatement.cash_ending}
              currency={currency}
              trend={trendAnalysis?.trend_analysis?.cash_balance_trend?.direction}
              icon={<DollarSign className="h-5 w-5" />}
              color="amber"
            />
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="statement" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="statement">Statement</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Cashflow Statement Tab */}
            <TabsContent value="statement">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CashflowCategoryCard
                  title="Operating Activities"
                  activities={currentStatement.operating_activities}
                  currency={currency}
                  color="blue"
                />
                <CashflowCategoryCard
                  title="Investing Activities"
                  activities={currentStatement.investing_activities}
                  currency={currency}
                  color="green"
                />
                <CashflowCategoryCard
                  title="Financing Activities"
                  activities={currentStatement.financing_activities}
                  currency={currency}
                  color="purple"
                />
              </div>

              {/* Cash Reconciliation */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Cash Reconciliation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Beginning Cash</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(currentStatement.cash_beginning)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400">Net Change</p>
                      <p className={`text-2xl font-bold ${
                        currentStatement.net_change_in_cash >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(currentStatement.net_change_in_cash)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">Ending Cash</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(currentStatement.cash_ending)}
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="text-sm text-amber-600 dark:text-amber-400">Method</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                        {currentStatement.method}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cashflow Breakdown Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cashflow Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getCashflowBreakdownData(currentStatement)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getCashflowBreakdownData(currentStatement).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Key Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {generateCashflowInsights(currentStatement, trendAnalysis).map((insight, index) => (
                        <div key={index} className={`p-3 rounded-lg border-l-4 ${insight.color}`}>
                          <div className="flex items-start gap-2">
                            {insight.icon}
                            <div>
                              <p className="font-medium">{insight.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Forecast Tab */}
            <TabsContent value="forecast">
              <CashflowForecast organizationId={organizationId} currency={currency} />
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends">
              <CashflowTrends organizationId={organizationId} currency={currency} historicalData={historicalData} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

// ================================================================================
// METRIC CARD COMPONENT
// ================================================================================

interface CashflowMetricCardProps {
  title: string
  value: number
  currency: string
  trend?: 'increasing' | 'decreasing' | 'stable' | null
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'amber'
}

function CashflowMetricCard({ title, value, currency, trend, icon, color }: CashflowMetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  }

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    amber: 'text-amber-600 dark:text-amber-400'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card className={`${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-white dark:bg-gray-800 ${iconColors[color]}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className={`text-2xl font-bold ${
                value >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(value)}
              </p>
            </div>
          </div>
          
          {trend && (
            <div className="text-right">
              {trend === 'increasing' && <ArrowUpRight className="h-5 w-5 text-green-600" />}
              {trend === 'decreasing' && <ArrowDownRight className="h-5 w-5 text-red-600" />}
              <Badge variant={trend === 'increasing' ? 'default' : trend === 'decreasing' ? 'destructive' : 'secondary'}>
                {trend}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ================================================================================
// CATEGORY CARD COMPONENT  
// ================================================================================

interface CashflowCategoryCardProps {
  title: string
  activities: CashflowActivity[]
  currency: string
  color: 'blue' | 'green' | 'purple'
}

function CashflowCategoryCard({ title, activities, currency, color }: CashflowCategoryCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 dark:border-blue-800',
    green: 'border-green-200 dark:border-green-800',
    purple: 'border-purple-200 dark:border-purple-800'
  }

  const headerColors = {
    blue: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20',
    purple: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const totalAmount = activities.find(a => a.is_total)?.amount || 0

  return (
    <Card className={`${colorClasses[color]}`}>
      <CardHeader className={`${headerColors[color]} -m-6 mb-6 p-6 rounded-t-lg`}>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className={`text-lg font-bold ${
            totalAmount >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(totalAmount)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.filter(a => !a.is_total).map((activity, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div>
              <p className={`font-medium ${activity.is_subtotal ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                {activity.description}
              </p>
              {activity.account_code && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Account: {activity.account_code}
                </p>
              )}
            </div>
            <p className={`font-semibold ${
              activity.amount >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
            } ${activity.is_subtotal ? 'text-lg' : ''}`}>
              {formatCurrency(activity.amount)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ================================================================================
// FORECAST COMPONENT
// ================================================================================

interface CashflowForecastProps {
  organizationId: string
  currency: string
}

function CashflowForecast({ organizationId, currency }: CashflowForecastProps) {
  const [forecastData, setForecastData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadForecastData()
  }, [organizationId])

  const loadForecastData = async () => {
    try {
      const response = await fetch(
        `/api/v1/cashflow?action=generate_forecast&organization_id=${organizationId}&forecast_months=12&currency=${currency}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const chartData = data.data.map((statement: any, index: number) => ({
          month: new Date(statement.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          operating: statement.operating_activities.find((a: any) => a.is_total)?.amount || 0,
          investing: statement.investing_activities.find((a: any) => a.is_total)?.amount || 0,
          financing: statement.financing_activities.find((a: any) => a.is_total)?.amount || 0,
          net_change: statement.net_change_in_cash,
          cash_position: statement.cash_ending
        }))
        setForecastData(chartData)
      }
    } catch (error) {
      console.error('Error loading forecast data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>12-Month Cashflow Forecast</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Projected cashflow based on historical trends and growth assumptions
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={Array.isArray(forecastData) ? forecastData : (forecastData && typeof forecastData === 'object' ? Object.values(forecastData as any) : [])}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => [new Intl.NumberFormat('en-AE', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0
              }).format(value), '']} />
              <Legend />
              <Line type="monotone" dataKey="operating" stroke="#3b82f6" strokeWidth={2} name="Operating CF" />
              <Line type="monotone" dataKey="investing" stroke="#10b981" strokeWidth={2} name="Investing CF" />
              <Line type="monotone" dataKey="financing" stroke="#8b5cf6" strokeWidth={2} name="Financing CF" />
              <Line type="monotone" dataKey="cash_position" stroke="#f59e0b" strokeWidth={3} name="Cash Position" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================================================
// TRENDS COMPONENT
// ================================================================================

interface CashflowTrendsProps {
  organizationId: string
  currency: string
  historicalData: any[]
}

function CashflowTrends({ organizationId, currency, historicalData }: CashflowTrendsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cashflow Trends</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Historical cashflow performance over the last 6 periods
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={Array.isArray(historicalData) ? historicalData : (historicalData && typeof historicalData === 'object' ? Object.values(historicalData as any) : [])}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value: any) => [new Intl.NumberFormat('en-AE', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0
              }).format(value), '']} />
              <Legend />
              <Area type="monotone" dataKey="operating_cf" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Operating CF" />
              <Area type="monotone" dataKey="investing_cf" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Investing CF" />
              <Area type="monotone" dataKey="financing_cf" stackId="3" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Financing CF" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

function getCashflowBreakdownData(statement: CashflowStatement) {
  const operating = statement.operating_activities.find(a => a.is_total)?.amount || 0
  const investing = statement.investing_activities.find(a => a.is_total)?.amount || 0
  const financing = statement.financing_activities.find(a => a.is_total)?.amount || 0

  return [
    { name: 'Operating', value: Math.abs(operating), color: '#3b82f6' },
    { name: 'Investing', value: Math.abs(investing), color: '#10b981' },
    { name: 'Financing', value: Math.abs(financing), color: '#8b5cf6' }
  ].filter(item => item.value > 0)
}

function generateCashflowInsights(statement: CashflowStatement, trendAnalysis: any) {
  const insights = []
  
  const operatingCF = statement.operating_activities.find(a => a.is_total)?.amount || 0
  const netChange = statement.net_change_in_cash
  
  if (operatingCF > 0) {
    insights.push({
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: 'Positive Operating Cash Flow',
      description: 'Your business is generating positive cash from core operations.',
      color: 'border-green-500 bg-green-50 dark:bg-green-900/20'
    })
  } else {
    insights.push({
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      title: 'Negative Operating Cash Flow',
      description: 'Your business is using cash for operations. Consider reviewing revenue and costs.',
      color: 'border-red-500 bg-red-50 dark:bg-red-900/20'
    })
  }
  
  if (netChange > 0) {
    insights.push({
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      title: 'Growing Cash Position',
      description: 'Overall cash position increased during this period.',
      color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    })
  }
  
  if (statement.cash_ending < 0) {
    insights.push({
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      title: 'Negative Cash Balance',
      description: 'Immediate attention required for cash management.',
      color: 'border-red-500 bg-red-50 dark:bg-red-900/20'
    })
  }

  return insights
}

function generateCashflowCSV(statement: CashflowStatement): string {
  const lines = [
    'Cashflow Statement',
    `Period: ${statement.period_start} to ${statement.period_end}`,
    `Method: ${statement.method}`,
    `Currency: ${statement.currency}`,
    '',
    'Category,Description,Amount'
  ]

  // Add operating activities
  statement.operating_activities.forEach(activity => {
    lines.push(`Operating,"${activity.description}",${activity.amount}`)
  })

  lines.push('')

  // Add investing activities
  statement.investing_activities.forEach(activity => {
    lines.push(`Investing,"${activity.description}",${activity.amount}`)
  })

  lines.push('')

  // Add financing activities
  statement.financing_activities.forEach(activity => {
    lines.push(`Financing,"${activity.description}",${activity.amount}`)
  })

  lines.push('')
  lines.push(`Summary,Beginning Cash,${statement.cash_beginning}`)
  lines.push(`Summary,Net Change in Cash,${statement.net_change_in_cash}`)
  lines.push(`Summary,Ending Cash,${statement.cash_ending}`)

  return lines.join('\n')
}
