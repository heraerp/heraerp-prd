/**
 * WhatsApp Message Router
 * Policy-aware routing with cost optimization
 */

import { MCPTools } from '@/lib/mcp/whatsapp-mcp-tools'
import { ClaudeWhatsAppService } from '@/lib/ai/claude-whatsapp-service'
import { universalApi } from '@/lib/universal-api'

export interface MessageContext {
  organizationId: string
  waContactId: string
  text: string
  customerData?: any
  messageHistory?: any[]
}

export interface RouteResult {
  success: boolean
  messagesSent: number
  totalCost: number
  error?: string
}

export class WhatsAppMessageRouter {
  private mcp: MCPTools
  private claude: ClaudeWhatsAppService
  private organizationId: string

  constructor(organizationId: string, claudeApiKey: string) {
    this.organizationId = organizationId
    this.mcp = new MCPTools(organizationId)
    this.claude = new ClaudeWhatsAppService(organizationId, claudeApiKey)
  }

  /**
   * Main message routing function
   */
  async routeMessage(ctx: MessageContext): Promise<RouteResult> {
    try {
      const { organizationId, waContactId, text } = ctx

      // Step 1: Check window state
      const windowResult = await this.mcp.waWindowState({
        organization_id: organizationId,
        wa_contact_id: waContactId
      })

      if (!windowResult.success) {
        throw new Error('Failed to check window state')
      }

      const window = windowResult.data!

      // Step 2: Extract intent with Claude
      const nlu = await this.claude.extractIntent(text, ctx.customerData)

      // Step 3: Route based on window state
      if (window.state === 'open') {
        return await this.handleOpenWindow(ctx, nlu, window)
      } else {
        return await this.handleClosedWindow(ctx, nlu)
      }
    } catch (error) {
      console.error('Message routing failed:', error)
      return {
        success: false,
        messagesSent: 0,
        totalCost: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Handle messages within 24h window (free-form allowed)
   */
  private async handleOpenWindow(
    ctx: MessageContext,
    intent: any,
    window: any
  ): Promise<RouteResult> {
    const { organizationId, waContactId } = ctx

    // Find slots if booking intent
    let slots = []
    if (intent.intent === 'book_appointment' && intent.entities.services) {
      const slotsResult = await this.mcp.findSlots({
        organization_id: organizationId,
        duration: 120, // Default 2 hours
        date_range: {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        },
        stylist_id: intent.entities.preferred_stylist
      })

      if (slotsResult.success) {
        slots = slotsResult.data!.slots
      }
    }

    // Craft optimal response
    const reply = this.claude.craftLowestTurnMessage(slots, intent)

    // Send free-form message (no cost)
    const sendResult = await this.mcp.waSend({
      organization_id: organizationId,
      to: waContactId,
      kind: 'freeform',
      body: reply
    })

    if (!sendResult.success) {
      throw new Error('Failed to send message')
    }

    // Log to HERA
    await this.mcp.heraTxnWrite({
      organization_id: organizationId,
      header: {
        transaction_type: 'WHATSAPP_MESSAGE_SEND',
        smart_code: 'HERA.SALON.WHATSAPP.MESSAGE.FREEFORM.v1',
        transaction_status: 'sent',
        metadata: {
          intent: intent.intent,
          confidence: intent.confidence,
          window_state: 'open',
          window_expires_at: window.expires_at
        }
      },
      lines: [
        {
          line_type: 'message',
          description: 'freeform reply',
          line_data: {
            wa_contact_id: waContactId,
            message_length: reply.length
          }
        }
      ]
    })

    return {
      success: true,
      messagesSent: 1,
      totalCost: 0 // Free within window
    }
  }

  /**
   * Handle messages outside 24h window (template required)
   */
  private async handleClosedWindow(
    ctx: MessageContext,
    intent: any
  ): Promise<RouteResult> {
    const { organizationId, waContactId } = ctx

    // Get template decision from Claude
    const decision = await this.claude.selectTemplate(intent, {
      ...ctx.customerData,
      wa_contact_id: waContactId
    })

    // Check budget if marketing
    if (decision.category === 'marketing') {
      const budgetResult = await this.mcp.budgetCheck({
        organization_id: organizationId,
        category: 'marketing'
      })

      if (!budgetResult.success || !budgetResult.data!.allow) {
        // Budget exceeded, skip marketing message
        return {
          success: true,
          messagesSent: 0,
          totalCost: 0
        }
      }
    }

    // Send template message
    const sendResult = await this.mcp.waSend({
      organization_id: organizationId,
      to: waContactId,
      kind: 'template',
      template_id: decision.template_id,
      variables: decision.variables,
      buttons: decision.buttons
    })

    if (!sendResult.success) {
      throw new Error('Failed to send template')
    }

    const cost = sendResult.data!.cost_estimate

    // Log to HERA with cost
    await this.mcp.heraTxnWrite({
      organization_id: organizationId,
      header: {
        transaction_type: 'WHATSAPP_MESSAGE_SEND',
        smart_code: 'HERA.SALON.WHATSAPP.MESSAGE.TEMPLATE.v1',
        transaction_status: sendResult.data!.delivered ? 'delivered' : 'pending',
        metadata: {
          intent: intent.intent,
          template_id: decision.template_id,
          category: decision.category,
          message_id: sendResult.data!.message_id
        }
      },
      lines: [
        {
          line_type: 'message',
          description: decision.template_id,
          line_data: {
            category: decision.category,
            message_id: sendResult.data!.message_id
          }
        },
        {
          line_type: 'cost_estimate',
          description: 'WhatsApp message cost',
          unit_amount: cost
        }
      ]
    })

    return {
      success: true,
      messagesSent: 1,
      totalCost: cost
    }
  }

  /**
   * Process booking completion
   */
  async completeBooking(
    customerId: string,
    appointmentData: any
  ): Promise<string> {
    // Book the slot
    const bookResult = await this.mcp.bookSlot({
      organization_id: this.organizationId,
      customer_id: customerId,
      service_ids: appointmentData.service_ids,
      slot: appointmentData.slot,
      stylist_id: appointmentData.stylist_id,
      location_id: appointmentData.location_id
    })

    if (!bookResult.success) {
      throw new Error('Failed to book appointment')
    }

    const { appointment_id, ics_url, confirmation_code } = bookResult.data!

    // Generate confirmation message
    const confirmationMessage = `✅ Appointment Confirmed!

📋 Booking ID: ${confirmation_code}
📅 Date: ${new Date(appointmentData.slot.start).toLocaleDateString()}
⏰ Time: ${new Date(appointmentData.slot.start).toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit' 
})}

📎 Add to Calendar: ${ics_url}

We'll send you a reminder 24 hours before your appointment.`

    return confirmationMessage
  }

  /**
   * Handle appointment reminders
   */
  async sendAppointmentReminders(): Promise<void> {
    universalApi.setOrganizationId(this.organizationId)

    // Get appointments for tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    // In production, query appointments by date
    // For now, this is a placeholder
    const appointments = [] // Would fetch from HERA

    for (const appointment of appointments) {
      // Send 24h reminder template
      await this.mcp.waSend({
        organization_id: this.organizationId,
        to: appointment.customer_phone,
        kind: 'template',
        template_id: 'APPOINTMENT_REMINDER_24H_v1',
        variables: {
          name: appointment.customer_name,
          service: appointment.service_name,
          time: appointment.time,
          stylist: appointment.stylist_name
        },
        buttons: ['Confirm', 'Reschedule']
      })
    }
  }
}