/**
 * HERA Appointment Management API - Universal Architecture
 * 
 * Uses the Sacred 6-Table architecture:
 * - core_entities: Customers, Services, Staff
 * - core_dynamic_data: Service details, staff schedules
 * - core_relationships: Customer->Appointment, Staff->Appointment
 * - universal_transactions: Appointment bookings
 * - universal_transaction_lines: Service line items
 */

import { universalApi } from '@/lib/universal-api'
import { formatDate, addMinutesSafe } from '@/lib/date-utils'
import { parseISO } from 'date-fns'
import { whatsAppService } from './whatsapp-notification-service'

// Smart Code definitions for Appointment Management
export const APPOINTMENT_SMART_CODES = {
  // Entity smart codes
  CUSTOMER: 'HERA.SALON.CRM.CUSTOMER.v1',
  SERVICE: 'HERA.SALON.SERVICE.CATALOG.v1',
  STAFF: 'HERA.SALON.STAFF.PROFILE.v1',
  
  // Transaction smart codes
  APPOINTMENT_BOOKING: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
  APPOINTMENT_CONFIRMATION: 'HERA.SALON.APPOINTMENT.CONFIRM.v1',
  APPOINTMENT_CANCELLATION: 'HERA.SALON.APPOINTMENT.CANCEL.v1',
  APPOINTMENT_COMPLETION: 'HERA.SALON.APPOINTMENT.COMPLETE.v1',
  
  // Relationship smart codes
  CUSTOMER_APPOINTMENT: 'HERA.SALON.REL.CUSTOMER.APPOINTMENT.v1',
  STAFF_APPOINTMENT: 'HERA.SALON.REL.STAFF.APPOINTMENT.v1',
  SERVICE_APPOINTMENT: 'HERA.SALON.REL.SERVICE.APPOINTMENT.v1',
  
  // Dynamic field smart codes
  SERVICE_DETAILS: 'HERA.SALON.SERVICE.DETAILS.v1',
  STAFF_SCHEDULE: 'HERA.SALON.STAFF.SCHEDULE.v1',
  APPOINTMENT_NOTES: 'HERA.SALON.APPOINTMENT.NOTES.v1'
} as const

export interface AppointmentData {
  customerId: string
  serviceId: string
  staffId: string
  appointmentDate: string
  appointmentTime: string
  duration: number
  price?: number
  notes?: string
}

export class AppointmentApi {
  constructor(private api: typeof universalApi) {}

