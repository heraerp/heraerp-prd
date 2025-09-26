import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { ConnectorManager } from '@/lib/integration-hub/connector-manager'

// GET /api/integration-hub/connectors/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await universalApi.read({
      table: 'core_entities',
      filters: {
        id: params.id,
        entity_type: 'integration_connector'
      }
    })

    if (!result.data || result.data.length === 0) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 })
    }

    const connector = result.data[0]
    const vendorDetails = ConnectorManager.getVendorConfig(connector.metadata?.vendor)

    return NextResponse.json({
      connector: {
        ...connector,
        vendor_details: vendorDetails
      }
    })
  } catch (error) {
    console.error('Error fetching connector:', error)
    return NextResponse.json({ error: 'Failed to fetch connector' }, { status: 500 })
  }
}

// PATCH /api/integration-hub/connectors/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    await universalApi.updateEntity({
      id: params.id,
      metadata: body
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating connector:', error)
    return NextResponse.json({ error: 'Failed to update connector' }, { status: 500 })
  }
}

// DELETE /api/integration-hub/connectors/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check for dependent sync jobs or mappings
    const [syncJobs, mappings] = await Promise.all([
      universalApi.read({
        table: 'core_entities',
        filters: { entity_type: 'integration_sync_job' }
      }),
      universalApi.read({
        table: 'core_entities',
        filters: { entity_type: 'integration_mapping' }
      })
    ])

    const dependentSyncJobs = syncJobs.data.filter(
      (job: any) => job.metadata?.connector_id === params.id
    )
    const dependentMappings = mappings.data.filter(
      (mapping: any) => mapping.metadata?.connector_id === params.id
    )

    if (dependentSyncJobs.length > 0 || dependentMappings.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete connector with dependent sync jobs or mappings',
          dependencies: {
            syncJobs: dependentSyncJobs.length,
            mappings: dependentMappings.length
          }
        },
        { status: 400 }
      )
    }

    await universalApi.deleteEntity(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting connector:', error)
    return NextResponse.json({ error: 'Failed to delete connector' }, { status: 500 })
  }
}
