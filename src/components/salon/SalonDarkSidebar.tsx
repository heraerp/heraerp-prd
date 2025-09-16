'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'
import {
  Calendar,
  Users,
  Scissors,
  Package,
  MessageCircle,
  BarChart,
  Settings,
  Heart,
  CreditCard,
  Clock,
  Star,
  Home,
  Sparkles,
  Gift,
  UserPlus,
  FileText,
  TrendingUp,
  Grid3x3,
  ShoppingBag,
  Megaphone,
  Receipt,
  Shield,
  Briefcase,
  Award,
  BookOpen,
  Camera,
  Coffee,
  Palette,
  Zap,
  X,
  CalendarCheck,
  Scale,
  TrendingDown,
  BarChart3,
  DollarSign,
  Brain
} from 'lucide-react'

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
}

// Main sidebar items (reduced for space)
const sidebarItems: SidebarItem[] = [
  { title: 'Home', href: '/salon-data', icon: Home },
  { title: 'Calendar', href: '/salon-data/calendar', icon: Calendar },
  { title: 'Clients', href: '/salon-data/customers', icon: Users },
  { title: 'Services', href: '/salon-data/services', icon: Scissors },
  { title: 'Inventory', href: '/salon-data/inventory', icon: Package },
  { title: 'POS', href: '/salon-data/pos', icon: CreditCard },
  { title: 'Leave', href: '/salon-data/leave', icon: CalendarCheck },
  {
    title: 'Templates',
    href: '/salon-data/templates',
    icon: FileText,
    badge: 'New',
    badgeColor: 'bg-green-500'
  }
]

// All apps for the modal
const allApps: SidebarItem[] = [
  { title: 'Home', href: '/salon-data', icon: Home },
  { title: 'Calendar', href: '/salon-data/calendar', icon: Calendar },
  { title: 'Appointments', href: '/salon-data/appointments', icon: Clock },
  { title: 'Customers', href: '/salon-data/customers', icon: Users },
  { title: 'Services', href: '/salon-data/services', icon: Scissors },
  { title: 'Inventory', href: '/salon-data/inventory', icon: Package },
  { title: 'POS', href: '/salon-data/pos', icon: CreditCard },
  { title: 'Leave', href: '/salon-data/leave', icon: CalendarCheck },
  {
    title: 'Templates',
    href: '/salon-data/templates',
    icon: FileText,
    badge: 'New',
    badgeColor: 'bg-green-500'
  },
  { title: 'UCR Rules', href: '/salon-data/config', icon: Scale },
  { title: 'Finance', href: '/salon-data/finance', icon: TrendingDown },
  { title: 'P&L', href: '/salon-data/financials/p&l', icon: BarChart3 },
  { title: 'Balance Sheet', href: '/salon-data/financials/bs', icon: Scale },
  { title: 'Payroll', href: '/salon-data/payroll', icon: DollarSign },
  { title: 'WhatsApp', href: '/salon-data/whatsapp', icon: MessageCircle },
  {
    title: 'Smart Accountant',
    href: '/salon-data/digital-accountant',
    icon: Brain,
    badge: 'AI',
    badgeColor: 'bg-purple-500'
  },
  { title: 'Analytics', href: '/salon-data/analytics', icon: BarChart },
  { title: 'Team', href: '/salon-data?tab=team', icon: UserPlus },
  { title: 'Products', href: '/salon-data/products', icon: ShoppingBag },
  { title: 'Payments', href: '/salon-data/payments', icon: CreditCard },
  { title: 'Promotions', href: '/salon-data/promotions', icon: Gift },
  { title: 'Reviews', href: '/salon-data/reviews', icon: Star },
  { title: 'Marketing', href: '/salon-data/marketing', icon: Megaphone },
  { title: 'Invoices', href: '/salon-data/invoices', icon: Receipt },
  { title: 'Security', href: '/salon-data/security', icon: Shield },
  { title: 'HR Portal', href: '/salon-data/hr', icon: Briefcase },
  { title: 'Rewards', href: '/salon-data/rewards', icon: Award },
  { title: 'Training', href: '/salon-data/training', icon: BookOpen },
  { title: 'Gallery', href: '/salon-data/gallery', icon: Camera },
  { title: 'Themes', href: '/salon-data/themes', icon: Palette },
  { title: 'Automation', href: '/salon-data/automation', icon: Zap }
]

const bottomItems: SidebarItem[] = [
  { title: 'Reports', href: '/salon-data/reports', icon: FileText },
  { title: 'Settings', href: '/salon-data/settings', icon: Settings }
]

