'use client'

/**
 * Universal Module Page Template
 * Smart Code: HERA.UNIVERSAL.MODULE.PAGE.v1
 * 
 * Dynamic page generator that reads from hera-navigation.json
 * Generates Level 2 module pages (Finance, Procurement, etc.)
 */

import React, { useState, useMemo } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Bell, User, Settings, ChevronDown, TrendingUp, BarChart3, 
  DollarSign, Users, FileText, CreditCard, RefreshCw, ArrowUp, ArrowDown, 
  Minus, Star, Clock, Eye, MessageSquare, Zap, Target, Globe, Calendar, 
  Award, Building2, ShoppingCart, Receipt, PieChart, Activity, Calculator, 
  Wallet, Banknote, CircleDollarSign, CheckCircle, AlertTriangle, 
  TrendingDown, Shield, BookOpen, Briefcase, LucideIcon
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Icon mapping for dynamic icon resolution
const ICON_MAP: Record<string, LucideIcon> = {
  'banknote': Banknote,
  'shopping-cart': ShoppingCart,
  'trending-up': TrendingUp,
  'book-open': BookOpen,
  'credit-card': CreditCard,
  'wallet': Wallet,
  'piggy-bank': Wallet, // fallback to wallet
  'file-text': FileText,
  'clipboard-list': FileText, // fallback
  'users': Users,
  'shopping-bag': ShoppingCart, // fallback
  'bars-3': BarChart3, // fallback to chart
  'chart-bar': BarChart3,
  'building-2': Building2,
  'shield': Shield,
  'calculator': Calculator,
  'receipt': Receipt,
  'pie-chart': PieChart,
  'target': Target,
  'clock': Clock,
  'check-circle': CheckCircle,
  'zap': Zap,
  'activity': Activity
}

interface ModuleConfig {
  name: string
  code: string
  route: string
  icon: string
  color: string
  smart_code_prefix: string
  areas: AreaConfig[]
}

interface AreaConfig {
  name: string
  code: string
  route: string
  icon: string
  operations: OperationConfig[]
}

interface OperationConfig {
  name: string
  code: string
  route: string
  permissions: string[]
}

interface UniversalModulePageProps {
  moduleCode: string
  moduleConfig: ModuleConfig
  industry?: string
  industryTheme?: {
    primary_color: string
    secondary_color: string
    hero_background: string
  }
}

// Module code to space name mapping
const MODULE_TO_SPACE_MAP: Record<string, string> = {
  'FIN': 'finance',
  'PROC': 'procurement', 
  'SALES': 'sales',
  'SCM': 'materials',
  'MFG': 'manufacturing',
  'SVC': 'services',
  'ASSETS': 'assets',
  'HR': 'hr'
}

