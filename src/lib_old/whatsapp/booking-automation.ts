import { MCPTools } from '@/lib/mcp/whatsapp-mcp-tools'
import { ClaudeWhatsAppService } from '@/lib/ai/claude-whatsapp-service'

export interface BookingScenario {
  id: string
  name: string
  description: string
  triggers: string[]
  actions: AutomationAction[]
  followUp?: FollowUpSequence
}

export interface AutomationAction {
  type:
    | 'find_slots'
    | 'suggest_services'
    | 'book_appointment'
    | 'send_reminder'
    | 'check_availability'
    | 'send_calendar_invite'
  params?: any
  conditions?: ActionCondition[]
}

export interface ActionCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface FollowUpSequence {
  steps: FollowUpStep[]
}

export interface FollowUpStep {
  delay: number // in minutes
  message: string
  action?: AutomationAction
  skipIf?: ActionCondition[]
}

export interface ConversationFlow {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface FlowNode {
  id: string
  type: 'message' | 'question' | 'action' | 'condition'
  content?: string
  action?: AutomationAction
  options?: string[]
}

export interface FlowEdge {
  from: string
  to: string
  condition?: string
}

export interface SmartSuggestion {
  services: ServiceSuggestion[]
  timeSlots: TimeSlotSuggestion[]
  confidence: number
  reasoning: string
}

export interface ServiceSuggestion {
  serviceId: string
  serviceName: string
  duration: number
  price: number
  reason: string
  popularity: number
}

export interface TimeSlotSuggestion {
  start: Date
  end: Date
  staffId?: string
  staffName?: string
  score: number
  factors: string[]
}

export class BookingAutomationService {
  private mcp: MCPTools
  private claude: ClaudeWhatsAppService

  constructor(organizationId: string, claudeApiKey?: string) {
    this.mcp = new MCPTools(organizationId)
    this.claude = new ClaudeWhatsAppService(claudeApiKey)
  }

  // Pre-defined booking scenarios
  static readonly SCENARIOS: BookingScenario[] = [
    {
      id: 'quick_booking',
      name: 'Quick Booking',
      description: 'Fast appointment booking for returning customers',
      triggers: ['book', 'appointment', 'schedule', 'available'],
      actions: [
        { type: 'find_slots', params: { duration: 60, days_ahead: 7 } },
        { type: 'suggest_services' },
        { type: 'send_calendar_invite', params: { tentative: true } },
        { type: 'book_appointment' }
      ],
      followUp: {
        steps: [
          {
            delay: 1440,
            message:
              'Hi! Just a reminder about your appointment tomorrow at {time}. Reply YES to confirm or RESCHEDULE to change.'
          },
          { delay: 60, message: 'Your appointment is in 1 hour. We look forward to seeing you! 💇‍♀️' }
        ]
      }
    },
    {
      id: 'service_inquiry',
      name: 'Service Inquiry',
      description: 'Help customers explore services before booking',
      triggers: ['services', 'what do you offer', 'menu', 'price', 'cost'],
      actions: [{ type: 'suggest_services' }, { type: 'check_availability' }]
    },
    {
      id: 'smart_rebooking',
      name: 'Smart Rebooking',
      description: 'Intelligent rebooking based on history',
      triggers: ['same as last time', 'usual', 'regular'],
      actions: [
        { type: 'find_slots', params: { based_on: 'last_appointment' } },
        {
          type: 'book_appointment',
          conditions: [{ field: 'customer_type', operator: 'equals', value: 'regular' }]
        }
      ]
    },
    {
      id: 'group_booking',
      name: 'Group Booking',
      description: 'Handle multiple appointments together',
      triggers: ['group', 'friends', 'together', 'multiple'],
      actions: [
        { type: 'find_slots', params: { concurrent: true, duration: 120 } },
        { type: 'book_appointment', params: { type: 'group' } }
      ]
    }
  ]

