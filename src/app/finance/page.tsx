'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Finance Dashboard
 * Smart Code: HERA.FIN.DASHBOARD.v1
 * 
 * Central hub for all financial operations
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
      value: '85 Accounts',
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
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading financial modules...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the finance dashboard.
          </AlertDescription>
        </Alert>
      </div>
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
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Current Organization</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{currentOrganization.organization_name}</p>
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">AED 523,450</p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-2 font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    +12.5% from last month
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
                  <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">AED 385,200</p>
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-2 font-medium">
                    <ArrowDownRight className="w-4 h-4" />
                    -5.2% from last month
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
                  <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">Net Profit</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">AED 138,250</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2 font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    +18.3% from last month
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
                  <p className="text-base text-gray-700 dark:text-gray-300 font-medium mb-2">Cash Balance</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">AED 285,000</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-2 font-medium">
                    <Activity className="w-4 h-4" />
                    Healthy liquidity
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100/80 to-indigo-100/80 dark:from-purple-900/40 dark:to-indigo-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Banknote className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finance Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financeModules.map((module) => (
            <Card 
              key={module.id}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 cursor-pointer hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 group"
              onClick={() => router.push(module.href)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-white/40 dark:border-gray-700/40">
                    <module.icon className={cn("w-8 h-8", module.color)} />
                  </div>
                  {module.badge && (
                    <Badge variant="secondary" className="bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50 px-3 py-1 text-sm font-semibold">
                      {module.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">{module.title}</CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                {module.stats && (
                  <div className="flex items-center justify-between mb-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Current</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{module.stats.value}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {module.stats.trend === 'up' && (
                        <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                      )}
                      {module.stats.trend === 'down' && (
                        <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      {module.stats.trend === 'neutral' && (
                        <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                      <span className={cn(
                        "font-semibold",
                        module.stats.trend === 'up' && 'text-green-600 dark:text-green-400',
                        module.stats.trend === 'down' && 'text-red-600 dark:text-red-400',
                        module.stats.trend === 'neutral' && 'text-gray-600 dark:text-gray-400'
                      )}>
                        {module.stats.change}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-end">
                  <Button variant="ghost" size="lg" className="gap-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 font-semibold">
                    Open Module
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</CardTitle>
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
    </div>
  )
}