export function UniversalModulePage({ 
  moduleCode, 
  moduleConfig, 
  industry,
  industryTheme 
}: UniversalModulePageProps) {
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // Generate news items based on module
  const newsItems = useMemo(() => [
    {
      id: 1,
      title: `HERA ${moduleConfig.name} 2025.4 Introduces AI-Powered Analytics`,
      content: `New predictive analytics capabilities help ${moduleConfig.name.toLowerCase()} teams anticipate trends with 95% accuracy, enabling better operational management...`,
      time: "1 wk. ago",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: `Automated ${moduleConfig.name} Workflows Now Live`,
      content: `Real-time process automation and document exchange is now available across 45+ countries for ${moduleConfig.name.toLowerCase()} operations.`,
      time: "3 days ago"
    },
    {
      id: 3,
      title: `Q1 2025 ${moduleConfig.name} Performance Exceeds Targets`,
      content: `Record-breaking performance achieved through HERA's automated workflows and intelligent process optimization.`,
      time: "5 days ago"
    }
  ], [moduleConfig.name])

  // Generate main area tiles from configuration
  const areaPages = useMemo(() => 
    moduleConfig.areas.map((area, index) => {
      const IconComponent = ICON_MAP[area.icon] || FileText
      const colors = [
        'bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-red-600', 
        'bg-purple-600', 'bg-teal-600', 'bg-indigo-600', 'bg-pink-600'
      ]
      
      return {
        id: area.code.toLowerCase(),
        title: area.name,
        subtitle: `${moduleConfig.name} Operations`,
        icon: IconComponent,
        color: colors[index % colors.length],
        href: area.route
      }
    }), 
    [moduleConfig]
  )

  // Generate apps data from operations
  const appsData = useMemo(() => {
    const allOperations = moduleConfig.areas.flatMap(area => 
      area.operations.map(op => {
        const IconComponent = ICON_MAP[area.icon] || FileText
        return {
          icon: IconComponent,
          title: op.name,
          subtitle: area.name,
          href: op.route
        }
      })
    )

    return {
      favorites: allOperations.slice(0, 4),
      mostUsed: allOperations.slice(4, 8),
      recentlyUsed: allOperations.slice(8, 12),
      recommended: allOperations.slice(12, 16)
    }
  }, [moduleConfig])

  // Generate insights tiles based on module type
  const insightsTiles = useMemo(() => {
    const baseInsights = [
      {
        id: `${moduleCode.toLowerCase()}-performance`,
        title: `${moduleConfig.name} Performance`,
        value: '94',
        unit: '%',
        description: 'Overall efficiency score',
        trend: 'up' as const,
        change: '+8%',
        color: 'border-green-500'
      },
      {
        id: `${moduleCode.toLowerCase()}-pending`,
        title: 'Pending Actions',
        value: '47',
        description: 'Items requiring attention',
        trend: 'down' as const,
        change: '-12%',
        color: 'border-orange-500'
      },
      {
        id: `${moduleCode.toLowerCase()}-completed`,
        title: 'Completed Today',
        value: '156',
        description: 'Successfully processed',
        trend: 'up' as const,
        change: '+24%',
        color: 'border-blue-500'
      },
      {
        id: `${moduleCode.toLowerCase()}-analytics`,
        title: 'Process Analytics',
        value: '2.1',
        unit: 'hrs',
        description: 'Average processing time',
        trend: 'down' as const,
        change: 'Improved',
        color: 'border-purple-500'
      }
    ]

    return baseInsights
  }, [moduleCode, moduleConfig.name])

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

  // Apply industry theme if provided
  const themeStyles = industryTheme ? {
    background: industryTheme.hero_background,
    primaryColor: industryTheme.primary_color,
    secondaryColor: industryTheme.secondary_color
  } : {}

  // Get the correct space name for access control
  const spaceName = MODULE_TO_SPACE_MAP[moduleCode] || moduleCode.toLowerCase()

  return (
    <ProtectedPage requiredSpace={spaceName}>
      <div className="min-h-screen bg-gray-50" style={themeStyles.background ? { background: themeStyles.background } : {}}>
        {/* Industry Header if applicable */}
        {industry && (
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {industry} Industry Solution
                </Badge>
                <span className="text-sm opacity-75">Enhanced {moduleConfig.name} for {industry}</span>
              </div>
            </div>
          </div>
        )}

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
                  <h2 className="text-lg font-semibold text-gray-900">Areas</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {areaPages.map((page) => {
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
                  <h2 className="text-lg font-semibold text-gray-900">Operations</h2>
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

                        <p className="text-xs text-gray-600">{tile.description}</p>
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
                        <p className="font-medium mb-2">Here's what I've found for {moduleConfig.name}:</p>
                        
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Performance Overview</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              {moduleConfig.name} operations running smoothly
                            </p>
                            <div className="space-y-1 text-xs">
                              <div>Efficiency: 94% (+8% vs last month)</div>
                              <div>Processing Time: 2.1 hrs average</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Pending Actions</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Items requiring review: 47</div>
                              <div>High priority tasks: 12</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Today's Activity</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Completed: 156 items</div>
                              <div>Success Rate: 98.2%</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <Input 
                            placeholder={`Ask about ${moduleConfig.name}...`}
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