'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Finance Dashboard
 * Smart Code: HERA.FIN.DASHBOARD.v1
 *
 * Central hub for all financial operations
 */

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-states'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartOfAccountsStep } from '@/components/wizard/steps/ChartOfAccountsStep'
import { FiscalYearStep } from '@/components/wizard/steps/FiscalYearStep'
import {
  FileText,
  DollarSign,
  TrendingUp,
  Calculator,
  Receipt,
  FileSearch,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Calendar,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Settings,
  Book,
  FileSpreadsheet,
  Banknote,
  CircleDollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building2,
  Home,
  Sparkles,
  BookOpen,
  CalendarClock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'

interface FinanceModule {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  bgColor: string
  badge?: string
  stats?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
    change: string
  }
}

const financeModules: FinanceModule[] = [
  {
    id: 'document-viewer',
    title: 'Financial Documents',
    description: 'View and analyze financial documents (Similar to SAP FB03)',
    icon: FileSearch,
    href: '/finance/document-viewer',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    badge: 'New',
    stats: {
      value: '1,234',
      trend: 'up',
      change: '+12%'
    }
  },
  {
    id: 'general-ledger',
    title: 'General Ledger',
    description: 'Chart of accounts, journal entries, and GL reporting',
    icon: Book,
    href: '/finance/general-ledger',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    stats: {
      value: 'Loading...',
      trend: 'neutral',
      change: '0%'
    }
  },
  {
    id: 'accounts-payable',
    title: 'Accounts Payable',
    description: 'Manage vendor invoices, payments, and aging reports',
    icon: CreditCard,
    href: '/finance/accounts-payable',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    stats: {
      value: 'AED 45,230',
      trend: 'down',
      change: '-8%'
    }
  },
  {
    id: 'accounts-receivable',
    title: 'Accounts Receivable',
    description: 'Track customer invoices, receipts, and collections',
    icon: Wallet,
    href: '/finance/accounts-receivable',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    stats: {
      value: 'AED 125,450',
      trend: 'up',
      change: '+15%'
    }
  },
  {
    id: 'cash-management',
    title: 'Cash Management',
    description: 'Bank reconciliation, cash flow, and liquidity analysis',
    icon: Banknote,
    href: '/finance/cash-management',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    stats: {
      value: 'AED 285,000',
      trend: 'up',
      change: '+5%'
    }
  },
  {
    id: 'financial-reporting',
    title: 'Financial Reports',
    description: 'P&L, Balance Sheet, Cash Flow, and custom reports',
    icon: BarChart3,
    href: '/finance/reports',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    badge: 'IFRS',
    stats: {
      value: '12 Reports',
      trend: 'neutral',
      change: '0%'
    }
  },
  {
    id: 'expense-management',
    title: 'Expense Categories',
    description: 'Manage expense categories and cost allocation',
    icon: Receipt,
    href: '/finance/expense-categories',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    stats: {
      value: '24 Categories',
      trend: 'up',
      change: '+2'
    }
  },
  {
    id: 'budgeting',
    title: 'Budgeting & Forecasting',
    description: 'Create and monitor budgets, variance analysis',
    icon: Calculator,
    href: '/budgeting',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    badge: 'AI-Powered',
    stats: {
      value: '92% Accuracy',
      trend: 'up',
      change: '+3%'
    }
  },
  {
    id: 'fixed-assets',
    title: 'Fixed Assets',
    description: 'Asset register, depreciation, and disposal management',
    icon: Building2,
    href: '/finance/fixed-assets',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    stats: {
      value: 'AED 1.2M',
      trend: 'neutral',
      change: '0%'
    }
  }
]

