'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { ContextualSidebar } from './ContextualSidebar'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  LogOut,
  ChefHat,
  Menu,
  X,
  Wifi,
  Users,
  Clock,
  Command,
  Settings,
  HelpCircle,
  Zap,
  Activity,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { formatDate } from '@/src/lib/date-utils'

// Steve Jobs: "Simplicity is the ultimate sophistication"

interface JobsStyleLayoutProps {
  children: React.ReactNode
  currentSection?: string
  showSidebar?: boolean
  headerActions?: React.ReactNode
}

export function JobsStyleLayout({
  children,
  currentSection = 'overview',
  showSidebar = true,
  headerActions
}: JobsStyleLayoutProps) {
  const { user, organization, logout } = useMultiOrgAuth()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connected')
  const [isClient, setIsClient] = useState(false)

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false)
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarCollapsed])

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.05) {
        // 5% chance to simulate connection issue
        setConnectionStatus('connecting')
        setTimeout(() => setConnectionStatus('connected'), 2000)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getPageTitle = () => {
    const titles = {
      '/restaurant': 'Overview',
      '/restaurant/table-management': 'Table Management',
      '/restaurant/orders': 'Orders',
      '/restaurant/reservations': 'Reservations',
      '/restaurant/customers': 'Customers',
      '/restaurant/analytics': 'Analytics',
      '/restaurant/settings': 'Settings'
    }
    return titles[pathname as keyof typeof titles] || 'Restaurant'
  }

  return (
    <div
      className={`min-h-screen bg-gray-900 flex transition-all duration-300 ${
        darkMode ? 'bg-background' : 'bg-muted'
      }`}
    >
      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <ContextualSidebar
              currentSection={currentSection}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-background/50 backdrop-blur-sm">
              <div className="w-80 h-full bg-background shadow-2xl">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-gray-100">Menu</h2>
                  <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <ContextualSidebar currentSection={currentSection} isCollapsed={false} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header
          className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all ${
            darkMode ? 'bg-background/95 border-gray-800' : 'bg-background/95 border-border'
          }`}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Page title and mobile menu */}
              <div className="flex items-center space-x-4">
                {showSidebar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <h1
                      className={`text-xl font-semibold ${
                        darkMode ? 'text-foreground' : 'text-gray-100'
                      }`}
                    >
                      {getPageTitle()}
                    </h1>
                    <p className={`text-sm ${darkMode ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {organization?.organization_name} •{' '}
                      {isClient ? formatDate(currentTime, 'MMM d, h:mm a') : '...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Center: Search */}
              <div className="hidden md:block flex-1 max-w-md mx-8">
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
                    className={`pl-10 rounded-full border-0 transition-all ${
                      darkMode
                        ? 'bg-muted text-foreground placeholder-gray-400 focus:bg-muted-foreground/10'
                        : 'bg-muted text-gray-100 placeholder-gray-500 focus:bg-background focus:shadow-md'
                    }`}
                    onFocus={() => setIsCommandPaletteOpen(true)}
                  />
                </div>
              </div>

              {/* Right: Actions and status */}
              <div className="flex items-center space-x-3">
                {/* Custom header actions */}
                {headerActions}

                {/* Connection Status */}
                <div className="hidden md:flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected'
                        ? 'bg-green-500 animate-pulse'
                        : connectionStatus === 'connecting'
                          ? 'bg-yellow-500 animate-pulse'
                          : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-muted-foreground'
                    }`}
                  >
                    {connectionStatus === 'connected'
                      ? 'Live'
                      : connectionStatus === 'connecting'
                        ? 'Connecting...'
                        : 'Offline'}
                  </span>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-foreground text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </Button>

                {/* Theme Toggle */}
                <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                {/* Settings */}
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>

                {/* Logout */}
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>

        {/* Status Bar */}
        <div
          className={`border-t px-6 py-2 ${
            darkMode ? 'bg-background border-gray-800' : 'bg-background border-border'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Wifi
                  className={`w-3 h-3 ${
                    connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'
                  }`}
                />
                <span className={darkMode ? 'text-muted-foreground' : 'text-muted-foreground'}>
                  {connectionStatus === 'connected' ? 'Connected' : 'Connection issues'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-3 h-3 text-blue-500" />
                <span className={darkMode ? 'text-muted-foreground' : 'text-muted-foreground'}>
                  15 staff online
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-purple-500" />
                <span className={darkMode ? 'text-muted-foreground' : 'text-muted-foreground'}>
                  Last sync: {isClient ? formatDate(currentTime, 'HH:mm:ss') : '--:--:--'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className={darkMode ? 'text-muted-foreground' : 'text-muted-foreground'}>
                Press ⌘K to search • ⌘B to toggle sidebar
              </span>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className={darkMode ? 'text-muted-foreground' : 'text-muted-foreground'}>HERA Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-start justify-center pt-32">
          <Card className="w-full max-w-2xl mx-4 overflow-hidden shadow-2xl">
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
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </div>
                <CommandItem icon={<Zap className="w-4 h-4" />} label="New Order" hotkey="⌘N" />
                <CommandItem
                  icon={<Users className="w-4 h-4" />}
                  label="Table Management"
                  hotkey="⌘2"
                />
                <CommandItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Reservations"
                  hotkey="⌘4"
                />
                <CommandItem icon={<Settings className="w-4 h-4" />} label="Settings" hotkey="⌘," />
                <CommandItem icon={<HelpCircle className="w-4 h-4" />} label="Help" hotkey="⌘?" />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Command palette item component
function CommandItem({
  icon,
  label,
  hotkey,
  onClick
}: {
  icon: React.ReactNode
  label: string
  hotkey?: string
  onClick?: () => void
}) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {hotkey && (
        <span className="text-xs text-muted-foreground font-mono group-hover:text-muted-foreground">{hotkey}</span>
      )}
    </div>
  )
}
