/**
 * SAP-Style Workspace Page - Layer 3 Navigation
 * Smart Code: HERA.PLATFORM.NAV.WORKSPACE.v1
 * 
 * SAP-style workspace layout with left navigation and dynamic card sections
 * Route: /apps/[domain]/[section]/[workspace]
 * Example: /apps/retail/pos/main
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
import { 
  ArrowLeft,
  ArrowDown,
  Home,
  Search,
  Bell,
  User,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
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
  Squares2x2,
  ClipboardCheck,
  Clock,
  Calculator,
  Grid3x3,
  TrendingUp,
  TrendingDown,
  Circle,
  MoreHorizontal,
  RefreshCw,
  Edit3,
  Star,
  StarOff,
  ExternalLink,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react'
import { prefetchService } from '@/lib/performance/PrefetchService'

// Icon mapping for workspace cards
const iconMap = {
  'activity': Activity,
  'shopping-cart': ShoppingCart,
  'bar-chart-3': BarChart3,
  'calculator': Calculator,
  'box': Box,
  'plus-circle': PlusCircle,
  'user-circle-2': UserCircle2,
  'tags': Tags,
  'receipt': Receipt,
  'rotate-ccw': RotateCcw,
  'credit-card': CreditCard,
  'percent': Percent,
  'squares-2x2': Squares2x2,
  'users': Users,
  'clipboard-check': ClipboardCheck,
  'clock': Clock,
  'layout-dashboard': Grid3x3,
  'settings': Settings
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
  // Enhanced properties
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
  quickActions?: Array<{
    label: string
    icon: string
    action: string
  }>
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

export default function SAWorkspacePage() {
  const router = useRouter()
  const params = useParams()
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
  const [cardStatuses, setCardStatuses] = useState<Record<string, 'active' | 'warning' | 'error' | 'disabled'>>({})
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'info' | 'warning'}>>([])
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  
  // Advanced personalization state
  const [userPreferences, setUserPreferences] = useState({
    layout: 'grid', // 'grid' | 'list' | 'compact'
    cardSize: 'medium', // 'small' | 'medium' | 'large'
    groupBy: 'none', // 'none' | 'priority' | 'status' | 'type'
    sortBy: 'default', // 'default' | 'alphabetical' | 'priority' | 'lastUsed'
    showMetrics: true,
    autoRefresh: false,
    refreshInterval: 30, // seconds
    hiddenCards: new Set<string>(),
    customOrder: [] as string[]
  })
  const [savedFilters, setSavedFilters] = useState<Array<{id: string, name: string, query: string, navCode?: string}>>([])
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [showPersonalizationPanel, setShowPersonalizationPanel] = useState(false)
  const [userRole, setUserRole] = useState('store_manager') // Could be retrieved from auth context
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, cardSlug: string} | null>(null)
  
  const domain = params.domain as string
  const section = params.section as string
  const workspace = params.workspace as string

  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      loadWorkspaceData()
    }
  }, [isAuthenticated, organization?.id, domain, section, workspace])

  // Auto-refresh when enabled
  useEffect(() => {
    if (userPreferences.autoRefresh && userPreferences.refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshWorkspace()
      }, userPreferences.refreshInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [userPreferences.autoRefresh, userPreferences.refreshInterval])

  const loadWorkspaceData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Loading workspace data for:', { domain, section, workspace })

      const apiUrl = `/api/v2/platform/workspace/${domain}/${section}/${workspace}`
      
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
          `/apps/${domain}/${section}`,
          `/apps/${domain}`
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
    
    // For now, show details about the card - in production would route to dynamic views
    setTimeout(() => {
      alert(`${card.label}\\n\\nTarget: ${card.target_type}\\nTemplate: ${card.template_code}\\nView Slug: ${card.view_slug}\\nMetrics: ${card.metrics?.label || 'None'}\\n\\nStatus: ${card.status || 'Unknown'}\\nPriority: ${card.priority || 'Normal'}\\nLast Updated: ${card.lastUpdated || 'Unknown'}`)
    }, 500)
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

  const handleQuickAction = (action: string, cardSlug: string, e: React.MouseEvent) => {
    e.stopPropagation()
    alert(`Quick Action: ${action} for ${cardSlug}`)
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
      // Simulate refresh delay
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

  // Advanced personalization functions
  const saveFilter = (name: string, query: string, navCode?: string) => {
    const newFilter = {
      id: Date.now().toString(),
      name,
      query,
      navCode
    }
    setSavedFilters(prev => [...prev, newFilter])
    addNotification(`Filter "${name}" saved`, 'success')
  }

  const applyFilter = (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId)
    if (filter) {
      setSearchQuery(filter.query)
      if (filter.navCode && filter.navCode !== activeNavCode) {
        setActiveNavCode(filter.navCode)
      }
      setActiveFilter(filterId)
      addNotification(`Applied filter: ${filter.name}`, 'info')
    }
  }

  const updateUserPreference = (key: keyof typeof userPreferences, value: any) => {
    setUserPreferences(prev => ({ ...prev, [key]: value }))
    addNotification('Preferences updated', 'success')
  }

  const toggleCardVisibility = (cardSlug: string) => {
    setUserPreferences(prev => {
      const newHidden = new Set(prev.hiddenCards)
      if (newHidden.has(cardSlug)) {
        newHidden.delete(cardSlug)
        addNotification('Card shown', 'info')
      } else {
        newHidden.add(cardSlug)
        addNotification('Card hidden', 'info')
      }
      return { ...prev, hiddenCards: newHidden }
    })
  }

  const resetPersonalization = () => {
    setUserPreferences({
      layout: 'grid',
      cardSize: 'medium',
      groupBy: 'none',
      sortBy: 'default',
      showMetrics: true,
      autoRefresh: false,
      refreshInterval: 30,
      hiddenCards: new Set<string>(),
      customOrder: []
    })
    setSearchQuery('')
    setActiveFilter('')
    setSavedFilters([])
    addNotification('Personalization reset to defaults', 'info')
  }

  const handleContextMenu = (e: React.MouseEvent, cardSlug: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      cardSlug
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu()
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const getCardSizeClass = () => {
    switch (userPreferences.cardSize) {
      case 'small': return 'h-48'
      case 'large': return 'h-72'
      default: return 'h-56'
    }
  }

  const getGridLayoutClass = () => {
    if (userPreferences.layout === 'list') {
      return 'grid grid-cols-1 gap-4'
    } else if (userPreferences.layout === 'compact') {
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3'
    } else {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    }
  }

  const isCardVisibleForRole = (card: WorkspaceCard) => {
    // Role-based visibility logic
    const roleHierarchy = {
      'store_manager': ['store_manager', 'cashier', 'store_associate'],
      'cashier': ['cashier'],
      'store_associate': ['store_associate']
    }
    
    const allowedRoles = roleHierarchy[userRole as keyof typeof roleHierarchy] || [userRole]
    
    // Check if card has visible_roles defined in extended metadata
    if (card.template_code?.includes('MANAGER') && !allowedRoles.includes('store_manager')) {
      return false
    }
    
    return true
  }

  const handleBackClick = () => {
    router.back()
  }

  const currentSection = workspaceData?.layout_config.sections.find(
    section => section.nav_code === activeNavCode
  )

  // Enhanced filtering with personalization
  const getFilteredAndSortedCards = () => {
    if (!currentSection) return []
    
    let cards = currentSection.cards
      .filter(card => {
        // Basic search filter
        const matchesSearch = searchQuery === '' || 
          card.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        
        // Role-based visibility
        const visibleForRole = isCardVisibleForRole(card)
        
        // Hidden cards filter
        const notHidden = !userPreferences.hiddenCards.has(card.view_slug)
        
        return matchesSearch && visibleForRole && notHidden
      })

    // Group cards if needed
    if (userPreferences.groupBy !== 'none') {
      // For now, just sort by the grouping criteria
      cards = cards.sort((a, b) => {
        switch (userPreferences.groupBy) {
          case 'priority':
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2, undefined: 3 }
            return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
                   (priorityOrder[b.priority as keyof typeof priorityOrder] || 3)
          case 'status':
            return (a.status || '').localeCompare(b.status || '')
          case 'type':
            return a.target_type.localeCompare(b.target_type)
          default:
            return 0
        }
      })
    }

    // Sort cards
    switch (userPreferences.sortBy) {
      case 'alphabetical':
        cards = cards.sort((a, b) => a.label.localeCompare(b.label))
        break
      case 'priority':
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2, undefined: 3 }
        cards = cards.sort((a, b) => 
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 3))
        break
      case 'lastUsed':
        cards = cards.sort((a, b) => {
          const aIndex = recentlyUsed.indexOf(a.view_slug)
          const bIndex = recentlyUsed.indexOf(b.view_slug)
          if (aIndex === -1 && bIndex === -1) return 0
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
        break
      default:
        // Keep default order
        break
    }

    return cards
  }

  const filteredCards = getFilteredAndSortedCards()

  // Show loading state
  if (isLoading || contextLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading workspace...</p>
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
  if (error || !workspaceData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error || `Workspace "${domain}/${section}/${workspace}" not found`}
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
                    onClick={() => navigate('/retail/dashboard')}
                  >
                    My Home
                  </span>
                  <span 
                    className="font-medium cursor-pointer hover:text-indigo-600"
                    onClick={() => navigate(`/apps/${domain}`)}
                    onMouseEnter={() => prefetchOnHover(`/apps/${domain}`)}
                  >
                    {domain.charAt(0).toUpperCase() + domain.slice(1)}
                  </span>
                  <span 
                    className="font-medium cursor-pointer hover:text-indigo-600"
                    onClick={() => navigate(`/apps/${domain}/${section}`)}
                    onMouseEnter={() => prefetchOnHover(`/apps/${domain}/${section}`)}
                  >
                    {section.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
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
                  <option>Apps</option>
                </select>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in: Apps"
                  className="pl-9 pr-4 py-1 border border-gray-300 rounded text-sm w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <User className="h-4 w-4 text-gray-500" />
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">E</span>
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
            <div className="mb-4">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 font-medium">
                <span>Reference Period:</span>
                <ChevronDown className="h-3 w-3" />
              </div>
              <select className="w-full px-3 py-1 text-sm border border-gray-300 rounded">
                <option>Custom</option>
              </select>
            </div>

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
          {/* Content Header with Summary Bar */}
          <div className="bg-white border-b border-gray-200">
            {/* Summary Bar */}
            {currentSection?.nav_code === 'OVERVIEW' && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">₹47.2K</div>
                      <div className="text-xs text-gray-600">Today's Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">23</div>
                      <div className="text-xs text-gray-600">Transactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">₹2.1K</div>
                      <div className="text-xs text-gray-600">Avg Transaction</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                        <span className="text-sm text-gray-700">System Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Header */}
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPersonalizationPanel(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Personalize
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Cards Grid */}
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
              <div className={getGridLayoutClass()}>
                {filteredCards.map((card) => {
                  const Icon = iconMap[card.icon] || Box
                  const isFavorite = favoriteCards.has(card.view_slug)
                  const isHovered = hoveredCard === card.view_slug
                  const isRecentlyUsed = recentlyUsed.includes(card.view_slug)
                  
                  return (
                    <Card 
                      key={card.view_slug}
                      className={`cursor-pointer group relative transition-all duration-200 border-0 shadow-md bg-white
                        ${getPriorityBorder(card.priority)}
                        ${isHovered ? 'shadow-xl scale-105 ring-2 ring-indigo-200' : 'hover:shadow-lg hover:scale-102'}
                        ${isRecentlyUsed ? 'ring-1 ring-blue-200' : ''}
                      `}
                      onClick={() => handleCardClick(card)}
                      onContextMenu={(e) => handleContextMenu(e, card.view_slug)}
                      onMouseEnter={() => {
                        setHoveredCard(card.view_slug)
                        // Prefetch card route for instant navigation
                        const cardRoute = `/apps/${domain}/${section}/${workspace}/${card.view_slug}`
                        prefetchOnHover(cardRoute)
                      }}
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

                      {/* Quick Actions Menu */}
                      {isHovered && card.quickActions && card.quickActions.length > 0 && (
                        <div className="absolute top-3 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          <div className="relative">
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                              {card.quickActions.map((action, idx) => (
                                <button
                                  key={idx}
                                  className="w-full px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => handleQuickAction(action.action, card.view_slug, e)}
                                >
                                  {action.icon === 'refresh-cw' && <RefreshCw className="h-3 w-3" />}
                                  {action.icon === 'external-link' && <ExternalLink className="h-3 w-3" />}
                                  {action.icon === 'edit-3' && <Edit3 className="h-3 w-3" />}
                                  {action.icon === 'zap' && <Zap className="h-3 w-3" />}
                                  {action.icon === 'plus-circle' && <PlusCircle className="h-3 w-3" />}
                                  {action.icon === 'calculator' && <Calculator className="h-3 w-3" />}
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <CardContent className={`p-6 ${getCardSizeClass()} flex flex-col justify-between`}>
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
                              <span>{card.lastUpdated}</span>
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

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={closeContextMenu}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            onClick={() => {
              toggleFavorite(contextMenu.cardSlug, { stopPropagation: () => {} } as React.MouseEvent)
              closeContextMenu()
            }}
          >
            {favoriteCards.has(contextMenu.cardSlug) ? (
              <>
                <StarOff className="h-4 w-4" />
                Remove from Favorites
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                Add to Favorites
              </>
            )}
          </button>
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            onClick={() => {
              toggleCardVisibility(contextMenu.cardSlug)
              closeContextMenu()
            }}
          >
            {userPreferences.hiddenCards.has(contextMenu.cardSlug) ? (
              <>
                <Eye className="h-4 w-4" />
                Show Card
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Card
              </>
            )}
          </button>
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            onClick={() => {
              const card = filteredCards.find(c => c.view_slug === contextMenu.cardSlug)
              if (card) {
                const details = `Card Details:\n\nLabel: ${card.label}\nSubtitle: ${card.subtitle}\nType: ${card.target_type}\nStatus: ${card.status}\nPriority: ${card.priority}\nTemplate: ${card.template_code}\nLast Updated: ${card.lastUpdated}`
                alert(details)
              }
              closeContextMenu()
            }}
          >
            <Eye className="h-4 w-4" />
            Card Details
          </button>
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/workspace/card/${contextMenu.cardSlug}`)
              addNotification('Card link copied to clipboard', 'success')
              closeContextMenu()
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Copy Card Link
          </button>
        </div>
      )}

      {/* Advanced Personalization Panel */}
      {showPersonalizationPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Workspace Personalization</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPersonalizationPanel(false)}
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Customize your workspace layout, filters, and preferences</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Layout Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Layout Style</label>
                    <select 
                      value={userPreferences.layout}
                      onChange={(e) => updateUserPreference('layout', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="grid">Grid Layout</option>
                      <option value="list">List Layout</option>
                      <option value="compact">Compact Grid</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Size</label>
                    <select 
                      value={userPreferences.cardSize}
                      onChange={(e) => updateUserPreference('cardSize', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="small">Small Cards</option>
                      <option value="medium">Medium Cards</option>
                      <option value="large">Large Cards</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                    <select 
                      value={userPreferences.groupBy}
                      onChange={(e) => updateUserPreference('groupBy', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="none">No Grouping</option>
                      <option value="priority">Priority Level</option>
                      <option value="status">Status</option>
                      <option value="type">Card Type</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select 
                      value={userPreferences.sortBy}
                      onChange={(e) => updateUserPreference('sortBy', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="default">Default Order</option>
                      <option value="alphabetical">Alphabetical</option>
                      <option value="priority">Priority</option>
                      <option value="lastUsed">Recently Used</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        checked={userPreferences.showMetrics}
                        onChange={(e) => updateUserPreference('showMetrics', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Show Metrics</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        checked={userPreferences.autoRefresh}
                        onChange={(e) => updateUserPreference('autoRefresh', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Auto Refresh</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Saved Filters */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Filters</h3>
                <div className="space-y-2">
                  {savedFilters.length === 0 ? (
                    <p className="text-sm text-gray-600">No saved filters yet. Create filters by searching and clicking "Save Filter".</p>
                  ) : (
                    savedFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium text-gray-900">{filter.name}</span>
                          <span className="text-sm text-gray-600 ml-2">"{filter.query}"</span>
                          {filter.navCode && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {filter.navCode}
                            </Badge>
                          )}
                        </div>
                        <div className="space-x-2">
                          <Button size="sm" variant="outline" onClick={() => applyFilter(filter.id)}>
                            Apply
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSavedFilters(prev => prev.filter(f => f.id !== filter.id))}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {searchQuery && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-800 mb-2">Current search: "{searchQuery}"</p>
                    <Button 
                      size="sm"
                      onClick={() => {
                        const name = prompt('Enter filter name:')
                        if (name) {
                          saveFilter(name, searchQuery, activeNavCode)
                        }
                      }}
                    >
                      Save as Filter
                    </Button>
                  </div>
                )}
              </div>

              {/* User Role & Permissions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Role & Permissions</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">Current Role: </span>
                      <Badge variant="default" className="ml-1">
                        {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {filteredCards.length} cards visible of {currentSection?.cards.length || 0} total
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={resetPersonalization}>
                  Reset to Defaults
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setShowPersonalizationPanel(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    setShowPersonalizationPanel(false)
                    addNotification('Personalization settings saved', 'success')
                  }}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}