/**
 * Universal Section Overview Page - SAP Fiori Style
 * Smart Code: HERA.UNIVERSAL.SECTION.OVERVIEW.v1
 * 
 * Dynamic section page with SAP Fiori enterprise layout
 * Route: /[domain]/[section]
 * Examples: /retail/pos, /retail/merchandising, /wholesale/ordering, /finance/accounting
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useInstantRouter } from '@/components/performance/InstantRouter'
import { usePrefetch } from '@/lib/performance/PrefetchService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Minus,
  Home,
  Search,
  Bell,
  User,
  Loader2, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Package,
  DollarSign,
  Factory,
  Users,
  CreditCard,
  Tags,
  ShoppingCart,
  Book,
  Calculator,
  BarChart3,
  LayoutDashboard,
  Smartphone,
  Cog,
  Building2,
  Settings,
  Box,
  FileText,
  Store,
  Warehouse,
  Calendar,
  PieChart,
  Shield,
  Truck,
  ClipboardCheck,
  TrendingUp,
  Star,
  Mail,
  UserCheck,
  Activity,
  Receipt,
  MessageSquare,
  Eye,
  RefreshCw,
  Clock,
  Target,
  Zap,
  TruckIcon,
  Send,
  ClipboardList,
  Sprout,
  CheckCircle,
  FlaskConical,
  MapPin,
  Brain,
  PackageCheck,
  ArrowRightLeft,
  RotateCcw,
  Undo2,
  Edit
} from 'lucide-react'
import { resolveUniversalConfig, generateUniversalSmartCode, generateUniversalBreadcrumbs, UNIVERSAL_CONFIG } from '@/lib/universal/config'

// Icon mapping for dynamic icon rendering - comprehensive icon support
const iconMap = {
  'ShoppingBag': ShoppingBag,
  'Package': Package,
  'DollarSign': DollarSign,
  'Factory': Factory,
  'Users': Users,
  'CreditCard': CreditCard,
  'Tags': Tags,
  'ShoppingCart': ShoppingCart,
  'Book': Book,
  'Calculator': Calculator,
  'BarChart3': BarChart3,
  'LayoutDashboard': LayoutDashboard,
  'Smartphone': Smartphone,
  'Cog': Cog,
  'Building2': Building2,
  'layout-dashboard': LayoutDashboard,
  'credit-card': CreditCard,
  'panel-top': BarChart3,
  'file-text': FileText,
  'box': Box,
  'tags': Tags,
  'boxes': Warehouse,
  'clipboard-list': Settings,
  'line-chart': BarChart3,
  'refresh-cw': Settings,
  'pie-chart': PieChart,
  'scroll-text': FileText,
  'user-circle-2': Users,
  'sparkles': Settings,
  'area-chart': BarChart3,
  'bar-chart-3': BarChart3,
  'shield': Shield,
  'settings': Settings,
  'shopping-cart': ShoppingCart,
  'calculator': Calculator,
  'truck': Truck,
  'clipboard-check': ClipboardCheck,
  'package': Package,
  'trending-up': TrendingUp,
  'users': Users,
  'star': Star,
  'mail': Mail,
  'user-check': UserCheck,
  'activity': Activity,
  'dollar-sign': DollarSign,
  'receipt': Receipt,
  'Calendar': Calendar,
  'Building2': Building2,
  'Target': Target,
  'Clock': Clock,
  'Zap': Zap,
  'TruckIcon': TruckIcon,
  'Send': Send,
  'ClipboardList': ClipboardList,
  'Sprout': Sprout,
  'CheckCircle': CheckCircle,
  'FlaskConical': FlaskConical,
  'MapPin': MapPin,
  'Brain': Brain,
  'PackageCheck': PackageCheck,
  'ArrowDown': ArrowDown,
  'ArrowRightLeft': ArrowRightLeft,
  'RotateCcw': RotateCcw,
  'Undo2': Undo2,
  'Edit': Edit
}

export default function UniversalSectionPage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  
  // Performance optimizations - call hooks unconditionally
  const { navigate, prefetchOnHover } = useInstantRouter()
  const { getCachedOrFetch, preloadRoutes } = usePrefetch()
  
  const domain = params.domain as string
  const section = params.section as string
  
  const [tilesError, setTilesError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')

  // Resolve universal configuration - always call
  const config = resolveUniversalConfig(domain, section)

  // Handle auth states first
  if (!isAuthenticated) {
    return <Alert><AlertDescription>Please log in</AlertDescription></Alert>
  }
  
  if (contextLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }
  
  if (!organization?.id) {
    return <Alert><AlertDescription>No organization context</AlertDescription></Alert>
  }
  
  if (!config.domain) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Domain "{domain}" not found. Available domains: {UNIVERSAL_CONFIG.domains.map(d => d.name).join(', ')}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 text-center">
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!config.section) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Section "{section}" not found in domain "{domain}". Available sections: {UNIVERSAL_CONFIG.sections.filter(s => s.domains.includes(domain)).map(s => s.name).join(', ')}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 text-center">
            <Button onClick={() => router.push(`/${domain}`)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {config.domain.name}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Get workspaces for this section
  const availableWorkspaces = UNIVERSAL_CONFIG.workspaces.filter(w => 
    w.sections.includes(section) && w.domains.includes(domain)
  )

  const handleWorkspaceClick = (workspaceId: string) => {
    navigate(`/${domain}/${section}/${workspaceId}`)
  }

  const handleBackClick = () => {
    router.back()
  }

  // Generate section-specific news content
  const generateNewsItems = () => {
    const newsMap: { [key: string]: any[] } = {
      'pos': [
        {
          id: 1,
          title: `HERA ${section.toUpperCase()} 2025.4 Introduces AI-Powered Transactions`,
          content: "New machine learning algorithms optimize transaction processing and provide intelligent recommendations...",
          time: "2 wk. ago",
        },
        {
          id: 2,
          title: "Enhanced Mobile Interface",
          content: "Updated mobile interface with faster processing and improved user experience.",
          time: "1 wk. ago"
        }
      ],
      'merchandising': [
        {
          id: 1,
          title: `HERA Merchandising 2025.4 Introduces Intelligent Product Planning`,
          content: "AI-powered merchandising algorithms analyze market trends and customer behavior...",
          time: "1 wk. ago",
        },
        {
          id: 2,
          title: "Visual Merchandising Tools",
          content: "New drag-and-drop planogram tools with 3D visualization capabilities.",
          time: "3 days ago"
        }
      ]
    }
    
    return newsMap[section] || [
      {
        id: 1,
        title: `HERA ${config.section?.name || 'Section'} 2025.4 Platform Updates`,
        content: "Latest enhancements and new features now available with improved performance and user experience.",
        time: "1 wk. ago"
      }
    ]
  }

  // Generate section-specific apps data  
  const generateAppsData = () => {
    return {
      favorites: availableWorkspaces.slice(0, 4).map(workspace => ({
        icon: iconMap[workspace.icon.name as keyof typeof iconMap] || Box,
        title: workspace.name,
        subtitle: workspace.description,
        href: `/${domain}/${section}/${workspace.id}`
      })),
      mostUsed: availableWorkspaces.slice(0, 4).map(workspace => ({
        icon: iconMap[workspace.icon.name as keyof typeof iconMap] || Box,
        title: `${workspace.name} Reports`,
        subtitle: `${workspace.description} analytics`,
        href: `/${domain}/${section}/${workspace.id}/reports`
      })),
      recentlyUsed: availableWorkspaces.slice(0, 4).map(workspace => ({
        icon: iconMap[workspace.icon.name as keyof typeof iconMap] || Box,
        title: `${workspace.name} Settings`,
        subtitle: `Configure ${workspace.description.toLowerCase()}`,
        href: `/${domain}/${section}/${workspace.id}/settings`
      })),
      recommended: availableWorkspaces.slice(0, 4).map(workspace => ({
        icon: iconMap[workspace.icon.name as keyof typeof iconMap] || Box,
        title: `AI ${workspace.name}`,
        subtitle: `Intelligent ${workspace.description.toLowerCase()}`,
        href: `/${domain}/${section}/${workspace.id}/ai`
      }))
    }
  }

  // Generate section-specific insights tiles
  const generateInsightsTiles = () => {
    const insightsMap: { [key: string]: any[] } = {
      'pos': [
        {
          id: 'pos-sales',
          title: 'Daily Sales',
          value: '₹18.4',
          unit: 'K',
          description: 'Today\'s revenue',
          trend: 'up',
          change: '+12%',
          color: 'border-green-500'
        },
        {
          id: 'pos-transactions',
          title: 'Transactions',
          value: '247',
          description: 'Processed today',
          trend: 'up', 
          change: '+8%',
          color: 'border-blue-500'
        }
      ],
      'merchandising': [
        {
          id: 'merch-products',
          title: 'Products Live',
          value: '1,247',
          description: 'Active catalog',
          trend: 'up',
          change: '+15%',
          color: 'border-green-500'
        },
        {
          id: 'merch-categories',
          title: 'Categories',
          value: '42',
          description: 'Product lines',
          trend: 'up',
          change: '+3%',
          color: 'border-blue-500'
        }
      ]
    }

    return insightsMap[section] || [
      {
        id: 'default-metric',
        title: `${config.section?.name || 'Section'} Status`,
        value: '98.5',
        unit: '%',
        description: 'System health',
        trend: 'up',
        change: '+1.2%',
        color: 'border-green-500'
      }
    ]
  }

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

  // Get dynamic data
  const newsItems = generateNewsItems()
  const appsData = generateAppsData()
  const insightsTiles = generateInsightsTiles()

  // Show error state
  if (tilesError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {tilesError}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 text-center">
            <Button onClick={handleBackClick} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SAP S/4HANA Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* HERA Logo and Navigation */}
            <div className="flex items-center gap-6">
              <div className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-bold">
                HERA
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackClick}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Back</span>
                </Button>
                
                <nav className="flex items-center gap-6 text-sm text-gray-600">
                  <span 
                    className="text-indigo-600 font-medium underline cursor-pointer"
                    onClick={() => router.push(`/${domain}/dashboard`)}
                  >
                    My Home
                  </span>
                  <span className="font-medium" style={{ color: config.domain.color }}>
                    {config.domain.name}
                  </span>
                  <span className="font-medium" style={{ color: config.section?.color || '#6366f1' }}>
                    {config.section?.name || 'Section'}
                  </span>
                </nav>
              </div>
            </div>

            {/* Search and User */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <select className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">
                  <option>All</option>
                </select>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1 border border-gray-300 rounded text-sm w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <User className="h-4 w-4 text-gray-500" />
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">HR</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
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
                <h2 className="text-lg font-semibold text-gray-900">{config.section?.name || 'Section'} Workspaces ({availableWorkspaces.length})</h2>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              
              {availableWorkspaces.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Box className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces configured</h3>
                  <p className="text-gray-600">
                    This section doesn't have any workspaces configured yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {availableWorkspaces.map((workspace) => {
                    const Icon = iconMap[workspace.icon.name as keyof typeof iconMap] || Settings
                    return (
                      <Card 
                        key={workspace.id} 
                        className={`text-white border-0 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer`}
                        style={{ backgroundColor: workspace.color }}
                        onClick={() => handleWorkspaceClick(workspace.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Icon className="w-6 h-6" />
                            <Eye className="w-4 h-4 opacity-75" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{workspace.name}</h3>
                          <p className="text-sm opacity-90 mb-2">{workspace.description}</p>
                          {workspace.personaLabel && (
                            <Badge variant="secondary" className="text-xs bg-white/20">
                              {workspace.personaLabel}
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
                            onClick={() => navigate(app.href)}
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
                <h2 className="text-lg font-semibold text-gray-900">Insights Tiles ({insightsTiles.length})</h2>
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
                      <p className="font-medium mb-2">Here's what I've found:</p>
                      
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                          <h4 className="font-medium text-sm mb-1">{config.section?.name || 'Section'} Overview</h4>
                          <p className="text-xs text-gray-600 mb-1">
                            {availableWorkspaces.length} workspaces available in {config.section?.description?.toLowerCase() || 'this section'}
                          </p>
                          <div className="space-y-1 text-xs">
                            <div>Active Workspaces: {availableWorkspaces.length}</div>
                            <div>Organization: {organization?.name}</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                          <h4 className="font-medium text-sm mb-1">Quick Actions</h4>
                          <div className="space-y-1 text-xs text-gray-600">
                            {availableWorkspaces.slice(0, 2).map(workspace => (
                              <div key={workspace.id} 
                                   className="cursor-pointer hover:text-violet-600"
                                   onClick={() => handleWorkspaceClick(workspace.id)}>
                                → {workspace.name}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                          <h4 className="font-medium text-sm mb-1">Performance</h4>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div>System Status: ✅ Online</div>
                            <div>Response Time: 120ms</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <Input 
                          placeholder={`Ask about ${config.section?.name?.toLowerCase() || 'this section'}...`}
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
  )
}