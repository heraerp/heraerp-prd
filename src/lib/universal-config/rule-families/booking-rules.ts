/**
 * HERA Universal Configuration - Booking Rules Family
 * Smart Code: HERA.UNIV.CONFIG.BOOKING.*
 * 
 * Manages appointment booking policies, cancellation rules, and scheduling logic
 */

import type { UniversalRule, Context } from '../universal-config-service'

// Booking-specific context extensions
export interface BookingContext extends Context {
  appointment_time?: string
  service_duration?: number
  is_new_customer?: boolean
  customer_history?: {
    total_bookings: number
    no_shows: number
    cancellations: number
    last_visit?: string
  }
  booking_source?: 'online' | 'phone' | 'walk-in' | 'app'
}

// Booking rule payload types
export interface BookingPayload {
  action_type: 'allow' | 'deny' | 'require_deposit' | 'require_confirmation'
  
  // Booking window constraints
  advance_booking_days?: number
  min_advance_hours?: number
  max_advance_days?: number
  
  // Cancellation policies
  cancellation_hours?: number
  cancellation_fee_percentage?: number
  late_cancellation_fee?: number
  no_show_fee?: number
  
  // Deposit requirements
  deposit_percentage?: number
  deposit_amount?: number
  deposit_required_services?: string[]
  
  // Booking limits
  max_daily_bookings?: number
  max_weekly_bookings?: number
  max_concurrent_bookings?: number
  
  // Confirmation requirements
  confirmation_required?: boolean
  confirmation_method?: 'sms' | 'email' | 'phone' | 'app'
  confirmation_deadline_hours?: number
  
  // Restrictions
  blocked_dates?: string[]
  blocked_time_slots?: TimeSlot[]
  buffer_time_minutes?: number
  
  // Group booking policies
  group_size_threshold?: number
  group_deposit_percentage?: number
  group_advance_notice_days?: number
  
  // Loyalty adjustments
  loyalty_tier_overrides?: {
    [tier: string]: {
      advance_booking_days?: number
      deposit_waived?: boolean
      cancellation_hours?: number
    }
  }
  
  // Messages
  booking_message?: string
  cancellation_message?: string
  confirmation_message?: string
}

export interface TimeSlot {
  start_time: string
  end_time: string
  days?: number[] // 0-6 (Sunday-Saturday)
}

/**
 * Booking rule family definition
 */
