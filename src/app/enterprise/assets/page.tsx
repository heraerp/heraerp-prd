'use client'

/**
 * Enterprise Asset Management Overview Page
 * Smart Code: HERA.ENTERPRISE.ASSETS.OVERVIEW.v1
 * 
 * HERA Enterprise asset management dashboard
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
  Clipboard,
  Cpu,
  Monitor,
  HardDrive,
  Smartphone,
  Radio,
  Wifi,
  Server,
  Hammer
} from 'lucide-react'

export default function EnterpriseAssetManagementPage() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // News/Updates data
  const newsItems = [
    {
      id: 1,
      title: "HERA Asset Management 2025.4 Introduces AI-Powered Predictive Maintenance",
      content: "New machine learning algorithms predict equipment failures up to 30 days in advance, reducing unplanned downtime by 40% through intelligent maintenance scheduling...",
      time: "1 wk. ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Mobile Asset Management Goes Offline",
      content: "Field technicians can now perform inspections and update asset status without internet connectivity, with automatic sync when connection is restored.",
      time: "3 days ago"
    },
    {
      id: 3,
      title: "Real-Time Asset Analytics Enhanced",
      content: "Embedded analytics now provide instant insights into asset performance, maintenance costs, and equipment reliability with interactive dashboards.",
      time: "1 day ago"
    }
  ]

  // Main module tiles based on YAML
  const modulePages = [
    {
      id: 'technical-asset-management',
      title: 'Technical Asset Management',
      subtitle: 'Asset Lifecycle & Hierarchies',
      icon: Server,
      color: 'bg-blue-600',
      href: '/enterprise/assets/technical'
    },
    {
      id: 'demand-monitoring',
      title: 'Demand Monitoring',
      subtitle: 'Maintenance Planning & Requests',
      icon: Monitor,
      color: 'bg-green-600',
      href: '/enterprise/assets/demand'
    },
    {
      id: 'planning-scheduling',
      title: 'Planning & Scheduling',
      subtitle: 'Order Planning & Dispatching',
      icon: Calendar,
      color: 'bg-orange-600',
      href: '/enterprise/assets/planning'
    },
    {
      id: 'maintenance-execution',
      title: 'Maintenance Execution',
      subtitle: 'Job Management & Field Operations',
      icon: Wrench,
      color: 'bg-purple-600',
      href: '/enterprise/assets/execution'
    },
    {
      id: 'asset-analytics',
      title: 'Asset Analytics',
      subtitle: 'Performance & Cost Analysis',
      icon: BarChart3,
      color: 'bg-teal-600',
      href: '/enterprise/assets/analytics'
    },
    {
      id: 'predictive-maintenance',
      title: 'Predictive Maintenance',
      subtitle: 'AI-Driven Failure Prediction',
      icon: Cpu,
      color: 'bg-red-600',
      href: '/enterprise/assets/predictive'
    }
  ]

  // Apps data
  const appsData = {
    favorites: [
      { icon: Server, title: 'Asset Registry', subtitle: 'Equipment master data', href: '/enterprise/assets/registry' },
      { icon: Calendar, title: 'Maintenance Schedule', subtitle: 'Planned maintenance calendar', href: '/enterprise/assets/schedule' },
      { icon: AlertTriangle, title: 'Work Orders', subtitle: 'Active maintenance orders', href: '/enterprise/assets/workorders' },
      { icon: Smartphone, title: 'Mobile Inspections', subtitle: 'Field inspection app', href: '/enterprise/assets/mobile' }
    ],
    mostUsed: [
      { icon: BarChart3, title: 'Asset Performance', subtitle: 'KPI dashboards & metrics', href: '/enterprise/assets/performance' },
      { icon: Wrench, title: 'Maintenance History', subtitle: 'Service records & logs', href: '/enterprise/assets/history' },
      { icon: DollarSign, title: 'Cost Analysis', subtitle: 'Maintenance cost tracking', href: '/enterprise/assets/costs' },
      { icon: Gauge, title: 'Asset Utilization', subtitle: 'Equipment efficiency metrics', href: '/enterprise/assets/utilization' }
    ],
    recentlyUsed: [
      { icon: Database, title: 'Master Data', subtitle: 'Asset & location data', href: '/enterprise/assets/master' },
      { icon: Layers, title: 'Asset Hierarchies', subtitle: 'Equipment organization', href: '/enterprise/assets/hierarchies' },
      { icon: ClipboardCheck, title: 'Inspection Plans', subtitle: 'Preventive maintenance plans', href: '/enterprise/assets/inspections' },
      { icon: FileText, title: 'Maintenance Reports', subtitle: 'Performance reporting', href: '/enterprise/assets/reports' }
    ],
    recommended: [
      { icon: Cpu, title: 'AI Failure Prediction', subtitle: 'Predictive analytics', href: '/enterprise/assets/ai' },
      { icon: Shield, title: 'Risk Assessment', subtitle: 'Asset risk management', href: '/enterprise/assets/risk' },
      { icon: Radio, title: 'IoT Integration', subtitle: 'Sensor data monitoring', href: '/enterprise/assets/iot' },
      { icon: Activity, title: 'Reliability Analytics', subtitle: 'Equipment reliability metrics', href: '/enterprise/assets/reliability' }
    ]
  }

  // Insights tiles data
  const insightsTiles = [
    {
      id: 'asset-availability',
      title: 'Asset Availability',
      value: '96.8',
      unit: '%',
      metrics: [
        { label: 'Uptime Rate...', value: '96.8%', trend: 'up' },
        { label: 'MTTR...', value: '2.3h', trend: 'down' },
        { label: 'MTBF...', value: '245h', trend: 'up' }
      ],
      action: 'View Details',
      color: 'border-green-500'
    },
    {
      id: 'maintenance-efficiency',
      title: 'Maintenance Efficiency',
      subtitle: 'Planned vs Reactive',
      value: '78.5',
      unit: '%',
      description: 'Planned maintenance ratio',
      trend: 'up',
      change: '+6.2%',
      color: 'border-blue-500'
    },
    {
      id: 'cost-control',
      title: 'Maintenance Cost Control',
      value: '94.2',
      unit: '%',
      description: 'Budget adherence rate',
      trend: 'up',
      change: '+2.8%',
      color: 'border-purple-500'
    },
    {
      id: 'predictive-accuracy',
      title: 'Predictive Accuracy',
      value: '92.1',
      unit: '%',
      description: 'AI prediction success rate',
      trend: 'up',
      change: '+4.5%',
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
                            <h4 className="font-medium text-sm mb-1">Asset Health</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              Current availability: 96.8% (MTTR: 2.3h)
                            </p>
                            <div className="space-y-1 text-xs">
                              <div>Critical Assets: 3 need attention</div>
                              <div>Predictive Alerts: 5 upcoming</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Maintenance Performance</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Planned Maintenance: 78.5%</div>
                              <div>Budget Adherence: 94.2%</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Predictive Insights</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>AI Accuracy: 92.1%</div>
                              <div>Failure Predictions: 8 next 30 days</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Work Orders</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Active Orders: 47</div>
                              <div>Overdue: 2 (priority review)</div>
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