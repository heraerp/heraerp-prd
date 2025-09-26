import { NextRequest, NextResponse } from 'next/server'
import { ConnectorManager } from '@/lib/integration-hub/connector-manager'

// POST /api/integration-hub/connectors/test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectorId } = body

    if (!connectorId) {
      return NextResponse.json({ error: 'Connector ID required' }, { status: 400 })
    }

    // Test the connection
    const success = await ConnectorManager.testConnection(connectorId)

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Connection test successful',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Connection test failed',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error testing connection:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      },
      { status: 500 }
    )
  }
}