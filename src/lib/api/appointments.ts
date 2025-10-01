// ================================================================================
// HERA APPOINTMENTS API
// Smart Code: HERA.API.APPOINTMENTS.v1
// Appointments API with mock implementation support
// ================================================================================

import { ApiClient } from './client'
import { z } from 'zod'
import {
  Appointment,
  AppointmentCreate,
  AppointmentTransition,
  AppointmentFilters,
  ActivityEvent,
  ACTION_TO_STATUS,
  isTransitionAllowed
} from '../schemas/appointment'

export class AppointmentsApi {
  constructor(private api: ApiClient) {}

  // List appointments with filters
  async list(params: AppointmentFilters) {
    // In real API: /read-models/v_salon_appointments_upcoming
    return this.api.get<Appointment[]>('/api/v1/salon/appointments', params)
  }

  // Get single appointment
  async get(id: string) {
    return this.api.get<Appointment>(`/api/v1/salon/appointments/${id}`)
  }

  // Create new appointment
  async create(payload: AppointmentCreate) {
    // Maps to POST /universal_transactions
    // smart_code: HERA.SALON.APPOINTMENT.BOOKING.V1
    return this.api.post<Appointment>('/api/v1/salon/appointments', {
      ...payload,
      smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1'
    })
  }

  // Update appointment
  async update(id: string, data: Partial<AppointmentCreate>) {
    return this.api.post<Appointment>(`/api/v1/salon/appointments/${id}`, data)
  }

  // Transition appointment status
  async transition(id: string, body: AppointmentTransition) {
    // Maps to procedures like HERA.SALON.APPOINTMENT.CANCEL_OR_NOSHOW.v1
    return this.api.post<Appointment>(`/api/v1/salon/appointments/${id}/transition`, body)
  }

  // Get appointment activity
  async getActivity(id: string) {
    return this.api.get<ActivityEvent[]>(`/api/v1/salon/appointments/${id}/activity`)
  }

  // Get available time slots
  async getAvailableSlots(params: {
    branch_code: string
    stylist_code: string
    date: string
    service_duration: number
  }) {
    return this.api.get<Array<{ start: string; end: string }>>(
      '/api/v1/salon/appointments/slots',
      params
    )
  }

  // Get upcoming appointments count
  async getUpcomingCount(organizationId: string) {
    return this.api.get<{ count: number }>('/api/v1/salon/appointments/upcoming-count', {
      organization_id: organizationId
    })
  }
}

// Mock implementation that extends the real API
export class MockAppointmentsApi extends AppointmentsApi {
  private mockAppointments: Map<string, Appointment> = new Map()
  private mockActivities: Map<string, ActivityEvent[]> = new Map()

  constructor(api: ApiClient) {
    super(api)
    this.seedMockData()
  }

  private seedMockData() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Sample appointments
    const appointments: Appointment[] = [
      {
        id: 'appt-001',
        code: 'APT-2024-001',
        organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        customer: { id: 'cust-001', name: 'Emma Thompson', code: 'CUST-001' },
        stylist: { id: 'staff-001', name: 'Lisa Chen', code: 'STAFF-001' },
        branch_code: 'MAIN',
        chair_slug: 'chair-1',
        start_time: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(), // 10am
        end_time: new Date(today.getTime() + 11 * 60 * 60 * 1000).toISOString(), // 11am
        status: 'confirmed',
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        services: [{ id: 'srv-001', name: 'Hair Cut & Style', duration: 60, price: 150 }],
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'appt-002',
        code: 'APT-2024-002',
        organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        customer: { id: 'cust-002', name: 'Sarah Johnson', code: 'CUST-002' },
        stylist: { id: 'staff-002', name: 'Maria Rodriguez', code: 'STAFF-002' },
        branch_code: 'MAIN',
        chair_slug: 'chair-2',
        start_time: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(), // 9am
        end_time: new Date(today.getTime() + 9.5 * 60 * 60 * 1000).toISOString(), // 9:30am
        status: 'in_progress',
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        services: [{ id: 'srv-002', name: 'Hair Color', duration: 30, price: 200 }],
        created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        updated_at: now.toISOString()
      },
      {
        id: 'appt-003',
        code: 'APT-2024-003',
        organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        customer: { id: 'cust-003', name: 'Michelle Davis', code: 'CUST-003' },
        stylist: { id: 'staff-001', name: 'Lisa Chen', code: 'STAFF-001' },
        branch_code: 'MAIN',
        start_time: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(), // 2pm
        end_time: new Date(today.getTime() + 15.5 * 60 * 60 * 1000).toISOString(), // 3:30pm
        status: 'confirmed',
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        services: [{ id: 'srv-003', name: 'Hair Treatment', duration: 90, price: 300 }],
        created_at: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      // Tomorrow's appointments
      {
        id: 'appt-004',
        code: 'APT-2024-004',
        organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        customer: { id: 'cust-004', name: 'Jennifer Wilson', code: 'CUST-004' },
        stylist: { id: 'staff-003', name: 'Ahmed Hassan', code: 'STAFF-003' },
        branch_code: 'MAIN',
        start_time: new Date(today.getTime() + 34 * 60 * 60 * 1000).toISOString(), // Tomorrow 10am
        end_time: new Date(today.getTime() + 35 * 60 * 60 * 1000).toISOString(), // Tomorrow 11am
        status: 'confirmed',
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        services: [{ id: 'srv-001', name: 'Hair Cut & Style', duration: 60, price: 150 }],
        created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
      },
      // Completed appointment
      {
        id: 'appt-005',
        code: 'APT-2024-005',
        organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        customer: { id: 'cust-005', name: 'Amanda Brown', code: 'CUST-005' },
        stylist: { id: 'staff-002', name: 'Maria Rodriguez', code: 'STAFF-002' },
        branch_code: 'MAIN',
        start_time: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        end_time: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        status: 'service_complete',
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        services: [{ id: 'srv-004', name: 'Manicure & Pedicure', duration: 60, price: 100 }],
        created_at: new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
      }
    ]

    appointments.forEach(appt => this.mockAppointments.set(appt.id, appt))

    // Sample activities
    this.mockActivities.set('appt-001', [
      {
        id: 'act-001',
        appointment_id: 'appt-001',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        event_type: 'created',
        actor: { id: 'user-001', name: 'Sarah Johnson', type: 'user' },
        details: { initial_status: 'draft' },
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        transaction_id: 'txn-001'
      },
      {
        id: 'act-002',
        appointment_id: 'appt-001',
        timestamp: new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(),
        event_type: 'status_changed',
        actor: { id: 'user-001', name: 'Sarah Johnson', type: 'user' },
        details: { from: 'draft', to: 'confirmed' },
        transaction_id: 'txn-002'
      },
      {
        id: 'act-003',
        appointment_id: 'appt-001',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        event_type: 'whatsapp_sent',
        actor: { id: 'system', name: 'WhatsApp Bot', type: 'system' },
        details: { message_type: 'reminder', template: 'appointment_reminder' }
      }
    ])
  }

