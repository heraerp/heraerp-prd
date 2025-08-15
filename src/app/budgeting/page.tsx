'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Target, DollarSign, TrendingUp, Calculator, BarChart3, 
  PieChart, Users, Calendar, Building, Zap, ArrowRight,
  CheckCircle, Plus, Search, Filter, Download, RefreshCw,
  Scissors, Briefcase, Stethoscope, ShoppingCart, Utensils,
  Wrench, GraduationCap, Home, Car, Palette
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BudgetingAppPage() {
  const router = useRouter()
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Industry-specific budgeting apps
  const budgetingApps = [
    {
      id: 'salon',
      title: 'Salon & Beauty Budgeting',
      description: 'Complete budgeting for salon operations with service-based revenue planning',
      icon: Scissors,
      color: 'from-pink-500 to-purple-600',
      bgColor: 'from-pink-50 to-purple-50',
      borderColor: 'border-pink-300',
      industry: 'Beauty & Wellness',
      features: ['Service Revenue Planning', 'Staff Commission Budgets', 'Product Inventory Costs'],
      metrics: {
        revenue_model: 'Service-based',
        labor_percentage: '40%',
        cogs_percentage: '20%',
        profit_margin: '35%'
      },
      url: '/budgeting/salon'
    },
    {
      id: 'restaurant',
      title: 'Restaurant Budgeting',
      description: 'Food service budgeting with ingredient costing and seasonal planning',
      icon: Utensils,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-300',
      industry: 'Food & Beverage',
      features: ['Menu Cost Analysis', 'Seasonal Revenue Planning', 'Labor Schedule Budgets'],
      metrics: {
        revenue_model: 'Product-based',
        labor_percentage: '30%',
        cogs_percentage: '35%',
        profit_margin: '25%'
      },
      url: '/budgeting/restaurant'
    },
    {
      id: 'healthcare',
      title: 'Healthcare Budgeting',
      description: 'Medical practice budgeting with patient volume and treatment planning',
      icon: Stethoscope,
      color: 'from-blue-500 to-teal-600',
      bgColor: 'from-blue-50 to-teal-50',
      borderColor: 'border-blue-300',
      industry: 'Healthcare',
      features: ['Patient Volume Planning', 'Equipment Depreciation', 'Staff Scheduling Costs'],
      metrics: {
        revenue_model: 'Service-based',
        labor_percentage: '45%',
        cogs_percentage: '25%',
        profit_margin: '20%'
      },
      url: '/budgeting/healthcare'
    },
    {
      id: 'retail',
      title: 'Retail Budgeting',
      description: 'Retail operations budgeting with inventory planning and sales forecasting',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-300',
      industry: 'Retail',
      features: ['Inventory Planning', 'Sales Forecasting', 'Marketing Campaign Budgets'],
      metrics: {
        revenue_model: 'Product-based',
        labor_percentage: '20%',
        cogs_percentage: '50%',
        profit_margin: '25%'
      },
      url: '/budgeting/retail'
    },
    {
      id: 'consulting',
      title: 'Professional Services',
      description: 'Consulting and professional services budgeting with project-based planning',
      icon: Briefcase,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-300',
      industry: 'Professional Services',
      features: ['Project-Based Budgets', 'Utilization Planning', 'Client Retention Costs'],
      metrics: {
        revenue_model: 'Time-based',
        labor_percentage: '60%',
        cogs_percentage: '10%',
        profit_margin: '25%'
      },
      url: '/budgeting/consulting'
    },
    {
      id: 'manufacturing',
      title: 'Manufacturing Budgeting',
      description: 'Production budgeting with material costs and capacity planning',
      icon: Wrench,
      color: 'from-gray-500 to-slate-600',
      bgColor: 'from-gray-50 to-slate-50',
      borderColor: 'border-gray-300',
      industry: 'Manufacturing',
      features: ['Production Planning', 'Material Cost Budgets', 'Capacity Utilization'],
      metrics: {
        revenue_model: 'Product-based',
        labor_percentage: '25%',
        cogs_percentage: '45%',
        profit_margin: '20%'
      },
      url: '/budgeting/manufacturing'
    }
  ]

  const quickActions = [
    {
      title: 'Create New Budget',
      description: 'Start a new annual or project budget',
      icon: Plus,
      action: () => router.push('/budgeting/create')
    },
    {
      title: 'Budget Templates',
      description: 'Browse industry-specific templates',
      icon: Target,
      action: () => setSelectedIndustry('templates')
    },
    {
      title: 'Variance Analysis',
      description: 'Analyze budget vs actual performance',
      icon: BarChart3,
      action: () => router.push('/budgeting/analysis')
    },
    {
      title: 'Rolling Forecasts',
      description: 'Create 12-month rolling forecasts',
      icon: TrendingUp,
      action: () => router.push('/budgeting/forecasts')
    }
  ]

  const budgetingBenefits = [
    {
      metric: 'Setup Time',
      value: '30 Seconds',
      description: 'vs 6+ months traditional',
      icon: Zap
    },
    {
      metric: 'Cost Savings',
      value: '90%',
      description: 'vs separate budgeting software',
      icon: DollarSign
    },
    {
      metric: 'Planning Accuracy',
      value: '95%',
      description: 'with driver-based budgeting',
      icon: Target
    },
    {
      metric: 'Real-Time Updates',
      value: '24/7',
      description: 'continuous variance monitoring',
      icon: RefreshCw
    }
  ]

  const handleAppSelection = (app: any) => {
    setIsLoading(true)
    setSelectedIndustry(app.id)
    
    // Simulate brief loading then navigate
    setTimeout(() => {
      router.push(app.url)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <Target className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  HERA Budgeting Apps
                </h1>
                <p className="text-sm text-slate-600">
                  Industry-specific budgeting and forecasting applications
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <CheckCircle className="w-4 h-4 mr-1" />
                Production Ready
              </Badge>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Budget
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Benefits Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {budgetingBenefits.map((benefit, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{benefit.value}</div>
                <div className="text-sm font-medium text-gray-900 mb-2">{benefit.metric}</div>
                <div className="text-xs text-gray-600">{benefit.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-12 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Get started with budgeting in seconds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-24 flex-col p-4 hover:bg-blue-50 hover:border-blue-300"
                  onClick={action.action}
                >
                  <action.icon className="w-6 h-6 mb-2 text-blue-600" />
                  <div className="text-sm font-medium">{action.title}</div>
                  <div className="text-xs text-gray-500 mt-1 text-center">{action.description}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry-Specific Budgeting Apps */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Choose Your Industry Budgeting App
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Pre-configured budgeting applications with industry-specific templates, 
              drivers, and best practices built-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {budgetingApps.map((app) => (
              <Card 
                key={app.id}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br ${app.bgColor} border-2 ${app.borderColor} ${
                  selectedIndustry === app.id ? 'ring-4 ring-blue-300 scale-105' : ''
                } ${isLoading && selectedIndustry === app.id ? 'animate-pulse' : ''}`}
                onClick={() => handleAppSelection(app)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${app.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <app.icon className="w-8 h-8 text-white" />
                    </div>
                    <Badge variant="outline" className="bg-white/80">
                      {app.industry}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                      {app.title}
                    </CardTitle>
                    <CardDescription className="text-gray-700 mt-2">
                      {app.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {app.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="bg-white/60 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Budget Framework</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Labor:</span>
                        <span className="font-semibold ml-2">{app.metrics.labor_percentage}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">COGS:</span>
                        <span className="font-semibold ml-2">{app.metrics.cogs_percentage}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Model:</span>
                        <span className="font-semibold ml-2 text-xs">{app.metrics.revenue_model}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-semibold ml-2">{app.metrics.profit_margin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Ready to Use
                    </Badge>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Universal Architecture Highlight */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="text-center">
              <Target className="w-16 h-16 mx-auto mb-6" />
              <h3 className="text-3xl font-bold mb-4">Universal Budgeting Architecture</h3>
              <p className="text-xl text-blue-100 mb-8 max-w-4xl mx-auto">
                All budgeting apps use the same universal 6-table architecture. Switch between 
                industries instantly, consolidate multi-business budgets, and maintain consistency 
                across all your operations.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="bg-white/10 rounded-lg p-6">
                  <Building className="w-8 h-8 mb-3" />
                  <h4 className="font-semibold mb-2">Zero Custom Tables</h4>
                  <p className="text-blue-100 text-sm">
                    Every industry app uses the same universal database schema. 
                    No custom development or separate systems required.
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <Calculator className="w-8 h-8 mb-3" />
                  <h4 className="font-semibold mb-2">Smart Code Intelligence</h4>
                  <p className="text-blue-100 text-sm">
                    Industry-specific Smart Codes provide automatic insights, 
                    benchmarking, and best practice recommendations.
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-6">
                  <Users className="w-8 h-8 mb-3" />
                  <h4 className="font-semibold mb-2">Multi-Business Support</h4>
                  <p className="text-blue-100 text-sm">
                    Manage salon, restaurant, and healthcare budgets in one system. 
                    Perfect for multi-location or diversified businesses.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => router.push('/budgeting/salon')}
                >
                  <Scissors className="w-5 h-5 mr-2" />
                  Try Salon Budgeting Demo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}