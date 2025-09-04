/**
 * Claude AI Integration for WhatsApp Booking
 * Handles intent detection, slot extraction, and template selection
 */

export interface ClaudeIntent {
  intent: string
  entities: Record<string, any>
  confidence: number
  next_action?: {
    type: string
    question?: string
    needs_window_open?: boolean
  }
}

export interface ClaudeTemplateDecision {
  template_id: string
  category: 'utility' | 'marketing' | 'authentication'
  variables: Record<string, string>
  buttons?: string[]
}

export class ClaudeWhatsAppService {
  private apiKey: string
  private organizationId: string

  constructor(organizationId: string, apiKey: string) {
    this.organizationId = organizationId
    this.apiKey = apiKey
  }

  /**
   * Extract intent and slots from customer message
   */
  async extractIntent(message: string, context?: any): Promise<ClaudeIntent> {
    // In production, this would call Claude API
    // For demo, use pattern matching

    const lowerMessage = message.toLowerCase()

    // Booking intent patterns
    if (
      lowerMessage.includes('book') ||
      lowerMessage.includes('appointment') ||
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('can i get') ||
      lowerMessage.includes('available')
    ) {
      const entities: Record<string, any> = {}

      // Extract services
      const servicePatterns = {
        hair_color: /(?:hair\s*)?colou?r|dye|tint/i,
        blow_dry: /blow\s*dry|blow\s*out|blowout/i,
        cut: /cut|trim|haircut/i,
        highlights: /highlights?|foils?/i,
        keratin: /keratin|brazilian/i,
        manicure: /manicure|nails?/i,
        pedicure: /pedicure/i
      }

      const services = []
      for (const [service, pattern] of Object.entries(servicePatterns)) {
        if (pattern.test(message)) {
          services.push(service)
        }
      }
      if (services.length > 0) entities.services = services

      // Extract stylist
      const stylistMatch = message.match(/with\s+(\w+)|(\w+)'s?\s+available/i)
      if (stylistMatch) {
        entities.preferred_stylist = stylistMatch[1] || stylistMatch[2]
      }

      // Extract date/time hints
      if (lowerMessage.includes('tomorrow')) {
        entities.date_hint = 'tomorrow'
      } else if (lowerMessage.includes('today')) {
        entities.date_hint = 'today'
      } else if (lowerMessage.includes('this week')) {
        entities.date_hint = 'this_week'
      }

      // Time patterns
      const timeMatch = message.match(/(?:at|after|around)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
      if (timeMatch) {
        let hour = parseInt(timeMatch[1])
        const isPM = timeMatch[3]?.toLowerCase() === 'pm'
        if (isPM && hour < 12) hour += 12
        entities.time_hint = `after_${hour}:00`
      }

      // Determine next action
      let nextAction
      if (!entities.services || entities.services.length === 0) {
        nextAction = {
          type: 'ask_service',
          question: 'What service would you like to book?',
          needs_window_open: true
        }
      } else if (!entities.date_hint && !entities.time_hint) {
        nextAction = {
          type: 'ask_datetime',
          question: 'When would you like to come in? We have availability today, tomorrow, or later this week.',
          needs_window_open: true
        }
      } else {
        nextAction = {
          type: 'ask_or_book',
          question: `I can check availability for ${services.join(' + ')}. Let me find the best times for you.`,
          needs_window_open: true
        }
      }

      return {
        intent: 'book_appointment',
        entities,
        confidence: 0.85,
        next_action: nextAction
      }
    }

    // Cancellation intent
    if (lowerMessage.includes('cancel')) {
      return {
        intent: 'cancel_appointment',
        entities: {},
        confidence: 0.90,
        next_action: {
          type: 'ask_booking_id',
          question: 'I can help you cancel. Please provide your booking ID or appointment date.',
          needs_window_open: true
        }
      }
    }

    // Reschedule intent
    if (lowerMessage.includes('reschedule') || lowerMessage.includes('change')) {
      return {
        intent: 'reschedule_appointment',
        entities: {},
        confidence: 0.85,
        next_action: {
          type: 'ask_booking_id',
          question: 'I\'d be happy to reschedule. What\'s your booking ID or current appointment date?',
          needs_window_open: true
        }
      }
    }

    // Default/greeting
    return {
      intent: 'general_inquiry',
      entities: {},
      confidence: 0.60,
      next_action: {
        type: 'show_options',
        question: 'Hi! How can I help you today? You can:\n1. Book an appointment\n2. Check availability\n3. View our services\n4. Get directions',
        needs_window_open: true
      }
    }
  }

  /**
   * Select appropriate template when window is closed
   */
  async selectTemplate(intent: ClaudeIntent, context: any): Promise<ClaudeTemplateDecision> {
    // Template selection logic based on intent and context

    if (intent.intent === 'book_appointment' && context.has_complete_booking) {
      return {
        template_id: 'APPOINTMENT_CONFIRM_v1',
        category: 'utility',
        variables: {
          name: context.customer_name,
          service: context.services.join(' + '),
          date: context.appointment_date,
          time: context.appointment_time,
          stylist: context.stylist_name || 'Any Available',
          branch: context.location_name,
          change_link: `https://salon.example/rebook?aid=${context.appointment_id}`
        },
        buttons: ['Reschedule', 'Directions']
      }
    }

    if (intent.intent === 'book_appointment' && !context.has_complete_booking) {
      return {
        template_id: 'BOOKING_PROMPT_v1',
        category: 'utility',
        variables: {
          name: context.customer_name || 'there',
          booking_link: `https://salon.example/book?wa=${context.wa_contact_id}`
        },
        buttons: ['Book Now']
      }
    }

    if (context.is_appointment_tomorrow) {
      return {
        template_id: 'APPOINTMENT_REMINDER_24H_v1',
        category: 'utility',
        variables: {
          name: context.customer_name,
          service: context.service_name,
          time: context.appointment_time,
          stylist: context.stylist_name
        },
        buttons: ['Confirm', 'Reschedule']
      }
    }

    if (context.last_visit_days_ago > 30) {
      return {
        template_id: 'WINBACK_30D_v1',
        category: 'marketing',
        variables: {
          name: context.customer_name,
          last_service: context.last_service,
          discount: '15%'
        },
        buttons: ['Book Now']
      }
    }

    // Default utility template
    return {
      template_id: 'GENERAL_RESPONSE_v1',
      category: 'utility',
      variables: {
        name: context.customer_name || 'there',
        salon_name: 'Luxury Salon Dubai',
        booking_link: 'https://salon.example/book'
      },
      buttons: ['Book Appointment']
    }
  }

  /**
   * Generate optimal response to minimize message count
   */
  craftLowestTurnMessage(slots: any[], intent: ClaudeIntent): string {
    if (!slots || slots.length === 0) {
      return "I'm checking our calendar... It looks like we're fully booked for your requested time. Would you like me to check another day?"
    }

    // If we have all info, offer specific slots
    if (intent.entities.services && (intent.entities.date_hint || intent.entities.time_hint)) {
      const topSlots = slots.slice(0, 3)
      let message = `Great! I have these times available for your ${intent.entities.services.join(' + ')}:\n\n`
      
      topSlots.forEach((slot, index) => {
        const time = new Date(slot.start)
        message += `${index + 1}. ${time.toLocaleDateString()} at ${time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}\n`
      })
      
      message += '\nReply with 1, 2, or 3 to book, or "more" for other times.'
      return message
    }

    // Need more info - ask the most important missing piece
    if (!intent.entities.services) {
      return "I'd love to book you in! What service would you like? Our popular options:\n• Hair Color + Cut\n• Brazilian Blowout\n• Manicure + Pedicure\n• Full Highlights"
    }

    return "When works best for you? I have good availability:\n• Today after 2pm\n• Tomorrow morning\n• This weekend"
  }

  /**
   * Check if message qualifies for paid marketing template
   */
  shouldSendMarketing(customer: any): boolean {
    // Business rules for marketing messages
    if (!customer.marketing_consent) return false
    if (customer.last_marketing_sent_days_ago < 7) return false
    if (customer.lifetime_value < 200) return false
    if (customer.churn_risk_score < 0.7) return false
    
    return true
  }

  /**
   * Validate smart code format
   */
  validateSmartCode(code: string): boolean {
    const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/
    return pattern.test(code)
  }
}