  async list(params: AppointmentFilters) {
    await this.mockDelay()

    let appointments = Array.from(this.mockAppointments.values()).filter(
      appt => appt.organization_id === params.organization_id
    )

    if (params.status && params.status.length > 0) {
      appointments = appointments.filter(appt => params.status!.includes(appt.status))
    }

    if (params.from) {
      appointments = appointments.filter(appt => appt.start_time >= params.from!)
    }

    if (params.to) {
      appointments = appointments.filter(appt => appt.start_time <= params.to!)
    }

    if (params.branch_id) {
      appointments = appointments.filter(appt => appt.branch_code === params.branch_id)
    }

    if (params.stylist_id) {
      appointments = appointments.filter(appt => appt.stylist.id === params.stylist_id)
    }

    if (params.customer_id) {
      appointments = appointments.filter(appt => appt.customer.id === params.customer_id)
    }

    return appointments.sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
  }

  async get(id: string) {
    await this.mockDelay()
    const appointment = this.mockAppointments.get(id)
    if (!appointment) {
      throw new Error('Appointment not found')
    }
    return appointment
  }

  async create(payload: AppointmentCreate) {
    await this.mockDelay()

    const id = `appt-${Date.now()}`
    const code = `APT-2024-${this.mockAppointments.size + 1}`
    const now = new Date().toISOString()

    const appointment: Appointment = {
      id,
      code,
      organization_id: payload.organization_id,
      customer: {
        id: payload.customer_code,
        name: 'New Customer',
        code: payload.customer_code
      },
      stylist: {
        id: payload.stylist_code,
        name: 'Assigned Stylist',
        code: payload.stylist_code
      },
      branch_code: payload.branch_code,
      chair_slug: payload.chair_slug,
      start_time: payload.start_time,
      end_time: payload.end_time,
      status: 'confirmed',
      smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
      services: [],
      notes: payload.notes,
      created_at: now,
      updated_at: now
    }

    this.mockAppointments.set(id, appointment)

    // Add creation activity
    this.mockActivities.set(id, [
      {
        id: `act-${Date.now()}`,
        appointment_id: id,
        timestamp: now,
        event_type: 'created',
        actor: { id: 'user-001', name: 'Current User', type: 'user' },
        details: { initial_status: 'confirmed' },
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        transaction_id: `txn-${Date.now()}`
      }
    ])

    // Simulate WhatsApp confirmation
    setTimeout(() => {
      const activities = this.mockActivities.get(id) || []
      activities.push({
        id: `act-${Date.now()}`,
        appointment_id: id,
        timestamp: new Date().toISOString(),
        event_type: 'whatsapp_sent',
        actor: { id: 'system', name: 'WhatsApp Bot', type: 'system' },
        details: { message_type: 'confirmation', template: 'appointment_confirmed' }
      })
      this.mockActivities.set(id, activities)
    }, 2000)

    return appointment
  }

