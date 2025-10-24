/**
 * HERA Salon Auth Page (Alternative Access Point)
 * Enterprise-grade authentication portal for salon professionals
 * Redirects to /salon-access for consistent authentication experience
 *
 * This page ensures all authentication flows go through the same
 * enterprise-grade /salon-access page with:
 * - Enhanced error handling
 * - Password reset functionality
 * - Theme-matching design
 * - Role-based redirects
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

export default function SalonAuthPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to /salon-access for consistent authentication experience
    console.log('🔀 Redirecting /salon/auth → /salon-access for unified authentication')
    router.replace('/salon-access')
  }, [router])

  // Show loading state during redirect
  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 0% 100%, rgba(212, 175, 55, 0.1) 0%, transparent 50%)
        `
      }}
    >
      {/* Animated gradient overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 20%, rgba(212, 175, 55, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 70% 80%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)
          `,
          animation: 'gradient-slow 20s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }}
      />

      {/* Loading Card */}
      <div
        className="w-full max-w-md relative z-10 rounded-2xl p-10 backdrop-blur-xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
          border: `1px solid ${SALON_LUXE_COLORS.border.base}`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1)'
        }}
      >
        {/* Logo */}
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.gold.dark} 100%)`,
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.4)'
          }}
        >
          <Sparkles className="h-8 w-8" style={{ color: SALON_LUXE_COLORS.charcoal.dark }} />
        </div>

        {/* Loading Spinner */}
        <Loader2
          className="h-8 w-8 animate-spin mx-auto mb-4"
          style={{ color: SALON_LUXE_COLORS.gold.base }}
        />

        {/* Message */}
        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: SALON_LUXE_COLORS.champagne.light }}
        >
          Redirecting to Sign In
        </h2>
        <p className="text-sm" style={{ color: SALON_LUXE_COLORS.bronze }}>
          Please wait while we redirect you to the authentication portal...
        </p>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes gradient-slow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          33% {
            opacity: 0.4;
            transform: scale(1.1) rotate(2deg);
          }
          66% {
            opacity: 0.25;
            transform: scale(0.95) rotate(-2deg);
          }
        }
      `}</style>
    </div>
  )
}
