'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, Calendar, Users, Scissors, CreditCard, 
  BarChart3, Settings, Bell, Search, Plus,
  Sparkles, Star, Heart, Palette, Clock,
  User, Gift, Zap, Crown, Award, X,
  DollarSign, TrendingUp, Calculator, ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
  color?: string
}

export function SalonTeamsSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed:', showQuickActionsModal)
  }, [showQuickActionsModal])

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      href: '/salon-progressive',
      color: 'hover:bg-blue-100'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <Calendar className="w-5 h-5" />,
      href: '/salon-progressive/appointments',
      badge: '12',
      color: 'hover:bg-green-100'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <Users className="w-5 h-5" />,
      href: '/salon-progressive/clients',
      badge: 'New',
      color: 'hover:bg-purple-100'
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Scissors className="w-5 h-5" />,
      href: '/salon-progressive/services',
      color: 'hover:bg-pink-100'
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: <User className="w-5 h-5" />,
      href: '/salon-progressive/staff',
      color: 'hover:bg-orange-100'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Sparkles className="w-5 h-5" />,
      href: '/salon-progressive/inventory',
      badge: '5',
      color: 'hover:bg-yellow-100'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/salon-progressive/payments',
      color: 'hover:bg-emerald-100'
    },
    {
      id: 'loyalty',
      label: 'Loyalty Program',
      icon: <Crown className="w-5 h-5" />,
      href: '/salon-progressive/loyalty',
      badge: 'VIP',
      color: 'hover:bg-indigo-100'
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <Zap className="w-5 h-5" />,
      href: '/salon-progressive/marketing',
      color: 'hover:bg-cyan-100'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/salon-progressive/reports',
      color: 'hover:bg-teal-100'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/salon-progressive') {
      return pathname === '/salon-progressive'
    }
    return pathname.startsWith(href)
  }

  const quickActionItems = [
    {
      id: 'new-appointment',
      label: 'New Appointment',
      icon: <Calendar className="w-5 h-5" />,
      href: '/salon-progressive/appointments?action=new',
      color: 'hover:bg-blue-100',
      description: 'Schedule a new appointment'
    },
    {
      id: 'new-client',
      label: 'Add Client',
      icon: <User className="w-5 h-5" />,
      href: '/salon-progressive/clients?action=new',
      color: 'hover:bg-purple-100',
      description: 'Register a new client'
    },
    {
      id: 'new-service',
      label: 'Add Service',
      icon: <Scissors className="w-5 h-5" />,
      href: '/salon-progressive/services?action=new',
      color: 'hover:bg-pink-100',
      description: 'Create a new service offering'
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: <DollarSign className="w-5 h-5" />,
      href: '/financial',
      color: 'hover:bg-green-100',
      description: 'Financial management and accounting'
    },
    {
      id: 'profitability',
      label: 'Profitability',
      icon: <TrendingUp className="w-5 h-5" />,
      href: '/profitability-progressive',
      color: 'hover:bg-emerald-100',
      description: 'Profit analysis and margin tracking'
    },
    {
      id: 'costing',
      label: 'Financial Reports',
      icon: <Calculator className="w-5 h-5" />,
      href: '/financial/reports',
      color: 'hover:bg-blue-100',
      description: 'Financial reports and analysis'
    },
    {
      id: 'pos',
      label: 'Point of Sale',
      icon: <ShoppingCart className="w-5 h-5" />,
      href: '/salon-progressive/pos',
      color: 'hover:bg-orange-100',
      description: 'Salon POS for services and products'
    },
    {
      id: 'inventory-restock',
      label: 'Restock Items',
      icon: <Sparkles className="w-5 h-5" />,
      href: '/salon-progressive/inventory?action=restock',
      color: 'hover:bg-yellow-100',
      description: 'Update inventory stock levels'
    },
    {
      id: 'loyalty-rewards',
      label: 'Loyalty Points',
      icon: <Crown className="w-5 h-5" />,
      href: '/salon-progressive/loyalty?action=points',
      color: 'hover:bg-indigo-100',
      description: 'Manage customer rewards'
    },
    {
      id: 'marketing-campaign',
      label: 'Send Promotion',
      icon: <Zap className="w-5 h-5" />,
      href: '/salon-progressive/marketing?action=campaign',
      color: 'hover:bg-cyan-100',
      description: 'Launch marketing campaign'
    },
    {
      id: 'daily-report',
      label: 'Today\'s Report',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/salon-progressive/reports?period=today',
      color: 'hover:bg-teal-100',
      description: 'View today\'s performance'
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
    setShowQuickActionsModal(false) // Close modal when navigating
  }

  return (
    <TooltipProvider>
      <div className="fixed left-0 top-0 h-full w-16 bg-white/20 backdrop-blur-xl border-r border-white/20 shadow-2xl shadow-black/10 z-40 flex flex-col">
        {/* Enterprise HERA Logo/Brand */}
        <div className="p-3 border-b border-white/20">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 bg-gradient-to-br from-indigo-500/90 to-purple-600/90 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/20 backdrop-blur-sm border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-200 group"
          >
            <span className="text-white font-black text-xl drop-shadow-sm group-hover:scale-110 transition-transform">H</span>
          </button>
        </div>

        {/* Enterprise Navigation Items */}
        <nav className="flex-1 py-4 space-y-2 px-2">
          {sidebarItems.map((item) => (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    relative w-full p-2 flex items-center justify-center group
                    transition-all duration-200 rounded-xl
                    ${isActive(item.href) 
                      ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 shadow-lg shadow-pink-500/10' 
                      : 'hover:bg-white/30 hover:backdrop-blur-sm hover:scale-105 hover:shadow-lg'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-lg transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg backdrop-blur-sm'
                      : 'text-slate-600 group-hover:text-slate-800 group-hover:bg-white/40'
                    }
                  `}>
                    {item.icon}
                  </div>
                  
                  {/* Enterprise Badge */}
                  {item.badge && (
                    <div className="absolute -top-1 -right-1">
                      <Badge 
                        className={`text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center font-medium border ${
                          typeof item.badge === 'number' 
                            ? 'bg-red-500/20 text-red-800 border-red-500/30 backdrop-blur-sm' 
                            : 'bg-blue-500/20 text-blue-800 border-blue-500/30 backdrop-blur-sm'
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Active Indicator */}
                  {isActive(item.href) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-600 rounded-r-full shadow-lg" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg text-slate-800">
                <p className="font-semibold">{item.label}</p>
                {item.badge && (
                  <p className="text-xs text-slate-600">
                    {typeof item.badge === 'number' ? `${item.badge} notifications` : item.badge}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Enterprise Bottom Actions */}
        <div className="border-t border-white/20 p-3 space-y-3">
          {/* Enterprise Quick Actions Modal */}
          <Dialog open={showQuickActionsModal} onOpenChange={setShowQuickActionsModal}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  console.log('Plus button clicked, current modal state:', showQuickActionsModal)
                  setShowQuickActionsModal(true)
                }}
                className="w-10 h-10 p-0 bg-gradient-to-r from-pink-500/90 to-purple-600/90 hover:from-pink-600 hover:to-purple-700 text-white shadow-xl shadow-pink-500/20 hover:shadow-2xl hover:scale-105 transition-all duration-200 backdrop-blur-sm border border-white/20"
                title="Quick Actions (11 shortcuts)"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
              <DialogHeader className="pb-6">
                <DialogTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-lg">
                    <Sparkles className="h-6 w-6 text-pink-600" />
                  </div>
                  <span className="text-xl font-bold">Quick Actions</span>
                </DialogTitle>
                <p className="text-sm text-slate-600 font-medium">Choose an action to get started quickly and efficiently</p>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {quickActionItems.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleNavigation(action.href)}
                    className="p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:bg-white/80 hover:shadow-lg hover:scale-[1.02] text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-slate-100/80 to-slate-200/80 rounded-xl group-hover:from-pink-50 group-hover:to-purple-50 transition-all duration-200 shadow-sm">
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-800 mb-1">{action.label}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Enterprise Notifications */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="w-10 h-10 p-0 relative bg-white/20 hover:bg-white/40 text-slate-600 hover:text-slate-800 border-none hover:shadow-lg hover:scale-105 transition-all duration-200 backdrop-blur-sm"
              >
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg text-slate-800">
              <p className="font-semibold">Notifications</p>
              <p className="text-xs text-slate-600">3 new messages</p>
            </TooltipContent>
          </Tooltip>

          {/* Enterprise Settings */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="w-10 h-10 p-0 bg-white/20 hover:bg-white/40 text-slate-600 hover:text-slate-800 border-none hover:shadow-lg hover:scale-105 transition-all duration-200 backdrop-blur-sm"
                onClick={() => handleNavigation('/salon-progressive/settings')}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg text-slate-800">
              <p className="font-semibold">Settings</p>
              <p className="text-xs text-slate-600">Configure your salon</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}