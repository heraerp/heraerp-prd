/**
 * Role-Based Navigation Component
 * Smart Code: HERA.RBAC.NAVIGATION.v1
 * 
 * SAP Fiori-inspired navigation with role-based access control
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  Calculator,
  ShoppingCart,
  Users,
  Package,
  Building2,
  Settings,
  BarChart3,
  FileText,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Grid3X3,
  Home,
  Shield,
  AlertTriangle
} from 'lucide-react'

interface NavigationModule {
  id: string
  name: string
  href: string
  icon: React.ComponentType<any>
  description: string
  spaceId: string
  requiredPermissions?: string[]
  color: string
  badge?: string | number
}

export function RoleBasedNavigation() {
  const { user } = useHERAAuth()
  const userId = user?.id || 'demo-user'
  
  const {
    accessibleSpaces,
    canAccessSpace,
    hasPermission,
    hasRole,
    userRoles,
    isLoading
  } = useAccessControl({ userId })

  const [isAppsOpen, setIsAppsOpen] = useState(false)

  // Define all possible navigation modules
  const allModules: NavigationModule[] = [
    {
      id: 'enterprise-home',
      name: 'Enterprise Portal',
      href: '/enterprise/home',
      icon: Home,
      description: 'Central enterprise dashboard',
      spaceId: 'enterprise',
      color: 'bg-blue-600'
    },
    {
      id: 'finance',
      name: 'Finance',
      href: '/enterprise/finance/home',
      icon: Calculator,
      description: 'Financial Accounting & Management',
      spaceId: 'finance',
      requiredPermissions: ['finance.invoices'],
      color: 'bg-green-600',
      badge: hasPermission('finance.invoices', 'approve') ? '12' : undefined
    },
    {
      id: 'sales',
      name: 'Sales & Distribution',
      href: '/enterprise/sales/home',
      icon: ShoppingCart,
      description: 'Sales Management & CRM',
      spaceId: 'sales',
      requiredPermissions: ['sales.orders'],
      color: 'bg-blue-600',
      badge: hasPermission('sales.orders', 'approve') ? '8' : undefined
    },
    {
      id: 'hr',
      name: 'Human Resources',
      href: '/enterprise/hr/home',
      icon: Users,
      description: 'HR & Talent Management',
      spaceId: 'hr',
      requiredPermissions: ['hr.employees'],
      color: 'bg-purple-600',
      badge: hasPermission('hr.payroll') ? '23' : undefined
    },
    {
      id: 'materials',
      name: 'Materials Management',
      href: '/enterprise/materials/home',
      icon: Package,
      description: 'Procurement & Inventory',
      spaceId: 'materials',
      requiredPermissions: ['materials.procurement'],
      color: 'bg-orange-600',
      badge: hasPermission('materials.procurement', 'approve') ? '15' : undefined
    },
    {
      id: 'fixed-assets',
      name: 'Fixed Assets',
      href: '/finance1/fixed-assets',
      icon: Building2,
      description: 'Asset Management',
      spaceId: 'finance',
      requiredPermissions: ['finance.assets'],
      color: 'bg-blue-500'
    },
    {
      id: 'admin',
      name: 'System Administration',
      href: '/enterprise/admin',
      icon: Settings,
      description: 'System Configuration',
      spaceId: 'admin',
      requiredPermissions: ['system.admin'],
      color: 'bg-gray-600'
    }
  ]

  // Filter modules based on user access
  const accessibleModules = allModules.filter(module => {
    // Check space access
    if (!canAccessSpace(module.spaceId)) {
      return false
    }

    // Check specific permissions if required
    if (module.requiredPermissions) {
      return module.requiredPermissions.some(permission => hasPermission(permission))
    }

    return true
  })

  // Get role-specific quick actions
  const getRoleSpecificActions = () => {
    const actions = []

    if (hasRole('finance_manager') || hasRole('accounts_payable_clerk')) {
      actions.push({
        name: 'Approve Invoices',
        href: '/enterprise/finance/invoices/approve',
        icon: FileText,
        color: 'bg-green-500',
        badge: '12'
      })
    }

    if (hasRole('sales_manager') || hasRole('sales_rep')) {
      actions.push({
        name: 'Sales Pipeline',
        href: '/enterprise/sales/pipeline',
        icon: BarChart3,
        color: 'bg-blue-500',
        badge: '8'
      })
    }

    if (hasRole('hr_manager') || hasRole('hr_specialist')) {
      actions.push({
        name: 'Employee Requests',
        href: '/enterprise/hr/requests',
        icon: Users,
        color: 'bg-purple-500',
        badge: '5'
      })
    }

    return actions
  }

  const roleSpecificActions = getRoleSpecificActions()

  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="px-4 py-3">
            <div className="flex space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded w-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Top Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* HERA Logo and User Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">HERA</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Enterprise Platform</span>
            </div>
            
            {/* User Role Display */}
            <div className="hidden md:flex items-center space-x-2">
              {userRoles.map((role, index) => (
                <span 
                  key={role.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Global Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search in accessible modules..."
                className="pl-9 pr-4 py-1 border border-gray-300 rounded text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notifications with role-based content */}
            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
              <Bell className="h-4 w-4" />
              {roleSpecificActions.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {roleSpecificActions.length}
                </span>
              )}
            </button>

            {/* Help */}
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* Settings - only if user has admin permissions */}
            {hasPermission('system.admin') && (
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="h-4 w-4" />
              </button>
            )}

            {/* User Avatar */}
            <div className="flex items-center space-x-2 ml-4">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm text-gray-700 hidden md:block">
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-4 py-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Module Navigation */}
          <nav className="flex space-x-1 flex-1">
            {accessibleModules.slice(0, 6).map((module) => {
              const Icon = module.icon
              return (
                <Link
                  key={module.id}
                  href={module.href}
                  className="px-4 py-3 text-sm font-medium rounded-none border-b-2 border-transparent hover:text-gray-900 hover:border-gray-300 transition-all duration-200 text-gray-600 flex items-center space-x-1"
                >
                  <Icon className="h-4 w-4" />
                  <span>{module.name}</span>
                  {module.badge && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                      {module.badge}
                    </span>
                  )}
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
                    <h3 className="text-lg font-semibold text-gray-900">Available Apps</h3>
                    <button
                      onClick={() => setIsAppsOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Role-specific Actions */}
                  {roleSpecificActions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roleSpecificActions.map((action) => {
                          const ActionIcon = action.icon
                          return (
                            <Link
                              key={action.name}
                              href={action.href}
                              onClick={() => setIsAppsOpen(false)}
                              className="p-3 rounded-lg hover:bg-gray-50 transition-colors group text-center"
                            >
                              <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform`}>
                                <ActionIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="text-xs font-medium text-gray-900">{action.name}</div>
                              {action.badge && (
                                <div className="text-xs text-red-600 font-medium">{action.badge} pending</div>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* All Accessible Modules */}
                  <div className="grid grid-cols-3 gap-3">
                    {accessibleModules.map((module) => {
                      const ModuleIcon = module.icon
                      return (
                        <Link
                          key={module.id}
                          href={module.href}
                          onClick={() => setIsAppsOpen(false)}
                          className="p-3 rounded-lg hover:bg-gray-50 transition-colors group text-center"
                        >
                          <div className={`w-10 h-10 ${module.color} rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform`}>
                            <ModuleIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-xs font-medium text-gray-900">{module.name}</div>
                          <div className="text-xs text-gray-500">{module.description}</div>
                        </Link>
                      )
                    })}
                  </div>

                  {accessibleModules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No accessible modules found</p>
                      <p className="text-xs">Contact your administrator for access</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Access Denied Warning */}
      {accessibleModules.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Limited access detected. Contact your system administrator if you need access to additional modules.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}