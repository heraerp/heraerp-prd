'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  BookOpen
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
  { title: 'Sales', href: '/furniture/sales', icon: ShoppingCart, badge: '47', badgeColor: 'bg-amber-500' },
  { title: 'Production', href: '/furniture/production', icon: Factory, badge: '23', badgeColor: 'bg-purple-500' },
  { title: 'Products', href: '/furniture/products', icon: Package },
  { title: 'Tender', href: '/furniture/tender', icon: FileText, badge: '12', badgeColor: 'bg-blue-500' },
  { title: 'Inventory', href: '/furniture/inventory', icon: Truck, badge: '5', badgeColor: 'bg-red-500' },
  { title: 'Quality', href: '/furniture/quality', icon: CheckCircle },
  { title: 'Finance', href: '/furniture/finance', icon: DollarSign },
  { title: 'HR', href: '/furniture/hr', icon: Users },
]

// All apps for the modal - moved outside component to prevent recreation
const allApps: SidebarItem[] = [
  { title: 'Dashboard', href: '/furniture', icon: Home },
  { title: 'Sales Orders', href: '/furniture/sales/orders', icon: ShoppingCart },
  { title: 'Production', href: '/furniture/production/orders', icon: Factory },
  { title: 'Products', href: '/furniture/products/catalog', icon: Package },
  { title: 'BOM', href: '/furniture/products/bom', icon: ClipboardList },
  { title: 'Routing', href: '/furniture/products/routing', icon: Ruler },
  { title: 'Costing', href: '/furniture/products/costing', icon: Calculator },
  { title: 'Tender Watch', href: '/furniture/tender', icon: FileText },
  { title: 'Tender Dashboard', href: '/furniture/tender/dashboard', icon: BarChart3 },
  { title: 'Active Bids', href: '/furniture/tender/bids', icon: Target },
  { title: 'Competitors', href: '/furniture/tender/competitors', icon: Shield },
  { title: 'EMD Tracking', href: '/furniture/tender/emd', icon: DollarSign },
  { title: 'Transit Pass', href: '/furniture/tender/transit', icon: Truck },
  { title: 'Inventory', href: '/furniture/inventory/stock', icon: Truck },
  { title: 'Materials', href: '/furniture/inventory/materials', icon: Box },
  { title: 'Quality', href: '/furniture/quality/inspection', icon: CheckCircle },
  { title: 'Finance', href: '/furniture/finance/postings', icon: DollarSign },
  { title: 'Chart of Accounts', href: '/furniture/finance/chart-of-accounts', icon: BookOpen },
  { title: 'GST', href: '/furniture/finance/gst', icon: FileText },
  { title: 'Cashflow', href: '/furniture/finance/cashflow', icon: TrendingUp },
  { title: 'HR', href: '/furniture/hr/employees', icon: Users },
  { title: 'Payroll', href: '/furniture/hr/payroll', icon: DollarSign },
  { title: 'PF/ESI', href: '/furniture/hr/compliance', icon: Shield },
  { title: 'Customers', href: '/furniture/sales/customers', icon: Users },
  { title: 'Work Centers', href: '/furniture/production/work-centers', icon: Wrench },
  { title: 'Planning', href: '/furniture/production/planning', icon: Target },
  { title: 'Dispatch', href: '/furniture/sales/dispatch', icon: Truck },
  { title: 'Proforma', href: '/furniture/sales/proforma', icon: FileText },
  { title: 'Analytics', href: '/furniture/analytics', icon: BarChart3 },
  { title: 'AI Manager', href: '/furniture/ai-manager', icon: Brain },
  { title: 'Digital Accountant', href: '/furniture/digital-accountant', icon: Calculator },
]

const bottomItems: SidebarItem[] = [
  { title: 'AI Manager', href: '/furniture/ai-manager', icon: Brain },
  { title: 'Digital Accountant', href: '/furniture/digital-accountant', icon: Calculator },
  { title: 'Settings', href: '/furniture/settings', icon: Settings },
]

