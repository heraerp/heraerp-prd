'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  Brain,
  Building2
} from 'lucide-react'

export interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
  activeColor?: string // optional class for active icon/text color
}

// Main sidebar items (production ready)
const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
  {
    title: 'Appointments',
    href: '/salon/appointments',
    icon: Calendar,
    badge: '3',
    badgeColor: 'bg-violet-500'
  },
  { title: 'POS', href: '/salon/pos2', icon: CreditCard },
  { title: 'Clients', href: '/salon/customers', icon: Users },
  { title: 'Services', href: '/salon/services', icon: Scissors },
  { title: 'Inventory', href: '/salon/inventory', icon: Package },
  {
    title: 'WhatsApp',
    href: '/salon/whatsapp',
    icon: MessageCircle,
    badge: '5',
    badgeColor: 'bg-green-500'
  },
  { title: 'Reports', href: '/salon/reports', icon: BarChart }
]

// All apps for the modal (production ready)
const allApps: SidebarItem[] = [
  // Core modules
  { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
  { title: 'Appointments', href: '/salon/appointments', icon: Calendar },
  { title: 'POS', href: '/salon/pos2', icon: CreditCard },
  { title: 'Customers', href: '/salon/customers', icon: Users },
  { title: 'Services', href: '/salon/services', icon: Scissors },
  { title: 'Inventory', href: '/salon/inventory', icon: Package },

  // Communication
  { title: 'WhatsApp', href: '/salon/whatsapp', icon: MessageCircle },
  { title: 'Marketing', href: '/salon/marketing', icon: Megaphone },

  // Staff Management
  { title: 'Team', href: '/salon/team', icon: UserPlus },
  { title: 'Leave', href: '/salon/leave', icon: CalendarCheck },
  { title: 'Payroll', href: '/salon/payroll', icon: DollarSign },

  // Financial
  { title: 'Finance', href: '/salon/finance', icon: TrendingDown },
  { title: 'P&L Report', href: '/salon/reports/pnl', icon: BarChart3 },
  { title: 'Balance Sheet', href: '/salon/reports/balance-sheet', icon: Scale },
  { title: 'Branch P&L', href: '/salon/reports/branch-pnl', icon: Building2 },
  {
    title: 'Smart Accountant',
    href: '/salon/digital-accountant',
    icon: Brain,
    badge: 'AI',
    badgeColor: 'bg-purple-500'
  },

  // Reports & Analytics
  { title: 'Reports', href: '/salon/reports', icon: BarChart },
  { title: 'Analytics', href: '/salon/analytics', icon: TrendingUp },

  // Products & Sales
  { title: 'Products', href: '/salon/products', icon: ShoppingBag },
  { title: 'Invoices', href: '/salon/invoices', icon: Receipt },
  { title: 'Payments', href: '/salon/payments', icon: CreditCard },

  // Loyalty & Reviews
  { title: 'Promotions', href: '/salon/promotions', icon: Gift },
  { title: 'Reviews', href: '/salon/reviews', icon: Star },
  { title: 'Rewards', href: '/salon/rewards', icon: Award },

  // Administration
  { title: 'Settings', href: '/salon/settings', icon: Settings },
  { title: 'Security', href: '/salon/security', icon: Shield },
  { title: 'HR Portal', href: '/salon/hr', icon: Briefcase },
  { title: 'Training', href: '/salon/training', icon: BookOpen },

  // Others
  { title: 'Gallery', href: '/salon/gallery', icon: Camera },
  { title: 'Themes', href: '/salon/themes', icon: Palette },
  { title: 'Automation', href: '/salon/automation', icon: Zap }
]

const bottomItems: SidebarItem[] = [
  { title: 'Reports', href: '/salon/reports', icon: FileText },
  { title: 'Settings', href: '/salon/settings', icon: Settings }
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
              <p className="text-sm text-muted-foreground mt-1">
                Access all your salon management tools
              </p>
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
                          active
                            ? 'text-foreground'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium text-center',
                        active
                          ? 'text-violet-400'
                          : 'text-muted-foreground group-hover:text-foreground'
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

export default function SalonDarkSidebar({
  extraItems = [] as SidebarItem[]
}: {
  extraItems?: SidebarItem[]
}) {
  const pathname = usePathname()
  const [showAppsModal, setShowAppsModal] = useState(false)

  const isActive = (href: string) => {
    if (href === pathname) return true
    if (href === '/salon-data' && pathname === '/salon-data') return true
    if (href !== '/salon-data' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <div
      className="fixed inset-y-0 left-0 h-[100dvh] w-20 z-40 border-r"
      style={{
        backgroundColor: '#1A1A1A', // light charcoal
        borderColor: 'rgba(245,230,200,0.08)',
        boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.45), 0 10px 30px rgba(0,0,0,0.5)'
      }}
    >
      {/* Right edge highlight */}
      <div
        className="absolute top-0 right-0 h-full w-px pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(245,230,200,0.28), rgba(212,175,55,0.12), transparent)'
        }}
      />
      {/* Logo Section */}
      <div
        className="h-20 flex flex-col items-center justify-center border-b"
        style={{ borderColor: 'rgba(245,230,200,0.08)', backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center shadow-lg">
          <Sparkles className="h-6 w-6 text-[#0B0B0B]" />
        </div>
        <span className="text-[10px] text-[#F5E6C8] mt-1 font-medium tracking-wider">SALON</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-1">
        <div className="space-y-0">
          {[...sidebarItems, ...extraItems].map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            // Use full titles now that we have more space
            const displayTitle = item.title

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 transition-all duration-200 group relative rounded-xl mx-2',
                  active
                    ? 'bg-[#232323] text-[#F5E6C8]'
                    : 'text-[#E0E0E0]/80 hover:text-[#F5E6C8] hover:bg-[#1F1F1F]'
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      active
                        ? item.activeColor || 'text-[#F5E6C8]'
                        : 'text-[#E0E0E0]/80 group-hover:text-[#F5E6C8]'
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
                    active
                      ? item.activeColor || 'text-[#F5E6C8]'
                      : 'text-[#E0E0E0]/80 group-hover:text-[#F5E6C8]'
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
            <Grid3x3 className="h-5 w-5 text-[#E0E0E0]/80 group-hover:text-[#F5E6C8]" />
            <span className="text-[9px] mt-0.5 font-medium text-center leading-tight text-[#E0E0E0]/80 group-hover:text-[#F5E6C8]">
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
                  'flex flex-col items-center justify-center py-2 transition-all duration-200 group relative rounded-xl mx-2',
                  active
                    ? 'bg-[#232323] text-[#F5E6C8]'
                    : 'text-[#E0E0E0]/80 hover:text-[#F5E6C8] hover:bg-[#1F1F1F]'
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