  // Pre-defined conversation flows
  static readonly FLOWS: ConversationFlow[] = [
    {
      id: 'new_customer_flow',
      name: 'New Customer Welcome',
      description: 'Onboarding flow for first-time customers',
      nodes: [
        {
          id: 'welcome',
          type: 'message',
          content: "Welcome to {salon_name}! 🌟 I'm here to help you book your perfect appointment."
        },
        {
          id: 'ask_service',
          type: 'question',
          content: 'What service are you interested in today?',
          options: ['Hair Cut', 'Hair Color', 'Hair Treatment', 'Show me all services']
        },
        { id: 'show_availability', type: 'action', action: { type: 'find_slots' } },
        {
          id: 'send_tentative_calendar',
          type: 'action',
          action: { type: 'send_calendar_invite', params: { tentative: true } }
        },
        {
          id: 'ask_confirmation',
          type: 'question',
          content: "I've sent you a calendar invite! Would you like to confirm this appointment?",
          options: ['Yes, confirm it!', 'Let me check and get back']
        },
        {
          id: 'confirm_booking',
          type: 'message',
          content: 'Great! Your appointment is confirmed. See you soon! ✨'
        }
      ],
      edges: [
        { from: 'welcome', to: 'ask_service' },
        { from: 'ask_service', to: 'show_availability' },
        { from: 'show_availability', to: 'send_tentative_calendar' },
        { from: 'send_tentative_calendar', to: 'ask_confirmation' },
        { from: 'ask_confirmation', to: 'confirm_booking', condition: 'Yes, confirm it!' }
      ]
    },
    {
      id: 'vip_fast_track',
      name: 'VIP Fast Track',
      description: 'Express booking for VIP customers',
      nodes: [
        {
          id: 'vip_greeting',
          type: 'message',
          content: 'Welcome back {customer_name}! 👑 Your VIP fast-track booking is ready.'
        },
        {
          id: 'check_usual',
          type: 'question',
          content: 'Book your usual with {preferred_stylist}?',
          options: ['Yes, book it!', 'Show me other options']
        },
        {
          id: 'instant_book',
          type: 'action',
          action: { type: 'book_appointment', params: { vip: true } }
        }
      ],
      edges: [
        { from: 'vip_greeting', to: 'check_usual' },
        { from: 'check_usual', to: 'instant_book', condition: 'Yes, book it!' }
      ]
    }
  ]

  async getSmartSuggestions(customerId: string, messageContext: string): Promise<SmartSuggestion> {
    // Analyze customer history
    const customerHistory = await this.mcp.queryHera({
      organizationId: this.mcp['organizationId'],
      entity_type: 'appointment',
      filters: { customer_id: customerId }
    })

    // Get current availability
    const availability = await this.mcp.findSlots({
      organization_id: this.mcp['organizationId'],
      duration: 60,
      date_range: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    })

    // Use Claude to analyze and suggest
    const analysis = await this.claude.extractIntent(messageContext, {
      customerHistory,
      availability: availability.data
    })

    // Build smart suggestions
    const suggestions: SmartSuggestion = {
      services: await this.suggestServices(customerId, analysis),
      timeSlots: await this.suggestTimeSlots(customerId, availability.data),
      confidence: analysis.confidence,
      reasoning: analysis.reasoning || 'Based on your preferences and history'
    }

    return suggestions
  }

  private async suggestServices(customerId: string, intent: any): Promise<ServiceSuggestion[]> {
    // Mock service suggestions - in production, this would analyze history
    return [
      {
        serviceId: 'srv_001',
        serviceName: 'Signature Hair Color & Style',
        duration: 120,
        price: 250,
        reason: 'Your favorite service, last booked 6 weeks ago',
        popularity: 95
      },
      {
        serviceId: 'srv_002',
        serviceName: 'Express Blowdry',
        duration: 45,
        price: 85,
        reason: 'Perfect for your busy schedule',
        popularity: 88
      },
      {
        serviceId: 'srv_003',
        serviceName: 'Hair Treatment & Massage',
        duration: 90,
        price: 180,
        reason: 'Recommended for hair health',
        popularity: 82
      }
    ]
  }

