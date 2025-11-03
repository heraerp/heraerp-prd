'use client'

/**
 * Dynamic Enterprise Navigation Component
 * Smart Code: HERA.ENTERPRISE.NAVIGATION.DYNAMIC.v1
 * 
 * Dynamic navigation that reads from hera-navigation.json
 * Maintains the three-level structure: Header > Module Tabs > Content
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useNavigationConfig } from '@/hooks/useNavigationConfig'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  Search,
  Bell,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  Grid3X3,
  Home,
  LucideIcon
} from 'lucide-react'

// Icon mapping for dynamic icon resolution
const ICON_MAP: Record<string, LucideIcon> = {
  'home': Home,
  'banknote': Home, // fallback
  'shopping-cart': Home, // fallback  
  'trending-up': Home, // fallback
  'building-2': Home, // fallback
  'shield': Home, // fallback
  'calculator': Home, // fallback
  'factory': Home, // fallback
  'boxes': Home, // fallback
  'badge-dollar': Home, // fallback
  'check-circle': Home, // fallback
  'wrench': Settings, // fallback
  'kanban': Home, // fallback
  'headset': Home, // fallback
  'package-open': Home, // fallback
  'users': Home // fallback
}

function DynamicEnterpriseNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const navigation = useNavigationConfig()
  const { user, organization } = useHERAAuth()
  const [isAppsOpen, setIsAppsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Get available modules from navigation config
  const availableModules = Object.entries(navigation.availableModules).map(([code, config]) => ({
    id: code.toLowerCase(),
    name: config.name,
    href: navigation.currentIndustry 
      ? `${navigation.currentIndustry.route_prefix}/${code.toLowerCase()}`
      : `/enterprise/${code.toLowerCase()}`,
    icon: ICON_MAP[config.icon] || Home,
    description: `${config.name} operations and management`,
    roles: ['all']
  }))

  // Add My Home as first item
  const modules = [
    {
      id: 'my-home',
      name: 'My Home',
      href: navigation.currentIndustry 
        ? `${navigation.currentIndustry.route_prefix}`
        : '/enterprise/home',
      icon: Home,
      description: 'Personal dashboard and shortcuts',
      roles: ['all']
    },
    ...availableModules
  ]

  // Generate apps from all available operations
  const allApps = Object.entries(navigation.availableModules).flatMap(([moduleCode, moduleConfig]) =>
    moduleConfig.areas.flatMap(area =>
      area.operations.map(operation => ({
        id: `${moduleCode.toLowerCase()}-${area.code.toLowerCase()}-${operation.code.toLowerCase()}`,
        name: operation.name,
        href: operation.route,
        icon: ICON_MAP[area.icon] || Home,
        description: `${operation.name} for ${area.name}`,
        category: moduleConfig.name,
        color: 'bg-violet-500'
      }))
    )
  )

  const filteredApps = allApps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get industry context for display
  const industryContext = navigation.currentIndustry 
    ? {
        name: navigation.currentIndustry.name,
        prefix: navigation.currentIndustry.route_prefix
      }
    : {
        name: 'HERA Cloud ERP',
        prefix: '/enterprise'
      }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Top Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* HERA Logo and Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">HERA</span>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">All products</span>
              <span className="text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">{industryContext.name}</span>
              {navigation.currentIndustry && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm text-blue-600 font-medium">
                    {navigation.currentIndustry.name} Edition
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Global Search */}
            <div className="relative">
              <div className="flex items-center space-x-2">
                <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white">
                  <option>Apps</option>
                  <option>Data</option>
                  <option>Help</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search in Apps"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1 border border-gray-300 rounded text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <HelpCircle className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="h-4 w-4" />
              </button>
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-700">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-0">
          <div className="flex items-center max-w-7xl mx-auto">
            {/* Module Navigation */}
            <nav className="flex space-x-1 flex-1">
              {modules.map((module) => {
                const Icon = module.icon
                const isActive = pathname.startsWith(module.href) || 
                  (module.id === 'my-home' && pathname === industryContext.prefix)
                
                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    className={`px-4 py-3 text-sm font-medium rounded-none border-b-3 transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 border-blue-600 bg-blue-50'
                        : 'text-gray-700 border-transparent hover:text-blue-600 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <Icon className="h-4 w-4" />
                      <span>{module.name}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Apps Launcher */}
            <div className="relative">
              <button
                onClick={() => setIsAppsOpen(!isAppsOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <Grid3X3 className="h-5 w-5" />
              </button>

              {/* Apps Dropdown */}
              {isAppsOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Apps</h3>
                      <button
                        onClick={() => setIsAppsOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-4 mb-4 border-b">
                      <button className="pb-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                        Favorites
                      </button>
                      <button className="pb-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                        Recently Used
                      </button>
                      <button className="pb-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                        Frequently Used
                      </button>
                    </div>

                    {/* Apps Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {(searchQuery ? filteredApps : allApps.slice(0, 9)).map((app) => {
                        const Icon = app.icon
                        return (
                          <Link
                            key={app.id}
                            href={app.href}
                            onClick={() => setIsAppsOpen(false)}
                            className="p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className={`w-10 h-10 ${app.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900">{app.name}</div>
                                <div className="text-xs text-gray-500">{app.category}</div>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    {searchQuery && filteredApps.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No apps found for "{searchQuery}"</p>
                      </div>
                    )}

                    {/* More Apps Link */}
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        href={`${industryContext.prefix}/apps`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => setIsAppsOpen(false)}
                      >
                        More →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DynamicEnterpriseNavigation }
export default DynamicEnterpriseNavigation