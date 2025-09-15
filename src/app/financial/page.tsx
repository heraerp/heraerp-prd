'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import {
  Calculator,
  FileText,
  BarChart3,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  ArrowRight,
  BookOpen,
  FileSpreadsheet,
  PieChart,
  Wallet
} from 'lucide-react'

export default function FinancialDashboard() {
  const router = useRouter()
  const { currentOrganization } = useMultiOrgAuth()

  const financialModules = [
    {
      title: 'Trial Balance',
      description: 'Enterprise-grade trial balance with hierarchical GL accounts',
      icon: Calculator,
      path: '/trial-balance',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'General Ledger',
      description: 'Detailed transaction history for all GL accounts',
      icon: BookOpen,
      path: '/general-ledger',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Financial Statements',
      description: 'Balance Sheet, P&L, Cash Flow with IFRS compliance',
      icon: FileText,
      path: '/financial-statements',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Chart of Accounts',
      description: 'Manage GL accounts with universal COA engine',
      icon: FileSpreadsheet,
      path: '/chart-of-accounts',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Journal Entries',
      description: 'Manual and automatic journal entry management',
      icon: Receipt,
      path: '/journal-entries',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Budget Management',
      description: 'Comprehensive budgeting and variance analysis',
      icon: PieChart,
      path: '/budgets',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Auto-Journal Engine',
      description: 'AI-powered automatic journal posting with 85% automation',
      icon: TrendingUp,
      path: '/auto-journal',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Financial Analytics',
      description: 'Advanced financial analysis and reporting',
      icon: BarChart3,
      path: '/financial-analytics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  const quickStats = [
    { label: 'Total Assets', value: 'AED 2,456,789', icon: Wallet, trend: '+12.3%' },
    { label: 'Total Revenue', value: 'AED 845,230', icon: DollarSign, trend: '+8.7%' },
    { label: 'Net Profit', value: 'AED 234,567', icon: TrendingUp, trend: '+15.2%' },
    { label: 'Outstanding', value: 'AED 45,890', icon: CreditCard, trend: '-3.4%' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Management</h1>
              <p className="text-gray-600 text-lg">Enterprise financial accounting and reporting</p>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">{currentOrganization?.name || 'HERA ERP'}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {quickStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-8 h-8 text-gray-400" />
                    <span
                      className={`text-sm font-medium ${
                        stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Financial Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financialModules.map((module, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(module.path)}
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}
                >
                  <module.icon className={`w-6 h-6 ${module.color}`} />
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription className="text-sm">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Open Module
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activities */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Financial Activities</CardTitle>
            <CardDescription>Latest transactions and journal entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Journal Entry JE-2025-0089</p>
                    <p className="text-sm text-gray-500">Monthly depreciation posting</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">AED 12,450.00</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sales Revenue Posting</p>
                    <p className="text-sm text-gray-500">Auto-journal from POS system</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">AED 45,230.00</p>
                  <p className="text-sm text-gray-500">3 hours ago</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Supplier Payment PAY-2025-0456</p>
                    <p className="text-sm text-gray-500">Accounts payable settlement</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">AED 28,900.00</p>
                  <p className="text-sm text-gray-500">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
