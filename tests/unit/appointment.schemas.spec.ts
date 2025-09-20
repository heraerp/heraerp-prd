// ================================================================================
// HERA APPOINTMENT SCHEMAS UNIT TESTS
// Smart Code: HERA.TEST.UNIT.APPOINTMENT.SCHEMAS.v1
// Test appointment schema validation and state machine
// ================================================================================

import { describe, it, expect } from 'vitest'
import { 
  Appointment,
  AppointmentCreate, 
  AppointmentTransition,
  getAllowedTransitions,
  isTransitionAllowed,
  ACTION_TO_STATUS,
} from '@/lib/schemas/appointment'

describe('Appointment Schemas', () => {
  describe('AppointmentCreate validation', () => {
    it('should accept valid appointment data', () => {
      const validData = {
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        customer_code: 'CUST-001',
        stylist_code: 'STAFF-001',
        branch_code: 'MAIN',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        services: ['srv-001'],
        notes: 'Test appointment',
      }

      const result = AppointmentCreate.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject appointment with end time before start time', () => {
      const invalidData = {
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        customer_code: 'CUST-001',
        stylist_code: 'STAFF-001',
        branch_code: 'MAIN',
        start_time: '2024-01-15T11:00:00Z',
        end_time: '2024-01-15T10:00:00Z', // Before start
        services: ['srv-001'],
      }

      const result = AppointmentCreate.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('End time must be after start time')
      }
    })

    it('should reject appointment with empty services', () => {
      const invalidData = {
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        customer_code: 'CUST-001',
        stylist_code: 'STAFF-001',
        branch_code: 'MAIN',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        services: [], // Empty
      }

      const result = AppointmentCreate.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('At least one service is required')
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        // Missing customer_code, stylist_code, etc
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      const result = AppointmentCreate.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid organization ID', () => {
      const invalidData = {
        organization_id: 'not-a-uuid',
        customer_code: 'CUST-001',
        stylist_code: 'STAFF-001',
        branch_code: 'MAIN',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        services: ['srv-001'],
      }

      const result = AppointmentCreate.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AppointmentTransition validation', () => {
    it('should accept valid transition actions', () => {
      const validTransitions = [
        'confirm',
        'start',
        'complete',
        'mark_paid',
        'close',
        'cancel',
        'no_show'
      ]

      validTransitions.forEach(action => {
        const result = AppointmentTransition.safeParse({ action })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid transition actions', () => {
      const result = AppointmentTransition.safeParse({ 
        action: 'invalid_action' 
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional fields', () => {
      const transition = {
        action: 'cancel',
        reason: 'Customer requested',
        window_hours: 24,
      }

      const result = AppointmentTransition.safeParse(transition)
      expect(result.success).toBe(true)
    })
  })

  describe('State Machine', () => {
    it('should return correct allowed transitions for each status', () => {
      expect(getAllowedTransitions('draft')).toEqual(['confirm', 'cancel'])
      expect(getAllowedTransitions('confirmed')).toEqual(['start', 'cancel', 'no_show'])
      expect(getAllowedTransitions('in_progress')).toEqual(['complete', 'cancel'])
      expect(getAllowedTransitions('service_complete')).toEqual(['mark_paid', 'cancel'])
      expect(getAllowedTransitions('paid')).toEqual(['close'])
      expect(getAllowedTransitions('closed')).toEqual([])
      expect(getAllowedTransitions('cancelled')).toEqual([])
    })

    it('should validate allowed transitions correctly', () => {
      // Valid transitions
      expect(isTransitionAllowed('draft', 'confirm')).toBe(true)
      expect(isTransitionAllowed('confirmed', 'start')).toBe(true)
      expect(isTransitionAllowed('in_progress', 'complete')).toBe(true)
      expect(isTransitionAllowed('service_complete', 'mark_paid')).toBe(true)
      expect(isTransitionAllowed('paid', 'close')).toBe(true)

      // Invalid transitions
      expect(isTransitionAllowed('draft', 'start')).toBe(false)
      expect(isTransitionAllowed('confirmed', 'complete')).toBe(false)
      expect(isTransitionAllowed('closed', 'cancel')).toBe(false)
      expect(isTransitionAllowed('cancelled', 'confirm')).toBe(false)
    })

    it('should map actions to correct resulting status', () => {
      expect(ACTION_TO_STATUS['confirm']).toBe('confirmed')
      expect(ACTION_TO_STATUS['start']).toBe('in_progress')
      expect(ACTION_TO_STATUS['complete']).toBe('service_complete')
      expect(ACTION_TO_STATUS['mark_paid']).toBe('paid')
      expect(ACTION_TO_STATUS['close']).toBe('closed')
      expect(ACTION_TO_STATUS['cancel']).toBe('cancelled')
      expect(ACTION_TO_STATUS['no_show']).toBe('cancelled')
    })
  })

  describe('Appointment entity validation', () => {
    it('should accept valid appointment entity', () => {
      const validAppointment = {
        id: 'appt-001',
        code: 'APT-2024-001',
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        customer: {
          id: 'cust-001',
          name: 'John Doe',
          code: 'CUST-001'
        },
        stylist: {
          id: 'staff-001',
          name: 'Jane Smith',
          code: 'STAFF-001'
        },
        branch_code: 'MAIN',
        chair_slug: 'chair-1',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        status: 'confirmed',
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
        services: [
          { id: 'srv-001', name: 'Haircut', duration: 60, price: 50 }
        ],
        created_at: '2024-01-14T12:00:00Z',
        updated_at: '2024-01-14T12:00:00Z',
      }

      const result = Appointment.safeParse(validAppointment)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status values', () => {
      const invalidAppointment = {
        id: 'appt-001',
        code: 'APT-2024-001',
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        customer: { id: 'cust-001', name: 'John Doe', code: 'CUST-001' },
        stylist: { id: 'staff-001', name: 'Jane Smith', code: 'STAFF-001' },
        branch_code: 'MAIN',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        status: 'invalid_status', // Invalid
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
        created_at: '2024-01-14T12:00:00Z',
        updated_at: '2024-01-14T12:00:00Z',
      }

      const result = Appointment.safeParse(invalidAppointment)
      expect(result.success).toBe(false)
    })
  })
})