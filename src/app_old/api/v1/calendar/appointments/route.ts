// HERA Universal Calendar - Appointments API
// Handles appointment management using HERA 6-table architecture

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { UniversalAppointment, AppointmentLine } from '@/types/calendar.types'
import { calendarSmartCodeService } from '@/services/calendarSmartCodeService'

// Mock database operations - replace with actual HERA API calls
class MockCalendarAppointmentDB {
  private static appointments: (UniversalAppointment & {
    resource_allocations: AppointmentLine[]
  })[] = [
    // Healthcare Appointments
    {
      transaction_id: 'appt_001',
      organization_id: 'org_healthcare_demo',
      transaction_type: 'appointment',
      smart_code: 'HERA.HLTH.CRM.TXN.APPT.V1',
      reference_number: 'APT-001',
      transaction_date: new Date('2025-08-06T10:00:00Z'),
      status: 'confirmed',
      title: 'Annual Physical Examination',
      description: 'Routine annual checkup with lab work',
      start_time: new Date('2025-08-06T10:00:00Z'),
      end_time: new Date('2025-08-06T11:00:00Z'),
      duration_minutes: 60,
      customer_entity_id: 'patient_001',
      appointment_type: 'consultation',
      priority: 'medium',
      notes: 'Patient has history of hypertension. Fasting required for lab work.',
      industry_data: {
        patient_name: 'John Smith',
        procedure_type: 'examination',
        insurance_info: 'Blue Cross Blue Shield - Policy #12345',
        resource_allocations: [
          {
            line_id: 'line_001',
            transaction_id: 'appt_001',
            entity_id: 'res_001', // Dr. Sarah Johnson
            line_type: 'resource_allocation',
            quantity: 1,
            duration_minutes: 60,
            allocation_type: 'primary',
            smart_code: 'HERA.HLTH.CRM.LIN.RESV.V1'
          },
          {
            line_id: 'line_002',
            transaction_id: 'appt_001',
            entity_id: 'res_002', // Examination Room A
            line_type: 'resource_allocation',
            quantity: 1,
            duration_minutes: 60,
            allocation_type: 'primary',
            smart_code: 'HERA.HLTH.CRM.LIN.RESV.V1'
          }
        ]
      },
      resource_allocations: [
        {
          line_id: 'line_001',
          transaction_id: 'appt_001',
          entity_id: 'res_001',
          line_type: 'resource_allocation',
          quantity: 1,
          duration_minutes: 60,
          allocation_type: 'primary',
          smart_code: 'HERA.HLTH.CRM.LIN.RESV.V1'
        },
        {
          line_id: 'line_002',
          transaction_id: 'appt_001',
          entity_id: 'res_002',
          line_type: 'resource_allocation',
          quantity: 1,
          duration_minutes: 60,
          allocation_type: 'primary',
          smart_code: 'HERA.HLTH.CRM.LIN.RESV.V1'
        }
      ]
    },
    // Restaurant Reservation
    {
      transaction_id: 'resv_001',
      organization_id: 'org_restaurant_demo',
      transaction_type: 'reservation',
      smart_code: 'HERA.REST.CRM.TXN.RESV.V1',
      reference_number: 'RSV-001',
      transaction_date: new Date('2025-08-06T19:00:00Z'),
      status: 'confirmed',
      title: 'Anniversary Dinner',
      description: 'Special anniversary celebration for 2 guests',
      start_time: new Date('2025-08-06T19:00:00Z'),
      end_time: new Date('2025-08-06T21:00:00Z'),
      duration_minutes: 120,
      customer_entity_id: 'customer_001',
      appointment_type: 'reservation',
      priority: 'high',
      notes: 'Requesting window table if available. Wine pairing preferred.',
      industry_data: {
        party_size: 2,
        occasion: 'anniversary',
        special_requests: 'Wine pairing menu, window seating preferred',
        resource_allocations: [
          {
            line_id: 'line_003',
            transaction_id: 'resv_001',
            entity_id: 'res_003', // Table 5
            line_type: 'resource_allocation',
            quantity: 1,
            duration_minutes: 120,
            allocation_type: 'primary',
            smart_code: 'HERA.REST.CRM.LIN.RESV.V1'
          },
          {
            line_id: 'line_004',
            transaction_id: 'resv_001',
            entity_id: 'res_004', // Mario Rossi
            line_type: 'resource_allocation',
            quantity: 1,
            duration_minutes: 30, // Chef consultation for wine pairing
            allocation_type: 'secondary',
            smart_code: 'HERA.REST.CRM.LIN.RESV.V1'
          }
        ]
      },
      resource_allocations: [
        {
          line_id: 'line_003',
          transaction_id: 'resv_001',
          entity_id: 'res_003',
          line_type: 'resource_allocation',
          quantity: 1,
          duration_minutes: 120,
          allocation_type: 'primary',
          smart_code: 'HERA.REST.CRM.LIN.RESV.V1'
        },
        {
          line_id: 'line_004',
          transaction_id: 'resv_001',
          entity_id: 'res_004',
          line_type: 'resource_allocation',
          quantity: 1,
          duration_minutes: 30,
          allocation_type: 'secondary',
          smart_code: 'HERA.REST.CRM.LIN.RESV.V1'
        }
      ]
    },
    // Professional Services Meeting
    {
      transaction_id: 'meet_001',
      organization_id: 'org_professional_demo',
      transaction_type: 'appointment',
      smart_code: 'HERA.PROF.CRM.TXN.MEET.V1',
      reference_number: 'MTG-001',
      transaction_date: new Date('2025-08-07T14:00:00Z'),
      status: 'confirmed',
      title: 'Strategic Planning Session',
      description: 'Q3 strategic planning and budget review',
      start_time: new Date('2025-08-07T14:00:00Z'),
      end_time: new Date('2025-08-07T16:00:00Z'),
      duration_minutes: 120,
      customer_entity_id: 'client_001',
      appointment_type: 'meeting',
      priority: 'high',
      notes: 'Prepare Q2 performance reports and Q3 projections.',
      industry_data: {
        client_name: 'Tech Innovations LLC',
        meeting_type: 'strategy',
        project_reference: 'PROJ-2025-001',
        resource_allocations: [
          {
            line_id: 'line_005',
            transaction_id: 'meet_001',
            entity_id: 'res_005', // Conference Room Alpha
            line_type: 'resource_allocation',
            quantity: 1,
            duration_minutes: 120,
            allocation_type: 'primary',
            smart_code: 'HERA.PROF.CRM.LIN.RESV.V1'
          }
        ]
      },
      resource_allocations: [
        {
          line_id: 'line_005',
          transaction_id: 'meet_001',
          entity_id: 'res_005',
          line_type: 'resource_allocation',
          quantity: 1,
          duration_minutes: 120,
          allocation_type: 'primary',
          smart_code: 'HERA.PROF.CRM.LIN.RESV.V1'
        }
      ]
    },
    // Manufacturing Maintenance
    {
      transaction_id: 'maint_001',
      organization_id: 'org_manufacturing_demo',
      transaction_type: 'maintenance',
      smart_code: 'HERA.MFG.CRM.TXN.MAINT.V1',
      reference_number: 'MNT-001',
      transaction_date: new Date('2025-08-08T08:00:00Z'),
      status: 'confirmed',
      title: 'CNC Machine Preventive Maintenance',
      description: 'Scheduled preventive maintenance and calibration',
      start_time: new Date('2025-08-08T08:00:00Z'),
      end_time: new Date('2025-08-08T12:00:00Z'),
      duration_minutes: 240,
      customer_entity_id: undefined,
      appointment_type: 'maintenance',
      priority: 'high',
      notes: 'Replace cutting tools, check alignment, update firmware.',
      industry_data: {
        work_order: 'WO-2025-0234',
        maintenance_type: 'preventive',
        technician_notes: 'Machine showing slight vibration in X-axis. Check motor mounts.',
        resource_allocations: [
          {
            line_id: 'line_006',
            transaction_id: 'maint_001',
            entity_id: 'res_006', // CNC Machine #3
            line_type: 'resource_allocation',
            quantity: 1,
            duration_minutes: 240,
            allocation_type: 'primary',
            smart_code: 'HERA.MFG.CRM.LIN.RESV.V1'
          }
        ]
      },
      resource_allocations: [
        {
          line_id: 'line_006',
          transaction_id: 'maint_001',
          entity_id: 'res_006',
          line_type: 'resource_allocation',
          quantity: 1,
          duration_minutes: 240,
          allocation_type: 'primary',
          smart_code: 'HERA.MFG.CRM.LIN.RESV.V1'
        }
      ]
    }
  ]

