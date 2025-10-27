'use client'

/**
 * Enterprise Manufacturing Overview Page
 * Smart Code: HERA.ENTERPRISE.MANUFACTURING.OVERVIEW.v1
 * 
 * HERA Enterprise manufacturing management dashboard
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
  Database
} from 'lucide-react'

export default function EnterpriseManufacturingOverviewPage() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // News/Updates data
  const newsItems = [
    {
      id: 1,
      title: "HERA Manufacturing 2025.4 Introduces AI-Powered Production Planning",
      content: "New machine learning algorithms optimize production schedules with 98% accuracy, reducing downtime and improving resource utilization across all manufacturing operations...",
      time: "1 wk. ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Real-Time Quality Monitoring Goes Live",
      content: "AI-powered visual inspection systems now monitor quality metrics in real-time, reducing defects by 45% and improving overall product quality.",
      time: "4 days ago"
    },
    {
      id: 3,
      title: "Digital Twin Integration Completed",
      content: "Complete digital twin implementation enables predictive maintenance and simulation-based optimization of production processes.",
      time: "1 wk. ago"
    }
  ]

  // Main module tiles based on YAML
  const modulePages = [
    {
      id: 'production-engineering',
      title: 'Production Engineering',
      subtitle: 'Product & Production Setup',
      icon: Cog,
      color: 'bg-blue-600',
      href: '/enterprise/manufacturing/engineering'
    },
    {
      id: 'production-planning',
      title: 'Production Planning',
      subtitle: 'AI-Powered Planning & Scheduling',
      icon: Calendar,
      color: 'bg-green-600',
      href: '/enterprise/manufacturing/planning'
    },
    {
      id: 'manufacturing-operations',
      title: 'Manufacturing Operations',
      subtitle: 'Real-Time Production Control',
      icon: Factory,
      color: 'bg-orange-600',
      href: '/enterprise/manufacturing/operations'
    },
    {
      id: 'manufacturing-options',
      title: 'Manufacturing Options',
      subtitle: 'Process Automation & Flexibility',
      icon: Settings2,
      color: 'bg-red-600',
      href: '/enterprise/manufacturing/options'
    },
    {
      id: 'quality-management',
      title: 'Quality Management',
      subtitle: 'AI-Enhanced Quality Control',
      icon: ClipboardCheck,
      color: 'bg-purple-600',
      href: '/enterprise/manufacturing/quality'
    },
    {
      id: 'analytics-insights',
      title: 'Manufacturing Analytics',
      subtitle: 'Performance & Insights',
      icon: BarChart3,
      color: 'bg-teal-600',
      href: '/enterprise/manufacturing/analytics'
    }
  ]

  // Apps data
  const appsData = {
    favorites: [
      { icon: Factory, title: 'Production Orders', subtitle: 'Order management & tracking', href: '/enterprise/manufacturing/orders' },
      { icon: Package, title: 'Bill of Materials', subtitle: 'BOM management', href: '/enterprise/manufacturing/bom' },
      { icon: Calendar, title: 'Production Schedule', subtitle: 'Schedule optimization', href: '/enterprise/manufacturing/schedule' },
      { icon: ClipboardCheck, title: 'Quality Inspection', subtitle: 'Quality control & testing', href: '/enterprise/manufacturing/quality/inspection' }
    ],
    mostUsed: [
      { icon: Gauge, title: 'Production Dashboard', subtitle: 'Real-time monitoring', href: '/enterprise/manufacturing/dashboard' },
      { icon: BarChart2, title: 'OEE Analysis', subtitle: 'Overall Equipment Effectiveness', href: '/enterprise/manufacturing/analytics/oee' },
      { icon: Wrench, title: 'Work Centers', subtitle: 'Resource management', href: '/enterprise/manufacturing/workcenters' },
      { icon: Timer, title: 'Capacity Planning', subtitle: 'Resource optimization', href: '/enterprise/manufacturing/capacity' }
    ],
    recentlyUsed: [
      { icon: Database, title: 'Master Data', subtitle: 'Product & resource data', href: '/enterprise/manufacturing/master' },
      { icon: Truck, title: 'Material Requirements', subtitle: 'MRP planning', href: '/enterprise/manufacturing/mrp' },
      { icon: Target, title: 'Cost Centers', subtitle: 'Manufacturing costs', href: '/enterprise/manufacturing/costs' },
      { icon: Activity, title: 'Process Monitoring', subtitle: 'Real-time tracking', href: '/enterprise/manufacturing/monitoring' }
    ],
    recommended: [
      { icon: Zap, title: 'AI Optimization', subtitle: 'Intelligent automation', href: '/enterprise/manufacturing/ai' },
      { icon: Shield, title: 'Predictive Maintenance', subtitle: 'Equipment optimization', href: '/enterprise/manufacturing/maintenance' },
      { icon: BarChart3, title: 'Digital Twin', subtitle: 'Simulation & modeling', href: '/enterprise/manufacturing/digital-twin' },
      { icon: TrendingUp, title: 'Performance Analytics', subtitle: 'KPI insights', href: '/enterprise/manufacturing/performance' }
    ]
  }

  // Insights tiles data
  const insightsTiles = [
    {
      id: 'production-efficiency',
      title: 'Production Efficiency',
      value: '94.2',
      unit: '%',
      metrics: [
        { label: 'OEE Performance...', value: '94.2%', trend: 'up' },
        { label: 'Downtime Reduction...', value: '15.3%', trend: 'up' },
        { label: 'Quality Rate...', value: '99.1%', trend: 'up' }
      ],
      action: 'View Details',
      color: 'border-green-500'
    },
    {
      id: 'production-orders',
      title: 'Active Production Orders',
      subtitle: 'Current Production Status',
      value: '247',
      description: 'Orders in progress',
      trend: 'up',
      change: '+8%',
      color: 'border-blue-500'
    },
    {
      id: 'quality-metrics',
      title: 'Quality Performance',
      value: '99.1',
      unit: '%',
      description: 'First-pass yield rate',
      trend: 'up',
      change: '+2.3%',
      color: 'border-purple-500'
    },
    {
      id: 'capacity-utilization',
      title: 'Capacity Utilization',
      value: '87.5',
      unit: '%',
      description: 'Current capacity usage',
      trend: 'neutral',
      change: 'Optimal',
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
    <ProtectedPage requiredSpace="manufacturing">
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
                            <h4 className="font-medium text-sm mb-1">Production Status</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              Current shift: 94.2% OEE performance
                            </p>
                            <div className="space-y-1 text-xs">
                              <div>Active Orders: 247</div>
                              <div>On-time Delivery: 98.3%</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Quality Alerts</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>First-pass Yield: 99.1%</div>
                              <div>Defect Rate: 0.9% (target: {'<'}1%)</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Capacity Planning</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Current Utilization: 87.5%</div>
                              <div>Available Capacity: 12.5%</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Maintenance Schedule</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Next PM: Line 3 - Tomorrow 6AM</div>
                              <div>Predicted Issues: None detected</div>
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