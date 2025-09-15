'use client'

import React, { useState } from 'react'
import { Button } from './button'
import { ModernModal } from './modern-modal'
import {
  Home,
  Users,
  Calendar,
  MessageCircle,
  Phone,
  FileText,
  MoreHorizontal,
  Target,
  BarChart3,
  Briefcase,
  Star,
  Activity
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
}

const primaryNavItems: NavItem[] = [
  {
    id: 'home',
    name: 'Home',
    description: 'Your personalized dashboard and overview',
    icon: Home,
    href: '/',
    color: 'text-primary',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Customer relationship management',
    icon: Users,
    href: '/crm',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'leads',
    name: 'Leads',
    description: 'Sales leads and prospects',
    icon: Star,
    href: '/crm/leads',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  {
    id: 'opportunities',
    name: 'Deals',
    description: 'Sales pipeline and deal management',
    icon: Target,
    href: '/crm/opportunities',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Schedule meetings and manage time',
    icon: Calendar,
    href: '/calendar',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Team communication and messaging',
    icon: MessageCircle,
    href: '/crm-progressive/chat',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  {
    id: 'calls',
    name: 'Calls',
    description: 'Voice and video communications',
    icon: Phone,
    href: '/crm-progressive/calls',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'files',
    name: 'Files',
    description: 'Document storage and collaboration',
    icon: FileText,
    href: '/crm-progressive/files',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Business insights and reporting',
    icon: BarChart3,
    href: '/crm-progressive/analytics',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  }
]

const additionalNavItems: NavItem[] = [
  {
    id: 'learning',
    name: 'Learning',
    description: 'CA Final and educational content',
    icon: Star,
    href: '/learning/ca-final',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50'
  },
  {
    id: 'procurement',
    name: 'Procurement',
    description: 'Supply chain and purchasing',
    icon: Briefcase,
    href: '/procurement',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },
  {
    id: 'development',
    name: 'Development',
    description: 'System development tools',
    icon: Activity,
    href: '/development',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
]

export function TeamsSidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeItem, setActiveItem] = useState('crm')

  const NavIcon = ({ item, showLabel = false }: { item: NavItem; showLabel?: boolean }) => {
    const Icon = item.icon
    const isActive = activeItem === item.id

    return (
      <Link
        href={item.href}
        className={cn(
          'group relative flex items-center rounded-lg transition-all duration-200 mb-2',
          'hover:bg-muted p-3',
          isActive && 'bg-blue-50 border-l-4 border-blue-600'
        )}
        onClick={() => setActiveItem(item.id)}
        title={!showLabel ? item.name : undefined}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-lg h-8 w-8 flex-shrink-0',
            item.bgColor,
            'group-hover:shadow-md transition-shadow'
          )}
        >
          <Icon className={cn('h-5 w-5', item.color)} />
        </div>

        {showLabel && (
          <div className="ml-3 min-w-0 flex-1 overflow-hidden">
            <p className="font-medium text-gray-900 truncate text-sm">{item.name}</p>
          </div>
        )}

        {/* Active indicator for collapsed state */}
        {!showLabel && isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r" />
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Teams-style Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full bg-background/95 backdrop-blur-xl border-r border-border z-40 transition-all duration-300 shadow-xl',
          isExpanded ? 'w-64' : 'w-16'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-foreground font-bold text-sm">H</span>
            </div>
            {isExpanded && (
              <div className="ml-3 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">HERA ERP</p>
                <p className="text-xs text-muted-foreground truncate">Business Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-2 overflow-y-auto h-full pb-20">
          {/* Primary Applications */}
          <div className="mb-6">
            {isExpanded && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                Core Apps
              </h3>
            )}
            {primaryNavItems.map(item => (
              <NavIcon key={item.id} item={item} showLabel={isExpanded} />
            ))}
          </div>

          {/* Additional Applications */}
          <div className="mb-6">
            {isExpanded && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                Business Modules
              </h3>
            )}
            {additionalNavItems.map(item => (
              <NavIcon key={item.id} item={item} showLabel={isExpanded} />
            ))}
          </div>

          {/* More Apps Section */}
          {isExpanded && (
            <div className="border-t border-border pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-gray-800 hover:bg-muted"
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
              'w-full justify-center hover:bg-muted transition-all duration-200',
              isExpanded ? 'justify-start' : 'p-2'
            )}
          >
            <div
              className={cn(
                'h-6 w-6 border-2 border-gray-400 rounded flex items-center justify-center transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            >
              <div className="w-0 h-0 border-l-[4px] border-l-gray-400 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5" />
            </div>
            {isExpanded && <span className="ml-3 text-sm text-muted-foreground">Collapse</span>}
          </Button>
        </div>
      </div>
    </>
  )
}