  static async getByOrganization(
    organizationId: string,
    filters?: {
      start_date?: Date
      end_date?: Date
      resource_ids?: string[]
      status?: string[]
      appointment_type?: string
    }
  ): Promise<UniversalAppointment[]> {
    let appointments = this.appointments.filter(a => a.organization_id === organizationId)

    if (filters) {
      if (filters.start_date) {
        appointments = appointments.filter(a => a.start_time >= filters.start_date!)
      }
      if (filters.end_date) {
        appointments = appointments.filter(a => a.start_time <= filters.end_date!)
      }
      if (filters.resource_ids && filters.resource_ids.length > 0) {
        appointments = appointments.filter(a =>
          a.resource_allocations.some(ra => filters.resource_ids!.includes(ra.entity_id))
        )
      }
      if (filters.status && filters.status.length > 0) {
        appointments = appointments.filter(a => filters.status!.includes(a.status))
      }
      if (filters.appointment_type) {
        appointments = appointments.filter(a => a.appointment_type === filters.appointment_type)
      }
    }

    // Remove resource_allocations from the return to match UniversalAppointment type
    return appointments.map(({ resource_allocations, ...appointment }) => appointment)
  }

  static async getById(
    appointmentId: string
  ): Promise<(UniversalAppointment & { resource_allocations: AppointmentLine[] }) | null> {
    return this.appointments.find(a => a.transaction_id === appointmentId) || null
  }

