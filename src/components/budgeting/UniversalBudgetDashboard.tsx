'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Calculator,
  FileText,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Equal
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'

interface BudgetSummary {
  budget_id: string
  budget_name: string
  budget_type: string
  fiscal_year: number
  status: string
  total_budget: number
  total_actual: number
  variance_amount: number
  variance_percent: number
  approval_status: string
}

interface VarianceAnalysis {
  period: string
  summary: {
    total_budget: number
    total_actual: number
    total_variance: number
    variance_percent: number
    status: string
  }
  line_variances: Array<{
    account_code: string
    account_name: string
    budget_amount: number
    actual_amount: number
    variance_amount: number
    variance_percent: number
    status: string
    transaction_count: number
  }>
  critical_variances: any[]
  recommendations: string[]
}

interface UniversalBudgetDashboardProps {
  organizationId: string
  isAnonymous?: boolean
}

export default function UniversalBudgetDashboard({
  organizationId,
  isAnonymous = false
}: UniversalBudgetDashboardProps) {
  const [budgets, setBudgets] = useState<BudgetSummary[]>([])
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null)
  const [varianceAnalysis, setVarianceAnalysis] = useState<VarianceAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'MTD' | 'QTD' | 'YTD'>('YTD')

  useEffect(() => {
    loadBudgetData()
  }, [organizationId])

  useEffect(() => {
    if (selectedBudget) {
      loadVarianceAnalysis()
    }
  }, [selectedBudget, selectedPeriod])

  const loadBudgetData = async () => {
    try {
      setIsLoading(true)

      // Get all budget entities
      const budgetEntitiesResponse = await universalApi.getEntities('budget', organizationId)

      if (budgetEntitiesResponse.success && budgetEntitiesResponse.data) {
        const budgetSummaries = budgetEntitiesResponse.data.map((budget: any) => ({
          budget_id: budget.id,
          budget_name: budget.entity_name,
          budget_type: (budget.metadata as any)?.budget_type || 'operating',
          fiscal_year: (budget.metadata as any)?.fiscal_year || new Date().getFullYear(),
          status: budget.status,
          total_budget: 120000, // Mock data - would be calculated from budget lines
          total_actual: 89500, // Mock data - would be calculated from actuals
          variance_amount: -30500,
          variance_percent: -25.4,
          approval_status: (budget.metadata as any)?.approval_status || 'draft'
        }))

        setBudgets(budgetSummaries)

        // Select first budget by default
        if (budgetSummaries.length > 0 && !selectedBudget) {
          setSelectedBudget(budgetSummaries[0].budget_id)
        }
      }
    } catch (error) {
      console.error('Error loading budget data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadVarianceAnalysis = async () => {
    if (!selectedBudget) return

    try {
      const analysis = await universalApi.getBudgetVarianceAnalysis({
        budgetId: selectedBudget,
        organizationId,
        period: selectedPeriod,
        varianceThreshold: 5.0
      })

      if (analysis.success) {
        setVarianceAnalysis(analysis.data)
      }
    } catch (error) {
      console.error('Error loading variance analysis:', error)
    }
  }

  const createNewBudget = async () => {
    try {
      const result = await universalApi.createBudget({
        organizationId,
        budgetName: `${new Date().getFullYear() + 1} Annual Budget`,
        budgetCode: `BUDGET-${new Date().getFullYear() + 1}-NEW`,
        budgetType: 'operating',
        fiscalYear: new Date().getFullYear() + 1,
        budgetPeriod: 'annual',
        budgetMethod: 'zero_based'
      })

      if (result.success) {
        await loadBudgetData()
      }
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (variance < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getVarianceColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'acceptable':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading budget dashboard...</p>
        </div>
      </div>
    )
  }

  const selectedBudgetData = budgets.find(b => b.budget_id === selectedBudget)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Management</h2>
          <p className="text-gray-600">Universal budgeting and variance analysis</p>
        </div>
        <div className="flex items-center gap-3">
          {isAnonymous && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Target className="w-4 h-4 mr-1" />
              Demo Mode
            </Badge>
          )}
          <Button onClick={createNewBudget} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Budget</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(selectedBudgetData?.total_budget || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="text-xs">
                HERA.FIN.BUDGET.TOTAL.v1
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Actual Spend</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(selectedBudgetData?.total_actual || 0)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="text-xs">
                HERA.FIN.BUDGET.ACTUAL.v1
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Variance</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(selectedBudgetData?.variance_amount || 0)}
                </p>
                <div className="flex items-center mt-1">
                  {getVarianceIcon(selectedBudgetData?.variance_amount || 0)}
                  <span className="text-sm text-red-600 ml-1">
                    {selectedBudgetData?.variance_percent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Budget Utilization</p>
                <p className="text-2xl font-bold text-purple-900">74.6%</p>
                <Progress value={74.6} className="mt-2" />
              </div>
              <PieChart className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Selection and Period Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Budget:</label>
            <select
              value={selectedBudget || ''}
              onChange={e => setSelectedBudget(e.target.value)}
              className="ml-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {budgets.map(budget => (
                <option key={budget.budget_id} value={budget.budget_id}>
                  {budget.budget_name} ({budget.fiscal_year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <div className="ml-2 inline-flex">
              {(['MTD', 'QTD', 'YTD'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-sm font-medium border ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } ${period === 'MTD' ? 'rounded-l-md' : period === 'YTD' ? 'rounded-r-md' : ''}`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadVarianceAnalysis}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Variance Analysis */}
      {varianceAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Variance Analysis - {selectedPeriod}
              </CardTitle>
              <CardDescription>
                Budget vs actual comparison for {selectedBudgetData?.budget_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Status */}
                <div
                  className={`p-4 rounded-lg ${getVarianceColor(varianceAnalysis.summary.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        Overall Status: {varianceAnalysis.summary.status.toUpperCase()}
                      </h4>
                      <p className="text-sm">
                        {formatCurrency(varianceAnalysis.summary.total_variance)} variance (
                        {varianceAnalysis.summary.variance_percent.toFixed(1)}%)
                      </p>
                    </div>
                    {varianceAnalysis.summary.status === 'critical' && (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                    {varianceAnalysis.summary.status === 'warning' && <Clock className="w-6 h-6" />}
                    {varianceAnalysis.summary.status === 'on_track' && (
                      <CheckCircle className="w-6 h-6" />
                    )}
                  </div>
                </div>

                {/* Top Variances */}
                <div>
                  <h4 className="font-semibold mb-3">Top Variances by Account</h4>
                  <div className="space-y-2">
                    {varianceAnalysis.line_variances.slice(0, 5).map((variance, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{variance.account_code}</span>
                            <Badge variant="outline" className={getVarianceColor(variance.status)}>
                              {variance.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{variance.account_name}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {getVarianceIcon(variance.variance_amount)}
                            <span className="font-semibold">
                              {formatCurrency(Math.abs(variance.variance_amount))}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {variance.variance_percent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Smart insights and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {varianceAnalysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                ))}

                {varianceAnalysis.critical_variances.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <h5 className="font-semibold text-red-800 mb-1">Critical Attention Required</h5>
                    <p className="text-sm text-red-700">
                      {varianceAnalysis.critical_variances.length} accounts need immediate review
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Powered by HERA AI</p>
                  <Badge variant="outline" className="text-xs">
                    HERA.FIN.BUDGET.AI.INSIGHTS.v1
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Calendar className="w-6 h-6 mb-2" />
              Create Forecast
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="w-6 h-6 mb-2" />
              Submit for Approval
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Mode Footer */}
      {isAnonymous && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Experience Universal Budgeting</h3>
              <p className="mb-4 text-blue-100">
                Complete budgeting system with variance analysis, forecasting, and AI insights.
                Create an account to save your budgets and access advanced features.
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Target className="w-5 h-5 mr-2" />
                Save My Budget Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
