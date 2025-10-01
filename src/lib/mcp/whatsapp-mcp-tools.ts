/**
 * MCP (Model Context Protocol) Tools for WhatsApp Integration
 * Stateless tools with clear contracts for Claude + HERA DNA integration
 */

import { universalApi } from '@/lib/universal-api'

// Tool type definitions
export interface MCPToolResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}

export interface MCPToolInput {
  organization_id: string
  [key: string]: any
}

// Calendar Tools
export interface FindSlotsInput extends MCPToolInput {
  service_id?: string
  stylist_id?: string
  duration: number // minutes
  location_id?: string
  date_range: {
    start: Date
    end: Date
  }
}

export interface FindSlotsOutput {
  slots: Array<{
    start: string
    end: string
    stylist_id: string
    stylist_name: string
    available: boolean
  }>
}

export interface BookSlotInput extends MCPToolInput {
  customer_id: string
  service_ids: string[]
  slot: {
    start: string
    end: string
  }
  stylist_id?: string
  location_id: string
}

export interface BookSlotOutput {
  appointment_id: string
  ics_url: string
  confirmation_code: string
}

// WhatsApp Tools
export interface WASendInput extends MCPToolInput {
  to: string // WhatsApp ID
  kind: 'freeform' | 'template'
  template_id?: string
  variables?: Record<string, string>
  buttons?: string[]
  body?: string // for freeform
}

export interface WASendOutput {
  message_id: string
  delivered: boolean
  cost_estimate: number
  template_category?: 'utility' | 'marketing' | 'authentication'
}

export interface WAWindowStateInput extends MCPToolInput {
  wa_contact_id: string
}

export interface WAWindowStateOutput {
  state: 'open' | 'closed'
  opened_at?: string
  expires_at?: string
  messages_in_window: number
}

// HERA Transaction Tools
export interface HeraTxnWriteInput extends MCPToolInput {
  header: {
    transaction_type: string
    smart_code: string
    transaction_status: string
    metadata?: any
  }
  lines: Array<{
    line_type: string
    description: string
    line_data?: any
    smart_code?: string
    unit_amount?: number
  }>
}

export interface HeraTxnWriteOutput {
  transaction_id: string
}

// Entity Tools
export interface HeraEntityUpsertInput extends MCPToolInput {
  entity_type: string
  payload: {
    entity_name: string
    entity_code?: string
    smart_code: string
    metadata?: any
  }
}

export interface HeraEntityUpsertOutput {
  entity_id: string
  is_new: boolean
}

// Consent Tools
export interface ConsentGetInput extends MCPToolInput {
  customer_id: string
  channel: 'whatsapp' | 'sms' | 'email'
}

export interface ConsentGetOutput {
  status: 'opted_in' | 'opted_out' | 'unknown'
  opted_at?: string
  expires_at?: string
}

// Budget Tools
export interface BudgetCheckInput extends MCPToolInput {
  category: 'utility' | 'marketing'
}

export interface BudgetCheckOutput {
  allow: boolean
  remaining: number
  daily_limit: number
  reset_at: string
}

// Pricing Tools
export interface PricingEstimateInput extends MCPToolInput {
  region: string
  category: 'utility' | 'marketing'
  volume_tier?: number
}

export interface PricingEstimateOutput {
  est_cost: number
  currency: string
}

// ICS Calendar Tools
export interface ICSGenerateInput extends MCPToolInput {
  event: {
    title: string
    description: string
    location: string
    start: string
    end: string
    status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED'
    organizer?: {
      name: string
      email: string
    }
    attendees?: Array<{
      name: string
      email?: string
      rsvp?: boolean
    }>
    reminders?: Array<{
      method: 'ALERT' | 'EMAIL'
      minutes: number
    }>
  }
}

export interface ICSGenerateOutput {
  ics_content: string
  download_url: string
}

/**
 * MCP Tools Implementation
 */
