'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Target,
  CreditCard,
  Wallet,
  Receipt,
  Calculator,
  Coins,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Percent,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Crown,
  Gem,
  Scale,
  Shield,
  LineChart,
  Activity,
  Zap,
  Award,
  Sparkles,
  Diamond,
  ChevronRight,
  Settings,
  Info
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  costOfGoods: number
  operatingExpenses: number
  cashFlow: number
  accountsReceivable: number
  accountsPayable: number
  inventory: number
  avgOrderValue: number
  monthlyGrowth: number
  yearlyGrowth: number
}

interface RevenueBreakdown {
  category: string
  amount: number
  percentage: number
  growth: number
  color: string
}

interface ExpenseCategory {
  category: string
  amount: number
  percentage: number
  budget: number
  variance: number
  status: 'under' | 'on_track' | 'over'
}

interface CashFlowData {
  month: string
  inflow: number
  outflow: number
  netFlow: number
  cumulativeFlow: number
}

interface ProfitabilityAnalysis {
  period: string
  revenue: number
  costs: number
  grossProfit: number
  grossMargin: number
  netProfit: number
  netMargin: number
}

export default function JewelryFinancialPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [selectedView, setSelectedView] = useState('overview')
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false)
  const [comparisonPeriod, setComparisonPeriod] = useState('last_month')

  // Mock financial data
  const financialMetrics: FinancialMetrics = {
    totalRevenue: 2850000,
    totalExpenses: 1680000,
    grossProfit: 1170000,
    netProfit: 890000,
    profitMargin: 31.2,
    costOfGoods: 1400000,
    operatingExpenses: 280000,
    cashFlow: 720000,
    accountsReceivable: 450000,
    accountsPayable: 180000,
    inventory: 3200000,
    avgOrderValue: 18250,
    monthlyGrowth: 12.5,
    yearlyGrowth: 28.3
  }

  const revenueBreakdown: RevenueBreakdown[] = [
    {
      category: 'Rings',
      amount: 1250000,
      percentage: 43.9,
      growth: 18.5,
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      category: 'Necklaces',
      amount: 890000,
      percentage: 31.2,
      growth: 12.3,
      color: 'from-blue-400 to-blue-600'
    },
    {
      category: 'Earrings',
      amount: 420000,
      percentage: 14.7,
      growth: -5.2,
      color: 'from-purple-400 to-purple-600'
    },
    {
      category: 'Bracelets',
      amount: 290000,
      percentage: 10.2,
      growth: 22.7,
      color: 'from-green-400 to-green-600'
    }
  ]

  const expenseCategories: ExpenseCategory[] = [
    {
      category: 'Cost of Goods Sold',
      amount: 1400000,
      percentage: 83.3,
      budget: 1350000,
      variance: 3.7,
      status: 'over'
    },
    {
      category: 'Staff & Labor',
      amount: 150000,
      percentage: 8.9,
      budget: 160000,
      variance: -6.3,
      status: 'under'
    },
    {
      category: 'Rent & Utilities',
      amount: 80000,
      percentage: 4.8,
      budget: 85000,
      variance: -5.9,
      status: 'under'
    },
    {
      category: 'Marketing',
      amount: 30000,
      percentage: 1.8,
      budget: 35000,
      variance: -14.3,
      status: 'under'
    },
    {
      category: 'Other Operating',
      amount: 20000,
      percentage: 1.2,
      budget: 25000,
      variance: -20.0,
      status: 'under'
    }
  ]

  const cashFlowData: CashFlowData[] = [
    { month: 'Jan', inflow: 2200000, outflow: 1800000, netFlow: 400000, cumulativeFlow: 400000 },
    { month: 'Feb', inflow: 2400000, outflow: 1850000, netFlow: 550000, cumulativeFlow: 950000 },
    { month: 'Mar', inflow: 2650000, outflow: 1920000, netFlow: 730000, cumulativeFlow: 1680000 },
    { month: 'Apr', inflow: 2850000, outflow: 1680000, netFlow: 1170000, cumulativeFlow: 2850000 }
  ]

  const profitabilityAnalysis: ProfitabilityAnalysis[] = [
    {
      period: 'Q1 2024',
      revenue: 7100000,
      costs: 4570000,
      grossProfit: 2530000,
      grossMargin: 35.6,
      netProfit: 1920000,
      netMargin: 27.0
    },
    {
      period: 'Q4 2023',
      revenue: 6800000,
      costs: 4420000,
      grossProfit: 2380000,
      grossMargin: 35.0,
      netProfit: 1780000,
      netMargin: 26.2
    },
    {
      period: 'Q3 2023',
      revenue: 5900000,
      costs: 3890000,
      grossProfit: 2010000,
      grossMargin: 34.1,
      netProfit: 1520000,
      netMargin: 25.8
    }
  ]

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const views = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'revenue', label: 'Revenue', icon: TrendingUp },
    { value: 'expenses', label: 'Expenses', icon: Receipt },
    { value: 'cashflow', label: 'Cash Flow', icon: Activity },
    { value: 'profitability', label: 'Profitability', icon: Target }
  ]

  const getExpenseStatusColor = (status: string) => {
    switch (status) {
      case 'under':
        return 'jewelry-status-active'
      case 'on_track':
        return 'jewelry-status-pending'
      case 'over':
        return 'jewelry-status-inactive'
      default:
        return 'jewelry-status-inactive'
    }
  }

  const getExpenseStatusIcon = (status: string) => {
    switch (status) {
      case 'under':
        return <CheckCircle className="jewelry-icon-success" size={16} />
      case 'on_track':
        return <Clock className="jewelry-icon-warning" size={16} />
      case 'over':
        return <AlertTriangle className="jewelry-icon-error" size={16} />
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return `¹${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <DollarSign className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Financial Management
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Comprehensive financial insights and business performance analytics
            </p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Period and View Selection */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex flex-wrap gap-2">
                  {periods.map(period => (
                    <button
                      key={period.value}
                      onClick={() => setSelectedPeriod(period.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedPeriod === period.value
                          ? 'jewelry-btn-primary'
                          : 'jewelry-btn-secondary'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  {views.map(view => (
                    <button
                      key={view.value}
                      onClick={() => setSelectedView(view.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedView === view.value
                          ? 'jewelry-btn-primary'
                          : 'jewelry-btn-secondary'
                      }`}
                    >
                      <view.icon size={16} />
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                  className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2"
                >
                  <Filter className="jewelry-icon-gold" size={18} />
                  <span>Advanced</span>
                </button>

                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <RefreshCw className="jewelry-icon-gold" size={18} />
                  <span>Refresh</span>
                </button>

                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Download className="jewelry-icon-gold" size={18} />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Key Financial Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="jewelry-glass-card jewelry-float p-6 text-center">
              <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">
                {formatCurrency(financialMetrics.totalRevenue)}
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Revenue</p>
              <div className="flex items-center justify-center mt-2 text-green-500">
                <ArrowUpRight size={16} />
                <span className="text-xs ml-1">
                  {formatPercentage(financialMetrics.monthlyGrowth)}
                </span>
              </div>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.1s' }}
            >
              <Calculator className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">
                {formatCurrency(financialMetrics.netProfit)}
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Net Profit</p>
              <div className="flex items-center justify-center mt-2 text-green-500">
                <ArrowUpRight size={16} />
                <span className="text-xs ml-1">+15.2%</span>
              </div>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.2s' }}
            >
              <Percent className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">
                {financialMetrics.profitMargin}%
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Profit Margin</p>
              <div className="flex items-center justify-center mt-2 text-green-500">
                <ArrowUpRight size={16} />
                <span className="text-xs ml-1">+2.1%</span>
              </div>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.3s' }}
            >
              <Activity className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">
                {formatCurrency(financialMetrics.cashFlow)}
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Cash Flow</p>
              <div className="flex items-center justify-center mt-2 text-green-500">
                <ArrowUpRight size={16} />
                <span className="text-xs ml-1">+8.7%</span>
              </div>
            </div>
          </motion.div>

          {/* Main Content Based on Selected View */}
          {selectedView === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="jewelry-glass-panel"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                    <PieChart className="jewelry-icon-gold" size={24} />
                    Revenue Breakdown
                  </h3>
                  <button className="jewelry-btn-secondary p-2">
                    <Eye className="jewelry-icon-gold" size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {revenueBreakdown.map((item, index) => (
                    <div key={item.category} className="jewelry-glass-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full bg-gradient-to-r ${item.color}`}
                          ></div>
                          <div>
                            <h4 className="jewelry-text-high-contrast font-semibold">
                              {item.category}
                            </h4>
                            <p className="jewelry-text-muted text-sm">
                              {item.percentage}% of total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="jewelry-text-high-contrast font-bold">
                            {formatCurrency(item.amount)}
                          </p>
                          <div
                            className={`flex items-center justify-end mt-1 ${item.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}
                          >
                            {item.growth >= 0 ? (
                              <ArrowUpRight size={14} />
                            ) : (
                              <ArrowDownRight size={14} />
                            )}
                            <span className="text-xs ml-1">{Math.abs(item.growth)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Expense Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="jewelry-glass-panel"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                    <Receipt className="jewelry-icon-gold" size={24} />
                    Expense Analysis
                  </h3>
                  <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1">
                    <Settings className="jewelry-icon-gold" size={14} />
                    <span className="text-sm">Budget</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {expenseCategories.map((expense, index) => (
                    <div key={expense.category} className="jewelry-glass-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getExpenseStatusIcon(expense.status)}
                          <div>
                            <h4 className="jewelry-text-high-contrast font-semibold">
                              {expense.category}
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getExpenseStatusColor(expense.status)}`}
                            >
                              {expense.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="jewelry-text-high-contrast font-bold">
                            {formatCurrency(expense.amount)}
                          </p>
                          <p className="jewelry-text-muted text-sm">
                            {expense.percentage}% of total
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="jewelry-text-muted">
                            Budget: {formatCurrency(expense.budget)}
                          </span>
                          <span
                            className={`font-medium ${expense.variance < 0 ? 'text-green-500' : 'text-red-500'}`}
                          >
                            {formatPercentage(expense.variance)}
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              expense.status === 'under'
                                ? 'bg-green-500'
                                : expense.status === 'on_track'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min((expense.amount / expense.budget) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Advanced Metrics Panel */}
          {showAdvancedMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="jewelry-glass-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="jewelry-icon-gold" size={24} />
                  Advanced Financial Metrics
                </h3>
                <button
                  onClick={() => setShowAdvancedMetrics(false)}
                  className="jewelry-btn-secondary p-2"
                >
                  <ChevronRight className="jewelry-icon-gold" size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="jewelry-glass-card p-6 text-center">
                  <CreditCard className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">
                    {formatCurrency(financialMetrics.accountsReceivable)}
                  </h4>
                  <p className="jewelry-text-muted text-sm">Accounts Receivable</p>
                </div>

                <div className="jewelry-glass-card p-6 text-center">
                  <Receipt className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">
                    {formatCurrency(financialMetrics.accountsPayable)}
                  </h4>
                  <p className="jewelry-text-muted text-sm">Accounts Payable</p>
                </div>

                <div className="jewelry-glass-card p-6 text-center">
                  <Gem className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">
                    {formatCurrency(financialMetrics.inventory)}
                  </h4>
                  <p className="jewelry-text-muted text-sm">Inventory Value</p>
                </div>

                <div className="jewelry-glass-card p-6 text-center">
                  <Target className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">
                    {formatCurrency(financialMetrics.avgOrderValue)}
                  </h4>
                  <p className="jewelry-text-muted text-sm">Avg Order Value</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profitability Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                <LineChart className="jewelry-icon-gold" size={24} />
                Quarterly Profitability Trends
              </h3>
              <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1">
                <Eye className="jewelry-icon-gold" size={14} />
                <span className="text-sm">Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profitabilityAnalysis.map((period, index) => (
                <motion.div
                  key={period.period}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="jewelry-glass-card jewelry-scale-hover p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="jewelry-text-luxury font-semibold">{period.period}</h4>
                    <Award className="jewelry-icon-gold" size={20} />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Revenue:</span>
                      <span className="jewelry-text-high-contrast font-bold">
                        {formatCurrency(period.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Costs:</span>
                      <span className="jewelry-text-high-contrast font-medium">
                        {formatCurrency(period.costs)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-jewelry-blue-200">
                      <span className="jewelry-text-muted">Gross Profit:</span>
                      <span className="jewelry-text-high-contrast font-bold">
                        {formatCurrency(period.grossProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Gross Margin:</span>
                      <span className="jewelry-text-high-contrast font-bold">
                        {period.grossMargin}%
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-jewelry-blue-200">
                      <span className="jewelry-text-luxury font-medium">Net Profit:</span>
                      <span className="jewelry-text-high-contrast font-bold text-lg">
                        {formatCurrency(period.netProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="jewelry-text-luxury font-medium">Net Margin:</span>
                      <span className="jewelry-text-high-contrast font-bold text-lg">
                        {period.netMargin}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              Financial analytics powered by{' '}
              <span className="jewelry-text-luxury font-semibold">HERA Business Intelligence</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