// Apps Modal Component
function AppsModal({
  isOpen,
  onClose,
  isActive
}: {
  isOpen: boolean
  onClose: () => void
  isActive: (href: string) => boolean
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-muted/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div>
              <h2 className="text-2xl font-bold text-foreground">All Apps</h2>
              <p className="text-sm text-muted-foreground mt-1">Access all your salon management tools</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted-foreground/10/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Apps Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allApps.map(app => {
                const Icon = app.icon
                const active = isActive(app.href)

                return (
                  <Link
                    key={app.href}
                    href={app.href}
                    onClick={onClose}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 group',
                      'bg-muted-foreground/10/30 hover:bg-gradient-to-br hover:from-violet-600/20 hover:to-cyan-600/20',
                      'border border-border/50 hover:border-violet-500/30',
                      active &&
                        'bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border-violet-500/30'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-2',
                        'bg-gradient-to-br from-gray-700 to-gray-800',
                        'group-hover:from-violet-600 group-hover:to-cyan-600',
                        active && 'from-violet-600 to-cyan-600'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium text-center',
                        active ? 'text-violet-400' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      {app.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export default function SalonDarkSidebar() {
  const pathname = usePathname()
  const [showAppsModal, setShowAppsModal] = useState(false)

  const isActive = (href: string) => {
    if (href === '/salon-data' && pathname === '/salon-data') return true
    if (href !== '/salon-data' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <div className="fixed left-0 top-0 h-full bg-muted/90 backdrop-blur-xl border-r border-border/50 w-20 z-40 shadow-xl">
      {/* Logo Section */}
      <div className="h-20 flex flex-col items-center justify-center border-b border-border/50 bg-background/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-foreground" />
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 font-medium">Salon</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-1">
        <div className="space-y-0">
          {sidebarItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            // Use full titles now that we have more space
            const displayTitle = item.title

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 transition-all duration-200 group relative',
                  active
                    ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/20 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10/50'
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      active ? 'text-violet-400' : 'text-muted-foreground group-hover:text-violet-400'
                    )}
                  />

                  {/* Badge indicator */}
                  {item.badge && (
                    <span
                      className={cn(
                        'absolute -top-2 -right-2 text-[9px] px-1 py-0.5 rounded-full text-foreground min-w-[16px] text-center',
                        item.badgeColor || 'bg-gray-600'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Text label */}
                <span
                  className={cn(
                    'text-[9px] mt-0.5 font-medium text-center leading-tight',
                    active ? 'text-violet-400' : 'text-muted-foreground group-hover:text-gray-300'
                  )}
                >
                  {displayTitle}
                </span>

                {/* Tooltip for full title */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-muted text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  <p className="font-medium">{item.title}</p>
                  {item.badge && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.badge}{' '}
                      {item.title === 'Reviews'
                        ? 'rating'
                        : item.title === 'Customers'
                          ? 'total'
                          : 'new'}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}

          {/* More Apps Button */}
          <button
            onClick={() => setShowAppsModal(true)}
            className={cn(
              'flex flex-col items-center justify-center py-2 w-full transition-all duration-200 group relative',
              'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10/50'
            )}
          >
            <Grid3x3 className="h-5 w-5 text-muted-foreground group-hover:text-violet-400" />
            <span className="text-[9px] mt-0.5 font-medium text-center leading-tight text-muted-foreground group-hover:text-gray-300">
              More
            </span>

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-3 py-2 bg-muted text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              <p className="font-medium">More Apps</p>
            </div>
          </button>
        </div>

        {/* Separator */}
        <div className="my-2 mx-4 border-t border-border/50" />

        {/* Bottom Items */}
        <div className="space-y-0">
          {bottomItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 transition-all duration-200 group relative',
                  active
                    ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/20 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10/50'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    active ? 'text-violet-400' : 'text-muted-foreground group-hover:text-violet-400'
                  )}
                />

                {/* Text label */}
                <span
                  className={cn(
                    'text-[9px] mt-0.5 font-medium text-center leading-tight',
                    active ? 'text-violet-400' : 'text-muted-foreground group-hover:text-gray-300'
                  )}
                >
                  {item.title}
                </span>

                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-muted text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  <p className="font-medium">{item.title}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-2 border-t border-border/50 bg-background/50">
        <div className="flex flex-col items-center justify-center py-2 rounded-lg hover:bg-muted-foreground/10/50 transition-colors cursor-pointer group relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center">
            <span className="text-foreground text-sm font-semibold">S</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 font-medium">Admin</span>

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-3 py-2 bg-muted text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 bottom-2">
            <p className="font-medium">Salon Admin</p>
            <p className="text-muted-foreground text-xs">admin@salon.com</p>
          </div>
        </div>
      </div>

      {/* Apps Modal Portal */}
      <AppsModal
        isOpen={showAppsModal}
        onClose={() => setShowAppsModal(false)}
        isActive={isActive}
      />
    </div>
  )
}