  static async create(
    appointment: Partial<UniversalAppointment>,
    resourceAllocations: Partial<AppointmentLine>[]
  ): Promise<UniversalAppointment> {
    const newAppointment = {
      transaction_id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organization_id: appointment.organization_id!,
      transaction_type: appointment.transaction_type || 'appointment',
      smart_code: appointment.smart_code || 'HERA.UNI.CRM.TXN.APPT.V1',
      reference_number: appointment.reference_number || `APT-${Date.now()}`,
      transaction_date: new Date(),
      status: appointment.status || 'draft',
      title: appointment.title!,
      description: appointment.description || '',
      start_time: appointment.start_time!,
      end_time: appointment.end_time!,
      duration_minutes: appointment.duration_minutes || 60,
      customer_entity_id: appointment.customer_entity_id,
      appointment_type: appointment.appointment_type || 'appointment',
      priority: appointment.priority || 'medium',
      notes: appointment.notes || '',
      industry_data: {
        ...appointment.industry_data,
        resource_allocations: resourceAllocations.map((alloc, index) => ({
          line_id: alloc.line_id || `line_${Date.now()}_${index}`,
          transaction_id: newAppointment.transaction_id,
          entity_id: alloc.entity_id!,
          line_type: 'resource_allocation',
          quantity: alloc.quantity || 1,
          duration_minutes: alloc.duration_minutes || appointment.duration_minutes || 60,
          allocation_type: alloc.allocation_type || 'primary',
          smart_code: alloc.smart_code || 'HERA.UNI.CRM.LIN.RESV.V1'
        }))
      },
      resource_allocations: resourceAllocations.map((alloc, index) => ({
        line_id: alloc.line_id || `line_${Date.now()}_${index}`,
        transaction_id: newAppointment.transaction_id,
        entity_id: alloc.entity_id!,
        line_type: 'resource_allocation',
        quantity: alloc.quantity || 1,
        duration_minutes: alloc.duration_minutes || appointment.duration_minutes || 60,
        allocation_type: alloc.allocation_type || 'primary',
        smart_code: alloc.smart_code || 'HERA.UNI.CRM.LIN.RESV.V1'
      }))
    } as UniversalAppointment & { resource_allocations: AppointmentLine[] }

    this.appointments.push(newAppointment)

    // Return without resource_allocations to match UniversalAppointment type
    const { resource_allocations, ...appointmentOnly } = newAppointment
    return appointmentOnly
  }

