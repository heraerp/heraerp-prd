'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Salon Finance Dashboard
 * Smart Code: HERA.SALON.FINANCE.DASHBOARD.v1
 * 
 * Finance management hub for salon operations
 */

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Calculator,
  ChevronRight,
  BarChart3,
  Calendar,
  PieChart,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SalonFinanceDashboard() {
  // Mock data for quick stats
  const quickStats = {
    todayRevenue: 12500,
    monthRevenue: 285000,
    pendingPayments: 4500,
    monthGrowth: 12.5
  }

  const financeModules = [
    {
      id: 'daily-close',
      title: 'Daily Cash Close',
      description: 'Close shifts, reconcile cash, and submit card batches',
      icon: <Lock className="w-8 h-8" />,
      href: '/salon-data/finance/daily-close',
      color: 'from-purple-500 to-purple-700',
      stats: { label: 'Open Shifts', value: '1' }
    },
    {
      id: 'reports',
      title: 'Financial Reports',
      description: 'P&L statements, balance sheets, and cash flow reports',
      icon: <FileText className="w-8 h-8" />,
      href: '/salon-data/finance/reports',
      color: 'from-blue-500 to-indigo-600',
      stats: { label: 'Reports Ready', value: '3' }
    },
    {
      id: 'analytics',
      title: 'Revenue Analytics',
      description: 'Sales trends, service profitability, and KPI tracking',
      icon: <BarChart3 className="w-8 h-8" />,
      href: '/salon-data/finance/analytics',
      color: 'from-emerald-500 to-teal-600',
      stats: { label: 'YTD Growth', value: '+24%' }
    },
    {
      id: 'invoicing',
      title: 'Invoicing & Payments',
      description: 'Create invoices, track payments, and manage receivables',
      icon: <Receipt className="w-8 h-8" />,
      href: '/salon-data/finance/invoicing',
      color: 'from-amber-500 to-orange-600',
      stats: { label: 'Pending', value: '7' }
    },
    {
      id: 'expenses',
      title: 'Expense Management',
      description: 'Track expenses, manage vendors, and control costs',
      icon: <Calculator className="w-8 h-8" />,
      href: '/salon-data/finance/expenses',
      color: 'from-red-500 to-pink-600',
      stats: { label: 'This Month', value: 'AED 45K' }
    },
    {
      id: 'payroll',
      title: 'Commission & Payroll',
      description: 'Calculate commissions, tips, and manage payroll',
      icon: <Banknote className="w-8 h-8" />,
      href: '/salon-data/finance/payroll',
      color: 'from-green-500 to-emerald-600',
      stats: { label: 'Next Run', value: 'In 5 days' }
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Finance Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete financial control for your salon operations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today's Revenue</span>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(quickStats.todayRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                +15% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Month to Date</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(quickStats.monthRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {quickStats.monthGrowth > 0 ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 inline mr-1 text-green-500" />
                    +{quickStats.monthGrowth}% growth
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3 h-3 inline mr-1 text-red-500" />
                    {quickStats.monthGrowth}% decline
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Payments</span>
                <CreditCard className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(quickStats.pendingPayments)}</p>
              <p className="text-xs text-gray-500 mt-1">
                From 7 invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</span>
                <PieChart className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">42.5%</p>
              <p className="text-xs text-gray-500 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                +2.3% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Finance Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financeModules.map(module => (
            <Link key={module.id} href={module.href}>
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                      module.color
                    )}>
                      {module.icon}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {module.stats.label}
                    </span>
                    <span className="font-semibold">{module.stats.value}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Financial Activity</CardTitle>
            <CardDescription>Latest transactions and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Payment Received</p>
                    <p className="text-sm text-gray-500">Invoice #1234 - Sarah Ahmed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+{formatCurrency(850)}</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Card Batch Submitted</p>
                    <p className="text-sm text-gray-500">Network International - 62 transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(8700)}</p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Expense Recorded</p>
                    <p className="text-sm text-gray-500">Salon Supplies - Beauty Pro Distributors</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">-{formatCurrency(2340)}</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}