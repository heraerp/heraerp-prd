/**
 * PremiumMobileHeader Component
 *
 * ✅ MOBILE-FIRST: iOS/Android native app-style header for mobile devices
 *
 * Features:
 * - iOS-style rounded icon with gradient background
 * - Title and subtitle layout
 * - Touch-friendly action buttons (min 44px)
 * - Sticky positioning for always-visible navigation
 * - Active state feedback for native feel
 */

import React, { ReactNode } from 'react'

interface PremiumMobileHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  onBack?: () => void
}

export function PremiumMobileHeader({
  title,
  subtitle,
  icon,
  actions,
  onBack
}: PremiumMobileHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-charcoal border-b border-gold/20">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="min-w-[44px] min-h-[44px] rounded-full bg-gold/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <svg
                className="w-5 h-5 text-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {icon && (
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              {icon}
            </div>
          )}

          <div>
            <h1 className="text-lg font-bold text-champagne">{title}</h1>
            {subtitle && <p className="text-xs text-bronze">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