  static async update(
    appointmentId: string,
    updates: Partial<UniversalAppointment>,
    resourceAllocations?: Partial<AppointmentLine>[]
  ): Promise<UniversalAppointment | null> {
    const index = this.appointments.findIndex(a => a.transaction_id === appointmentId)
    if (index === -1) return null

    // Update appointment data
    this.appointments[index] = {
      ...this.appointments[index],
      ...updates,
      transaction_date: new Date() // Update modified timestamp
    }

    // Update resource allocations if provided
    if (resourceAllocations) {
      this.appointments[index].resource_allocations = resourceAllocations.map((alloc, idx) => ({
        line_id: alloc.line_id || `line_${Date.now()}_${idx}`,
        transaction_id: appointmentId,
        entity_id: alloc.entity_id!,
        line_type: 'resource_allocation',
        quantity: alloc.quantity || 1,
        duration_minutes: alloc.duration_minutes || updates.duration_minutes || 60,
        allocation_type: alloc.allocation_type || 'primary',
        smart_code: alloc.smart_code || 'HERA.UNI.CRM.LIN.RESV.V1'
      }))

      // Also update in industry_data
      this.appointments[index].industry_data = {
        ...this.appointments[index].industry_data,
        resource_allocations: this.appointments[index].resource_allocations
      }
    }

    const { resource_allocations, ...appointmentOnly } = this.appointments[index]
    return appointmentOnly
  }

  static async delete(appointmentId: string): Promise<boolean> {
    const index = this.appointments.findIndex(a => a.transaction_id === appointmentId)
    if (index === -1) return false

    this.appointments.splice(index, 1)
    return true
  }

  static async cancel(
    appointmentId: string,
    reason?: string
  ): Promise<UniversalAppointment | null> {
    const index = this.appointments.findIndex(a => a.transaction_id === appointmentId)
    if (index === -1) return null

    this.appointments[index].status = 'cancelled'
    this.appointments[index].notes =
      (this.appointments[index].notes || '') +
      `\n\nCancelled: ${reason || 'No reason provided'} (${new Date().toISOString()})`

    const { resource_allocations, ...appointmentOnly } = this.appointments[index]
    return appointmentOnly
  }
}

// GET /api/v1/calendar/appointments
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const organizationId = headersList.get('X-Organization-ID')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)

    const filters: any = {}

    if (searchParams.get('start_date')) {
      filters.start_date = new Date(searchParams.get('start_date')!)
    }
    if (searchParams.get('end_date')) {
      filters.end_date = new Date(searchParams.get('end_date')!)
    }
    if (searchParams.get('resource_ids')) {
      filters.resource_ids = searchParams.get('resource_ids')!.split(',')
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',')
    }
    if (searchParams.get('appointment_type')) {
      filters.appointment_type = searchParams.get('appointment_type')!
    }

    const appointments = await MockCalendarAppointmentDB.getByOrganization(organizationId, filters)

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

// POST /api/v1/calendar/appointments
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const organizationId = headersList.get('X-Organization-ID')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const { appointment, resource_allocations } = await request.json()

    // Ensure organization_id is set
    appointment.organization_id = organizationId

    // Auto-generate smart code if not provided
    if (!appointment.smart_code && appointment.title) {
      const classification = calendarSmartCodeService.autoClassifyAppointment(
        appointment.title,
        appointment.industry_data?.industry || 'universal'
      )
      appointment.smart_code = classification.smartCode
    }

    // Validate required fields
    if (!appointment.title || !appointment.start_time || !appointment.end_time) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      )
    }

    if (!resource_allocations || resource_allocations.length === 0) {
      return NextResponse.json(
        { error: 'At least one resource allocation is required' },
        { status: 400 }
      )
    }

    // Calculate duration if not provided
    if (!appointment.duration_minutes) {
      appointment.duration_minutes = Math.round(
        (new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) /
          (1000 * 60)
      )
    }

    const newAppointment = await MockCalendarAppointmentDB.create(appointment, resource_allocations)

    return NextResponse.json(newAppointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
