/**
 * Universal App Dashboard Component
 * Smart Code: HERA.UNIVERSAL.DASHBOARD.v1
 *
 * Single source of truth for all HERA app dashboards (Retail, Agro, Waste, Salon, etc.)
 * Eliminates 87% code duplication between app-specific dashboards
 *
 * Data Flow:
 * 1. Accept DashboardConfig prop with app-specific settings
 * 2. Fetch APP and APP_DOMAIN entities from platform org
 * 3. Render universal SAP Fiori-style interface
 * 4. Apply app-specific theme, colors, icons, and content
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBag,
  Truck,
  Tag,
  Warehouse,
  TrendingUp,
  Calculator,
  Heart,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Users,
  Store,
  ChevronRight,
  Bell,
  Search,
  Menu,
  Home,
  Calendar,
  User,
  Receipt,
  Folder,
  FileText,
  CreditCard,
  Building,
  ArrowDown,
  ArrowRight,
  RefreshCw,
  Factory,
  FlaskConical,
  Sprout,
  Activity,
  Leaf,
  Send,
  Shield
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { DashboardConfig, DynamicModule, ChatMessage } from './types'

// Icon mapping dictionary - maps string names to Lucide icon components
const iconComponents: Record<string, any> = {
  'TrendingUp': TrendingUp,
  'CheckCircle': CheckCircle,
  'FileText': FileText,
  'BarChart3': BarChart3,
  'DollarSign': DollarSign,
  'Building': Building,
  'Factory': Factory,
  'Warehouse': Warehouse,
  'Activity': Activity,
  'Truck': Truck,
  'Leaf': Leaf,
  'Package': Package,
  'ShoppingBag': ShoppingBag,
  'Tag': Tag,
  'Calculator': Calculator,
  'Heart': Heart,
  'Settings': Settings,
  'Users': Users,
  'Store': Store,
  'Receipt': Receipt,
  'CreditCard': CreditCard,
  'Sprout': Sprout,
  'FlaskConical': FlaskConical
}

interface UniversalAppDashboardProps {
  config: DashboardConfig
}

export function UniversalAppDashboard({ config }: UniversalAppDashboardProps) {
  const router = useRouter()
  const {
    user,
    organization,
    isAuthenticated,
    isLoading,
    logout,
    contextLoading
  } = useHERAAuth()

  // Fetch APP and APP_DOMAIN entities from platform org
  const { entities: appEntities, isLoading: appLoading, error: appError, refetch: refetchApps } = useUniversalEntityV1({
    entity_type: 'APP',
    organizationId: '00000000-0000-0000-0000-000000000000', // Platform org
    filters: {
      limit: 10,
      include_dynamic: false,
      include_relationships: true // Enable APP_HAS_DOMAIN relationships
    }
  })

  const { entities: domainEntities, isLoading: domainsLoading, error: domainsError, refetch: refetchDomains } = useUniversalEntityV1({
    entity_type: 'APP_DOMAIN',
    organizationId: '00000000-0000-0000-0000-000000000000', // Platform org
    filters: {
      limit: 50,
      include_dynamic: false,
      include_relationships: false
    }
  })

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: config.aiGreeting }
  ])
  const [chatInput, setChatInput] = useState('')

  // Reload function for manual refresh
  const fetchDynamicModules = async () => {
    console.log('🔄 Manual refresh triggered')
    await Promise.all([refetchApps(), refetchDomains()])
  }

  // Dynamic modules state
  const [dynamicModules, setDynamicModules] = useState<DynamicModule[]>([])
  const modulesLoading = appLoading || domainsLoading
  const modulesError = appError || domainsError

  // Icon map for domain tiles
  const iconMap: any = {
    'warehouse': Warehouse,
    'store': Store,
    'truck': Truck,
    'calculator': Calculator,
    'tag': Tag,
    'box': Package,
    'bar-chart-3': BarChart3,
    'settings': Settings,
    'users': Users,
    'package': Package,
    'factory': Factory,
    'flask-conical': FlaskConical,
    'check-circle': CheckCircle,
    'credit-card': CreditCard,
    'sprout': Sprout,
    'calendar': Calendar,
    'activity': Activity,
    'dollar-sign': DollarSign,
    'file-text': FileText,
    'leaf': Leaf
  }

  // Parse APP_DOMAIN entities into modules
  const parseDomainEntity = (entity: any): DynamicModule => {
    const smartCodeParts = entity.smart_code?.split('.') || []
    let domainSlug = smartCodeParts[4]?.toLowerCase() || 'unknown'

    // Use metadata slug if available
    if (entity.metadata?.slug) {
      domainSlug = entity.metadata.slug
    } else if (entity.entity_code?.startsWith('NAV-DOM-')) {
      domainSlug = entity.entity_code.replace('NAV-DOM-', '').toLowerCase()
      if (domainSlug === 'inventorywh') domainSlug = 'inventory'
    }

    const section = domainSlug
    const workspace = ''

    // Extract metadata
    let metadata: any = {}
    try {
      if (entity.metadata) {
        metadata = typeof entity.metadata === 'string' ? JSON.parse(entity.metadata) : entity.metadata
      }
    } catch (e) {
      console.warn('Failed to parse metadata for', entity.entity_name, ':', entity.metadata, e)
    }

    // Icon and color mapping
    const getIconAndColor = (entityCode: string, entityName: string, metadata: any) => {
      const code = entityCode.toLowerCase()
      const name = entityName.toLowerCase()

      // Priority 1: Use metadata if available
      if (metadata.icon && metadata.color) {
        const colorMap: Record<string, string> = {
          '#F59E0B': 'bg-amber-600',
          '#f59e0b': 'bg-amber-600',
          '#EF4444': 'bg-red-600',
          '#ef4444': 'bg-red-600',
          '#10B981': 'bg-green-600',
          '#10b981': 'bg-green-600',
          '#3B82F6': 'bg-blue-600',
          '#3b82f6': 'bg-blue-600',
          '#8B5CF6': 'bg-purple-600',
          '#8b5cf6': 'bg-purple-600',
          '#EC4899': 'bg-pink-600',
          '#ec4899': 'bg-pink-600',
          '#6366F1': 'bg-indigo-600',
          '#6366f1': 'bg-indigo-600',
          '#14B8A6': 'bg-teal-600',
          '#14b8a6': 'bg-teal-600',
          '#F97316': 'bg-orange-600',
          '#f97316': 'bg-orange-600',
          '#0EA5E9': 'bg-sky-600',
          '#0ea5e9': 'bg-sky-600',
          '#64748B': 'bg-slate-600',
          '#64748b': 'bg-slate-600'
        }

        let bgColor = metadata.color
        if (typeof metadata.color === 'string' && metadata.color.startsWith('#')) {
          bgColor = colorMap[metadata.color] || `bg-${config.theme.primaryColor}`
        } else if (!metadata.color.startsWith('bg-')) {
          bgColor = `bg-${metadata.color}`
        }

        return {
          icon: iconMap[metadata.icon] || Package,
          bgColor: bgColor || `bg-${config.theme.primaryColor}`
        }
      }

      // Priority 2: Use config overrides if available
      if (config.domainIconOverrides && config.domainIconOverrides[code]) {
        return config.domainIconOverrides[code]
      }

      // Priority 3: Pattern matching fallback
      const patterns: Record<string, { icon: any; bgColor: string }> = {
        'inventory': { icon: Warehouse, bgColor: 'bg-teal-600' },
        'retail': { icon: Store, bgColor: 'bg-indigo-600' },
        'wholesale': { icon: Truck, bgColor: 'bg-slate-600' },
        'finance': { icon: Calculator, bgColor: 'bg-red-800' },
        'merchandis': { icon: Tag, bgColor: 'bg-amber-600' },
        'analytics': { icon: BarChart3, bgColor: 'bg-purple-600' },
        'admin': { icon: Settings, bgColor: 'bg-gray-600' },
        'crm': { icon: Users, bgColor: 'bg-pink-600' },
        'customer': { icon: Users, bgColor: 'bg-pink-600' },
        'planning': { icon: Calendar, bgColor: 'bg-cyan-600' },
        'procurement': { icon: Package, bgColor: 'bg-amber-600' },
        'processing': { icon: Factory, bgColor: 'bg-emerald-600' },
        'logistics': { icon: Truck, bgColor: 'bg-blue-600' },
        'sales': { icon: DollarSign, bgColor: 'bg-indigo-600' },
        'labour': { icon: Users, bgColor: 'bg-purple-600' },
        'labor': { icon: Users, bgColor: 'bg-purple-600' },
        'report': { icon: FileText, bgColor: 'bg-slate-600' },
        'dashboard': { icon: BarChart3, bgColor: 'bg-cyan-600' },
        'quality': { icon: CheckCircle, bgColor: 'bg-green-600' },
        'traceability': { icon: Leaf, bgColor: 'bg-rose-600' },
        'sustainability': { icon: Leaf, bgColor: 'bg-rose-600' }
      }

      for (const [key, value] of Object.entries(patterns)) {
        if (code.includes(key) || name.includes(key)) {
          return value
        }
      }

      // Default
      return { icon: Package, bgColor: `bg-${config.theme.primaryColor}` }
    }

    const { icon, bgColor } = getIconAndColor(entity.entity_code, entity.entity_name, metadata)

    return {
      id: entity.id,
      entity_id: entity.id,
      title: entity.entity_name,
      subtitle: metadata.subtitle || entity.entity_description || `${domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)} Management`,
      icon,
      bgColor,
      textColor: 'text-white',
      domain: config.appCode.toLowerCase(),
      section: domainSlug,
      workspace,
      roles: metadata.roles || ['Manager', 'Operator'],
      entity_code: entity.entity_code,
      smart_code: entity.smart_code
    }
  }

  // Process APP and APP_DOMAIN entities
  useEffect(() => {
    if (!appLoading && !domainsLoading && isAuthenticated) {
      console.log('🔍 Processing APP and APP_DOMAIN entities for', config.appCode)

      const app = appEntities?.find(app => app.entity_code === config.appCode)

      if (app) {
        console.log('✅ Found APP:', { id: app.id, name: app.entity_name, code: app.entity_code })

        const hasRelationships = app.relationships?.APP_HAS_DOMAIN

        if (hasRelationships && hasRelationships.length > 0) {
          const linkedDomainIds = hasRelationships.map((rel: any) => rel.to_entity_id)
          const filteredDomains = domainEntities?.filter(domain => linkedDomainIds.includes(domain.id)) || []
          const modules = filteredDomains
            .map(parseDomainEntity)
            .sort((a, b) => a.title.localeCompare(b.title))

          setDynamicModules(modules)
          console.log('✅ Loaded', modules.length, 'domains for', config.appName)
        } else {
          console.warn('⚠️ No APP_HAS_DOMAIN relationships for', config.appCode)
          setDynamicModules([])
        }
      } else {
        console.warn('❌ APP not found:', config.appCode)
        setDynamicModules([])
      }
    }
  }, [appLoading, domainsLoading, isAuthenticated, appEntities, domainEntities, config.appCode])

  // Handle chat submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const newUserMessage: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, newUserMessage])
    setChatInput('')

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: `I'm processing your request about ${config.appName} operations. This is a demo response. In production, I would analyze your data and provide specific insights.`
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  // Loading state
  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className={`h-8 w-8 animate-spin text-${config.theme.primaryColor} mx-auto mb-4`} />
          <p className="text-slate-600">Loading {config.appName} dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push(`/auth/login?app=${config.appCode.toLowerCase()}`)
    return null
  }

  // Show warning if no organization context
  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              No organization context found. Please contact your administrator.
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button onClick={logout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERA Fiori Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* HERA Logo and Navigation */}
            <div className="flex items-center gap-6">
              <div className={`${config.theme.logoBgClass} text-white px-3 py-1 rounded text-sm font-bold`}>
                HERA
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <span>Home</span>
                  <ArrowDown className="h-3 w-3" />
                </Button>

                <nav className="flex items-center gap-6 text-sm text-gray-600">
                  <span className={`text-${config.theme.primaryColor} font-medium underline`}>{config.appName} Dashboard</span>
                  {config.navItems.map((item, idx) => (
                    <span key={idx}>{item}</span>
                  ))}
                </nav>
              </div>
            </div>

            {/* Search and User */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-9 pr-4 py-1 border border-gray-300 rounded text-sm w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <User className="h-4 w-4 text-gray-500" />
                <span className={`${config.theme.logoBgClass} text-white text-xs px-2 py-1 rounded`}>
                  {config.appCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 2 Column Layout */}
      <div className="p-4 lg:p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Left Column - Main Content (75%) */}
            <div className="lg:col-span-3 space-y-6">

              {/* Business Domains Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className={`h-6 w-6 text-${config.theme.primaryColor}`} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Business Domains ({modulesLoading ? '...' : dynamicModules.length})
                  </h2>
                  <ArrowDown className="h-4 w-4 text-gray-500" />
                  {!modulesLoading && (
                    <Button variant="ghost" size="sm" onClick={fetchDynamicModules} className="ml-2">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Loading State */}
                {modulesLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-36"></div>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {modulesError && !modulesLoading && (
                  <Alert className="border-red-200 bg-red-50 mb-4">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {modulesError}. <Button variant="link" onClick={fetchDynamicModules} className="text-red-600 underline p-0 h-auto">Try again</Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Dynamic Modules Grid */}
                {!modulesLoading && dynamicModules.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {dynamicModules.map((module) => {
                      const Icon = module.icon
                      return (
                        <div
                          key={module.entity_id}
                          className={`${module.bgColor} ${module.textColor} rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md relative group`}
                          onClick={() => {
                            const route = `/${config.appCode.toLowerCase()}/domains/${module.section}`
                            console.log(`🎯 Navigating to: ${route}`)
                            router.push(route)
                          }}
                        >
                          <div className="p-5 h-36 flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                              <Icon className="h-7 w-7" />
                              <div className="text-xs opacity-75">
                                {module.roles.join(' • ')}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-base mb-1 leading-tight">{module.title}</h3>
                              <p className="text-sm opacity-90 leading-tight">{module.subtitle}</p>

                              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Badge variant="outline" className="text-xs bg-black/20 text-white border-white/30">
                                  {module.entity_code.split('-').pop()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!modulesLoading && dynamicModules.length === 0 && !modulesError && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center">
                    <div className="max-w-md mx-auto">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No Business Domains Found</h3>
                      <p className="text-gray-600 mb-6">
                        No APP_HAS_DOMAIN relationships found for {config.appName}. This dashboard reads domains linked via relationships.
                      </p>
                      <Button onClick={fetchDynamicModules} variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reload Domains
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Insights Tiles Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Key Performance Insights</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                  {config.insightsTiles.map((tile) => {
                    const TileIcon = iconComponents[tile.iconName] || Package
                    return (
                      <div key={tile.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                        <TileIcon className={`h-5 w-5 ${tile.iconColor} mb-2`} />
                        <h3 className="text-xs font-medium text-gray-600 mb-1">{tile.title}</h3>
                        <div className="text-lg font-bold text-gray-900">{tile.value}</div>
                        <p className={`text-xs ${tile.subtitleColor || 'text-gray-500'}`}>{tile.subtitle}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Insights Cards with Charts */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Analytics & Insights</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {config.insightsCards.map((card) => {
                    return (
                      <Card key={card.id}>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                          <CardDescription className="text-xs">{card.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {card.type === 'bar' && (
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart data={card.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={card.config?.xAxisKey || 'month'} style={{ fontSize: '10px' }} />
                                <YAxis style={{ fontSize: '10px' }} />
                                <Tooltip />
                                <Bar dataKey={card.config?.dataKeys?.[0] || 'value'} fill={card.config?.colors?.[0] || config.theme.accentColor} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}

                          {card.type === 'line' && (
                            <ResponsiveContainer width="100%" height={150}>
                              <LineChart data={card.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={card.config?.xAxisKey || 'month'} style={{ fontSize: '10px' }} />
                                <YAxis domain={card.config?.yAxisDomain} style={{ fontSize: '10px' }} />
                                <Tooltip />
                                <Line
                                  type="monotone"
                                  dataKey={card.config?.dataKeys?.[0] || 'value'}
                                  stroke={card.config?.colors?.[0] || config.theme.accentColor}
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}

                          {card.type === 'donut' && (
                            <ResponsiveContainer width="100%" height={150}>
                              <PieChart>
                                <Pie
                                  data={card.data}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={card.config?.innerRadius || 30}
                                  outerRadius={card.config?.outerRadius || 60}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={(entry) => `${entry.value}%`}
                                >
                                  {card.data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          )}

                          {card.type === 'table' && (
                            <div className="space-y-2">
                              {card.data.slice(0, 3).map((row: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                                  <div>
                                    <div className="font-medium text-gray-900">{row.farmer || row.entry}</div>
                                    <div className="text-gray-500">{row.date || row.field}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-gray-900">{row.amount || row.newValue}</div>
                                    {row.status && (
                                      <Badge variant={row.status === 'Paid' ? 'default' : 'secondary'} className="text-xs">
                                        {row.status}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Right Column - AI Assistant & News (25%) */}
            <div className="lg:col-span-1 space-y-6">

              {/* AI Assistant Chatbot */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className={`h-4 w-4 text-${config.theme.primaryColor}`} />
                    {config.appName} AI Assistant
                    <span className="ml-auto">
                      <span className={`inline-block w-2 h-2 bg-${config.theme.primaryColor} rounded-full animate-pulse`}></span>
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ask questions about your operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Chat Messages */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'assistant' && (
                            <div className={`w-6 h-6 rounded-full bg-${config.theme.primaryColor}/10 flex items-center justify-center flex-shrink-0`}>
                              <Shield className={`h-3 w-3 text-${config.theme.primaryColor}`} />
                            </div>
                          )}
                          <div
                            className={`text-xs p-2 rounded-lg max-w-[80%] ${
                              msg.role === 'user'
                                ? `bg-${config.theme.primaryColor} text-white`
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {msg.content}
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="h-3 w-3 text-blue-600" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className={`flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${config.theme.primaryColor}`}
                      />
                      <Button type="submit" size="sm" className={config.theme.logoBgClass}>
                        <Send className="h-3 w-3" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>

              {/* News Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Latest Updates</CardTitle>
                  <CardDescription className="text-xs">News & announcements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {config.newsItems.map((item) => {
                      if (item.type === 'featured') {
                        return (
                          <div key={item.id} className={`bg-gradient-to-br from-${config.theme.primaryColor} to-${config.theme.primaryColor}/80 rounded-lg p-4 text-white`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Leaf className="h-4 w-4" />
                              <span className="text-xs font-medium">FEATURED</span>
                            </div>
                            <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                            <p className="text-xs opacity-90 mb-2">{item.description}</p>
                            <div className="text-xs opacity-75">{item.timestamp}</div>
                          </div>
                        )
                      }

                      return (
                        <div key={item.id} className={`border-l-2 ${item.borderColor} pl-3`}>
                          <h4 className="text-xs font-medium text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          <div className="text-xs text-gray-400 mt-1">{item.timestamp}</div>
                        </div>
                      )
                    })}
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
