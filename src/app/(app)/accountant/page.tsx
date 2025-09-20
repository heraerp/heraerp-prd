// ================================================================================
// HERA ACCOUNTANT DASHBOARD
// Smart Code: HERA.SALON.DASHBOARD.ACCOUNTANT.v1
// Dashboard for salon accountants with financial focus
// ================================================================================

'use client'

import React from 'react'
import { Loader2, TrendingUp, DollarSign, FileText, Calendar, AlertTriangle, ChevronRight, Download } from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Guard } from '@/lib/auth/guard'
import { useDashboardMetrics } from '@/lib/api/dashboard'
import { useFinancialReports } from '@/lib/api/reports'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'

export default function AccountantDashboard() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || ''

  // Fetch financial data
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(organizationId)
  const { data: reports, isLoading: reportsLoading } = useFinancialReports(organizationId)

  const isLoading = contextLoading || metricsLoading || reportsLoading

  // Financial KPIs
  const financialKpis = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(metrics?.monthlyRevenue || 0),
      change: '+12.5%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Outstanding Receivables',
      value: formatCurrency(metrics?.outstandingReceivables || 0),
      change: '-5.2%',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(metrics?.monthlyExpenses || 0),
      change: '+3.1%',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Net Profit Margin',
      value: `${metrics?.netProfitMargin || 0}%`,
      change: '+2.3%',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ]

  // Recent reports
  const recentReports = [
    { name: 'Profit & Loss Statement', date: '2024-01-31', status: 'ready' },
    { name: 'Balance Sheet', date: '2024-01-31', status: 'ready' },
    { name: 'Cash Flow Statement', date: '2024-01-31', status: 'generating' },
    { name: 'Trial Balance', date: '2024-01-31', status: 'ready' },
    { name: 'Tax Report', date: '2024-01-31', status: 'ready' }
  ]

  // Pending tasks
  const pendingTasks = [
    { task: 'Review January expense entries', due: '2024-02-05', priority: 'high' },
    { task: 'Reconcile bank statements', due: '2024-02-07', priority: 'medium' },
    { task: 'Prepare VAT return', due: '2024-02-15', priority: 'high' },
    { task: 'Update depreciation schedule', due: '2024-02-10', priority: 'low' }
  ]

  return (
    <Guard allowedRoles={['accountant']}>
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-white">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading financial data...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Financial Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor financial health and prepare reports for {currentOrganization?.name || 'the salon'}
              </p>
            </div>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {financialKpis.map((kpi, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                      <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                    <span className={`text-sm font-medium ${kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change}
                    </span>
                  </div>
                  <h3 className="text-sm text-gray-600 mb-1">{kpi.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports Section */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Financial Reports</h2>
                      <Link href="/reports">
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {recentReports.map((report, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <FileText className="w-5 h-5 text-violet-600" />
                          <div>
                            <p className="font-medium text-gray-900">{report.name}</p>
                            <p className="text-sm text-gray-600">{report.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {report.status === 'ready' ? (
                            <>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Ready</span>
                              <Button size="sm" variant="ghost">
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Generating</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Tasks Section */}
              <div>
                <Card className="h-full">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {pendingTasks.map((task, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900">{task.task}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : task.priority === 'medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {task.due}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/finance/closing">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Period Closing
                    </Button>
                  </Link>
                  <Link href="/finance/rules">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      GL Rules
                    </Button>
                  </Link>
                  <Link href="/reports/new">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </Card>

            {/* Compliance Alerts */}
            <Card className="border-yellow-200 bg-yellow-50">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Compliance Reminders</h2>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-700">
                    <ChevronRight className="w-4 h-4 mr-2 text-yellow-600" />
                    VAT return due in 12 days
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <ChevronRight className="w-4 h-4 mr-2 text-yellow-600" />
                    Year-end closing preparations needed
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <ChevronRight className="w-4 h-4 mr-2 text-yellow-600" />
                    Employee tax forms distribution deadline approaching
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Guard>
  )
}