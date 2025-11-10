/**
 * Enterprise Procurement Overview Page - Dynamic Tiles
 * Smart Code: HERA.ENTERPRISE.PROCUREMENT.DYNAMIC_TILES.v1
 * 
 * HERA Enterprise procurement management dashboard with dynamic tile system
 * Maintains three-column layout: News | Dynamic Tiles | HERA Assistant
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
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
  Loader2
} from 'lucide-react'

// Icon mapping for dynamic tiles
const iconMap = {
  'zap': Zap,
  'shopping-cart': ShoppingCart,
  'target': Target,
  'users': Users,
  'file-text': FileText,
  'bar-chart-3': BarChart3,
  'calculator': Calculator,
  'shield': Shield,
  'building-2': Building2,
  'credit-card': CreditCard,
  'settings': Settings
}

interface ProcurementTile {
  id: string
  entity_name: string
  entity_code: string
  slug: string
  subtitle: string
  icon: string
  color: string
  persona_label: string
  visible_roles: string[]
  route: string
  order: number
}

export default function EnterpriseProcurementOverviewPage() {
  const router = useRouter()
  const { user, organization, isAuthenticated, isLoading, contextLoading } = useHERAAuth()
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dynamic tiles state
  const [dynamicTiles, setDynamicTiles] = useState<ProcurementTile[]>([])
  const [tilesLoading, setTilesLoading] = useState(true)
  const [tilesError, setTilesError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      loadDynamicTiles()
    }
  }, [isAuthenticated, organization?.id])

  const loadDynamicTiles = async () => {
    try {
      setTilesLoading(true)
      setTilesError(null)
      
      console.log('🔍 Loading dynamic procurement tiles')

      // Dynamic tiles configuration - these will come from API/database later
      const procurementTiles: ProcurementTile[] = [
        {
          id: 'modern-procurement',
          entity_name: 'Modern Procurement',
          entity_code: 'MODERN_PROC',
          slug: 'modern',
          subtitle: 'AI-Driven Process Automation',
          icon: 'zap',
          color: 'bg-blue-600',
          persona_label: 'Digital Transformation',
          visible_roles: ['procurement_manager', 'admin'],
          route: '/enterprise/procurement/modern',
          order: 1
        },
        {
          id: 'operational-procurement',
          entity_name: 'Operational Procurement',
          entity_code: 'OPS_PROC',
          slug: 'operational',
          subtitle: 'Day-to-Day Purchasing Tasks',
          icon: 'shopping-cart',
          color: 'bg-green-600',
          persona_label: 'Operations',
          visible_roles: ['buyer', 'procurement_manager'],
          route: '/enterprise/procurement/operational',
          order: 2
        },
        {
          id: 'sourcing',
          entity_name: 'Sourcing',
          entity_code: 'SOURCING',
          slug: 'sourcing',
          subtitle: 'Cognitive Sourcing & Contracts',
          icon: 'target',
          color: 'bg-orange-600',
          persona_label: 'Strategic Sourcing',
          visible_roles: ['sourcing_manager', 'procurement_manager'],
          route: '/enterprise/procurement/sourcing',
          order: 3
        },
        {
          id: 'supplier-management',
          entity_name: 'Supplier Management',
          entity_code: 'SUPPLIERS',
          slug: 'suppliers',
          subtitle: 'Real-Time Supplier Evaluation',
          icon: 'users',
          color: 'bg-purple-600',
          persona_label: 'Supplier Relations',
          visible_roles: ['supplier_manager', 'procurement_manager'],
          route: '/enterprise/procurement/suppliers',
          order: 4
        },
        {
          id: 'invoice-management',
          entity_name: 'Invoice Management',
          entity_code: 'INVOICES',
          slug: 'invoices',
          subtitle: 'Automated Invoice Processing',
          icon: 'file-text',
          color: 'bg-teal-600',
          persona_label: 'Accounts Payable',
          visible_roles: ['ap_clerk', 'finance_manager'],
          route: '/enterprise/procurement/invoices',
          order: 5
        },
        {
          id: 'analytics-insights',
          entity_name: 'Procurement Analytics',
          entity_code: 'ANALYTICS',
          slug: 'analytics',
          subtitle: 'Spend Analysis & Insights',
          icon: 'bar-chart-3',
          color: 'bg-red-600',
          persona_label: 'Business Intelligence',
          visible_roles: ['analyst', 'procurement_manager'],
          route: '/enterprise/procurement/analytics',
          order: 6
        },
        {
          id: 'purchasing-rebates',
          entity_name: 'Purchasing Rebates',
          entity_code: 'REBATES',
          slug: 'purchasing-rebates',
          subtitle: 'End-to-end Supplier Rebate Management',
          icon: 'calculator',
          color: 'bg-indigo-600',
          persona_label: 'Financial Optimization',
          visible_roles: ['finance_manager', 'procurement_manager'],
          route: '/enterprise/procurement/purchasing-rebates',
          order: 7
        }
      ]

      setDynamicTiles(procurementTiles.sort((a, b) => a.order - b.order))

    } catch (err) {
      console.error('Error loading dynamic tiles:', err)
      setTilesError(err instanceof Error ? err.message : 'Failed to load tiles')
    } finally {
      setTilesLoading(false)
    }
  }

  const handleTileClick = (tile: ProcurementTile) => {
    if (tile.route) {
      router.push(tile.route)
    } else {
      alert(`${tile.entity_name} coming soon!\\nRoute: ${tile.route}\\nRoles: ${tile.visible_roles.join(', ')}`)
    }
  }

  // News/Updates data
  const newsItems = [
    {
      id: 1,
      title: "HERA Procurement 2025.4 Introduces AI-Powered Spend Analytics",
      content: "New machine learning algorithms analyze spending patterns and identify cost-saving opportunities, reducing procurement costs by up to 15% through intelligent insights...",
      time: "2 wk. ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Automated Invoice Processing Goes Live",
      content: "AI-powered invoice processing now handles 95% of invoices automatically, reducing processing time from days to minutes and eliminating manual errors.",
      time: "1 wk. ago"
    },
    {
      id: 3,
      title: "Supplier Risk Management Enhanced",
      content: "Real-time supplier evaluation and sustainability metrics now provide comprehensive risk assessment and carbon footprint tracking for better sourcing decisions.",
      time: "4 days ago"
    }
  ]

  // Apps data for tabs (will remain static for now)
  const appsData = {
    favorites: [
      { icon: ShoppingCart, title: 'Purchase Orders', subtitle: 'Create & manage orders', href: '/enterprise/procurement/orders' },
      { icon: Receipt, title: 'Purchase Requisitions', subtitle: 'Request approvals', href: '/enterprise/procurement/requisitions' },
      { icon: Users, title: 'Supplier Catalog', subtitle: 'Browse supplier offerings', href: '/enterprise/procurement/catalog' },
      { icon: FileText, title: 'Invoice Processing', subtitle: 'Review & approve invoices', href: '/enterprise/procurement/invoices' }
    ],
    mostUsed: [
      { icon: BarChart3, title: 'Spend Analytics', subtitle: 'Analyze spending patterns', href: '/enterprise/procurement/analytics/spend' },
      { icon: UserCheck, title: 'Supplier Performance', subtitle: 'Evaluate suppliers', href: '/enterprise/procurement/suppliers/performance' },
      { icon: Target, title: 'Sourcing Events', subtitle: 'Manage RFQs & bids', href: '/enterprise/procurement/sourcing/events' },
      { icon: Shield, title: 'Contract Management', subtitle: 'Track & manage contracts', href: '/enterprise/procurement/contracts' }
    ],
    recentlyUsed: [
      { icon: Database, title: 'Master Data', subtitle: 'Product & supplier data', href: '/enterprise/procurement/master' },
      { icon: LineChart, title: 'Budget Tracking', subtitle: 'Monitor procurement budgets', href: '/enterprise/procurement/budgets' },
      { icon: ClipboardCheck, title: 'Approval Workflows', subtitle: 'Manage approvals', href: '/enterprise/procurement/approvals' },
      { icon: Globe, title: 'Sustainability Metrics', subtitle: 'Carbon footprint tracking', href: '/enterprise/procurement/sustainability' }
    ],
    recommended: [
      { icon: Zap, title: 'AI Procurement Assistant', subtitle: 'Intelligent automation', href: '/enterprise/procurement/ai' },
      { icon: AlertTriangle, title: 'Risk Management', subtitle: 'Supplier risk assessment', href: '/enterprise/procurement/risk' },
      { icon: Calculator, title: 'Cost Optimization', subtitle: 'Savings opportunities', href: '/enterprise/procurement/optimization' },
      { icon: Activity, title: 'Process Analytics', subtitle: 'Performance insights', href: '/enterprise/procurement/process' }
    ]
  }

  // Insights tiles data
  const insightsTiles = [
    {
      id: 'spend-analytics',
      title: 'Total Spend',
      value: '₹24.8',
      unit: 'M',
      metrics: [
        { label: 'Cost Savings...', value: '₹3.2M', trend: 'up' },
        { label: 'Budget Utilization...', value: '87.3%', trend: 'up' },
        { label: 'On-time Delivery...', value: '94.5%', trend: 'up' }
      ],
      action: 'View Details',
      color: 'border-green-500'
    },
    {
      id: 'purchase-orders',
      title: 'Active Purchase Orders',
      subtitle: 'Current PO Status',
      value: '89',
      description: 'Awaiting approval',
      trend: 'up',
      change: '+12%',
      color: 'border-blue-500'
    },
    {
      id: 'supplier-performance',
      title: 'Supplier Performance',
      value: '96.2',
      unit: '%',
      description: 'Average supplier rating',
      trend: 'up',
      change: '+1.8%',
      color: 'border-purple-500'
    },
    {
      id: 'invoice-automation',
      title: 'Invoice Automation',
      value: '95.1',
      unit: '%',
      description: 'Automated processing rate',
      trend: 'up',
      change: '+5.2%',
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
    <ProtectedPage requiredSpace="procurement">
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

            {/* Center Column - Dynamic Tiles and Apps */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dynamic Tiles Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Procurement Modules ({dynamicTiles.length})</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                
                {tilesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
                    <span className="text-gray-600">Loading modules...</span>
                  </div>
                ) : tilesError ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600">{tilesError}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {dynamicTiles.map((tile) => {
                      const Icon = iconMap[tile.icon] || Settings
                      return (
                        <Card 
                          key={tile.id} 
                          className={`${tile.color} text-white border-0 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer`}
                          onClick={() => handleTileClick(tile)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <Icon className="w-6 h-6" />
                              <Eye className="w-4 h-4 opacity-75" />
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{tile.entity_name}</h3>
                            <p className="text-sm opacity-90 mb-2">{tile.subtitle}</p>
                            {tile.persona_label && (
                              <Badge variant="secondary" className="text-xs bg-white/20">
                                {tile.persona_label}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
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
                              onClick={() => router.push(app.href)}
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
                            <h4 className="font-medium text-sm mb-1">Spend Analysis</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              Q1 2025: ₹24.8M total procurement spend
                            </p>
                            <div className="space-y-1 text-xs">
                              <div>Cost Savings: ₹3.2M (+18%)</div>
                              <div>Top Category: Direct Materials</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Pending Actions</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Purchase Orders: 89 awaiting approval</div>
                              <div>Supplier Evaluations: 12 overdue</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Supplier Performance</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Average Rating: 96.2%</div>
                              <div>On-time Delivery: 94.5%</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Invoice Automation</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Processing Rate: 95.1%</div>
                              <div>Average Time: 2.3 minutes</div>
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