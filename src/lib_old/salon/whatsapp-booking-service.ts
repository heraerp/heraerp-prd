/**
 * HERA Salon WhatsApp Booking Service
 * Handles appointment booking via WhatsApp with sacred table integration
 */

import { universalApi } from '@/lib/universal-api'

interface BookingRequest {
  customerPhone: string
  customerName: string
  isNewCustomer: boolean
  serviceId: string
  serviceName: string
  stylistId?: string
  stylistName?: string
  appointmentDate: Date
  duration: number // minutes
  price: number
  organizationId: string
  specialNotes?: string
  depositAmount?: number
}

interface BookingResponse {
  success: boolean
  appointmentId?: string
  confirmationMessage: string
  calendarLink?: string
  paymentLink?: string
  error?: string
}

export class WhatsAppBookingService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Create a complete appointment booking with sacred table integration
   */
  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    try {
      // 1. Create or retrieve customer entity
      const customer = await this.getOrCreateCustomer(request)

      // 2. Retrieve service and stylist entities
      const service = await this.getServiceEntity(request.serviceId)
      const stylist = request.stylistId ? await this.getStylistEntity(request.stylistId) : null

      // 3. Create appointment transaction
      const appointment = await this.createAppointmentTransaction(
        customer,
        service,
        stylist,
        request
      )

      // 4. Create relationships
      await this.createAppointmentRelationships(
        appointment.id,
        customer.id,
        service.id,
        stylist?.id
      )

      // 5. Store custom data
      await this.storeCustomData(appointment.id, request)

      // 6. Generate calendar invite
      const calendarLink = await this.generateCalendarInvite(appointment, request)

      // 7. Generate payment link if deposit required
      const paymentLink = request.depositAmount
        ? await this.generatePaymentLink(appointment.id, request.depositAmount)
        : undefined

      // 8. Create confirmation message
      const confirmationMessage = this.generateConfirmationMessage(
        request,
        appointment.transaction_code
      )

      return {
        success: true,
        appointmentId: appointment.id,
        confirmationMessage,
        calendarLink,
        paymentLink
      }
    } catch (error) {
      console.error('Booking creation failed:', error)
      return {
        success: false,
        confirmationMessage:
          'Sorry, we encountered an error creating your booking. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get existing customer or create new one
   */
  private async getOrCreateCustomer(request: BookingRequest) {
    universalApi.setOrganizationId(this.organizationId)

    if (!request.isNewCustomer) {
      // Search for existing customer by phone
      const customers = await universalApi.getEntitiesByType('customer')
      const existing = customers.find(c => {
        // Check dynamic data for phone number
        return c.dynamic_data?.phone === request.customerPhone
      })

      if (existing) return existing
    }

    // Create new customer
    const customer = await universalApi.createEntity({
      entity_type: 'customer',
      entity_name: request.customerName,
      entity_code: `CUST-${Date.now()}`,
      smart_code: 'HERA.SALON.CUSTOMER.PERSON.v1',
      organization_id: this.organizationId
    })

    // Store phone number in dynamic data
    await universalApi.setDynamicField(
      customer.id,
      'phone',
      request.customerPhone,
      'HERA.SALON.CUSTOMER.PHONE.v1'
    )

    return customer
  }

  /**
   * Get service entity
   */
  private async getServiceEntity(serviceId: string) {
    universalApi.setOrganizationId(this.organizationId)
    return await universalApi.getEntity(serviceId)
  }

  /**
   * Get stylist entity
   */
  private async getStylistEntity(stylistId: string) {
    universalApi.setOrganizationId(this.organizationId)
    return await universalApi.getEntity(stylistId)
  }

  /**
   * Create appointment transaction
   */
  private async createAppointmentTransaction(
    customer: any,
    service: any,
    stylist: any | null,
    request: BookingRequest
  ) {
    universalApi.setOrganizationId(this.organizationId)

    const transaction = await universalApi.createTransaction({
      transaction_type: 'appointment_booking',
      transaction_code: `APT-${Date.now()}`,
      transaction_date: request.appointmentDate,
      total_amount: request.price,
      from_entity_id: customer.id, // Customer booking the appointment
      to_entity_id: stylist?.id || service.id, // Stylist or service as target
      smart_code: 'HERA.SALON.APPOINTMENT.TXN.v1',
      metadata: {
        service_name: request.serviceName,
        stylist_name: request.stylistName || 'Any Available',
        duration_minutes: request.duration,
        status: 'confirmed',
        booking_source: 'whatsapp',
        whatsapp_phone: request.customerPhone
      },
      line_items: [
        {
          line_number: 1,
          line_entity_id: service.id,
          line_type: 'service_line',
          quantity: 1,
          unit_price: request.price,
          line_amount: request.price,
          smart_code: 'HERA.SALON.APPOINTMENT.LINE.SERVICE.v1',
          metadata: {
            service_name: request.serviceName,
            duration: request.duration
          }
        }
      ]
    })

    return transaction
  }

  /**
   * Create appointment relationships
   */
  private async createAppointmentRelationships(
    appointmentId: string,
    customerId: string,
    serviceId: string,
    stylistId?: string
  ) {
    universalApi.setOrganizationId(this.organizationId)

    // Customer → Appointment
    await universalApi.createRelationship({
      from_entity_id: customerId,
      to_entity_id: appointmentId,
      relationship_type: 'has_appointment',
      smart_code: 'HERA.SALON.REL.CUSTOMER.APPOINTMENT.v1',
      metadata: {
        created_via: 'whatsapp_booking'
      }
    })

    // Appointment → Service
    await universalApi.createRelationship({
      from_entity_id: appointmentId,
      to_entity_id: serviceId,
      relationship_type: 'for_service',
      smart_code: 'HERA.SALON.REL.APPOINTMENT.SERVICE.v1'
    })

    // Appointment → Stylist
    if (stylistId) {
      await universalApi.createRelationship({
        from_entity_id: appointmentId,
        to_entity_id: stylistId,
        relationship_type: 'with_stylist',
        smart_code: 'HERA.SALON.REL.APPOINTMENT.STYLIST.v1'
      })
    }
  }

  /**
   * Store custom booking data
   */
  private async storeCustomData(appointmentId: string, request: BookingRequest) {
    universalApi.setOrganizationId(this.organizationId)

    if (request.specialNotes) {
      await universalApi.setDynamicField(
        appointmentId,
        'special_notes',
        request.specialNotes,
        'HERA.SALON.APPOINTMENT.NOTES.v1'
      )
    }

    if (request.depositAmount) {
      await universalApi.setDynamicField(
        appointmentId,
        'deposit_amount',
        request.depositAmount.toString(),
        'HERA.SALON.APPOINTMENT.DEPOSIT.v1'
      )
    }

    // Store WhatsApp booking metadata
    await universalApi.setDynamicField(
      appointmentId,
      'booking_channel',
      'whatsapp',
      'HERA.SALON.APPOINTMENT.CHANNEL.v1'
    )
  }

  /**
   * Generate calendar invite (.ics file)
   */
  private async generateCalendarInvite(appointment: any, request: BookingRequest): Promise<string> {
    const startTime = new Date(request.appointmentDate)
    const endTime = new Date(startTime.getTime() + request.duration * 60000)

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HERA Salon//WhatsApp Booking//EN
BEGIN:VEVENT
UID:${appointment.id}@herasalon.com
DTSTAMP:${this.formatICSDate(new Date())}
DTSTART:${this.formatICSDate(startTime)}
DTEND:${this.formatICSDate(endTime)}
SUMMARY:${request.serviceName} at Luxury Salon Dubai
DESCRIPTION:Service: ${request.serviceName}\\nStylist: ${request.stylistName || 'Any Available'}\\nPrice: AED ${request.price}\\nBooking ID: ${appointment.transaction_code}
LOCATION:Luxury Salon Dubai, Marina Walk
END:VEVENT
END:VCALENDAR`

    // In production, upload to cloud storage and return URL
    // For now, return data URI
    const dataUri = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`
    return dataUri
  }

  /**
   * Generate payment link for deposit
   */
  private async generatePaymentLink(appointmentId: string, amount: number): Promise<string> {
    // In production, integrate with Stripe/Razorpay
    // For now, return a placeholder
    return `https://pay.herasalon.com/deposit/${appointmentId}?amount=${amount}`
  }

  /**
   * Generate confirmation message
   */
  private generateConfirmationMessage(request: BookingRequest, confirmationCode: string): string {
    return `✅ Appointment Confirmed!

📍 Service: ${request.serviceName}
👩 Stylist: ${request.stylistName || 'Any Available'}
📅 Date: ${request.appointmentDate.toLocaleDateString()}
⏰ Time: ${request.appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
💰 Price: AED ${request.price}
📋 Booking ID: ${confirmationCode}

${request.depositAmount ? `💳 Deposit Required: AED ${request.depositAmount}\n` : ''}

We'll send you a reminder 24 hours before your appointment.

Thank you for choosing Luxury Salon Dubai! 🌟`
  }

  /**
   * Format date for ICS file
   */
  private formatICSDate(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  }

  /**
   * Process incoming WhatsApp message and route to appropriate handler
   */
  async processIncomingMessage(message: any): Promise<string> {
    // This would integrate with WhatsApp Business API webhooks
    // Parse message intent and route to appropriate flow

    const messageText = message.text?.body?.toLowerCase() || ''

    if (messageText.includes('book') || messageText.includes('appointment')) {
      return this.startBookingFlow(message.from)
    } else if (messageText.includes('cancel')) {
      return this.handleCancellation(message.from)
    } else if (messageText.includes('reschedule')) {
      return this.handleReschedule(message.from)
    } else {
      return this.getWelcomeMessage()
    }
  }

  /**
   * Start interactive booking flow
   */
  private startBookingFlow(customerPhone: string): string {
    return `Welcome to Luxury Salon Dubai! 💅✨

I'm your booking assistant. How can I help you today?

1️⃣ Book Appointment
2️⃣ Check Availability
3️⃣ View Services
4️⃣ Contact Salon

Please reply with a number to continue.`
  }

  /**
   * Handle appointment cancellation
   */
  private handleCancellation(customerPhone: string): string {
    return `I can help you cancel your appointment. Please provide your booking ID or the date of your appointment.`
  }

  /**
   * Handle appointment rescheduling
   */
  private handleReschedule(customerPhone: string): string {
    return `I'd be happy to help you reschedule. Please provide your booking ID or current appointment date.`
  }

  /**
   * Get welcome message
   */
  private getWelcomeMessage(): string {
    return `Welcome to Luxury Salon Dubai! 💇‍♀️✨

How can we help you today?
• Book an appointment
• View our services
• Check our location
• Speak to our team

Reply with what you'd like to do!`
  }
}
