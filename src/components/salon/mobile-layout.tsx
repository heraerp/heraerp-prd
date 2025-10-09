/**
 * Mobile-Optimized Salon Layout
 *
 * Touch-friendly layout with bottom navigation, gesture support,
 * and tablet-optimized salon management interface.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Home,
  DollarSign,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Plus,
  Menu,
  Bell,
  Search,
  Crown,
  Scissors,
  Sparkles,
  CreditCard,
  UserPlus,
  Clock,
  Star,
  Zap,
  TrendingUp,
  Building
} from 'lucide-react'

interface NavigationItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
  color: string
}

interface MobileLayoutProps {
  children: React.ReactNode
  showBottomNav?: boolean
  showHeader?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    href: '/salon/dashboard',
    label: 'Dashboard',
    icon: <Home className="h-5 w-5" />,
    color: 'text-purple-600'
  },
  {
    href: '/salon/finance-entry',
    label: 'Finance',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'text-green-600'
  },
  {
    href: '/salon/calendar',
    label: 'Calendar',
    icon: <Calendar className="h-5 w-5" />,
    badge: 3,
    color: 'text-blue-600'
  },
  {
    href: '/salon/team-management',
    label: 'Team',
    icon: <Users className="h-5 w-5" />,
    color: 'text-rose-600'
  },
  {
    href: '/salon/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'text-orange-600'
  },
  {
    href: '/salon/trial-balance',
    label: 'Trial Balance',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-amber-600'
  },
  {
    href: '/salon/profit-loss',
    label: 'P&L',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'text-emerald-600'
  },
  {
    href: '/salon/balance-sheet',
    label: 'Balance Sheet',
    icon: <Building className="h-5 w-5" />,
    color: 'text-indigo-600'
  }
]

const quickActions = [
  {
    href: '/salon/bookings/new',
    label: 'New Booking',
    icon: <Plus className="h-5 w-5" />,
    color: 'bg-purple-500'
  },
  {
    href: '/salon/pos',
    label: 'POS',
    icon: <CreditCard className="h-5 w-5" />,
    color: 'bg-green-500'
  },
  {
    href: '/salon/clients/new',
    label: 'Add Client',
    icon: <UserPlus className="h-5 w-5" />,
    color: 'bg-blue-500'
  },
  {
    href: '/salon/checkin',
    label: 'Check-In',
    icon: <Clock className="h-5 w-5" />,
    color: 'bg-orange-500'
  }
]

export function MobileLayout({
  children,
  showBottomNav = true,
  showHeader = true
}: MobileLayoutProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900">
      {/* Mobile Header */}
      {showHeader && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-purple-100/50 dark:bg-gray-900/80 dark:border-purple-800/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <MobileSidebar />
                </SheetContent>
              </Sheet>

              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
                    Luxe Salon
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="relative">
                <Search className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>

              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/owner.jpg" alt="Owner" />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs">
                  AS
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
      )}

      {/* Quick Actions Bar (Mobile/Tablet) */}
      <div className="lg:hidden sticky top-16 z-40 bg-white/70 backdrop-blur-sm border-b border-purple-100/30 dark:bg-gray-900/70 dark:border-purple-800/30">
        <div className="flex items-center justify-center px-4 py-2 space-x-3 overflow-x-auto">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                size="sm"
                className={cn(
                  'flex-shrink-0 rounded-xl text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200',
                  action.color
                )}
              >
                <div className="flex items-center space-x-2">
                  {action.icon}
                  <span className="text-xs font-medium">{action.label}</span>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className={cn('flex-1', showBottomNav ? 'pb-20' : '', 'px-4 py-6 md:px-6 lg:px-8')}>
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-purple-100/50 dark:bg-gray-900/95 dark:border-purple-800/50 md:hidden">
          <div className="flex items-center justify-around py-2">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link key={index} href={item.href} className="flex-1">
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-1 transition-all duration-200',
                      isActive ? 'transform scale-110' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'relative p-2 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-purple-100 dark:bg-purple-900/50 scale-110'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <div
                        className={cn(
                          'transition-colors duration-200',
                          isActive ? item.color : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {item.icon}
                      </div>

                      {item.badge && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white border-white">
                          {item.badge}
                        </Badge>
                      )}
                    </div>

                    <span
                      className={cn(
                        'text-xs font-medium mt-1 transition-colors duration-200',
                        isActive ? item.color : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}

function MobileSidebar() {
  const pathname = usePathname()

  const sidebarSections = [
    {
      title: 'Main',
      items: [
        { href: '/salon/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
        { href: '/salon/calendar', label: 'Appointments', icon: <Calendar className="h-5 w-5" /> },
        { href: '/salon/pos', label: 'Point of Sale', icon: <CreditCard className="h-5 w-5" /> },
        { href: '/salon/clients', label: 'Client Management', icon: <Users className="h-5 w-5" /> }
      ]
    },
    {
      title: 'Finance',
      items: [
        {
          href: '/salon/finance-entry',
          label: 'Transaction Entry',
          icon: <DollarSign className="h-5 w-5" />
        },
        { href: '/salon/accountant', label: 'Accounting', icon: <BarChart3 className="h-5 w-5" /> },
        {
          href: '/salon/finance/reports',
          label: 'Financial Reports',
          icon: <BarChart3 className="h-5 w-5" />
        }
      ]
    },
    {
      title: 'Management',
      items: [
        {
          href: '/salon/team-management',
          label: 'Team Management',
          icon: <Users className="h-5 w-5" />
        },
        { href: '/salon/inventory', label: 'Inventory', icon: <Sparkles className="h-5 w-5" /> },
        { href: '/salon/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> }
      ]
    }
  ]

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-purple-100/50 dark:border-purple-800/50">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
              Luxe Salon
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Management Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4">
        {sidebarSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h3 className="px-6 mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link key={itemIndex} href={item.href}>
                    <div
                      className={cn(
                        'flex items-center space-x-3 px-6 py-3 mx-3 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <div
                        className={cn(
                          'transition-colors duration-200',
                          isActive ? 'text-purple-600 dark:text-purple-400' : ''
                        )}
                      >
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-6 border-t border-purple-100/50 dark:border-purple-800/50">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/avatars/owner.jpg" alt="Owner" />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              AS
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              Alexandra Smith
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Owner & Manager</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Responsive Grid Component for Salon Cards
export function ResponsiveGrid({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  className
}: {
  children: React.ReactNode
  cols?: { sm?: number; md?: number; lg?: number; xl?: number }
  className?: string
}) {
  // Use conditional classes to ensure proper Tailwind generation
  const getGridCols = (breakpoint: string, num: number) => {
    const colMap: { [key: string]: string } = {
      '1': 'grid-cols-1',
      '2': 'grid-cols-2',
      '3': 'grid-cols-3',
      '4': 'grid-cols-4',
      '5': 'grid-cols-5',
      '6': 'grid-cols-6'
    }

    const mdColMap: { [key: string]: string } = {
      '1': 'md:grid-cols-1',
      '2': 'md:grid-cols-2',
      '3': 'md:grid-cols-3',
      '4': 'md:grid-cols-4',
      '5': 'md:grid-cols-5',
      '6': 'md:grid-cols-6'
    }

    const lgColMap: { [key: string]: string } = {
      '1': 'lg:grid-cols-1',
      '2': 'lg:grid-cols-2',
      '3': 'lg:grid-cols-3',
      '4': 'lg:grid-cols-4',
      '5': 'lg:grid-cols-5',
      '6': 'lg:grid-cols-6'
    }

    const xlColMap: { [key: string]: string } = {
      '1': 'xl:grid-cols-1',
      '2': 'xl:grid-cols-2',
      '3': 'xl:grid-cols-3',
      '4': 'xl:grid-cols-4',
      '5': 'xl:grid-cols-5',
      '6': 'xl:grid-cols-6'
    }

    if (breakpoint === 'sm') return colMap[num.toString()] || 'grid-cols-1'
    if (breakpoint === 'md') return mdColMap[num.toString()] || 'md:grid-cols-2'
    if (breakpoint === 'lg') return lgColMap[num.toString()] || 'lg:grid-cols-3'
    if (breakpoint === 'xl') return xlColMap[num.toString()] || 'xl:grid-cols-4'
    return ''
  }

  const gridClasses = cn(
    'grid gap-4 md:gap-6',
    getGridCols('sm', cols.sm || 1),
    getGridCols('md', cols.md || 2),
    getGridCols('lg', cols.lg || 3),
    getGridCols('xl', cols.xl || 4),
    className
  )

  return <div className={gridClasses}>{children}</div>
}

// Mobile-Optimized Container
export function MobileContainer({
  children,
  maxWidth = 'xl',
  padding = true
}: {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}) {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidth === 'sm'
          ? 'max-w-sm'
          : maxWidth === 'md'
            ? 'max-w-md'
            : maxWidth === 'lg'
              ? 'max-w-lg'
              : maxWidth === 'xl'
                ? 'max-w-xl'
                : maxWidth === '2xl'
                  ? 'max-w-2xl'
                  : 'max-w-full',
        padding ? 'px-4 sm:px-6 lg:px-8' : ''
      )}
    >
      {children}
    </div>
  )
}

export default MobileLayout
