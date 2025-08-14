'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  DollarSign, 
  BarChart3,
  FileText, 
  CreditCard, 
  Receipt,
  Wallet,
  Building,
  Target,
  Calculator,
  Settings,
  Bell,
  Home,
  CheckCircle
} from 'lucide-react'

export function FinancialTeamsSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: '/financial-progressive',
      badge: null
    },
    {
      id: 'gl',
      label: 'General Ledger',
      icon: FileText,
      path: '/financial-progressive/gl',
      badge: null
    },
    {
      id: 'ar',
      label: 'Accounts Receivable',
      icon: CreditCard,
      path: '/financial-progressive/ar',
      badge: null
    },
    {
      id: 'ap',
      label: 'Accounts Payable',
      icon: Receipt,
      path: '/financial-progressive/ap',
      badge: null
    },
    {
      id: 'cash',
      label: 'Cash Management',
      icon: Wallet,
      path: '/financial-progressive/cash',
      badge: null
    },
    {
      id: 'assets',
      label: 'Fixed Assets',
      icon: Building,
      path: '/financial-progressive/assets',
      badge: null
    },
    {
      id: 'budget',
      label: 'Budgeting',
      icon: Target,
      path: '/financial-progressive/budget',
      badge: null
    },
    {
      id: 'tax',
      label: 'Tax Management',
      icon: Calculator,
      path: '/financial-progressive/tax',
      badge: 'NEW'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/financial-progressive') {
      return pathname === '/financial-progressive'
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
        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <DollarSign className="w-6 h-6 text-white" />
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
                  ? 'bg-green-600 text-white shadow-lg' 
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
            title="Financial Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Financial Alerts
              <div className="text-red-300 text-xs mt-1">3 new alerts</div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/dashboard')}
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
            title="Financial Settings"
          >
            <Settings className="w-4 h-4" />
            <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Financial Settings
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
              <div className="text-green-300 text-xs mt-1">All modules operational</div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}