  private async suggestTimeSlots(
    customerId: string,
    availability: any
  ): Promise<TimeSlotSuggestion[]> {
    // Smart time slot ranking based on customer patterns
    const suggestions: TimeSlotSuggestion[] = []

    // Mock implementation - in production, this would use ML
    const preferredTimes = [
      { hour: 10, score: 95 }, // Customer usually books at 10am
      { hour: 14, score: 85 }, // Second preference
      { hour: 17, score: 75 } // After work option
    ]

    // Generate suggestions for next 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date()
      date.setDate(date.getDate() + day)

      for (const pref of preferredTimes) {
        date.setHours(pref.hour, 0, 0, 0)

        suggestions.push({
          start: new Date(date),
          end: new Date(date.getTime() + 60 * 60 * 1000),
          staffId: 'staff_001',
          staffName: 'Sarah',
          score: pref.score - day * 5, // Prefer sooner appointments
          factors: [
            day === 0 ? 'Available today!' : `In ${day} days`,
            pref.hour === 10
              ? 'Your preferred morning slot'
              : pref.hour === 14
                ? 'Quiet afternoon time'
                : 'Evening appointment',
            'Sarah is available'
          ]
        })
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5)
  }

  async executeScenario(
    scenarioId: string,
    context: any
  ): Promise<{ success: boolean; results: any[] }> {
    const scenario = BookingAutomationService.SCENARIOS.find(s => s.id === scenarioId)
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    const results = []
    for (const action of scenario.actions) {
      if (this.checkConditions(action.conditions, context)) {
        const result = await this.executeAction(action, context)
        results.push(result)
      }
    }

    // Schedule follow-ups if defined
    if (scenario.followUp) {
      await this.scheduleFollowUps(scenario.followUp, context)
    }

    return { success: true, results }
  }

  private checkConditions(conditions?: ActionCondition[], context?: any): boolean {
    if (!conditions || conditions.length === 0) return true

    return conditions.every(condition => {
      const value = context[condition.field]
      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'contains':
          return value?.includes(condition.value)
        case 'greater_than':
          return value > condition.value
        case 'less_than':
          return value < condition.value
        default:
          return false
      }
    })
  }

