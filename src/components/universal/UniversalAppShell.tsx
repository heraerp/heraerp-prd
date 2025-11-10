'use client'

/**
 * Universal App Shell Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.APP_SHELL.v1
 * 
 * Complete application shell for generated apps
 * Provides consistent layout, navigation, and theming
 */

import React, { useState, ReactNode } from 'react'
import { 
  Menu, 
  X, 
  Home, 
  Settings, 
  User, 
  Bell,
  Search,
  Plus,
  BarChart3,
  ChevronDown,
  LogOut
} from 'lucide-react'
import { AppBuilderConfig } from '@/lib/universal/universal-app-builder'

interface UniversalAppShellProps {
  config: AppBuilderConfig
  children: ReactNode
  currentPath?: string
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onNavigate?: (path: string) => void
  showSidebar?: boolean
  showHeader?: boolean
}

export function UniversalAppShell({
  config,
  children,
  currentPath = '/',
  user,
  onNavigate,
  showSidebar = true,
  showHeader = true
}: UniversalAppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = path
    }
    setSidebarOpen(false)
  }

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  const themeColors = config.ui_theme || {
    primary_color: '#3b82f6',
    secondary_color: '#64748b',
    accent_color: '#f1f5f9'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {showHeader && (
        <header 
          className="bg-white border-b border-gray-200 sticky top-0 z-50"
          style={{ borderBottomColor: themeColors.accent_color }}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side */}
              <div className="flex items-center">
                {showSidebar && (
                  <button
                    className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                )}
                
                {/* Logo and app name */}
                <div className="flex items-center ml-4 md:ml-0">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: themeColors.primary_color }}
                  >
                    <span className="text-white font-bold text-sm">
                      {config.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 truncate max-w-xs">
                      {config.name}
                    </h1>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      v{config.version}
                    </p>
                  </div>
                </div>
              </div>

              {/* Center - Search */}
              <div className="flex-1 max-w-lg mx-8 hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2">
                {/* Quick actions */}
                {config.navigation.quick_actions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleNavigation(action.path)}
                    className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
                    title={action.label}
                  >
                    <Plus size={20} />
                  </button>
                ))}

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg relative">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User menu */}
                {user && (
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <span className="hidden md:block text-sm font-medium truncate max-w-24">
                        {user.name}
                      </span>
                      <ChevronDown size={16} className="hidden md:block" />
                    </button>

                    {/* User dropdown */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                          <User size={16} />
                          Profile
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                          <Settings size={16} />
                          Settings
                        </button>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <LogOut size={16} />
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar content */}
            <nav className={`
              fixed md:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              ${showHeader ? 'top-16 md:top-0' : 'top-0'}
            `}>
              <div className="flex flex-col h-full">
                {/* Navigation header (mobile only) */}
                <div className="md:hidden px-4 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Main navigation */}
                <div className="flex-1 px-4 py-6 overflow-y-auto">
                  {/* Dashboard link */}
                  <div className="mb-6">
                    <button
                      onClick={() => handleNavigation(`/${config.app_id}`)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                        ${isActive(`/${config.app_id}`) 
                          ? 'text-blue-700 bg-blue-50' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Home size={20} />
                      Dashboard
                    </button>
                  </div>

                  {/* Entities section */}
                  <div className="mb-6">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Master Data
                    </h3>
                    <div className="space-y-1">
                      {config.navigation.main_menu
                        .filter(item => config.entities.some(e => 
                          e.entity_type.toLowerCase().replace(/_/g, '-') === item.id
                        ))
                        .map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.path)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                            ${isActive(item.path) 
                              ? 'text-blue-700 bg-blue-50' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                            }
                          `}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            {/* Icon placeholder - in real app, use dynamic icon rendering */}
                            <div className="w-4 h-4 bg-gray-400 rounded"></div>
                          </div>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transactions section */}
                  <div className="mb-6">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Transactions
                    </h3>
                    <div className="space-y-1">
                      {config.navigation.main_menu
                        .filter(item => config.transactions.some(t => 
                          t.transaction_type.toLowerCase().replace(/_/g, '-') === item.id
                        ))
                        .map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.path)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                            ${isActive(item.path) 
                              ? 'text-blue-700 bg-blue-50' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                            }
                          `}
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            {/* Icon placeholder - in real app, use dynamic icon rendering */}
                            <div className="w-4 h-4 bg-gray-400 rounded"></div>
                          </div>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Analytics section */}
                  <div className="mb-6">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Analytics
                    </h3>
                    <div className="space-y-1">
                      {config.navigation.dashboards.map(dashboard => (
                        <button
                          key={dashboard.dashboard_id}
                          onClick={() => handleNavigation(`/${config.app_id}/dashboard/${dashboard.dashboard_id}`)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                            ${isActive(`/${config.app_id}/dashboard/${dashboard.dashboard_id}`) 
                              ? 'text-blue-700 bg-blue-50' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                            }
                          `}
                        >
                          <BarChart3 size={20} />
                          {dashboard.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 text-center">
                    Powered by HERA
                  </div>
                  <div className="text-xs text-gray-400 text-center mt-1">
                    {config.industry} • v{config.version}
                  </div>
                </div>
              </div>
            </nav>
          </>
        )}

        {/* Main content */}
        <main className={`flex-1 ${showSidebar ? 'md:ml-0' : ''} min-h-screen`}>
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Hook for using app shell context
export function useAppShell() {
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    setNotifications(prev => [...prev, notification])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return {
    loading,
    setLoading,
    notifications,
    showNotification,
    clearNotifications
  }
}