import { NextRequest, NextResponse } from 'next/server'
import { createEventbriteAdapter } from '@/lib/integration/vendors/eventbrite'
import { universalApi } from '@/lib/universal-api'

export async function POST(request: NextRequest) {
  try {
    // Get organization ID from header
    const orgId = request.headers.get('X-Organization-Id')
    if (!orgId) {
      return NextResponse.json({ error: 'Missing X-Organization-Id header' }, { status: 400 })
    }

    // Get connector ID from body
    const body = await request.json()
    const { connectorId } = body

    if (!connectorId) {
      return NextResponse.json({ error: 'Missing connectorId in request body' }, { status: 400 })
    }

    // Fetch connector configuration
    universalApi.setOrganizationId(orgId)
    const connectorResult = await universalApi.read({
      table: 'core_entities',
      filters: {
        id: connectorId,
        entity_type: 'integration_connector',
        organization_id: orgId
      }
    })

    if (!connectorResult.success || !connectorResult.data || connectorResult.data.length === 0) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 })
    }

    const connector = connectorResult.data[0]

    // Get connector configuration from dynamic fields
    const fieldsResult = await universalApi.read({
      table: 'core_dynamic_data',
      filters: {
        entity_id: connectorId,
        organization_id: orgId
      }
    })

    const fields = fieldsResult.data || []
    const configField = fields.find(f => f.field_name === 'configuration')

    if (!configField || !configField.field_value_text) {
      return NextResponse.json({ error: 'Connector configuration not found' }, { status: 400 })
    }

    const config = JSON.parse(configField.field_value_text)

    if (!config.apiToken) {
      return NextResponse.json({ error: 'API token not configured' }, { status: 400 })
    }

    // Check if demo organization
    const isDemoOrg = orgId === '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

    if (isDemoOrg) {
      // Demo mode - simulate success
      return NextResponse.json({
        success: true,
        message: 'Connected to Eventbrite (Demo Mode)',
        details: {
          name: 'Demo User',
          email: 'demo@civicflow.gov',
          mode: 'demo'
        }
      })
    }

    // Test the connection
    const adapter = createEventbriteAdapter({
      apiToken: config.apiToken
    })

    const result = await adapter.testConnection()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message
        },
        { status: 401 }
      )
    }

    // Update last test timestamp
    await universalApi.setDynamicField(
      connectorId,
      'last_test_at',
      new Date().toISOString(),
      'text'
    )

    await universalApi.setDynamicField(connectorId, 'last_test_result', 'success', 'text')

    // Emit test transaction
    await universalApi.createTransaction({
      transaction_type: 'integration_test',
      transaction_date: new Date(),
      total_amount: 0,
      organization_id: orgId,
      smart_code: 'HERA.INTEGRATION.CONNECTOR.TEST.V1',
      metadata: {
        connector_id: connectorId,
        vendor: 'eventbrite',
        result: 'success',
        message: result.message
      }
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      details: {
        vendor: 'eventbrite',
        lastTested: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Eventbrite test connection error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Test connection failed'
      },
      { status: 500 }
    )
  }
}
