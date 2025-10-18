/**
 * HERA Salon Mobile-First Layout
 * Smart Code: HERA.SALON.LAYOUT.MOBILE.FIRST.V1
 *
 * Enterprise-grade mobile-first layout with:
 * - Touch-safe targets (≥44px)
 * - Responsive breakpoints
 * - Gesture support
 * - Performance optimization
 */

'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import {
  Home,
  Calendar,
  Users,
  ShoppingBag,
  BarChart3,
  Menu,
  X,
  Sparkles,
  LogOut
} from 'lucide-react'

// HERA Luxe Colors
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853'
}

interface MobileNav {
  href: string
  label: string
  icon: React.ReactNode
  touchArea: 'lg' | 'md' // Touch target size
}

const primaryNav: MobileNav[] = [
  {
    href: '/salon/dashboard',
    label: 'Dashboard',
    icon: <Home className="w-6 h-6" />,
    touchArea: 'lg'
  },
  {
    href: '/salon/appointments',
    label: 'Appts',
    icon: <Calendar className="w-6 h-6" />,
    touchArea: 'lg'
  },
  {
    href: '/salon/pos',
    label: 'POS',
    icon: <ShoppingBag className="w-6 h-6" />,
    touchArea: 'lg'
  },
  {
    href: '/salon/services',
    label: 'Services',
    icon: <Sparkles className="w-6 h-6" />,
    touchArea: 'lg'
  },
  {
    href: '/salon/reports',
    label: 'Reports',
    icon: <BarChart3 className="w-6 h-6" />,
    touchArea: 'md'
  }
]

interface SalonMobileLayoutProps {
  children: React.ReactNode
  title?: string
  showHeader?: boolean
  showBottomNav?: boolean
}

