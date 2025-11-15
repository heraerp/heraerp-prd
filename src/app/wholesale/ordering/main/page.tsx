/**
 * SAP-Style Workspace Page - Wholesale Order Management
 * Smart Code: HERA.WHOLESALE.ORDERING.WORKSPACE.v1
 * 
 * SAP-style workspace layout for wholesale order processing
 * Route: /wholesale/ordering/main
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
  'squares-2x2': Grid3x3,
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
    label?: string
    trend?: 'up' | 'down' | 'stable'
    change?: string
  }
  status?: 'active' | 'inactive' | 'warning' | 'error'
  priority?: 'high' | 'medium' | 'low'
  lastUpdated?: string
  quickActions?: Array<{
    label: string
    icon: string
    action: string
  }>
}

export default function WholesaleOrderingWorkspace() {
  const router = useRouter()
  const params = useParams()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const { navigate, prefetchOnHover } = useInstantRouter()
  const { prefetchRoute } = usePrefetch()

  const [workspaceData, setWorkspaceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeNav, setActiveNav] = useState('master-data')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  // Hard-coded route parameters for static route
  const domain = 'wholesale'
  const section = 'ordering'  
  const workspace = 'main'

  // Three-layer auth check
  if (!isAuthenticated) return <Alert><AlertDescription>Please log in</AlertDescription></Alert>
  if (contextLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!organization?.id) return <Alert><AlertDescription>No organization context</AlertDescription></Alert>

  useEffect(() => {
    loadWorkspaceData()
  }, [domain, section, workspace])

  const loadWorkspaceData = async () => {
    try {
      setLoading(true)
      setError(null)

      const apiUrl = `/api/v2/${domain}/${section}/${workspace}`
      console.log(`🔍 Loading workspace data from: ${apiUrl}`)
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to load workspace data: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`✅ Workspace data loaded:`, data)
      
      setWorkspaceData(data)
      
      // Set default navigation
      if (data.layout_config?.default_nav_code) {
        setActiveNav(data.layout_config.default_nav_code)
      }
      
    } catch (err) {
      console.error('❌ Error loading workspace data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workspace data')
    } finally {
      setLoading(false)
    }
  }

  const handleNavClick = (navCode: string) => {
    setActiveNav(navCode)
    // Prefetch related data
    prefetchRoute(`/${domain}/${section}/${workspace}/${navCode}`, {
      priority: 'high'
    })
  }

  const handleCardClick = (card: WorkspaceCard) => {
    if (card.view_slug) {
      navigate(card.view_slug, {
        card,
        workspace: workspaceData?.workspace
      })
    }
  }

  const handleCardHover = (card: WorkspaceCard) => {
    if (card.view_slug) {
      prefetchOnHover(card.view_slug)
    }
  }

  const getFilteredCards = () => {
    const activeSection = workspaceData?.layout_config?.sections?.find(
      (section: any) => section.nav_code === activeNav
    )
    
    if (!activeSection?.cards) return []
    
    let cards = activeSection.cards
    
    if (searchTerm) {
      cards = cards.filter((card: WorkspaceCard) =>
        card.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return cards
  }

  const renderCard = (card: WorkspaceCard, index: number) => {
    const IconComponent = iconMap[card.icon] || Box
    const statusColor = {
      'active': 'text-green-600',
      'inactive': 'text-gray-400', 
      'warning': 'text-yellow-600',
      'error': 'text-red-600'
    }[card.status || 'active']

    return (
      <Card 
        key={index}
        className="hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
        onClick={() => handleCardClick(card)}
        onMouseEnter={() => handleCardHover(card)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <IconComponent className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium text-gray-900">
                  {card.label}
                </CardTitle>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </div>
            {card.status && (
              <Badge variant="outline" className={statusColor}>
                {card.status}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Metrics */}
          {card.metrics && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {card.metrics.value}
                    {card.metrics.unit && (
                      <span className="text-sm text-gray-500 ml-1">
                        {card.metrics.unit}
                      </span>
                    )}
                  </div>
                  {card.metrics.label && (
                    <div className="text-xs text-gray-600">
                      {card.metrics.label}
                    </div>
                  )}
                </div>
                {card.metrics.trend && (
                  <div className="flex items-center">
                    {card.metrics.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {card.metrics.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {card.metrics.trend === 'stable' && <Circle className="w-4 h-4 text-gray-500" />}
                  </div>
                )}
              </div>
              {card.metrics.change && (
                <div className="text-xs text-gray-500 mt-1">
                  {card.metrics.change}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {card.quickActions && (
            <div className="flex space-x-2">
              {card.quickActions.map((action, actionIndex) => {
                const ActionIcon = iconMap[action.icon] || Circle
                return (
                  <Button 
                    key={actionIndex}
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    <ActionIcon className="w-3 h-3 mr-1" />
                    {action.label}
                  </Button>
                )
              })}
            </div>
          )}

          {/* Last Updated */}
          {card.lastUpdated && (
            <div className="text-xs text-gray-400 mt-2">
              Updated: {new Date(card.lastUpdated).toLocaleString()}
            </div>
          )}
        </CardContent>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity" />
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading wholesale ordering workspace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Error loading workspace: {error}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={loadWorkspaceData}
          className="mt-4"
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!workspaceData) {
    return (
      <Alert>
        <AlertDescription>
          No workspace data available
        </AlertDescription>
      </Alert>
    )
  }

  const filteredCards = getFilteredCards()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Navigation Panel */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold text-gray-900 text-sm">
                {workspaceData.workspace?.entity_name || 'Workspace'}
              </h1>
              <p className="text-xs text-gray-500">
                {workspaceData.workspace?.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2">
            {workspaceData.layout_config?.nav_items?.map((navItem: any) => (
              <button
                key={navItem.code}
                onClick={() => handleNavClick(navItem.code)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
                  activeNav === navItem.code
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {navItem.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {workspaceData.layout_config?.sections?.find((s: any) => s.nav_code === activeNav)?.title || 'Workspace'}
              </h2>
              <Badge variant="outline">
                {filteredCards.length} items
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No items match your search' : 'No items available in this section'}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCards.map((card: WorkspaceCard, index: number) => 
                renderCard(card, index)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}