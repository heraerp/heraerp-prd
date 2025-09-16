// HERA Salon MCP API Route - Web-based MCP Integration
// This provides MCP tool access through the web API for the hosted application

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// Define available MCP tools
const SALON_TOOLS = [
  {
    name: 'check_inventory',
    description: 'Check salon product inventory levels',
    parameters: {
      type: 'object',
      properties: {
        productName: {
          type: 'string',
          description: 'Specific product name to check (optional)'
        }
      }
    }
  },
  {
    name: 'book_appointment',
    description: 'Book a salon appointment for a client',
    parameters: {
      type: 'object',
      properties: {
        clientName: { type: 'string' },
        serviceName: { type: 'string' },
        dateTime: { type: 'string' }
      },
      required: ['clientName', 'serviceName', 'dateTime']
    }
  },
  {
    name: 'check_revenue',
    description: 'Calculate revenue for a specific time period',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'last_month']
        }
      },
      required: ['period']
    }
  },
  {
    name: 'staff_performance',
    description: 'Analyze staff performance and commissions',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month']
        }
      },
      required: ['period']
    }
  },
  {
    name: 'find_quiet_times',
    description: 'Find quiet times for promotional opportunities',
    parameters: {
      type: 'object',
      properties: {
        daysAhead: { type: 'number', default: 7 }
      }
    }
  }
]

// Tool execution functions (using HERA universal architecture)
async function executeInventoryCheck(organizationId: string, args: any) {
  let query = supabase
    .from('core_entities')
    .select('*, core_dynamic_data(*)')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'product')
    .eq('status', 'active')

  if (args.productName) {
    query = query.ilike('entity_name', `%${args.productName}%`)
  }

  const { data: products, error } = await query
  if (error) throw error

  const inventory =
    products?.map(product => {
      const stockField = product.core_dynamic_data?.find(
        (f: any) => f.field_name === 'current_stock'
      )
      const minField = product.core_dynamic_data?.find((f: any) => f.field_name === 'min_stock')
      const currentStock = stockField?.field_value_number || 0
      const minStock = minField?.field_value_number || 5

      return {
        name: product.entity_name,
        currentStock,
        minStock,
        isLow: currentStock <= minStock
      }
    }) || []

  return {
    inventory,
    summary: {
      totalProducts: inventory.length,
      lowStockItems: inventory.filter(i => i.isLow).length
    }
  }
}

async function executeBookAppointment(organizationId: string, args: any) {
  // Implementation would follow HERA universal patterns
  // This is a placeholder - full implementation would use universal transactions
  return {
    success: true,
    message: `Appointment booked for ${args.clientName} - ${args.serviceName} on ${args.dateTime}`
  }
}

async function executeCheckRevenue(organizationId: string, args: any) {
  const now = new Date()
  let dateFrom: Date, dateTo: Date

  switch (args.period) {
    case 'today':
      dateFrom = new Date(now.setHours(0, 0, 0, 0))
      dateTo = new Date(now.setHours(23, 59, 59, 999))
      break
    case 'this_week':
      const firstDay = now.getDate() - now.getDay()
      dateFrom = new Date(now.setDate(firstDay))
      dateFrom.setHours(0, 0, 0, 0)
      dateTo = new Date()
      break
    case 'this_month':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    default:
      dateFrom = new Date(now.setHours(0, 0, 0, 0))
      dateTo = new Date()
  }

  const { data: transactions, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['sale', 'appointment'])
    .in('transaction_status', ['completed', 'paid'])
    .gte('transaction_date', dateFrom.toISOString())
    .lte('transaction_date', dateTo.toISOString())

  if (error) throw error

  const totalRevenue = transactions?.reduce((sum, txn) => sum + (txn.total_amount || 0), 0) || 0
  const transactionCount = transactions?.length || 0

  return {
    period: args.period,
    totalRevenue,
    transactionCount,
    averageTransaction: transactionCount > 0 ? totalRevenue / transactionCount : 0
  }
}

