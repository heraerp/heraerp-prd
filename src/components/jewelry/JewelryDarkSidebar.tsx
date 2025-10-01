'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Crown,
  Diamond,
  Gem,
  Scale,
  Sparkles,
  Shield,
  Home,
  BarChart3,
  TrendingUp,
  Calculator,
  FileText,
  Settings,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  Receipt,
  Award,
  Star,
  Gift,
  Zap,
  Bell,
  Clock,
  Calendar,
  Building2,
  Brain,
  Camera,
  Palette,
  Grid3x3,
  X,
  Search,
  Archive,
  Tag,
  Briefcase,
  BookOpen,
  Heart,
  Coins,
  Target,
  Activity,
  Layers,
  Fingerprint
} from 'lucide-react'

// Royal Blue & Gold color palette for jewelry
const JEWELRY_COLORS = {
  royal: '#2B3A67',
  midnight: '#1A1F3D',
  gold: '#D4AF00',
  goldLight: '#E6C200',
  goldDark: '#B8960B',
  cream: '#FDF6E3',
  slate: '#4A5568',
  blue50: '#F0F2F8',
  blue100: '#DDE2EE',
  blue200: '#C1CADE',
  blue300: '#9BA8C6'
}

export interface JewelrySidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
  activeColor?: string
}

// Main jewelry sidebar items
const jewelrySidebarItems: JewelrySidebarItem[] = [
  { title: 'Dashboard', href: '/jewelry/dashboard', icon: Home },
  { title: 'Worklist', href: '/jewelry/worklist', icon: Gem },
  { title: 'POS', href: '/jewelry/pos', icon: CreditCard },
  { title: 'Inventory', href: '/jewelry/inventory', icon: Package },
  { title: 'Appraisals', href: '/jewelry/appraisals', icon: Scale },
  { 
    title: 'Certificates', 
    href: '/jewelry/certificates', 
    icon: Shield,
    badge: '2',
    badgeColor: JEWELRY_COLORS.gold
  },
  { title: 'Customers', href: '/jewelry/customers', icon: Users },
  { title: 'Reports', href: '/jewelry/reports', icon: BarChart3 }
]

// All jewelry apps for the modal
const allJewelryApps: JewelrySidebarItem[] = [
  // Core Operations
  { title: 'Dashboard', href: '/jewelry/dashboard', icon: Home },
  { title: 'Worklist', href: '/jewelry/worklist', icon: Gem },
  { title: 'POS', href: '/jewelry/pos', icon: CreditCard },
  { title: 'Inventory', href: '/jewelry/inventory', icon: Package },
  { title: 'Search', href: '/jewelry/search', icon: Search },

  // Quality & Certification
  { title: 'Appraisals', href: '/jewelry/appraisals', icon: Scale },
  { title: 'Certificates', href: '/jewelry/certificates', icon: Shield },
  { title: 'Quality Control', href: '/jewelry/quality', icon: Award },
  { title: 'Authentication', href: '/jewelry/auth', icon: Fingerprint },
  { title: 'Grading', href: '/jewelry/grading', icon: Star },

  // Customer Management
  { title: 'Customers', href: '/jewelry/customers', icon: Users },
  { title: 'Wishlist', href: '/jewelry/wishlist', icon: Heart },
  { title: 'Loyalty Program', href: '/jewelry/loyalty', icon: Gift },
  { title: 'VIP Services', href: '/jewelry/vip', icon: Crown },

  // Business Intelligence
  { title: 'Analytics', href: '/jewelry/analytics', icon: TrendingUp },
  { title: 'Reports', href: '/jewelry/reports', icon: BarChart3 },
  { title: 'Financial', href: '/jewelry/finance', icon: Calculator },
  { title: 'Profit Analysis', href: '/jewelry/profit', icon: Target },
  { title: 'Market Trends', href: '/jewelry/trends', icon: Activity },

  // Catalog & Products
  { title: 'Catalog', href: '/jewelry/catalog', icon: BookOpen },
  { title: 'Collections', href: '/jewelry/collections', icon: Layers },
  { title: 'Pricing', href: '/jewelry/pricing', icon: Coins },
  { title: 'Tags & Labels', href: '/jewelry/tags', icon: Tag },

  // Operations
  { title: 'Repairs', href: '/jewelry/repairs', icon: Zap },
  { title: 'Custom Orders', href: '/jewelry/custom', icon: Sparkles },
  { title: 'Appointments', href: '/jewelry/appointments', icon: Calendar },
  { title: 'Scheduling', href: '/jewelry/schedule', icon: Clock },

  // Sales & Marketing
  { title: 'Sales', href: '/jewelry/sales', icon: ShoppingBag },
  { title: 'Invoices', href: '/jewelry/invoices', icon: Receipt },
  { title: 'Promotions', href: '/jewelry/promotions', icon: Gift },
  { title: 'Photography', href: '/jewelry/gallery', icon: Camera },

  // Administration
  { title: 'Settings', href: '/jewelry/settings', icon: Settings },
  { title: 'Security', href: '/jewelry/security', icon: Shield },
  { title: 'Branch Mgmt', href: '/jewelry/branches', icon: Building2 },
  { title: 'Staff Portal', href: '/jewelry/staff', icon: Briefcase },
  { title: 'Archive', href: '/jewelry/archive', icon: Archive },
  { title: 'Notifications', href: '/jewelry/notifications', icon: Bell },
  { title: 'Themes', href: '/jewelry/themes', icon: Palette },
  {
    title: 'Smart AI',
    href: '/jewelry/ai',
    icon: Brain,
    badge: 'AI',
    badgeColor: JEWELRY_COLORS.gold
  }
]

