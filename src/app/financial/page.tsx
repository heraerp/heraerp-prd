'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  DollarSign, TrendingUp, Calculator, FileText, CreditCard, 
  BarChart3, PieChart, Building, Users, Target, ChevronRight,
  ArrowUpRight, Bell, Search, MoreHorizontal, Settings,
  Wallet, Receipt, BanknoteIcon, Clock, CheckCircle,
  AlertTriangle, Activity, Zap, Shield, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FinancialManagementPage() {
  const { user, workspace } = useAuth()
  const [selectedModule, setSelectedModule] = useState<string>('dashboard')

  // Financial Modules using HERA DNA patterns
  const financialModules = [
    {
      id: 'gl',
      title: 'General Ledger',
      description: 'Complete chart of accounts and journal entries',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      smartCode: 'HERA.FIN.GL',
      features: ['Journal Entries', 'Trial Balance', 'Financial Statements'],
      status: 'Production Ready',
      transactions: '1,247',
      url: '/financial/gl'
    },
    {
      id: 'ar',
      title: 'Accounts Receivable',
      description: 'Customer invoicing and payment tracking',
      icon: CreditCard,
      color: 'from-green-500 to-green-600',
      smartCode: 'HERA.FIN.AR',
      features: ['Invoicing', 'Payment Tracking', 'Aging Reports'],
      status: 'Production Ready',
      transactions: '892',
      url: '/financial/ar'
    },
    {
      id: 'ap',
      title: 'Accounts Payable',
      description: 'Vendor bill management and payments',
      icon: Receipt,
      color: 'from-red-500 to-red-600',
      smartCode: 'HERA.FIN.AP',
      features: ['Bill Processing', 'Payment Scheduling', 'Vendor Reports'],
      status: 'Production Ready',
      transactions: '564',
      url: '/financial/ap'
    },
    {
      id: 'cash',
      title: 'Cash Management',
      description: 'Bank reconciliation and cash flow',
      icon: Wallet,
      color: 'from-purple-500 to-purple-600',
      smartCode: 'HERA.FIN.BL',
      features: ['Bank Reconciliation', 'Cash Flow', 'Check Processing'],
      status: 'Production Ready',
      transactions: '324',
      url: '/financial/cash'
    },
    {
      id: 'assets',
      title: 'Fixed Assets',
      description: 'Asset tracking and depreciation',
      icon: Building,
      color: 'from-orange-500 to-orange-600',
      smartCode: 'HERA.FIN.AA',
      features: ['Asset Register', 'Depreciation', 'Asset Disposal'],
      status: 'Production Ready',
      transactions: '156',
      url: '/financial/assets'
    },
    {
      id: 'budget',
      title: 'Budgeting',
      description: 'Budget planning and variance analysis',
      icon: Target,
      color: 'from-indigo-500 to-indigo-600',
      smartCode: 'HERA.FIN.BD',
      features: ['Budget Creation', 'Variance Analysis', 'Forecasting'],
      status: 'Production Ready',
      transactions: '89',
      url: '/financial/budget'
    },
    {
      id: 'tax',
      title: 'Tax Management',
      description: 'Tax calculation and compliance',
      icon: Calculator,
      color: 'from-yellow-500 to-yellow-600',
      smartCode: 'HERA.FIN.TX',
      features: ['VAT/GST', 'Tax Returns', 'Compliance'],
      status: 'Production Ready',
      transactions: '234',
      url: '/financial/tax'
    },
    {
      id: 'reporting',
      title: 'Financial Reports',
      description: 'Executive dashboards and analytics',
      icon: BarChart3,
      color: 'from-teal-500 to-teal-600',
      smartCode: 'HERA.FIN.REPT',
      features: ['Executive Dashboard', 'KPI Reports', 'AI Insights'],
      status: 'Production Ready',
      transactions: '∞',
      url: '/financial/reports'
    }
  ]

  // Key Performance Indicators
  const kpis = [
    {
      title: 'Total Revenue',
      value: '$2,847,592',
      change: '+12.4%',
      trend: 'up',
      smartCode: 'HERA.FIN.REPT.KPI.REV.v1'
    },
    {
      title: 'Net Profit Margin',
      value: '18.3%',
      change: '+2.1%',
      trend: 'up',
      smartCode: 'HERA.FIN.REPT.KPI.NPM.v1'
    },
    {
      title: 'Current Ratio',
      value: '2.4:1',
      change: '+0.3',
      trend: 'up',
      smartCode: 'HERA.FIN.REPT.KPI.CR.v1'
    },
    {
      title: 'Cash Position',
      value: '$487,293',
      change: '-5.2%',
      trend: 'down',
      smartCode: 'HERA.FIN.REPT.KPI.CASH.v1'
    }
  ]

  // Recent Financial Activities
  const recentActivities = [
    {
      type: 'Journal Entry',
      description: 'Monthly depreciation entries posted',
      amount: '$12,450',
      time: '2 hours ago',
      smartCode: 'HERA.FIN.GL.TXN.JE.v1',
      status: 'completed'
    },
    {
      type: 'Invoice',
      description: 'Invoice #INV-2024-1234 sent to TechCorp',
      amount: '$25,000',
      time: '4 hours ago',
      smartCode: 'HERA.FIN.AR.TXN.INV.v1',
      status: 'sent'
    },
    {
      type: 'Payment',
      description: 'Vendor payment to Office Supplies Inc.',
      amount: '$3,250',
      time: '6 hours ago',
      smartCode: 'HERA.FIN.AP.TXN.PMT.v1',
      status: 'processed'
    },
    {
      type: 'Bank Transfer',
      description: 'Transfer to savings account',
      amount: '$50,000',
      time: '1 day ago',
      smartCode: 'HERA.FIN.BL.TXN.TRF.v1',
      status: 'completed'
    }
  ]

  // Financial Insights (AI-powered)
  const insights = [
    {
      type: 'opportunity',
      title: 'Early Payment Discounts',
      description: 'You could save $1,247 by taking early payment discounts from 3 vendors',
      smartCode: 'HERA.FIN.REPT.AI.INS.v1',
      priority: 'medium'
    },
    {
      type: 'alert',
      title: 'Cash Flow Alert',
      description: 'Projected cash shortage of $15K in 2 weeks. Consider accounts receivable collection',
      smartCode: 'HERA.FIN.REPT.AI.CASH.v1',
      priority: 'high'
    },
    {
      type: 'trend',
      title: 'Revenue Growth',
      description: 'Revenue is trending 18% above budget. Consider expanding operations',
      smartCode: 'HERA.FIN.REPT.AI.PRED.v1',
      priority: 'low'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      {/* Teams-Style Financial Sidebar */}
      <aside className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4">
          <div className="space-y-2 px-3">
            {/* Dashboard */}
            <button
              onClick={() => setSelectedModule('dashboard')}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                selectedModule === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm'
              }`}
              title="Dashboard"
            >
              <BarChart3 className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Dashboard
              </div>
            </button>

            {/* Financial Modules */}
            {financialModules.map((module) => (
              <button
                key={module.id}
                onClick={() => window.location.href = module.url}
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                  selectedModule === module.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm'
                }`}
                title={module.title}
              >
                <module.icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {module.title}
                  <div className="text-gray-300 text-xs mt-1">{module.transactions} transactions</div>
                </div>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-6 my-6 h-px bg-gray-200" />

          {/* Quick Actions */}
          <div className="space-y-2 px-3">
            <button 
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title="New Journal Entry"
            >
              <FileText className="w-4 h-4" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                New Journal Entry
              </div>
            </button>

            <button 
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title="Create Invoice"
            >
              <Receipt className="w-4 h-4" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Create Invoice
              </div>
            </button>

            <button 
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title="Record Payment"
            >
              <CreditCard className="w-4 h-4" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Record Payment
              </div>
            </button>

            <button 
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title="View Reports"
            >
              <TrendingUp className="w-4 h-4" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                View Reports
              </div>
            </button>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-2">
            {/* Settings */}
            <button 
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title="Financial Settings"
            >
              <Settings className="w-4 h-4" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Financial Settings
              </div>
            </button>

            {/* System Status */}
            <button 
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title="System Status: All Active"
            >
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                System Status
                <div className="text-green-300">All modules active</div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  HERA Universal Financial Accounting System • 8 Core Modules
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  200+ Smart Codes Active
                </Badge>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Financial Setup
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto px-8 py-8">
        {/* KPI Dashboard */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      <div className="flex items-center mt-2">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-red-500 mr-1 rotate-180" />
                        )}
                        <span className={`text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {kpi.change}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs">
                      {kpi.smartCode}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Financial Modules Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {financialModules.map((module) => (
              <Card 
                key={module.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => window.location.href = module.url}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {module.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{module.transactions} txns</span>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {module.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {module.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {module.smartCode}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Financial Activities
                </CardTitle>
                <CardDescription>
                  Latest transactions and financial events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.status === 'completed' ? 'bg-green-100' :
                          activity.status === 'sent' ? 'bg-blue-100' :
                          activity.status === 'processed' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          {activity.type === 'Journal Entry' && <FileText className="w-5 h-5 text-green-600" />}
                          {activity.type === 'Invoice' && <Receipt className="w-5 h-5 text-blue-600" />}
                          {activity.type === 'Payment' && <CreditCard className="w-5 h-5 text-purple-600" />}
                          {activity.type === 'Bank Transfer' && <Wallet className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{activity.smartCode}</Badge>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{activity.amount}</p>
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  AI Financial Insights
                </CardTitle>
                <CardDescription>
                  Smart recommendations and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      insight.priority === 'high' ? 'border-red-500 bg-red-50' :
                      insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-green-500 bg-green-50'
                    }`}>
                      <div className="flex items-start gap-2 mb-2">
                        {insight.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />}
                        {insight.type === 'opportunity' && <Target className="w-4 h-4 text-yellow-500 mt-0.5" />}
                        {insight.type === 'trend' && <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />}
                        <div>
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          <Badge variant="outline" className="text-xs mt-2">
                            {insight.smartCode}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Journal Entry</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    <span className="text-xs">Create Invoice</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs">Record Payment</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs">View Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Financial Health Score */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Financial Health Score: 87/100
            </CardTitle>
            <CardDescription>
              Based on HERA's AI analysis of your financial data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Good</div>
                <div className="text-sm text-gray-600">Liquidity</div>
                <Badge className="mt-2 bg-green-100 text-green-700">HERA.FIN.REPT.KPI.CR.v1</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Excellent</div>
                <div className="text-sm text-gray-600">Profitability</div>
                <Badge className="mt-2 bg-blue-100 text-blue-700">HERA.FIN.REPT.KPI.NPM.v1</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">Fair</div>
                <div className="text-sm text-gray-600">Efficiency</div>
                <Badge className="mt-2 bg-yellow-100 text-yellow-700">HERA.FIN.REPT.KPI.RTO.v1</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}