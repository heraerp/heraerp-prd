// ================================================================================
// HERA APP LAYOUT WITH SIDEBAR
// Smart Code: HERA.LAYOUT.APP.v1
// App shell with enterprise sidebar
// ================================================================================

'use client'

import React, { useState } from 'react'
import { AuthenticatedOnly } from '@/src/lib/auth/guard'
import { OrganizationProvider } from '@/src/components/organization/OrganizationProvider'
import { EnterpriseSidebar } from '@/src/components/layout/EnterpriseSidebar'
import { Menu } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthenticatedOnly>
      <OrganizationProvider>
        <div className="min-h-screen bg-gray-900 flex">
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar - Fixed on desktop, overlay on mobile */}
          <div className={`
            fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <EnterpriseSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Mobile header */}
            <div className="lg:hidden bg-gray-800 border-b border-gray-700 px-4 h-16 flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
              <span className="ml-3 text-lg font-semibold text-white">HERA Enterprise</span>
            </div>

            {/* Page content */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </OrganizationProvider>
    </AuthenticatedOnly>
  )
}