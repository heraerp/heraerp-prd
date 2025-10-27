'use client'

/**
 * Enterprise Finance Overview Page
 * Smart Code: HERA.ENTERPRISE.FINANCE.OVERVIEW.v1
 * 
 * HERA Enterprise finance management dashboard
 */

import React, { useState } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Bell,
  User,
  Settings,
  ChevronDown,
  TrendingUp,
  BarChart3,
  DollarSign,
  Users,
  FileText,
  CreditCard,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Clock,
  Eye,
  MessageSquare,
  Zap,
  Target,
  Globe,
  Calendar,
  Award,
  Building2,
  ShoppingCart,
  Receipt,
  PieChart,
  Activity,
  Calculator,
  Wallet,
  Banknote,
  CircleDollarSign,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Shield,
  BookOpen,
  Briefcase
} from 'lucide-react'

export default function EnterpriseFinanceOverviewPage() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // News/Updates data
  const newsItems = [
    {
      id: 1,
      title: "HERA Finance 2025.4 Introduces AI-Powered Cash Flow Forecasting",
      content: "New predictive analytics capabilities help finance teams anticipate cash flow needs with 95% accuracy, enabling better working capital management...",
      time: "1 wk. ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Automated Compliance Reporting Now Live",
      content: "Real-time regulatory reporting and automated document exchange with tax authorities is now available across 45+ countries.",
      time: "3 days ago"
    },
    {
      id: 3,
      title: "Q1 2025 Financial Close Achieved in 3 Days",
      content: "Record-breaking financial close performance achieved through HERA's automated allocation and reconciliation workflows.",
      time: "5 days ago"
    }
  ]

  // Main module tiles based on YAML
  const modulePages = [
    {
      id: 'planning-analytics',
      title: 'Financial Planning & Analysis',
      subtitle: 'Planning & Forecasting',
      icon: BarChart3,
      color: 'bg-blue-600',
      href: '/enterprise/finance/planning'
    },
    {
      id: 'accounting-close',
      title: 'Accounting & Financial Close',
      subtitle: 'General Ledger & Close',
      icon: BookOpen,
      color: 'bg-green-600',
      href: '/enterprise/finance/accounting'
    },
    {
      id: 'accounts-receivable',
      title: 'Accounts Receivable',
      subtitle: 'Finance Operations',
      icon: CreditCard,
      color: 'bg-orange-600',
      href: '/enterprise/finance/ar'
    },
    {
      id: 'accounts-payable',
      title: 'Accounts Payable',
      subtitle: 'Finance Operations',
      icon: Receipt,
      color: 'bg-red-600',
      href: '/enterprise/finance/ap'
    },
    {
      id: 'compliance-tax',
      title: 'Compliance & Tax Management',
      subtitle: 'Regulatory Compliance',
      icon: Shield,
      color: 'bg-purple-600',
      href: '/enterprise/finance/compliance'
    },
    {
      id: 'treasury',
      title: 'Treasury Management',
      subtitle: 'Cash & Liquidity',
      icon: Wallet,
      color: 'bg-teal-600',
      href: '/enterprise/finance/treasury'
    }
  ]

  // Apps data
  const appsData = {
    favorites: [
      { icon: FileText, title: 'Process Invoices', subtitle: 'Accounts Payable', href: '/enterprise/finance/ap/invoices' },
      { icon: Banknote, title: 'Customer Payments', subtitle: 'Accounts Receivable', href: '/enterprise/finance/ar/payments' },
      { icon: Calculator, title: 'Journal Entries', subtitle: 'Manual GL Posting', href: '/enterprise/finance/journal-entries' },
      { icon: Building2, title: 'Bank Reconciliation', subtitle: 'Cash Management', href: '/enterprise/finance/cash/reconciliation' }
    ],
    mostUsed: [
      { icon: BarChart3, title: 'Financial Statements', subtitle: 'P&L, Balance Sheet', href: '/enterprise/finance/reports/statements' },
      { icon: PieChart, title: 'Budget Analysis', subtitle: 'Budget vs Actual', href: '/enterprise/finance/reports/budget' },
      { icon: Clock, title: 'Aging Reports', subtitle: 'Receivables & Payables', href: '/enterprise/finance/reports/aging' },
      { icon: Target, title: 'Cost Center Reports', subtitle: 'Department Analysis', href: '/enterprise/finance/reports/cost-centers' }
    ],
    recentlyUsed: [
      { icon: Calculator, title: 'Chart of Accounts', subtitle: 'Account Structure', href: '/enterprise/finance/master/accounts' },
      { icon: Users, title: 'Vendor Master', subtitle: 'Supplier Information', href: '/enterprise/finance/master/vendors' },
      { icon: Receipt, title: 'Expense Reports', subtitle: 'Employee Expenses', href: '/enterprise/finance/expenses' },
      { icon: CircleDollarSign, title: 'Currency Revaluation', subtitle: 'Foreign Exchange', href: '/enterprise/finance/services/currency' }
    ],
    recommended: [
      { icon: CheckCircle, title: 'Period End Close', subtitle: 'Monthly Closing', href: '/enterprise/finance/services/period-close' },
      { icon: TrendingUp, title: 'Cash Flow Analysis', subtitle: 'Liquidity Management', href: '/enterprise/finance/reports/cashflow' },
      { icon: Zap, title: 'Automated Workflows', subtitle: 'AI-Powered Processing', href: '/enterprise/finance/automation' },
      { icon: Shield, title: 'Compliance Dashboard', subtitle: 'Regulatory Monitoring', href: '/enterprise/finance/compliance/dashboard' }
    ]
  }

  // Insights tiles data
  const insightsTiles = [
    {
      id: 'cash-position',
      title: 'Cash Position Management',
      value: '₹18.9',
      unit: 'M',
      metrics: [
        { label: 'Available Cash...', value: '₹18.9M', trend: 'up' },
        { label: 'Pending Receivables...', value: '₹12.4M', trend: 'neutral' },
        { label: 'Upcoming Payables...', value: '₹8.7M', trend: 'down' }
      ],
      action: 'View Details',
      color: 'border-green-500'
    },
    {
      id: 'financial-close',
      title: 'Financial Close Progress',
      subtitle: 'February 2025 Close',
      value: '87',
      unit: '%',
      description: 'Close activities completed',
      trend: 'up',
      change: '+12%',
      color: 'border-blue-500'
    },
    {
      id: 'invoice-processing',
      title: 'Invoice Processing',
      value: '1,247',
      description: 'Invoices pending approval',
      trend: 'down',
      change: '-18%',
      color: 'border-orange-500'
    },
    {
      id: 'budget-variance',
      title: 'Budget Variance Analysis',
      value: '2.4',
      unit: '%',
      description: 'Under budget (favorable)',
      trend: 'up',
      change: 'Improved',
      color: 'border-purple-500'
    }
  ]

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-3 h-3 text-green-500" />
      case 'down':
        return <ArrowDown className="w-3 h-3 text-red-500" />
      default:
        return <Minus className="w-3 h-3 text-gray-500" />
    }
  }

  return (
    <ProtectedPage requiredSpace="finance">
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - News */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">News</h2>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              
              <div className="space-y-4">
                {newsItems.map((item) => (
                  <Card key={item.id} className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                    {item.image && (
                      <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-3 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {item.content}
                      </p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Center Column - Pages and Apps */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pages Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {modulePages.map((page) => {
                    const Icon = page.icon
                    return (
                      <Card 
                        key={page.id} 
                        className={`${page.color} text-white border-0 hover:shadow-lg transition-shadow cursor-pointer`}
                        onClick={() => window.location.href = page.href}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Icon className="w-6 h-6" />
                            <Eye className="w-4 h-4 opacity-75" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{page.title}</h3>
                          <p className="text-sm opacity-90">{page.subtitle}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Apps Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Apps</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="favorites">Favorites</TabsTrigger>
                    <TabsTrigger value="mostUsed">Most Used</TabsTrigger>
                    <TabsTrigger value="recentlyUsed">Recently Used</TabsTrigger>
                    <TabsTrigger value="recommended">Recommended</TabsTrigger>
                  </TabsList>

                  {Object.entries(appsData).map(([key, apps]) => (
                    <TabsContent key={key} value={key} className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {apps.map((app, index) => {
                          const Icon = app.icon
                          return (
                            <Card 
                              key={index} 
                              className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => window.location.href = app.href}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-violet-50 rounded-lg border border-violet-100">
                                    <Icon className="w-5 h-5 text-violet-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {app.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                      {app.subtitle}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Insights Tiles */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Insights Tiles (4)</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {insightsTiles.map((tile) => (
                    <Card key={tile.id} className={`border-l-4 ${tile.color} hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-l-violet-400`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-900 mb-1">
                              {tile.title}
                            </h4>
                            {tile.subtitle && (
                              <p className="text-xs text-gray-600">{tile.subtitle}</p>
                            )}
                          </div>
                          <BarChart3 className="w-4 h-4 text-violet-400" />
                        </div>

                        <div className="flex items-baseline space-x-1 mb-2">
                          <span className="text-2xl font-bold text-gray-900">{tile.value}</span>
                          {tile.unit && (
                            <span className="text-sm font-medium text-gray-600">{tile.unit}</span>
                          )}
                          {tile.change && (
                            <div className="flex items-center space-x-1 ml-2">
                              {renderTrendIcon(tile.trend || 'neutral')}
                              <span className={`text-xs ${
                                tile.trend === 'up' ? 'text-green-600' : 
                                tile.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {tile.change}
                              </span>
                            </div>
                          )}
                        </div>

                        {tile.metrics ? (
                          <div className="space-y-1">
                            {tile.metrics.map((metric, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{metric.label}</span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-gray-900">{metric.value}</span>
                                  {renderTrendIcon(metric.trend)}
                                </div>
                              </div>
                            ))}
                            {tile.action && (
                              <Button variant="link" className="p-0 h-auto text-xs text-violet-600 hover:text-violet-700">
                                {tile.action}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600">{tile.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - HERA Assistant */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card className="border border-violet-100 bg-gradient-to-br from-white to-violet-50/30 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">HERA Assistant</CardTitle>
                        <p className="text-sm text-violet-500">Today</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-2">Here's what I've found:</p>
                        
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Cash Flow Forecast</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              Next 30 days: Strong position expected
                            </p>
                            <div className="space-y-1 text-xs">
                              <div>Projected Inflow: ₹15.2M</div>
                              <div>Projected Outflow: ₹11.8M</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Outstanding Invoices</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Total Outstanding: ₹12.4M</div>
                              <div>Overdue ({'>'}30 days): ₹2.1M</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">February Close Status</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Progress: 87% Complete</div>
                              <div>Remaining: 15 activities</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Budget Performance</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>YTD Variance: 2.4% under budget</div>
                              <div>Department: All within targets</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <Input 
                            placeholder="Message HERA Assistant..." 
                            className="text-sm border-violet-200 focus:border-violet-400 focus:ring-violet-200"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  )
}