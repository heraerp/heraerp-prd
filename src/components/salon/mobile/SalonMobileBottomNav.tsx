'use client'

import React, { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LucideIcon, Home, Calendar, CreditCard, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}

interface SalonMobileBottomNavProps {
  /** User's salon role for role-based navigation */
  userRole?: string
  /** Additional navigation items (max 5 total) */
  customItems?: NavItem[]
  /** Show notification badges */
  badges?: Record<string, number>
}

/**
 * 📱 SALON MOBILE BOTTOM NAVIGATION
 *
 * iOS/Android-style bottom tab bar with native app feel.
 *
 * Features:
 * - Fixed bottom positioning (safe area aware)
 * - 5 tabs maximum (iOS standard)
 * - Active state with haptic feedback (active:scale-95)
 * - Icon + label layout
 * - Gold accent for active tab
 * - Role-based navigation items
 * - Smooth transitions and animations
 * - 56px height (iOS tab bar standard)
 *
 * @example
 * <SalonMobileBottomNav userRole="owner" badges={{ appointments: 3 }} />
 */
export function SalonMobileBottomNav({
  userRole = 'owner',
  customItems,
  badges = {}
}: SalonMobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Role-based navigation items (top 4 + More)
  const navItems = useMemo((): NavItem[] => {
    const baseItems: Record<string, NavItem[]> = {
      owner: [
        { title: 'Home', href: '/salon/dashboard', icon: Home },
        { title: 'Appointments', href: '/salon/appointments', icon: Calendar },
        { title: 'POS', href: '/salon/pos', icon: CreditCard },
        { title: 'Customers', href: '/salon/customers', icon: Users },
        { title: 'More', href: '/salon/more', icon: MoreHorizontal }
      ],
      receptionist: [
        { title: 'Home', href: '/salon/receptionist', icon: Home },
        { title: 'Appointments', href: '/salon/appointments', icon: Calendar },
        { title: 'POS', href: '/salon/pos', icon: CreditCard },
        { title: 'Customers', href: '/salon/customers', icon: Users },
        { title: 'More', href: '/salon/more', icon: MoreHorizontal }
      ],
      accountant: [
        { title: 'Home', href: '/salon/dashboard', icon: Home },
        { title: 'Finance', href: '/salon/finance', icon: CreditCard },
        { title: 'Reports', href: '/salon/reports', icon: Calendar },
        { title: 'More', href: '/salon/more', icon: MoreHorizontal }
      ]
    }

    return customItems || baseItems[userRole] || baseItems.owner
  }, [userRole, customItems])

  const handleNavigation = (href: string) => {
    // Haptic feedback simulation (will trigger CSS active state)
    router.push(href)
  }

  return (
    <>
      {/* 📱 MOBILE BOTTOM NAV - iOS/Android Standard */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl"
        style={{
          backgroundColor: `${SALON_LUXE_COLORS.charcoal.dark}f5`, // 96% opacity
          borderColor: `${SALON_LUXE_COLORS.gold}15`,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
          height: '56px', // iOS tab bar standard
          paddingBottom: 'env(safe-area-inset-bottom)' // Safe area for iPhone
        }}
      >
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            const badgeCount = badges[item.href] || 0

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-all duration-200 relative',
                  'min-w-[56px] min-h-[48px] rounded-lg',
                  'active:scale-95', // Native app feedback
                  isActive && 'bg-gold/10'
                )}
                aria-label={item.title}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon with active state */}
                <div className="relative">
                  <Icon
                    className={cn(
                      'w-6 h-6 transition-colors duration-200',
                      isActive ? 'text-gold' : 'text-bronze'
                    )}
                    style={{
                      color: isActive ? SALON_LUXE_COLORS.gold : SALON_LUXE_COLORS.bronze
                    }}
                  />

                  {/* Notification badge */}
                  {badgeCount > 0 && (
                    <div
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold animate-in zoom-in-50 duration-200"
                      style={{
                        backgroundColor: '#E8B4B8',
                        color: '#0B0B0B'
                      }}
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </div>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    isActive ? 'text-gold' : 'text-bronze/80'
                  )}
                  style={{
                    color: isActive ? SALON_LUXE_COLORS.gold : `${SALON_LUXE_COLORS.bronze}cc`
                  }}
                >
                  {item.title}
                </span>

                {/* Active indicator line (iOS style) */}
                {isActive && (
                  <div
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200"
                    style={{
                      backgroundColor: SALON_LUXE_COLORS.gold
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="md:hidden h-14" style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }} />
    </>
  )
}

/**
 * 📱 MOBILE NAV SPACER
 *
 * Use this component at the bottom of your page content to prevent
 * content from being hidden behind the bottom navigation.
 *
 * @example
 * <div>
 *   <YourPageContent />
 *   <MobileNavSpacer />
 * </div>
 */
export function MobileNavSpacer() {
  return (
    <div
      className="md:hidden"
      style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }}
      aria-hidden="true"
    />
  )
}
