'use client'

/**
 * Enterprise Services Management Overview Page
 * Smart Code: HERA.ENTERPRISE.SERVICES.OVERVIEW.v1
 * 
 * HERA Enterprise services management dashboard
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
  Briefcase,
  Factory,
  Cog,
  Package,
  Gauge,
  Settings2,
  ClipboardCheck,
  Truck,
  BarChart2,
  Wrench,
  Timer,
  Database,
  UserCheck,
  LineChart,
  Layers,
  FolderOpen,
  Headphones,
  Repeat,
  UserCog,
  Workflow,
  GitBranch,
  Clipboard
} from 'lucide-react'

export default function EnterpriseServicesManagementPage() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // News/Updates data
  const newsItems = [
    {
      id: 1,
      title: "HERA Services 2025.4 Introduces AI-Powered Project Management",
      content: "New machine learning algorithms optimize resource allocation and project profitability, increasing project margins by up to 25% through intelligent staffing and automated billing...",
      time: "1 wk. ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Unified Service Delivery Platform Goes Live",
      content: "AI-powered bundled offerings now combine projects, subscriptions, and products in single packages, simplifying order management and improving customer experience.",
      time: "4 days ago"
    },
    {
      id: 3,
      title: "Proactive Service Management Enhanced",
      content: "Real-time contract monitoring and automated SLA management now provide comprehensive service agreement tracking and renewal alerts for better customer retention.",
      time: "2 days ago"
    }
  ]

  // Main module tiles based on YAML
  const modulePages = [
    {
      id: 'customer-project-management',
      title: 'Customer Project Management',
      subtitle: 'Bid to Cash Project Lifecycle',
      icon: FolderOpen,
      color: 'bg-blue-600',
      href: '/enterprise/services/projects'
    },
    {
      id: 'resource-management',
      title: 'Resource Management',
      subtitle: 'AI-Driven Staffing & Allocation',
      icon: UserCog,
      color: 'bg-green-600',
      href: '/enterprise/services/resources'
    },
    {
      id: 'bundled-delivery',
      title: 'Bundled Products & Services',
      subtitle: 'Unified Offering Packages',
      icon: Layers,
      color: 'bg-orange-600',
      href: '/enterprise/services/bundles'
    },
    {
      id: 'service-management',
      title: 'Service Management',
      subtitle: 'After-Sales Services & SLAs',
      icon: Headphones,
      color: 'bg-purple-600',
      href: '/enterprise/services/management'
    },
    {
      id: 'service-analytics',
      title: 'Services Analytics',
      subtitle: 'Profitability & Performance Insights',
      icon: BarChart3,
      color: 'bg-teal-600',
      href: '/enterprise/services/analytics'
    },
    {
      id: 'contract-management',
      title: 'Contract Management',
      subtitle: 'SLA & Agreement Automation',
      icon: FileText,
      color: 'bg-red-600',
      href: '/enterprise/services/contracts'
    }
  ]

  // Apps data
  const appsData = {
    favorites: [
      { icon: FolderOpen, title: 'Project Dashboard', subtitle: 'Active project tracking', href: '/enterprise/services/projects/dashboard' },
      { icon: Calendar, title: 'Resource Planning', subtitle: 'Staff allocation & scheduling', href: '/enterprise/services/resources/planning' },
      { icon: CheckCircle, title: 'Service Orders', subtitle: 'Order management & billing', href: '/enterprise/services/orders' },
      { icon: Clock, title: 'Time & Expenses', subtitle: 'Project time tracking', href: '/enterprise/services/timesheet' }
    ],
    mostUsed: [
      { icon: BarChart3, title: 'Project Profitability', subtitle: 'Margin analysis & reporting', href: '/enterprise/services/analytics/profitability' },
      { icon: UserCheck, title: 'Resource Utilization', subtitle: 'Staff performance metrics', href: '/enterprise/services/resources/utilization' },
      { icon: Workflow, title: 'Service Workflows', subtitle: 'Process automation', href: '/enterprise/services/workflows' },
      { icon: Target, title: 'SLA Monitoring', subtitle: 'Service level tracking', href: '/enterprise/services/sla' }
    ],
    recentlyUsed: [
      { icon: Database, title: 'Master Data', subtitle: 'Service & resource data', href: '/enterprise/services/master' },
      { icon: Repeat, title: 'Recurring Services', subtitle: 'Subscription management', href: '/enterprise/services/recurring' },
      { icon: GitBranch, title: 'Project Templates', subtitle: 'Standardized project setup', href: '/enterprise/services/templates' },
      { icon: Clipboard, title: 'Service Reports', subtitle: 'Performance reporting', href: '/enterprise/services/reports' }
    ],
    recommended: [
      { icon: Zap, title: 'AI Project Assistant', subtitle: 'Intelligent project optimization', href: '/enterprise/services/ai' },
      { icon: Shield, title: 'Risk Assessment', subtitle: 'Project risk management', href: '/enterprise/services/risk' },
      { icon: Calculator, title: 'Pricing Optimization', subtitle: 'Dynamic pricing models', href: '/enterprise/services/pricing' },
      { icon: Activity, title: 'Performance Analytics', subtitle: 'Service KPI insights', href: '/enterprise/services/performance' }
    ]
  }

  // Insights tiles data
  const insightsTiles = [
    {
      id: 'project-profitability',
      title: 'Project Profitability',
      value: '24.8',
      unit: '%',
      metrics: [
        { label: 'Avg Margin...', value: '24.8%', trend: 'up' },
        { label: 'Revenue YTD...', value: '₹18.7M', trend: 'up' },
        { label: 'Cost Control...', value: '96.2%', trend: 'up' }
      ],
      action: 'View Details',
      color: 'border-green-500'
    },
    {
      id: 'resource-utilization',
      title: 'Resource Utilization',
      subtitle: 'Staff Allocation Rate',
      value: '87.3',
      unit: '%',
      description: 'Current utilization rate',
      trend: 'up',
      change: '+4.2%',
      color: 'border-blue-500'
    },
    {
      id: 'service-satisfaction',
      title: 'Service Satisfaction',
      value: '94.6',
      unit: '%',
      description: 'Customer satisfaction score',
      trend: 'up',
      change: '+2.1%',
      color: 'border-purple-500'
    },
    {
      id: 'contract-renewal',
      title: 'Contract Renewal Rate',
      value: '91.2',
      unit: '%',
      description: 'Service contract renewals',
      trend: 'up',
      change: '+3.8%',
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
    <ProtectedPage>
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
                            <h4 className="font-medium text-sm mb-1">Project Performance</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              Q1 2025: 24.8% average margin
                            </p>
                            <div className="space-y-1 text-xs">
                              <div>Active Projects: 47</div>
                              <div>Revenue YTD: ₹18.7M</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Resource Allocation</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Utilization Rate: 87.3%</div>
                              <div>Available Resources: 23 staff</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Service Operations</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Customer Satisfaction: 94.6%</div>
                              <div>Contract Renewals: 91.2%</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Upcoming Actions</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Contract Renewals: 8 expiring</div>
                              <div>Resource Planning: 3 projects starting</div>
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