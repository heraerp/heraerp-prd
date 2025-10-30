'use client'

/**
 * Enterprise Sales Overview Page
 * Smart Code: HERA.ENTERPRISE.SALES.OVERVIEW.v1
 * 
 * HERA Enterprise sales management dashboard
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
  Package,
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
  Activity
} from 'lucide-react'

export default function EnterpriseSalesOverviewPage() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // News/Updates data
  const newsItems = [
    {
      id: 1,
      title: "HERA Platform Achieves Record Growth in 2025 Enterprise Sales Management",
      content: "HERA has been recognized as an industry leader in enterprise sales management solutions. Our 2025.4 platform continues to drive innovation in CRM and sales automation...",
      time: "2 wk. ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Q4 Sales Results Show Record Performance",
      content: "Our sales team achieved 127% of quota in Q4, driven by strong enterprise deals and improved conversion rates across all segments.",
      time: "1 wk. ago"
    },
    {
      id: 3,
      title: "HERA CRM 2025.4 Release Now Available",
      content: "Enhanced lead scoring, opportunity forecasting, and automated workflow capabilities are now live in your HERA CRM system.",
      time: "3 days ago"
    }
  ]

  // Main module tiles
  const modulePages = [
    {
      id: 'customer-returns',
      title: 'Customer Return Processing',
      subtitle: 'Customer Returns',
      icon: RefreshCw,
      color: 'bg-purple-600',
      href: '/enterprise/sales/returns'
    },
    {
      id: 'order-management',
      title: 'Overview',
      subtitle: 'Solution Order Management',
      icon: Package,
      color: 'bg-orange-600',
      href: '/enterprise/sales/orders'
    },
    {
      id: 'sales-analytics',
      title: 'Sales Planning and Analytics',
      subtitle: 'Sales Management',
      icon: BarChart3,
      color: 'bg-pink-600',
      href: '/enterprise/sales/analytics'
    },
    {
      id: 'sales-rebates',
      title: 'Sales Rebates',
      subtitle: 'Sales Management',
      icon: Award,
      color: 'bg-teal-600',
      href: '/enterprise/sales/rebates'
    },
    {
      id: 'price-management',
      title: 'Price Management',
      subtitle: 'Pricing',
      icon: DollarSign,
      color: 'bg-green-600',
      href: '/enterprise/sales/pricing'
    },
    {
      id: 'sales-accounting',
      title: 'Sales Accounting',
      subtitle: 'Billing',
      icon: Receipt,
      color: 'bg-blue-600',
      href: '/enterprise/sales/accounting'
    }
  ]

  // Apps data
  const appsData = {
    favorites: [
      { icon: ShoppingCart, title: 'Sales Orders', subtitle: 'View and manage orders', href: '/enterprise/sales/crm/orders' },
      { icon: Building2, title: 'Manage Billing Documents', subtitle: 'Billing management', href: '/enterprise/sales/billing' },
      { icon: BarChart3, title: 'Sales Management Overview', subtitle: 'Track execution', href: '/enterprise/sales/crm' },
      { icon: Target, title: 'My Sales Overview', subtitle: 'Personal dashboard', href: '/enterprise/sales/my-overview' }
    ],
    mostUsed: [
      { icon: FileText, title: 'Create Sales Orders', subtitle: 'Automatic Extraction', href: '/enterprise/sales/crm/orders/create' },
      { icon: Receipt, title: 'Create Billing Documents', subtitle: 'Invoice generation', href: '/enterprise/sales/billing/create' },
      { icon: CreditCard, title: 'Manage Credit Memo Requests', subtitle: 'Credit processing', href: '/enterprise/sales/credit-memo' },
      { icon: DollarSign, title: 'Manage Prices', subtitle: 'Price optimization', href: '/enterprise/sales/pricing/manage' }
    ],
    recentlyUsed: [
      { icon: Users, title: 'Customer Master', subtitle: 'Customer data', href: '/enterprise/sales/crm/customers' },
      { icon: Target, title: 'Opportunities', subtitle: 'Sales pipeline', href: '/enterprise/sales/crm/opportunities' },
      { icon: Activity, title: 'Sales Activities', subtitle: 'Track activities', href: '/enterprise/sales/crm/activities' },
      { icon: PieChart, title: 'Sales Reports', subtitle: 'Analytics & insights', href: '/enterprise/sales/crm/reports' }
    ],
    recommended: [
      { icon: Zap, title: 'Sales Order Fulfillment', subtitle: 'Analyze and Resolve Issues', href: '/enterprise/sales/fulfillment' },
      { icon: Globe, title: 'Global Sales Dashboard', subtitle: 'Regional performance', href: '/enterprise/sales/global' },
      { icon: Calendar, title: 'Sales Forecasting', subtitle: 'Predictive analytics', href: '/enterprise/sales/forecasting' },
      { icon: Award, title: 'Commission Management', subtitle: 'Sales compensation', href: '/enterprise/sales/commission' }
    ]
  }

  // Insights tiles data
  const insightsTiles = [
    {
      id: 'manage-sales-orders',
      title: 'Manage Sales Orders',
      value: '£422',
      unit: 'K',
      metrics: [
        { label: 'Delivery Issue in...', value: '4.57%', trend: 'neutral' },
        { label: 'Shipping Issue in...', value: '3.43%', trend: 'up' },
        { label: 'Billing Block in S...', value: '1.53%', trend: 'down' }
      ],
      action: 'Open now',
      color: 'border-blue-500'
    },
    {
      id: 'sales-fulfillment',
      title: 'Sales Order Fulfillment',
      subtitle: 'Analyze and Resolve Issues',
      value: '£1.99',
      unit: 'K',
      description: 'Billing Due List Items',
      color: 'border-green-500'
    },
    {
      id: 'billing-documents',
      title: 'Create Billing Documents',
      value: '1,847',
      description: 'Documents pending processing',
      trend: 'up',
      change: '+12%',
      color: 'border-purple-500'
    },
    {
      id: 'credit-memo',
      title: 'Manage Credit Memo Requests',
      value: '278',
      description: 'Active requests awaiting approval',
      trend: 'down',
      change: '-8%',
      color: 'border-orange-500'
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
    <ProtectedPage requiredSpace="sales">
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

            {/* Right Column - Joule Assistant */}
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
                            <h4 className="font-medium text-sm mb-1">Sales Orders</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              Filtered by: Delivery Status Schedule Line Category (A,B)
                            </p>
                            <div className="space-y-1 text-xs">
                              <div>Ship-to Party: Domestic US Company (17100001)</div>
                              <div>Order Type: MTO Standard Order (OR)</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Sales Order 361</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Ship-to Party: Domestic US Co (17100001)</div>
                              <div>Order Type: MTO Standard Order (OR)</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Sales Order 31206</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Ship-to Party: Domestic Customer (17100003)</div>
                              <div>Order Type: Standard Order (OR)</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Sales Order 32282</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Ship-to Party: Domestic US Co (17100001)</div>
                              <div>Order Type: Standard Order (OR)</div>
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