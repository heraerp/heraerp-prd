/**
 * HERA DNA SALES REPORTS: Enterprise Month/Year Picker Component
 * Smart Code: HERA.SALON.REPORTS.COMPONENT.MONTH_YEAR_PICKER.v1
 *
 * ✅ ENTERPRISE: Luxury-themed month/year selection for monthly sales reports
 * Provides intuitive period navigation with Salon Luxe styling
 *
 * Features:
 * - Salon Luxe theme integration (gold, charcoal, champagne)
 * - Current month shortcut button
 * - Previous/Next month navigation with year awareness
 * - Month/Year dropdown selectors
 * - Mobile-responsive design (44px touch targets)
 * - Active state feedback with luxury animations
 * - Year boundaries (prevent future dates)
 */

'use client'

import React, { useEffect, useState } from 'react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { format, startOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns'

export interface EnterpriseMonthYearPickerProps {
  selectedPeriod: { month: number; year: number } // month: 1-12, year: YYYY
  onPeriodChange: (period: { month: number; year: number }) => void
  className?: string
  minYear?: number
  maxYear?: number
}

const MONTHS = [
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' }
]

export function EnterpriseMonthYearPicker({
  selectedPeriod,
  onPeriodChange,
  className = '',
  minYear = 2020,
  maxYear = new Date().getFullYear()
}: EnterpriseMonthYearPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handlePreviousMonth = () => {
    if (selectedPeriod.month === 1) {
      // Prevent going before minYear
      if (selectedPeriod.year <= minYear) return
      onPeriodChange({ month: 12, year: selectedPeriod.year - 1 })
    } else {
      onPeriodChange({ month: selectedPeriod.month - 1, year: selectedPeriod.year })
    }
  }

  const handleNextMonth = () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Prevent going into the future
    if (
      selectedPeriod.year > currentYear ||
      (selectedPeriod.year === currentYear && selectedPeriod.month >= currentMonth)
    ) {
      return
    }

    if (selectedPeriod.month === 12) {
      // Prevent going beyond maxYear
      if (selectedPeriod.year >= maxYear) return
      onPeriodChange({ month: 1, year: selectedPeriod.year + 1 })
    } else {
      onPeriodChange({ month: selectedPeriod.month + 1, year: selectedPeriod.year })
    }
  }

  const handleCurrentMonth = () => {
    const now = new Date()
    onPeriodChange({ month: now.getMonth() + 1, year: now.getFullYear() })
    setIsOpen(false)
  }

  const selectedDate = new Date(selectedPeriod.year, selectedPeriod.month - 1, 1)
  const isCurrentMonth = isSameMonth(selectedDate, new Date())

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const isPreviousDisabled =
    selectedPeriod.year === minYear && selectedPeriod.month === 1
  const isNextDisabled =
    selectedPeriod.year === currentYear && selectedPeriod.month === currentMonth

  const selectedMonthLabel =
    MONTHS.find(m => m.value === selectedPeriod.month)?.label || ''

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Luxury month/year display with navigation */}
      <div className="flex items-center gap-2">
        {/* Previous month button */}
        <button
          onClick={handlePreviousMonth}
          disabled={isPreviousDisabled}
          className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoal}`,
            border: `1px solid ${LUXE_COLORS.gold}40`,
            color: LUXE_COLORS.gold
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Current month/year display (clickable to open selector) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 min-h-[48px] px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-between gap-2"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoal}`,
            color: LUXE_COLORS.champagne,
            border: `1px solid ${LUXE_COLORS.gold}40`
          }}
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            <div className="flex flex-col items-start">
              <span className="font-bold">
                {selectedMonthLabel} {selectedPeriod.year}
              </span>
              <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                Monthly Report
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCurrentMonth && (
              <span
                className="text-xs font-bold px-2 py-1 rounded"
                style={{
                  backgroundColor: `${LUXE_COLORS.gold}20`,
                  color: LUXE_COLORS.gold
                }}
              >
                Current
              </span>
            )}
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              style={{ color: LUXE_COLORS.bronze }}
            />
          </div>
        </button>

        {/* Next month button */}
        <button
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoal}`,
            border: `1px solid ${LUXE_COLORS.gold}40`,
            color: LUXE_COLORS.gold
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Luxury dropdown month/year selector */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-2xl overflow-hidden z-50 border backdrop-blur-md"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoal}f8`,
            borderColor: `${LUXE_COLORS.gold}40`,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {/* Current month shortcut */}
          {!isCurrentMonth && (
            <>
              <button
                onClick={handleCurrentMonth}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 transition-all duration-150 active:scale-98 font-medium"
                style={{
                  backgroundColor: `${LUXE_COLORS.gold}20`,
                  color: LUXE_COLORS.gold
                }}
              >
                <Calendar className="w-4 h-4" />
                Jump to Current Month
              </button>
              <div
                className="h-px mx-4"
                style={{ backgroundColor: `${LUXE_COLORS.gold}20` }}
              />
            </>
          )}

          {/* Year selector */}
          <div className="p-4">
            <label
              className="block text-xs font-medium mb-2"
              style={{ color: LUXE_COLORS.bronze }}
            >
              Select Year
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
                const year = maxYear - i
                const isSelected = selectedPeriod.year === year
                return (
                  <button
                    key={year}
                    onClick={() =>
                      onPeriodChange({ ...selectedPeriod, year })
                    }
                    className="px-3 py-2 rounded text-sm font-medium transition-all duration-150 active:scale-95"
                    style={{
                      backgroundColor: isSelected
                        ? `${LUXE_COLORS.gold}`
                        : `${LUXE_COLORS.charcoalLight}`,
                      color: isSelected ? LUXE_COLORS.charcoal : LUXE_COLORS.champagne,
                      border: `1px solid ${LUXE_COLORS.gold}${isSelected ? '' : '30'}`
                    }}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Month selector */}
          <div className="p-4 pt-0">
            <label
              className="block text-xs font-medium mb-2"
              style={{ color: LUXE_COLORS.bronze }}
            >
              Select Month
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map(month => {
                const isSelected = selectedPeriod.month === month.value
                // Disable future months
                const isFuture =
                  selectedPeriod.year === currentYear && month.value > currentMonth
                return (
                  <button
                    key={month.value}
                    onClick={() =>
                      !isFuture && onPeriodChange({ ...selectedPeriod, month: month.value })
                    }
                    disabled={isFuture}
                    className="px-3 py-2 rounded text-sm font-medium transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isSelected
                        ? `${LUXE_COLORS.gold}`
                        : `${LUXE_COLORS.charcoalLight}`,
                      color: isSelected
                        ? LUXE_COLORS.charcoal
                        : isFuture
                          ? LUXE_COLORS.bronze
                          : LUXE_COLORS.champagne,
                      border: `1px solid ${LUXE_COLORS.gold}${isSelected ? '' : '30'}`
                    }}
                  >
                    {month.short}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnterpriseMonthYearPicker
