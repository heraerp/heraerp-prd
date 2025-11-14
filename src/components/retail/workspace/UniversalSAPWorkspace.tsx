/**
 * Universal SAP-Style Workspace Component
 * Smart Code: HERA.RETAIL.UNIVERSAL.WORKSPACE.v1
 * 
 * Production-ready universal workspace interface based on SAP Fiori design
 * Supports any domain/section/workspace combination with database-driven configuration
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useInstantRouter } from '@/components/performance/InstantRouter'
import { usePrefetch } from '@/lib/performance/PrefetchService'
import { UniversalTileRenderer } from '@/components/tiles/UniversalTileRenderer'
import { useWorkspaceSecurity } from '@/lib/security/WorkspaceSecurityManager'
import { useAuditLogger } from '@/lib/security/AuditLogger'
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
  Grid3x3,
  ClipboardCheck,
  Clock,
  Calculator,
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
  Zap,
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
const iconMap = {
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

interface UniversalSAPWorkspaceProps {
  domain: string
  section: string
  workspace?: string
}

export default function UniversalSAPWorkspace({ 
  domain, 
  section, 
  workspace = 'main' 
}: UniversalSAPWorkspaceProps) {
  const router = useRouter()
  const { user, organization, isAuthenticated, isLoading, contextLoading } = useHERAAuth()
  
  // Performance optimizations
  const { navigate, prefetchOnHover } = useInstantRouter()
  const { getCachedOrFetch, preloadRoutes } = usePrefetch()
  
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null)
  const [tileData, setTileData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeNavCode, setActiveNavCode] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [useTileSystem, setUseTileSystem] = useState(false) // Feature flag
  
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
  const [userRole, setUserRole] = useState('manager') 
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, cardSlug: string} | null>(null)
  
  // Security and permissions
  const {
    securityManager,
    securityContext,
    hasPermission,
    validateTileAccess,
    validateDataAccess,
    isSessionValid,
    getAuditLog
  } = useWorkspaceSecurity()
  
  // Audit logging
  const {
    logTileAccess,
    logTileAction,
    logDataAccess,
    logSecurityViolation,
    logAuthentication,
    getMetrics: getAuditMetrics
  } = useAuditLogger()
  
  const [securityViolations, setSecurityViolations] = useState<string[]>([])
  const [maskedData, setMaskedData] = useState<Record<string, boolean>>({})
  const [auditMetrics, setAuditMetrics] = useState<any>(null)

  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      // Validate session and organization access
      if (securityContext && !isSessionValid()) {
        console.error('🛡️ Security: Session expired')
        setSecurityViolations(prev => [...prev, 'Session expired'])
        return
      }
      
      // Validate organization boundary
      if (organization?.id && !validateDataAccess('workspace', organization.id)) {
        console.error('🛡️ Security: Organization access denied')
        setSecurityViolations(prev => [...prev, 'Organization access denied'])
        
        // Log security violation
        logSecurityViolation(
          user?.id || 'unknown',
          organization?.id || 'unknown',
          'organization_boundary_violation',
          'Attempt to access workspace outside organization boundary',
          { domain, section, workspace, requestedOrgId: organization?.id }
        )
        return
      }
      
      loadWorkspaceData()
      
      // Enable tile system for analytics sections by default (if permitted)
      if ((section === 'analytics' || section === 'fin') && hasPermission('view_analytics')) {
        setUseTileSystem(true)
      }
      
      // Update user role from security context
      if (securityContext?.userRole) {
        setUserRole(securityContext.userRole)
      }
      
      // Log workspace access
      if (securityContext) {
        logDataAccess(
          securityContext.actorUserId,
          securityContext.organizationId,
          'workspace',
          `${domain}/${section}/${workspace}`,
          'success',
          'read'
        )
      }
      
      // Update audit metrics
      setAuditMetrics(getAuditMetrics())
    }
  }, [isAuthenticated, organization?.id, domain, section, workspace, securityContext, isSessionValid, validateDataAccess, hasPermission])

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
      
      console.log('🔍 Loading universal workspace data for:', { domain, section, workspace, useTileSystem })

      const apiUrl = `/api/v2/${domain}/${section}/${workspace}`
      
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

      // Load tile data if tile system is enabled
      if (useTileSystem || section === 'analytics' || section === 'fin') {
        await loadTileData()
      }

      // Preload related workspace routes in background
      if (data.workspace) {
        const relatedRoutes = [
          `/retail/domains/${domain}`,
          `/retail/dashboard`
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

  const loadTileData = async () => {
    try {
      console.log('🔍 Loading tile data for enhanced workspace:', { domain, section, workspace })
      
      const tileApiUrl = `/api/v2/${domain}/${section}/${workspace}?format=tiles`
      
      const response = await fetch(tileApiUrl, {
        headers: {
          'X-Cache-Control': 'max-age=300',
          'X-Tile-Format': 'true'
        }
      })
      
      if (!response.ok) {
        console.warn('Failed to load tile data, falling back to card system')
        return
      }
      
      const tileResponse = await response.json()
      
      console.log('✅ Tile data loaded successfully:', tileResponse)
      setTileData(tileResponse)
      
    } catch (err) {
      console.warn('Error loading tile data, using card system:', err)
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
    let targetRoute = ''
    
    switch (card.target_type) {
      case 'entity':
      case 'entities':
        // Route to dynamic entity list page
        const entityType = card.entity_type || card.view_slug
        targetRoute = `/${domain}/${section}/${workspace}/entities/${entityType}`
        break
        
      case 'transaction':
      case 'transactions':
        // Route to dynamic transaction page
        const transactionType = card.view_slug.includes('transaction') ? 
          card.view_slug.replace('-transaction', '') : card.view_slug
        targetRoute = `/${domain}/${section}/${workspace}/transactions/${transactionType}`
        break
        
      case 'workflow':
      case 'workflows':
        // Route to dynamic workflow page
        targetRoute = `/${domain}/${section}/${workspace}/workflows/${card.view_slug}`
        break
        
      case 'relationship':
      case 'relationships':
        // Route to dynamic relationship page
        targetRoute = `/${domain}/${section}/${workspace}/relationships/${card.view_slug}`
        break
        
      case 'analytics':
        // Route to dynamic analytics page
        targetRoute = `/${domain}/${section}/${workspace}/analytics/${card.view_slug}`
        break
        
      case 'report':
      case 'reports':
        // Route to dynamic report page
        targetRoute = `/${domain}/${section}/${workspace}/reports/${card.view_slug}`
        break
        
      default:
        // Legacy routing for custom views or fallback to view_slug
        if (card.view_slug.includes('entities') || card.view_slug.includes('entity')) {
          const entityType = card.view_slug.replace(/entities?[-_]?/, '') || 'items'
          targetRoute = `/${domain}/${section}/${workspace}/entities/${entityType}`
        } else if (card.view_slug.includes('transaction') || card.view_slug.includes('txn')) {
          const transactionType = card.view_slug.replace(/transactions?[-_]?/, '') || 'general'
          targetRoute = `/${domain}/${section}/${workspace}/transactions/${transactionType}`
        } else {
          // For now, show details about the card for unimplemented types
          alert(`${card.label}\\n\\nTarget: ${card.target_type}\\nTemplate: ${card.template_code}\\nView Slug: ${card.view_slug}\\nMetrics: ${card.metrics?.label || 'None'}\\n\\nStatus: ${card.status || 'Unknown'}\\nPriority: ${card.priority || 'Normal'}\\nLast Updated: ${card.lastUpdated || 'Unknown'}\\n\\nNote: This card type will be routed to dynamic pages when implemented.`)
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
    router.push(`/retail/domains/${domain}`)
  }

  // Enhanced tile action handlers with security validation
  const handleTileAction = async (tileId: string, actionId: string, params?: any) => {
    console.log('🎯 Enhanced Tile Action Handler:', { tileId, actionId, params })
    
    // Security validation
    if (!securityContext || !isSessionValid()) {
      addNotification('Session expired. Please log in again.', 'warning')
      return
    }
    
    // Find tile configuration for permission checking
    const tileConfig = tileData?.data?.tiles?.find((tile: any) => tile.id === tileId)
    if (tileConfig) {
      const permissions = validateTileAccess(tileId, tileConfig)
      
      // Check specific action permissions
      const actionAllowed = (() => {
        switch (actionId) {
          case 'export':
            return permissions.canExport && hasPermission('export_basic')
          case 'drill_down':
          case 'view_details':
            return permissions.canView && hasPermission('drill_down')
          case 'edit':
          case 'set_target':
            return permissions.canEdit && hasPermission('write')
          case 'refresh':
            return permissions.canView
          default:
            return permissions.canInteract
        }
      })()
      
      if (!actionAllowed) {
        const violation = `Action '${actionId}' denied for role '${securityContext.userRole}'`
        setSecurityViolations(prev => [...prev, violation])
        addNotification('Access denied: Insufficient permissions', 'warning')
        console.error('🛡️ Security Violation:', violation)
        
        // Log security violation with full context
        logSecurityViolation(
          securityContext.actorUserId,
          securityContext.organizationId,
          'insufficient_permissions',
          violation,
          { tileId, actionId, userRole: securityContext.userRole, params }
        )
        
        // Log the denied tile action
        logTileAction(
          securityContext.actorUserId,
          securityContext.organizationId,
          tileId,
          actionId,
          params,
          'denied'
        )
        return
      }
    }
    
    try {
      switch (actionId) {
        case 'drill_down':
          // Navigate to detailed analysis page
          const drillDownRoute = generateDrillDownRoute(tileId, params)
          console.log('📊 Drilling down to:', drillDownRoute)
          navigate(drillDownRoute)
          addNotification(`Opening detailed analysis for ${params?.category || 'data'}`, 'info')
          break
          
        case 'export':
          // Handle export functionality with comprehensive audit logging
          if (!hasPermission('export_basic') && !hasPermission('export_full')) {
            addNotification('Export permission required', 'warning')
            logTileAction(
              securityContext.actorUserId,
              securityContext.organizationId,
              tileId,
              actionId,
              params,
              'denied'
            )
            return
          }
          console.log('📤 Exporting data:', { tileId, format: params?.format, period: params?.period })
          await handleTileExport(tileId, params)
          addNotification(`Exporting ${params?.format?.toUpperCase() || 'data'} report...`, 'success')
          
          // Log successful export action
          logTileAction(
            securityContext.actorUserId,
            securityContext.organizationId,
            tileId,
            actionId,
            {
              format: params?.format,
              period: params?.period,
              exportSize: 'unknown', // Would be populated in real implementation
              exportTime: new Date().toISOString()
            },
            'success'
          )
          break
          
        case 'refresh':
          // Refresh specific tile data
          console.log('🔄 Refreshing tile:', tileId)
          await refreshTileData(tileId)
          addNotification('Tile data refreshed', 'success')
          break
          
        case 'view_details':
          // Navigate to detailed view
          const detailRoute = generateDetailRoute(tileId, params)
          console.log('🔍 Viewing details:', detailRoute)
          navigate(detailRoute)
          break
          
        case 'compare_periods':
          // Open period comparison dialog/page
          console.log('📈 Comparing periods for:', tileId)
          addNotification('Period comparison feature coming soon', 'info')
          break
          
        case 'set_target':
          // Open target setting dialog
          if (!hasPermission('manage_targets')) {
            addNotification('Target management permission required', 'warning')
            logTileAction(
              securityContext.actorUserId,
              securityContext.organizationId,
              tileId,
              actionId,
              params,
              'denied'
            )
            return
          }
          console.log('🎯 Setting target for:', tileId)
          addNotification('Target setting feature coming soon', 'info')
          
          // Log target management action
          logTileAction(
            securityContext.actorUserId,
            securityContext.organizationId,
            tileId,
            actionId,
            params,
            'success'
          )
          break
          
        case 'forecast':
          // Open forecasting view
          console.log('🔮 Opening forecast for:', tileId)
          addNotification('Forecasting feature coming soon', 'info')
          break
          
        default:
          console.log('⚠️ Unknown tile action:', actionId)
          addNotification(`Action ${actionId} not implemented`, 'warning')
      }
    } catch (error) {
      console.error('Error handling tile action:', error)
      addNotification('Failed to perform action', 'warning')
    }
  }

  const handleTileUpdate = async (tileId: string, updates: any) => {
    console.log('🔄 Handling tile update:', { tileId, updates })
    
    // Security validation
    if (!securityContext || !isSessionValid()) {
      addNotification('Session expired. Please log in again.', 'warning')
      return
    }
    
    if (!hasPermission('write')) {
      addNotification('Edit permission required', 'warning')
      return
    }
    
    try {
      // Update tile data in the local state or send to server
      if (tileData?.data?.tiles) {
        const updatedTiles = tileData.data.tiles.map((tile: any) => {
          if (tile.id === tileId) {
            return { ...tile, ...updates }
          }
          return tile
        })
        
        setTileData({
          ...tileData,
          data: {
            ...tileData.data,
            tiles: updatedTiles
          }
        })
        
        addNotification('Tile updated successfully', 'success')
        console.log('📝 Audit Log: Tile update', {
          actor: securityContext?.actorUserId,
          org: securityContext?.organizationId,
          tile: tileId,
          changes: Object.keys(updates)
        })
      }
    } catch (error) {
      console.error('Error updating tile:', error)
      addNotification('Failed to update tile', 'warning')
    }
  }

  const generateDrillDownRoute = (tileId: string, params?: any): string => {
    // Generate routes based on tile type and parameters
    if (tileId.includes('revenue')) {
      return `/${domain}/${section}/${workspace}/analytics/revenue?period=${params?.period || 'monthly'}&category=${params?.category || 'all'}`
    }
    if (tileId.includes('cash_flow') || tileId.includes('cashflow')) {
      return `/${domain}/${section}/${workspace}/analytics/cash-flow?category=${params?.category || 'operating'}&period=${params?.period || 'monthly'}`
    }
    if (tileId.includes('kpi')) {
      return `/${domain}/${section}/${workspace}/analytics/kpi/${params?.kpiType || 'profit_margin'}?period=${params?.period || 'quarterly'}`
    }
    return `/${domain}/${section}/${workspace}/analytics/details?tile=${tileId}`
  }

  const generateDetailRoute = (tileId: string, params?: any): string => {
    // Generate detail view routes
    return `/${domain}/${section}/${workspace}/details/${tileId.replace(/^tile_/, '')}?${new URLSearchParams(params || {}).toString()}`
  }

  const handleTileExport = async (tileId: string, params?: any) => {
    console.log('📤 Processing tile export:', { tileId, params })
    
    // Simulate export process
    const exportData = {
      tileId,
      workspaceId: tileData?.data?.workspace?.id,
      domain,
      section,
      workspace,
      format: params?.format || 'pdf',
      period: params?.period,
      exportedAt: new Date().toISOString(),
      exportedBy: securityContext?.actorUserId,
      organizationId: securityContext?.organizationId
    }
    
    // In a real implementation, this would call an API
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Export completed:', exportData)
        resolve(exportData)
      }, 2000)
    })
  }

  const refreshTileData = async (tileId: string) => {
    console.log('🔄 Refreshing data for tile:', tileId)
    
    // Simulate data refresh
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real implementation, this would fetch fresh data for the specific tile
        console.log('✅ Tile data refreshed:', tileId)
        resolve(true)
      }, 1000)
    })
  }

  const currentSection = workspaceData?.layout_config.sections.find(
    section => section.nav_code === activeNavCode
  )

  // Enhanced filtering with security and personalization
  const getFilteredAndSortedCards = () => {
    if (!currentSection) return []
    
    // Get user role from security context
    const currentUserRole = securityContext?.userRole || 'viewer'
    
    let cards = currentSection.cards
      .filter(card => {
        // Basic search filter
        const matchesSearch = searchQuery === '' || 
          card.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        
        // Hidden cards filter
        const notHidden = !userPreferences.hiddenCards.has(card.view_slug)
        
        return matchesSearch && notHidden
      })

    // Group cards if needed
    if (userPreferences.groupBy !== 'none') {
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

      {/* iOS-style Mobile Header - MANDATORY per HERA standards */}
      <div className="md:hidden">
        {/* iOS Status Bar Spacer - MANDATORY */}
        <div className="h-11 bg-gradient-to-b from-black/20 to-transparent" />
        
        {/* Mobile App Header - MANDATORY */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {/* Rounded app icon */}
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                style={{ backgroundColor: workspaceInfo.color }}
              >
                <Grid3x3 className="w-5 h-5" />
              </div>
              {/* Title and subtitle */}
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {workspaceInfo.entity_name}
                </h1>
                <p className="text-xs text-gray-600">
                  {workspaceData?.layout_config.sections.find(s => s.nav_code === activeNavCode)?.title || 'Analytics'}
                </p>
              </div>
            </div>
            
            {/* Touch-friendly action buttons */}
            <div className="flex items-center gap-2">
              <button 
                className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform relative"
                onClick={refreshWorkspace}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button 
                className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform relative"
                onClick={() => addNotification('Settings coming soon', 'info')}
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              
              <button 
                className="min-w-[44px] min-h-[44px] rounded-full bg-indigo-100 flex items-center justify-center active:scale-95 transition-transform relative"
                onClick={() => addNotification(`${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`, 'info')}
              >
                <Bell className="w-5 h-5 text-indigo-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* SAP Header - Hidden on Mobile */}
      <header className="hidden md:block bg-white shadow-sm border-b border-gray-200">
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
                    onClick={() => navigate(`/retail/domains/${domain}`)}
                    onMouseEnter={() => prefetchOnHover(`/retail/domains/${domain}`)}
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
      <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]">
        {/* Left Sidebar Navigation - Hidden on Mobile */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 flex-shrink-0">
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
                  {/* Tile System Toggle */}
                  <Button 
                    variant={useTileSystem ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseTileSystem(!useTileSystem)}
                    className="flex items-center gap-2"
                  >
                    <Grid className="h-4 w-4" />
                    {useTileSystem ? 'Tiles' : 'Cards'}
                  </Button>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={useTileSystem ? "Filter tiles..." : "Filter cards..."}
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

          {/* Content Area - Tiles or Cards */}
          <div className="p-6">
            {useTileSystem && tileData ? (
              <div className="universal-tile-system">
                <UniversalTileRenderer 
                  workspaceId={tileData.data?.workspace?.id || 'unknown'}
                  organizationId="00000000-0000-0000-0000-000000000000"
                  actorUserId={user?.id || 'unknown'}
                  layout="grid"
                  columns={1} // Mobile-first: 1 column on mobile, responsive scaling
                  gap="md"
                  showHeader={false}
                  showControls={true}
                  showSearch={true}
                  showFilter={true}
                  autoRefresh={userPreferences.autoRefresh}
                  refreshInterval={userPreferences.refreshInterval * 1000}
                  onTileAction={(tileId, actionId, params) => {
                    console.log('🎯 Tile Action:', { tileId, actionId, params })
                    handleTileAction(tileId, actionId, params)
                  }}
                  onTileUpdate={(tileId, updates) => {
                    console.log('🔄 Tile Update:', { tileId, updates })
                    handleTileUpdate(tileId, updates)
                  }}
                  className="min-h-[600px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                />
              </div>
            ) : (
              /* Traditional Cards Grid */
              <>
                {filteredCards.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Box className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cards found</h3>
                    <p className="text-gray-600">
                      {searchQuery ? `No cards match "${searchQuery}"` : 'No cards configured for this section'}
                    </p>
                    {!useTileSystem && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setUseTileSystem(true)
                          addNotification('Switching to Universal Tile System...', 'info')
                        }}
                      >
                        <Grid3x3 className="h-4 w-4 mr-2" />
                        Switch to Enhanced Tiles
                      </Button>
                    )}
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
                          className={`cursor-pointer group relative transition-all duration-200 border-0 shadow-md bg-white h-48 sm:h-56
                            ${getPriorityBorder(card.priority)}
                            ${isHovered ? 'shadow-xl scale-105 ring-2 ring-indigo-200' : 'hover:shadow-lg hover:scale-102 active:scale-95'}
                            ${isRecentlyUsed ? 'ring-1 ring-blue-200' : ''}
                            touch-manipulation min-h-[120px]
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

                          {/* Favorite Star - Enhanced for Mobile */}
                          <button
                            className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                            onClick={(e) => toggleFavorite(card.view_slug, e)}
                          >
                            {isFavorite ? (
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <StarOff className="h-5 w-5 text-gray-400 hover:text-yellow-500" />
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
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation - iOS/Android Style - MANDATORY */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {/* Analytics */}
          <button 
            className={`flex flex-col items-center justify-center min-h-[44px] active:scale-95 transition-transform ${
              activeNavCode === 'analytics' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'
            }`}
            onClick={() => setActiveNavCode('analytics')}
          >
            <BarChart3 className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </button>
          
          {/* Master Data */}
          <button 
            className={`flex flex-col items-center justify-center min-h-[44px] active:scale-95 transition-transform ${
              activeNavCode === 'master-data' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'
            }`}
            onClick={() => setActiveNavCode('master-data')}
          >
            <Database className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Data</span>
          </button>
          
          {/* Transactions */}
          <button 
            className={`flex flex-col items-center justify-center min-h-[44px] active:scale-95 transition-transform ${
              activeNavCode === 'transactions' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'
            }`}
            onClick={() => setActiveNavCode('transactions')}
          >
            <Activity className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Activity</span>
          </button>
          
          {/* Workflow */}
          <button 
            className={`flex flex-col items-center justify-center min-h-[44px] active:scale-95 transition-transform ${
              activeNavCode === 'workflow' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'
            }`}
            onClick={() => setActiveNavCode('workflow')}
          >
            <GitBranch className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Flow</span>
          </button>
          
          {/* More */}
          <button 
            className={`flex flex-col items-center justify-center min-h-[44px] active:scale-95 transition-transform ${
              showPersonalizationPanel ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'
            }`}
            onClick={() => setShowPersonalizationPanel(!showPersonalizationPanel)}
          >
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Content Bottom Spacing - MANDATORY for comfortable scrolling */}
      <div className="h-20 md:h-0" />
    </div>
  )
}