import { NextRequest, NextResponse } from 'next/server'
import { MCPTools } from '@/lib/mcp/whatsapp-mcp-tools'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { tool, input } = await request.json()
    
    // Get organization ID from header or use default
    const headersList = await headers()
    const organizationId = headersList.get('x-organization-id') || process.env.DEFAULT_ORGANIZATION_ID!
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }
    
    const mcp = new MCPTools(organizationId)
    
    // Route to appropriate tool
    let result
    switch (tool) {
      case 'calendar.find_slots':
        result = await mcp.findSlots(input)
        break
      case 'calendar.book':
        result = await mcp.bookSlot(input)
        break
      case 'wa.send':
        result = await mcp.waSend(input)
        break
      case 'wa.window_state':
        result = await mcp.waWindowState(input)
        break
      case 'hera.txn.write':
        result = await mcp.heraTxnWrite(input)
        break
      case 'hera.entity.upsert':
        result = await mcp.heraEntityUpsert(input)
        break
      case 'consent.get':
        result = await mcp.consentGet(input)
        break
      case 'budget.check':
        result = await mcp.budgetCheck(input)
        break
      case 'pricing.estimate':
        result = await mcp.pricingEstimate(input)
        break
      case 'ics.generate':
        result = await mcp.generateICS(input)
        break
      default:
        return NextResponse.json(
          { success: false, error: `Unknown tool: ${tool}` },
          { status: 400 }
        )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('MCP tool error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    available_tools: [
      'calendar.find_slots',
      'calendar.book',
      'wa.send',
      'wa.window_state',
      'hera.txn.write',
      'hera.entity.upsert',
      'consent.get',
      'budget.check',
      'pricing.estimate',
      'ics.generate'
    ]
  })
}