const bottomItems: JewelrySidebarItem[] = [
  { title: 'Analytics', href: '/jewelry/analytics', icon: TrendingUp },
  { title: 'Settings', href: '/jewelry/settings', icon: Settings },
  { title: 'Owner', href: '/jewelry/owner', icon: Crown }
]

// Apps Modal Component
function JewelryAppsModal({
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
      <div
        className="fixed inset-0 backdrop-blur-sm z-50"
        style={{ backgroundColor: `${JEWELRY_COLORS.midnight}DD` }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden"
          style={{
            backgroundColor: `${JEWELRY_COLORS.cream}F8`,
            border: `2px solid ${JEWELRY_COLORS.gold}40`,
            boxShadow: `0 25px 60px ${JEWELRY_COLORS.midnight}60`
          }}
        >
          {/* Modal Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: `${JEWELRY_COLORS.gold}30` }}
          >
            <div>
              <h2
                className="text-3xl font-bold flex items-center gap-3"
                style={{ color: JEWELRY_COLORS.royal }}
              >
                <Crown className="h-8 w-8" style={{ color: JEWELRY_COLORS.gold }} />
                Jewelry Management Suite
              </h2>
              <p className="text-sm mt-2" style={{ color: JEWELRY_COLORS.slate }}>
                Complete luxury jewelry business management tools
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-xl transition-all hover:scale-110 jewelry-glass-card"
              style={{ color: JEWELRY_COLORS.slate }}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Apps Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {allJewelryApps.map(app => {
                const Icon = app.icon
                const active = isActive(app.href)

                return (
                  <Link
                    key={app.href}
                    href={app.href}
                    onClick={onClose}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 group jewelry-scale-hover',
                      'hover:shadow-lg'
                    )}
                    style={{
                      backgroundColor: active 
                        ? `${JEWELRY_COLORS.gold}20` 
                        : `${JEWELRY_COLORS.blue50}80`,
                      border: `2px solid ${active ? JEWELRY_COLORS.gold : JEWELRY_COLORS.blue200}`
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative"
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${JEWELRY_COLORS.gold} 0%, ${JEWELRY_COLORS.goldDark} 100%)`
                          : `linear-gradient(135deg, ${JEWELRY_COLORS.royal} 0%, ${JEWELRY_COLORS.midnight} 100%)`,
                        boxShadow: active
                          ? `0 4px 12px ${JEWELRY_COLORS.gold}40`
                          : `0 2px 8px ${JEWELRY_COLORS.royal}30`
                      }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{
                          color: active ? JEWELRY_COLORS.midnight : JEWELRY_COLORS.gold
                        }}
                      />
                      
                      {/* Badge */}
                      {app.badge && (
                        <span
                          className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full font-bold"
                          style={{
                            backgroundColor: app.badgeColor,
                            color: JEWELRY_COLORS.midnight,
                            fontSize: '10px'
                          }}
                        >
                          {app.badge}
                        </span>
                      )}
                    </div>
                    
                    <span
                      className="text-xs font-semibold text-center leading-tight"
                      style={{
                        color: active ? JEWELRY_COLORS.royal : JEWELRY_COLORS.slate
                      }}
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

export default function JewelryDarkSidebar({
  items,
  extraItems = [] as JewelrySidebarItem[]
}: {
  items?: JewelrySidebarItem[]
  extraItems?: JewelrySidebarItem[]
}) {
  const pathname = usePathname()
  const [showAppsModal, setShowAppsModal] = useState(false)

  const isActive = (href: string) => {
    if (href === pathname) return true
    if (href !== '/jewelry' && pathname.startsWith(href)) return true
    return false
  }

  // Use provided items or default sidebar items
  const navigationItems = items || jewelrySidebarItems

  return (
    <div
      className="fixed inset-y-0 left-0 h-[100dvh] w-20 z-50 border-r"
      style={{
        backgroundColor: JEWELRY_COLORS.royal,
        borderColor: `${JEWELRY_COLORS.gold}30`,
        boxShadow: `inset -1px 0 0 ${JEWELRY_COLORS.midnight}50, 0 10px 30px ${JEWELRY_COLORS.midnight}60`
      }}
    >
      {/* Right edge highlight */}
      <div
        className="absolute top-0 right-0 h-full w-px pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${JEWELRY_COLORS.gold}60, ${JEWELRY_COLORS.gold}20, transparent)`
        }}
      />
      
      {/* Logo Section */}
      <div
        className="h-20 flex flex-col items-center justify-center border-b"
        style={{
          borderColor: `${JEWELRY_COLORS.gold}30`,
          backgroundColor: JEWELRY_COLORS.midnight,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg jewelry-crown-glow"
          style={{
            background: `linear-gradient(135deg, ${JEWELRY_COLORS.gold} 0%, ${JEWELRY_COLORS.goldDark} 100%)`,
            boxShadow: `0 4px 12px ${JEWELRY_COLORS.gold}50`
          }}
        >
          <Crown className="h-6 w-6" style={{ color: JEWELRY_COLORS.midnight }} />
        </div>
        <span
          className="text-[10px] mt-1 font-bold tracking-wider"
          style={{ color: JEWELRY_COLORS.cream }}
        >
          LUXURY
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="space-y-1">
          {[...navigationItems, ...extraItems].map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-3 transition-all duration-200 group relative rounded-xl mx-2',
                  'hover:scale-[1.05] jewelry-scale-hover'
                )}
                style={{
                  backgroundColor: active ? `${JEWELRY_COLORS.gold}25` : 'transparent'
                }}
              >
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: active ? `${JEWELRY_COLORS.gold}40` : `${JEWELRY_COLORS.blue300}20`
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{
                        color: active ? JEWELRY_COLORS.goldDark : JEWELRY_COLORS.gold
                      }}
                    />
                  </div>

                  {/* Badge indicator */}
                  {item.badge && (
                    <span
                      className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded-full min-w-[14px] text-center font-bold"
                      style={{
                        backgroundColor: item.badgeColor,
                        color: JEWELRY_COLORS.midnight,
                        border: `1px solid ${JEWELRY_COLORS.gold}60`
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Text label */}
                <span
                  className="text-[9px] mt-1 font-semibold text-center leading-tight"
                  style={{
                    color: active ? JEWELRY_COLORS.cream : JEWELRY_COLORS.blue200
                  }}
                >
                  {item.title}
                </span>

                {/* Tooltip */}
                <div 
                  className="absolute left-full ml-3 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 jewelry-glass-card"
                  style={{
                    backgroundColor: JEWELRY_COLORS.cream,
                    border: `1px solid ${JEWELRY_COLORS.gold}40`,
                    boxShadow: `0 4px 12px ${JEWELRY_COLORS.midnight}30`,
                    color: JEWELRY_COLORS.royal
                  }}
                >
                  <p className="font-semibold">{item.title}</p>
                  {item.badge && (
                    <p className="text-xs mt-1" style={{ color: JEWELRY_COLORS.slate }}>
                      {item.badge} {item.title === 'Certificates' ? 'pending' : 'new'}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}

          {/* More Apps Button */}
          <button
            onClick={() => setShowAppsModal(true)}
            className="flex flex-col items-center justify-center py-3 w-full transition-all duration-200 group relative rounded-xl mx-2 hover:scale-[1.05] jewelry-scale-hover"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${JEWELRY_COLORS.blue300}20` }}
            >
              <Grid3x3 className="h-5 w-5" style={{ color: JEWELRY_COLORS.gold }} />
            </div>
            <span
              className="text-[9px] mt-1 font-semibold text-center leading-tight"
              style={{ color: JEWELRY_COLORS.blue200 }}
            >
              More
            </span>

            {/* Tooltip */}
            <div
              className="absolute left-full ml-3 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 jewelry-glass-card"
              style={{
                backgroundColor: JEWELRY_COLORS.cream,
                border: `1px solid ${JEWELRY_COLORS.gold}40`,
                boxShadow: `0 4px 12px ${JEWELRY_COLORS.midnight}30`,
                color: JEWELRY_COLORS.royal
              }}
            >
              <p className="font-semibold">More Apps</p>
              <p className="text-xs mt-1" style={{ color: JEWELRY_COLORS.slate }}>
                All jewelry tools
              </p>
            </div>
          </button>
        </div>

        {/* Separator */}
        <div className="my-3 mx-4 border-t" style={{ borderColor: `${JEWELRY_COLORS.gold}30` }} />

        {/* Bottom Items */}
        <div className="space-y-1">
          {bottomItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-3 transition-all duration-200 group relative rounded-xl mx-2',
                  'hover:scale-[1.05] jewelry-scale-hover'
                )}
                style={{
                  backgroundColor: active ? `${JEWELRY_COLORS.gold}25` : 'transparent'
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: active ? `${JEWELRY_COLORS.gold}40` : `${JEWELRY_COLORS.blue300}20`
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{
                      color: active ? JEWELRY_COLORS.goldDark : JEWELRY_COLORS.gold
                    }}
                  />
                </div>

                <span
                  className="text-[9px] mt-1 font-semibold text-center leading-tight"
                  style={{
                    color: active ? JEWELRY_COLORS.cream : JEWELRY_COLORS.blue200
                  }}
                >
                  {item.title}
                </span>

                {/* Tooltip */}
                <div
                  className="absolute left-full ml-3 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 jewelry-glass-card"
                  style={{
                    backgroundColor: JEWELRY_COLORS.cream,
                    border: `1px solid ${JEWELRY_COLORS.gold}40`,
                    boxShadow: `0 4px 12px ${JEWELRY_COLORS.midnight}30`,
                    color: JEWELRY_COLORS.royal
                  }}
                >
                  <p className="font-semibold">{item.title}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>


      {/* Apps Modal Portal */}
      <JewelryAppsModal
        isOpen={showAppsModal}
        onClose={() => setShowAppsModal(false)}
        isActive={isActive}
      />
    </div>
  )
}