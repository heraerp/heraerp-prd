'use client'

import React, { forwardRef, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface FieldWithErrorProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  hint?: string
}

/**
 * ENTERPRISE FIELD WITH ERROR WRAPPER
 *
 * Wraps any form field with:
 * - Label with required indicator
 * - Error message display
 * - Optional hint text
 * - Shake animation on error
 * - Ref forwarding for scrolling to errors
 *
 * @example
 * ```tsx
 * <FieldWithError
 *   ref={fieldRef}
 *   label="Email Address"
 *   error={errors.email}
 *   required
 *   hint="Use your work email"
 * >
 *   <input type="email" value={email} onChange={...} />
 * </FieldWithError>
 * ```
 */
export const FieldWithError = forwardRef<HTMLDivElement, FieldWithErrorProps>(
  ({ label, error, required, children, className = '', hint }, ref) => {
    return (
      <div ref={ref} className={className}>
        <label className="block text-sm font-medium mb-2" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
          {label} {required && <span style={{ color: SALON_LUXE_COLORS.rose }}>*</span>}
        </label>

        {children}

        {/* Error or Hint Display */}
        <div className="flex items-center justify-between mt-2 min-h-[20px]">
          {error ? (
            <div className="flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-left-1 duration-300" style={{ color: SALON_LUXE_COLORS.rose }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : hint ? (
            <div className="text-xs" style={{ color: SALON_LUXE_COLORS.bronze, opacity: 0.7 }}>
              {hint}
            </div>
          ) : null}
        </div>

        {/* Shake animation CSS */}
        <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </div>
    )
  }
)

FieldWithError.displayName = 'FieldWithError'
