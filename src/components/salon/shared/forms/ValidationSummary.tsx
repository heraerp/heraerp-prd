'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface ValidationSummaryProps {
  errors: Record<string, string>
  onErrorClick?: (fieldName: string) => void
  className?: string
}

/**
 * ENTERPRISE VALIDATION SUMMARY
 *
 * Displays all form validation errors in a summary banner at the top of the form.
 * Clicking an error scrolls to and highlights the corresponding field.
 *
 * @example
 * ```tsx
 * const [errors, setErrors] = useState<Record<string, string>>({})
 * const scrollToError = (field: string) => { ... }
 *
 * <ValidationSummary
 *   errors={errors}
 *   onErrorClick={scrollToError}
 * />
 * ```
 */
export function ValidationSummary({ errors, onErrorClick, className = '' }: ValidationSummaryProps) {
  const errorCount = Object.keys(errors).length

  if (errorCount === 0) return null

  return (
    <div
      className={`p-4 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 duration-500 ${className}`}
      style={{
        backgroundColor: `${SALON_LUXE_COLORS.rose}15`,
        borderColor: SALON_LUXE_COLORS.rose
      }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: SALON_LUXE_COLORS.rose }}
        />
        <div className="flex-1">
          <h3 className="text-sm font-bold mb-2" style={{ color: SALON_LUXE_COLORS.rose }}>
            Please fix the following {errorCount === 1 ? 'error' : `${errorCount} errors`}:
          </h3>
          <ul className="space-y-1.5">
            {Object.entries(errors).map(([field, message]) => (
              <li
                key={field}
                className={`text-xs flex items-start gap-2 ${onErrorClick ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                style={{ color: SALON_LUXE_COLORS.rose }}
                onClick={() => onErrorClick?.(field)}
              >
                <span className="font-medium">•</span>
                <span>
                  <span className="font-bold capitalize">{field.replace(/_/g, ' ')}:</span> {message}
                </span>
              </li>
            ))}
          </ul>
          {onErrorClick && (
            <p className="text-xs mt-3" style={{ color: SALON_LUXE_COLORS.bronze }}>
              Click on an error to jump to that field
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
