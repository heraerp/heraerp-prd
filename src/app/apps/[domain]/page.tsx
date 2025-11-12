/**
 * Universal Second Layer Page - Enterprise Finance Layout Template
 * Smart Code: HERA.PLATFORM.NAV.UNIVERSAL_SECOND_LAYER.v1
 * 
 * SAP S/4HANA style enterprise layout with three-column design:
 * News | Dynamic Tiles | HERA Assistant
 * Used as standard template for all retail domain second layers
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useInstantRouter, InstantLink } from '@/components/performance/InstantRouter'
import { usePrefetch } from '@/lib/performance/PrefetchService'
import { ThreeColumnLayoutSkeleton, ProgressiveSkeleton } from '@/components/performance/SkeletonComponents'
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
  Grid3X3,
  Settings,
  Box,
  FileText,
  Store,
  BarChart3,
  CreditCard,
  Users,
  Tag,
  Warehouse,
  Calendar,
  Calculator,
  PieChart,
  Shield,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  Package,
  TrendingUp,
  Star,
  Mail,
  UserCheck,
  Activity,
  DollarSign,
  Receipt,
  MessageSquare,
  Eye,
  RefreshCw,
  Clock,
  Target,
  Zap
} from 'lucide-react'
// Icon mapping for dynamic rendering - comprehensive icon support
const iconMap = {
  'layout-dashboard': Grid3X3,
  'credit-card': CreditCard,
  'panel-top': BarChart3,
  'file-text': FileText,
  'box': Box,
  'tags': Tag,
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
  'receipt': Receipt
}

interface AppSection {
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

interface AppDomain {
  id: string
  entity_name: string
  entity_code: string
  slug: string
  subtitle: string
  color: string
}

export default function UniversalSecondLayerPage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization, isAuthenticated, isLoading, contextLoading } = useHERAAuth()
  
  const [domain, setDomain] = useState<AppDomain | null>(null)
  const [sections, setSections] = useState<AppSection[]>([])
  const [dynamicTilesLoading, setDynamicTilesLoading] = useState(true)
  const [tilesError, setTilesError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Performance optimizations
  const { navigate, prefetchOnHover } = useInstantRouter()
  const { getCachedOrFetch, preloadRoutes } = usePrefetch()
  
  const domainSlug = params.domain as string

  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      loadDomainAndSections()
    }
  }, [isAuthenticated, organization?.id, domainSlug])

  const loadDomainAndSections = async () => {
    try {
      setDynamicTilesLoading(true)
      setTilesError(null)
      
      console.log('🔍 Loading domain and sections via API for:', domainSlug)

      const apiUrl = `/api/v2/platform/navigation/${domainSlug}`
      
      // Try cache-first for instant loading
      try {
        const cachedData = await getCachedOrFetch(apiUrl)
        if (cachedData) {
          console.log('⚡ Using cached data for instant domain load')
          setDomain(cachedData.domain)
          setSections(cachedData.sections.sort((a: AppSection, b: AppSection) => a.order - b.order))
          setDynamicTilesLoading(false)
          return
        }
      } catch (cacheError) {
        console.warn('Cache failed, falling back to network:', cacheError)
      }

      // Fallback to direct fetch
      const response = await fetch(apiUrl, {
        headers: {
          'X-Cache-Control': 'max-age=300', // 5 minutes
          'X-Prefetch': 'true'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const { domain: domainInfo, sections: processedSections } = await response.json()

      console.log('✅ API: Received fresh domain data:', domainInfo)

      setDomain(domainInfo)
      setSections(processedSections.sort((a: AppSection, b: AppSection) => a.order - b.order))

      // Prefetch section workspace data in background
      if (processedSections.length > 0) {
        const workspaceUrls = processedSections
          .slice(0, 3) // Top 3 sections
          .map(section => section.route)
          .filter(route => route.startsWith('/apps/'))
        
        preloadRoutes(workspaceUrls)
        console.log('🚀 Preloading workspace routes in background:', workspaceUrls)
      }

    } catch (err) {
      console.error('Error loading domain and sections:', err)
      setTilesError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setDynamicTilesLoading(false)
    }
  }

  const handleSectionClick = (section: AppSection) => {
    if (section.route) {
      // Use instant navigation for better performance
      navigate(section.route, {
        sectionName: section.entity_name,
        sectionData: section
      })
    } else {
      alert(`${section.entity_name} coming soon!\nRoute: ${section.route}\nRoles: ${section.visible_roles.join(', ')}`)
    }
  }

  const handleBackClick = () => {
    router.back()
  }

  // Generate domain-specific news content
  const generateNewsItems = () => {
    const newsMap: { [key: string]: any[] } = {
      retail: [
        {
          id: 1,
          title: "HERA Retail 2025.4 Introduces AI-Powered Customer Insights",
          content: "New machine learning algorithms analyze customer behavior patterns and provide personalized recommendations, increasing conversion rates by up to 23%...",
          time: "2 wk. ago",
          image: "/api/placeholder/400/200"
        },
        {
          id: 2,
          title: "Mobile POS Enhancement Goes Live",
          content: "Updated mobile point-of-sale interface with faster checkout and improved customer experience, reducing transaction time by 40%.",
          time: "1 wk. ago"
        },
        {
          id: 3,
          title: "Inventory Optimization Algorithm",
          content: "Real-time inventory tracking and automated reordering now available, reducing stockouts by 60% and overstock by 35%.",
          time: "4 days ago"
        }
      ],
      wholesale: [
        {
          id: 1,
          title: "HERA Wholesale 2025.4 Introduces Bulk Order Intelligence",
          content: "AI-powered bulk ordering optimization reduces logistics costs by up to 30% through intelligent routing and consolidation...",
          time: "1 wk. ago"
        },
        {
          id: 2,
          title: "B2B Portal Enhancement",
          content: "New self-service portal for wholesale customers with real-time pricing and inventory visibility.",
          time: "3 days ago"
        }
      ],
      finance: [
        {
          id: 1,
          title: "HERA Finance 2025.4 Introduces AI-Powered Cash Flow Forecasting",
          content: "New predictive analytics capabilities help finance teams anticipate cash flow needs with 95% accuracy...",
          time: "1 wk. ago"
        },
        {
          id: 2,
          title: "Automated Compliance Reporting",
          content: "Real-time regulatory reporting now available across 45+ countries with automated document exchange.",
          time: "3 days ago"
        }
      ]
    }
    
    return newsMap[domainSlug] || [
      {
        id: 1,
        title: `HERA ${domain?.entity_name} 2025.4 Platform Updates`,
        content: "Latest enhancements and new features now available with improved performance and user experience.",
        time: "1 wk. ago"
      }
    ]
  }

  // Generate domain-specific apps data  
  const generateAppsData = () => {
    return {
      favorites: sections.slice(0, 4).map(section => ({
        icon: iconMap[section.icon] || Box,
        title: section.entity_name,
        subtitle: section.subtitle,
        href: section.route
      })),
      mostUsed: sections.slice(0, 4).map(section => ({
        icon: iconMap[section.icon] || Box,
        title: `${section.entity_name} Reports`,
        subtitle: `${section.subtitle} analytics`,
        href: `${section.route}/reports`
      })),
      recentlyUsed: sections.slice(0, 4).map(section => ({
        icon: iconMap[section.icon] || Box,
        title: `${section.entity_name} Settings`,
        subtitle: `Configure ${section.subtitle.toLowerCase()}`,
        href: `${section.route}/settings`
      })),
      recommended: sections.slice(0, 4).map(section => ({
        icon: iconMap[section.icon] || Box,
        title: `AI ${section.entity_name}`,
        subtitle: `Intelligent ${section.subtitle.toLowerCase()}`,
        href: `${section.route}/ai`
      }))
    }
  }

  // Generate domain-specific insights tiles
  const generateInsightsTiles = () => {
    if (!domain) return []
    
    const insightsMap: { [key: string]: any[] } = {
      retail: [
        {
          id: 'retail-sales',
          title: 'Daily Sales',
          value: '₹18.4',
          unit: 'K',
          description: 'Today\'s revenue',
          trend: 'up',
          change: '+12%',
          color: 'border-green-500'
        },
        {
          id: 'retail-customers',
          title: 'Customer Traffic',
          value: '247',
          description: 'Visitors today',
          trend: 'up', 
          change: '+8%',
          color: 'border-blue-500'
        },
        {
          id: 'retail-inventory',
          title: 'Stock Level',
          value: '94.2',
          unit: '%',
          description: 'Items in stock',
          trend: 'up',
          change: '+2.1%',
          color: 'border-orange-500'
        },
        {
          id: 'retail-pos',
          title: 'Average Transaction',
          value: '₹74',
          description: 'Per customer',
          trend: 'up',
          change: '+5%',
          color: 'border-purple-500'
        }
      ],
      finance: [
        {
          id: 'finance-cash',
          title: 'Cash Position',
          value: '₹18.9',
          unit: 'M',
          description: 'Available cash',
          trend: 'up',
          change: '+5.2%',
          color: 'border-green-500'
        }
      ]
    }

    return insightsMap[domainSlug] || [
      {
        id: 'default-metric',
        title: `${domain.entity_name} Status`,
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

  // Show loading state
  if (isLoading || contextLoading || dynamicTilesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading {domainSlug} modules...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/retail/login')
    return null
  }

  // Show error state
  if (tilesError || !domain) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {tilesError || `Domain "${domainSlug}" not found`}
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
    <ProgressiveSkeleton 
      isLoading={isLoading || contextLoading || dynamicTilesLoading}
      skeleton={<ThreeColumnLayoutSkeleton />}
    >
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
                    onClick={() => router.push('/retail/dashboard')}
                  >
                    My Home
                  </span>
                  <span className="font-medium" style={{ color: domain.color }}>
                    {domain.entity_name}
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
                <h2 className="text-lg font-semibold text-gray-900">{domain.entity_name} Modules ({sections.length})</h2>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              
              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Box className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No modules configured</h3>
                  <p className="text-gray-600">
                    This domain doesn't have any modules configured yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {sections.map((section) => {
                    const Icon = iconMap[section.icon] || Settings
                    return (
                      <Card 
                        key={section.id} 
                        className={`text-white border-0 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer`}
                        style={{ backgroundColor: section.color }}
                        onClick={() => handleSectionClick(section)}
                        onMouseEnter={() => prefetchOnHover(section.route)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Icon className="w-6 h-6" />
                            <Eye className="w-4 h-4 opacity-75" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{section.entity_name}</h3>
                          <p className="text-sm opacity-90 mb-2">{section.subtitle}</p>
                          {section.persona_label && (
                            <Badge variant="secondary" className="text-xs bg-white/20">
                              {section.persona_label}
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
                          <h4 className="font-medium text-sm mb-1">{domain.entity_name} Overview</h4>
                          <p className="text-xs text-gray-600 mb-1">
                            {sections.length} modules available in {domain.subtitle?.toLowerCase()}
                          </p>
                          <div className="space-y-1 text-xs">
                            <div>Active Modules: {sections.length}</div>
                            <div>Organization: {organization?.name}</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                          <h4 className="font-medium text-sm mb-1">Quick Actions</h4>
                          <div className="space-y-1 text-xs text-gray-600">
                            {sections.slice(0, 2).map(section => (
                              <div key={section.id} 
                                   className="cursor-pointer hover:text-violet-600"
                                   onClick={() => handleSectionClick(section)}>
                                → {section.entity_name}
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
                          placeholder={`Ask about ${domain.entity_name?.toLowerCase()}...`}
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
    </ProgressiveSkeleton>
  )
}