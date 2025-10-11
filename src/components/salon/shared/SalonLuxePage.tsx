'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface SalonLuxePageProps {
  children: ReactNode
  /** Page title with gradient text */
  title?: string
  /** Page subtitle/description */
  description?: string
  /** Header actions (buttons, etc.) */
  actions?: ReactNode
  /** Show animated background gradients */
  showAnimatedBackground?: boolean
  /** Container max width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Custom className for the container */
  className?: string
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg'
}

/**
 * SALON LUXE PAGE WRAPPER
 *
 * Enterprise-grade page wrapper with salon luxe theme.
 * Provides consistent page layout, animated backgrounds, and golden accents.
 *
 * Features:
 * - Black background with animated golden gradients
 * - Glassmorphism container with golden borders
 * - Gradient title text (champagne → gold)
 * - Animated radial gradient background
 * - Consistent spacing and layout
 * - Responsive design
 *
 * @example
 * <SalonLuxePage
 *   title="Appointments"
 *   description="Manage salon appointments"
 *   actions={<Button>New Appointment</Button>}
 * >
 *   <div>Your page content</div>
 * </SalonLuxePage>
 */
export function SalonLuxePage({
  children,
  title,
  description,
  actions,
  showAnimatedBackground = true,
  maxWidth = 'full',
  className,
  padding = 'lg'
}: SalonLuxePageProps) {
  const maxWidthClasses = {
    sm: 'max-w-4xl',
    md: 'max-w-6xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1920px]',
    full: 'max-w-full'
  }

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
        backgroundImage: showAnimatedBackground
          ? `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 0% 100%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)
          `
          : undefined
      }}
    >
      {/* Animated gradient overlay */}
      {showAnimatedBackground && (
        <div
          className="fixed inset-0 pointer-events-none opacity-30 animate-gradient-slow"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 30% 20%, rgba(212, 175, 55, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 70% 80%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)
            `
          }}
        />
      )}

      {/* Main container */}
      <div className={cn('mx-auto relative z-10', maxWidthClasses[maxWidth], paddingClasses[padding])}>
        {/* Page header */}
        {(title || description || actions) && (
          <div
            className="rounded-2xl p-8 mb-6 backdrop-blur-xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
              border: `1px solid ${SALON_LUXE_COLORS.gold}15`,
              boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)'
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                {title && (
                  <h1
                    className="text-4xl font-bold mb-2"
                    style={{
                      background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.champagne} 0%, ${SALON_LUXE_COLORS.gold.base} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-sm" style={{ color: SALON_LUXE_COLORS.bronze }}>
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex gap-3">{actions}</div>}
            </div>
          </div>
        )}

        {/* Page content container */}
        <div
          className={cn('rounded-2xl backdrop-blur-xl', className)}
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
            border: `1px solid ${SALON_LUXE_COLORS.gold}15`,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)'
          }}
        >
          {children}
        </div>
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
        .animate-gradient-slow {
          animation: gradient-slow 20s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  )
}