export default function FinanceDashboard() {
  const router = useRouter()
  const { user, currentOrganization, isAuthenticated, isLoading: authLoading } = useMultiOrgAuth()
  const [financeData, setFinanceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFinanceSettings, setShowFinanceSettings] = useState(false)
  const [wizardData, setWizardData] = useState({
    organizationBasics: {
      industry_classification: 'UNIVERSAL',
      country: 'AE',
      base_currency_code: 'AED'
    },
    chartOfAccounts: {
      load_type: 'template' as 'template' | 'upload',
      template_industry: '',
      accounts: []
    },
    fiscalYear: {
      fiscal_year_start_month: 1,
      fiscal_year_start_day: 1,
      number_of_periods: 12,
      special_periods: 0,
      retained_earnings_account: '',
      current_year_earnings_account: ''
    }
  })

  useEffect(() => {
    if (currentOrganization && isAuthenticated) {
      loadFinanceData()
    }
  }, [currentOrganization, isAuthenticated])

  const loadFinanceData = async () => {
    if (!currentOrganization?.id) return

    setIsLoading(true)
    setError(null)

    try {
      universalApi.setOrganizationId(currentOrganization.id)

      // Load all entities
      const entitiesResponse = await universalApi.read('core_entities')
      const entities = Array.isArray(entitiesResponse)
        ? entitiesResponse
        : entitiesResponse?.data || []

      // Filter financial entities
      const glAccounts = entities.filter((e: any) => e.entity_type === 'gl_account')
      const vendors = entities.filter((e: any) => e.entity_type === 'vendor')
      const customers = entities.filter((e: any) => e.entity_type === 'customer')
      const expenseCategories = entities.filter((e: any) => e.entity_type === 'expense_category')
      const budgets = entities.filter((e: any) => e.entity_type === 'budget')

      // Load transactions
      const transactionsResponse = await universalApi.read('universal_transactions')
      const transactions = Array.isArray(transactionsResponse)
        ? transactionsResponse
        : transactionsResponse?.data || []
      const finTransactions = transactions.filter(
        (t: any) => t.smart_code?.includes('.FIN.') && t.status === 'active'
      )

      // Calculate financial metrics based on actual data
      const revenue = finTransactions
        .filter(
          (t: any) =>
            t.transaction_type === 'sale' || (t.metadata as any)?.gl_account_type === 'revenue'
        )
        .reduce((sum: number, t: any) => sum + (Number(t.total_amount) || 0), 0)

      const expenses = finTransactions
        .filter(
          (t: any) =>
            t.transaction_type === 'expense' || (t.metadata as any)?.gl_account_type === 'expense'
        )
        .reduce((sum: number, t: any) => sum + (Number(t.total_amount) || 0), 0)

      const cashBalance = finTransactions
        .filter(
          (t: any) =>
            (t.metadata as any)?.gl_account_type === 'cash' ||
            (t.metadata as any)?.is_cash_transaction
        )
        .reduce((sum: number, t: any) => {
          const amount = Number(t.total_amount) || 0
          return t.transaction_type === 'payment' || t.transaction_type === 'sale'
            ? sum + amount
            : sum - amount
        }, 0)

      const netProfit = revenue - expenses

      setFinanceData({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: netProfit,
        cashBalance: cashBalance,
        glAccountsCount: glAccounts.length,
        vendorsCount: vendors.length,
        customersCount: customers.length,
        expenseCategoriesCount: expenseCategories.length,
        budgetsCount: budgets.length,
        transactionsCount: finTransactions.length
      })
    } catch (error: any) {
      console.error('Error loading finance data:', error)
      setError(error.message || 'Failed to load finance data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWizardChange = (data: any) => {
    setWizardData(prev => ({ ...prev, ...data }))
  }

  const handleWizardSave = async (data: any) => {
    try {
      // Save COA or Fiscal Year data
      console.log('Saving wizard data:', data)
      // Here you would call the appropriate API to save the data
      setShowFinanceSettings(false)
      await loadFinanceData() // Reload to show new data
    } catch (error) {
      console.error('Error saving wizard data:', error)
    }
  }

  // Handle loading states
  if (authLoading || !isAuthenticated) {
    return <LoadingSpinner />
  }

  if (!currentOrganization) {
    return (
      <Alert className="m-8">
        <AlertDescription>Please select an organization to continue.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Glassmorphic orbs for depth */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <CircleDollarSign className="w-7 h-7 text-white" />
              </div>
              Finance Dashboard
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-xl font-medium">
              Comprehensive financial management and reporting
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFinanceSettings(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 border-0"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Finance Setup
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/')}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/30"
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/finance/settings')}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/30"
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Current Organization */}
        {currentOrganization && (
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Current Organization
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentOrganization.organization_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <div className="text-center">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">Fiscal Year</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2025</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">Period</p>
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Q1</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">COA Status</p>
                  <div className="flex items-center gap-1">
                    {financeData?.glAccountsCount > 0 ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Active
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          Setup Required
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Prompt if no COA */}
        {!isLoading && financeData?.glAccountsCount === 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Finance Setup Required
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set up your Chart of Accounts and Fiscal Year to start using financial
                      features
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowFinanceSettings(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Financial Metrics */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Total Revenue
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      AED {(financeData?.totalRevenue || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-2 font-medium">
                      <ArrowUpRight className="w-4 h-4" />
                      {financeData?.transactionsCount || 0} transactions
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100/80 to-emerald-100/80 dark:from-green-900/40 dark:to-emerald-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Total Expenses
                    </p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      AED {(financeData?.totalExpenses || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-2 font-medium">
                      <Receipt className="w-4 h-4" />
                      {financeData?.expenseCategoriesCount || 0} categories
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-red-100/80 to-pink-100/80 dark:from-red-900/40 dark:to-pink-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <Activity className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Net Profit
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      AED {(financeData?.netProfit || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2 font-medium">
                      {financeData?.netProfit >= 0 ? (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          Profitable
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-4 h-4" />
                          Loss
                        </>
                      )}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <PieChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Cash Balance
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      AED {(financeData?.cashBalance || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-2 font-medium">
                      <Activity className="w-4 h-4" />
                      {financeData?.glAccountsCount || 0} GL accounts
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100/80 to-indigo-100/80 dark:from-purple-900/40 dark:to-indigo-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <Banknote className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Finance Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financeModules.map(module => {
            // Update module stats based on financeData
            const updatedModule = { ...module }
            if (financeData) {
              switch (module.id) {
                case 'general-ledger':
                  updatedModule.stats = {
                    value: `${financeData.glAccountsCount || 0} Accounts`,
                    trend: 'neutral',
                    change: '0%'
                  }
                  break
                case 'accounts-payable':
                  updatedModule.stats = {
                    value: `${financeData.vendorsCount || 0} Vendors`,
                    trend: 'up',
                    change: '+2'
                  }
                  break
                case 'accounts-receivable':
                  updatedModule.stats = {
                    value: `${financeData.customersCount || 0} Customers`,
                    trend: 'up',
                    change: '+5'
                  }
                  break
                case 'expense-management':
                  updatedModule.stats = {
                    value: `${financeData.expenseCategoriesCount || 0} Categories`,
                    trend: 'neutral',
                    change: '0'
                  }
                  break
                case 'budgeting':
                  updatedModule.stats = {
                    value: `${financeData.budgetsCount || 0} Budgets`,
                    trend: 'up',
                    change: 'Active'
                  }
                  break
                case 'cash-management':
                  updatedModule.stats = {
                    value: `AED ${(financeData.cashBalance || 0).toLocaleString()}`,
                    trend: financeData.cashBalance > 0 ? 'up' : 'down',
                    change: financeData.cashBalance > 0 ? '+5%' : '-5%'
                  }
                  break
                case 'financial-reporting':
                  updatedModule.stats = {
                    value: `${financeData.transactionsCount || 0} Transactions`,
                    trend: 'up',
                    change: 'YTD'
                  }
                  break
              }
            }
            return (
              <Card
                key={module.id}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 cursor-pointer hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 group"
                onClick={() => router.push(module.href)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-white/40 dark:border-gray-700/40">
                      <updatedModule.icon className={cn('w-8 h-8', updatedModule.color)} />
                    </div>
                    {updatedModule.badge && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50 px-3 py-1 text-sm font-semibold"
                      >
                        {updatedModule.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {updatedModule.title}
                  </CardTitle>
                  <CardDescription className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                    {updatedModule.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  {updatedModule.stats && (
                    <div className="flex items-center justify-between mb-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          Current
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {updatedModule.stats.value}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {updatedModule.stats.trend === 'up' && (
                          <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                        {updatedModule.stats.trend === 'down' && (
                          <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                        {updatedModule.stats.trend === 'neutral' && (
                          <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                        <span
                          className={cn(
                            'font-semibold',
                            updatedModule.stats.trend === 'up' &&
                              'text-green-600 dark:text-green-400',
                            updatedModule.stats.trend === 'down' &&
                              'text-red-600 dark:text-red-400',
                            updatedModule.stats.trend === 'neutral' &&
                              'text-gray-600 dark:text-gray-400'
                          )}
                        >
                          {updatedModule.stats.change}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="gap-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 font-semibold"
                    >
                      Open Module
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300 text-base">
              Fast access to frequently used financial tools and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/finance/document-viewer')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/30 h-14 px-6"
              >
                <FileText className="w-5 h-5 mr-3" />
                View Documents
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/digital-accountant')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/30 h-14 px-6"
              >
                <Calculator className="w-5 h-5 mr-3" />
                Digital Accountant
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/financial-integration')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/30 h-14 px-6"
              >
                <FileSpreadsheet className="w-5 h-5 mr-3" />
                GL Integration
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/cashflow')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/30 h-14 px-6"
              >
                <DollarSign className="w-5 h-5 mr-3" />
                Cash Flow Analysis
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/trial-balance')}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/30 h-14 px-6"
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                Trial Balance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finance Settings Dialog */}
      <Dialog open={showFinanceSettings} onOpenChange={setShowFinanceSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Finance Setup Wizard
            </DialogTitle>
            <DialogDescription>
              Configure your Chart of Accounts and Fiscal Year settings
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="coa" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="coa" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Chart of Accounts
              </TabsTrigger>
              <TabsTrigger value="fiscal" className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4" />
                Fiscal Year
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coa" className="mt-6">
              <ChartOfAccountsStep
                data={wizardData as any}
                onChange={handleWizardChange}
                onSave={handleWizardSave}
                validationErrors={[]}
                organizationId={currentOrganization?.id || ''}
              />
            </TabsContent>

            <TabsContent value="fiscal" className="mt-6">
              <FiscalYearStep
                data={wizardData as any}
                onChange={handleWizardChange}
                onSave={handleWizardSave}
                validationErrors={[]}
                organizationId={currentOrganization?.id || ''}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={() => setShowFinanceSettings(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleWizardSave(wizardData)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
