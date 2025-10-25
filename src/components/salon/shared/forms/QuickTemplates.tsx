'use client'

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

export interface Template {
  label: string
  value: string
  icon?: React.ReactNode
}

interface QuickTemplatesProps {
  templates: Template[]
  onSelect: (template: Template) => void
  buttonLabel?: string
  columns?: 1 | 2 | 3 | 4
  className?: string
}

/**
 * ENTERPRISE QUICK TEMPLATES SELECTOR
 *
 * Provides one-click template insertion for common form field values.
 * Great for standardizing responses and improving UX.
 *
 * @example
 * ```tsx
 * const LEAVE_REASON_TEMPLATES = [
 *   { label: 'Annual Holiday', value: 'Annual leave for personal vacation and rest.' },
 *   { label: 'Sick Leave', value: 'Medical reasons requiring time off.' },
 * ]
 *
 * <QuickTemplates
 *   templates={LEAVE_REASON_TEMPLATES}
 *   onSelect={(template) => setReason(template.value)}
 *   buttonLabel="Quick Reasons"
 *   columns={3}
 * />
 * ```
 */
export function QuickTemplates({
  templates,
  onSelect,
  buttonLabel = 'Quick Templates',
  columns = 3,
  className = ''
}: QuickTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (template: Template) => {
    onSelect(template)
    setIsOpen(false)
  }

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  }[columns]

  return (
    <div className={className}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: `${SALON_LUXE_COLORS.gold.base}20`,
          color: SALON_LUXE_COLORS.gold.base,
          border: `1px solid ${SALON_LUXE_COLORS.gold.base}40`
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {buttonLabel}
      </button>

      {/* Templates Panel */}
      {isOpen && (
        <div
          className="mt-3 p-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            backgroundColor: `${SALON_LUXE_COLORS.gold.base}10`,
            border: `1px solid ${SALON_LUXE_COLORS.gold.base}30`
          }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: SALON_LUXE_COLORS.bronze }}>
            Click a template to auto-fill:
          </p>
          <div className={`grid ${gridColsClass} gap-2`}>
            {templates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(template)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95 text-left flex items-center gap-2"
                style={{
                  backgroundColor: SALON_LUXE_COLORS.charcoal.darker,
                  color: SALON_LUXE_COLORS.champagne.base,
                  border: `1px solid ${SALON_LUXE_COLORS.gold.base}40`
                }}
              >
                {template.icon && <span className="flex-shrink-0">{template.icon}</span>}
                <span className="flex-1">{template.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
