'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { FurnitureNavigationLink } from './FurnitureNavigationLink'
import { FurnitureModalLink } from './FurnitureModalLink'
import {
  Home,
  Package,
  ShoppingCart,
  Factory,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  CheckCircle,
  FileText,
  Truck,
  Armchair,
  Grid3x3,
  Wrench,
  Ruler,
  Calculator,
  ClipboardList,
  Target,
  Shield,
  TrendingUp,
  X,
  Clock,
  AlertCircle,
  Box,
  Brain,
  BookOpen,
  LogOut
} from 'lucide-react'

interface FurnitureDarkSidebarProps {
  onNavigate?: () => void
}

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
}

// Main sidebar items (compact view) - moved outside component to prevent recreation
const sidebarItems: SidebarItem[] = [
  { title: 'Home', href: '/furniture', icon: Home },
  {
    title: 'Sales',
    href: '/furniture/sales',
    icon: ShoppingCart,
    badge: '47',
    badgeColor: 'bg-[var(--color-accent-teal)]'
  },
  {
    title: 'Production',
    href: '/furniture/production',
    icon: Factory,
    badge: '23',
    badgeColor: 'bg-[var(--color-accent-indigo)]'
  },
  { title: 'Products', href: '/furniture/products', icon: Package },
  {
    title: 'Tender',
    href: '/furniture/tender',
    icon: FileText,
    badge: '12',
    badgeColor: 'bg-[var(--color-accent-teal)]/60'
  },
  { title: 'Settings', href: '/furniture/settings', icon: Settings }
]

// All apps for the modal - moved outside component to prevent recreation
const allApps: SidebarItem[] = [
  // Main Navigation
  { title: 'Dashboard', href: '/furniture', icon: Home },
  { title: 'Sales Orders', href: '/furniture/sales/orders', icon: ShoppingCart },
  { title: 'Production', href: '/furniture/production/orders', icon: Factory },
  { title: 'Products', href: '/furniture/products/catalog', icon: Package },
  // Items moved from main sidebar
  {
    title: 'Inventory',
    href: '/furniture/inventory',
    icon: Truck,
    badge: '5',
    badgeColor: 'bg-red-500'
  },
  { title: 'Quality', href: '/furniture/quality', icon: CheckCircle },
  { title: 'Finance', href: '/furniture/finance', icon: DollarSign },
  { title: 'HR', href: '/furniture/hr', icon: Users },
  // AI Tools
  { title: 'AI Manager', href: '/furniture/ai-manager', icon: Brain },
  { title: 'Digital Accountant', href: '/furniture/digital-accountant', icon: Calculator },
  // Detailed Pages
  { title: 'BOM', href: '/furniture/products/bom', icon: ClipboardList },
  { title: 'Routing', href: '/furniture/products/routing', icon: Ruler },
  { title: 'Costing', href: '/furniture/products/costing', icon: Calculator },
  { title: 'Tender Watch', href: '/furniture/tender', icon: FileText },
  { title: 'Tender Dashboard', href: '/furniture/tender/dashboard', icon: BarChart3 },
  { title: 'Active Bids', href: '/furniture/tender/bids', icon: Target },
  { title: 'Competitors', href: '/furniture/tender/competitors', icon: Shield },
  { title: 'EMD Tracking', href: '/furniture/tender/emd', icon: DollarSign },
  { title: 'Transit Pass', href: '/furniture/tender/transit', icon: Truck },
  { title: 'Inventory Stock', href: '/furniture/inventory/stock', icon: Truck },
  { title: 'Materials', href: '/furniture/inventory/materials', icon: Box },
  { title: 'Quality Inspection', href: '/furniture/quality/inspection', icon: CheckCircle },
  { title: 'Finance Postings', href: '/furniture/finance/postings', icon: DollarSign },
  { title: 'Chart of Accounts', href: '/furniture/finance/chart-of-accounts', icon: BookOpen },
  { title: 'GST', href: '/furniture/finance/gst', icon: FileText },
  { title: 'Cashflow', href: '/furniture/finance/cashflow', icon: TrendingUp },
  { title: 'HR Employees', href: '/furniture/hr/employees', icon: Users },
  { title: 'Payroll', href: '/furniture/hr/payroll', icon: DollarSign },
  { title: 'PF/ESI', href: '/furniture/hr/compliance', icon: Shield },
  { title: 'Customers', href: '/furniture/sales/customers', icon: Users },
  { title: 'Work Centers', href: '/furniture/production/work-centers', icon: Wrench },
  { title: 'Planning', href: '/furniture/production/planning', icon: Target },
  { title: 'Dispatch', href: '/furniture/sales/dispatch', icon: Truck },
  { title: 'Proforma', href: '/furniture/sales/proforma', icon: FileText },
  { title: 'Analytics', href: '/furniture/analytics', icon: BarChart3 }
]

const bottomItems: SidebarItem[] = []

