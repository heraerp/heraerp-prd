'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Brain,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Settings,
  RefreshCw,
  FileText,
  Zap,
  Target,
  Award
} from 'lucide-react'
import {
  AIFinanceIntegrator,
  AIPostingMetrics,
  SmartCodePerformance,
  formatCurrency,
  calculatePostingAccuracy,
  getConfidenceDescription
} from '@/lib/ai-finance-integrator'

interface AIFinanceDashboardProps {
  organizationId: string
}

export function AIFinanceDashboard({ organizationId }: AIFinanceDashboardProps) {
  const [metrics, setMetrics] = useState<AIPostingMetrics | null>(null)
  const [smartCodePerformance, setSmartCodePerformance] = useState<SmartCodePerformance[]>([])
  const [pendingReview, setPendingReview] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(30)

  const aiIntegrator = new AIFinanceIntegrator(organizationId)

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [metricsData, performanceData, pendingData] = await Promise.all([
        aiIntegrator.getPostingMetrics(selectedPeriod),
        aiIntegrator.getSmartCodePerformance(selectedPeriod),
        aiIntegrator.getPendingReviewTransactions()
      ])

      setMetrics(metricsData)
      setSmartCodePerformance(performanceData)
      setPendingReview(pendingData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-emerald-600'
    if (value >= thresholds.warning) return 'text-amber-600'
    return 'text-red-600'
  }

  const getProgressColor = (value: number) => {
    if (value >= 85) return 'bg-emerald-500'
    if (value >= 70) return 'bg-amber-500'
    return 'bg-red-500'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading AI Finance Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            AI Finance Integration
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated journal posting with PostgreSQL AI intelligence
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(parseInt(e.target.value))}
            className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Auto-Posting Rate */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-foreground" />
                </div>
                <Badge
                  className={`${getMetricColor(metrics.auto_posting_rate, { good: 85, warning: 70 })}`}
                >
                  {metrics.auto_posting_rate >= 85
                    ? 'Excellent'
                    : metrics.auto_posting_rate >= 70
                      ? 'Good'
                      : 'Needs Improvement'}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">Auto-Posting Rate</p>
                <p className="text-3xl font-bold text-blue-900">{metrics.auto_posting_rate}%</p>
                <Progress
                  value={metrics.auto_posting_rate}
                  className="h-2"
                  style={{ background: getProgressColor(metrics.auto_posting_rate) }}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Confidence */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-foreground" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">
                  {getConfidenceDescription(metrics.average_confidence_score)}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-600">Avg Confidence</p>
                <p className="text-3xl font-bold text-emerald-900">
                  {(metrics.average_confidence_score * 100).toFixed(1)}%
                </p>
                <Progress
                  value={metrics.average_confidence_score * 100}
                  className="h-2 bg-emerald-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Total Transactions */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-foreground" />
                </div>
                <Badge className="bg-purple-100 text-purple-800">{selectedPeriod} days</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-600">Total Transactions</p>
                <p className="text-3xl font-bold text-purple-900">
                  {metrics.total_transactions.toLocaleString()}
                </p>
                <div className="flex items-center text-sm text-purple-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {metrics.auto_posted_count} auto-posted
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Review */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-foreground" />
                </div>
                <Badge
                  className={
                    pendingReview.length > 10
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }
                >
                  {pendingReview.length > 10 ? 'High' : 'Normal'}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-600">Pending Review</p>
                <p className="text-3xl font-bold text-amber-900">{pendingReview.length}</p>
                <div className="flex items-center text-sm text-amber-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Requires attention
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Smart Code Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary" />
              Smart Code Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {smartCodePerformance.slice(0, 5).map((code, index) => (
                <div
                  key={code.smart_code}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{code.smart_code}</p>
                      <Badge
                        className={`ml-2 ${
                          code.auto_posting_rate >= 85
                            ? 'bg-emerald-100 text-emerald-800'
                            : code.auto_posting_rate >= 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {code.auto_posting_rate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground">
                        {code.transaction_count} transactions
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Conf: {(code.avg_confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {smartCodePerformance.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No Smart Code data available for this period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Review Items */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-amber-600" />
                Pending Review
              </div>
              {pendingReview.length > 0 && (
                <Badge className="bg-amber-100 text-amber-800">{pendingReview.length} items</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingReview.slice(0, 5).map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{transaction.reference_number}</p>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(transaction.total_amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground">{transaction.smart_code}</p>
                      <Badge className="bg-blue-100 text-blue-800">
                        {(transaction.ai_confidence_score * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {pendingReview.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No transactions pending review</p>
                  <p className="text-sm">All transactions are being processed automatically!</p>
                </div>
              )}
            </div>
            {pendingReview.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  View All ({pendingReview.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Effectiveness Chart */}
      {metrics && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              AI Effectiveness Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Auto Posted */}
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-foreground" />
                </div>
                <p className="text-2xl font-bold text-emerald-900">{metrics.auto_posted_count}</p>
                <p className="text-sm text-emerald-600 font-medium">Auto Posted</p>
                <p className="text-xs text-slate-500 mt-1">High confidence (85%+)</p>
              </div>

              {/* Pending Review */}
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-foreground" />
                </div>
                <p className="text-2xl font-bold text-amber-900">{metrics.pending_review_count}</p>
                <p className="text-sm text-amber-600 font-medium">Pending Review</p>
                <p className="text-xs text-slate-500 mt-1">Medium confidence (60-85%)</p>
              </div>

              {/* Manual Required */}
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-8 h-8 text-foreground" />
                </div>
                <p className="text-2xl font-bold text-red-900">{metrics.manual_required_count}</p>
                <p className="text-sm text-red-600 font-medium">Manual Required</p>
                <p className="text-xs text-slate-500 mt-1">Low confidence (&lt;60%)</p>
              </div>
            </div>

            {/* Overall AI Effectiveness */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-blue-900">Overall AI Effectiveness</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.ai_effectiveness}%</p>
              </div>
              <Progress value={metrics.ai_effectiveness} className="h-3 bg-blue-200" />
              <p className="text-sm text-primary mt-2">
                AI successfully handles {metrics.ai_effectiveness}% of all transactions
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-muted-foreground" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <FileText className="w-6 h-6 mb-2" />
              Review Queue
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Brain className="w-6 h-6 mb-2" />
              AI Training
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              Analytics
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="w-6 h-6 mb-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AIFinanceDashboard