export class MCPTools {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Find available calendar slots
   */
  async findSlots(input: FindSlotsInput): Promise<MCPToolResponse<FindSlotsOutput>> {
    try {
      // In production, this would integrate with actual calendar system
      // For now, return mock slots
      const slots = []
      const { date_range, duration } = input
      const startDate = new Date(date_range.start)
      const endDate = new Date(date_range.end)

      // Generate sample slots (9 AM - 6 PM)
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        for (let hour = 9; hour < 18; hour++) {
          if (Math.random() > 0.3) {
            // 70% availability
            const slotStart = new Date(d)
            slotStart.setHours(hour, 0, 0, 0)
            const slotEnd = new Date(slotStart.getTime() + duration * 60000)

            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              stylist_id: input.stylist_id || 'any',
              stylist_name: input.stylist_id ? 'Sara' : 'Any Available',
              available: true
            })
          }
        }
      }

      return {
        success: true,
        data: { slots: slots.slice(0, 8) } // Return max 8 slots
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find slots'
      }
    }
  }

  /**
   * Book calendar slot and create appointment
   */
  async bookSlot(input: BookSlotInput): Promise<MCPToolResponse<BookSlotOutput>> {
    try {
      universalApi.setOrganizationId(input.organization_id)

      // Create appointment entity
      const appointment = await universalApi.createEntity({
        entity_type: 'appointment',
        entity_name: `Appointment ${new Date(input.slot.start).toLocaleDateString()}`,
        entity_code: `APT-${Date.now()}`,
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        metadata: {
          service_ids: input.service_ids,
          stylist_id: input.stylist_id,
          location_id: input.location_id,
          start: input.slot.start,
          end: input.slot.end,
          customer_id: input.customer_id
        }
      })

      // Create transaction
      const transaction = await universalApi.createTransaction({
        transaction_type: 'appointment_booking',
        transaction_code: appointment.entity_code!,
        smart_code: 'HERA.SALON.APPOINTMENT.TXN.CREATE.V1',
        metadata: {
          appointment_id: appointment.id,
          channel: 'whatsapp'
        }
      })

      // Generate ICS URL (simplified)
      const icsUrl = `https://calendar.herasalon.com/appointments/${appointment.id}.ics`

      return {
        success: true,
        data: {
          appointment_id: appointment.id,
          ics_url: icsUrl,
          confirmation_code: appointment.entity_code!
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to book slot'
      }
    }
  }

  /**
   * Send WhatsApp message
   */
  async waSend(input: WASendInput): Promise<MCPToolResponse<WASendOutput>> {
    try {
      // Estimate cost based on window state and message type
      let costEstimate = 0
      let category: 'utility' | 'marketing' | 'authentication' = 'utility'

      if (input.kind === 'template') {
        // Template messages have cost
        costEstimate = 0.05 // Base cost for utility templates
        if (input.template_id?.includes('PROMO') || input.template_id?.includes('WINBACK')) {
          category = 'marketing'
          costEstimate = 0.08 // Higher cost for marketing
        }
      }

      // In production, this would call WhatsApp Business API
      const messageId = `wamid.${Date.now()}`

      // Log to HERA
      await this.heraTxnWrite({
        organization_id: input.organization_id,
        header: {
          transaction_type: 'WHATSAPP_MESSAGE_SEND',
          smart_code:
            input.kind === 'freeform'
              ? 'HERA.SALON.WHATSAPP.MESSAGE.FREEFORM.V1'
              : 'HERA.SALON.WHATSAPP.MESSAGE.TEMPLATE.V1',
          transaction_status: 'sent',
          metadata: {
            to: input.to,
            message_id: messageId,
            template_id: input.template_id
          }
        },
        lines: [
          {
            line_type: 'message',
            description: input.template_id || 'freeform message',
            line_data: {
              category,
              cost_estimate: costEstimate
            },
            unit_amount: costEstimate
          }
        ]
      })

      return {
        success: true,
        data: {
          message_id: messageId,
          delivered: true,
          cost_estimate: costEstimate,
          template_category: category
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    }
  }

  /**
   * Check WhatsApp 24h window state
   */
  async waWindowState(input: WAWindowStateInput): Promise<MCPToolResponse<WAWindowStateOutput>> {
    try {
      universalApi.setOrganizationId(input.organization_id)

      // In production, check actual message history
      // For demo, simulate based on contact ID
      const isOpen = Math.random() > 0.3 // 70% chance window is open
      const openedAt = new Date(Date.now() - Math.random() * 20 * 60 * 60 * 1000) // Random time in last 20h
      const expiresAt = new Date(openedAt.getTime() + 24 * 60 * 60 * 1000)

      return {
        success: true,
        data: {
          state: isOpen && expiresAt > new Date() ? 'open' : 'closed',
          opened_at: openedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          messages_in_window: Math.floor(Math.random() * 10) + 1
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check window state'
      }
    }
  }

  /**
   * Write transaction to HERA
   */
  async heraTxnWrite(input: HeraTxnWriteInput): Promise<MCPToolResponse<HeraTxnWriteOutput>> {
    try {
      universalApi.setOrganizationId(input.organization_id)

      const transaction = await universalApi.createTransaction({
        transaction_type: input.header.transaction_type,
        transaction_code: `TXN-${Date.now()}`,
        smart_code: input.header.smart_code,
        metadata: input.header.metadata,
        line_items: input.lines.map((line, index) => ({
          line_number: index + 1,
          line_type: line.line_type,
          description: line.description,
          quantity: 1,
          unit_price: line.unit_amount || 0,
          line_amount: line.unit_amount || 0,
          smart_code: line.smart_code,
          metadata: line.line_data
        }))
      })

      return {
        success: true,
        data: {
          transaction_id: transaction.id
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write transaction'
      }
    }
  }

  /**
   * Upsert entity in HERA
   */
  async heraEntityUpsert(
    input: HeraEntityUpsertInput
  ): Promise<MCPToolResponse<HeraEntityUpsertOutput>> {
    try {
      universalApi.setOrganizationId(input.organization_id)

      // Try to find existing entity
      const entities = await universalApi.getEntitiesByType(input.entity_type)
      const existing = entities.find(
        e =>
          e.entity_code === input.payload.entity_code || e.entity_name === input.payload.entity_name
      )

      if (existing) {
        // Update existing
        // In production, would update entity
        return {
          success: true,
          data: {
            entity_id: existing.id,
            is_new: false
          }
        }
      }

      // Create new
      const entity = await universalApi.createEntity({
        entity_type: input.entity_type,
        entity_name: input.payload.entity_name,
        entity_code:
          input.payload.entity_code || `${input.entity_type.toUpperCase()}-${Date.now()}`,
        smart_code: input.payload.smart_code,
        metadata: input.payload.metadata
      })

      return {
        success: true,
        data: {
          entity_id: entity.id,
          is_new: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upsert entity'
      }
    }
  }

  /**
   * Get consent status
   */
  async consentGet(input: ConsentGetInput): Promise<MCPToolResponse<ConsentGetOutput>> {
    try {
      universalApi.setOrganizationId(input.organization_id)

      // Check dynamic data for consent
      const dynamicData = await universalApi.getDynamicFields(input.customer_id)
      const consentField = dynamicData.find(f => f.field_name === `${input.channel}_consent`)

      return {
        success: true,
        data: {
          status: consentField?.field_value_boolean ? 'opted_in' : 'unknown',
          opted_at: consentField?.created_at
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get consent'
      }
    }
  }

  /**
   * Check budget allowance
   */
  async budgetCheck(input: BudgetCheckInput): Promise<MCPToolResponse<BudgetCheckOutput>> {
    try {
      // In production, check actual spend vs limits
      const dailyLimit = input.category === 'marketing' ? 20.0 : 50.0
      const currentSpend = Math.random() * dailyLimit * 0.8 // Random spend up to 80% of limit

      return {
        success: true,
        data: {
          allow: currentSpend < dailyLimit,
          remaining: Math.max(0, dailyLimit - currentSpend),
          daily_limit: dailyLimit,
          reset_at: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check budget'
      }
    }
  }

  /**
   * Estimate WhatsApp message pricing
   */
  async pricingEstimate(
    input: PricingEstimateInput
  ): Promise<MCPToolResponse<PricingEstimateOutput>> {
    try {
      // Simplified pricing model
      const basePrices: Record<string, Record<string, number>> = {
        UK: { utility: 0.05, marketing: 0.08, authentication: 0.03 },
        US: { utility: 0.04, marketing: 0.07, authentication: 0.02 },
        AE: { utility: 0.03, marketing: 0.05, authentication: 0.02 }
      }

      const prices = basePrices[input.region] || basePrices['US']
      const cost = prices[input.category] || 0.05

      return {
        success: true,
        data: {
          est_cost: cost,
          currency: input.region === 'UK' ? 'GBP' : input.region === 'AE' ? 'AED' : 'USD'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate pricing'
      }
    }
  }

  /**
   * Generate ICS calendar file
   */
  async generateICS(input: ICSGenerateInput): Promise<MCPToolResponse<ICSGenerateOutput>> {
    try {
      const event = input.event
      const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@herasalon.com`

      // Format dates properly for ICS
      const formatDate = (date: string) => {
        return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\..+/, '') + 'Z'
      }

      // Build ICS content
      let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HERA Salon//WhatsApp Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDate(new Date().toISOString())}
DTSTART:${formatDate(event.start)}
DTEND:${formatDate(event.end)}
SUMMARY:${event.title}
DESCRIPTION:${event.description?.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:${event.status || 'TENTATIVE'}
SEQUENCE:0
TRANSP:OPAQUE`

      // Add organizer if provided
      if (event.organizer) {
        icsContent += `\nORGANIZER;CN=${event.organizer.name}:mailto:${event.organizer.email}`
      }

      // Add attendees if provided
      if (event.attendees && event.attendees.length > 0) {
        event.attendees.forEach(attendee => {
          icsContent += `\nATTENDEE;CN=${attendee.name};RSVP=${attendee.rsvp ? 'TRUE' : 'FALSE'}:mailto:${attendee.email || 'noreply@herasalon.com'}`
        })
      }

      // Add reminders if provided
      if (event.reminders && event.reminders.length > 0) {
        event.reminders.forEach(reminder => {
          icsContent += `\nBEGIN:VALARM
TRIGGER:-PT${reminder.minutes}M
ACTION:DISPLAY
DESCRIPTION:Appointment Reminder
END:VALARM`
        })
      }

      icsContent += `\nEND:VEVENT
END:VCALENDAR`

      // In production, this would upload to cloud storage and return a real URL
      const mockUrl = `https://api.herasalon.com/calendar/${uid}.ics`

      return {
        success: true,
        data: {
          ics_content: icsContent,
          download_url: mockUrl
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate ICS'
      }
    }
  }

  // Backward compatibility alias
  async icsGenerate(appointment: any): Promise<MCPToolResponse<{ ics_url: string }>> {
    // Convert old format to new format
    const result = await this.generateICS({
      organization_id: this.organizationId,
      event: {
        title: 'Salon Appointment',
        description: `Appointment ID: ${appointment.id}`,
        location: 'Salon',
        start: appointment.start || new Date().toISOString(),
        end: appointment.end || new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    })

    if (result.success && result.data) {
      return {
        success: true,
        data: { ics_url: result.data.download_url }
      }
    }

    return {
      success: false,
      error: result.error
    }
  }
}

/**
 * Tool manifest for MCP server registration
 */
export const MCP_TOOL_MANIFEST = {
  tools: [
    {
      name: 'calendar.find_slots',
      description: 'Find available appointment slots',
      inputSchema: {
        type: 'object',
        properties: {
          organization_id: { type: 'string' },
          service_id: { type: 'string' },
          stylist_id: { type: 'string' },
          duration: { type: 'number' },
          location_id: { type: 'string' },
          date_range: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' }
            }
          }
        },
        required: ['organization_id', 'duration', 'date_range']
      }
    },
    {
      name: 'calendar.book',
      description: 'Book appointment slot',
      inputSchema: {
        type: 'object',
        properties: {
          organization_id: { type: 'string' },
          customer_id: { type: 'string' },
          service_ids: { type: 'array', items: { type: 'string' } },
          slot: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' }
            }
          },
          stylist_id: { type: 'string' },
          location_id: { type: 'string' }
        },
        required: ['organization_id', 'customer_id', 'service_ids', 'slot', 'location_id']
      }
    },
    {
      name: 'wa.send',
      description: 'Send WhatsApp message',
      inputSchema: {
        type: 'object',
        properties: {
          organization_id: { type: 'string' },
          to: { type: 'string' },
          kind: { type: 'string', enum: ['freeform', 'template'] },
          template_id: { type: 'string' },
          variables: { type: 'object' },
          buttons: { type: 'array', items: { type: 'string' } },
          body: { type: 'string' }
        },
        required: ['organization_id', 'to', 'kind']
      }
    },
    {
      name: 'wa.window_state',
      description: 'Check WhatsApp 24h window state',
      inputSchema: {
        type: 'object',
        properties: {
          organization_id: { type: 'string' },
          wa_contact_id: { type: 'string' }
        },
        required: ['organization_id', 'wa_contact_id']
      }
    },
    {
      name: 'hera.txn.write',
      description: 'Write transaction to HERA',
      inputSchema: {
        type: 'object',
        properties: {
          organization_id: { type: 'string' },
          header: { type: 'object' },
          lines: { type: 'array' }
        },
        required: ['organization_id', 'header', 'lines']
      }
    }
  ]
}
