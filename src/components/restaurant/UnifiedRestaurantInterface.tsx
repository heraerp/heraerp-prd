'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ChefHat,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  Zap,
  Coffee,
  Utensils,
  Clock,
  DollarSign,
  TrendingUp,
  MapPin,
  Wifi,
  Command,
  Home,
  LogOut,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  ArrowRight,
  Activity,
  Target,
  Star
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import {
  StatusIndicator,
  PulseIndicator,
  AnimatedCounter,
  MetricCard,
  HeartbeatIndicator,
  GlowButton
} from './JobsStyleMicroInteractions'

// Steve Jobs Design Principles:
// 1. Simplicity is the ultimate sophistication
// 2. Design is not just what it looks like - design is how it works
// 3. Details are not details. They make the design.
// 4. It's better to be a pirate than join the navy (innovation over convention)

interface UnifiedView {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  gradient: string
  isActive?: boolean
  notifications?: number
  quickActions?: Array<{
    label: string
    action: () => void
    icon?: React.ReactNode
  }>
}

export function UnifiedRestaurantInterface() {
  const { user, organization, logout  } = useHERAAuth()
  const [selectedView, setSelectedView] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Real-time stats (would come from API)
  const [liveStats, setLiveStats] = useState({
    tablesOccupied: 12,
    totalTables: 24,
    activeOrders: 8,
    todayRevenue: 4750,
    avgWaitTime: 12,
    customerSatisfaction: 4.8,
    staffOnDuty: 15
  })

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Keyboard shortcuts (Command+K for search, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false)
        setSearchQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Unified views with Jobs-inspired design
  const unifiedViews: UnifiedView[] = [
    {
      id: 'overview',
      title: 'Overview',
      subtitle: 'Restaurant pulse',
      icon: <Home className="w-6 h-6" />,
      color: 'from-slate-600 to-slate-800',
      gradient: 'bg-gradient-to-br from-slate-50 to-slate-100 border-border',
      isActive: true
    },
    {
      id: 'tables',
      title: 'Tables',
      subtitle: 'Floor management',
      icon: <MapPin className="w-6 h-6" />,
      color: 'from-blue-600 to-indigo-700',
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200',
      notifications: 3
    },
    {
      id: 'orders',
      title: 'Orders',
      subtitle: 'Kitchen flow',
      icon: <Utensils className="w-6 h-6" />,
      color: 'from-orange-600 to-red-700',
      gradient: 'bg-gradient-to-br from-orange-50 to-red-100 border-orange-200',
      notifications: liveStats.activeOrders
    },
    {
      id: 'reservations',
      title: 'Reservations',
      subtitle: 'Guest bookings',
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-purple-600 to-violet-700',
      gradient: 'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200',
      notifications: 2
    },
    {
      id: 'customers',
      title: 'Customers',
      subtitle: 'Guest relations',
      icon: <Users className="w-6 h-6" />,
      color: 'from-green-600 to-emerald-700',
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200'
    },
    {
      id: 'kitchen',
      title: 'Kitchen',
      subtitle: 'Live operations',
      icon: <ChefHat className="w-6 h-6" />,
      color: 'from-red-600 to-orange-700',
      gradient: 'bg-gradient-to-br from-red-50 to-orange-100 border-red-200',
      notifications: liveStats.activeOrders
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Performance insights',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-amber-600 to-yellow-700',
      gradient: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200'
    }
  ]

  // Quick actions for each view
  const getQuickActions = (viewId: string) => {
    const actions = {
      tables: [
        {
          label: 'Floor Plan',
          action: () => navigateTo('/restaurant/table-management'),
          icon: <MapPin className="w-4 h-4" />
        },
        { label: 'Combine Tables', action: () => {}, icon: <Plus className="w-4 h-4" /> }
      ],
      orders: [
        { label: 'New Order', action: () => {}, icon: <Plus className="w-4 h-4" /> },
        { label: 'Kitchen Display', action: () => {}, icon: <ChefHat className="w-4 h-4" /> }
      ],
      reservations: [
        { label: 'New Reservation', action: () => {}, icon: <Plus className="w-4 h-4" /> },
        { label: "Today's Schedule", action: () => {}, icon: <Calendar className="w-4 h-4" /> }
      ]
    }
    return actions[viewId as keyof typeof actions] || []
  }

  const navigateTo = (path: string) => {
    window.location.href = path
  }

  const occupancyRate = Math.round((liveStats.tablesOccupied / liveStats.totalTables) * 100)

  return (
    <div
      className={`min-h-screen bg-gray-900 transition-all duration-300 ${
        darkMode ? 'bg-background' : 'bg-gradient-to-br from-gray-900 via-white to-gray-100'
      }`}
    >
      {/* Header - Jobs-inspired minimal header */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl ${
          darkMode ? 'bg-background/80 border-gray-800' : 'bg-background/80 border-border/50'
        } border-b`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Restaurant branding */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1
                  className={`text-lg font-semibold ${darkMode ? 'text-foreground' : 'text-gray-100'}`}
                >
                  {organization?.organization_name || 'Restaurant'}
                </h1>
                <p
                  className={`text-xs ${darkMode ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                >
                  {isClient ? formatDate(currentTime, 'EEEE, MMM d · h:mm a') : 'Loading...'}
                </p>
              </div>
            </div>

            {/* Center: Search - Jobs loved search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    darkMode ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}
                />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search everything... ⌘K"
                  className={`pl-10 pr-4 py-2 rounded-full border-0 shadow-sm transition-all ${
                    darkMode
                      ? 'bg-muted text-foreground placeholder-gray-400 focus:bg-muted-foreground/10'
                      : 'bg-muted text-gray-100 placeholder-gray-500 focus:bg-background focus:shadow-md'
                  }`}
                  onFocus={() => setIsCommandPaletteOpen(true)}
                />
              </div>
            </div>

            {/* Right: Status and controls */}
            <div className="flex items-center space-x-3">
              {/* Live connection indicator */}
              <div className="flex items-center space-x-2">
                <PulseIndicator active={true} color="green" size="sm" />
                <span
                  className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}
                >
                  Live
                </span>
                <HeartbeatIndicator active={true} rate={2000} size={12} />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {liveStats.activeOrders > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-foreground text-xs rounded-full flex items-center justify-center">
                    {liveStats.activeOrders}
                  </span>
                )}
              </Button>

              {/* Theme toggle */}
              <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Fullscreen toggle */}
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>

              {/* User menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Stats - Jobs-style focus on key metrics */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Tables Occupied"
              value={`${liveStats.tablesOccupied}/${liveStats.totalTables}`}
              change={5.2}
              trend="up"
              icon={<MapPin className="w-6 h-6 text-foreground" />}
              color="from-blue-500 to-indigo-600"
              animated={true}
            />

            <MetricCard
              title="Today's Revenue"
              value={liveStats.todayRevenue}
              change={12.8}
              trend="up"
              icon={<DollarSign className="w-6 h-6 text-foreground" />}
              color="from-green-500 to-emerald-600"
              animated={true}
            />

            <MetricCard
              title="Active Orders"
              value={liveStats.activeOrders}
              change={-2.1}
              trend="down"
              icon={<Utensils className="w-6 h-6 text-foreground" />}
              color="from-orange-500 to-red-600"
              animated={true}
            />

            <MetricCard
              title="Guest Rating"
              value={liveStats.customerSatisfaction}
              change={0.3}
              trend="up"
              icon={<Star className="w-6 h-6 text-foreground" />}
              color="from-purple-500 to-violet-600"
              animated={true}
            />
          </div>
        </div>

        {/* Unified Views Grid - Jobs-style simplicity */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {unifiedViews.map(view => (
            <Card
              key={view.id}
              className={`p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                view.gradient
              } border-2 group ${darkMode ? 'hover:shadow-gray-900/50' : 'hover:shadow-gray-900/10'}`}
              onClick={() => {
                if (view.id === 'tables') {
                  navigateTo('/restaurant/table-management')
                } else if (view.id === 'orders') {
                  navigateTo('/restaurant/orders')
                } else if (view.id === 'reservations') {
                  navigateTo('/restaurant/reservations')
                } else if (view.id === 'customers') {
                  navigateTo('/restaurant/customers')
                } else if (view.id === 'kitchen') {
                  navigateTo('/restaurant/kitchen')
                } else if (view.id === 'analytics') {
                  navigateTo('/restaurant/analytics')
                }
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${view.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {view.icon}
                  <div className="absolute inset-0 bg-background/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {view.notifications && (
                  <Badge className="bg-red-500 text-foreground animate-pulse">
                    {view.notifications}
                  </Badge>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-semibold text-gray-100 group-hover:text-gray-200">
                  {view.title}
                </h3>
                <p className="text-muted-foreground group-hover:text-foreground">{view.subtitle}</p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                {getQuickActions(view.id).map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors group/action"
                    onClick={e => {
                      e.stopPropagation()
                      action.action()
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {action.icon}
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/action:text-muted-foreground group-hover/action:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          ))}
        </div>

        {/* Bottom Status Bar - Minimal but informative */}
        <div
          className={`mt-12 p-4 rounded-2xl ${
            darkMode ? 'bg-muted/50 border-border' : 'bg-background/50 border-border'
          } backdrop-blur-xl border`}
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <StatusIndicator status="success" size="sm" animated={true} />
                <span className={darkMode ? 'text-gray-300' : 'text-muted-foreground'}>
                  Connected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className={darkMode ? 'text-gray-300' : 'text-muted-foreground'}>
                  <AnimatedCounter value={liveStats.staffOnDuty} /> staff on duty
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className={darkMode ? 'text-gray-300' : 'text-muted-foreground'}>
                  <AnimatedCounter value={liveStats.avgWaitTime} />
                  min avg wait
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Powered by HERA</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>Press ⌘K to search</span>
            </div>
          </div>
        </div>
      </main>

      {/* Command Palette - Jobs loved keyboard shortcuts */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-start justify-center pt-32">
          <Card className="w-full max-w-2xl mx-4 p-0 overflow-hidden shadow-2xl">
            <div className="p-4 border-b">
              <div className="relative">
                <Command className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search or jump to..."
                  className="pl-10 border-0 focus:ring-0 text-lg"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              {/* Quick navigation options would go here */}
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Navigate
                </div>
                {unifiedViews.map(view => (
                  <div
                    key={view.id}
                    className="flex items-center space-x-3 px-3 py-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => {
                      setIsCommandPaletteOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    {view.icon}
                    <span>{view.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