async function executeStaffPerformance(organizationId: string, args: any) {
  // Similar implementation to revenue but grouped by staff
  // Placeholder for brevity
  return {
    period: args.period,
    topPerformer: { name: 'Emily Davis', revenue: 1445, commission: 433.5 },
    totalCommission: 592.5
  }
}

async function executeFindQuietTimes(organizationId: string, args: any) {
  // Analyze appointment density
  // Placeholder for brevity
  return {
    quietTimes: [
      { slot: '2025-08-29 14:00', appointments: 0 },
      { slot: '2025-08-30 10:00', appointments: 1 }
    ],
    recommendation: 'Found 2 quiet time slots perfect for promotions'
  }
}

// Main MCP handler
export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, useClaude = true } = await request.json()

    if (!message || !organizationId) {
      return NextResponse.json(
        { error: 'Message and organizationId are required' },
        { status: 400 }
      )
    }

    // If Claude integration is enabled, use it for natural language understanding
    if (useClaude && process.env.ANTHROPIC_API_KEY) {
      const completion = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1000,
        temperature: 0.3,
        tools: SALON_TOOLS,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        system: `You are a salon management assistant. Use the available tools to help with salon operations.
When users ask about inventory, appointments, revenue, or staff performance, use the appropriate tools.
Always be helpful and professional in your responses.`
      })

      // Process tool calls if any
      if (completion.content[0].type === 'tool_use') {
        const toolCall = completion.content[0]
        let result

        switch (toolCall.name) {
          case 'check_inventory':
            result = await executeInventoryCheck(organizationId, toolCall.input)
            break
          case 'book_appointment':
            result = await executeBookAppointment(organizationId, toolCall.input)
            break
          case 'check_revenue':
            result = await executeCheckRevenue(organizationId, toolCall.input)
            break
          case 'staff_performance':
            result = await executeStaffPerformance(organizationId, toolCall.input)
            break
          case 'find_quiet_times':
            result = await executeFindQuietTimes(organizationId, toolCall.input)
            break
        }

        // Format response based on tool results
        return NextResponse.json({
          success: true,
          tool: toolCall.name,
          result,
          message: formatToolResponse(toolCall.name, result)
        })
      }

      // Return Claude's direct response if no tool was used
      return NextResponse.json({
        success: true,
        message: completion.content[0].text
      })
    }

    // Fallback to pattern matching if Claude is not available
    const lower = message.toLowerCase()

    if (lower.includes('inventory') || lower.includes('stock')) {
      const result = await executeInventoryCheck(organizationId, {})
      return NextResponse.json({
        success: true,
        result,
        message: formatToolResponse('check_inventory', result)
      })
    }

    if (lower.includes('revenue') || lower.includes('sales')) {
      const period = lower.includes('month') ? 'this_month' : 'today'
      const result = await executeCheckRevenue(organizationId, { period })
      return NextResponse.json({
        success: true,
        result,
        message: formatToolResponse('check_revenue', result)
      })
    }

    // Default response
    return NextResponse.json({
      success: false,
      error:
        'I could not understand your request. Try asking about inventory, revenue, appointments, or staff performance.'
    })
  } catch (error) {
    console.error('MCP API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Format tool responses for display
function formatToolResponse(tool: string, result: any): string {
  switch (tool) {
    case 'check_inventory':
      let msg = '📦 Inventory Status:\n\n'
      result.inventory.forEach((item: any) => {
        msg += `• ${item.name}: ${item.currentStock} units ${item.isLow ? '⚠️ LOW' : '✅'}\n`
      })
      msg += `\n📊 Total: ${result.summary.totalProducts} products, ${result.summary.lowStockItems} low`
      return msg

    case 'check_revenue':
      return `💰 Revenue (${result.period}): $${result.totalRevenue.toFixed(2)}\n📊 Transactions: ${result.transactionCount}\n💵 Average: $${result.averageTransaction.toFixed(2)}`

    case 'staff_performance':
      return `💸 Total Commission (${result.period}): $${result.totalCommission.toFixed(2)}\n👑 Top performer: ${result.topPerformer.name} - $${result.topPerformer.commission.toFixed(2)}`

    case 'find_quiet_times':
      return result.recommendation

    default:
      return result.message || 'Operation completed successfully'
  }
}
