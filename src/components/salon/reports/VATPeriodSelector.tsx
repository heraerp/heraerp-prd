/**
 * ================================================================================
 * VAT PERIOD SELECTOR - ENTERPRISE COMPONENT
 * Smart Code: HERA.SALON.REPORTS.VAT.PERIOD_SELECTOR.v1
 * ================================================================================
 *
 * 🇦🇪 UAE FTA COMPLIANCE:
 * - ✅ Quarterly periods (Q1-Q4) - Standard for most businesses
 * - ✅ Monthly periods - Optional for large businesses
 * - ✅ Year selection with range validation
 * - ✅ Salon Luxe theme integration
 * - ✅ Mobile-responsive design
 *
 * ================================================================================
 */

'use client'

import React from 'react'
import { Calendar, TrendingUp } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

// ============================================================================
// TYPES
// ============================================================================

export type VATReportPeriod = 'quarterly' | 'monthly'

export interface VATPeriodSelection {
  period: VATReportPeriod
  quarter?: number // 1-4
  month?: number // 1-12
  year: number
}

interface VATPeriodSelectorProps {
  selected: VATPeriodSelection
  onChange: (selection: VATPeriodSelection) => void
  minYear?: number
  maxYear?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VATPeriodSelector({
  selected,
  onChange,
  minYear = 2020,
  maxYear = new Date().getFullYear()
}: VATPeriodSelectorProps) {
  const quarterLabels = {
    1: 'Q1 (Jan-Mar)',
    2: 'Q2 (Apr-Jun)',
    3: 'Q3 (Jul-Sep)',
    4: 'Q4 (Oct-Dec)'
  }

  const monthLabels = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  )

  const handlePeriodTypeChange = (period: VATReportPeriod) => {
    if (period === 'quarterly') {
      onChange({
        period: 'quarterly',
        quarter: selected.quarter || 1,
        year: selected.year
      })
    } else {
      onChange({
        period: 'monthly',
        month: selected.month || 1,
        year: selected.year
      })
    }
  }

  const handleQuarterChange = (quarter: number) => {
    onChange({
      period: 'quarterly',
      quarter,
      year: selected.year
    })
  }

  const handleMonthChange = (month: number) => {
    onChange({
      period: 'monthly',
      month,
      year: selected.year
    })
  }

  const handleYearChange = (year: number) => {
    onChange({
      ...selected,
      year
    })
  }