  private async executeAction(action: AutomationAction, context: any): Promise<any> {
    switch (action.type) {
      case 'find_slots':
        return await this.mcp.findSlots({
          organization_id: this.mcp['organizationId'],
          duration: action.params?.duration || 60,
          date_range: {
            start: new Date().toISOString(),
            end: new Date(
              Date.now() + (action.params?.days_ahead || 7) * 24 * 60 * 60 * 1000
            ).toISOString()
          }
        })

      case 'book_appointment':
        return await this.mcp.book({
          organization_id: this.mcp['organizationId'],
          customer_id: context.customerId,
          service_ids: context.serviceIds || [],
          slot: context.selectedSlot,
          location_id: context.locationId
        })

      case 'send_calendar_invite':
        // Generate ICS calendar file
        const icsResult = await this.mcp.generateICS({
          organization_id: this.mcp['organizationId'],
          event: {
            title: action.params?.tentative
              ? `[TENTATIVE] ${context.serviceName || 'Salon Appointment'}`
              : `${context.serviceName || 'Salon Appointment'}`,
            description: `Your appointment at ${context.salonName || 'Our Salon'}\n\nService: ${context.serviceName}\nStylist: ${context.stylistName}\n\nPlease reply to confirm this booking.`,
            location: context.salonAddress || 'Salon Location',
            start: context.selectedSlot?.start,
            end: context.selectedSlot?.end,
            status: action.params?.tentative ? 'TENTATIVE' : 'CONFIRMED',
            organizer: {
              name: context.salonName || 'Salon',
              email: context.salonEmail || 'salon@example.com'
            },
            attendees: [
              {
                name: context.customerName,
                email: context.customerEmail || '',
                rsvp: true
              }
            ],
            reminders: [
              { method: 'ALERT', minutes: 1440 }, // 24 hours
              { method: 'ALERT', minutes: 60 } // 1 hour
            ]
          }
        })

        // Send the calendar file via WhatsApp
        if (icsResult.success && icsResult.data?.ics_content) {
          const sendResult = await this.mcp.waSend({
            organization_id: this.mcp['organizationId'],
            to: context.waContactId,
            kind: 'document',
            document_url: icsResult.data.download_url,
            filename: 'appointment.ics',
            caption: action.params?.tentative
              ? "📅 Here's your tentative appointment. Add it to your calendar and reply to confirm!"
              : '📅 Your appointment is confirmed! Add it to your calendar.'
          })

          return { ...icsResult, sendResult }
        }

        return icsResult

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  private async scheduleFollowUps(followUp: FollowUpSequence, context: any): Promise<void> {
    for (const step of followUp.steps) {
      if (!this.checkConditions(step.skipIf, context)) {
        // In production, this would schedule actual messages
        console.log(`Scheduling follow-up in ${step.delay} minutes: ${step.message}`)
      }
    }
  }

  async executeFlow(
    flowId: string,
    currentNodeId: string,
    userResponse?: string
  ): Promise<{ nextNode: FlowNode | null; actions: any[] }> {
    const flow = BookingAutomationService.FLOWS.find(f => f.id === flowId)
    if (!flow) throw new Error(`Flow ${flowId} not found`)

    const currentNode = flow.nodes.find(n => n.id === currentNodeId)
    if (!currentNode) throw new Error(`Node ${currentNodeId} not found`)

    const actions = []

    // Execute current node action if any
    if (currentNode.action) {
      const result = await this.executeAction(currentNode.action, { userResponse })
      actions.push(result)
    }

    // Find next node
    const edges = flow.edges.filter(e => e.from === currentNodeId)
    let nextEdge = edges[0] // Default to first edge

    if (userResponse && edges.length > 1) {
      // Find matching condition
      nextEdge = edges.find(e => e.condition === userResponse) || edges[0]
    }

    const nextNode = nextEdge ? flow.nodes.find(n => n.id === nextEdge.to) : null

    return { nextNode, actions }
  }
}

// Booking Patterns for common scenarios
export const BOOKING_PATTERNS = {
  // Time-based patterns
  LAST_MINUTE: {
    name: 'Last Minute Booking',
    timeframe: 24, // hours
    discount: 15, // percentage
    message: 'We have a last-minute opening! Book now and get 15% off.'
  },

  PEAK_HOURS: {
    name: 'Peak Hours',
    times: ['10:00', '14:00', '18:00'],
    surcharge: 10, // percentage
    message: 'High demand time slot - book early to secure!'
  },

  OFF_PEAK: {
    name: 'Off Peak Special',
    times: ['09:00', '11:00', '15:00'],
    discount: 10,
    message: 'Quieter time available - enjoy a relaxed experience with 10% off'
  },

  // Customer patterns
  REGULAR_CUSTOMER: {
    name: 'Regular Customer Fast Track',
    bookingCount: 5, // minimum bookings
    benefits: ['Priority booking', 'Loyalty discount', 'Flexible rescheduling']
  },

  VIP_CUSTOMER: {
    name: 'VIP Treatment',
    criteria: { totalSpend: 1000, bookingCount: 10 },
    benefits: ['Instant booking', 'Personal stylist', 'Complimentary services']
  },

  NEW_CUSTOMER: {
    name: 'First Time Special',
    discount: 20,
    includes: ['Consultation', 'Welcome gift'],
    message: 'Welcome! Enjoy 20% off your first visit with us 🌟'
  }
}