// Apps Modal Component - Memoized to prevent unnecessary re-renders
const AppsModal = React.memo(function AppsModal({ isOpen, onClose, isActive, onNavigate }: { isOpen: boolean; onClose: () => void; isActive: (href: string) => boolean; onNavigate?: () => void }) {
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
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className={cn(
          "bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden",
          "transition-all duration-300 transform",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div>
              <h2 className="text-2xl font-bold text-white">All Furniture Apps</h2>
              <p className="text-sm text-gray-400 mt-1">Access all your furniture manufacturing tools</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Apps Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allApps.map((app) => {
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
  const [showAppsModal, setShowAppsModal] = useState(false)

  const isActive = useCallback((href: string) => {
    if (href === '/furniture' && pathname === '/furniture') return true
    if (href !== '/furniture' && pathname.startsWith(href)) return true
    return false
  }, [pathname])

  const handleNavClick = useCallback(() => {
    if (onNavigate) {
      onNavigate()
    }
  }, [onNavigate])

  return (
    <div className="fixed left-0 top-0 h-full bg-gray-800/95 backdrop-blur-xl border-r border-gray-700/50 w-64 lg:w-20 z-40 shadow-xl">
      {/* Logo Section */}
      <div className="h-20 flex flex-col items-center justify-center border-b border-gray-700/50 bg-gray-900/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-center">
          <Armchair className="h-6 w-6 text-white" />
        </div>
        <span className="text-[10px] text-gray-400 mt-1 font-medium">Furniture</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-1">
        <div className="space-y-0">
          {sidebarItems.map((item) => {
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
              "flex items-center lg:flex-col lg:items-center justify-start lg:justify-center py-3 lg:py-2 px-4 lg:px-0 w-full transition-all duration-300 group relative",
              "text-gray-400 hover:text-white hover:bg-gray-700/50",
              "transform hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            <Grid3x3 className="h-5 w-5 text-gray-400 group-hover:text-amber-400" />
            <span className="ml-3 lg:ml-0 lg:mt-0.5 font-medium text-sm lg:text-[9px] lg:text-center leading-tight text-gray-300 lg:text-gray-500 group-hover:text-gray-100 lg:group-hover:text-gray-300">
              More Apps
            </span>
            
            {/* Tooltip - desktop only */}
            <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              <p className="font-medium">More Apps</p>
            </div>
          </button>
        </div>

        {/* Separator */}
        <div className="my-2 mx-4 border-t border-gray-700/50" />

        {/* Bottom Items */}
        <div className="space-y-0">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <FurnitureNavigationLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                active={active}
                onClick={handleNavClick}
              />
            )
          })}
        </div>
      </nav>

      {/* Status Indicators */}
      <div className="p-2 lg:p-2 px-4 border-t border-gray-700/50 bg-gray-900/50">
        <div className="space-y-2 lg:space-y-1">
          <div className="flex items-center justify-between px-2 lg:px-2 py-1">
            <div className="flex items-center gap-2 lg:gap-0">
              <Clock className="h-4 lg:h-3 w-4 lg:w-3 text-amber-400" />
              <span className="lg:hidden text-sm text-gray-300">Pending Orders</span>
            </div>
            <span className="text-sm lg:text-[9px] text-gray-300 lg:text-gray-400 font-medium">23</span>
          </div>
          <div className="flex items-center justify-between px-2 lg:px-2 py-1">
            <div className="flex items-center gap-2 lg:gap-0">
              <AlertCircle className="h-4 lg:h-3 w-4 lg:w-3 text-red-400" />
              <span className="lg:hidden text-sm text-gray-300">Urgent Items</span>
            </div>
            <span className="text-sm lg:text-[9px] text-gray-300 lg:text-gray-400 font-medium">5</span>
          </div>
        </div>
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