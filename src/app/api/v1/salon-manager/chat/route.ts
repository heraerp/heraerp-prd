/**
 * HERA Salon Manager Chat API
 * Natural language interface for salon operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSalonManagerService } from '@/src/lib/salon-manager'
import { supabase } from '@/src/lib/supabase'

// Intent patterns for salon operations
const INTENT_PATTERNS = {
  appointment: {
    patterns: [
      /book.*appointment/i,
      /schedule.*for/i,
      /book.*with/i,
      /book\s+[A-Za-z\s]+\s+for/i, // "book emma for highlights" or "book Sarah Johnson for"
      /appointment.*for/i,
      /can.*book/i,
      /need.*appointment/i
    ],
    smartCode: 'HERA.SALON.APPOINTMENT.BOOKING.v1'
  },
  searchAppointment: {
    patterns: [
      /show.*appointment/i,
      /find.*appointment/i,
      /view.*appointment/i,
      /check.*appointment/i,
      /search.*appointment/i,
      /appointment.*for.*\w+/i,
      /^\w+.*appointment/i,
      /what\s+time.*appointment/i,
      /when\s+is.*appointment/i,
      /\w+'s\s+appointment/i
    ],
    smartCode: 'HERA.SALON.APPOINTMENT.SEARCH.v1'
  },
  analytics: {
    patterns: [
      /analyz/i,
      /insight/i,
      /recommend/i,
      /suggest/i,
      /pattern/i,
      /trend/i,
      /forecast/i,
      /predict/i
    ],
    smartCode: 'HERA.SALON.AI.ANALYTICS.v1'
  },
  availability: {
    patterns: [
      /available.*slot/i,
      /free.*time/i,
      /when.*available/i,
      /check.*availability/i,
      /open.*slot/i,
      /who.*available/i
    ],
    smartCode: 'HERA.SALON.AVAILABILITY.CHECK.v1'
  },
  inventory: {
    patterns: [
      /check.*inventory/i,
      /stock.*level/i,
      /how.*many/i,
      /product.*stock/i,
      /check.*stock/i,
      /low.*stock/i
    ],
    smartCode: 'HERA.SALON.INVENTORY.CHECK.v1'
  },
  revenue: {
    patterns: [
      /revenue/i,
      /sales.*today/i,
      /how.*much.*made/i,
      /earning/i,
      /income/i,
      /total.*sales/i
    ],
    smartCode: 'HERA.SALON.REVENUE.ANALYSIS.v1'
  },
  commission: {
    patterns: [
      /commission/i,
      /calculate.*commission/i,
      /staff.*performance/i,
      /stylist.*earning/i,
      /performance/i
    ],
    smartCode: 'HERA.SALON.COMMISSION.CALC.v1'
  },
  birthday: {
    patterns: [/birthday/i, /birth.*month/i, /client.*birthday/i, /birthday.*list/i],
    smartCode: 'HERA.SALON.CLIENT.BIRTHDAY.v1'
  },
  schedule: {
    patterns: [
      /schedule/i,
      /show.*appointment/i,
      /today.*appointment/i,
      /calendar/i,
      /booking.*list/i
    ],
    smartCode: 'HERA.SALON.SCHEDULE.VIEW.v1'
  }
}

// Analytical framework for better responses
interface AnalyticalResponse {
  needsClarification: boolean
  clarifyingQuestions?: string[]
  possibleIntents?: string[]
  confidence: number
  suggestedActions?: string[]
}

// Analyze query for ambiguity and missing information
function analyzeQuery(message: string): AnalyticalResponse {
  const analysis: AnalyticalResponse = {
    needsClarification: false,
    confidence: 100
  }

  // Check for vague appointment requests
  if (
    /book|appointment|schedule/i.test(message) &&
    !/\b(at|for|with|tomorrow|today|\d{1,2}(:\d{2})?\s*(am|pm)?)/i.test(message)
  ) {
    analysis.needsClarification = true
    analysis.clarifyingQuestions = [
      'What service would you like to book?',
      "When would you like the appointment? (e.g., 'tomorrow at 2pm')",
      'Do you have a preferred stylist?'
    ]
    analysis.confidence = 40
  }

  // Check for incomplete inventory queries
  if (/stock|inventory/i.test(message) && message.split(' ').length < 3) {
    analysis.needsClarification = true
    analysis.clarifyingQuestions = [
      'Would you like to see all inventory or a specific product?',
      'Are you looking for low stock items only?',
      'Do you need to check a specific category?'
    ]
    analysis.confidence = 60
  }

  // Check for ambiguous time references
  if (
    /show|check|view/i.test(message) &&
    /appointment|booking/i.test(message) &&
    !/(today|tomorrow|week|month|for|client)/i.test(message)
  ) {
    analysis.needsClarification = true
    analysis.clarifyingQuestions = [
      "Are you looking for today's appointments?",
      "Do you want to see a specific client's appointments?",
      "Would you like to see this week's schedule?"
    ]
    analysis.confidence = 50
  }

  // Analyze for multiple possible intents
  const intents = []
  if (/revenue|money|earned|sales/i.test(message)) intents.push('revenue analysis')
  if (/commission|staff|performance/i.test(message)) intents.push('commission calculation')
  if (/birthday|anniversary/i.test(message)) intents.push('client birthdays')
  if (/available|free|open/i.test(message)) intents.push('availability check')

  if (intents.length > 1) {
    analysis.possibleIntents = intents
    analysis.confidence = 70
  }

  return analysis
}

// Detect intent from message
function detectIntent(message: string): { type: string; smartCode: string } | null {
  const lower = message.toLowerCase()

  for (const [type, config] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(lower)) {
        return { type, smartCode: config.smartCode }
      }
    }
  }

  return null
}

// Parse appointment details from natural language
function parseAppointmentDetails(message: string): any {
  const result: any = {}

  // Handle "Book appointment for [service] with [stylist]" pattern
  if (/book\s+appointment\s+for/i.test(message)) {
    // This is a service booking without client name
    // Extract service name after "for"
    const serviceMatch = message.match(
      /appointment\s+for\s+(?:a\s+)?([A-Za-z\s]+?)(?:\s+with|\s+at|\s+tomorrow|\s+today|$)/i
    )
    if (serviceMatch) {
      result.serviceName = serviceMatch[1].trim()
    }
    // Client name is not specified in this pattern
    result.clientName = null
  } else {
    // Try to parse "book [name] for [service]" pattern
    const bookForPattern = message.match(
      /book\s+([A-Za-z\s]+?)\s+for\s+([A-Za-z\s]+?)(?:\s+with|\s+at|\s+tomorrow|\s+today|$)/i
    )
    if (bookForPattern) {
      result.clientName = bookForPattern[1].trim()
      result.serviceName = bookForPattern[2].trim()
    } else {
      // Extract client name (for/to patterns)
      const clientMatch = message.match(/(?:for|book)\s+([A-Za-z\s]+?)(?:\s+for|\s+with|\s+at|$)/i)
      if (clientMatch) {
        result.clientName = clientMatch[1].trim()
      }
    }
  }

  // Extract stylist name (with patterns)
  const stylistMatch = message.match(
    /with\s+([A-Za-z\s]+?)(?:\s+for|\s+at|\s+tomorrow|\s+today|$)/i
  )
  if (stylistMatch) {
    result.stylistName = stylistMatch[1].trim()
  }

  // Extract service (for patterns after stylist)
  const serviceMatch = message.match(
    /for\s+(?:a\s+)?([A-Za-z\s]+?)(?:\s+tomorrow|\s+today|\s+at|\s+on|$)/i
  )
  if (serviceMatch && serviceMatch[1] !== result.clientName) {
    result.serviceName = serviceMatch[1].trim()
  }

  // Extract time
  const timeMatch = message.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
  if (timeMatch) {
    result.time = timeMatch[1]
  }

  // Extract date
  if (/tomorrow/i.test(message)) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    result.date = tomorrow
  } else if (/today/i.test(message)) {
    result.date = new Date()
  } else {
    // Look for specific date patterns
    const dateMatch = message.match(/(?:on\s+)?(\d{1,2}\/\d{1,2}|\w+\s+\d{1,2})/i)
    if (dateMatch) {
      result.dateString = dateMatch[1]
    }
  }

  return result
}

// Parse inventory query
function parseInventoryQuery(message: string): { productName?: string } {
  // Extract product name if specified
  const productMatch = message.match(
    /(?:check|stock|inventory)\s+(?:of\s+)?([A-Za-z\s]+?)(?:\s+stock|\s+level|$)/i
  )

  return {
    productName: productMatch ? productMatch[1].trim() : undefined
  }
}

// Parse period from message
function parsePeriod(message: string): string {
  if (/today/i.test(message)) return 'today'
  if (/yesterday/i.test(message)) return 'yesterday'
  if (/this\s+week/i.test(message)) return 'this_week'
  if (/last\s+week/i.test(message)) return 'last_week'
  if (/this\s+month/i.test(message)) return 'this_month'
  if (/last\s+month/i.test(message)) return 'last_month'
  return 'today' // default
}

export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, context = {} } = await request.json()

    if (!message || !organizationId) {
      return NextResponse.json(
        { error: 'Message and organizationId are required' },
        { status: 400 }
      )
    }

    // Initialize salon manager service
    const salonManager = createSalonManagerService(organizationId, context.userId || 'system')

    // Analyze query first for clarity and completeness
    const analysis = analyzeQuery(message)

    console.log('Query analysis:', { message, analysis })

    // If clarification needed, ask questions
    if (analysis.needsClarification && analysis.confidence < 60) {
      return NextResponse.json({
        success: true,
        message: `🤔 **I'd like to help you better. Could you clarify:**\n\n${analysis.clarifyingQuestions?.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n**💡 Examples:**\n• "Book Emma for highlights tomorrow at 2pm"\n• "Check blonde toner stock"\n• "Show today's revenue"\n\n*Just type your request with more details and I'll help you right away!*`,
        confidence: analysis.confidence,
        suggestions: analysis.suggestedActions || [
          'Book appointment for [client] at [time]',
          'Check inventory for [product]',
          'Show [period] revenue'
        ],
        analyticalFramework: {
          stage: 'clarify',
          analysis
        }
      })
    }

    // Detect intent
    const intent = detectIntent(message)

    console.log('Detected intent:', intent)

    if (!intent) {
      return NextResponse.json({
        success: true,
        message: `I can help you with salon operations:

• **Appointments**: "Book Emma for highlights tomorrow at 2pm"
• **Search**: "Show Santhosh appointments" or "Find appointments for Emma"
• **Availability**: "Who's available for a haircut today?"
• **Inventory**: "Check blonde toner stock"
• **Revenue**: "Show today's revenue"
• **Analytics**: "Show insights and recommendations"
• **Commissions**: "Calculate Sarah's commission this week"
• **Birthdays**: "Show birthday clients this month"

What would you like to do?\n\n**🤖 Analytical Assistant Active:**\nI analyze your requests to provide the best help. If something isn't clear, I'll ask for details to serve you better!`,
        confidence: 50,
        analyticalFramework: {
          stage: 'initial',
          tip: 'Be specific for faster results!'
        },
        suggestions: [
          "Check today's appointments",
          'Show AI insights',
          'View available slots',
          'Check inventory levels',
          'Show revenue report',
          'Find client appointments'
        ]
      })
    }

    // Process based on intent
    switch (intent.type) {
      case 'appointment': {
        const details = parseAppointmentDetails(message)

        if (!details.clientName) {
          // Check if we have service and stylist info for a better response
          const hasService = details.serviceName && details.serviceName !== 'appointment'
          const hasStylist = details.stylistName
          const hasTime = details.time

          let clarifyMessage = `❓ **I need the client's name to complete this booking:**\n\n`

          if (hasService || hasStylist || hasTime) {
            clarifyMessage += `**What I have so far:**\n`
            if (hasService) clarifyMessage += `• Service: ${details.serviceName}\n`
            if (hasStylist) clarifyMessage += `• Stylist: ${details.stylistName}\n`
            if (hasTime) clarifyMessage += `• Time: ${details.time}\n`
            clarifyMessage += `\n**Just need the client's name!**\n\nFor example: "Book for Sarah Johnson"\n`
          } else {
            clarifyMessage += `**Example:** "Book Sarah Johnson for ${details.serviceName || 'highlights'} tomorrow at 2pm"\n\n*Please provide the client's name to continue.*`
          }

          return NextResponse.json({
            success: false,
            message: clarifyMessage,
            confidence: 70,
            analyticalFramework: {
              stage: 'clarify',
              missingFields: [
                'clientName',
                !details.serviceName && 'service',
                !details.time && 'time'
              ].filter(Boolean)
            },
            suggestions: [
              'Book [client name] for [service]',
              "Add the time (e.g., 'at 2pm')",
              "Include the date (e.g., 'tomorrow')"
            ]
          })
        }

        // Set default values
        if (!details.serviceName) details.serviceName = 'Consultation'
        if (!details.stylistName) details.stylistName = 'Any available'

        // Calculate date/time
        const appointmentDate = details.date || new Date()
        if (details.time) {
          const [time, meridiem] = details.time.split(/\s+/)
          const [hours, minutes = '0'] = time.split(':')
          let hour = parseInt(hours)

          if (meridiem?.toLowerCase() === 'pm' && hour < 12) hour += 12
          if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0

          appointmentDate.setHours(hour, parseInt(minutes), 0, 0)
        }

        const result = await salonManager.bookAppointment({
          clientName: details.clientName,
          stylistName: details.stylistName,
          serviceName: details.serviceName,
          dateTime: appointmentDate.toISOString()
        })

        return NextResponse.json({
          success: result.success,
          message: result.message || 'Appointment request processed.',
          appointmentId: result.appointmentCode,
          confidence: result.success ? 95 : 60,
          analyticalFramework: {
            stage: result.success ? 'target' : 'investigate',
            result: result.success ? 'completed' : 'failed',
            nextSteps: result.success
              ? ['confirm', 'prepare', 'remind']
              : ['retry', 'check_availability']
          },
          actions: result.success
            ? [
                {
                  label: 'View Details',
                  action: 'view',
                  variant: 'outline' as const,
                  data: { appointmentId: result.appointmentId }
                },
                {
                  label: 'Send Reminder',
                  action: 'remind',
                  variant: 'secondary' as const,
                  data: { appointmentId: result.appointmentId }
                }
              ]
            : undefined
        })
      }

      case 'inventory': {
        const { productName } = parseInventoryQuery(message)
        const result = await salonManager.checkInventory(productName)

        let responseMessage = '📦 **Inventory Status**\n\n'

        if (result.summary.lowStockItems > 0) {
          responseMessage += `⚠️ **${result.summary.lowStockItems} items low on stock**\n\n`
        }

        result.products.forEach(item => {
          const icon = item.isLow ? '🔴' : item.currentStock === 0 ? '❌' : '✅'
          responseMessage += `${icon} **${item.name}**: ${item.currentStock} units`
          if (item.isLow) responseMessage += ` (Min: ${item.minStock})`
          responseMessage += '\n'
        })

        responseMessage += `\n📊 **Summary**:\n`
        responseMessage += `• Total Products: ${result.summary.totalProducts}\n`
        responseMessage += `• Total Value: $${result.summary.totalValue.toFixed(2)}\n`
        responseMessage += `• Out of Stock: ${result.summary.outOfStock}`

        return NextResponse.json({
          success: true,
          message: responseMessage,
          confidence: 100,
          data: result,
          actions: [
            {
              label: 'Order Supplies',
              action: 'order',
              variant: 'default' as const
            },
            {
              label: 'Export Report',
              action: 'export',
              variant: 'outline' as const
            }
          ]
        })
      }

      case 'revenue': {
        const period = parsePeriod(message)
        const result = await salonManager.analyzeRevenue(period)

        const periodDisplay = period.replace('_', ' ')
        let responseMessage = `💰 **Revenue Report (${periodDisplay})**\n\n`
        responseMessage += `**Total Revenue**: $${result.totalRevenue.toFixed(2)}\n`
        responseMessage += `• Services: $${result.serviceRevenue.toFixed(2)}\n`
        responseMessage += `• Products: $${result.productRevenue.toFixed(2)}\n\n`
        responseMessage += `**Transactions**: ${result.transactionCount}\n`
        responseMessage += `**Average Ticket**: $${result.averageTicket.toFixed(2)}\n\n`

        if (result.topServices.length > 0) {
          responseMessage += `**Top Services**:\n`
          result.topServices.forEach((service, idx) => {
            responseMessage += `${idx + 1}. ${service.category}: $${service.revenue.toFixed(2)}\n`
          })
        }

        return NextResponse.json({
          success: true,
          message: responseMessage,
          confidence: 100,
          data: result,
          actions: [
            {
              label: 'View Details',
              action: 'details',
              variant: 'outline' as const
            },
            {
              label: 'Compare Periods',
              action: 'compare',
              variant: 'secondary' as const
            }
          ]
        })
      }

      case 'commission': {
        const period = parsePeriod(message)
        const performances = await salonManager.analyzeStaffPerformance(period)

        const periodDisplay = period.replace('_', ' ')
        let responseMessage = `💸 **Commission Report (${periodDisplay})**\n\n`

        const totalCommission = performances.reduce((sum, p) => sum + p.commission, 0)
        responseMessage += `**Total Commissions**: $${totalCommission.toFixed(2)}\n\n`

        responseMessage += `**Staff Performance**:\n`
        performances.slice(0, 5).forEach((perf, idx) => {
          responseMessage += `\n${idx + 1}. **${perf.stylistName}**\n`
          responseMessage += `   • Revenue: $${perf.revenue.toFixed(2)}\n`
          responseMessage += `   • Commission: $${perf.commission.toFixed(2)}\n`
          responseMessage += `   • Services: ${perf.serviceCount}\n`
        })

        return NextResponse.json({
          success: true,
          message: responseMessage,
          confidence: 100,
          data: performances,
          actions: [
            {
              label: 'Export Payroll',
              action: 'export',
              variant: 'default' as const
            },
            {
              label: 'Email Reports',
              action: 'email',
              variant: 'secondary' as const
            }
          ]
        })
      }

      case 'birthday': {
        const monthMatch = message.match(/(\w+)\s+month|month\s+(\d+)/i)
        let month = new Date().getMonth() + 1

        if (monthMatch) {
          const monthName = monthMatch[1] || monthMatch[2]
          const monthNames = [
            'january',
            'february',
            'march',
            'april',
            'may',
            'june',
            'july',
            'august',
            'september',
            'october',
            'november',
            'december'
          ]
          const monthIndex = monthNames.findIndex(m => m.startsWith(monthName.toLowerCase()))
          if (monthIndex >= 0) month = monthIndex + 1
          else if (!isNaN(parseInt(monthName))) month = parseInt(monthName)
        }

        const result = await salonManager.getClientBirthdays(month)

        let responseMessage = `🎂 **Birthday Clients - ${result.monthName}**\n\n`

        if (result.clients.length === 0) {
          responseMessage += 'No client birthdays this month.'
        } else {
          responseMessage += `Found ${result.totalBirthdays} birthday${result.totalBirthdays > 1 ? 's' : ''}:\n\n`
          result.clients.forEach(client => {
            responseMessage += `• **${client.clientName}** - ${result.monthName} ${client.dayOfMonth}\n`
          })
          responseMessage += '\n💡 *Consider sending birthday promotions!*'
        }

        return NextResponse.json({
          success: true,
          message: responseMessage,
          confidence: 100,
          data: result,
          actions:
            result.clients.length > 0
              ? [
                  {
                    label: 'Send Birthday Offers',
                    action: 'send_offers',
                    variant: 'default' as const
                  },
                  {
                    label: 'Create Campaign',
                    action: 'campaign',
                    variant: 'outline' as const
                  }
                ]
              : undefined
        })
      }

      case 'searchAppointment': {
        // Extract client name from various patterns
        let searchQuery = ''

        // Pattern 1: "show X appointment" or "X's appointment"
        let nameMatch = message.match(/(?:show|find|view)\s+([A-Za-z]+)(?:'s)?\s+appointment/i)
        if (nameMatch) {
          searchQuery = nameMatch[1].trim()
        }

        // Pattern 2: "appointment for X" or "appointments for X"
        if (!searchQuery) {
          nameMatch = message.match(/appointments?\s+(?:for|of)\s+([A-Za-z]+)/i)
          if (nameMatch) {
            searchQuery = nameMatch[1].trim()
          }
        }

        // Pattern 3: "what time is X's appointment" or "when is X appointment"
        if (!searchQuery) {
          nameMatch = message.match(
            /(?:what\s+time\s+is|when\s+is)\s+([A-Za-z]+)(?:'s)?\s+appointment/i
          )
          if (nameMatch) {
            searchQuery = nameMatch[1].trim()
          }
        }

        // Pattern 4: "X appointment" at the beginning
        if (!searchQuery) {
          nameMatch = message.match(/^([A-Za-z]+)\s+appointment/i)
          if (nameMatch) {
            searchQuery = nameMatch[1].trim()
          }
        }

        // If still no match, try to extract any name
        if (!searchQuery) {
          nameMatch = message.match(/\b([A-Z][a-z]+)\b/)
          if (nameMatch) {
            searchQuery = nameMatch[1].trim()
          }
        }

        const result = await salonManager.findAppointments(searchQuery)

        if (!result.success || result.appointments.length === 0) {
          return NextResponse.json({
            success: false,
            message: result.message || `No appointments found for "${searchQuery}"`,
            confidence: 70,
            suggestions: [
              'Try searching with the full client name',
              'Check if the client has any upcoming appointments',
              "Use 'Book appointment for [name]' to create a new one"
            ],
            analyticalFramework: {
              stage: 'investigate',
              attempted: searchQuery,
              recommendation: 'Try full name or check spelling'
            }
          })
        }

        let responseMessage = `📅 **Appointments for ${searchQuery}**\n\n`

        // Group appointments by status
        const todayAppointments = result.appointments.filter((apt: any) => {
          const aptDate = new Date(apt.date)
          const today = new Date()
          return aptDate.toDateString() === today.toDateString() && apt.status !== 'completed'
        })

        const upcomingAppointments = result.appointments.filter((apt: any) => {
          const aptDate = new Date(apt.date)
          const today = new Date()
          return aptDate > today
        })

        const pastAppointments = result.appointments.filter((apt: any) => {
          const aptDate = new Date(apt.date)
          const today = new Date()
          return aptDate < today || apt.status === 'completed'
        })

        // Show today's appointments first
        if (todayAppointments.length > 0) {
          responseMessage += `**📆 TODAY'S APPOINTMENTS:**\n\n`
          todayAppointments.forEach((apt: any) => {
            const date = new Date(apt.date)
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
            responseMessage += `• **${timeStr}** - ${apt.serviceName} with ${apt.stylistName} ($${apt.amount})\n`
          })
          responseMessage += '\n'
        }

        // Show upcoming appointments
        if (upcomingAppointments.length > 0) {
          responseMessage += `**⏰ UPCOMING APPOINTMENTS:**\n\n`
          upcomingAppointments.forEach((apt: any) => {
            const date = new Date(apt.date)
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
            responseMessage += `• **${dateStr} at ${timeStr}** - ${apt.serviceName} with ${apt.stylistName}\n`
          })
          responseMessage += '\n'
        }

        // Show recent past appointments (limit to 3)
        if (pastAppointments.length > 0) {
          responseMessage += `**📜 RECENT HISTORY:**\n\n`
          pastAppointments.slice(0, 3).forEach((apt: any) => {
            const date = new Date(apt.date)
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
            responseMessage += `• ${dateStr} - ${apt.serviceName} (${apt.status})\n`
          })
        }

        return NextResponse.json({
          success: true,
          message: responseMessage,
          confidence: 95,
          data: result,
          actions: [
            {
              label: 'Book New Appointment',
              action: 'book',
              variant: 'default' as const,
              data: { clientName: searchQuery }
            },
            {
              label: 'View Full History',
              action: 'history',
              variant: 'outline' as const
            }
          ]
        })
      }

      case 'analytics': {
        // First investigate what specific insights are needed
        const insightType = /revenue|sales|money/i.test(message)
          ? 'revenue'
          : /busy|peak|pattern/i.test(message)
            ? 'patterns'
            : /recommend|suggest/i.test(message)
              ? 'recommendations'
              : 'all'

        const result = await salonManager.getAIInsights(message)

        if (!result.success) {
          return NextResponse.json({
            success: false,
            message: `🔍 **Investigation needed:**\n\nI couldn't analyze your data. This might be because:\n• No recent transactions found\n• Insufficient data for analysis\n• Connection issue\n\n**Try asking:**\n• "Show today's appointments"\n• "Check inventory levels"\n• "View this week's revenue"`,
            confidence: 0,
            analyticalFramework: {
              stage: 'investigate',
              issue: 'data_analysis_failed',
              suggestions: ['check_data', 'try_specific_query']
            }
          })
        }

        let responseMessage = `🤖 **AI-Powered Salon Insights**\n\n`

        if (result.insights.recommendations.length > 0) {
          responseMessage += `**📊 Recommendations:** (🎯 Based on your data analysis)\n`
          result.insights.recommendations.forEach((rec: any, idx: number) => {
            const actionIcon =
              rec.type === 'inventory'
                ? '📦'
                : rec.type === 'promotion'
                  ? '📣'
                  : rec.type === 'marketing'
                    ? '🎁'
                    : '💡'
            responseMessage += `\n${actionIcon} **${rec.title}**\n`
            responseMessage += `   ${rec.description}\n`
            responseMessage += `   Confidence: ${rec.confidence}%\n`
            responseMessage += `   **Action:** ${rec.type === 'inventory' ? 'Order now' : rec.type === 'promotion' ? 'Create campaign' : 'Implement'}\n`
          })
        }

        if (result.insights.patterns.length > 0) {
          responseMessage += `**🔍 Patterns Detected:**\n`
          result.insights.patterns.forEach((pattern: any) => {
            responseMessage += `• ${pattern.description}\n`
          })
          responseMessage += '\n'
        }

        if (result.insights.predictions.length > 0) {
          responseMessage += `**🔮 Predictions:**\n`
          result.insights.predictions.forEach((pred: any) => {
            responseMessage += `• ${pred.description}\n`
            if (pred.projectedMonthEnd) {
              responseMessage += `  Projected month-end revenue: $${pred.projectedMonthEnd.toFixed(2)}\n`
            }
          })
        }

        return NextResponse.json({
          success: true,
          message:
            responseMessage +
            `\n\n**🔄 Analysis Framework:**\n🤔 Analyzed → 🔍 Investigated patterns → 🎯 Targeted recommendations\n\n*Ask me to dive deeper into any specific area!*`,
          confidence: 85,
          data: result.insights,
          analyticalFramework: {
            stage: 'iterate',
            analyzed: ['booking_patterns', 'inventory_levels', 'revenue_trends', 'client_data'],
            depth: insightType,
            nextQuestions: [
              'Would you like more details on any recommendation?',
              'Should I analyze a specific time period?',
              'Want to see competitor comparisons?'
            ]
          },
          actions: [
            {
              label: 'View Detailed Report',
              action: 'report',
              variant: 'default' as const
            },
            {
              label: 'Export Analytics',
              action: 'export',
              variant: 'outline' as const
            }
          ]
        })
      }

      case 'availability': {
        try {
          // Extract service name if mentioned (e.g., "who's available for a haircut")
          let serviceName: string | undefined
          const servicePatterns = [
            /for\s+(?:a\s+)?([A-Za-z\s]+?)(?:\s+today|\s+tomorrow|$)/i,
            /available.*?([A-Za-z\s]+?)(?:\s+today|\s+tomorrow|$)/i
          ]

          for (const pattern of servicePatterns) {
            const match = message.match(pattern)
            if (match && match[1]) {
              serviceName = match[1].trim()
              // Filter out common words that aren't services
              if (
                ['a', 'an', 'the', 'for', 'today', 'tomorrow'].includes(serviceName.toLowerCase())
              ) {
                serviceName = undefined
              }
              break
            }
          }

          const date = /tomorrow/i.test(message)
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : new Date()

          const result = await salonManager.findAvailableSlots(date, serviceName)

          let responseMessage = `📅 **Available Slots - ${new Date(result.date).toLocaleDateString()}**\n\n`

          if (serviceName) {
            responseMessage = `📅 **Available Slots for ${serviceName} - ${new Date(result.date).toLocaleDateString()}**\n\n`
          }

          if (result.totalAvailable === 0) {
            responseMessage += '❌ No available slots for this date.'
          } else {
            responseMessage += `Found ${result.totalAvailable} available slots:\n\n`
            const slotsToShow = result.availableSlots.slice(0, 10)
            slotsToShow.forEach(slot => {
              responseMessage += `• ${slot.display}\n`
            })

            if (result.availableSlots.length > 10) {
              responseMessage += `\n... and ${result.availableSlots.length - 10} more slots`
            }
          }

          return NextResponse.json({
            success: true,
            message: responseMessage,
            confidence: 100,
            data: result,
            actions: [
              {
                label: 'Book Appointment',
                action: 'book',
                variant: 'default' as const
              },
              {
                label: 'Check Another Date',
                action: 'change_date',
                variant: 'outline' as const
              }
            ]
          })
        } catch (error) {
          console.error('Error finding available slots:', error)
          return NextResponse.json({
            success: false,
            message: `❌ **Error checking availability**\n\nI encountered an issue while checking available slots. Please try again or contact support.\n\n**Error details:** ${error instanceof Error ? error.message : 'Unknown error'}`,
            confidence: 0,
            analyticalFramework: {
              stage: 'error',
              issue: 'availability_check_failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
        }
      }

      default:
        return NextResponse.json({
          success: false,
          message: "I couldn't understand that request. Please try again.",
          confidence: 0
        })
    }
  } catch (error) {
    console.error('Salon Manager API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process salon request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'HERA Salon Manager Chat API',
    version: '1.0.0',
    capabilities: [
      'Appointment booking',
      'Inventory management',
      'Revenue analytics',
      'Staff performance tracking',
      'Client birthday tracking',
      'Schedule management'
    ],
    examples: [
      'Book Emma for highlights tomorrow at 2pm',
      'Check blonde toner stock',
      "Show today's revenue",
      "Calculate Sarah's commission this week",
      'Show birthday clients this month'
    ]
  })
}
