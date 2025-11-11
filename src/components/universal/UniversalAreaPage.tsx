'use client'

/**
 * Universal Area Page Template
 * Smart Code: HERA.UNIVERSAL.AREA.PAGE.v1
 * 
 * Dynamic page generator for Level 3 area pages (General Ledger, Purchase Orders, etc.)
 * Reads from hera-navigation.json and generates operation-focused interfaces
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
  TrendingDown, Shield, BookOpen, Briefcase, LucideIcon, Plus, Edit,
  Filter, Download, Upload, Mail, Phone, MapPin, Package, Truck
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Icon mapping for dynamic icon resolution
const ICON_MAP: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'credit-card': CreditCard,
  'wallet': Wallet,
  'piggy-bank': Wallet,
  'file-text': FileText,
  'clipboard-list': FileText,
  'users': Users,
  'shopping-bag': ShoppingCart,
  'trending-up': TrendingUp,
  'shield-check': Shield,
  'award': Award,
  'calendar': Calendar,
  'truck': Truck,
  'map': MapPin,
  'fuel': DollarSign, // fallback
  'layers': BarChart3, // fallback
  'certificate': Award, // fallback
  'gem': Star, // fallback
  'coins': CircleDollarSign,
  'shield': Shield
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

interface UniversalAreaPageProps {
  moduleCode: string
  moduleName: string
  areaConfig: AreaConfig
  industry?: string
  industryTheme?: {
    primary_color: string
    secondary_color: string
    hero_background: string
  }
}

export function UniversalAreaPage({ 
  moduleCode, 
  moduleName,
  areaConfig, 
  industry,
  industryTheme 
}: UniversalAreaPageProps) {
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [activeTab, setActiveTab] = useState('operations')
  const [searchQuery, setSearchQuery] = useState('')

  // Generate operation cards from configuration
  const operationCards = useMemo(() => 
    areaConfig.operations.map((operation, index) => {
      const IconComponent = ICON_MAP[areaConfig.icon] || FileText
      const colors = [
        'bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-red-600', 
        'bg-purple-600', 'bg-teal-600', 'bg-indigo-600', 'bg-pink-600'
      ]
      
      return {
        id: operation.code.toLowerCase(),
        title: operation.name,
        subtitle: areaConfig.name,
        icon: IconComponent,
        color: colors[index % colors.length],
        href: operation.route,
        permissions: operation.permissions
      }
    }), 
    [areaConfig]
  )

  // Generate quick actions based on area type
  const quickActions = useMemo(() => {
    const createOperation = areaConfig.operations.find(op => op.code === 'CREATE')
    const listOperation = areaConfig.operations.find(op => op.code === 'LIST')
    const analyticsOperation = areaConfig.operations.find(op => op.code === 'ANALYTICS')
    
    return [
      {
        icon: Plus,
        title: `New ${areaConfig.name}`,
        subtitle: 'Create new record',
        href: createOperation?.route || '#',
        variant: 'primary' as const
      },
      {
        icon: Eye,
        title: `View All`,
        subtitle: 'Browse existing records',
        href: listOperation?.route || '#',
        variant: 'secondary' as const
      },
      {
        icon: BarChart3,
        title: 'Analytics',
        subtitle: 'Performance insights',
        href: analyticsOperation?.route || '#',
        variant: 'secondary' as const
      },
      {
        icon: Download,
        title: 'Reports',
        subtitle: 'Export data',
        href: '#',
        variant: 'secondary' as const
      }
    ]
  }, [areaConfig])

  // Generate area-specific insights
  const areaInsights = useMemo(() => {
    const baseInsights = [
      {
        id: `${areaConfig.code.toLowerCase()}-total`,
        title: `Total ${areaConfig.name}`,
        value: '1,247',
        description: 'Active records',
        trend: 'up' as const,
        change: '+18%',
        color: 'border-blue-500'
      },
      {
        id: `${areaConfig.code.toLowerCase()}-pending`,
        title: 'Pending Approval',
        value: '23',
        description: 'Awaiting review',
        trend: 'down' as const,
        change: '-12%',
        color: 'border-orange-500'
      },
      {
        id: `${areaConfig.code.toLowerCase()}-processed`,
        title: 'Processed Today',
        value: '89',
        description: 'Successfully completed',
        trend: 'up' as const,
        change: '+34%',
        color: 'border-green-500'
      },
      {
        id: `${areaConfig.code.toLowerCase()}-efficiency`,
        title: 'Processing Efficiency',
        value: '96.2',
        unit: '%',
        description: 'Success rate',
        trend: 'up' as const,
        change: '+2.1%',
        color: 'border-purple-500'
      }
    ]

    return baseInsights
  }, [areaConfig])

  // Generate recent activities
  const recentActivities = useMemo(() => [
    {
      id: 1,
      action: `${areaConfig.operations[0]?.name || 'Record'} created`,
      user: user?.email || 'System User',
      time: '2 minutes ago',
      status: 'success' as const
    },
    {
      id: 2,
      action: `${areaConfig.operations[1]?.name || 'Record'} updated`,
      user: 'John Smith',
      time: '15 minutes ago',
      status: 'info' as const
    },
    {
      id: 3,
      action: `${areaConfig.operations[2]?.name || 'Record'} approved`,
      user: 'Sarah Johnson',
      time: '1 hour ago',
      status: 'success' as const
    },
    {
      id: 4,
      action: `${areaConfig.operations[0]?.name || 'Record'} pending review`,
      user: 'Mike Chen',
      time: '2 hours ago',
      status: 'warning' as const
    }
  ], [areaConfig.operations, user])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-orange-600 bg-orange-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  // Apply industry theme if provided
  const themeStyles = industryTheme ? {
    background: industryTheme.hero_background,
    primaryColor: industryTheme.primary_color,
    secondaryColor: industryTheme.secondary_color
  } : {}

  return (
    <ProtectedPage requiredSpace={moduleCode.toLowerCase()}>
      <div className="min-h-screen bg-gray-50" style={themeStyles.background ? { background: themeStyles.background } : {}}>
        {/* Area Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">{moduleName}</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-semibold text-gray-900">{areaConfig.name}</span>
                </div>
                {industry && (
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 border-violet-200">
                    {industry} Edition
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  placeholder={`Search ${areaConfig.name.toLowerCase()}...`}
                  className="w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <Card 
                        key={index}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          action.variant === 'primary' 
                            ? 'bg-violet-600 text-white hover:bg-violet-700' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => window.location.href = action.href}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              action.variant === 'primary' 
                                ? 'bg-white/20' 
                                : 'bg-violet-50'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                action.variant === 'primary' 
                                  ? 'text-white' 
                                  : 'text-violet-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className={`font-medium text-sm ${
                                action.variant === 'primary' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {action.title}
                              </h4>
                              <p className={`text-xs ${
                                action.variant === 'primary' ? 'text-white/80' : 'text-gray-500'
                              }`}>
                                {action.subtitle}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <Card key={activity.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status)}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.action}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.user} • {activity.time}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column - Operations */}
            <div className="lg:col-span-2 space-y-6">
              {/* Operations Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Operations</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {operationCards.map((operation) => {
                    const Icon = operation.icon
                    return (
                      <Card 
                        key={operation.id} 
                        className={`${operation.color} text-white border-0 hover:shadow-lg transition-shadow cursor-pointer`}
                        onClick={() => window.location.href = operation.href}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Icon className="w-6 h-6" />
                            <Eye className="w-4 h-4 opacity-75" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{operation.title}</h3>
                          <p className="text-sm opacity-90">{operation.subtitle}</p>
                          {operation.permissions.length > 0 && (
                            <div className="mt-2">
                              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                                {operation.permissions[0]}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Insights */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Performance Insights</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {areaInsights.map((insight) => (
                    <Card key={insight.id} className={`border-l-4 ${insight.color} hover:shadow-lg transition-all duration-200 cursor-pointer`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-900 mb-1">
                              {insight.title}
                            </h4>
                          </div>
                          <BarChart3 className="w-4 h-4 text-violet-400" />
                        </div>

                        <div className="flex items-baseline space-x-1 mb-2">
                          <span className="text-2xl font-bold text-gray-900">{insight.value}</span>
                          {insight.unit && (
                            <span className="text-sm font-medium text-gray-600">{insight.unit}</span>
                          )}
                          {insight.change && (
                            <div className="flex items-center space-x-1 ml-2">
                              {renderTrendIcon(insight.trend || 'neutral')}
                              <span className={`text-xs ${
                                insight.trend === 'up' ? 'text-green-600' : 
                                insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {insight.change}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-600">{insight.description}</p>
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
                        <p className="text-sm text-violet-500">Area Guide</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-2">Area: {areaConfig.name}</p>
                        
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Quick Start</h4>
                            <p className="text-xs text-gray-600 mb-1">
                              Most users start with "{operationCards[0]?.title}" operation
                            </p>
                            <Button variant="link" className="p-0 h-auto text-xs text-violet-600 hover:text-violet-700">
                              Learn more →
                            </Button>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Performance</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Total records: 1,247</div>
                              <div>Success rate: 96.2%</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Best Practices</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>• Review pending items daily</div>
                              <div>• Use analytics for insights</div>
                              <div>• Follow approval workflows</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <Input 
                            placeholder={`Ask about ${areaConfig.name}...`}
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