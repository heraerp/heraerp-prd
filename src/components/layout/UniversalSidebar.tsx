'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Plus,
  Sparkles,
  X,
  LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
  color?: string
}

export interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  color?: string
  description: string
}

export interface UniversalSidebarProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  sidebarItems: SidebarItem[]
  quickActions?: QuickAction[]
  brandGradient?: string
  accentGradient?: string
  baseUrl?: string
}

export function UniversalSidebar({
  title,
  subtitle = 'Production',
  icon: Icon,
  sidebarItems,
  quickActions = [],
  brandGradient = 'from-pink-400 to-purple-600',
  accentGradient = 'from-pink-50/90 to-purple-50/90',
  baseUrl = ''
}: UniversalSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure client-side only rendering for Tooltips
  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => {
    // Extract subdomain from current path
    const subdomain = pathname.match(/^\/~([^\/]+)/)?.[1]

    if (subdomain) {
      // Convert href to subdomain path for comparison
      const adjustedHref = baseUrl ? href.replace(baseUrl, `/~${subdomain}${baseUrl}`) : href
      if (href === baseUrl || href === `${baseUrl}/`) {
        return pathname === `/~${subdomain}${baseUrl}` || pathname === `/~${subdomain}${baseUrl}/`
      }
      return pathname.startsWith(adjustedHref)
    } else {
      // Standard path checking
      if (href === baseUrl || href === `${baseUrl}/`) {
        return pathname === baseUrl || pathname === `/org${baseUrl}`
      }
      return (
        pathname.startsWith(href) || pathname.startsWith(href.replace(baseUrl, `/org${baseUrl}`))
      )
    }
  }

  const handleNavigation = (href: string) => {
    setShowQuickActionsModal(false)

    // Extract subdomain from current path
    const subdomain = pathname.match(/^\/~([^\/]+)/)?.[1]

    // Convert relative paths to proper subdomain paths
    if (subdomain && baseUrl && href.startsWith(baseUrl)) {
      const adjustedHref = href.replace(baseUrl, `/~${subdomain}${baseUrl}`)
      router.push(adjustedHref)
    } else if (subdomain && href.startsWith('/')) {
      // For other absolute paths, prepend subdomain
      router.push(`/~${subdomain}${href}`)
    } else {
      // Default navigation
      router.push(href)
    }
  }

  if (!mounted) {
    return <div className={`w-16 bg-gradient-to-b ${accentGradient} border-r`} />
  }

  return (
    <TooltipProvider>
      <div
        className={`
          ${isExpanded ? 'w-64' : 'w-16'}
          bg-gradient-to-b ${accentGradient}
          backdrop-blur-md
          h-screen 
          fixed 
          left-0 
          top-0 
          z-50 
          flex 
          flex-col
          transition-all 
          duration-300 
          ease-in-out
          border-r
          border-pink-200/50
          shadow-lg
          sidebar-wrapper
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${!isExpanded && 'justify-center'}`}>
              <div
                className={`w-8 h-8 bg-gradient-to-br ${brandGradient} rounded-lg flex items-center justify-center`}
              >
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              {isExpanded && (
                <div className="ml-3">
                  <h1
                    className={`text-lg font-bold bg-gradient-to-r ${brandGradient} bg-clip-text text-transparent`}
                  >
                    {title}
                  </h1>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="px-3 py-2">
            {isExpanded && (
              <Button
                onClick={() => setShowQuickActionsModal(true)}
                className={`w-full bg-gradient-to-r ${brandGradient} hover:from-pink-600 hover:to-purple-600 text-foreground shadow-lg hover:shadow-xl transition-all duration-200`}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Quick Actions
              </Button>
            )}
            {!isExpanded && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowQuickActionsModal(true)}
                    className={`w-10 h-10 p-0 bg-gradient-to-r ${brandGradient} hover:from-pink-600 hover:to-purple-600 text-foreground shadow-lg hover:shadow-xl transition-all duration-200`}
                    size="sm"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Quick Actions</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 pb-20 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            {sidebarItems.map(item => {
              const active = isActive(item.href)
              const ItemButton = (
                <Button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full 
                    ${!isExpanded ? 'justify-center p-0 h-10' : 'justify-start'}
                    ${
                      active
                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-purple-700 shadow-md border border-purple-200/50'
                        : 'bg-background/50 hover:bg-background/80 text-gray-700'
                    }
                    ${item.color}
                    transition-all 
                    duration-200
                    relative
                    group
                    backdrop-blur-sm
                  `}
                  variant="ghost"
                  size={isExpanded ? 'sm' : 'icon'}
                >
                  <div
                    className={`${isExpanded ? 'mr-3' : ''} ${active ? 'text-purple-600' : 'text-muted-foreground'}`}
                  >
                    {item.icon}
                  </div>
                  {isExpanded && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge
                          className={`ml-auto bg-gradient-to-r ${brandGradient} text-foreground border-0`}
                          variant="secondary"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {active && (
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${brandGradient} rounded-r-full`}
                    />
                  )}
                </Button>
              )

              return isExpanded ? (
                ItemButton
              ) : (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>{ItemButton}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                    {item.badge && (
                      <span className="ml-2 text-xs text-purple-600">({item.badge})</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t ${accentGradient} to-transparent backdrop-blur-sm`}
        >
          <div className={`${isExpanded ? 'space-y-2' : 'space-y-1'}`}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="w-10 h-10 p-0 bg-background/50 hover:bg-background/80 text-muted-foreground hover:text-slate-800 border border-pink-200/50 hover:shadow-lg hover:scale-105 transition-all duration-200 backdrop-blur-sm"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="w-10 h-10 p-0 bg-background/20 hover:bg-background/40 text-muted-foreground hover:text-slate-800 border-none hover:shadow-lg hover:scale-105 transition-all duration-200 backdrop-blur-sm"
                  onClick={() => handleNavigation(`${baseUrl}/settings`)}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Quick Actions Modal */}
      {quickActions.length > 0 && (
        <Dialog open={showQuickActionsModal} onOpenChange={setShowQuickActionsModal}>
          <DialogContent
            className={`max-w-3xl bg-gradient-to-br ${accentGradient} border-purple-200`}
          >
            <DialogHeader>
              <DialogTitle
                className={`text-2xl font-bold bg-gradient-to-r ${brandGradient} bg-clip-text text-transparent`}
              >
                Quick Actions
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {quickActions.map(item => (
                <Button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`h-24 flex flex-col items-center justify-center gap-2 bg-background/80 hover:bg-background text-gray-700 hover:shadow-lg transition-all duration-200 border border-purple-200/50 ${item.color}`}
                  variant="outline"
                >
                  <div className="text-purple-600">{item.icon}</div>
                  <span className="font-medium text-sm">{item.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {item.description}
                  </span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  )
}
