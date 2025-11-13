/**
 * Universal Workspace Component
 * Smart Code: HERA.UNIVERSAL.WORKSPACE.v1
 *
 * Fully dynamic workspace interface that works with ANY app (retail, agro, central, etc.)
 * Database-driven configuration with SAP Fiori design
 *
 * Route Pattern: /[app]/domains/[domain]/sections/[section]/workspaces/[workspace]
 * Example: /retail/domains/analytics/sections/fin/workspaces/main
 *          /agro/domains/farm/sections/crops/workspaces/main
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useInstantRouter } from '@/components/performance/InstantRouter'
import { usePrefetch } from '@/lib/performance/PrefetchService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Home,
  Search,
  Bell,
  User,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Settings,
  Box,
  FileText,
  BarChart3,
  CreditCard,
  Users,
  Activity,
  ShoppingCart,
  PlusCircle,
  UserCircle2,
  Tags,
  Receipt,
  RotateCcw,
  Percent,
  Grid3x3,
  ClipboardCheck,
  Clock,
  Calculator,
  TrendingUp,
  TrendingDown,
  Circle,
  RefreshCw,
  Star,
  StarOff,
  Package,
  Building2,
  Warehouse,
  Tag,
  Calendar,
  Database,
  GitBranch,
  UserCircle,
  Link
} from 'lucide-react'

// Icon mapping for workspace cards
const iconMap: Record<string, any> = {
  'Activity': Activity,
  'ShoppingCart': ShoppingCart,
  'BarChart3': BarChart3,
  'Calculator': Calculator,
  'Box': Box,
  'PlusCircle': PlusCircle,
  'UserCircle2': UserCircle2,
  'Tags': Tags,
  'Receipt': Receipt,
  'RotateCcw': RotateCcw,
  'CreditCard': CreditCard,
  'Percent': Percent,
  'Grid3x3': Grid3x3,
  'Users': Users,
  'ClipboardCheck': ClipboardCheck,
  'Clock': Clock,
  'Settings': Settings,
  'Package': Package,
  'Building2': Building2,
  'Warehouse': Warehouse,
  'Tag': Tag,
  'Calendar': Calendar,
  'Database': Database,
  'GitBranch': GitBranch,
  'UserCircle': UserCircle,
  'Link': Link,
  'FileText': FileText
}

interface WorkspaceCard {
  label: string
  subtitle: string
  icon: string
  view_slug: string
  target_type: string
  template_code?: string
  entity_type?: string
  default_mode?: string
  metrics?: {
    value: string | number
    unit?: string
    trend?: 'up' | 'down' | 'neutral'
    change?: string
    label?: string
  }
  status?: 'active' | 'warning' | 'error' | 'disabled'
  priority?: 'high' | 'medium' | 'low'
  lastUpdated?: string
}

interface WorkspaceSection {
  nav_code: string
  title: string
  cards: WorkspaceCard[]
}

interface NavItem {
  code: string
  label: string
}

interface LayoutConfig {
  default_nav_code: string
  nav_items: NavItem[]
  sections: WorkspaceSection[]
}

interface Workspace {
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
}

interface WorkspaceData {
  workspace: Workspace
  layout_config: LayoutConfig
}

interface UniversalWorkspaceProps {
  app: string          // NEW: app name (retail, agro, central, etc.)
  domain: string
  section: string
  workspace?: string
}

export default function UniversalWorkspace({
  app,
  domain,
  section,
  workspace = 'main'
}: UniversalWorkspaceProps) {
  const router = useRouter()
  const { user, organization, isAuthenticated, isLoading, contextLoading } = useHERAAuth()

  // Performance optimizations
  const { navigate, prefetchOnHover } = useInstantRouter()
  const { getCachedOrFetch, preloadRoutes } = usePrefetch()

  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeNavCode, setActiveNavCode] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Enhanced state for enterprise features
  const [favoriteCards, setFavoriteCards] = useState<Set<string>>(new Set())
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'info' | 'warning'}>>([])
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())

  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      loadWorkspaceData()
    }
  }, [isAuthenticated, organization?.id, app, domain, section, workspace])

  const loadWorkspaceData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Loading universal workspace data for:', { app, domain, section, workspace })

      // Use app-agnostic API endpoint
      const apiUrl = `/api/v2/workspace/${app}/${domain}/${section}/${workspace}`

      // Try cache-first for instant loading
      try {
        const cachedData = await getCachedOrFetch(apiUrl)
        if (cachedData && !isRefreshing) {
          console.log('⚡ Using cached data for instant workspace load')
          setWorkspaceData(cachedData)
          setActiveNavCode(cachedData.layout_config.default_nav_code)
          setLastRefreshTime(new Date())
          setLoading(false)
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

      const data: WorkspaceData = await response.json()

      console.log('✅ API: Received fresh workspace data:', data)

      setWorkspaceData(data)
      setActiveNavCode(data.layout_config.default_nav_code)
      setLastRefreshTime(new Date())

      // Preload related workspace routes in background
      if (data.workspace) {
        const relatedRoutes = [
          `/${app}/domains/${domain}`,
          `/${app}/dashboard`
        ]
        preloadRoutes(relatedRoutes)
        console.log('🚀 Preloading related workspace routes in background')
      }

    } catch (err) {
      console.error('Error loading workspace data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (card: WorkspaceCard) => {
    // Update recently used
    setRecentlyUsed(prev => {
      const updated = [card.view_slug, ...prev.filter(slug => slug !== card.view_slug)].slice(0, 5)
      return updated
    })

    // Add enterprise notification
    addNotification(`Opening ${card.label}`, 'info')

    // Route to appropriate dynamic page based on target_type
    // NOW FULLY APP-AGNOSTIC
    let targetRoute = ''

    switch (card.target_type) {
      case 'entity':
      case 'entities':
        const entityType = card.entity_type || card.view_slug
        targetRoute = `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}/entities/${entityType}`
        break

      case 'transaction':
      case 'transactions':
        const transactionType = card.view_slug.includes('transaction') ?
          card.view_slug.replace('-transaction', '') : card.view_slug
        targetRoute = `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}/transactions/${transactionType}`
        break

      case 'workflow':
      case 'workflows':
        targetRoute = `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}/workflows/${card.view_slug}`
        break

      case 'relationship':
      case 'relationships':
        targetRoute = `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}/relationships/${card.view_slug}`
        break

      case 'analytics':
        targetRoute = `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}/analytics/${card.view_slug}`
        break

      case 'report':
      case 'reports':
        targetRoute = `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}/reports/${card.view_slug}`
        break

      default:
        // Legacy routing for custom views
        if (card.view_slug.includes('entities') || card.view_slug.includes('entity')) {
          const entityType = card.view_slug.replace(/entities?[-_]?/, '') || 'items'
          targetRoute = `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}/entities/${entityType}`
        } else if (card.view_slug.includes('transaction') || card.view_slug.includes('txn')) {
          const transactionType = card.view_slug.replace(/transactions?[-_]?/, '') || 'general'
          targetRoute = `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}/transactions/${transactionType}`
        } else {
          alert(`${card.label}\n\nTarget: ${card.target_type}\nApp: ${app}\nRoute: ${targetRoute}\n\nThis card type will be routed when implemented.`)
          return
        }
    }

    if (targetRoute) {
      console.log(`🎯 Routing to dynamic page: ${targetRoute}`)
      navigate(targetRoute)
    }
  }

  const toggleFavorite = (cardSlug: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavoriteCards(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(cardSlug)) {
        newFavorites.delete(cardSlug)
      } else {
        newFavorites.add(cardSlug)
      }
      return newFavorites
    })
  }

  const addNotification = (message: string, type: 'success' | 'info' | 'warning') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  const refreshWorkspace = async () => {
    setIsRefreshing(true)
    addNotification('Refreshing workspace data...', 'info')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      await loadWorkspaceData()
      setLastRefreshTime(new Date())
      addNotification('Workspace updated successfully', 'success')
    } catch (error) {
      addNotification('Failed to refresh workspace', 'warning')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'disabled': return 'bg-gray-400'
      default: return 'bg-gray-300'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />
      default: return <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
    }
  }

  const getPriorityBorder = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500'
      case 'medium': return 'border-l-4 border-l-yellow-500'
      case 'low': return 'border-l-4 border-l-green-500'
      default: return 'border-l-4 border-l-gray-300'
    }
  }

  const handleBackClick = () => {
    router.push(`/${app}/domains/${domain}`)
  }

  const currentSection = workspaceData?.layout_config.sections.find(
    section => section.nav_code === activeNavCode
  )

  const getFilteredCards = () => {
    if (!currentSection) return []

    return currentSection.cards.filter(card => {
      return searchQuery === '' ||
        card.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }

  const filteredCards = getFilteredCards()

  // Show loading state
  if (isLoading || contextLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading {app} workspace...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !workspaceData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error || `Workspace "${app}/${domain}/${section}/${workspace}" not found`}
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

  const { workspace: workspaceInfo, layout_config } = workspaceData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enterprise Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-2 rounded-lg shadow-lg border flex items-center gap-2 min-w-[300px] animate-in slide-in-from-right duration-300 ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : notification.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {notification.type === 'success' && <Circle className="h-4 w-4 fill-green-600 text-green-600" />}
              {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
              {notification.type === 'info' && <RefreshCw className="h-4 w-4 text-blue-600" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* SAP Header */}
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
                    onClick={() => navigate(`/${app}/dashboard`)}
                  >
                    My Home
                  </span>
                  <span
                    className="font-medium cursor-pointer hover:text-indigo-600"
                    onClick={() => navigate(`/${app}/domains/${domain}`)}
                    onMouseEnter={() => prefetchOnHover(`/${app}/domains/${domain}`)}
                  >
                    {domain.charAt(0).toUpperCase() + domain.slice(1)}
                  </span>
                  <span className="font-medium" style={{ color: workspaceInfo.color }}>
                    {workspaceInfo.entity_name}
                  </span>
                </nav>
              </div>
            </div>

            {/* Search and User */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <select className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">
                  <option>{app.charAt(0).toUpperCase() + app.slice(1)} Apps</option>
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search in: ${app} Apps`}
                  className="pl-9 pr-4 py-1 border border-gray-300 rounded text-sm w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <User className="h-4 w-4 text-gray-500" />
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: workspaceInfo.color }}
              >
                <Grid3x3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{workspaceInfo.entity_name}</h2>
                <p className="text-xs text-gray-600">{workspaceInfo.subtitle}</p>
              </div>
            </div>
            {workspaceInfo.persona_label && (
              <Badge variant="secondary" className="text-xs mt-2">
                {workspaceInfo.persona_label}
              </Badge>
            )}
          </div>

          <div className="p-2">
            <nav className="space-y-1">
              {layout_config.nav_items.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setActiveNavCode(item.code)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeNavCode === item.code
                      ? 'bg-indigo-50 text-indigo-700 font-medium border-l-2 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Content Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">{currentSection?.title}</h1>
                    {isRefreshing && (
                      <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {filteredCards.length} items available
                    {recentlyUsed.length > 0 && (
                      <span className="ml-2">• {recentlyUsed.length} recently used</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Filter cards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshWorkspace}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="p-6">
            {filteredCards.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Box className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cards found</h3>
                <p className="text-gray-600">
                  {searchQuery ? `No cards match "${searchQuery}"` : 'No cards configured for this section'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCards.map((card) => {
                  const Icon = iconMap[card.icon] || Box
                  const isFavorite = favoriteCards.has(card.view_slug)
                  const isHovered = hoveredCard === card.view_slug
                  const isRecentlyUsed = recentlyUsed.includes(card.view_slug)

                  return (
                    <Card
                      key={card.view_slug}
                      className={`cursor-pointer group relative transition-all duration-200 border-0 shadow-md bg-white h-56
                        ${getPriorityBorder(card.priority)}
                        ${isHovered ? 'shadow-xl scale-105 ring-2 ring-indigo-200' : 'hover:shadow-lg hover:scale-102'}
                        ${isRecentlyUsed ? 'ring-1 ring-blue-200' : ''}
                      `}
                      onClick={() => handleCardClick(card)}
                      onMouseEnter={() => setHoveredCard(card.view_slug)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      {/* Status Indicator */}
                      {card.status && (
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(card.status)}`}></div>
                        </div>
                      )}

                      {/* Favorite Star */}
                      <button
                        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        onClick={(e) => toggleFavorite(card.view_slug, e)}
                      >
                        {isFavorite ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                        )}
                      </button>

                      <CardContent className="p-6 h-56 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-200
                              ${isHovered ? 'bg-indigo-600' : 'bg-indigo-50'}
                            `}>
                              <Icon className={`h-6 w-6 transition-colors duration-200
                                ${isHovered ? 'text-white' : 'text-indigo-600'}
                              `} />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="text-xs">
                                {card.target_type.replace('_', ' ')}
                              </Badge>
                              {card.priority && (
                                <Badge
                                  variant={card.priority === 'high' ? 'destructive' : card.priority === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {card.priority}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-2 leading-tight">
                            {card.label}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            {card.subtitle}
                          </p>

                          {/* Metrics Display */}
                          {card.metrics && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-gray-900">
                                      {card.metrics.value}
                                    </span>
                                    {card.metrics.unit && (
                                      <span className="text-xs text-gray-500">{card.metrics.unit}</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600">{card.metrics.label}</div>
                                </div>
                                {card.metrics.trend && card.metrics.change && (
                                  <div className="flex items-center gap-1">
                                    {getTrendIcon(card.metrics.trend)}
                                    <span className={`text-xs font-medium
                                      ${card.metrics.trend === 'up' ? 'text-green-600' :
                                        card.metrics.trend === 'down' ? 'text-red-600' : 'text-gray-600'}
                                    `}>
                                      {card.metrics.change}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            <span>{card.view_slug}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {card.lastUpdated && (
                              <span>{new Date(card.lastUpdated).toLocaleDateString()}</span>
                            )}
                            {isRecentlyUsed && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                Recent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
