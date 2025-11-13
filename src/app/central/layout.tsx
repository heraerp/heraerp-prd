/**
 * ================================================================================
 * HERA CENTRAL: Main Layout with Three-Layer Navigation
 * Smart Code: HERA.PLATFORM.CENTRAL.UI.LAYOUT.MAIN.v1
 * ================================================================================
 * 
 * Enterprise-grade navigation system for platform management:
 * - First Layer: Top-level tiles (Overview, Apps, Orgs, Policies, etc.)
 * - Second Layer: Sub-navigation within each domain
 * - Third Layer: Fiori-style workspaces
 * 
 * Features:
 * - Role-based navigation access
 * - Real-time health indicators
 * - Platform-wide search
 * - AI agent integration
 * - Mobile-responsive design
 * ================================================================================
 */

'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Package, 
  Building2, 
  Shield, 
  Database, 
  Brain, 
  Activity, 
  Settings,
  Search,
  Bell,
  User,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'

// =============================================================================
// NAVIGATION CONFIGURATION
// =============================================================================

const FIRST_LAYER_NAVIGATION = [
  {
    id: 'overview',
    name: 'Overview & Health',
    description: 'Platform status and health monitoring',
    icon: LayoutDashboard,
    url: '/central/overview',
    color: 'blue',
    permissions: ['PLATFORM_VIEW']
  },
  {
    id: 'apps',
    name: 'Apps & Modules',
    description: 'Application registry and marketplace',
    icon: Package,
    url: '/central/apps',
    color: 'purple',
    permissions: ['APP_MANAGE']
  },
  {
    id: 'organizations',
    name: 'Organizations',
    description: 'Tenant organization management',
    icon: Building2,
    url: '/central/orgs',
    color: 'green',
    permissions: ['ORG_MANAGE']
  },
  {
    id: 'policies',
    name: 'Policies & Guardrails',
    description: 'Platform-wide policies and compliance',
    icon: Shield,
    url: '/central/policies',
    color: 'red',
    permissions: ['POLICY_MANAGE']
  },
  {
    id: 'master-data',
    name: 'Master Data Hub',
    description: 'Global configuration and templates',
    icon: Database,
    url: '/central/master-data',
    color: 'indigo',
    permissions: ['MASTER_DATA_MANAGE']
  },
  {
    id: 'ai-studio',
    name: 'AI Studio',
    description: 'AI agents and automation',
    icon: Brain,
    url: '/central/ai-studio',
    color: 'orange',
    permissions: ['AI_MANAGE']
  },
  {
    id: 'monitoring',
    name: 'Observability',
    description: 'Health monitoring and analytics',
    icon: Activity,
    url: '/central/monitoring',
    color: 'teal',
    permissions: ['MONITORING_VIEW']
  },
  {
    id: 'settings',
    name: 'Platform Settings',
    description: 'System configuration and preferences',
    icon: Settings,
    url: '/central/settings',
    color: 'gray',
    permissions: ['PLATFORM_ADMIN']
  }
]

// =============================================================================
// LAYOUT COMPONENT
// =============================================================================

export default function CentralLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(3) // Placeholder
  
  // Determine active navigation section
  const activeSection = FIRST_LAYER_NAVIGATION.find(nav => 
    pathname.startsWith(nav.url)
  )

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Platform Title */}
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center ml-2 md:ml-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-slate-900">HERA CENTRAL</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">Platform Management</p>
                </div>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Global Search */}
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search organizations, apps, policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:block">Platform Admin</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* User Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      Profile Settings
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      Platform Logs
                    </a>
                    <div className="border-t border-slate-200 mt-1 pt-1">
                      <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        Sign Out
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar Navigation */}
        <nav className="hidden md:block w-64 bg-white border-r border-slate-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Platform Management
            </h2>
            
            <div className="space-y-2">
              {FIRST_LAYER_NAVIGATION.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.url)
                
                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-3 w-5 h-5 flex-shrink-0
                      ${isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}
                    `} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Platform Status */}
            <div className="mt-8 p-4 bg-green-50 rounded-md">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="ml-2 text-sm font-medium text-green-800">Platform Healthy</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                All services operational
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 space-y-3">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Quick Stats
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-lg font-bold text-slate-900">47</div>
                  <div className="text-xs text-slate-600">Organizations</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-lg font-bold text-slate-900">12</div>
                  <div className="text-xs text-slate-600">Applications</div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu */}
            <div className="fixed left-0 top-0 w-64 h-full bg-white border-r border-slate-200 z-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <span className="ml-2 text-lg font-bold text-slate-900">HERA CENTRAL</span>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {FIRST_LAYER_NAVIGATION.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.url)
                    
                    return (
                      <Link
                        key={item.id}
                        href={item.url}
                        className={`
                          group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200 w-full
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }
                        `}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className={`
                          mr-3 w-5 h-5 flex-shrink-0
                          ${isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}
                        `} />
                        <div>
                          <div className="truncate">{item.name}</div>
                          <div className="text-xs text-slate-500 truncate">{item.description}</div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Page Header */}
          {activeSection && (
            <div className="bg-white border-b border-slate-200">
              <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center
                    bg-gradient-to-br from-${activeSection.color}-400 to-${activeSection.color}-600
                  `}>
                    <activeSection.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold text-slate-900">{activeSection.name}</h1>
                    <p className="text-slate-600">{activeSection.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}