export const BookingRuleFamily = {
  // Family identifier
  family: 'HERA.UNIV.CONFIG.BOOKING',
  
  // Sub-families for specific booking scenarios
  subFamilies: {
    GENERAL: 'HERA.UNIV.CONFIG.BOOKING.GENERAL.v1',
    CANCELLATION: 'HERA.UNIV.CONFIG.BOOKING.CANCELLATION.v1',
    DEPOSIT: 'HERA.UNIV.CONFIG.BOOKING.DEPOSIT.v1',
    AVAILABILITY: 'HERA.UNIV.CONFIG.BOOKING.AVAILABILITY.v1',
    GROUP: 'HERA.UNIV.CONFIG.BOOKING.GROUP.v1',
    LOYALTY: 'HERA.UNIV.CONFIG.BOOKING.LOYALTY.v1',
    PEAK_TIME: 'HERA.UNIV.CONFIG.BOOKING.PEAK_TIME.v1',
    NEW_CUSTOMER: 'HERA.UNIV.CONFIG.BOOKING.NEW_CUSTOMER.v1',
    HIGH_DEMAND: 'HERA.UNIV.CONFIG.BOOKING.HIGH_DEMAND.v1',
    SEASONAL: 'HERA.UNIV.CONFIG.BOOKING.SEASONAL.v1'
  },
  
  // Default conditions for booking rules
  defaultConditions: {
    effective_from: new Date().toISOString(),
    days_of_week: [0, 1, 2, 3, 4, 5, 6] // All days
  },
  
  // Default payload values
  defaultPayload: {
    action_type: 'allow' as const,
    advance_booking_days: 30,
    min_advance_hours: 2,
    cancellation_hours: 24,
    cancellation_fee_percentage: 0,
    deposit_percentage: 0,
    max_daily_bookings: 10,
    confirmation_required: false,
    buffer_time_minutes: 0
  },
  
  // Validation function for booking rules
  validate: (rule: UniversalRule): string[] => {
    const errors: string[] = []
    const payload = rule.payload as BookingPayload
    
    // Validate action type
    if (!['allow', 'deny', 'require_deposit', 'require_confirmation'].includes(payload.action_type)) {
      errors.push('Invalid action_type')
    }
    
    // Validate time constraints
    if (payload.min_advance_hours && payload.min_advance_hours < 0) {
      errors.push('min_advance_hours must be positive')
    }
    
    if (payload.advance_booking_days && payload.max_advance_days && 
        payload.advance_booking_days > payload.max_advance_days) {
      errors.push('advance_booking_days cannot exceed max_advance_days')
    }
    
    // Validate percentages
    if (payload.deposit_percentage !== undefined && 
        (payload.deposit_percentage < 0 || payload.deposit_percentage > 100)) {
      errors.push('deposit_percentage must be between 0 and 100')
    }
    
    if (payload.cancellation_fee_percentage !== undefined && 
        (payload.cancellation_fee_percentage < 0 || payload.cancellation_fee_percentage > 100)) {
      errors.push('cancellation_fee_percentage must be between 0 and 100')
    }
    
    // Validate time slots
    if (payload.blocked_time_slots) {
      for (const slot of payload.blocked_time_slots) {
        if (!isValidTimeFormat(slot.start_time) || !isValidTimeFormat(slot.end_time)) {
          errors.push('Invalid time format in blocked_time_slots (use HH:MM)')
        }
      }
    }
    
    return errors
  },
  
  // Merge strategy for booking rules
  mergeStrategy: 'restrictive', // Most restrictive rule wins
  
  // Context requirements for booking decisions
  requiredContext: ['appointment_time', 'service_ids'],
  
  // Sample rule templates
  templates: {
    standard: {
      smart_code: 'HERA.UNIV.CONFIG.BOOKING.GENERAL.v1',
      status: 'active',
      priority: 100,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        action_type: 'allow',
        advance_booking_days: 30,
        min_advance_hours: 2,
        cancellation_hours: 24,
        confirmation_required: false
      }
    },
    
    peakHours: {
      smart_code: 'HERA.UNIV.CONFIG.BOOKING.PEAK_TIME.v1',
      status: 'active',
      priority: 200,
      conditions: {
        effective_from: new Date().toISOString(),
        time_windows: [
          { start_time: '17:00', end_time: '20:00' }, // Evening peak
          { start_time: '11:00', end_time: '14:00' }  // Lunch peak
        ],
        days_of_week: [1, 2, 3, 4, 5] // Weekdays only
      },
      payload: {
        action_type: 'require_deposit',
        deposit_percentage: 20,
        cancellation_hours: 48,
        confirmation_required: true,
        booking_message: 'Peak hours require deposit and 48-hour cancellation notice'
      }
    },
    
    newCustomer: {
      smart_code: 'HERA.UNIV.CONFIG.BOOKING.NEW_CUSTOMER.v1',
      status: 'active',
      priority: 150,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        action_type: 'require_confirmation',
        confirmation_method: 'phone',
        confirmation_deadline_hours: 24,
        advance_booking_days: 14, // Limit for new customers
        max_concurrent_bookings: 1,
        booking_message: 'First-time customers require phone confirmation'
      }
    },
    
    highDemand: {
      smart_code: 'HERA.UNIV.CONFIG.BOOKING.HIGH_DEMAND.v1',
      status: 'active',
      priority: 250,
      conditions: {
        effective_from: new Date().toISOString(),
        utilization_below: 20 // When less than 20% slots available
      },
      payload: {
        action_type: 'require_deposit',
        deposit_percentage: 50,
        cancellation_hours: 72,
        no_show_fee: 100,
        booking_message: 'High demand period - 50% deposit required'
      }
    },
    
    loyaltyPlatinum: {
      smart_code: 'HERA.UNIV.CONFIG.BOOKING.LOYALTY.v1',
      status: 'active',
      priority: 300,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        action_type: 'allow',
        advance_booking_days: 60, // Double the standard
        min_advance_hours: 1,     // Shorter notice
        cancellation_hours: 12,   // More flexible
        deposit_percentage: 0,    // No deposit
        loyalty_tier_overrides: {
          platinum: {
            advance_booking_days: 90,
            deposit_waived: true,
            cancellation_hours: 6
          }
        }
      }
    }
  }
}

// Helper function to validate time format
function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(time)
}

// Type guard for booking payload
export function isBookingPayload(payload: any): payload is BookingPayload {
  return payload && 
    typeof payload.action_type === 'string' &&
    ['allow', 'deny', 'require_deposit', 'require_confirmation'].includes(payload.action_type)
}

// Export types for use in other modules
export type BookingRule = UniversalRule & {
  payload: BookingPayload
}