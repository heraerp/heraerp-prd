import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { MappingEngine } from '@/lib/integration-hub/mapping-engine'

// GET /api/integration-hub/mappings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const connectorId = searchParams.get('connectorId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const filters: any = {
      entity_type: 'integration_mapping',
      organization_id: organizationId
    }

    const result = await universalApi.read({
      table: 'core_entities',
      filters
    })

    let mappings = result.data
    if (connectorId) {
      mappings = mappings.filter((m: any) => m.metadata?.connector_id === connectorId)
    }

    return NextResponse.json({ mappings })
  } catch (error) {
    console.error('Error fetching mappings:', error)
    return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 })
  }
}

// POST /api/integration-hub/mappings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      connectorId,
      name,
      resource,
      fieldMappings,
      transformOperations,
      validationRules
    } = body

    if (!organizationId || !connectorId || !name || !resource) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const mapping = await MappingEngine.createMapping(
      organizationId,
      connectorId,
      name,
      resource,
      fieldMappings || [],
      transformOperations,
      validationRules
    )

    return NextResponse.json({ mapping })
  } catch (error) {
    console.error('Error creating mapping:', error)
    return NextResponse.json({ error: 'Failed to create mapping' }, { status: 500 })
  }
}
