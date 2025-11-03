'use client'

/**
 * MatrixIT World ERP Landing Page
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.OVERVIEW.v1
 * 
 * Complete PC & Mobile retail and distribution platform overview
 */

import React, { useState } from 'react'
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
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  MessageSquare,
  Zap,
  Target,
  Activity,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Truck,
  Package,
  MapPin,
  Route,
  Monitor,
  Smartphone,
  HardDrive,
  Warehouse,
  ShoppingCart,
  TrendingDown
} from 'lucide-react'

export default function MatrixITWorldOverviewPage() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // Branding is now handled by MatrixITWorldBrandingProvider

  // News/Updates data
  const newsItems = [
    {
      id: 1,
      title: "MatrixIT World AI Inventory Optimization Reduces Stock-outs by 35%",
      content: "Advanced machine learning algorithms now predict demand patterns across 6 Kerala branches, optimizing stock levels for PCs, mobiles, and components...",
      time: "2 days ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Mobile Sales Surge - 40% Growth in Q4",
      content: "Smartphone and mobile accessories sales show strong growth across all branches, with Kochi Main leading at 52% quarter-over-quarter growth.",
      time: "5 days ago"
    },
    {
      id: 3,
      title: "New Distributor Partnership with Major PC Brands",
      content: "Strategic partnerships with leading PC manufacturers enhance product availability and competitive pricing across Kerala market.",
      time: "1 week ago"
    }
  ]

  // Main module tiles based on MatrixIT World structure
  const modulePages = [
    {
      id: 'inventory',
      title: 'Inventory Management',
      subtitle: 'Multi-Branch Stock Control',
      icon: Package,
      color: 'bg-[var(--brand-primary-600)]',
      href: '/retail1/matrixitworld/inventory'
    },
    {
      id: 'sales',
      title: 'Sales Management',
      subtitle: 'Orders & Customer Relations',
      icon: ShoppingCart,
      color: 'bg-[var(--brand-accent-600)]',
      href: '/retail1/matrixitworld/sales'
    },
    {
      id: 'procurement',
      title: 'Procurement',
      subtitle: 'Supplier & Purchase Orders',
      icon: Truck,
      color: 'bg-[var(--brand-warning-600)]',
      href: '/enterprise/procurement/purchasing-rebates'
    },
    {
      id: 'customers',
      title: 'Customer Management',
      subtitle: 'CRM & Service Support',
      icon: Users,
      color: 'bg-[var(--brand-secondary-600)]',
      href: '/crm/customers'
    },
    {
      id: 'finance',
      title: 'Finance & Analytics',
      subtitle: 'Revenue & Cost Analysis',
      icon: DollarSign,
      color: 'bg-[var(--brand-accent-700)]',
      href: '/retail1/matrixitworld/finance'
    },
    {
      id: 'dashboard',
      title: 'Executive Dashboard',
      subtitle: 'KPIs & Business Intelligence',
      icon: BarChart3,
      color: 'bg-[var(--brand-error-600)]',
      href: '/retail1/matrixitworld/dashboard'
    }
  ]

  // Apps data for Kerala retail operations
  const appsData = {
    favorites: [
      { icon: ShoppingCart, title: 'New Sale Order', subtitle: 'Create customer orders', href: '/retail1/matrixitworld/sales/new' },
      { icon: Package, title: 'Stock Transfer', subtitle: 'Inter-branch inventory', href: '/retail1/matrixitworld/inventory/transfer' },
      { icon: Users, title: 'Customer Portal', subtitle: 'Manage client accounts', href: '/crm/customers' },
      { icon: Monitor, title: 'Product Catalog', subtitle: 'PC & Mobile inventory', href: '/inventory/products' }
    ],
    mostUsed: [
      { icon: Smartphone, title: 'Mobile Inventory', subtitle: 'Smartphone stock levels', href: '/retail1/matrixitworld/inventory/mobiles' },
      { icon: MapPin, title: 'Branch Locations', subtitle: 'Manage 6 Kerala branches', href: '/greenworms/waste-management/locations' },
      { icon: FileText, title: 'Purchase Orders', subtitle: 'Supplier procurement', href: '/enterprise/procurement/purchasing-rebates/purchase-orders' },
      { icon: HardDrive, title: 'PC Components', subtitle: 'Hardware inventory', href: '/retail1/matrixitworld/inventory/components' }
    ],
    recentlyUsed: [
      { icon: Calculator, title: 'Rebate Processing', subtitle: 'Supplier rebate tracking', href: '/retail1/matrixitworld/rebates' },
      { icon: BarChart3, title: 'Sales Analytics', subtitle: 'Branch performance reports', href: '/retail1/matrixitworld/analytics' },
      { icon: CheckCircle, title: 'Quality Control', subtitle: 'Product inspection', href: '/retail1/matrixitworld/quality' },
      { icon: Warehouse, title: 'Warehouse Management', subtitle: 'Storage optimization', href: '/retail1/matrixitworld/warehouse' }
    ],
    recommended: [
      { icon: Zap, title: 'AI Demand Forecasting', subtitle: 'Smart inventory planning', href: '/retail1/matrixitworld/ai/demand' },
      { icon: Target, title: 'Sales Performance', subtitle: 'Branch comparison metrics', href: '/retail1/matrixitworld/analytics/performance' },
      { icon: Activity, title: 'Real-time Dashboards', subtitle: 'Live business insights', href: '/retail1/matrixitworld/realtime' },
      { icon: TrendingUp, title: 'Market Analysis', subtitle: 'Kerala market trends', href: '/retail1/matrixitworld/market-analysis' }
    ]
  }

  // Insights tiles data for retail operations
  const insightsTiles = [
    {
      id: 'inventory-turnover',
      title: 'Inventory Turnover',
      value: '8.2',
      unit: 'x/year',
      metrics: [
        { label: 'Mobile Turnover...', value: '12.4x', trend: 'up' },
        { label: 'PC Turnover...', value: '6.1x', trend: 'up' },
        { label: 'Components...', value: '15.2x', trend: 'up' }
      ],
      action: 'View Details',
      color: 'border-[var(--brand-primary-500)]',
      bgColor: 'bg-gradient-to-r from-[var(--brand-primary-50)] to-[var(--brand-primary-100)]'
    },
    {
      id: 'daily-sales',
      title: 'Daily Sales Revenue',
      subtitle: 'All Branches Combined',
      value: '₹2.8',
      unit: 'L',
      description: 'Today\'s total revenue',
      trend: 'up',
      change: '+12.3%',
      color: 'border-[var(--brand-success-500)]',
      bgColor: 'bg-gradient-to-r from-[var(--brand-success-50)] to-[var(--brand-success-100)]'
    },
    {
      id: 'stock-levels',
      title: 'Stock Levels',
      value: '5,240',
      unit: 'units',
      description: 'Total inventory across branches',
      trend: 'down',
      change: '-2.1%',
      color: 'border-[var(--brand-warning-500)]',
      bgColor: 'bg-gradient-to-r from-[var(--brand-warning-50)] to-[var(--brand-warning-100)]'
    },
    {
      id: 'customer-satisfaction',
      title: 'Customer Satisfaction',
      value: '94.6',
      unit: '%',
      description: 'Service quality rating',
      trend: 'up',
      change: '+3.2%',
      color: 'border-[var(--brand-accent-500)]',
      bgColor: 'bg-gradient-to-r from-[var(--brand-accent-50)] to-[var(--brand-accent-100)]'
    }
  ]

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-3 h-3 text-[var(--brand-success-600)]" />
      case 'down':
        return <ArrowDown className="w-3 h-3 text-[var(--brand-error-600)]" />
      default:
        return <Minus className="w-3 h-3 text-[var(--brand-text-secondary)]" />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--brand-background-color)]">
      {/* Enterprise SAP ERP Cloud Style Header */}
      <div className="bg-white border-b border-[var(--brand-border-color)] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--brand-primary-500)] to-[var(--brand-primary-700)] rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-[var(--brand-primary-100)]">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[var(--brand-text-primary)] mb-1">MatrixIT World ERP</h1>
                <p className="text-lg text-[var(--brand-text-secondary)] font-medium">PC & Mobile Retail Distribution Platform - Kerala</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--brand-text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search modules and applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-4 w-96 border-2 border-[var(--brand-border-color)] rounded-xl focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary-100)] focus:border-[var(--brand-primary-400)] text-[var(--brand-text-primary)] placeholder:text-[var(--brand-text-secondary)] bg-[var(--brand-surface-color)] shadow-sm font-medium"
                />
              </div>
              <Button variant="outline" size="lg" className="border-2 border-[var(--brand-border-color)] text-[var(--brand-text-secondary)] hover:bg-[var(--brand-primary-50)] hover:border-[var(--brand-primary-300)] hover:text-[var(--brand-primary-700)] transition-all duration-200 shadow-sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-2 border-[var(--brand-border-color)] text-[var(--brand-text-secondary)] hover:bg-[var(--brand-primary-50)] hover:border-[var(--brand-primary-300)] hover:text-[var(--brand-primary-700)] transition-all duration-200 shadow-sm">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Left Column - Industry News */}
          <div className="lg:col-span-1 space-y-8">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-[var(--brand-text-primary)]">Industry News</h2>
              <ChevronDown className="w-6 h-6 text-[var(--brand-text-secondary)]" />
            </div>
            
            <div className="space-y-6">
              {newsItems.map((item) => (
                <Card key={item.id} className="border-2 border-[var(--brand-border-color)] hover:shadow-2xl hover:border-[var(--brand-primary-300)] transition-all duration-300 cursor-pointer bg-white group">
                  {item.image && (
                    <div className="h-40 bg-gradient-to-br from-[var(--brand-primary-100)] to-[var(--brand-accent-100)] rounded-t-xl flex items-center justify-center group-hover:from-[var(--brand-primary-200)] group-hover:to-[var(--brand-accent-200)] transition-all duration-300">
                      <Monitor className="w-16 h-16 text-[var(--brand-primary-600)] opacity-70" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="font-bold text-base text-[var(--brand-text-primary)] line-clamp-3 mb-4 leading-relaxed group-hover:text-[var(--brand-primary-700)] transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--brand-text-secondary)] line-clamp-3 mb-4 leading-relaxed">
                      {item.content}
                    </p>
                    <p className="text-sm text-[var(--brand-text-secondary)] font-semibold">{item.time}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Center Column - Modules and Applications */}
          <div className="lg:col-span-2 space-y-10">
            {/* Enterprise Modules Section */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <h2 className="text-2xl font-bold text-[var(--brand-text-primary)]">Business Modules</h2>
                <Badge variant="secondary" className="bg-[var(--brand-primary-100)] text-[var(--brand-primary-700)] font-semibold">6</Badge>
                <ChevronDown className="w-6 h-6 text-[var(--brand-text-secondary)]" />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                {modulePages.map((page) => {
                  const Icon = page.icon
                  return (
                    <Card 
                      key={page.id} 
                      className={`${page.color} text-white border-0 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative overflow-hidden`}
                      onClick={() => window.location.href = page.href}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="p-8 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <Icon className="w-10 h-10 drop-shadow-lg" />
                          <Eye className="w-6 h-6 opacity-80 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        <h3 className="font-bold text-2xl mb-3 leading-tight">{page.title}</h3>
                        <p className="text-sm opacity-95 leading-relaxed font-medium">{page.subtitle}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Enterprise Applications Section */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <h2 className="text-2xl font-bold text-[var(--brand-text-primary)]">Quick Applications</h2>
                <ChevronDown className="w-6 h-6 text-[var(--brand-text-secondary)]" />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-[var(--brand-surface-color)] p-2 rounded-xl border border-[var(--brand-border-color)] shadow-sm">
                  <TabsTrigger value="favorites" className="text-[var(--brand-text-secondary)] data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)] data-[state=active]:shadow-md font-semibold">Favorites</TabsTrigger>
                  <TabsTrigger value="mostUsed" className="text-[var(--brand-text-secondary)] data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)] data-[state=active]:shadow-md font-semibold">Most Used</TabsTrigger>
                  <TabsTrigger value="recentlyUsed" className="text-[var(--brand-text-secondary)] data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)] data-[state=active]:shadow-md font-semibold">Recent</TabsTrigger>
                  <TabsTrigger value="recommended" className="text-[var(--brand-text-secondary)] data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)] data-[state=active]:shadow-md font-semibold">Recommended</TabsTrigger>
                </TabsList>

                {Object.entries(appsData).map(([key, apps]) => (
                  <TabsContent key={key} value={key} className="mt-8">
                    <div className="grid grid-cols-2 gap-6">
                      {apps.map((app, index) => {
                        const Icon = app.icon
                        return (
                          <Card 
                            key={index} 
                            className="border-2 border-[var(--brand-border-color)] hover:shadow-xl hover:border-[var(--brand-primary-300)] hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-white group"
                            onClick={() => window.location.href = app.href}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-5">
                                <div className="p-4 bg-gradient-to-br from-[var(--brand-primary-50)] to-[var(--brand-primary-100)] rounded-2xl border-2 border-[var(--brand-primary-200)] group-hover:border-[var(--brand-primary-300)] transition-colors duration-200 shadow-sm">
                                  <Icon className="w-7 h-7 text-[var(--brand-primary-600)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-base text-[var(--brand-text-primary)] truncate mb-2 group-hover:text-[var(--brand-primary-700)] transition-colors duration-200">
                                    {app.title}
                                  </h4>
                                  <p className="text-sm text-[var(--brand-text-secondary)] truncate leading-relaxed font-medium">
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

            {/* Business Intelligence Insights */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <h2 className="text-2xl font-bold text-[var(--brand-text-primary)]">Business Intelligence</h2>
                <Badge variant="secondary" className="bg-[var(--brand-primary-100)] text-[var(--brand-primary-700)] font-semibold">4 KPIs</Badge>
                <ChevronDown className="w-6 h-6 text-[var(--brand-text-secondary)]" />
              </div>

              <div className="grid grid-cols-2 gap-8">
                {insightsTiles.map((tile) => (
                  <Card key={tile.id} className={`border-l-[6px] ${tile.color} hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden`}>
                    <div className={`absolute inset-0 ${tile.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <CardContent className="p-8 relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h4 className="font-bold text-lg text-[var(--brand-text-primary)] mb-2 group-hover:text-[var(--brand-primary-700)] transition-colors duration-200">
                            {tile.title}
                          </h4>
                          {tile.subtitle && (
                            <p className="text-sm text-[var(--brand-text-secondary)] font-medium">{tile.subtitle}</p>
                          )}
                        </div>
                        <BarChart3 className="w-7 h-7 text-[var(--brand-primary-500)] opacity-80" />
                      </div>

                      <div className="flex items-baseline space-x-3 mb-5">
                        <span className="text-4xl font-bold text-[var(--brand-text-primary)]">{tile.value}</span>
                        {tile.unit && (
                          <span className="text-lg font-bold text-[var(--brand-text-secondary)]">{tile.unit}</span>
                        )}
                        {tile.change && (
                          <div className="flex items-center space-x-2 ml-3">
                            {renderTrendIcon(tile.trend || 'neutral')}
                            <span className={`text-sm font-bold ${
                              tile.trend === 'up' ? 'text-[var(--brand-success-600)]' : 
                              tile.trend === 'down' ? 'text-[var(--brand-error-600)]' : 'text-[var(--brand-text-secondary)]'
                            }`}>
                              {tile.change}
                            </span>
                          </div>
                        )}
                      </div>

                      {tile.metrics ? (
                        <div className="space-y-3">
                          {tile.metrics.map((metric, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-[var(--brand-text-secondary)] font-medium">{metric.label}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-[var(--brand-text-primary)] font-bold">{metric.value}</span>
                                {renderTrendIcon(metric.trend)}
                              </div>
                            </div>
                          ))}
                          {tile.action && (
                            <Button variant="link" className="p-0 h-auto text-sm text-[var(--brand-primary-600)] hover:text-[var(--brand-primary-700)] mt-4 font-semibold">
                              {tile.action}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--brand-text-secondary)] leading-relaxed font-medium">{tile.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Enterprise AI Assistant */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="border-2 border-[var(--brand-primary-200)] bg-gradient-to-br from-white to-[var(--brand-primary-50)]/40 shadow-2xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary-500)] to-[var(--brand-primary-700)] rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-[var(--brand-primary-100)]">
                      <Monitor className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl bg-gradient-to-r from-[var(--brand-primary-600)] to-[var(--brand-primary-800)] bg-clip-text text-transparent font-bold">MatrixIT AI</CardTitle>
                      <p className="text-base text-[var(--brand-primary-500)] font-semibold">Today's Business Insights</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-sm">
                      <p className="font-bold mb-6 text-[var(--brand-text-primary)] text-lg">Performance Summary</p>
                      
                      <div className="space-y-5">
                        <div className="bg-gradient-to-r from-[var(--brand-primary-50)] to-[var(--brand-primary-100)] p-5 rounded-2xl border-2 border-[var(--brand-primary-200)] shadow-sm">
                          <h4 className="font-bold text-base mb-3 text-[var(--brand-text-primary)]">Sales Performance</h4>
                          <p className="text-sm text-[var(--brand-text-primary)] mb-3 font-semibold">
                            Today: ₹2.8L revenue across 6 branches
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="text-[var(--brand-text-secondary)] font-medium">Mobile Sales: ₹1.6L (57%)</div>
                            <div className="text-[var(--brand-text-secondary)] font-medium">PC Sales: ₹1.2L (43%)</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-[var(--brand-primary-50)] to-[var(--brand-primary-100)] p-5 rounded-2xl border-2 border-[var(--brand-primary-200)] shadow-sm">
                          <h4 className="font-bold text-base mb-3 text-[var(--brand-text-primary)]">Inventory Status</h4>
                          <div className="space-y-2 text-sm text-[var(--brand-text-secondary)] font-medium">
                            <div>Total Stock: 5,240 units</div>
                            <div>Low Stock Alerts: 12 items</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-[var(--brand-primary-50)] to-[var(--brand-primary-100)] p-5 rounded-2xl border-2 border-[var(--brand-primary-200)] shadow-sm">
                          <h4 className="font-bold text-base mb-3 text-[var(--brand-text-primary)]">Branch Performance</h4>
                          <div className="space-y-2 text-sm text-[var(--brand-text-secondary)] font-medium">
                            <div>Top Performer: Kochi Main (₹1.1L)</div>
                            <div>Growth Leader: Kozhikode (+18%)</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-[var(--brand-primary-50)] to-[var(--brand-primary-100)] p-5 rounded-2xl border-2 border-[var(--brand-primary-200)] shadow-sm">
                          <h4 className="font-bold text-base mb-3 text-[var(--brand-text-primary)]">Supplier Status</h4>
                          <div className="space-y-2 text-sm text-[var(--brand-text-secondary)] font-medium">
                            <div>Active POs: 8 purchase orders</div>
                            <div>Pending Deliveries: 3 this week</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t-2 border-[var(--brand-border-color)]">
                        <Input 
                          placeholder="Ask MatrixIT AI anything..." 
                          className="text-base border-2 border-[var(--brand-primary-300)] focus:border-[var(--brand-primary-500)] focus:ring-4 focus:ring-[var(--brand-primary-100)] bg-white font-medium shadow-sm"
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
  )
}