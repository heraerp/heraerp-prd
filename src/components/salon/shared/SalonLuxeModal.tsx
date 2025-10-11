'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SALON_LUXE_COLORS, SALON_LUXE_STYLES } from '@/lib/constants/salon-luxe-colors'
import { cn } from '@/lib/utils'

interface SalonLuxeModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  className?: string
}

/**
 * SALON LUXE MODAL COMPONENT
 *
 * Enterprise-grade modal wrapper with consistent salon luxe theme.
 * Uses inline styles to prevent global CSS overrides.
 *
 * Features:
 * - Charcoal gradient background with gold accents
 * - Animated gradient overlay
 * - Consistent header styling with icon support
 * - Optional footer area
 * - Multiple size options
 * - Automatic scroll handling
 *
 * @example
 * <SalonLuxeModal
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Select Staff Member"
 *   icon={<Sparkles className="w-6 h-6" />}
 *   footer={<SalonLuxeButton>Confirm</SalonLuxeButton>}
 * >
 *   <div>Modal content here</div>
 * </SalonLuxeModal>
 */
export function SalonLuxeModal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  className,
}: SalonLuxeModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn('salon-luxe-modal max-h-[90vh] border-0 shadow-2xl flex flex-col', sizeClasses[size], className)}
        style={{
          ...SALON_LUXE_STYLES.modalBackground,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Enhanced animated gradient overlay with softer glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 animate-gradient"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 30% 20%, rgba(212, 175, 55, 0.5) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 70% 80%, rgba(212, 175, 55, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 70%)
            `,
          }}
        />

        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-50 rounded-lg p-2 hover:scale-110"
            style={{
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              color: SALON_LUXE_COLORS.gold.base,
              transitionProperty: 'background-color, transform',
              transitionDuration: '200ms',
              transitionTimingFunction: 'ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}

        {/* Header with glassmorphism */}
        <DialogHeader
          className="pb-5 border-b relative z-10 flex-shrink-0"
          style={{
            borderColor: `rgba(212, 175, 55, 0.25)`,
            borderWidth: '1px',
            boxShadow: '0 1px 0 rgba(212, 175, 55, 0.1)',
          }}
        >
          <DialogTitle className="flex items-center gap-3">
            {icon && (
              <div
                className="p-3 rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(to bottom right, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)`,
                  border: `2px solid rgba(212, 175, 55, 0.4)`,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{ color: SALON_LUXE_COLORS.gold.base }}>{icon}</div>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold" style={{ color: SALON_LUXE_COLORS.text.primary }}>
                {title}
              </h2>
              {description && (
                <DialogDescription className="text-sm font-normal mt-1" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                  {description}
                </DialogDescription>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Content with enhanced styling */}
        <div
          className="overflow-y-auto pr-2 pb-4 flex-1 relative z-10 custom-scrollbar min-h-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(212, 175, 55, 0.02) 0%, transparent 20%)',
          }}
        >
          {children}
        </div>

        {/* Footer with golden border and glassmorphism */}
        {footer && (
          <div
            className="flex gap-3 pt-5 border-t mt-0 relative z-10 flex-shrink-0"
            style={{
              borderColor: 'rgba(212, 175, 55, 0.25)',
              borderWidth: '1px',
              boxShadow: '0 -1px 0 rgba(212, 175, 55, 0.1)',
              background: 'linear-gradient(to top, rgba(212, 175, 55, 0.05) 0%, transparent 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {footer}
          </div>
        )}

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${SALON_LUXE_COLORS.charcoal.lighter};
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(154, 163, 174, 0.4);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(154, 163, 174, 0.6);
          }
          @keyframes gradient {
            0%,
            100% {
              opacity: 0.3;
              transform: scale(1);
            }
            33% {
              opacity: 0.35;
              transform: scale(1.05);
            }
            66% {
              opacity: 0.25;
              transform: scale(0.98);
            }
          }
          .animate-gradient {
            animation: gradient 12s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
