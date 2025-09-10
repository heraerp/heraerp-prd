'use client'
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CircleDollarSign className="w-8 h-8 text-blue-600" />
              Finance Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive financial management and reporting
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/finance/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Current Organization */}
        {currentOrganization && (
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Organization</p>
                  <p className="font-semibold">{currentOrganization.organization_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Fiscal Year</p>
                  <p className="font-semibold">2025</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Period</p>
                  <p className="font-semibold">Q1</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">AED 523,450</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +12.5% from last month
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">AED 385,200</p>
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <ArrowDownRight className="w-3 h-3" />
                    -5.2% from last month
                  </p>
                </div>
                <Activity className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Profit</p>
                  <p className="text-2xl font-bold text-blue-600">AED 138,250</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +18.3% from last month
                  </p>
                </div>
                <PieChart className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cash Balance</p>
                  <p className="text-2xl font-bold text-purple-600">AED 285,000</p>
                  <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                    <Activity className="w-3 h-3" />
                    Healthy liquidity
                  </p>
                </div>
                <Banknote className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finance Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financeModules.map((module) => (
            <Card 
              key={module.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-gray-200 dark:border-gray-700"
              onClick={() => router.push(module.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-lg", module.bgColor)}>
                    <module.icon className={cn("w-6 h-6", module.color)} />
                  </div>
                  {module.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {module.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-4">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {module.stats && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
                      <p className="font-semibold">{module.stats.value}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {module.stats.trend === 'up' && (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      )}
                      {module.stats.trend === 'down' && (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      {module.stats.trend === 'neutral' && (
                        <Activity className="w-4 h-4 text-gray-600" />
                      )}
                      <span className={cn(
                        module.stats.trend === 'up' && 'text-green-600',
                        module.stats.trend === 'down' && 'text-red-600',
                        module.stats.trend === 'neutral' && 'text-gray-600'
                      )}>
                        {module.stats.change}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-end mt-4">
                  <Button variant="ghost" size="sm" className="gap-2">
                    Open
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/finance/document-viewer')}>
                <FileText className="w-4 h-4 mr-2" />
                View Documents
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/digital-accountant')}>
                <Calculator className="w-4 h-4 mr-2" />
                Digital Accountant
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/financial-integration')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                GL Integration
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/cashflow')}>
                <DollarSign className="w-4 h-4 mr-2" />
                Cash Flow Analysis
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/trial-balance')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Trial Balance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}