export function SalonMobileLayout({
  children,
  title,
  showHeader = true,
  showBottomNav = true
}: SalonMobileLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear local storage
      localStorage.removeItem('organizationId')
      localStorage.removeItem('salonRole')

      // Close menu
      setMenuOpen(false)

      // Redirect to auth page
      router.push('/salon/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundColor: COLORS.black,
        paddingTop: 'env(safe-area-inset-top, 0)'
      }}
    >
      {/* Mobile Header - Sticky with backdrop blur */}
      {showHeader && (
        <header
          className="sticky top-0 z-[60] backdrop-blur-xl border-b"
          style={{
            backgroundColor: `${COLORS.charcoal}F0`,
            borderColor: `${COLORS.gold}20`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 safe-top">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                  border: `1px solid ${COLORS.gold}30`
                }}
              >
                <Sparkles className="w-5 h-5" style={{ color: COLORS.gold }} />
              </div>
              <h1
                className="text-base sm:text-lg font-semibold truncate"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {title || 'Salon'}
              </h1>
            </div>

            {/* Menu Toggle - Touch-safe ≥44px */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-3 rounded-lg transition-all"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                backgroundColor: menuOpen ? `${COLORS.gold}20` : 'transparent',
                color: COLORS.champagne
              }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>
      )}

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Drawer */}
          <div
            className="fixed top-14 right-0 w-72 z-50 backdrop-blur-xl border-l overflow-y-auto"
            style={{
              backgroundColor: `${COLORS.charcoal}F5`,
              borderColor: `${COLORS.gold}20`,
              boxShadow: `-4px 0 16px rgba(0, 0, 0, 0.3)`,
              bottom: showBottomNav ? '80px' : '0' // Leave space for bottom nav
            }}
          >
            <div className="p-4 space-y-2 pb-6">
              {/* All navigation links */}
              {[
                { href: '/salon/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
                { href: '/salon/appointments', label: 'Appointments', icon: <Calendar className="w-5 h-5" /> },
                { href: '/salon/customers', label: 'Customers', icon: <Users className="w-5 h-5" /> },
                { href: '/salon/pos', label: 'POS', icon: <ShoppingBag className="w-5 h-5" /> },
                { href: '/salon/services', label: 'Services', icon: <Sparkles className="w-5 h-5" /> },
                { href: '/salon/products', label: 'Products', icon: <ShoppingBag className="w-5 h-5" /> },
                { href: '/salon/staff', label: 'Staff', icon: <Users className="w-5 h-5" /> },
                { href: '/salon/reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> }
              ].map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? `${COLORS.gold}20` : 'transparent',
                      border: `1px solid ${isActive ? COLORS.gold + '40' : 'transparent'}`,
                      minHeight: '44px'
                    }}
                  >
                    <span style={{ color: isActive ? COLORS.gold : COLORS.bronze }}>
                      {item.icon}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: isActive ? COLORS.champagne : COLORS.bronze }}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              })}

              {/* Divider */}
              <div
                className="my-2 border-t"
                style={{ borderColor: `${COLORS.gold}20` }}
              />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 w-full text-left"
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid transparent`,
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.gold}10`
                  e.currentTarget.style.borderColor = `${COLORS.gold}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <span style={{ color: COLORS.bronze }}>
                  <LogOut className="w-5 h-5" />
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: COLORS.bronze }}
                >
                  Logout
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content - Flexible scroll area */}
      <main
        className={cn(
          'flex-1 overflow-y-auto',
          showBottomNav && 'pb-20', // Space for bottom nav
          'px-3 sm:px-6 py-4 sm:py-6'
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation - Fixed, Touch-safe */}
      {showBottomNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-[60] backdrop-blur-xl border-t"
          style={{
            backgroundColor: `${COLORS.charcoal}F5`,
            borderColor: `${COLORS.gold}20`,
            boxShadow: `0 -4px 16px rgba(0, 0, 0, 0.3)`,
            paddingBottom: 'env(safe-area-inset-bottom, 0)'
          }}
        >
          <div className="flex items-center justify-around py-2">
            {primaryNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const touchSize = item.touchArea === 'lg' ? 'min-w-[48px] min-h-[48px]' : 'min-w-[44px] min-h-[44px]'

              return (
                <Link key={item.href} href={item.href} className="flex-1 max-w-[120px]">
                  <div className="flex flex-col items-center justify-center py-1 px-2">
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-xl transition-all duration-200',
                        touchSize,
                        isActive ? 'scale-110' : 'scale-100'
                      )}
                      style={{
                        backgroundColor: isActive ? `${COLORS.gold}20` : 'transparent',
                        border: isActive ? `1px solid ${COLORS.gold}40` : 'none',
                        color: isActive ? COLORS.gold : COLORS.bronze
                      }}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-medium mt-1 transition-colors',
                        isActive ? 'font-semibold' : ''
                      )}
                      style={{
                        color: isActive ? COLORS.gold : COLORS.bronze
                      }}
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

/**
 * Mobile Card Component - Optimized for touch
 */
interface MobileCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl p-4 transition-all duration-200',
        onClick && 'active:scale-[0.98] cursor-pointer',
        className
      )}
      style={{
        backgroundColor: COLORS.charcoalLight,
        border: `1px solid ${COLORS.gold}15`,
        minHeight: onClick ? '44px' : undefined // Touch-safe if clickable
      }}
    >
      {children}
    </div>
  )
}

/**
 * Mobile Data Table - List view on mobile, table on desktop
 */
interface MobileDataTableProps<T> {
  data: T[]
  columns: {
    key: keyof T
    label: string
    render?: (value: any, item: T) => React.ReactNode
  }[]
  onRowClick?: (item: T) => void
  loading?: boolean
}

export function MobileDataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  loading
}: MobileDataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl animate-pulse"
            style={{ backgroundColor: `${COLORS.charcoal}80` }}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card List */}
      <div className="block lg:hidden space-y-3">
        {data.map((item, index) => (
          <MobileCard
            key={index}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
          >
            <div className="space-y-2">
              {columns.slice(0, 3).map((col) => (
                <div key={String(col.key)} className="flex justify-between items-start gap-3">
                  <span
                    className="text-xs font-medium"
                    style={{ color: COLORS.bronze }}
                  >
                    {col.label}
                  </span>
                  <span
                    className="text-sm font-semibold text-right"
                    style={{ color: COLORS.champagne }}
                  >
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </span>
                </div>
              ))}
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.gold}20` }}>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-xs font-semibold"
                  style={{ color: COLORS.bronze }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  'transition-all',
                  onRowClick && 'cursor-pointer hover:bg-opacity-10'
                )}
                style={{
                  borderBottom: `1px solid ${COLORS.gold}10`,
                  backgroundColor: onRowClick ? 'transparent' : undefined
                }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3 text-sm"
                    style={{ color: COLORS.champagne }}
                  >
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