// Apps Modal Component - Memoized to prevent unnecessary re-renders
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
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className={cn(
            'bg-[var(--color-body)]/95 backdrop-blur-xl border border-[var(--color-border)]/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden',
            'transition-all duration-300 transform',
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
        >
          {/* Modal Header */}
          <div className="bg-[var(--color-body)] flex items-center justify-between p-6 border-b border-[var(--color-border)]/50">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                All Furniture Apps
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Access all your furniture manufacturing tools
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-body)]/50 transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
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
                  <FurnitureModalLink
                    key={app.href}
                    href={app.href}
                    icon={app.icon}
                    title={app.title}
                    active={active}
                    onClose={onClose}
                    onNavigate={onNavigate}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
})

function FurnitureDarkSidebar({ onNavigate }: FurnitureDarkSidebarProps) {
  const pathname = usePathname()

  const router = useRouter()

  const { toast } = useToast()

  const { logout } = useHERAAuth()

  const [showAppsModal, setShowAppsModal] = useState(false)

  const isActive = useCallback(
    (href: string) => {
      if (href === '/furniture' && pathname === '/furniture') return true
      if (href !== '/furniture' && pathname.startsWith(href)) return true
      return false
    },
    [pathname]
  )

  const handleNavClick = useCallback(() => {
    if (onNavigate) {
      onNavigate()
    }
  }, [onNavigate])

  const handleLogout = async () => {
    try {
      console.log('Logout button clicked')
      toast({
        title: 'Logging out...',
        description: 'Please wait'
      })
      await logout()
      // Clear any demo session data
      sessionStorage.removeItem('isDemoLogin')
      sessionStorage.removeItem('demoModule')
      toast({
        title: 'Logged out successfully',
        description: 'Returning to login page...'
      })
      // Use window.location for a full page reload to clear any cached state
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: 'Logout failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="furniture-sidebar h-full w-72 lg:w-20 flex flex-col overflow-hidden border-r border-[var(--color-sidebar-border)]">
      {/* Logo Section */}
      <div className="h-16 lg:h-20 flex items-center justify-center px-4 lg:px-0 border-b border-[var(--color-border)]/20 flex-shrink-0">
        <div className="flex items-center gap-3 lg:flex-col lg:gap-1 lg:items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--color-accent-teal)] to-[var(--color-accent-indigo)] flex items-center justify-center shadow-lg">
            <Armchair className="h-6 w-6 text-white" />
          </div>
          <div className="lg:hidden">
            <h3 className="text-[var(--color-text-primary)] font-semibold">
              Kerala Furniture Works
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">Demo Account</p>
          </div>
          <span className="hidden lg:block text-[10px] text-[var(--color-text-secondary)] font-medium text-center">
            Furniture
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        <div className="space-y-0">
          {sidebarItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <FurnitureNavigationLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                badge={item.badge}
                badgeColor={item.badgeColor}
                active={active}
                onClick={handleNavClick}
              />
            )
          })}

          {/* More Apps Button */}
          <button
            onClick={() => setShowAppsModal(true)}
            className={cn(
              'flex items-center lg:flex-col lg:items-center justify-center py-3 lg:py-2 px-4 lg:px-0 w-full transition-all duration-300 group relative',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]',
              'transform hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            <Grid3x3 className="h-5 w-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-secondary)]" />
            <span className="ml-3 lg:ml-0 lg:mt-0.5 font-medium text-sm lg:text-[9px] lg:text-center leading-tight text-[var(--color-text-secondary)] lg:text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] lg:group-hover:text-[var(--color-text-secondary)]">
              More Apps
            </span>
            {/* Tooltip - desktop only */}
            <div className="hidden lg:block absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 px-3 py-2 bg-[var(--color-body)] text-[var(--color-text-primary)] text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              <p className="font-medium">More Apps</p>
            </div>
          </button>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-[var(--color-border)]/50 flex-shrink-0">
        {/* Logout Button */}
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Logout button clicked - event fired')
            handleLogout()
          }}
          className={cn(
            'flex items-center justify-center gap-3 lg:gap-1 lg:flex-col',
            'w-full px-4 py-4 lg:py-3',
            'bg-red-900/20 hover:bg-red-700/30',
            'text-red-400 hover:text-red-300',
            'border-t border-red-800/30',
            'transition-all duration-200',
            'group'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-sm lg:text-[10px] lg:text-center">
            Logout from Demo
          </span>
          {/* Tooltip - desktop only */}
          <div className="hidden lg:hidden absolute left-full ml-2 px-3 py-2 bg-[var(--color-body)] text-[var(--color-text-primary)] text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            <p className="font-medium">Logout from Demo Account</p>
          </div>
        </button>
      </div>

      {/* Apps Modal Portal */}
      <AppsModal
        isOpen={showAppsModal}
        onClose={() => setShowAppsModal(false)}
        isActive={isActive}
        onNavigate={onNavigate}
      />
    </div>
  )
}

export default React.memo(FurnitureDarkSidebar)
