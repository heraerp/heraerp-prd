import { NextRequest, NextResponse } from 'next/server'
import { ConnectorManager } from '@/lib/integration-hub/connector-manager'

// GET /api/integration-hub/connectors/[id]/health
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const health = await ConnectorManager.getConnectorHealth(params.id)

    return NextResponse.json(health)
  } catch (error) {
    console.error('Error fetching connector health:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connector health' },
      { status: 500 }
    )
  }
}