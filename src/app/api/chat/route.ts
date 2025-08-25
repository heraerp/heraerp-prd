// ================================================================================
// MCP CHAT API ROUTE
// Proxies requests from the MCP chat interface to the MCP server
// ================================================================================

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, organizationId, context } = body

    // Get MCP server URL from environment
    // In API routes, we can't use NEXT_PUBLIC_ variables, so we need to use a different approach
    const mcpUrl = process.env.MCP_API_URL || process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3001'
    
    // Forward request to MCP server
    const response = await fetch(`${mcpUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        organizationId: organizationId || process.env.DEFAULT_ORGANIZATION_ID,
        context
      })
    })

    if (!response.ok) {
      throw new Error(`MCP server responded with ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      response: data.response || data.message || 'Command processed successfully',
      interpretation: data.interpretation,
      result: data.result,
      metadata: data.metadata
    })

  } catch (error) {
    console.error('MCP chat error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request',
      response: 'Sorry, I encountered an error processing your request. Please try again.'
    }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'HERA MCP Chat API',
    mcpServer: process.env.NEXT_PUBLIC_MCP_API_URL || 'https://alluring-expression-production.up.railway.app'
  })
}