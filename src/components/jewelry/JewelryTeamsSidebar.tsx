'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Home, Users, Calendar, MessageCircle, Phone, 
  FileText, MoreHorizontal,
  Target, BarChart3, Briefcase,
  Star, Activity, Wrench
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface NavItem {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
  bgColor: string
  badge?: number | string
}

const primaryNavItems: NavItem[] = [
  {
    id: 'home',
    name: 'Home',
    description: 'Your jewelry business dashboard',
    icon: Home,
    href: '/jewelry-progressive',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'pos',
    name: 'Point of Sale', 
    description: 'Process jewelry sales and transactions',
    icon: MessageCircle,
    href: '/jewelry-progressive/pos',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Jewelry catalog and stock management',
    icon: Briefcase,
    href: '/jewelry-progressive/inventory',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    badge: 3
  },
  {
    id: 'repair',
    name: 'Repair Jobs',
    description: 'Jewelry repairs and custom orders',
    icon: Wrench,
    href: '/jewelry-progressive/repair',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    badge: 4
  },
  {
    id: 'customers',
    name: 'Customers',
    description: 'VIP clients and customer profiles',
    icon: Users,
    href: '/jewelry-progressive/customers',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    badge: 2
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Schedule appointments and consultations',
    icon: Calendar,
    href: '/jewelry-progressive/appointments',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    badge: 5
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Business insights and reporting',
    icon: BarChart3,
    href: '/jewelry-progressive/analytics',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
]

const additionalNavItems: NavItem[] = [
  {
    id: 'appointments',
    name: 'Appointments',
    description: 'Interactive calendar with business analytics',
    icon: Calendar,
    href: '/jewelry-progressive/reports',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50'
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Business configuration',
    icon: Target,
    href: '/jewelry-progressive/settings',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  }
]

export function JewelryTeamsSidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeItem, setActiveItem] = useState('home')

  const NavIcon = ({ item, showLabel = false }: { item: NavItem; showLabel?: boolean }) => {
    const Icon = item.icon
    const isActive = activeItem === item.id
    
    return (
      <Link 
        href={item.href}
        className={cn(
          "group relative flex items-center rounded-lg transition-all duration-200 mb-2",
          "hover:bg-purple-50 p-3",
          isActive && "bg-purple-100 border-l-4 border-purple-600"
        )}
        onClick={() => setActiveItem(item.id)}
        title={!showLabel ? item.name : undefined}
      >
        <div className={cn(
          "flex items-center justify-center rounded-lg h-8 w-8 flex-shrink-0",
          item.bgColor,
          "group-hover:shadow-md transition-shadow"
        )}>
          <Icon className={cn("h-5 w-5", item.color)} />
        </div>
        
        {showLabel && (
          <div className="ml-3 min-w-0 flex-1 overflow-hidden">
            <p className="font-medium text-gray-900 truncate text-sm">{item.name}</p>
          </div>
        )}

        {/* Active indicator for collapsed state */}
        {!showLabel && isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r" />
        )}

        {/* Badge indicator */}
        {item.badge && (
          <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {item.badge}
          </div>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Teams-style Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-200 z-40 transition-all duration-300 shadow-xl",
        isExpanded ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            {isExpanded && (
              <div className="ml-3 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">HERA Jewelry</p>
                <p className="text-xs text-gray-500 truncate">Progressive Workspace</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-2 overflow-y-auto h-full pb-20">
          {/* Primary Applications */}
          <div className="mb-6">
            {isExpanded && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Jewelry Operations
              </h3>
            )}
            {primaryNavItems.map((item) => (
              <NavIcon key={item.id} item={item} showLabel={isExpanded} />
            ))}
          </div>

          {/* Additional Applications */}
          <div className="mb-6">
            {isExpanded && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Business Tools
              </h3>
            )}
            {additionalNavItems.map((item) => (
              <NavIcon key={item.id} item={item} showLabel={isExpanded} />
            ))}
          </div>

          {/* More Apps Section */}
          {isExpanded && (
            <div className="border-t border-gray-200 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <MoreHorizontal className="h-4 w-4 mr-3" />
                More apps
              </Button>
            </div>
          )}
        </div>

        {/* Expand/Collapse Toggle */}
        <div className="absolute bottom-4 left-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full justify-center hover:bg-purple-100 transition-all duration-200",
              isExpanded ? "justify-start" : "p-2"
            )}
          >
            <div className={cn(
              "h-6 w-6 border-2 border-purple-400 rounded flex items-center justify-center transition-transform duration-200",
              isExpanded && "rotate-180"
            )}>
              <div className="w-0 h-0 border-l-[4px] border-l-purple-400 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5" />
            </div>
            {isExpanded && (
              <span className="ml-3 text-sm text-gray-600">Collapse</span>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}