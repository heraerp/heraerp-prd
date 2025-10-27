'use client'

/**
 * Enterprise Supply Chain Management Overview Page
 * Smart Code: HERA.ENTERPRISE.SCM.OVERVIEW.v1
 * 
 * HERA Enterprise supply chain management dashboard
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
  Warehouse,
  Route,
  Box,
  MapPin,
  Navigation,
  Layers
} from 'lucide-react'

export default function EnterpriseSupplyChainManagementPage() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // News/Updates data
  const newsItems = [
    {
      id: 1,
      title: "HERA SCM 2025.4 Introduces AI-Powered Supply Chain Optimization",
      content: "New machine learning algorithms optimize inventory levels and transportation routes, reducing costs by up to 20% through intelligent demand forecasting and real-time analytics...",
      time: "1 wk. ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Smart Warehouse Management Goes Live",
      content: "AI-powered warehouse optimization now automates stock movements and predicts demand patterns, improving efficiency by 35% and reducing stockouts.",
      time: "3 days ago"
    },
    {
      id: 3,
      title: "Transportation Analytics Enhanced",
      content: "Real-time route optimization and multimodal planning now provide comprehensive delivery tracking and carbon footprint monitoring for sustainable logistics.",
      time: "2 days ago"
    }
  ]

  // Main module tiles based on YAML
  const modulePages = [
    {
      id: 'inventory-management',
      title: 'Inventory Management',
      subtitle: 'Goods Movement & Analysis',
      icon: Package,
      color: 'bg-blue-600',
      href: '/enterprise/scm/inventory'
    },
    {
      id: 'order-promising',
      title: 'Order Promising',
      subtitle: 'Product Availability & Commitment',
      icon: CheckCircle,
      color: 'bg-green-600',
      href: '/enterprise/scm/orders'
    },
    {
      id: 'warehouse-management',
      title: 'Warehouse Management',
      subtitle: 'Stock Optimization & Mobile Operations',
      icon: Warehouse,
      color: 'bg-orange-600',
      href: '/enterprise/scm/warehouse'
    },
    {
      id: 'transportation-management',
      title: 'Transportation Management',
      subtitle: 'Route Optimization & Multimodal Planning',
      icon: Truck,
      color: 'bg-purple-600',
      href: '/enterprise/scm/transportation'
    },
    {
      id: 'supply-analytics',
      title: 'Supply Chain Analytics',
      subtitle: 'AI-Driven Insights & Optimization',
      icon: BarChart3,
      color: 'bg-teal-600',
      href: '/enterprise/scm/analytics'
    },
    {
      id: 'demand-planning',
      title: 'Demand Planning',
      subtitle: 'Forecasting & Strategic Planning',
      icon: TrendingUp,
      color: 'bg-red-600',
      href: '/enterprise/scm/demand'
    }
  ]

  // Apps data
  const appsData = {
    favorites: [
      { icon: Package, title: 'Inventory Tracking', subtitle: 'Real-time stock levels', href: '/enterprise/scm/inventory/tracking' },
      { icon: Truck, title: 'Shipment Management', subtitle: 'Track deliveries & routes', href: '/enterprise/scm/shipments' },
      { icon: Warehouse, title: 'Warehouse Operations', subtitle: 'Inbound & outbound processing', href: '/enterprise/scm/warehouse/operations' },
      { icon: CheckCircle, title: 'Order Fulfillment', subtitle: 'Promise & delivery tracking', href: '/enterprise/scm/orders/fulfillment' }
    ],
    mostUsed: [
      { icon: BarChart3, title: 'Supply Analytics', subtitle: 'Performance insights', href: '/enterprise/scm/analytics/supply' },
      { icon: Route, title: 'Route Optimization', subtitle: 'Transportation planning', href: '/enterprise/scm/transportation/routes' },
      { icon: Target, title: 'Demand Forecasting', subtitle: 'Predictive analytics', href: '/enterprise/scm/demand/forecasting' },
      { icon: Globe, title: 'Supplier Network', subtitle: 'Global supplier management', href: '/enterprise/scm/suppliers' }
    ],
    recentlyUsed: [
      { icon: Database, title: 'Master Data', subtitle: 'Product & location data', href: '/enterprise/scm/master' },
      { icon: Layers, title: 'Stock Optimization', subtitle: 'Inventory level management', href: '/enterprise/scm/inventory/optimization' },
      { icon: MapPin, title: 'Location Management', subtitle: 'Warehouse & facility tracking', href: '/enterprise/scm/locations' },
      { icon: Activity, title: 'Process Monitoring', subtitle: 'Real-time supply chain tracking', href: '/enterprise/scm/monitoring' }
    ],
    recommended: [
      { icon: Zap, title: 'AI Supply Chain Assistant', subtitle: 'Intelligent automation', href: '/enterprise/scm/ai' },
      { icon: Shield, title: 'Risk Management', subtitle: 'Supply chain risk assessment', href: '/enterprise/scm/risk' },
      { icon: Calculator, title: 'Cost Optimization', subtitle: 'Supply chain cost analysis', href: '/enterprise/scm/costs' },
      { icon: Navigation, title: 'Digital Twin', subtitle: 'Supply chain simulation', href: '/enterprise/scm/digital-twin' }
    ]
  }

  // Insights tiles data
  const insightsTiles = [
    {
      id: 'inventory-turnover',
      title: 'Inventory Performance',
      value: '12.8',
      unit: 'x',
      metrics: [
        { label: 'Turnover Rate...', value: '12.8x', trend: 'up' },
        { label: 'Stock Accuracy...', value: '98.7%', trend: 'up' },
        { label: 'Carrying Cost...', value: '₹2.1M', trend: 'down' }
      ],
      action: 'View Details',
      color: 'border-green-500'
    },
    {
      id: 'order-fulfillment',
      title: 'Order Fulfillment Rate',
      subtitle: 'On-Time Performance',
      value: '96.4',
      unit: '%',
      description: 'Orders delivered on time',
      trend: 'up',
      change: '+3.2%',
      color: 'border-blue-500'
    },
    {
      id: 'transportation-efficiency',
      title: 'Transportation Efficiency',
      value: '87.3',
      unit: '%',
      description: 'Route optimization score',
      trend: 'up',
      change: '+5.1%',
      color: 'border-purple-500'
    },
    {
      id: 'warehouse-utilization',
      title: 'Warehouse Utilization',
      value: '82.5',
      unit: '%',
      description: 'Space utilization rate',
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
                            <h4 className="font-medium text-sm mb-1">Inventory Status</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              Current turnover: 12.8x (98.7% accuracy)
                            </p>
                            <div className="space-y-1 text-xs">
                              <div>Stock Levels: Optimal</div>
                              <div>Carrying Cost: ₹2.1M (-8%)</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Transportation</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Route Efficiency: 87.3%</div>
                              <div>On-time Delivery: 96.4%</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Warehouse Operations</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Utilization Rate: 82.5%</div>
                              <div>Processing Time: 2.3 hours avg</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Supply Chain Alerts</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Critical Items: 3 low stock</div>
                              <div>Delayed Shipments: 2 pending</div>
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