'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Plane, 
  BarChart3,
  Search, 
  Ticket, 
  Trophy,
  CheckCircle,
  Star,
  Settings,
  Bell,
  Home
} from 'lucide-react'

export function AirlineTeamsSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: '/airline-progressive',
      badge: null
    },
    {
      id: 'search',
      label: 'Flight Search',
      icon: Search,
      path: '/airline-progressive/search',
      badge: null
    },
    {
      id: 'bookings',
      label: 'My Bookings',
      icon: Ticket,
      path: '/airline-progressive/bookings',
      badge: null
    },
    {
      id: 'checkin',
      label: 'Check-In',
      icon: CheckCircle,
      path: '/airline-progressive/checkin',
      badge: null
    },
    {
      id: 'lottery',
      label: 'Upgrade Lottery',
      icon: Trophy,
      path: '/airline-progressive/lottery',
      badge: 'HOT'
    },
    {
      id: 'loyalty',
      label: 'Loyalty Program',
      icon: Star,
      path: '/airline-progressive/loyalty',
      badge: null
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/airline-progressive/analytics',
      badge: null
    }
  ]

  const isActive = (path: string) => {
    if (path === '/airline-progressive') {
      return pathname === '/airline-progressive'
    }
    return pathname.startsWith(path)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-gray-50 border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <Plane className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4">
        <div className="space-y-2 px-3">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              
              {/* Badge for special items */}
              {item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              )}
              
              {/* Tooltip */}
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.label}
                {item.badge && (
                  <div className="text-yellow-300 text-xs mt-1">{item.badge}</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-6 my-6 h-px bg-gray-200" />

        {/* Quick Actions */}
        <div className="space-y-2 px-3">
          <button 
            className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
            title="Travel Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Travel Alerts
              <div className="text-red-300 text-xs mt-1">2 new alerts</div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/')}
            className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
            title="HERA Dashboard"
          >
            <Home className="w-4 h-4" />
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              HERA Dashboard
            </div>
          </button>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-200">
        <div className="space-y-2">
          {/* Settings */}
          <button 
            className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          </button>

          {/* System Status */}
          <button 
            className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
            title="System Status: All Active"
          >
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              System Status
              <div className="text-green-300 text-xs mt-1">All flights operational</div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}