  return (
    <div className="space-y-4">
      {/* Period Type Toggle */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: SALON_LUXE_COLORS.bronze.base }}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          VAT Return Period
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handlePeriodTypeChange('quarterly')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
              selected.period === 'quarterly' ? 'scale-105' : ''
            }`}
            style={{
              background: selected.period === 'quarterly'
                ? `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}30 0%, ${SALON_LUXE_COLORS.gold.base}15 100%)`
                : SALON_LUXE_COLORS.charcoal.dark,
              border: `1px solid ${
                selected.period === 'quarterly'
                  ? SALON_LUXE_COLORS.gold.base + '60'
                  : SALON_LUXE_COLORS.bronze.base + '30'
              }`,
              color: selected.period === 'quarterly'
                ? SALON_LUXE_COLORS.gold.base
                : SALON_LUXE_COLORS.champagne.base
            }}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Quarterly
            <span
              className="block text-xs mt-1"
              style={{
                color: selected.period === 'quarterly'
                  ? SALON_LUXE_COLORS.gold.base
                  : SALON_LUXE_COLORS.bronze.base,
                opacity: 0.7
              }}
            >
              FTA Standard
            </span>
          </button>

          <button
            onClick={() => handlePeriodTypeChange('monthly')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
              selected.period === 'monthly' ? 'scale-105' : ''
            }`}
            style={{
              background: selected.period === 'monthly'
                ? `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}30 0%, ${SALON_LUXE_COLORS.gold.base}15 100%)`
                : SALON_LUXE_COLORS.charcoal.dark,
              border: `1px solid ${
                selected.period === 'monthly'
                  ? SALON_LUXE_COLORS.gold.base + '60'
                  : SALON_LUXE_COLORS.bronze.base + '30'
              }`,
              color: selected.period === 'monthly'
                ? SALON_LUXE_COLORS.gold.base
                : SALON_LUXE_COLORS.champagne.base
            }}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Monthly
            <span
              className="block text-xs mt-1"
              style={{
                color: selected.period === 'monthly'
                  ? SALON_LUXE_COLORS.gold.base
                  : SALON_LUXE_COLORS.bronze.base,
                opacity: 0.7
              }}
            >
              Optional
            </span>
          </button>
        </div>
      </div>

      {/* Year Selection */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: SALON_LUXE_COLORS.bronze.base }}
        >
          Tax Year
        </label>
        <select
          value={selected.year}
          onChange={e => handleYearChange(parseInt(e.target.value))}
          className="w-full min-h-[44px] px-4 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
            border: `1px solid ${SALON_LUXE_COLORS.bronze.base}30`,
            color: SALON_LUXE_COLORS.champagne.base
          }}
        >
          {years.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Quarterly Selection */}
      {selected.period === 'quarterly' && (
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: SALON_LUXE_COLORS.bronze.base }}
          >
            Select Quarter
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(quarter => (
              <button
                key={quarter}
                onClick={() => handleQuarterChange(quarter)}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                  selected.quarter === quarter ? 'scale-105' : ''
                }`}
                style={{
                  background: selected.quarter === quarter
                    ? `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald.base}30 0%, ${SALON_LUXE_COLORS.emerald.base}15 100%)`
                    : SALON_LUXE_COLORS.charcoal.dark,
                  border: `1px solid ${
                    selected.quarter === quarter
                      ? SALON_LUXE_COLORS.emerald.base + '60'
                      : SALON_LUXE_COLORS.bronze.base + '30'
                  }`,
                  color: selected.quarter === quarter
                    ? SALON_LUXE_COLORS.emerald.base
                    : SALON_LUXE_COLORS.champagne.base
                }}
              >
                {quarterLabels[quarter as keyof typeof quarterLabels]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Selection */}
      {selected.period === 'monthly' && (
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: SALON_LUXE_COLORS.bronze.base }}
          >
            Select Month
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {monthLabels.map((monthLabel, index) => {
              const monthNumber = index + 1
              return (
                <button
                  key={monthNumber}
                  onClick={() => handleMonthChange(monthNumber)}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    selected.month === monthNumber ? 'scale-105' : ''
                  }`}
                  style={{
                    background: selected.month === monthNumber
                      ? `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald.base}30 0%, ${SALON_LUXE_COLORS.emerald.base}15 100%)`
                      : SALON_LUXE_COLORS.charcoal.dark,
                    border: `1px solid ${
                      selected.month === monthNumber
                        ? SALON_LUXE_COLORS.emerald.base + '60'
                        : SALON_LUXE_COLORS.bronze.base + '30'
                    }`,
                    color: selected.month === monthNumber
                      ? SALON_LUXE_COLORS.emerald.base
                      : SALON_LUXE_COLORS.champagne.base
                  }}
                >
                  {monthLabel}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Period Display */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: `${SALON_LUXE_COLORS.gold.base}10`,
          border: `1px solid ${SALON_LUXE_COLORS.gold.base}30`
        }}
      >
        <p className="text-sm font-medium" style={{ color: SALON_LUXE_COLORS.gold.base }}>
          Selected Period:
        </p>
        <p className="text-lg font-bold mt-1" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
          {selected.period === 'quarterly'
            ? `${quarterLabels[selected.quarter! as keyof typeof quarterLabels]} ${selected.year}`
            : `${monthLabels[selected.month! - 1]} ${selected.year}`}
        </p>
        <p className="text-xs mt-1" style={{ color: SALON_LUXE_COLORS.bronze.base }}>
          {selected.period === 'quarterly'
            ? `Quarter ${selected.quarter} - Due ${getDueDate(selected.quarter!, selected.year)}`
            : `Month ${selected.month} - Due ${getDueDateMonthly(selected.month!, selected.year)}`}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate VAT return due date (28 days after quarter end)
 */
function getDueDate(quarter: number, year: number): string {
  const quarterEndDates = {
    1: new Date(year, 3, 28), // March 31 + 28 days = April 28
    2: new Date(year, 6, 28), // June 30 + 28 days = July 28
    3: new Date(year, 9, 28), // Sep 30 + 28 days = Oct 28
    4: new Date(year + 1, 0, 28) // Dec 31 + 28 days = Jan 28 (next year)
  }

  const dueDate = quarterEndDates[quarter as keyof typeof quarterEndDates]
  return dueDate.toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Calculate monthly VAT return due date (28 days after month end)
 */
function getDueDateMonthly(month: number, year: number): string {
  // Get last day of month, then add 28 days
  const lastDayOfMonth = new Date(year, month, 0)
  const dueDate = new Date(lastDayOfMonth)
  dueDate.setDate(lastDayOfMonth.getDate() + 28)

  return dueDate.toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
