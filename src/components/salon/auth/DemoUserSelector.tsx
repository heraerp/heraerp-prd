/**
 * HERA DNA SECURITY: Demo User Selector
 * Luxurious single-user demo access for HairTalkz Salon
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Crown, Sparkles, Lock, ChevronRight } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface DemoUserSelectorProps {
  onUserSelect: (email: string, password: string) => void
  isLoading?: boolean
}

export function DemoUserSelector({ onUserSelect, isLoading = false }: DemoUserSelectorProps) {
  const demoUser = {
    email: 'michele@hairtalkz.ae',
    password: 'HairTalkz2024!',
    fullName: 'Michele Hair',
    title: 'Salon Owner'
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Luxurious Tile Card */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer group"
        style={{
          backgroundColor: LUXE_COLORS.charcoalLight,
          border: `1px solid ${LUXE_COLORS.gold}40`,
          boxShadow: `0 10px 40px rgba(212, 175, 55, 0.15), inset 0 1px 0 ${LUXE_COLORS.gold}20`
        }}
        onClick={() => !isLoading && onUserSelect(demoUser.email, demoUser.password)}
      >
        {/* Ambient Glow Effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${LUXE_COLORS.gold}15 0%, transparent 70%)`
          }}
        />

        {/* Crown Icon with Glow */}
        <div className="flex justify-center mb-6 relative">
          <div
            className="p-4 rounded-2xl relative"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.gold}30 0%, ${LUXE_COLORS.goldDark}20 100%)`,
              boxShadow: `0 8px 32px ${LUXE_COLORS.gold}40`
            }}
          >
            <Crown
              className="h-10 w-10 relative z-10"
              style={{ color: LUXE_COLORS.gold }}
            />
            {/* Sparkle decorations */}
            <Sparkles
              className="h-4 w-4 absolute -top-1 -right-1 animate-pulse"
              style={{ color: LUXE_COLORS.gold }}
            />
            <Sparkles
              className="h-3 w-3 absolute -bottom-1 -left-1 animate-pulse"
              style={{ color: LUXE_COLORS.champagne, animationDelay: '0.5s' }}
            />
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-6 relative z-10">
          <h3
            className="text-2xl font-light mb-1 tracking-wide"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {demoUser.fullName}
          </h3>
          <div
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-medium tracking-wider uppercase"
            style={{
              backgroundColor: `${LUXE_COLORS.gold}15`,
              border: `1px solid ${LUXE_COLORS.gold}30`,
              color: LUXE_COLORS.gold
            }}
          >
            <Crown className="h-3 w-3" />
            {demoUser.title}
          </div>
        </div>

        {/* Credentials Box */}
        <div
          className="rounded-xl p-4 mb-6 relative z-10"
          style={{
            backgroundColor: LUXE_COLORS.charcoal,
            border: `1px solid ${LUXE_COLORS.bronze}30`
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4" style={{ color: LUXE_COLORS.gold }} />
            <span
              className="text-xs font-medium tracking-wider uppercase"
              style={{ color: LUXE_COLORS.bronze }}
            >
              Demo Credentials
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: LUXE_COLORS.bronze }}>Email:</span>
              <span
                className="font-mono text-xs"
                style={{ color: LUXE_COLORS.champagne }}
              >
                {demoUser.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: LUXE_COLORS.bronze }}>Password:</span>
              <span
                className="font-mono text-xs"
                style={{ color: LUXE_COLORS.champagne }}
              >
                {demoUser.password}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2 mb-6 relative z-10">
          {[
            'Complete system access',
            'Financial reports & analytics',
            'Staff & inventory management',
            'POS operations & exports'
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 text-sm"
              style={{ color: LUXE_COLORS.champagne }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: LUXE_COLORS.gold }}
              />
              {feature}
            </div>
          ))}
        </div>

        {/* Login Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation()
            if (!isLoading) {
              onUserSelect(demoUser.email, demoUser.password)
            }
          }}
          disabled={isLoading}
          className="w-full h-14 text-base font-light tracking-wider uppercase transition-all duration-300 relative z-10"
          style={{
            backgroundColor: LUXE_COLORS.gold,
            color: LUXE_COLORS.charcoal,
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = LUXE_COLORS.goldDark
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(212, 175, 55, 0.5)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = LUXE_COLORS.gold
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                style={{ borderColor: LUXE_COLORS.charcoal }}
              />
              <span>Authenticating...</span>
            </div>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              Quick Demo Access
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        {/* Decorative corner accents */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-10"
          style={{
            background: `radial-gradient(circle at top right, ${LUXE_COLORS.gold} 0%, transparent 70%)`
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 opacity-10"
          style={{
            background: `radial-gradient(circle at bottom left, ${LUXE_COLORS.gold} 0%, transparent 70%)`
          }}
        />
      </div>

      {/* Info Footer */}
      <div className="mt-4 text-center">
        <p
          className="text-xs font-light"
          style={{ color: `${LUXE_COLORS.bronze}80` }}
        >
          Instant access to full salon management system
        </p>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