  /**
   * Create a new appointment
   */
  async createAppointment(data: AppointmentData, organizationId: string) {
    // Get customer, service, and staff details
    const [customerResp, serviceResp, staffResp] = await Promise.all([
      this.api.getEntities('customer', organizationId),
      this.api.getEntities('service', organizationId),
      this.api.getEntities('employee', organizationId)
    ])

    const customer = customerResp.data?.find((c: any) => c.id === data.customerId)
    const service = serviceResp.data?.find((s: any) => s.id === data.serviceId)
    const staff = staffResp.data?.find((s: any) => s.id === data.staffId)

    // Create appointment transaction
    const appointmentDateTime = `${data.appointmentDate}T${data.appointmentTime}`
    const endTime = formatDate(addMinutesSafe(parseISO(appointmentDateTime), data.duration), 'HH:mm')

    const appointment = await this.api.createTransaction({
      transaction_type: 'appointment',
      smart_code: APPOINTMENT_SMART_CODES.APPOINTMENT_BOOKING,
      reference_number: `APT-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: data.price || service?.metadata?.price || 0,
      from_entity_id: data.customerId,
      to_entity_id: data.staffId,
      metadata: {
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        end_time: endTime,
        duration: data.duration,
        service_id: data.serviceId,
        service_name: service?.entity_name || 'Service',
        customer_name: customer?.entity_name || 'Customer',
        customer_id: data.customerId,
        staff_id: data.staffId,
        staff_name: staff?.entity_name || 'Staff',
        status: 'pending',
        notes: data.notes
      }
    }, organizationId)

    // Create transaction line for the service
    if (appointment.success && appointment.data) {
      await this.api.createTransactionLine({
        transaction_id: appointment.data.id,
        line_number: 1,
        line_entity_id: data.serviceId,
        quantity: 1,
        unit_price: data.price || service?.metadata?.price || 0,
        line_amount: data.price || service?.metadata?.price || 0,
        metadata: {
          service_name: service?.entity_name,
          duration: data.duration,
          staff_name: staff?.entity_name
        }
      }, organizationId)

      // Create relationships
      await Promise.all([
        this.api.createRelationship({
          from_entity_id: data.customerId,
          to_entity_id: appointment.data.id,
          relationship_type: 'has_appointment',
          smart_code: APPOINTMENT_SMART_CODES.CUSTOMER_APPOINTMENT
        }, organizationId),
        this.api.createRelationship({
          from_entity_id: data.staffId,
          to_entity_id: appointment.data.id,
          relationship_type: 'assigned_to',
          smart_code: APPOINTMENT_SMART_CODES.STAFF_APPOINTMENT
        }, organizationId)
      ])
    }

    return appointment
  }

  /**
   * Get all appointments
   */
  async getAppointments(organizationId: string) {
    const response = await this.api.getTransactions(organizationId)
    
    if (response.success && response.data) {
      // Filter for appointment transactions
      const appointments = response.data.filter((txn: any) => 
        txn.transaction_type === 'appointment' &&
        txn.smart_code === APPOINTMENT_SMART_CODES.APPOINTMENT_BOOKING
      )
      return appointments
    }
    
    return []
  }

  /**
   * Get appointments for a specific date
   */
  async getAppointmentsByDate(date: string, organizationId: string) {
    const appointments = await this.getAppointments(organizationId)
    
    return appointments.filter((apt: any) => 
      apt.metadata?.appointment_date === date
    )
  }

  /**
   * Get appointments for a specific staff member
   */
  async getAppointmentsByStaff(staffId: string, organizationId: string) {
    const appointments = await this.getAppointments(organizationId)
    
    return appointments.filter((apt: any) => 
      apt.to_entity_id === staffId || apt.metadata?.staff_id === staffId
    )
  }

  /**
   * Get appointments for a specific customer
   */
  async getAppointmentsByCustomer(customerId: string, organizationId: string) {
    const appointments = await this.getAppointments(organizationId)
    
    return appointments.filter((apt: any) => 
      apt.from_entity_id === customerId || apt.metadata?.customer_id === customerId
    )
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    organizationId: string,
    reason?: string
  ) {
    // Get the appointment
    const appointments = await this.getAppointments(organizationId)
    const appointment = appointments.find((apt: any) => apt.id === appointmentId)
    
    if (!appointment) {
      throw new Error('Appointment not found')
    }

    // Update the appointment metadata
    const updateResponse = await this.api.updateTransaction(appointmentId, {
      metadata: {
        ...appointment.metadata,
        status,
        status_updated_at: new Date().toISOString(),
        status_reason: reason
      }
    }, organizationId)

    // Create status change transaction for audit trail
    const statusSmartCode = status === 'confirmed' 
      ? APPOINTMENT_SMART_CODES.APPOINTMENT_CONFIRMATION
      : status === 'cancelled'
      ? APPOINTMENT_SMART_CODES.APPOINTMENT_CANCELLATION
      : status === 'completed'
      ? APPOINTMENT_SMART_CODES.APPOINTMENT_COMPLETION
      : APPOINTMENT_SMART_CODES.APPOINTMENT_BOOKING

    await this.api.createTransaction({
      transaction_type: `appointment_${status}`,
      smart_code: statusSmartCode,
      reference_number: `APT-STATUS-${Date.now()}`,
      reference_entity_id: appointmentId,
      transaction_date: new Date().toISOString(),
      total_amount: appointment.total_amount,
      from_entity_id: appointment.from_entity_id,
      to_entity_id: appointment.to_entity_id,
      metadata: {
        original_appointment_id: appointmentId,
        status_change: status,
        previous_status: appointment.metadata.status,
        reason,
        changed_at: new Date().toISOString()
      }
    }, organizationId)

    // Send WhatsApp notification for status changes
    try {
      const customerPhone = await whatsAppService.getCustomerPhone(appointment.from_entity_id, organizationId)
      
      if (customerPhone) {
        if (status === 'confirmed') {
          await whatsAppService.sendAppointmentConfirmation(appointment, customerPhone, organizationId)
          console.log(`✅ WhatsApp confirmation sent to ${customerPhone} for appointment ${appointmentId}`)
        } else if (status === 'cancelled') {
          await whatsAppService.sendAppointmentCancellation(appointment, customerPhone, organizationId, reason)
          console.log(`✅ WhatsApp cancellation sent to ${customerPhone} for appointment ${appointmentId}`)
        }
      } else {
        console.log(`⚠️ No phone number found for customer ${appointment.from_entity_id}`)
      }
    } catch (whatsAppError) {
      // Don't fail the appointment update if WhatsApp fails
      console.error('WhatsApp notification failed:', whatsAppError)
    }

    return updateResponse
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    organizationId: string
  ) {
    // Get the appointment
    const appointments = await this.getAppointments(organizationId)
    const appointment = appointments.find((apt: any) => apt.id === appointmentId)
    
    if (!appointment) {
      throw new Error('Appointment not found')
    }

    // Calculate new end time
    const appointmentDateTime = `${newDate}T${newTime}`
    const endTime = formatDate(
      addMinutesSafe(parseISO(appointmentDateTime), appointment.metadata.duration || 60), 
      'HH:mm'
    )

    // Update the appointment
    return await this.api.updateTransaction(appointmentId, {
      metadata: {
        ...appointment.metadata,
        appointment_date: newDate,
        appointment_time: newTime,
        end_time: endTime,
        rescheduled: true,
        rescheduled_at: new Date().toISOString(),
        previous_date: appointment.metadata.appointment_date,
        previous_time: appointment.metadata.appointment_time
      }
    }, organizationId)
  }

  /**
   * Get available time slots for a specific date and staff
   */
  async getAvailableSlots(
    date: string,
    staffId: string,
    serviceDuration: number,
    organizationId: string
  ) {
    // Get all appointments for the staff on that date
    const appointments = await this.getAppointmentsByDate(date, organizationId)
    const staffAppointments = appointments.filter((apt: any) => 
      apt.to_entity_id === staffId || apt.metadata?.staff_id === staffId
    )

    // Define business hours (this could come from configuration)
    const businessHours = {
      start: '09:00',
      end: '18:00',
      slotDuration: 30 // minutes
    }

    // Generate all possible slots
    const slots = []
    const startTime = parseISO(`${date}T${businessHours.start}`)
    const endTime = parseISO(`${date}T${businessHours.end}`)
    let currentSlot = startTime

    while (currentSlot < endTime) {
      const slotEnd = addMinutesSafe(currentSlot, serviceDuration)
      
      // Check if slot conflicts with existing appointments
      const hasConflict = staffAppointments.some((apt: any) => {
        const aptStart = parseISO(`${apt.metadata.appointment_date}T${apt.metadata.appointment_time}`)
        const aptEnd = parseISO(`${apt.metadata.appointment_date}T${apt.metadata.end_time}`)
        
        return (
          (currentSlot >= aptStart && currentSlot < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (currentSlot <= aptStart && slotEnd >= aptEnd)
        )
      })

      if (!hasConflict && slotEnd <= endTime) {
        slots.push({
          time: formatDate(currentSlot, 'HH:mm'),
          available: true
        })
      }

      currentSlot = addMinutesSafe(currentSlot, businessHours.slotDuration)
    }

    return slots
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(organizationId: string) {
    const appointments = await this.getAppointments(organizationId)
    const now = new Date()
    const today = formatDate(now, 'yyyy-MM-dd')
    const thisMonth = formatDate(now, 'yyyy-MM')

    const todayAppointments = appointments.filter((apt: any) => 
      apt.metadata?.appointment_date === today
    )

    const monthAppointments = appointments.filter((apt: any) => 
      apt.metadata?.appointment_date?.startsWith(thisMonth)
    )

    return {
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      monthAppointments: monthAppointments.length,
      pendingCount: appointments.filter((apt: any) => apt.metadata?.status === 'pending').length,
      confirmedCount: appointments.filter((apt: any) => apt.metadata?.status === 'confirmed').length,
      cancelledCount: appointments.filter((apt: any) => apt.metadata?.status === 'cancelled').length,
      completedCount: appointments.filter((apt: any) => apt.metadata?.status === 'completed').length,
      revenueToday: todayAppointments.reduce((sum: number, apt: any) => sum + (apt.total_amount || 0), 0),
      revenueMonth: monthAppointments.reduce((sum: number, apt: any) => sum + (apt.total_amount || 0), 0)
    }
  }
}

// Export singleton instance
export const appointmentApi = new AppointmentApi(universalApi)