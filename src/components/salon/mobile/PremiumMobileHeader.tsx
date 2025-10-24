'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LucideIcon, ChevronLeft, Bell, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PremiumMobileHeaderProps {
  /** Page title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Show back button */
  showBack?: boolean
  /** Custom back action */
  onBack?: () => void
  /** Show search icon */
  showSearch?: boolean
  /** Search action */
  onSearch?: () => void
  /** Show notifications bell */
  showNotifications?: boolean
  /** Notification count */
  notificationCount?: number
  /** Header shrinks on scroll */
  shrinkOnScroll?: boolean
  /** Custom right action */
  rightAction?: React.ReactNode
}

/**
 * 📱 PREMIUM MOBILE HEADER
 *
 * Native iOS-style header with premium feel.
 * Inspired by Instagram, Uber, Airbnb.
 *
 * Features:
 * - Large bold title (SF Pro Display style)
 * - Scroll-aware shrinking animation
 * - Blur background (iOS style)
 * - Minimal design with breathing room
 * - Clean tap targets
 * - Subtle shadows
 */
export function PremiumMobileHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  showSearch = false,
  onSearch,
  showNotifications = false,
  notificationCount = 0,
  shrinkOnScroll = true,
  rightAction
}: PremiumMobileHeaderProps) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!shrinkOnScroll) return

    const handleScroll = () => {
      const isScrolled = window.scrollY > 20
      setScrolled(isScrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [shrinkOnScroll])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <>
      {/* iOS Status Bar Spacer */}
      <div className="h-11 bg-black/5 dark:bg-white/5 md:hidden" />

      {/* Premium Header */}
      <div
        className={cn(
          'md:hidden sticky top-0 z-50 backdrop-blur-xl transition-all duration-300',
          scrolled ? 'bg-[#1A1A1A]/95 shadow-lg' : 'bg-[#1A1A1A]/80'
        )}
        style={{
          borderBottom: scrolled ? '1px solid rgba(212, 175, 55, 0.1)' : 'none'
        }}
      >
        <div
          className={cn(
            'transition-all duration-300 ease-out',
            scrolled ? 'px-4 py-3' : 'px-5 py-4'
          )}
        >
          {/* Top Row - Actions */}
          <div className="flex items-center justify-between mb-2">
            {/* Left Action */}
            <div className="w-10">
              {showBack && (
                <button
                  onClick={handleBack}
                  className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-200"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-7 h-7 text-[#D4AF37]" />
                </button>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {showSearch && (
                <button
                  onClick={onSearch}
                  className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-200 bg-white/5"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-[#F5E6C8]" />
                </button>
              )}

              {showNotifications && (
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-200 bg-white/5 relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-[#F5E6C8]" />
                  {notificationCount > 0 && (
                    <div
                      className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        backgroundColor: '#E8B4B8',
                        color: '#0B0B0B'
                      }}
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </div>
                  )}
                </button>
              )}

              {rightAction}
            </div>
          </div>

          {/* Title Section */}
          <div
            className={cn(
              'transition-all duration-300 ease-out',
              scrolled ? 'opacity-90' : 'opacity-100'
            )}
          >
            <h1
              className={cn(
                'font-bold text-[#F5E6C8] tracking-tight transition-all duration-300 ease-out',
                scrolled ? 'text-2xl' : 'text-[32px] leading-tight'
              )}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                letterSpacing: '-0.02em'
              }}
            >
              {title}
            </h1>
            {subtitle && !scrolled && (
              <p
                className="text-sm text-[#8C7853] mt-1 transition-all duration-300"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
