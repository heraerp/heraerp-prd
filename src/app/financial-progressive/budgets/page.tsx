'use client'

import React, { useState, useEffect } from 'react'
import { FinancialTeamsSidebar } from '@/components/financial-progressive/FinancialTeamsSidebar'
import UniversalBudgetDashboard from '@/components/budgeting/UniversalBudgetDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Target, DollarSign, TrendingUp, Calculator, Users, 
  Building, Zap, CheckCircle, ArrowRight
} from 'lucide-react'

export default function BudgetingPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  // Mock workspace for progressive mode
  const workspace = {
    type: 'progressive',
    organization_name: 'Demo Financial Organization',
    organization_id: 'demo-org-123',
    data_status: 'sample'
  }
  const isAnonymous = true

  // Key features of HERA Universal Budgeting
  const budgetingFeatures = [
    {
      title: 'Multi-Dimensional Budgeting',
      description: 'Budget by cost center, profit center, product, geography, and project',
      icon: Building,
      status: 'Production Ready',
      smartCode: 'HERA.FIN.BUDGET.MULTI.DIM.v1'
    },
    {
      title: 'Driver-Based Planning',
      description: 'Link budgets to business drivers for accuracy and transparency',
      icon: TrendingUp,
      status: 'Production Ready',
      smartCode: 'HERA.FIN.BUDGET.DRIVER.BASED.v1'
    },
    {
      title: 'Real-Time Variance Analysis',
      description: 'Automatic budget vs actual comparison with AI insights',
      icon: Calculator,
      status: 'Production Ready',
      smartCode: 'HERA.FIN.BUDGET.VARIANCE.AUTO.v1'
    },
    {
      title: 'Rolling Forecasts',
      description: '12-month rolling forecasts with scenario planning',
      icon: Target,
      status: 'Production Ready',
      smartCode: 'HERA.FIN.FORECAST.ROLLING.v1'
    },
    {
      title: 'Approval Workflows',
      description: 'Multi-level approval process with automated notifications',
      icon: Users,
      status: 'Production Ready',
      smartCode: 'HERA.FIN.BUDGET.APPROVAL.v1'
    },
    {
      title: 'AI-Powered Insights',
      description: 'Intelligent recommendations and predictive analytics',
      icon: Zap,
      status: 'Production Ready',
      smartCode: 'HERA.FIN.BUDGET.AI.v1'
    }
  ]

  // Budget management benefits
  const budgetBenefits = [
    {
      metric: 'Planning Accuracy',
      value: '95%',
      improvement: '+40%',
      description: 'vs traditional spreadsheet budgeting'
    },
    {
      metric: 'Variance Detection',
      value: '24/7',
      improvement: 'Real-time',
      description: 'Automatic monitoring and alerts'
    },
    {
      metric: 'Budget Cycle Time',
      value: '2 weeks',
      improvement: '-80%',
      description: 'vs 10-week traditional process'
    },
    {
      metric: 'Forecast Updates',
      value: 'Monthly',
      improvement: 'vs Quarterly',
      description: 'Always current 12-month view'
    }
  ]

  useEffect(() => {
    // Progressive setup can be done here if needed
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Target className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Setting up your budgeting workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Teams-Style Sidebar */}
      <FinancialTeamsSidebar />
      
      <div className="ml-16">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Universal Budgeting & Forecasting
                  </h1>
                  <p className="text-sm text-slate-600">
                    {workspace.type === 'anonymous' ? 'Try it free - no signup required' : workspace.organization_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {isAnonymous && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Instant Access</span>
                  </div>
                )}
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Enterprise-Grade Budgeting
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
              Complete Budgeting & Financial Planning
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Universal budgeting system with multi-dimensional planning, real-time variance analysis, 
              rolling forecasts, and AI-powered insights. Plan with confidence and control your financial future.
            </p>
          </div>

          {/* Key Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {budgetBenefits.map((benefit, index) => (
              <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{benefit.value}</div>
                    <div className="text-sm font-medium text-gray-900 mb-2">{benefit.metric}</div>
                    <div className="flex items-center justify-center gap-1 text-green-600 text-sm">
                      <TrendingUp className="w-3 h-3" />
                      {benefit.improvement}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{benefit.description}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Universal Budgeting Features
              </CardTitle>
              <CardDescription>
                Enterprise-grade budgeting capabilities built on HERA's universal architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgetingFeatures.map((feature, index) => (
                  <div key={index} className="p-4 rounded-lg border hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <feature.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            {feature.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {feature.smartCode}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Budget Dashboard */}
          <UniversalBudgetDashboard 
            organizationId={workspace.organization_id}
            isAnonymous={isAnonymous}
          />

          {/* Implementation Highlight */}
          <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="text-center">
                <Target className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Revolutionary Universal Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div>
                    <h4 className="font-semibold mb-2">🏗️ Zero Custom Tables</h4>
                    <p className="text-blue-100 text-sm">
                      Budgets stored as entities, budget lines as transactions. 
                      No separate budget database schema required.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🧠 Smart Code Intelligence</h4>
                    <p className="text-blue-100 text-sm">
                      Every budget line has Smart Code classification for 
                      automatic insights and industry benchmarking.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">⚡ Instant Deployment</h4>
                    <p className="text-blue-100 text-sm">
                      Budget system works immediately on any HERA instance. 
                      No additional setup or configuration required.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>90% Cost Savings vs Traditional</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>2-Week vs 6-Month Implementation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}