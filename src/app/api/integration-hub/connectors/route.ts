import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { ConnectorManager } from '@/lib/integration-hub/connector-manager'
import type { IntegrationConnector, IntegrationVendor } from '@/types/integration-hub'

// GET /api/integration-hub/connectors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const result = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'integration_connector',
        organization_id: organizationId
      }
    })

    // Enrich with vendor details
    const connectors = result.data.map((connector: any) => ({
      ...connector,
      vendor_details: ConnectorManager.getVendorConfig(connector.metadata?.vendor)
    }))

    return NextResponse.json({ connectors })
  } catch (error) {
    console.error('Error fetching connectors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connectors' },
      { status: 500 }
    )
  }
}

// POST /api/integration-hub/connectors
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, vendor, name, config } = body

    if (!organizationId || !vendor || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const connector = await ConnectorManager.createConnector(
      organizationId,
      vendor as IntegrationVendor,
      name,
      config || {}
    )

    return NextResponse.json({ connector })
  } catch (error) {
    console.error('Error creating connector:', error)
    return NextResponse.json(
      { error: 'Failed to create connector' },
      { status: 500 }
    )
  }
}