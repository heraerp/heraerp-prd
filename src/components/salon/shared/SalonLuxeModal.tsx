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
        className={cn('salon-luxe-modal max-h-[90vh] border-0 shadow-2xl flex flex-col [&>button]:hidden rounded-2xl animate-modalSlideIn', sizeClasses[size], className)}
        style={{
          ...SALON_LUXE_STYLES.modalBackground,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          color: SALON_LUXE_COLORS.text.primary,
          border: `2px solid ${SALON_LUXE_COLORS.gold.base}40`,
          boxShadow: `0 0 0 1px ${SALON_LUXE_COLORS.gold.base}25, 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px ${SALON_LUXE_COLORS.gold.base}15`,
          borderRadius: '1rem',
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const centerX = rect.width / 2
          const centerY = rect.height / 2
          const rotateX = ((y - centerY) / centerY) * -1
          const rotateY = ((x - centerX) / centerX) * 1

          e.currentTarget.style.transform = `translate(-50%, -50%) perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.00) translateZ(0)`

          // Update border glow position based on mouse
          const glowX = (x / rect.width) * 100
          const glowY = (y / rect.height) * 100
          e.currentTarget.style.boxShadow = `
            0 0 0 1px ${SALON_LUXE_COLORS.gold.base}25,
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 0 60px ${SALON_LUXE_COLORS.gold.base}15,
            inset 0 0 80px rgba(212, 175, 55, 0.08)
          `
          e.currentTarget.style.borderImage = `radial-gradient(circle at ${glowX}% ${glowY}%, ${SALON_LUXE_COLORS.gold.base}80, ${SALON_LUXE_COLORS.gold.base}20) 1`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) perspective(2000px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0)'
          e.currentTarget.style.boxShadow = `0 0 0 1px ${SALON_LUXE_COLORS.gold.base}25, 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px ${SALON_LUXE_COLORS.gold.base}15`
          e.currentTarget.style.borderImage = 'none'
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
          className="pb-5 px-6 pt-6 border-b relative z-10 flex-shrink-0"
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

        {/* Content with enhanced styling and text color enforcement */}
        <div
          className="overflow-y-auto px-6 pb-4 flex-1 relative z-10 custom-scrollbar min-h-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(212, 175, 55, 0.02) 0%, transparent 20%)',
            color: SALON_LUXE_COLORS.text.primary,
          }}
        >
          <div style={{ color: SALON_LUXE_COLORS.text.primary }}>
            {children}
          </div>
        </div>

        {/* Footer with golden border, glassmorphism, and proper button alignment */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 pt-5 border-t mt-0 relative z-10 flex-shrink-0 px-6 pb-6"
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

        {/* Custom Scrollbar Styles & Enterprise Text Color Enforcement */}
        <style jsx global>{`
          /* Scrollbar Styling */
          .salon-luxe-modal .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .salon-luxe-modal .custom-scrollbar::-webkit-scrollbar-track {
            background: ${SALON_LUXE_COLORS.charcoal.lighter};
            border-radius: 4px;
          }
          .salon-luxe-modal .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(154, 163, 174, 0.4);
            border-radius: 4px;
          }
          .salon-luxe-modal .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(154, 163, 174, 0.6);
          }

          /* Enterprise Text Color Enforcement - Critical for Dark Theme */
          .salon-luxe-modal p,
          .salon-luxe-modal span,
          .salon-luxe-modal div,
          .salon-luxe-modal label,
          .salon-luxe-modal li {
            color: ${SALON_LUXE_COLORS.text.primary} !important;
          }

          /* Preserve explicit color overrides */
          .salon-luxe-modal [style*="color:"] {
            color: inherit !important;
          }

          /* Headings should be even brighter */
          .salon-luxe-modal h1,
          .salon-luxe-modal h2,
          .salon-luxe-modal h3,
          .salon-luxe-modal h4,
          .salon-luxe-modal h5,
          .salon-luxe-modal h6 {
            color: ${SALON_LUXE_COLORS.champagne.lightest} !important;
          }

          /* Input text should be bright */
          .salon-luxe-modal input,
          .salon-luxe-modal textarea,
          .salon-luxe-modal select {
            color: ${SALON_LUXE_COLORS.text.primary} !important;
          }

          /* Animations */
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

          /* Modal slide-in animation with soft entrance */
          @keyframes modalSlideIn {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) perspective(2000px) scale(0.95) translateY(-20px) translateZ(0) rotateX(10deg);
            }
            100% {
              opacity: 1;
              transform: translate(-50%, -50%) perspective(2000px) scale(1) translateY(0) translateZ(0) rotateX(0deg);
            }
          }
          .animate-modalSlideIn {
            animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            transition: transform 0.15s ease-out, box-shadow 0.2s ease-out, border-image 0.2s ease-out;
          }

          /* Ensure modal is properly centered */
          .salon-luxe-modal {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            margin: 0 !important;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
