import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  getWhatsAppAnalytics,
  createBookingFlow,
  getCustomerJourneyAnalytics,
  MCP_WHATSAPP_TOOLS
} from '@/lib/mcp/whatsapp-tools'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check authentication
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tool, params } = body

    if (!tool || !MCP_WHATSAPP_TOOLS[tool as keyof typeof MCP_WHATSAPP_TOOLS]) {
      return NextResponse.json(
        {
          error: 'Invalid tool',
          available_tools: Object.keys(MCP_WHATSAPP_TOOLS)
        },
        { status: 400 }
      )
    }

    // Execute the requested tool
    const handler = MCP_WHATSAPP_TOOLS[tool as keyof typeof MCP_WHATSAPP_TOOLS].handler
    const result = await handler(params.organization_id, params)

    return NextResponse.json(result)
  } catch (error) {
    console.error('MCP WhatsApp API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check authentication
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return available tools and their descriptions
    const tools = Object.entries(MCP_WHATSAPP_TOOLS).map(([name, config]) => ({
      name,
      description: config.description
    }))

    return NextResponse.json({
      success: true,
      component: 'HERA.MCP.WHATSAPP.TOOLS.v1',
      tools,
      capabilities: [
        'WhatsApp conversation analytics',
        '60-second booking flow generation',
        'Customer journey tracking',
        'Template performance analysis',
        'Automated lifecycle management'
      ]
    })
  } catch (error) {
    console.error('MCP WhatsApp API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
