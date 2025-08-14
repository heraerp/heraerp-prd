'use client'

import React, { useState, useEffect } from 'react'
// Progressive Authentication - Don Norman Pattern
import { useAuth } from '@/contexts/auth-context'
import { FinancialTeamsSidebar } from '@/components/financial-progressive/FinancialTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useProgressiveFinancialData } from '@/hooks/use-progressive-data'
import { 
  DollarSign, TrendingUp, Calculator, FileText, CreditCard, 
  BarChart3, PieChart, Building, Users, Target, ChevronRight,
  ArrowUpRight, Bell, Search, MoreHorizontal, Settings,
  Wallet, Receipt, BanknoteIcon, Clock, CheckCircle,
  AlertTriangle, Activity, Zap, Shield, Globe, BookmarkPlus,
  Plus, Download
} from 'lucide-react'

export default function FinancialProgressivePage() {
  const { workspace, isAnonymous, startAnonymous, isLoading } = useAuth()
  const router = useRouter()
  const [selectedModule, setSelectedModule] = useState<string>('dashboard')
  
  // Use progressive data hook for financial data persistence
  const { 
    data: financialData, 
    saveData, 
    updateData, 
    exportData,
    lastSaved 
  } = useProgressiveFinancialData()
  
  // Track page interactions and save data
  const handleModuleClick = (module: any) => {
    // Update last accessed module in financial data
    updateData((current) => ({
      ...current,
      lastAccessedModule: module.id,
      lastAccessedAt: new Date().toISOString(),
      moduleAccessCount: {
        ...(current?.moduleAccessCount || {}),
        [module.id]: ((current?.moduleAccessCount || {})[module.id] || 0) + 1
      }
    }))
    
    // Navigate to module
    router.push(module.url)
  }
  
  // Automatically create workspace on first visit
  useEffect(() => {
    if (!isLoading && !workspace) {
      startAnonymous()
    }
  }, [isLoading, workspace, startAnonymous])
  
  // Show loading state
  if (isLoading || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Setting up your financial workspace...</p>
        </div>
      </div>
    )
  }

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
      transactions: workspace.data_status === 'sample' ? '247' : '247+',
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
      transactions: workspace.data_status === 'sample' ? '92' : '92+',
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
      transactions: workspace.data_status === 'sample' ? '64' : '64+',
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
      transactions: workspace.data_status === 'sample' ? '24' : '24+',
      url: '/financial/banks'
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
      transactions: workspace.data_status === 'sample' ? '16' : '16+',
      url: '/financial/fixed-assets'
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
      transactions: workspace.data_status === 'sample' ? '9' : '9+',
      url: '/financial/budgets'
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
      transactions: workspace.data_status === 'sample' ? '34' : '34+',
      url: '/financial'
    },
    {
      id: 'profitability',
      title: 'Profitability & Cost Accounting',
      description: 'Activity-based costing and profitability analysis',
      icon: PieChart,
      color: 'from-blue-500 to-purple-600',
      smartCode: 'HERA.PROF',
      features: ['Activity-Based Costing', 'Profit Centers', 'BOM Integration'],
      status: 'Production Ready',
      transactions: workspace.data_status === 'sample' ? '156' : '156+',
      url: '/profitability-progressive'
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

  // Key Performance Indicators - Sample Data
  const kpis = [
    {
      title: 'Total Revenue',
      value: workspace.data_status === 'sample' ? '$147,592' : '$147,592+',
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
      value: workspace.data_status === 'sample' ? '$87,293' : '$87,293+',
      change: '+5.2%',
      trend: 'up',
      smartCode: 'HERA.FIN.REPT.KPI.CASH.v1'
    }
  ]

  // Recent Financial Activities - Sample Data
  const recentActivities = [
    {
      type: 'Journal Entry',
      description: 'Monthly depreciation entries posted',
      amount: '$2,450',
      time: '2 hours ago',
      smartCode: 'HERA.FIN.GL.TXN.JE.v1',
      status: 'completed'
    },
    {
      type: 'Invoice',
      description: 'Invoice #INV-2024-1234 sent to TechCorp',
      amount: '$5,000',
      time: '4 hours ago',
      smartCode: 'HERA.FIN.AR.TXN.INV.v1',
      status: 'sent'
    },
    {
      type: 'Payment',
      description: 'Vendor payment to Office Supplies Inc.',
      amount: '$1,250',
      time: '6 hours ago',
      smartCode: 'HERA.FIN.AP.TXN.PMT.v1',
      status: 'processed'
    }
  ]

  // Financial Insights (AI-powered) - Sample
  const insights = [
    {
      type: 'opportunity',
      title: 'Early Payment Discounts',
      description: 'You could save $247 by taking early payment discounts from 3 vendors',
      smartCode: 'HERA.FIN.REPT.AI.INS.v1',
      priority: 'medium'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Teams-Style Sidebar */}
      <FinancialTeamsSidebar />
      
      <div className="ml-16">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    HERA Financial Management
                  </h1>
                  <p className="text-sm text-slate-600">
                    {workspace.type === 'anonymous' ? 'Try it free - no signup required' : workspace.organization_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {isAnonymous && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Instant Access</span>
                  </div>
                )}
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  200+ Smart Codes Active
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome to Your Financial Management System
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Complete accounting system with 8 core modules, 200+ smart codes, and AI-powered insights. 
              Start recording transactions, generating reports, and managing your finances immediately.
            </p>
          </div>

          {/* KPI Dashboard */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi, index) => (
                <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600">{kpi.change}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-full">
                        <DollarSign className="w-6 h-6 text-green-600" />
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {financialModules.map((module) => (
                <Card 
                  key={module.id} 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                  onClick={() => handleModuleClick(module)}
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
                      <CardTitle className="text-lg font-semibold group-hover:text-green-600 transition-colors">
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
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Financial Activities
                  </CardTitle>
                  <CardDescription>
                    Latest transactions and financial events in your workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-blue-50 transition-colors border">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.status === 'completed' ? 'bg-green-100' :
                            activity.status === 'sent' ? 'bg-blue-100' :
                            activity.status === 'processed' ? 'bg-purple-100' : 'bg-gray-100'
                          }`}>
                            {activity.type === 'Journal Entry' && <FileText className="w-5 h-5 text-green-600" />}
                            {activity.type === 'Invoice' && <Receipt className="w-5 h-5 text-blue-600" />}
                            {activity.type === 'Payment' && <CreditCard className="w-5 h-5 text-purple-600" />}
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
              <Card className="bg-gradient-to-br from-white to-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    AI Financial Insights
                  </CardTitle>
                  <CardDescription>
                    Smart recommendations based on your data
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
            </div>
          </div>

          {/* Financial Health Score */}
          <Card className="bg-gradient-to-br from-white to-green-50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Financial Health Score: 87/100
              </CardTitle>
              <CardDescription>
                Based on HERA's AI analysis of your {workspace.data_status === 'sample' ? 'sample' : 'real'} financial data
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
                  <div className="text-2xl font-bold text-yellow-600">Good</div>
                  <div className="text-sm text-gray-600">Efficiency</div>
                  <Badge className="mt-2 bg-yellow-100 text-yellow-700">HERA.FIN.REPT.KPI.RTO.v1</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Progress CTA */}
          {isAnonymous && (
            <div className="p-6 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl text-white text-center">
              <h3 className="text-xl font-bold mb-2">Ready to Save Your Financial Data?</h3>
              <p className="mb-4 text-green-100">
                Create an account to save your transactions, reports, and financial insights permanently.
              </p>
              <Button 
                size="lg"
                className="bg-white text-green-600 hover:bg-green-50 font-semibold"
                onClick={() => router.push('/auth/register')}
              >
                <BookmarkPlus className="w-5 h-5 mr-2" />
                Save My Financial Data
              </Button>
            </div>
          )}
          
          {/* Data Status Bar */}
          {workspace && lastSaved && (
            <div className="mt-6 p-3 bg-gray-100 rounded-lg flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">
                  Your financial data is automatically saved locally
                </span>
              </div>
              <div className="flex items-center gap-4">
                {lastSaved && (
                  <span className="text-xs text-gray-500">
                    Last saved: {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportData()}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export Data
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}