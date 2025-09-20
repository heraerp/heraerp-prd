'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
  Home,
  Calendar,
  Users,
  Package,
  MessageSquare,
  FileText,
  DollarSign,
  Settings,
  CreditCard,
  Scissors,
  BarChart3,
  Smartphone,
  UserCheck,
  Gift,
  Clock,
  Brain,
  Calculator,
  Shield,
  ClipboardList,
  Box,
  TrendingUp,
  Grid3x3,
  X,
  ChevronRight
} from 'lucide-react'

interface SalonDashboardSidebarProps {
  onNavigate?: () => void
}

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
}

// Main sidebar items (compact view)
const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
  {
    title: 'Appointments',
    href: '/salon/appointments',
    icon: Calendar,
    badge: '12',
    badgeColor: 'bg-violet-500'
  },
  { title: 'POS', href: '/salon/pos', icon: CreditCard },
  { title: 'Customers', href: '/salon/customers', icon: Users },
  {
    title: 'WhatsApp',
    href: '/salon/whatsapp',
    icon: MessageSquare,
    badge: '3',
    badgeColor: 'bg-emerald-500'
  },
  { title: 'Settings', href: '/salon/settings', icon: Settings }
]

// All apps for the modal
const allApps: SidebarItem[] = [
  // Main Operations
  { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
  { title: 'Appointments', href: '/appointments', icon: Calendar },
  { title: 'POS Terminal', href: '/salon/pos', icon: CreditCard },
  { title: 'Customer Management', href: '/salon/customers', icon: Users },

  // Communication
  { title: 'WhatsApp Hub', href: '/salon/whatsapp', icon: MessageSquare },
  { title: 'SMS Campaigns', href: '/marketing/sms', icon: Smartphone },
  { title: 'Email Marketing', href: '/marketing/email', icon: FileText },

  // Inventory & Services
  { title: 'Services', href: '/services', icon: Scissors },
  { title: 'Products', href: '/inventory/products', icon: Package },
  { title: 'Inventory', href: '/inventory', icon: Box },
  { title: 'Suppliers', href: '/inventory/suppliers', icon: Smartphone },

  // Staff Management
  { title: 'Staff', href: '/staff', icon: UserCheck },
  { title: 'Schedule', href: '/staff/schedule', icon: Clock },
  { title: 'Payroll', href: '/payroll', icon: DollarSign },
  { title: 'Commissions', href: '/payroll/commissions', icon: Calculator },

  // Financial
  { title: 'Sales Reports', href: '/reports/sales', icon: BarChart3 },
  { title: 'Finance Dashboard', href: '/finance', icon: DollarSign },
  { title: 'Expenses', href: '/finance/expenses', icon: FileText },
  { title: 'Cash Management', href: '/finance/cash', icon: Shield },

  // Analytics & AI
  { title: 'Analytics', href: '/analytics', icon: TrendingUp },
  { title: 'AI Insights', href: '/ai-insights', icon: Brain },
  { title: 'Digital Accountant', href: '/digital-accountant', icon: Calculator },

  // Loyalty & Marketing
  { title: 'Loyalty Program', href: '/loyalty', icon: Gift },
  { title: 'Promotions', href: '/promotions', icon: ClipboardList },
  { title: 'Reviews', href: '/reviews', icon: Users },

  // System
  { title: 'Settings', href: '/salon/settings', icon: Settings },
  { title: 'Branch Settings', href: '/salon/settings/branch', icon: Grid3x3 },
  { title: 'Integration', href: '/salon/settings/integrations', icon: Shield }
]

const bottomItems: SidebarItem[] = []

// Apps Modal Component
const AppsModal = React.memo(function AppsModal({
  isOpen,
  onClose,
  isActive,
  onNavigate
}: {
  isOpen: boolean
  onClose: () => void
  isActive: (href: string) => boolean
  onNavigate?: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      const timeout = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-background/60 backdrop-blur-sm z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
          'bg-gradient-to-br from-violet-950 via-purple-900 to-pink-900',
          'border border-violet-800/30 rounded-2xl p-6',
          'shadow-2xl shadow-violet-950/50',
          'w-[90vw] max-w-6xl max-h-[80vh] overflow-hidden',
          'transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-200 to-pink-200 bg-clip-text text-transparent">
            All Apps
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5 text-violet-200" />
          </button>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto max-h-[60vh] pr-2">
          {allApps.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  onNavigate?.()
                  onClose()
                }}
                className={cn(
                  'group flex flex-col items-center justify-center p-4 rounded-xl',
                  'border transition-all duration-200',
                  active
                    ? 'bg-violet-500/20 border-violet-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                )}
              >
                <Icon
                  className={cn(
                    'h-8 w-8 mb-2 transition-colors',
                    active ? 'text-violet-300' : 'text-violet-200 group-hover:text-violet-100'
                  )}
                />
                <span
                  className={cn(
                    'text-xs text-center transition-colors',
                    active ? 'text-violet-100' : 'text-violet-200 group-hover:text-violet-100'
                  )}
                >
                  {item.title}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>,
    document.body
  )
})

export default function SalonDashboardSidebar({ onNavigate }: SalonDashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [appsModalOpen, setAppsModalOpen] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Check if this is a demo session
  useEffect(() => {
    const demoLogin = sessionStorage.getItem('isDemoLogin') === 'true'
    const demoModule = sessionStorage.getItem('demoModule')
    setIsDemoMode(demoLogin && demoModule === 'salon')
  }, [])

  // Memoize isActive function
  const isActive = useCallback(
    (href: string) => {
      if (href === '/salon/dashboard' && pathname === '/salon/dashboard') return true
      if (href !== '/salon/dashboard' && pathname?.startsWith(href)) return true
      return false
    },
    [pathname]
  )

  const handleExitDemo = () => {
    // Clear demo session data
    sessionStorage.removeItem('isDemoLogin')
    sessionStorage.removeItem('demoModule')
    // Return to demo page
    router.push('/demo')
  }

  const openAppsModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setAppsModalOpen(true)
  }, [])

  const closeAppsModal = useCallback(() => {
    setAppsModalOpen(false)
  }, [])

  // Navigation Links Component
  const NavigationLink = ({ item }: { item: SidebarItem }) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
          active
            ? 'bg-violet-500/20 text-violet-100'
            : 'hover:bg-white/10 text-violet-200 hover:text-violet-100'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">{item.title}</span>
        {item.badge && (
          <span
            className={cn(
              'ml-auto px-2 py-0.5 text-xs font-medium rounded-full',
              item.badgeColor || 'bg-violet-500/20 text-violet-200'
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Sidebar - Fixed width */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-violet-950 via-purple-900 to-pink-900 border-r border-violet-800/30 flex flex-col z-20">
        {/* Logo Section */}
        <div className="p-6 border-b border-violet-800/30">
          <Link href="/salon/dashboard" className="block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-200 to-pink-200 bg-clip-text text-transparent">
              HERA Salon
            </h1>
            <p className="text-xs text-violet-300/70 mt-1">
              {isDemoMode ? 'Demo Mode' : 'Hair Talkz'}
            </p>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-1">
            {sidebarItems.map(item => (
              <NavigationLink key={item.href} item={item} />
            ))}
          </div>

          {/* All Apps Button */}
          <button
            onClick={openAppsModal}
            className="mt-6 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-violet-200 hover:text-violet-100 transition-all duration-200"
          >
            <Grid3x3 className="h-5 w-5" />
            <span className="text-sm font-medium">All Apps</span>
          </button>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-violet-800/30">
          {bottomItems.length > 0 && (
            <div className="mb-4 space-y-1">
              {bottomItems.map(item => (
                <NavigationLink key={item.href} item={item} />
              ))}
            </div>
          )}

          {/* Exit Demo Button - Only show in demo mode */}
          {isDemoMode && (
            <button
              onClick={handleExitDemo}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-violet-500/20 text-violet-200 hover:text-violet-100 transition-all duration-200"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="text-sm font-medium">Exit Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-violet-950 via-purple-900 to-pink-900 border-t border-violet-800/30 px-2 py-2 z-20">
        <div className="flex justify-around items-center">
          {sidebarItems.slice(0, 5).map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative',
                  active ? 'text-violet-100' : 'text-violet-300 hover:text-violet-100'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.title}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Apps Modal */}
      <AppsModal
        isOpen={appsModalOpen}
        onClose={closeAppsModal}
        isActive={isActive}
        onNavigate={onNavigate}
      />
    </>
  )
}
