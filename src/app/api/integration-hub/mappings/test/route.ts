import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { MappingEngine } from '@/lib/integration-hub/mapping-engine'

// POST /api/integration-hub/mappings/test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mappingId, sampleData } = body

    if (!mappingId || !sampleData) {
      return NextResponse.json({ error: 'Mapping ID and sample data required' }, { status: 400 })
    }

    // Fetch the mapping
    const mappingResult = await universalApi.read({
      table: 'core_entities',
      filters: {
        id: mappingId,
        entity_type: 'integration_mapping'
      }
    })

    if (!mappingResult.data || mappingResult.data.length === 0) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 })
    }

    const mapping = mappingResult.data[0]
    const fieldMappings = mapping.metadata?.field_mappings || []
    const transformOperations = mapping.metadata?.transform_operations || []
    const validationRules = mapping.metadata?.validation_rules || []

    try {
      // Apply field mappings
      const mappedData = MappingEngine.applyFieldMappings(sampleData, fieldMappings)

      // Apply transforms
      const transformedData = MappingEngine.applyTransformPipeline(mappedData, transformOperations)

      // Validate
      const validationResult = MappingEngine.validateData(transformedData, validationRules)

      return NextResponse.json({
        success: true,
        original: sampleData,
        mapped: mappedData,
        transformed: transformedData,
        validation: validationResult,
        fieldCount: Object.keys(transformedData).length
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Transformation failed',
        original: sampleData
      })
    }
  } catch (error) {
    console.error('Error testing mapping:', error)
    return NextResponse.json({ error: 'Failed to test mapping' }, { status: 500 })
  }
}
