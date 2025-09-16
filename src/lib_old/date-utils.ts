// Safe date utilities for build compatibility
// This wrapper ensures date-fns functions work properly during static generation

/**
 * Format a date string safely for static generation
 * Falls back to native Date methods if date-fns fails
 */
export function formatDate(date: Date | string, formatStr: string): string {
  try {
    // During build, return a placeholder that will be replaced client-side
    if (typeof window === 'undefined') {
      const d = new Date(date)

      // Basic format patterns
      switch (formatStr) {
        case 'yyyy-MM-dd':
          return d.toISOString().split('T')[0]
        case 'HH:mm':
          return d.toTimeString().slice(0, 5)
        case 'MMM dd':
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        case 'MMM dd, yyyy':
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        default:
          return d.toISOString()
      }
    }

    // Client-side: use date-fns
    const { format } = require('date-fns')
    return format(date, formatStr)
  } catch (error) {
    console.warn('Date formatting error:', error)
    return new Date(date).toISOString()
  }
}

/**
 * Add minutes to a date safely
 */
export function addMinutesSafe(date: Date | string, amount: number): Date {
  try {
    if (typeof window === 'undefined') {
      // Server-side fallback
      const d = new Date(date)
      d.setMinutes(d.getMinutes() + amount)
      return d
    }

    // Client-side: use date-fns
    const { addMinutes } = require('date-fns')
    return addMinutes(date, amount)
  } catch (error) {
    console.warn('Add minutes error:', error)
    const d = new Date(date)
    d.setMinutes(d.getMinutes() + amount)
    return d
  }
}

/**
 * Parse a date string safely
 */
export function parseDateSafe(dateString: string, formatString: string, referenceDate: Date): Date {
  try {
    if (typeof window === 'undefined') {
      // Server-side: basic parsing
      return new Date(dateString)
    }

    // Client-side: use date-fns
    const { parse } = require('date-fns')
    return parse(dateString, formatString, referenceDate)
  } catch (error) {
    console.warn('Date parsing error:', error)
    return new Date(dateString)
  }
}

/**
 * Check if date is today
 */
export function isTodaySafe(date: Date | string): boolean {
  try {
    if (typeof window === 'undefined') {
      // Server-side fallback
      const d = new Date(date)
      const today = new Date()
      return d.toDateString() === today.toDateString()
    }

    // Client-side: use date-fns
    const { isToday } = require('date-fns')
    return isToday(date)
  } catch (error) {
    console.warn('Is today error:', error)
    const d = new Date(date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }
}

/**
 * Check if date is yesterday
 */
export function isYesterdaySafe(date: Date | string): boolean {
  try {
    if (typeof window === 'undefined') {
      // Server-side fallback
      const d = new Date(date)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return d.toDateString() === yesterday.toDateString()
    }

    // Client-side: use date-fns
    const { isYesterday } = require('date-fns')
    return isYesterday(date)
  } catch (error) {
    console.warn('Is yesterday error:', error)
    const d = new Date(date)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return d.toDateString() === yesterday.toDateString()
  }
}

/**
 * Get difference in hours
 */
export function differenceInHoursSafe(dateLeft: Date | string, dateRight: Date | string): number {
  try {
    if (typeof window === 'undefined') {
      // Server-side fallback
      const d1 = new Date(dateLeft)
      const d2 = new Date(dateRight)
      return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60))
    }

    // Client-side: use date-fns
    const { differenceInHours } = require('date-fns')
    return differenceInHours(dateLeft, dateRight)
  } catch (error) {
    console.warn('Difference in hours error:', error)
    const d1 = new Date(dateLeft)
    const d2 = new Date(dateRight)
    return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60))
  }
}

/**
 * Get difference in minutes
 */
export function differenceInMinutesSafe(dateLeft: Date | string, dateRight: Date | string): number {
  try {
    if (typeof window === 'undefined') {
      // Server-side fallback
      const d1 = new Date(dateLeft)
      const d2 = new Date(dateRight)
      return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60))
    }

    // Client-side: use date-fns
    const { differenceInMinutes } = require('date-fns')
    return differenceInMinutes(dateLeft, dateRight)
  } catch (error) {
    console.warn('Difference in minutes error:', error)
    const d1 = new Date(dateLeft)
    const d2 = new Date(dateRight)
    return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60))
  }
}
