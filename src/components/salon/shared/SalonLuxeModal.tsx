'use client'

import { ReactNode } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SALON_LUXE_COLORS, SALON_LUXE_STYLES, SALON_LUXE_GRADIENTS } from '@/lib/constants/salon-luxe-colors'
import { cn } from '@/lib/utils'

export interface ValidationError {
  field: string
  message: string
}

interface SalonLuxeModalProps {
  open: boolean
  onClose: (open?: boolean) => void
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showCloseButton?: boolean
  className?: string
  // ✅ NEW: Built-in validation support
  validationErrors?: ValidationError[]
  showValidationSummary?: boolean
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
 * - ✅ NEW: Built-in validation error display with vibrant pink/red colors
 *
 * @example
 * <SalonLuxeModal
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Select Staff Member"
 *   icon={<Sparkles className="w-6 h-6" />}
 *   footer={<SalonLuxeButton>Confirm</SalonLuxeButton>}
 *   validationErrors={[{ field: 'name', message: 'Name is required' }]}
 *   showValidationSummary={true}
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
  validationErrors = [],
  showValidationSummary = false,
}: SalonLuxeModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-3xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn('salon-luxe-modal max-h-[98vh] border-0 shadow-2xl flex flex-col [&>button]:hidden rounded-2xl animate-modalSlideIn', sizeClasses[size], className)}
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

        {/* Close Button - Always Visible */}
        {showCloseButton && (
          <button
            onClick={() => onClose(false)}
            className="absolute right-4 top-4 rounded-lg p-2 hover:scale-110 transition-all"
            style={{
              zIndex: 999,
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              color: SALON_LUXE_COLORS.gold.base,
              transitionProperty: 'background-color, transform, box-shadow',
              transitionDuration: '200ms',
              transitionTimingFunction: 'ease',
              border: `1px solid rgba(212, 175, 55, 0.3)`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.3)'
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}

        {/* Luxe Header with Gradient - Matching ServiceModal Style */}
        <div
          className="relative px-8 py-6 border-b flex-shrink-0 z-10"
          style={{
            background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal.base} 0%, ${SALON_LUXE_COLORS.charcoal.dark} 100%)`,
            borderColor: `${SALON_LUXE_COLORS.border.base}`
          }}
        >
          {/* Decorative Gold Accent Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${SALON_LUXE_COLORS.gold.base}, transparent)`
            }}
          />

          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Luxe Icon Badge */}
                {icon && (
                  <div
                    className="relative w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}30 0%, ${SALON_LUXE_COLORS.gold.base}10 100%)`,
                      border: `2px solid ${SALON_LUXE_COLORS.gold.base}50`,
                      boxShadow: `0 8px 16px ${SALON_LUXE_COLORS.gold.base}20`
                    }}
                  >
                    <div style={{ color: SALON_LUXE_COLORS.gold.base }}>{icon}</div>

                    {/* Sparkle Effect */}
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: SALON_LUXE_COLORS.gold.base }}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <DialogTitle
                    className="text-2xl font-bold tracking-tight"
                    style={{
                      background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.champagne.base} 0%, ${SALON_LUXE_COLORS.gold.base} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {title}
                  </DialogTitle>
                  {description && (
                    <DialogDescription className="text-sm" style={{ color: SALON_LUXE_COLORS.text.primary, opacity: 0.8 }}>
                      {description}
                    </DialogDescription>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content with enhanced styling and text color enforcement */}
        <div
          className="overflow-y-auto overflow-x-hidden px-6 pb-4 flex-1 relative z-10 custom-scrollbar min-h-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(212, 175, 55, 0.02) 0%, transparent 20%)',
            color: SALON_LUXE_COLORS.text.primary,
          }}
        >
          {/* ✅ ENTERPRISE VALIDATION SUMMARY */}
          {showValidationSummary && validationErrors.length > 0 && (
            <div
              className="mb-6 mt-6 p-5 rounded-xl border-2 animate-in fade-in-0 slide-in-from-top-2 duration-300 shadow-lg"
              style={{
                background: SALON_LUXE_GRADIENTS.error,
                borderColor: SALON_LUXE_COLORS.error.border,
                boxShadow: `0 8px 24px ${SALON_LUXE_COLORS.error.lighter}, 0 0 0 1px ${SALON_LUXE_COLORS.error.border}`
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: SALON_LUXE_COLORS.error.base,
                    boxShadow: `0 4px 12px ${SALON_LUXE_COLORS.error.lighter}`
                  }}
                >
                  <AlertCircle className="h-5 w-5" style={{ color: '#000' }} />
                </div>
                <div className="flex-1">
                  <h4
                    className="text-base font-bold mb-3"
                    style={{ color: SALON_LUXE_COLORS.error.text }}
                  >
                    Please fix the following errors to continue:
                  </h4>
                  <ul className="space-y-2">
                    {validationErrors.map(({ field, message }, index) => (
                      <li key={`${field}-${index}`} className="flex items-start gap-3">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: SALON_LUXE_COLORS.error.base }}
                        />
                        <span className="text-sm" style={{ color: SALON_LUXE_COLORS.text.primary }}>
                          <strong className="capitalize font-semibold" style={{ color: SALON_LUXE_COLORS.error.text }}>
                            {field}:
                          </strong>{' '}
                          {message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

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

          /* Dropdown/Select Component Theme - Luxe Styling */
          .hera-select-content {
            background-color: ${SALON_LUXE_COLORS.charcoal.darker} !important;
            border-color: ${SALON_LUXE_COLORS.gold.base}40 !important;
            border: 1px solid ${SALON_LUXE_COLORS.gold.base}40 !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px ${SALON_LUXE_COLORS.gold.base}20 !important;
            border-radius: 0.5rem !important;
            color: ${SALON_LUXE_COLORS.text.primary} !important;
          }

          .hera-select-item {
            background-color: transparent !important;
            color: ${SALON_LUXE_COLORS.champagne.base} !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }

          .hera-select-item[data-radix-collection-item]:hover,
          .hera-select-item[data-highlighted] {
            background-color: ${SALON_LUXE_COLORS.gold.base}20 !important;
            color: ${SALON_LUXE_COLORS.champagne.lightest} !important;
          }

          .hera-select-item[data-state="checked"] {
            background-color: ${SALON_LUXE_COLORS.gold.base}15 !important;
            color: ${SALON_LUXE_COLORS.gold.base} !important;
            font-weight: 600 !important;
          }

          /* Select Trigger Styling */
          .salon-luxe-modal .hera-select-trigger {
            background-color: ${SALON_LUXE_COLORS.charcoal.darker} !important;
            border: 1px solid ${SALON_LUXE_COLORS.gold.base}30 !important;
            color: ${SALON_LUXE_COLORS.text.primary} !important;
            transition: all 0.2s ease !important;
          }

          .salon-luxe-modal .hera-select-trigger:hover {
            border-color: ${SALON_LUXE_COLORS.gold.base}50 !important;
            box-shadow: 0 0 0 1px ${SALON_LUXE_COLORS.gold.base}20 !important;
          }

          .salon-luxe-modal .hera-select-trigger:focus {
            border-color: ${SALON_LUXE_COLORS.gold.base} !important;
            box-shadow: 0 0 0 2px ${SALON_LUXE_COLORS.gold.base}30 !important;
            outline: none !important;
          }

          /* Enhanced Primary Button Styling - Luxury Theme */
          .salon-luxe-modal button[type="submit"],
          .salon-luxe-modal button.primary-button {
            position: relative !important;
            background: linear-gradient(135deg, #F0D06B 0%, #E5C158 50%, ${SALON_LUXE_COLORS.gold.base} 100%) !important;
            color: #000000 !important;
            font-weight: 800 !important;
            border: none !important;
            box-shadow:
              0 4px 16px rgba(212, 175, 55, 0.4),
              0 2px 8px rgba(212, 175, 55, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            text-shadow: 0 1px 3px rgba(255, 255, 255, 0.4) !important;
            overflow: hidden !important;
          }

          /* Shine effect overlay */
          .salon-luxe-modal button[type="submit"]::before,
          .salon-luxe-modal button.primary-button::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: -100% !important;
            width: 100% !important;
            height: 100% !important;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            ) !important;
            transition: left 0.5s ease !important;
          }

          .salon-luxe-modal button[type="submit"]:hover:not(:disabled)::before,
          .salon-luxe-modal button.primary-button:hover:not(:disabled)::before {
            left: 100% !important;
          }

          .salon-luxe-modal button[type="submit"]:hover:not(:disabled),
          .salon-luxe-modal button.primary-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #F5D98F 0%, #F0D06B 50%, #E5C158 100%) !important;
            box-shadow:
              0 6px 24px rgba(212, 175, 55, 0.6),
              0 3px 12px rgba(212, 175, 55, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              0 0 40px rgba(212, 175, 55, 0.3) !important;
            transform: translateY(-2px) scale(1.02) !important;
          }

          .salon-luxe-modal button[type="submit"]:active:not(:disabled),
          .salon-luxe-modal button.primary-button:active:not(:disabled) {
            transform: translateY(0px) scale(0.98) !important;
            box-shadow:
              0 2px 8px rgba(212, 175, 55, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
            transition: all 0.1s ease !important;
          }

          .salon-luxe-modal button[type="submit"]:disabled,
          .salon-luxe-modal button.primary-button:disabled {
            background: linear-gradient(135deg, rgba(140, 120, 83, 0.5) 0%, rgba(140, 120, 83, 0.4) 100%) !important;
            color: rgba(15, 15, 15, 0.95) !important;
            cursor: not-allowed !important;
            opacity: 0.7 !important;
            box-shadow: none !important;
            transform: none !important;
          }

          .salon-luxe-modal button[type="submit"] *,
          .salon-luxe-modal button.primary-button * {
            color: #000000 !important;
            font-weight: 800 !important;
            position: relative !important;
            z-index: 1 !important;
          }

          .salon-luxe-modal button[type="submit"]:disabled *,
          .salon-luxe-modal button.primary-button:disabled * {
            color: rgba(15, 15, 15, 0.95) !important;
            font-weight: 800 !important;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.15) !important;
          }

          /* Animate icons on hover */
          .salon-luxe-modal button[type="submit"]:hover:not(:disabled) svg,
          .salon-luxe-modal button.primary-button:hover:not(:disabled) svg {
            transform: scale(1.1) rotate(5deg) !important;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          }

          /* Enhanced Outline/Secondary Button Styling */
          .salon-luxe-modal button[variant="outline"],
          .salon-luxe-modal button.outline-button {
            position: relative !important;
            background: linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(35, 35, 35, 0.6) 100%) !important;
            border: 2px solid rgba(212, 175, 55, 0.3) !important;
            color: ${SALON_LUXE_COLORS.champagne.base} !important;
            font-weight: 600 !important;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            backdrop-filter: blur(12px) !important;
            box-shadow:
              0 2px 8px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
            overflow: hidden !important;
          }

          /* Subtle glow effect for outline buttons */
          .salon-luxe-modal button[variant="outline"]::after,
          .salon-luxe-modal button.outline-button::after {
            content: '' !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            width: 0 !important;
            height: 0 !important;
            border-radius: 50% !important;
            background: rgba(212, 175, 55, 0.2) !important;
            transform: translate(-50%, -50%) !important;
            transition: width 0.4s ease, height 0.4s ease !important;
          }

          .salon-luxe-modal button[variant="outline"]:hover:not(:disabled)::after,
          .salon-luxe-modal button.outline-button:hover:not(:disabled)::after {
            width: 300px !important;
            height: 300px !important;
          }

          .salon-luxe-modal button[variant="outline"]:hover:not(:disabled),
          .salon-luxe-modal button.outline-button:hover:not(:disabled) {
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%) !important;
            border-color: ${SALON_LUXE_COLORS.gold.base} !important;
            color: ${SALON_LUXE_COLORS.champagne.lightest} !important;
            box-shadow:
              0 4px 16px rgba(212, 175, 55, 0.3),
              0 2px 8px rgba(212, 175, 55, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 30px rgba(212, 175, 55, 0.2) !important;
            transform: translateY(-2px) scale(1.02) !important;
          }

          .salon-luxe-modal button[variant="outline"]:active:not(:disabled),
          .salon-luxe-modal button.outline-button:active:not(:disabled) {
            transform: translateY(0px) scale(0.98) !important;
            box-shadow:
              0 1px 4px rgba(212, 175, 55, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
            transition: all 0.1s ease !important;
          }

          .salon-luxe-modal button[variant="outline"]:disabled,
          .salon-luxe-modal button.outline-button:disabled {
            background: rgba(26, 26, 26, 0.3) !important;
            border-color: rgba(154, 163, 174, 0.2) !important;
            color: rgba(224, 224, 224, 0.3) !important;
            cursor: not-allowed !important;
            opacity: 0.5 !important;
            box-shadow: none !important;
            transform: none !important;
          }

          .salon-luxe-modal button[variant="outline"] *,
          .salon-luxe-modal button.outline-button * {
            color: inherit !important;
            position: relative !important;
            z-index: 1 !important;
          }

          /* Animate outline button icons on hover */
          .salon-luxe-modal button[variant="outline"]:hover:not(:disabled) svg,
          .salon-luxe-modal button.outline-button:hover:not(:disabled) svg {
            transform: scale(1.08) !important;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          }

          /* Input Field Styling - Fix Dark Blue Issue */
          .salon-luxe-modal input[type="text"],
          .salon-luxe-modal input[type="email"],
          .salon-luxe-modal input[type="number"],
          .salon-luxe-modal input[type="tel"],
          .salon-luxe-modal input[type="url"],
          .salon-luxe-modal input[type="password"],
          .salon-luxe-modal textarea {
            background-color: ${SALON_LUXE_COLORS.charcoal.darker} !important;
            border: 1px solid ${SALON_LUXE_COLORS.border.base} !important;
            color: ${SALON_LUXE_COLORS.text.primary} !important;
            transition: all 0.2s ease !important;
          }

          .salon-luxe-modal input[type="text"]:focus,
          .salon-luxe-modal input[type="email"]:focus,
          .salon-luxe-modal input[type="number"]:focus,
          .salon-luxe-modal input[type="tel"]:focus,
          .salon-luxe-modal input[type="url"]:focus,
          .salon-luxe-modal input[type="password"]:focus,
          .salon-luxe-modal textarea:focus {
            border-color: ${SALON_LUXE_COLORS.gold.base} !important;
            box-shadow: 0 0 0 2px ${SALON_LUXE_COLORS.gold.base}30 !important;
            outline: none !important;
          }

          .salon-luxe-modal input::placeholder,
          .salon-luxe-modal textarea::placeholder {
            color: ${SALON_LUXE_COLORS.text.secondary} !important;
            opacity: 0.6 !important;
          }

          /* Extra emphasis for footer buttons */
          .salon-luxe-modal [class*="footer"] button[type="submit"],
          .salon-luxe-modal [class*="footer"] button.primary-button,
          .salon-luxe-modal > div > div > div:last-child button[type="submit"],
          .salon-luxe-modal > div > div > div:last-child button.primary-button {
            background: linear-gradient(135deg, #F5D98F 0%, #F0D06B 40%, #E5C158 70%, ${SALON_LUXE_COLORS.gold.base} 100%) !important;
            box-shadow:
              0 6px 20px rgba(212, 175, 55, 0.5),
              0 3px 10px rgba(212, 175, 55, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              0 0 0 1px rgba(212, 175, 55, 0.4) !important;
          }

          /* Focus states for accessibility */
          .salon-luxe-modal button[type="submit"]:focus-visible,
          .salon-luxe-modal button.primary-button:focus-visible {
            outline: none !important;
            box-shadow:
              0 6px 24px rgba(212, 175, 55, 0.6),
              0 3px 12px rgba(212, 175, 55, 0.4),
              0 0 0 3px rgba(212, 175, 55, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
          }

          .salon-luxe-modal button[variant="outline"]:focus-visible,
          .salon-luxe-modal button.outline-button:focus-visible {
            outline: none !important;
            box-shadow:
              0 4px 16px rgba(212, 175, 55, 0.4),
              0 2px 8px rgba(212, 175, 55, 0.3),
              0 0 0 3px rgba(212, 175, 55, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          }

          /* Loading state animation */
          .salon-luxe-modal button[type="submit"] .animate-spin,
          .salon-luxe-modal button.primary-button .animate-spin,
          .salon-luxe-modal button[variant="outline"] .animate-spin,
          .salon-luxe-modal button.outline-button .animate-spin {
            animation: spin 1s linear infinite !important;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* Ripple effect for button clicks */
          @keyframes buttonRipple {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            100% {
              transform: scale(4);
              opacity: 0;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
