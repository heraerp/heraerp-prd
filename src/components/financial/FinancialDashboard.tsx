'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Target,
  PieChart,
  BarChart3,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Minus,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

// Types for financial data
interface FinancialOverview {
  total_revenue: number
  total_orders: number
  average_order_value: number
  revenue_growth_percent: number
  gross_profit: number
  gross_margin_percent: number
  total_costs: number
}

interface DailySale {
  date: string
  revenue: number
  orders: number
  items: number
}

interface TopProduct {
  name: string
  code: string
  totalSold: number
  totalRevenue: number
  averagePrice: number
  orderCount: number
}

interface PeakHour {
  hour: number
  orders: number
  revenue: number
}

interface StatusBreakdown {
  status: string
  count: number
  revenue: number
}

interface Insight {
  type: string
  message: string
  trend: 'positive' | 'negative' | 'neutral'
}

interface FinancialReport {
  period: {
    start_date: string
    end_date: string
    days: number
  }
  overview: FinancialOverview
  daily_sales: DailySale[]
  top_products: TopProduct[]
  peak_hours: PeakHour[]
  status_breakdown: StatusBreakdown[]
  hourly_pattern: Array<{ hour: number; orders: number; revenue: number }>
  insights: Insight[]
}

export function FinancialDashboard() {
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Load financial data
  const loadFinancialData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end
      })

      console.log('📊 Loading financial report...')
      const response = await fetch(`/api/v1/financial/reports?${params}`)
      const result = await response.json()

      if (result.success) {
        setReport(result.data)
        setLastUpdated(new Date())
        console.log('✅ Financial report loaded:', result.data.overview)
      } else {
        setError(result.message || 'Failed to load financial data')
      }
    } catch (err) {
      setError('Error loading financial data')
      console.error('❌ Financial dashboard error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFinancialData()
  }, [dateRange.start, dateRange.end])

  // Helper functions
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200'
      case 'negative': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Loading financial reports...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Financial Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFinancialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive financial analytics powered by HERA's universal transaction system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={loadFinancialData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Report Period:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Badge variant="secondary">{report.period.days} days</Badge>
          </div>
          <button className="flex items-center space-x-2 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.overview.total_revenue)}</p>
              <div className="flex items-center mt-1">
                {getTrendIcon(report.overview.revenue_growth_percent >= 0 ? 'positive' : 'negative')}
                <span className={`text-sm ml-1 ${report.overview.revenue_growth_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(report.overview.revenue_growth_percent)}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{report.overview.total_orders.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">
                Avg: {formatCurrency(report.overview.average_order_value)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gross Profit</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.overview.gross_profit)}</p>
              <div className="flex items-center mt-1">
                <Target className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-600">
                  {report.overview.gross_margin_percent.toFixed(1)}% margin
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Costs</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.overview.total_costs)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {((report.overview.total_costs / report.overview.total_revenue) * 100).toFixed(1)}% of revenue
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getTrendColor(insight.trend)}`}>
              <div className="flex items-start space-x-3">
                {getTrendIcon(insight.trend)}
                <div>
                  <p className="text-sm font-medium capitalize">{insight.type.replace('_', ' ')}</p>
                  <p className="text-sm mt-1">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily Sales Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Daily Sales Trend</h3>
          <Badge variant="outline">{report.daily_sales.length} days</Badge>
        </div>
        <div className="space-y-4">
          {report.daily_sales.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-900">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{day.orders} orders</span>
                  <span>{day.items} items</span>
                </div>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(day.revenue)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Products */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
          <Award className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="space-y-4">
          {report.top_products.slice(0, 5).map((product, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(product.totalRevenue)}</p>
                <p className="text-sm text-gray-600">{product.totalSold} sold</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Peak Hours */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Peak Business Hours</h3>
          <Clock className="w-5 h-5 text-blue-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.peak_hours.map((hour, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {hour.hour}:00
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {hour.orders} orders • {formatCurrency(hour.revenue)}
                </p>
                <Badge variant="secondary" className="mt-2">
                  Rank #{index + 1}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* HERA Architecture Info */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            HERA Universal Financial Intelligence
          </h3>
          <p className="text-sm text-green-800 mb-4">
            This comprehensive financial dashboard demonstrates HERA's universal transaction architecture in action:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-green-700">
            <div className="bg-white/50 p-3 rounded-lg">
              <strong>universal_transactions</strong><br />
              All orders analyzed as standardized business transactions
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <strong>universal_transaction_lines</strong><br />
              Product performance calculated from transaction line items
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <strong>core_entities</strong><br />
              Menu items linked to financial performance through entity relationships
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">
            Same architecture supports healthcare billing, manufacturing costs, and professional services invoicing
          </p>
        </div>
      </Card>
    </div>
  )
}