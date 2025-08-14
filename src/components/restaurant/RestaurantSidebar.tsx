'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  CreditCard,
  ChefHat,
  Package,
  ShoppingCart,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Receipt,
  Utensils,
  Clock,
  TrendingUp,
  FileText,
  AlertCircle,
  Menu,
  X
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
  alert?: boolean
}

export function RestaurantSidebar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)

  const sidebarItems: SidebarItem[] = [
    { 
      id: 'pos', 
      label: 'POS Terminal', 
      icon: <CreditCard className="h-5 w-5" />, 
      href: '/restaurant-pos' 
    },
    { 
      id: 'kds', 
      label: 'Kitchen Display', 
      icon: <ChefHat className="h-5 w-5" />, 
      href: '/restaurant-pos/kitchen',
      badge: 8,
      alert: true
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: <Package className="h-5 w-5" />, 
      href: '/restaurant-pos/inventory' 
    },
    { 
      id: 'ordering', 
      label: 'Online Orders', 
      icon: <ShoppingCart className="h-5 w-5" />, 
      href: '/restaurant-pos/online-orders',
      badge: 3
    },
    { 
      id: 'reservations', 
      label: 'Reservations', 
      icon: <Calendar className="h-5 w-5" />, 
      href: '/restaurant-pos/reservations',
      badge: 12
    },
    { 
      id: 'staff', 
      label: 'Staff', 
      icon: <Users className="h-5 w-5" />, 
      href: '/restaurant-pos/staff' 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: <BarChart3 className="h-5 w-5" />, 
      href: '/restaurant-pos/analytics' 
    },
    { 
      id: 'menu', 
      label: 'Menu Setup', 
      icon: <Utensils className="h-5 w-5" />, 
      href: '/restaurant-pos/menu' 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: <FileText className="h-5 w-5" />, 
      href: '/restaurant-pos/reports' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="h-5 w-5" />, 
      href: '/restaurant-pos/settings' 
    }
  ]

  const quickActions = [
    { icon: <Receipt className="h-4 w-4" />, label: 'Cash Out' },
    { icon: <Clock className="h-4 w-4" />, label: 'Clock In/Out' },
    { icon: <AlertCircle className="h-4 w-4" />, label: '86 List' }
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-40",
        "flex flex-col",
        isExpanded ? "w-64" : "w-16",
        "md:w-16 hover:w-64 group"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <span className={cn(
              "font-bold text-lg transition-opacity duration-200",
              isExpanded ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
            )}>
              RestaurantOS
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative",
                    "hover:bg-gray-800",
                    isActive && "bg-gray-800 text-orange-400"
                  )}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  <span className={cn(
                    "flex-1 transition-opacity duration-200",
                    isExpanded ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                  )}>
                    {item.label}
                  </span>
                  
                  {item.badge && (
                    <div className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2",
                      "bg-orange-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1",
                      item.alert && "animate-pulse",
                      !isExpanded && "md:group-hover:opacity-100 md:opacity-0"
                    )}>
                      {item.badge}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className={cn(
            "mt-6 pt-6 border-t border-gray-800 space-y-1",
            !isExpanded && "md:group-hover:opacity-100 md:opacity-0"
          )}>
            <p className="text-xs text-gray-500 uppercase px-3 mb-2">Quick Actions</p>
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-800 w-full text-left"
              >
                {action.icon}
                <span className="text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Stats */}
        <div className={cn(
          "p-4 border-t border-gray-800",
          !isExpanded && "md:group-hover:opacity-100 md:opacity-0"
        )}>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Today's Sales</span>
              <span className="font-medium">$12,847</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active Tables</span>
              <span className="font-medium">14/32</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Kitchen Time</span>
              <span className="font-medium text-green-400">12m avg</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}