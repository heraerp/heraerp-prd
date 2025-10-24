'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Calculator,
  CreditCard,
  Banknote,
  Receipt,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Globe,
  Package,
  Users,
  Factory,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Plus,
  Settings,
  Award,
  Zap,
  Heart,
  Star
} from 'lucide-react'

interface FinancialMetrics {
  revenue: number
  expenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  cashFlow: number
  assets: number
  liabilities: number
  equity: number
  workingCapital: number
  returnOnAssets: number
  returnOnEquity: number
}

interface RevenueBreakdown {
  category: string
  amount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  monthlyGrowth: number
}

interface ExpenseCategory {
  category: string
  amount: number
  percentage: number
  budget: number
  variance: number
  isOverBudget: boolean
}

interface ProfitLossItem {
  description: string
  currentMonth: number
  previousMonth: number
  yearToDate: number
  budget: number
  variance: number
}

interface CashFlowItem {
  category: string
  description: string
  amount: number
  type: 'inflow' | 'outflow'
  date: string
  status: 'completed' | 'pending' | 'overdue'
}

interface KPIMetric {
  name: string
  value: number
  unit: string
  target: number
  trend: 'up' | 'down' | 'stable'
  industry_benchmark: number
  description: string
}

export default function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [selectedView, setSelectedView] = useState('summary')

  // Kerala furniture industry financial data
  const currentMetrics: FinancialMetrics = {
    revenue: 6950000, // ₹69.5L
    expenses: 4865000, // ₹48.65L
    grossProfit: 2085000, // ₹20.85L
    netProfit: 1390000, // ₹13.9L
    profitMargin: 20.0,
    cashFlow: 850000, // ₹8.5L
    assets: 12500000, // ₹1.25Cr
    liabilities: 4200000, // ₹42L
    equity: 8300000, // ₹83L
    workingCapital: 2800000, // ₹28L
    returnOnAssets: 11.1,
    returnOnEquity: 16.7
  }

  const revenueBreakdown: RevenueBreakdown[] = [
    {
      category: 'Export Sales',
      amount: 3900000,
      percentage: 56,
      trend: 'up',
      monthlyGrowth: 22
    },
    {
      category: 'Domestic Hotels',
      amount: 1800000,
      percentage: 26,
      trend: 'up',
      monthlyGrowth: 18
    },
    {
      category: 'Resort Furniture',
      amount: 850000,
      percentage: 12,
      trend: 'stable',
      monthlyGrowth: 5
    },
    {
      category: 'Corporate Orders',
      amount: 400000,
      percentage: 6,
      trend: 'up',
      monthlyGrowth: 15
    }
  ]

  const expenseCategories: ExpenseCategory[] = [
    {
      category: 'Raw Materials (Wood)',
      amount: 2200000,
      percentage: 45,
      budget: 2000000,
      variance: 200000,
      isOverBudget: true
    },
    {
      category: 'Labor & Craftsmen',
      amount: 1450000,
      percentage: 30,
      budget: 1500000,
      variance: -50000,
      isOverBudget: false
    },
    {
      category: 'Manufacturing Overhead',
      amount: 580000,
      percentage: 12,
      budget: 600000,
      variance: -20000,
      isOverBudget: false
    },
    {
      category: 'Export & Logistics',
      amount: 385000,
      percentage: 8,
      budget: 350000,
      variance: 35000,
      isOverBudget: true
    },
    {
      category: 'Administrative',
      amount: 250000,
      percentage: 5,
      budget: 280000,
      variance: -30000,
      isOverBudget: false
    }
  ]

  const profitLossData: ProfitLossItem[] = [
    {
      description: 'Total Revenue',
      currentMonth: 6950000,
      previousMonth: 5890000,
      yearToDate: 45200000,
      budget: 6500000,
      variance: 450000
    },
    {
      description: 'Cost of Goods Sold',
      currentMonth: 4865000,
      previousMonth: 4120000,
      yearToDate: 31680000,
      budget: 4550000,
      variance: -315000
    },
    {
      description: 'Gross Profit',
      currentMonth: 2085000,
      previousMonth: 1770000,
      yearToDate: 13520000,
      budget: 1950000,
      variance: 135000
    },
    {
      description: 'Operating Expenses',
      currentMonth: 695000,
      previousMonth: 589000,
      yearToDate: 4520000,
      budget: 650000,
      variance: -45000
    },
    {
      description: 'Net Profit',
      currentMonth: 1390000,
      previousMonth: 1181000,
      yearToDate: 9000000,
      budget: 1300000,
      variance: 90000
    }
  ]

  const cashFlowData: CashFlowItem[] = [
    {
      category: 'Sales Collections',
      description: 'ITC Grand Chola - Room Furniture Payment',
      amount: 1250000,
      type: 'inflow',
      date: '2024-01-25',
      status: 'completed'
    },
    {
      category: 'Export Receipts',
      description: 'Dubai Furniture LLC - LC Settlement',
      amount: 2100000,
      type: 'inflow',
      date: '2024-01-28',
      status: 'completed'
    },
    {
      category: 'Material Purchase',
      description: 'Premium Teak Wood - Thrissur Supplier',
      amount: 850000,
      type: 'outflow',
      date: '2024-01-20',
      status: 'completed'
    },
    {
      category: 'Salary Payments',
      description: 'Craftsmen & Staff Monthly Salary',
      amount: 680000,
      type: 'outflow',
      date: '2024-01-30',
      status: 'pending'
    },
    {
      category: 'Export Logistics',
      description: 'Container Shipping & Documentation',
      amount: 185000,
      type: 'outflow',
      date: '2024-01-22',
      status: 'completed'
    }
  ]

  const kpiMetrics: KPIMetric[] = [
    {
      name: 'Gross Profit Margin',
      value: 30.0,
      unit: '%',
      target: 32.0,
      trend: 'up',
      industry_benchmark: 28.5,
      description: 'Revenue minus direct costs'
    },
    {
      name: 'Net Profit Margin',
      value: 20.0,
      unit: '%',
      target: 22.0,
      trend: 'up',
      industry_benchmark: 18.2,
      description: 'Overall profitability'
    },
    {
      name: 'Current Ratio',
      value: 2.4,
      unit: ':1',
      target: 2.0,
      trend: 'up',
      industry_benchmark: 1.8,
      description: 'Liquidity position'
    },
    {
      name: 'Inventory Turnover',
      value: 6.8,
      unit: 'times',
      target: 8.0,
      trend: 'stable',
      industry_benchmark: 5.5,
      description: 'Inventory efficiency'
    },
    {
      name: 'Export Revenue %',
      value: 56.0,
      unit: '%',
      target: 60.0,
      trend: 'up',
      industry_benchmark: 35.0,
      description: 'Export market dominance'
    },
    {
      name: 'Labor Cost %',
      value: 21.0,
      unit: '%',
      target: 20.0,
      trend: 'stable',
      industry_benchmark: 25.0,
      description: 'Labor efficiency'
    }
  ]

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Target className="h-3 w-3 text-blue-500" />
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-500'
    if (trend === 'down') return 'text-red-500'
    return 'text-blue-500'
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount.toLocaleString()}`
  }

  const getVarianceColor = (variance: number) => {
    return variance >= 0 ? 'text-green-500' : 'text-red-500'
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <BarChart3 className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Financial Reports</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Business Financial Analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Profitable
                </Badge>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="jewelry-glass-input min-w-[150px]"
                >
                  <option value="current_month">Current Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <Button className="jewelry-glass-btn gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Revenue</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{formatCurrency(currentMetrics.revenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+18% vs last month</span>
              </div>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Net Profit</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{formatCurrency(currentMetrics.netProfit)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-300">{currentMetrics.profitMargin}% margin</span>
              </div>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Cash Flow</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{formatCurrency(currentMetrics.cashFlow)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-500">Positive cash position</span>
              </div>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">ROE</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{currentMetrics.returnOnEquity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-300">Strong returns</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="overview" className="jewelry-glass-btn">Financial Overview</TabsTrigger>
              <TabsTrigger value="profitloss" className="jewelry-glass-btn">Profit & Loss</TabsTrigger>
              <TabsTrigger value="cashflow" className="jewelry-glass-btn">Cash Flow</TabsTrigger>
              <TabsTrigger value="kpis" className="jewelry-glass-btn">Key Metrics</TabsTrigger>
            </TabsList>

            {/* Financial Overview */}
            <TabsContent value="overview" className="space-y-6">
              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Revenue Breakdown</h3>
                  <div className="space-y-4">
                    {revenueBreakdown.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium jewelry-text-luxury">{item.category}</span>
                            {getTrendIcon(item.trend)}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium jewelry-text-luxury">{formatCurrency(item.amount)}</span>
                            <span className="text-xs text-gray-300 ml-1">({item.percentage}%)</span>
                          </div>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-300">
                          <span>Monthly growth: {item.monthlyGrowth > 0 ? '+' : ''}{item.monthlyGrowth}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense Categories */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Expense Analysis</h3>
                  <div className="space-y-4">
                    {expenseCategories.map((expense, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium jewelry-text-luxury">{expense.category}</span>
                          <div className="text-right">
                            <span className="text-sm font-medium jewelry-text-luxury">{formatCurrency(expense.amount)}</span>
                            {expense.isOverBudget && (
                              <AlertCircle className="h-3 w-3 text-red-500 inline ml-1" />
                            )}
                          </div>
                        </div>
                        <Progress value={expense.percentage} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">Budget: {formatCurrency(expense.budget)}</span>
                          <span className={`${getVarianceColor(expense.variance)}`}>
                            {expense.variance > 0 ? '+' : ''}{formatCurrency(Math.abs(expense.variance))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financial Health Indicators */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Financial Health Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-3">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-xl font-bold jewelry-text-luxury">Strong</p>
                    <p className="text-sm text-gray-300">Liquidity Position</p>
                    <p className="text-xs text-green-500 mt-1">Current Ratio: 2.4:1</p>
                  </div>

                  <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-xl font-bold jewelry-text-luxury">Excellent</p>
                    <p className="text-sm text-gray-300">Profitability</p>
                    <p className="text-xs text-blue-500 mt-1">Above industry average</p>
                  </div>

                  <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mb-3">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-xl font-bold jewelry-text-luxury">Growing</p>
                    <p className="text-sm text-gray-300">Market Position</p>
                    <p className="text-xs text-purple-500 mt-1">Export leader in Kerala</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Profit & Loss */}
            <TabsContent value="profitloss" className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold jewelry-text-luxury">Profit & Loss Statement</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" className="jewelry-glass-btn gap-2">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button variant="outline" className="jewelry-glass-btn gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 jewelry-text-luxury font-medium">Description</th>
                        <th className="text-right p-3 jewelry-text-luxury font-medium">Current Month</th>
                        <th className="text-right p-3 jewelry-text-luxury font-medium">Previous Month</th>
                        <th className="text-right p-3 jewelry-text-luxury font-medium">YTD</th>
                        <th className="text-right p-3 jewelry-text-luxury font-medium">Budget</th>
                        <th className="text-right p-3 jewelry-text-luxury font-medium">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitLossData.map((item, index) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 jewelry-text-luxury font-medium">{item.description}</td>
                          <td className="p-3 text-right jewelry-text-luxury">{formatCurrency(item.currentMonth)}</td>
                          <td className="p-3 text-right text-gray-300">{formatCurrency(item.previousMonth)}</td>
                          <td className="p-3 text-right text-gray-300">{formatCurrency(item.yearToDate)}</td>
                          <td className="p-3 text-right text-gray-300">{formatCurrency(item.budget)}</td>
                          <td className={`p-3 text-right font-medium ${getVarianceColor(item.variance)}`}>
                            {item.variance > 0 ? '+' : ''}{formatCurrency(Math.abs(item.variance))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="jewelry-glass-card p-6">
                  <h4 className="text-md font-semibold jewelry-text-luxury mb-4">Revenue Growth</h4>
                  <div className="text-center">
                    <p className="text-3xl font-bold jewelry-text-luxury">{formatCurrency(currentMetrics.revenue)}</p>
                    <p className="text-sm text-gray-300">This Month</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-medium">+18.0%</span>
                      <span className="text-gray-300">vs last month</span>
                    </div>
                  </div>
                </div>

                <div className="jewelry-glass-card p-6">
                  <h4 className="text-md font-semibold jewelry-text-luxury mb-4">Profit Margin</h4>
                  <div className="text-center">
                    <p className="text-3xl font-bold jewelry-text-luxury">{currentMetrics.profitMargin}%</p>
                    <p className="text-sm text-gray-300">Net Margin</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-medium">+2.1%</span>
                      <span className="text-gray-300">improvement</span>
                    </div>
                  </div>
                </div>

                <div className="jewelry-glass-card p-6">
                  <h4 className="text-md font-semibold jewelry-text-luxury mb-4">Cost Control</h4>
                  <div className="text-center">
                    <p className="text-3xl font-bold jewelry-text-luxury">93%</p>
                    <p className="text-sm text-gray-300">Budget Efficiency</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-medium">Well controlled</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Cash Flow */}
            <TabsContent value="cashflow" className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold jewelry-text-luxury">Cash Flow Analysis</h3>
                  <div className="flex gap-2">
                    <Badge className="bg-green-500/10 text-green-600">
                      Net Positive: {formatCurrency(currentMetrics.cashFlow)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  {cashFlowData.map((item, index) => (
                    <div key={index} className="jewelry-glass-card p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.type === 'inflow' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}>
                            {item.type === 'inflow' ? (
                              <ArrowUpRight className="h-5 w-5 text-white" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold jewelry-text-luxury">{item.description}</h4>
                            <p className="text-xs text-gray-300">{item.category} • {item.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            item.type === 'inflow' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {item.type === 'inflow' ? '+' : '-'}{formatCurrency(item.amount)}
                          </p>
                          <Badge className={`text-xs ${
                            item.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                            item.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-red-500/10 text-red-600'
                          }`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Flow Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="jewelry-glass-card p-6">
                  <h4 className="text-md font-semibold jewelry-text-luxury mb-4">Operating Cash Flow</h4>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">+{formatCurrency(1650000)}</p>
                    <p className="text-sm text-gray-300">From operations</p>
                    <div className="mt-3 p-2 bg-green-500/10 rounded-lg">
                      <p className="text-xs text-green-600">Strong operational cash generation</p>
                    </div>
                  </div>
                </div>

                <div className="jewelry-glass-card p-6">
                  <h4 className="text-md font-semibold jewelry-text-luxury mb-4">Investment Cash Flow</h4>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">-{formatCurrency(450000)}</p>
                    <p className="text-sm text-gray-300">Equipment & expansion</p>
                    <div className="mt-3 p-2 bg-blue-500/10 rounded-lg">
                      <p className="text-xs text-blue-600">Strategic investments in growth</p>
                    </div>
                  </div>
                </div>

                <div className="jewelry-glass-card p-6">
                  <h4 className="text-md font-semibold jewelry-text-luxury mb-4">Financing Cash Flow</h4>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-500">-{formatCurrency(350000)}</p>
                    <p className="text-sm text-gray-300">Loan repayments</p>
                    <div className="mt-3 p-2 bg-purple-500/10 rounded-lg">
                      <p className="text-xs text-purple-600">Reducing debt burden</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Key Metrics */}
            <TabsContent value="kpis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {kpiMetrics.map((kpi, index) => (
                  <div key={index} className="jewelry-glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{kpi.name}</h3>
                          <p className="text-sm text-gray-300">{kpi.description}</p>
                        </div>
                      </div>
                      {getTrendIcon(kpi.trend)}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-bold jewelry-text-luxury">{kpi.value}{kpi.unit}</span>
                        <div className="text-right">
                          <p className="text-xs text-gray-300">Target: {kpi.target}{kpi.unit}</p>
                          <p className="text-xs text-gray-300">Industry: {kpi.industry_benchmark}{kpi.unit}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">vs Target</span>
                          <span className={`font-medium ${
                            kpi.value >= kpi.target ? 'text-green-500' : 'text-amber-500'
                          }`}>
                            {((kpi.value / kpi.target) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
                      </div>

                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <p className="text-xs jewelry-text-luxury">
                          {kpi.value > kpi.industry_benchmark ? (
                            <>🏆 Above industry benchmark by {((kpi.value / kpi.industry_benchmark - 1) * 100).toFixed(0)}%</>
                          ) : (
                            <>📈 Below industry benchmark - opportunity for improvement</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Benchmarking */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Kerala Furniture Industry Benchmarking</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <h4 className="text-sm font-medium jewelry-text-luxury mb-2">Profitability Ranking</h4>
                    <div className="flex items-center justify-center gap-2">
                      <Award className="h-5 w-5 text-green-500" />
                      <span className="text-xl font-bold text-green-500">#2</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Top 5% in Kerala</p>
                  </div>

                  <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                    <h4 className="text-sm font-medium jewelry-text-luxury mb-2">Export Performance</h4>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-5 w-5 text-blue-500" />
                      <span className="text-xl font-bold text-blue-500">#1</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Leading exporter</p>
                  </div>

                  <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                    <h4 className="text-sm font-medium jewelry-text-luxury mb-2">Growth Rate</h4>
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-5 w-5 text-purple-500" />
                      <span className="text-xl font-bold text-purple-500">#3</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Fastest growing</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}