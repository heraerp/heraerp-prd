'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, Users, Settings, Shield, Activity, 
  CreditCard, Database, Bell, ChevronLeft,
  Building2, UserPlus, FileText, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
}

export function OrganizationSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      href: '/organization/dashboard'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      href: '/organization/settings'
    },
    {
      id: 'members',
      label: 'Members',
      icon: <Users className="w-5 h-5" />,
      href: '/organization/members'
    },
    {
      id: 'invitations',
      label: 'Invitations',
      icon: <UserPlus className="w-5 h-5" />,
      href: '/organization/invitations',
      badge: 'New'
    },
    {
      id: 'roles',
      label: 'Roles & Permissions',
      icon: <Shield className="w-5 h-5" />,
      href: '/organization/roles'
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/organization/billing'
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: <Activity className="w-5 h-5" />,
      href: '/organization/activity'
    },
    {
      id: 'data',
      label: 'Data Management',
      icon: <Database className="w-5 h-5" />,
      href: '/organization/data'
    }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white border-r flex flex-col items-center py-4 shadow-sm">
      {/* Back Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mb-6"
              onClick={() => router.push('/salon')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Back to App</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Organization Icon */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-2">
        <TooltipProvider>
          {sidebarItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    size="icon"
                    className={`relative ${
                      isActive(item.href) 
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-100' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {typeof item.badge === 'number' ? item.badge : '!'}
                      </span>
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </div>
  )
}