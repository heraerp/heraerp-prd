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
  X
} from 'lucide-react'

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
}

// Main sidebar items (WhatsApp highlighted)
const sidebarItems: SidebarItem[] = [
  { title: 'Home', href: '/salon-data', icon: Home },
  {
    title: 'Calendar',
    href: '/salon-data?tab=calendar',
    icon: Calendar,
    badge: '12',
    badgeColor: 'bg-pink-500'
  },
  {
    title: 'Clients',
    href: '/salon-data/customers',
    icon: Users,
    badge: '248',
    badgeColor: 'bg-purple-500'
  },
  { title: 'Services', href: '/salon-data?tab=services', icon: Scissors },
  { title: 'Team', href: '/salon-data?tab=team', icon: UserPlus },
  {
    title: 'WhatsApp',
    href: '/salon-whatsapp-desktop',
    icon: MessageCircle,
    badge: 'New',
    badgeColor: 'bg-[#00a884]'
  },
  { title: 'Analytics', href: '/salon-data/analytics', icon: BarChart }
]

// All apps for the modal
const allApps: SidebarItem[] = [
  { title: 'Home', href: '/salon-data', icon: Home },
  { title: 'Calendar', href: '/salon-data?tab=calendar', icon: Calendar },
  { title: 'Appointments', href: '/salon-data/appointments', icon: Clock },
  { title: 'Clients', href: '/salon-data/customers', icon: Users },
  { title: 'Services', href: '/salon-data?tab=services', icon: Scissors },
  { title: 'Team', href: '/salon-data?tab=team', icon: UserPlus },
  { title: 'Products', href: '/salon-data/products', icon: Package },
  { title: 'WhatsApp', href: '/salon-whatsapp-desktop', icon: MessageCircle },
  { title: 'Analytics', href: '/salon-data/analytics', icon: BarChart },
  { title: 'Payments', href: '/salon-data/payments', icon: CreditCard },
  { title: 'Promotions', href: '/salon-data/promotions', icon: Gift },
  { title: 'Reviews', href: '/salon-data/reviews', icon: Star },
  { title: 'Inventory', href: '/salon-data/inventory', icon: ShoppingBag },
  { title: 'Marketing', href: '/salon-data/marketing', icon: Megaphone },
  { title: 'Invoices', href: '/salon-data/invoices', icon: Receipt },
  { title: 'Security', href: '/salon-data/security', icon: Shield },
  { title: 'HR Portal', href: '/salon-data/hr', icon: Briefcase },
  { title: 'Rewards', href: '/salon-data/rewards', icon: Award },
  { title: 'Training', href: '/salon-data/training', icon: BookOpen },
  { title: 'Gallery', href: '/salon-data/gallery', icon: Camera },
  { title: 'Lounge', href: '/salon-data/lounge', icon: Coffee },
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
        <div className="bg-[#202c33]/95 backdrop-blur-xl border border-[#2a3942] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#2a3942]">
            <div>
              <h2 className="text-2xl font-bold text-foreground">All Apps</h2>
              <p className="text-sm text-[#8696a0] mt-1">Access all your salon management tools</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#2a3942] transition-colors text-[#8696a0] hover:text-foreground"
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
                      'bg-[#2a3942]/30 hover:bg-[#00a884]/20',
                      'border border-[#2a3942] hover:border-[#00a884]/30',
                      active && 'bg-[#00a884]/20 border-[#00a884]/30'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-2',
                        'bg-gradient-to-br from-[#2a3942] to-[#202c33]',
                        'group-hover:from-[#00a884] group-hover:to-[#00a884]/80',
                        active && 'from-[#00a884] to-[#00a884]/80'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          active ? 'text-foreground' : 'text-[#8696a0] group-hover:text-foreground'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium text-center',
                        active ? 'text-[#00a884]' : 'text-[#8696a0] group-hover:text-foreground'
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

export default function SalonWhatsAppSidebar() {
  const pathname = usePathname()
  const [showAppsModal, setShowAppsModal] = useState(false)

  const isActive = (href: string) => {
    if (href === '/salon-data' && pathname === '/salon-data') return true
    if (href === '/salon-whatsapp-desktop' && pathname === '/salon-whatsapp-desktop') return true
    if (href !== '/salon-data' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <div className="fixed left-0 top-0 h-full bg-[#202c33] border-r border-[#2a3942] w-20 z-40 shadow-xl">
      {/* Logo Section */}
      <div className="h-20 flex flex-col items-center justify-center border-b border-[#2a3942]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#00a884] to-[#00a884]/80 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-foreground" />
        </div>
        <span className="text-[10px] text-[#8696a0] mt-1 font-medium">Salon</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-1">
        <div className="space-y-0">
          {sidebarItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            const displayTitle = item.title

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 transition-all duration-200 group relative',
                  active
                    ? 'bg-[#00a884]/20 text-foreground border-r-4 border-[#00a884]'
                    : 'text-[#8696a0] hover:text-foreground hover:bg-[#2a3942]'
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      active ? 'text-[#00a884]' : 'text-[#8696a0] group-hover:text-[#00a884]'
                    )}
                  />

                  {/* Badge indicator */}
                  {item.badge && (
                    <span
                      className={cn(
                        'absolute -top-2 -right-2 text-[9px] px-1 py-0.5 rounded-full text-foreground min-w-[16px] text-center',
                        item.badgeColor || 'bg-[#8696a0]'
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
                    active ? 'text-[#00a884]' : 'text-[#8696a0] group-hover:text-[#aebac1]'
                  )}
                >
                  {displayTitle}
                </span>

                {/* Tooltip for full title */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-[#111b21] border border-[#2a3942] text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  <p className="font-medium">{item.title}</p>
                  {item.badge && (
                    <p className="text-xs text-[#8696a0] mt-1">
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
              'text-[#8696a0] hover:text-foreground hover:bg-[#2a3942]'
            )}
          >
            <Grid3x3 className="h-5 w-5 text-[#8696a0] group-hover:text-[#00a884]" />
            <span className="text-[9px] mt-0.5 font-medium text-center leading-tight text-[#8696a0] group-hover:text-[#aebac1]">
              More
            </span>

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-3 py-2 bg-[#111b21] border border-[#2a3942] text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              <p className="font-medium">More Apps</p>
            </div>
          </button>
        </div>

        {/* Separator */}
        <div className="my-2 mx-4 border-t border-[#2a3942]" />

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
                    ? 'bg-[#00a884]/20 text-foreground border-r-4 border-[#00a884]'
                    : 'text-[#8696a0] hover:text-foreground hover:bg-[#2a3942]'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    active ? 'text-[#00a884]' : 'text-[#8696a0] group-hover:text-[#00a884]'
                  )}
                />

                {/* Text label */}
                <span
                  className={cn(
                    'text-[9px] mt-0.5 font-medium text-center leading-tight',
                    active ? 'text-[#00a884]' : 'text-[#8696a0] group-hover:text-[#aebac1]'
                  )}
                >
                  {item.title}
                </span>

                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-[#111b21] border border-[#2a3942] text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  <p className="font-medium">{item.title}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-2 border-t border-[#2a3942]">
        <div className="flex flex-col items-center justify-center py-2 rounded-lg hover:bg-[#2a3942] transition-colors cursor-pointer group relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00a884] to-[#00a884]/80 flex items-center justify-center">
            <span className="text-foreground text-sm font-semibold">S</span>
          </div>
          <span className="text-[10px] text-[#8696a0] mt-1 font-medium">Admin</span>

          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-3 py-2 bg-[#111b21] border border-[#2a3942] text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 bottom-2">
            <p className="font-medium">Salon Admin</p>
            <p className="text-[#8696a0] text-xs">admin@salon.com</p>
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