  async update(id: string, data: Partial<AppointmentCreate>) {
    await this.mockDelay()

    const appointment = this.mockAppointments.get(id)
    if (!appointment) {
      throw new Error('Appointment not found')
    }

    Object.assign(appointment, data, { updated_at: new Date().toISOString() })
    return appointment
  }

  async transition(id: string, body: AppointmentTransition) {
    await this.mockDelay()

    const appointment = this.mockAppointments.get(id)
    if (!appointment) {
      throw new Error('Appointment not found')
    }

    // Validate transition
    if (!isTransitionAllowed(appointment.status, body.action)) {
      throw new Error(`Cannot ${body.action} appointment in ${appointment.status} status`)
    }

    const oldStatus = appointment.status
    const newStatus = ACTION_TO_STATUS[body.action]

    appointment.status = newStatus
    appointment.updated_at = new Date().toISOString()

    // Add transition activity
    const activities = this.mockActivities.get(id) || []
    activities.push({
      id: `act-${Date.now()}`,
      appointment_id: id,
      timestamp: appointment.updated_at,
      event_type: 'status_changed',
      actor: { id: 'user-001', name: 'Current User', type: 'user' },
      details: {
        from: oldStatus,
        to: newStatus,
        action: body.action,
        reason: body.reason
      },
      transaction_id: `txn-${Date.now()}`
    })

    // Simulate side effects
    if (body.action === 'confirm') {
      setTimeout(() => {
        activities.push({
          id: `act-${Date.now()}`,
          appointment_id: id,
          timestamp: new Date().toISOString(),
          event_type: 'whatsapp_sent',
          actor: { id: 'system', name: 'WhatsApp Bot', type: 'system' },
          details: { message_type: 'confirmation', template: 'appointment_confirmed' }
        })
      }, 1000)
    }

    if (body.action === 'close') {
      setTimeout(() => {
        activities.push({
          id: `act-${Date.now()}`,
          appointment_id: id,
          timestamp: new Date().toISOString(),
          event_type: 'whatsapp_sent',
          actor: { id: 'system', name: 'WhatsApp Bot', type: 'system' },
          details: { message_type: 'thank_you', template: 'visit_thank_you' }
        })
      }, 1000)
    }

    this.mockActivities.set(id, activities)
    return appointment
  }

  async getActivity(id: string) {
    await this.mockDelay()
    return this.mockActivities.get(id) || []
  }

  async getAvailableSlots(params: {
    branch_code: string
    stylist_code: string
    date: string
    service_duration: number
  }) {
    await this.mockDelay()

    // Mock available slots
    const slots = []
    const date = new Date(params.date)
    const startHour = 9 // 9 AM
    const endHour = 18 // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      const start = new Date(date)
      start.setHours(hour, 0, 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + params.service_duration)

      if (end.getHours() <= endHour) {
        slots.push({
          start: start.toISOString(),
          end: end.toISOString()
        })
      }
    }

    return slots
  }

  async getUpcomingCount(organizationId: string) {
    await this.mockDelay()

    const now = new Date()
    const upcoming = Array.from(this.mockAppointments.values()).filter(
      appt =>
        appt.organization_id === organizationId &&
        new Date(appt.start_time) > now &&
        ['confirmed', 'in_progress'].includes(appt.status)
    )

    return { count: upcoming.length }
  }

  private async mockDelay() {
    const delay = Math.random() * 200 + 100
    return new Promise(resolve => setTimeout(resolve, delay))
  }
}

// Factory function
export function createAppointmentsApi(api: ApiClient): AppointmentsApi {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
  return useMock ? new MockAppointmentsApi(api) : new AppointmentsApi(api)
}

// ================================================================================
// REACT QUERY HOOKS
// ================================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Create a singleton API client to avoid re-renders
const apiClientInstance = new ApiClient({
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
})
const appointmentsApiInstance = createAppointmentsApi(apiClientInstance)

// Hook to get appointment stats
export function useAppointmentStats({
  organizationId,
  date
}: {
  organizationId: string
  date: string
}) {
  return useQuery({
    queryKey: ['appointments', 'stats', organizationId, date],
    queryFn: async () => {
      const appointments = await appointmentsApiInstance.list({
        organization_id: organizationId,
        from: date + 'T00:00:00Z',
        to: date + 'T23:59:59Z'
      })

      const stats = {
        total: appointments.length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        in_progress: appointments.filter(a => a.status === 'in_progress').length,
        completed: appointments.filter(a => a.status === 'service_complete').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length
      }

      return stats
    },
    enabled: !!organizationId && !!date
  })
}

// Hook to list appointments
export function useAppointmentsList({
  organizationId,
  filters
}: {
  organizationId: string
  filters: Partial<AppointmentFilters>
}) {
  const api = createAppointmentsApi(
    new ApiClient({
      baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    })
  )

  return useQuery({
    queryKey: ['appointments', 'list', organizationId, filters],
    queryFn: async () => {
      const appointments = await api.list({
        organization_id: organizationId,
        ...filters
      })

      return { appointments }
    },
    enabled: !!organizationId
  })
}
