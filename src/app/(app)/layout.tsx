// ================================================================================
// HERA APP LAYOUT WITH SIDEBAR
// Smart Code: HERA.LAYOUT.APP.v1
// App shell with enterprise sidebar
// ================================================================================

'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthenticatedOnly, usePermissions } from '@/lib/auth/guard'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { navItems, getDefaultBranding } from '@/lib/config/navigation'
import { createApiClient } from '@/lib/api/client'
import { Menu, X, LogOut } from 'lucide-react'
import Link from 'next/link'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, currentOrganization, signOut  } = useHERAAuth()
  const { hasRole } = usePermissions()
  const apiClient = createApiClient()

  // Get role-based navigation
  const userRole = user?.role || 'customer'
  const navigation = navItems(userRole as any)

  // Get branding
  const branding = apiClient.getTenantBranding() || getDefaultBranding()

  // Handle demo exit
  const handleExitDemo = async () => {
    if (apiClient.isDemoMode()) {
      sessionStorage.removeItem('isDemoLogin')
      sessionStorage.removeItem('demoModule')
      router.push('/demo')
    } else {
      await signOut()
    }
  }

  return (
    <AuthenticatedOnly>
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-white flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <div
          className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        >
          <div className="w-64 bg-gradient-to-b from-violet-900 to-pink-900 h-full flex flex-col">
            {/* Logo Section */}
            <div className="p-6 border-b border-violet-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{branding.companyName}</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg text-violet-200 hover:bg-violet-700/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-violet-200 mt-1">
                {currentOrganization?.name || 'Demo Mode'}
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? 'bg-white/20 text-white shadow-md'
                          : 'text-violet-200 hover:bg-violet-700/30 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-1 text-xs bg-pink-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-violet-700">
              <div className="flex items-center justify-between mb-3 px-2">
                <div>
                  <p className="text-sm font-medium text-white">{user?.name || user?.email}</p>
                  <p className="text-xs text-violet-300 capitalize">{user?.role || 'customer'}</p>
                </div>
              </div>
              <button
                onClick={handleExitDemo}
                className="w-full flex items-center justify-center px-4 py-2 bg-violet-700/50 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="text-sm">{apiClient.isDemoMode() ? 'Exit Demo' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile header */}
          <div className="lg:hidden bg-white border-b border-violet-200 px-4 h-16 flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-violet-600 hover:text-violet-800 hover:bg-violet-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="ml-3 text-lg font-semibold text-gray-900">{branding.companyName}</span>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </AuthenticatedOnly>
  )
}
