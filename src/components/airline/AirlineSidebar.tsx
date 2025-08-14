'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { 
  Plane, Search, Ticket, Trophy, CreditCard, Star, BarChart3,
  Bell, Settings, CheckCircle, ChevronRight, Gift, Calendar,
  Users, Shield, MapPin, Clock, Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SidebarItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ElementType
  url: string
  badge?: string
  badgeColor?: string
  notification?: boolean
}

export function AirlineSidebar() {
  const pathname = usePathname()
  
  const mainItems: SidebarItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: BarChart3,
      url: '/airline'
    },
    {
      id: 'search',
      title: 'Flight Search',
      subtitle: '2.3M searches',
      icon: Search,
      url: '/airline/search'
    },
    {
      id: 'bookings',
      title: 'My Bookings',
      subtitle: '847K bookings',
      icon: Ticket,
      url: '/airline/bookings'
    },
    {
      id: 'lottery',
      title: 'Upgrade Lottery',
      subtitle: '12K winners',
      icon: Trophy,
      url: '/airline/lottery',
      badge: 'Beta',
      badgeColor: 'bg-yellow-100 text-yellow-700',
      notification: true
    },
    {
      id: 'checkin',
      title: 'Check-In',
      subtitle: '1.2M check-ins',
      icon: CreditCard,
      url: '/airline/checkin'
    },
    {
      id: 'loyalty',
      title: 'Loyalty Program',
      subtitle: '3.7M members',
      icon: Star,
      url: '/airline/loyalty'
    },
    {
      id: 'analytics',
      title: 'Travel Analytics',
      subtitle: 'Real-time',
      icon: BarChart3,
      url: '/airline/analytics'
    }
  ]

  const quickActions: SidebarItem[] = [
    {
      id: 'quick-search',
      title: 'Quick Search',
      icon: Search,
      url: '/airline/search'
    },
    {
      id: 'alerts',
      title: 'Travel Alerts',
      icon: Bell,
      url: '/airline/alerts',
      notification: true
    }
  ]

  const bottomItems: SidebarItem[] = [
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      url: '/airline/settings'
    },
    {
      id: 'status',
      title: 'System Status',
      subtitle: 'All flights operational',
      icon: CheckCircle,
      url: '/airline/status'
    }
  ]

  const isActive = (url: string) => pathname === url || (url !== '/airline' && pathname.startsWith(url))

  return (
    <aside className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-gray-200">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Plane className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-2 px-3">
          {mainItems.map((item) => (
            <button
              key={item.id}
              onClick={() => window.location.href = item.url}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                isActive(item.url)
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm'
              }`}
              title={item.title}
            >
              <item.icon className="w-5 h-5" />
              
              {/* Notification indicator */}
              {item.notification && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              )}
              
              {/* Tooltip */}
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.title}
                {item.subtitle && (
                  <div className="text-gray-300 text-xs mt-1">{item.subtitle}</div>
                )}
                {item.badge && (
                  <div className="mt-1">
                    <Badge className={`text-xs ${item.badgeColor || ''}`}>
                      {item.badge}
                    </Badge>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-6 my-6 h-px bg-gray-200" />

        {/* Quick Actions */}
        <div className="space-y-2 px-3">
          {quickActions.map((item) => (
            <button
              key={item.id}
              onClick={() => window.location.href = item.url}
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title={item.title}
            >
              <item.icon className="w-4 h-4" />
              {item.notification && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.title}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-200">
        <div className="space-y-2">
          {bottomItems.map((item) => (
            <button
              key={item.id}
              onClick={() => window.location.href = item.url}
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title={item.title}
            >
              {item.id === 'status' ? (
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <item.icon className="w-4 h-4" />
              )}
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.title}
                {item.subtitle && (
                  <div className="text-green-300">{item.subtitle}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}