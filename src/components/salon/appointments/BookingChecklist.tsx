// ================================================================================
// BOOKING CHECKLIST COMPONENT
// Smart Code: HERA.COMPONENTS.SALON.APPOINTMENTS.CHECKLIST.v1
// Enterprise-grade validation checklist for appointment booking
// ================================================================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Circle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationResult } from '@/hooks/useAppointmentValidation'

interface BookingChecklistProps {
  validation: ValidationResult
  onFieldClick?: (fieldId: string) => void
  className?: string
}

export function BookingChecklist({
  validation,
  onFieldClick,
  className
}: BookingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [prevProgress, setPrevProgress] = useState(validation.progress)

  // Auto-collapse when 100% complete
  useEffect(() => {
    if (validation.progress === 100 && prevProgress < 100) {
      // Delay collapse for celebration effect
      const timer = setTimeout(() => setIsExpanded(false), 1500)
      return () => clearTimeout(timer)
    }
    // Auto-expand if validation changes from complete to incomplete
    if (validation.progress < 100 && prevProgress === 100) {
      setIsExpanded(true)
    }
    setPrevProgress(validation.progress)
  }, [validation.progress, prevProgress])

  // Determine checklist status color and styling
  const getStatusColor = () => {
    if (validation.progress === 100) return 'text-emerald-400'
    if (validation.progress >= 60) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getStatusBorder = () => {
    if (validation.progress === 100) return 'border-emerald-500/30'
    if (validation.progress >= 60) return 'border-amber-500/30'
    return 'border-rose-500/30'
  }

  const getProgressBarColor = () => {
    if (validation.progress === 100) return '#10b981' // emerald-500
    if (validation.progress >= 60) return '#f59e0b' // amber-500
    return '#ef4444' // rose-500
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300',
        getStatusBorder(),
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${validation.progress === 100 ? 'rgba(16,185,129,0.3)' : 'rgba(212,175,55,0.3)'}`,
        boxShadow: validation.progress === 100
          ? '0 8px 32px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 8px 32px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        style={{ color: '#F5E6C8' }}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
              validation.progress === 100
                ? 'bg-emerald-500/20'
                : 'bg-amber-500/20'
            )}
          >
            {validation.progress === 100 ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold" style={{ color: '#F5E6C8' }}>
              Booking Checklist
            </h3>
            <p className="text-xs" style={{ color: '#B8956A' }}>
              {validation.completedCount} of {validation.totalCount} complete
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress Percentage */}
          <div
            className={cn('text-sm font-bold', getStatusColor())}
          >
            {validation.progress}%
          </div>

          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" style={{ color: '#D4AF37' }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: '#D4AF37' }} />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div
        className="h-1 bg-white/5 relative overflow-hidden"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${validation.progress}%`,
            background: `linear-gradient(90deg, ${getProgressBarColor()} 0%, ${getProgressBarColor()}dd 100%)`,
            boxShadow: `0 0 12px ${getProgressBarColor()}66`
          }}
        />
      </div>

      {/* Checklist Items - Collapsible */}
      {isExpanded && (
        <div className="px-6 py-4 space-y-2">
          {validation.fields.map((field) => (
            <button
              key={field.id}
              onClick={() => !field.isComplete && onFieldClick?.(field.id)}
              disabled={field.isComplete}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg transition-all',
                field.isComplete
                  ? 'cursor-default'
                  : 'hover:bg-white/5 cursor-pointer active:scale-98'
              )}
              style={{
                background: field.isComplete
                  ? 'rgba(16,185,129,0.05)'
                  : 'rgba(212,175,55,0.05)',
                border: field.isComplete
                  ? '1px solid rgba(16,185,129,0.15)'
                  : '1px solid rgba(212,175,55,0.2)'
              }}
            >
              {/* Status Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
                  field.isComplete
                    ? 'bg-emerald-500/20'
                    : 'border-2 border-amber-400/40 animate-pulse'
                )}
              >
                {field.isComplete ? (
                  <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                ) : (
                  <Circle className="w-3 h-3 text-amber-400" strokeWidth={2} />
                )}
              </div>

              {/* Field Info */}
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      field.isComplete ? 'line-through opacity-60' : ''
                    )}
                    style={{ color: field.isComplete ? '#B8956A' : '#F5E6C8' }}
                  >
                    {field.label}
                  </p>
                </div>

                {/* Value or Hint */}
                {field.value && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: '#B8956A' }}
                  >
                    {field.value}
                  </p>
                )}

                {!field.isComplete && field.hint && (
                  <p
                    className="text-xs mt-0.5 italic"
                    style={{ color: '#D4AF37' }}
                  >
                    💡 {field.hint}
                  </p>
                )}
              </div>
            </button>
          ))}

          {/* Success Message */}
          {validation.progress === 100 && (
            <div
              className="mt-4 p-3 rounded-lg text-center animate-in fade-in duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)',
                border: '1px solid rgba(16,185,129,0.3)'
              }}
            >
              <p className="text-sm font-medium text-emerald-400">
                ✓ All requirements met! Ready to book.
              </p>
            </div>
          )}

          {/* Missing Fields Warning */}
          {validation.missingFields.length > 0 && validation.progress < 100 && (
            <div
              className="mt-4 p-3 rounded-lg"
              style={{
                background: 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.2)'
              }}
            >
              <p className="text-xs text-amber-400">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                {validation.missingFields.length} field
                {validation.missingFields.length > 1 ? 's' : ''} remaining
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
