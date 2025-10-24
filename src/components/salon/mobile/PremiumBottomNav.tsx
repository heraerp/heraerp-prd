'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LucideIcon, Home, Calendar, CreditCard, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}

interface PremiumBottomNavProps {
  userRole?: string
  badges?: Record<string, number>
}

/**
 * 📱 PREMIUM BOTTOM NAVIGATION
 *
 * Ultra-premium iOS-style tab bar.
 * Inspired by Instagram, Apple Music, and Uber.
 *
 * Features:
 * - Smooth spring animations (cubic-bezier easing)
 * - Floating active indicator
 * - Blur background (frosted glass)
 * - Minimal and clean
 * - Safe area aware
 * - Scale animations on tap
 * - Smooth color transitions
 */
export function PremiumBottomNav({ userRole = 'owner', badges = {} }: PremiumBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)

  const navItems: NavItem[] = [
    { title: 'Home', href: '/salon/dashboard', icon: Home },
    { title: 'Bookings', href: '/salon/appointments', icon: Calendar },
    { title: 'POS', href: '/salon/pos', icon: CreditCard },
    { title: 'Clients', href: '/salon/customers', icon: Users },
    { title: 'More', href: '/salon/more', icon: MoreHorizontal }
  ]

  useEffect(() => {
    const index = navItems.findIndex(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    )
    if (index !== -1) setActiveIndex(index)
  }, [pathname])

  const handleNavigation = (href: string, index: number) => {
    setActiveIndex(index)
    // Simulate haptic feedback with quick scale
    router.push(href)
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'linear-gradient(to top, #0B0B0B 0%, #0B0B0Bf8 70%, #0B0B0B00 100%)',
        pointerEvents: 'none'
      }}
    >
      {/* Blur Container */}
      <div
        className="mx-4 mb-2 rounded-[24px] backdrop-blur-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(26, 26, 26, 0.85)',
          border: '0.5px solid rgba(212, 175, 55, 0.15)',
          boxShadow:
            '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          pointerEvents: 'auto'
        }}
      >
        {/* Active Indicator - Floating Background */}
        <div
          className="absolute top-2 h-12 rounded-2xl transition-all duration-500 ease-out"
          style={{
            left: `${8 + activeIndex * 20}%`,
            width: '16%',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)',
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(212, 175, 55, 0.3)',
            transform: 'translateX(-50%)'
          }}
        />

        {/* Nav Items */}
        <div className="relative flex items-center justify-around px-2 py-2">
          {navItems.map((item, index) => {
            const isActive = activeIndex === index
            const Icon = item.icon
            const badgeCount = badges[item.href] || 0

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href, index)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 relative z-10',
                  'w-[20%] h-14 rounded-2xl transition-all duration-300',
                  'active:scale-90'
                )}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Spring easing
                }}
                aria-label={item.title}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon Container */}
                <div className="relative">
                  <Icon
                    className={cn(
                      'transition-all duration-300',
                      isActive ? 'w-[26px] h-[26px]' : 'w-6 h-6'
                    )}
                    style={{
                      color: isActive ? '#D4AF37' : '#8C7853',
                      filter: isActive ? 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.4))' : 'none',
                      strokeWidth: isActive ? 2.5 : 2
                    }}
                  />

                  {/* Premium Badge */}
                  {badgeCount > 0 && (
                    <div
                      className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold animate-in zoom-in-50 duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #E8B4B8 0%, #d89da1 100%)',
                        color: '#0B0B0B',
                        boxShadow: '0 2px 8px rgba(232, 180, 184, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </div>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[11px] font-medium transition-all duration-300',
                    isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95'
                  )}
                  style={{
                    color: isActive ? '#D4AF37' : '#8C7853',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                    letterSpacing: '-0.01em',
                    fontWeight: isActive ? 600 : 500
                  }}
                >
                  {item.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
