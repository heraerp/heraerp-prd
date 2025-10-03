'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  Calendar,
  Users,
  Scissors,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  Sparkles,
  Star,
  Heart,
  Palette,
  Clock,
  User,
  Gift,
  Zap,
  Crown,
  Award,
  X,
  DollarSign,
  TrendingUp,
  Calculator,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Package,
  FileText,
  PieChart,
  Receipt,
  Wallet,
  Building2,
  Activity,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
  color?: string
}

export function SalonProductionSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)
  const [showMoreApps, setShowMoreApps] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure client-side only rendering for Tooltips
  useEffect(() => {
    setMounted(true)
  }, [])

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      href: '/salon',
      color: 'hover:bg-blue-100'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <Calendar className="w-5 h-5" />,
      href: '/salon/appointments1',
      badge: '12',
      color: 'hover:bg-green-100'
    },
    {
      id: 'reception',
      label: 'Reception',
      icon: <Clock className="w-5 h-5" />,
      href: '/salon/reception',
      badge: 'Live',
      color: 'hover:bg-orange-100'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      href: '/salon/whatsapp',
      badge: '3',
      color: 'hover:bg-green-100'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <Users className="w-5 h-5" />,
      href: '/salon/clients',
      badge: 'New',
      color: 'hover:bg-purple-100'
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Scissors className="w-5 h-5" />,
      href: '/salon/services',
      color: 'hover:bg-pink-100'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <Palette className="w-5 h-5" />,
      href: '/salon/categories',
      color: 'hover:bg-purple-100'
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: <User className="w-5 h-5" />,
      href: '/salon/staff',
      color: 'hover:bg-orange-100'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Sparkles className="w-5 h-5" />,
      href: '/salon/inventory',
      badge: '5',
      color: 'hover:bg-yellow-100'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/salon/payments',
      color: 'hover:bg-emerald-100'
    },
    {
      id: 'loyalty',
      label: 'Loyalty Program',
      icon: <Crown className="w-5 h-5" />,
      href: '/salon/loyalty',
      badge: 'VIP',
      color: 'hover:bg-indigo-100'
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <Zap className="w-5 h-5" />,
      href: '/salon/marketing',
      color: 'hover:bg-cyan-100'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/salon/reports',
      color: 'hover:bg-teal-100'
    }
  ]

  const isActive = (href: string) => {
    // Extract subdomain from current path
    const subdomain = pathname.match(/^\/~([^\/]+)/)?.[1]

    if (subdomain) {
      // Convert href to subdomain path for comparison
      const adjustedHref = href.replace('/salon', `/~${subdomain}/salon`)
      if (href === '/salon') {
        return pathname === `/~${subdomain}/salon` || pathname === `/~${subdomain}/salon/`
      }
      return pathname.startsWith(adjustedHref)
    } else {
      // Standard path checking
      if (href === '/salon') {
        return pathname === '/salon' || pathname === '/org/salon'
      }
      return pathname.startsWith(href) || pathname.startsWith(href.replace('/salon', '/org/salon'))
    }
  }

  const quickActionItems = [
    {
      id: 'new-appointment',
      label: 'New Appointment',
      icon: <Calendar className="w-5 h-5" />,
      href: '/salon/appointments?action=new',
      color: 'hover:bg-blue-100',
      description: 'Schedule a new appointment'
    },
    {
      id: 'new-client',
      label: 'Add Client',
      icon: <User className="w-5 h-5" />,
      href: '/salon/clients?action=new',
      color: 'hover:bg-purple-100',
      description: 'Register a new client'
    },
    {
      id: 'new-service',
      label: 'Add Service',
      icon: <Scissors className="w-5 h-5" />,
      href: '/salon/services?action=new',
      color: 'hover:bg-pink-100',
      description: 'Create a new service offering'
    },
    {
      id: 'pos',
      label: 'Point of Sale',
      icon: <ShoppingCart className="w-5 h-5" />,
      href: '/salon/pos',
      color: 'hover:bg-orange-100',
      description: 'Salon POS for services and products'
    },
    {
      id: 'inventory-restock',
      label: 'Restock Items',
      icon: <Sparkles className="w-5 h-5" />,
      href: '/salon/inventory?action=restock',
      color: 'hover:bg-yellow-100',
      description: 'Update inventory stock levels'
    },
    {
      id: 'loyalty-rewards',
      label: 'Loyalty Points',
      icon: <Crown className="w-5 h-5" />,
      href: '/salon/loyalty?action=points',
      color: 'hover:bg-indigo-100',
      description: 'Manage customer rewards'
    },
    {
      id: 'marketing-campaign',
      label: 'Send Promotion',
      icon: <Zap className="w-5 h-5" />,
      href: '/salon/marketing?action=campaign',
      color: 'hover:bg-cyan-100',
      description: 'Launch marketing campaign'
    },
    {
      id: 'daily-report',
      label: "Today's Report",
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/salon/reports?period=today',
      color: 'hover:bg-teal-100',
      description: "View today's performance"
    }
  ]

  const handleNavigation = (href: string) => {
    setShowQuickActionsModal(false)

    // Extract subdomain from current path
    const subdomain = pathname.match(/^\/~([^\/]+)/)?.[1]

    // Convert relative salon paths to proper subdomain paths
    if (subdomain && href.startsWith('/salon')) {
      const adjustedHref = href.replace('/salon', `/~${subdomain}/salon`)
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
    return <div className="w-16 bg-gradient-to-b from-pink-50 to-purple-50 border-r" />
  }

  return (
    <TooltipProvider>
      <div
        className={`${isExpanded ? 'w-64' : 'w-16'}
          bg-gradient-to-b from-pink-50/90 to-purple-50/90 
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
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${!isExpanded && 'justify-center'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-foreground" />
              </div>
              {isExpanded && (
                <div className="ml-3">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Salon Pro
                  </h1>
                  <p className="text-xs text-muted-foreground">Production</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-3 py-2">
          {isExpanded && (
            <Button
              onClick={() => setShowQuickActionsModal(true)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 !text-foreground dark:!text-foreground shadow-lg hover:shadow-xl transition-all duration-200"
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
                  className="w-10 h-10 p-0 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 !text-foreground dark:!text-foreground shadow-lg hover:shadow-xl transition-all duration-200"
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

        {/* Navigation Items */}
        <nav className="flex-1 px-3 pb-20 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            {sidebarItems.map(item => {
              const active = isActive(item.href)
              const ItemButton = (
                <Button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full ${!isExpanded ? 'justify-center p-0 h-10' : 'justify-start'}
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
                      <span className="font-medium text-gray-100">{item.label}</span>
                      {item.badge && (
                        <Badge
                          className="ml-auto bg-gradient-to-r from-pink-500 to-purple-500 !text-foreground dark:!text-foreground border-0"
                          variant="secondary"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-purple-600 rounded-r-full" />
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

          {/* More Apps Section */}
          <div className="mt-6 pt-6 border-t border-pink-200/50">
            {isExpanded ? (
              <Button
                onClick={() => setShowMoreApps(!showMoreApps)}
                className={`w-full justify-start bg-gradient-to-r from-purple-100/50 to-pink-100/50 hover:from-purple-200/50 hover:to-pink-200/50 ink transition-all duration-200 relative group backdrop-blur-sm`}
                variant="ghost"
                size="sm"
              >
                <div className="mr-3 text-purple-600">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-medium">More Apps</span>
                <ChevronRight
                  className={`ml-auto w-4 h-4 transition-transform ${showMoreApps ? 'rotate-90' : ''}`}
                />
              </Button>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowMoreApps(!showMoreApps)}
                    className={`w-10 h-10 p-0 bg-gradient-to-r from-purple-100/50 to-pink-100/50 hover:from-purple-200/50 hover:to-pink-200/50 ink transition-all duration-200 relative group backdrop-blur-sm`}
                    variant="ghost"
                    size="icon"
                  >
                    <Plus className="w-5 h-5 text-purple-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>More Apps</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Expandable Apps List */}
            {showMoreApps && (
              <div className="mt-2 space-y-1">
                {/* Finance App */}
                {isExpanded ? (
                  <Button
                    onClick={() => handleNavigation('/salon/finance')}
                    className="w-full justify-start bg-background/50 hover:bg-green-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                    variant="ghost"
                    size="sm"
                  >
                    <div className="mr-3 text-green-600">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Finance</span>
                  </Button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleNavigation('/salon/finance')}
                        className="w-10 h-10 p-0 bg-background/50 hover:bg-green-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                        variant="ghost"
                        size="icon"
                      >
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Finance</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Costing App */}
                {isExpanded ? (
                  <Button
                    onClick={() => handleNavigation('/salon/costing')}
                    className="w-full justify-start bg-background/50 hover:bg-blue-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                    variant="ghost"
                    size="sm"
                  >
                    <div className="mr-3 text-primary">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Costing</span>
                  </Button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleNavigation('/salon/costing')}
                        className="w-10 h-10 p-0 bg-background/50 hover:bg-blue-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                        variant="ghost"
                        size="icon"
                      >
                        <Calculator className="w-5 h-5 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Costing</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Profitability App */}
                {isExpanded ? (
                  <Button
                    onClick={() => handleNavigation('/salon/profitability')}
                    className="w-full justify-start bg-background/50 hover:bg-emerald-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                    variant="ghost"
                    size="sm"
                  >
                    <div className="mr-3 text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Profitability</span>
                  </Button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleNavigation('/salon/profitability')}
                        className="w-10 h-10 p-0 bg-background/50 hover:bg-emerald-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                        variant="ghost"
                        size="icon"
                      >
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Profitability</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Accounting App */}
                {isExpanded ? (
                  <Button
                    onClick={() => handleNavigation('/salon/accounting')}
                    className="w-full justify-start bg-background/50 hover:bg-indigo-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                    variant="ghost"
                    size="sm"
                  >
                    <div className="mr-3 text-indigo-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Accounting</span>
                  </Button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleNavigation('/salon/accounting')}
                        className="w-10 h-10 p-0 bg-background/50 hover:bg-indigo-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                        variant="ghost"
                        size="icon"
                      >
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Accounting</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Analytics App */}
                {isExpanded ? (
                  <Button
                    onClick={() => handleNavigation('/salon/analytics')}
                    className="w-full justify-start bg-background/50 hover:bg-orange-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                    variant="ghost"
                    size="sm"
                  >
                    <div className="mr-3 text-orange-600">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Analytics</span>
                  </Button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleNavigation('/salon/analytics')}
                        className="w-10 h-10 p-0 bg-background/50 hover:bg-orange-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                        variant="ghost"
                        size="icon"
                      >
                        <PieChart className="w-5 h-5 text-orange-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Analytics</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Operations App */}
                {isExpanded ? (
                  <Button
                    onClick={() => handleNavigation('/salon/operations')}
                    className="w-full justify-start bg-background/50 hover:bg-teal-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                    variant="ghost"
                    size="sm"
                  >
                    <div className="mr-3 text-teal-600">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Operations</span>
                  </Button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleNavigation('/salon/operations')}
                        className="w-10 h-10 p-0 bg-background/50 hover:bg-teal-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                        variant="ghost"
                        size="icon"
                      >
                        <Activity className="w-5 h-5 text-teal-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Operations</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* HR Management App */}
                {isExpanded ? (
                  <Button
                    onClick={() => handleNavigation('/salon/hr')}
                    className="w-full justify-start bg-background/50 hover:bg-rose-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                    variant="ghost"
                    size="sm"
                  >
                    <div className="mr-3 text-rose-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="font-medium">HR Management</span>
                  </Button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleNavigation('/salon/hr')}
                        className="w-10 h-10 p-0 bg-background/50 hover:bg-rose-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                        variant="ghost"
                        size="icon"
                      >
                        <Building2 className="w-5 h-5 text-rose-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>HR Management</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Cash Management App */}
                {isExpanded ? (
                  <Button
                    onClick={() => handleNavigation('/salon/cash')}
                    className="w-full justify-start bg-background/50 hover:bg-amber-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                    variant="ghost"
                    size="sm"
                  >
                    <div className="mr-3 text-amber-600">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Cash Management</span>
                  </Button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleNavigation('/salon/cash')}
                        className="w-10 h-10 p-0 bg-background/50 hover:bg-amber-100 ink transition-all duration-200 relative group backdrop-blur-sm"
                        variant="ghost"
                        size="icon"
                      >
                        <Wallet className="w-5 h-5 text-amber-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Cash Management</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-purple-50/90 to-transparent backdrop-blur-sm">
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
                  onClick={() => handleNavigation('/salon/settings')}
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
      <Dialog open={showQuickActionsModal} onOpenChange={setShowQuickActionsModal}>
        <DialogContent className="max-w-3xl bg-gradient-to-br from-pink-50 to-purple-50 border-purple-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Quick Actions
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {quickActionItems.map(item => (
              <Button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`h-24 flex flex-col items-center justify-center gap-2 bg-background/80 hover:bg-background ink hover:shadow-lg transition-all duration-200 border border-purple-200/50 ${item.color}`}
                variant="outline"
              >
                <div className="text-purple-600">{item.icon}</div>
                <span className="font-medium text-sm text-gray-100">{item.label}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {item.description}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
