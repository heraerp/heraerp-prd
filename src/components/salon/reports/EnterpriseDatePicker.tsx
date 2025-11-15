/**
 * HERA DNA SALES REPORTS: Enterprise Date Picker Component
 * Smart Code: HERA.SALON.REPORTS.COMPONENT.DATE_PICKER.v1
 *
 * ✅ ENTERPRISE: Luxury-themed date selection for daily sales reports
 * Provides intuitive date navigation with Salon Luxe styling
 *
 * Features:
 * - Salon Luxe theme integration (gold, charcoal, champagne)
 * - Today shortcut button
 * - Previous/Next day navigation
 * - Calendar dropdown with native date input
 * - Mobile-responsive design (44px touch targets)
 * - Active state feedback with luxury animations
 */

'use client'

import React, { useEffect, useState } from 'react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, isToday, startOfDay } from 'date-fns'

export interface EnterpriseDatePickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  className?: string
  minDate?: Date
  maxDate?: Date
}

export function EnterpriseDatePicker({
  selectedDate,
  onDateChange,
  className = '',
  minDate,
  maxDate
}: EnterpriseDatePickerProps) {
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

  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1)
    if (!minDate || newDate >= minDate) {
      onDateChange(newDate)
    }
  }

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1)
    if (!maxDate || newDate <= maxDate) {
      onDateChange(newDate)
    }
  }

  const handleToday = () => {
    onDateChange(startOfDay(new Date()))
    setIsOpen(false)
  }

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    if (!isNaN(newDate.getTime())) {
      onDateChange(startOfDay(newDate))
    }
  }

  const isPreviousDisabled = minDate ? selectedDate <= minDate : false
  const isNextDisabled = maxDate ? selectedDate >= maxDate : false
  const isTodaySelected = isToday(selectedDate)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Luxury date display with navigation */}
      <div className="flex items-center gap-2">
        {/* Previous day button */}
        <button
          onClick={handlePreviousDay}
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

        {/* Current date display (clickable to open calendar) */}
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
                {format(selectedDate, 'MMM dd, yyyy')}
              </span>
              <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                {format(selectedDate, 'EEEE')}
              </span>
            </div>
          </div>
          {isTodaySelected && (
            <span
              className="text-xs font-bold px-2 py-1 rounded"
              style={{
                backgroundColor: `${LUXE_COLORS.gold}20`,
                color: LUXE_COLORS.gold
              }}
            >
              Today
            </span>
          )}
        </button>

        {/* Next day button */}
        <button
          onClick={handleNextDay}
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

      {/* Luxury dropdown calendar */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-2xl overflow-hidden z-50 border backdrop-blur-md"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoal}f8`,
            borderColor: `${LUXE_COLORS.gold}40`
          }}
        >
          {/* Today shortcut button */}
          {!isTodaySelected && (
            <button
              onClick={handleToday}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 transition-all duration-150 active:scale-98 font-medium"
              style={{
                backgroundColor: `${LUXE_COLORS.gold}20`,
                color: LUXE_COLORS.gold
              }}
            >
              <Calendar className="w-4 h-4" />
              Jump to Today
            </button>
          )}

          {/* Divider */}
          {!isTodaySelected && (
            <div
              className="h-px mx-4"
              style={{ backgroundColor: `${LUXE_COLORS.gold}20` }}
            />
          )}

          {/* Native date input with luxury styling */}
          <div className="p-4">
            <label
              className="block text-xs font-medium mb-2"
              style={{ color: LUXE_COLORS.bronze }}
            >
              Select Date
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateInput}
              min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
              max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
              className="w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 border-2"
              style={{
                backgroundColor: `${LUXE_COLORS.charcoalLight}`,
                color: LUXE_COLORS.champagne,
                borderColor: `${LUXE_COLORS.gold}40`
              }}
            />
          </div>

          {/* Quick date shortcuts */}
          <div
            className="px-4 pb-4 pt-2 space-y-2"
            style={{ borderTop: `1px solid ${LUXE_COLORS.gold}20` }}
          >
            <p
              className="text-xs font-medium mb-2"
              style={{ color: LUXE_COLORS.bronze }}
            >
              Quick Select
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onDateChange(subDays(startOfDay(new Date()), 1))
                  setIsOpen(false)
                }}
                className="px-3 py-2 rounded text-xs font-medium transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoalLight}`,
                  color: LUXE_COLORS.champagne,
                  border: `1px solid ${LUXE_COLORS.gold}30`
                }}
              >
                Yesterday
              </button>
              <button
                onClick={() => {
                  onDateChange(subDays(startOfDay(new Date()), 7))
                  setIsOpen(false)
                }}
                className="px-3 py-2 rounded text-xs font-medium transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoalLight}`,
                  color: LUXE_COLORS.champagne,
                  border: `1px solid ${LUXE_COLORS.gold}30`
                }}
              >
                Last Week
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnterpriseDatePicker
